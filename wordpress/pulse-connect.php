<?php
/**
 * Plugin Name: Pulse Connect
 * Description: Bridge between pulsereferrals.com and Hiscornerstone. Provides an HMAC-signed
 *              enrollment endpoint (find-or-create user + LearnDash enroll + one-time magic
 *              login link) and reports LearnDash course completions back to Pulse.
 * Version:     1.3.0
 * Author:      Pulse
 *
 * INSTALL (easy way): WP Admin → Plugins → Add New Plugin → Upload Plugin →
 *   choose pulse-connect.zip → Install Now → Activate. Then go to
 *   Settings → Pulse Connect and paste the shared secret. Done.
 *
 * The secret can alternatively be defined in wp-config.php as
 * PULSE_SHARED_SECRET (a constant overrides the settings field).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'PULSE_CONNECT_VERSION', '1.3.0' );
define( 'PULSE_TOKEN_TTL', 15 * MINUTE_IN_SECONDS );
define( 'PULSE_TS_TOLERANCE', 300 ); // seconds of clock drift allowed on signed requests

/**
 * Shared secret: wp-config constant wins, otherwise the Settings → Pulse Connect field.
 */
function pulse_get_secret() {
	if ( defined( 'PULSE_SHARED_SECRET' ) && PULSE_SHARED_SECRET !== '' ) {
		return PULSE_SHARED_SECRET;
	}
	return (string) get_option( 'pulse_shared_secret', '' );
}

function pulse_get_webhook_url() {
	if ( defined( 'PULSE_WEBHOOK_URL' ) && PULSE_WEBHOOK_URL !== '' ) {
		return PULSE_WEBHOOK_URL;
	}
	$opt = (string) get_option( 'pulse_webhook_url', '' );
	return $opt !== '' ? $opt : 'https://pulsereferrals.com/api/webhooks/course-completed';
}

function pulse_get_api_base() {
	$opt = (string) get_option( 'pulse_api_url', '' );
	return rtrim( $opt !== '' ? $opt : 'https://pulsereferrals.com', '/' );
}

/** Sign an outbound payload to Pulse. Returns array( timestamp, signature ). */
function pulse_sign_payload( $body ) {
	$ts  = (string) time();
	$sig = hash_hmac( 'sha256', $ts . '.' . $body, pulse_get_secret() );
	return array( $ts, $sig );
}

/* -------------------------------------------------------------------------
 * REST routes
 * ---------------------------------------------------------------------- */

add_action( 'rest_api_init', function () {
	register_rest_route( 'pulse/v1', '/enroll', array(
		'methods'             => 'POST',
		'callback'            => 'pulse_handle_enroll',
		'permission_callback' => 'pulse_verify_signature',
	) );

	// Unauthenticated health check so Pulse (or you, in a browser) can verify install.
	register_rest_route( 'pulse/v1', '/ping', array(
		'methods'             => 'GET',
		'callback'            => function () {
			return array(
				'ok'         => true,
				'version'    => PULSE_CONNECT_VERSION,
				'learndash'  => function_exists( 'ld_update_course_access' ),
				'secret_set' => pulse_get_secret() !== '',
			);
		},
		'permission_callback' => '__return_true',
	) );
} );

/**
 * Verify HMAC signature: sha256 over "<timestamp>.<raw body>" with the shared secret.
 * Headers: X-Pulse-Timestamp (unix seconds), X-Pulse-Signature (hex).
 */
function pulse_verify_signature( WP_REST_Request $request ) {
	$secret = pulse_get_secret();
	if ( '' === $secret ) {
		return new WP_Error( 'pulse_no_secret', 'Shared secret not set — see Settings → Pulse Connect.', array( 'status' => 500 ) );
	}
	$ts  = $request->get_header( 'x-pulse-timestamp' );
	$sig = $request->get_header( 'x-pulse-signature' );
	if ( ! $ts || ! $sig ) {
		return false;
	}
	if ( abs( time() - (int) $ts ) > PULSE_TS_TOLERANCE ) {
		return false;
	}
	$expected = hash_hmac( 'sha256', $ts . '.' . $request->get_body(), $secret );
	return hash_equals( $expected, strtolower( trim( $sig ) ) );
}

/* -------------------------------------------------------------------------
 * Enroll endpoint
 * ---------------------------------------------------------------------- */

/**
 * POST /wp-json/pulse/v1/enroll
 * Body (JSON): {
 *   email:                required — professional's email
 *   name:                 optional — full name, used only when creating a new user
 *   product_id:           WooCommerce product ID (resolved to LearnDash course via _related_course)
 *   learndash_course_id:  explicit LearnDash course ID (takes precedence over product_id)
 *   ce_send_id:           Pulse ce_sends UUID — echoed back on the completion webhook
 * }
 * Returns: { success, user_id, existing_user, course_ids, course_url, login_url }
 */
function pulse_handle_enroll( WP_REST_Request $request ) {
	if ( ! function_exists( 'ld_update_course_access' ) ) {
		return new WP_Error( 'pulse_no_learndash', 'LearnDash is not active on this site.', array( 'status' => 500 ) );
	}

	$p     = $request->get_json_params();
	$email = isset( $p['email'] ) ? sanitize_email( $p['email'] ) : '';
	if ( ! is_email( $email ) ) {
		return new WP_Error( 'pulse_bad_email', 'A valid email is required.', array( 'status' => 400 ) );
	}
	$email = strtolower( $email );

	// --- Resolve LearnDash course ID(s) ---
	$course_ids = array();
	if ( ! empty( $p['learndash_course_id'] ) ) {
		$course_ids = array( (int) $p['learndash_course_id'] );
	} elseif ( ! empty( $p['product_id'] ) ) {
		// LearnDash WooCommerce integration stores linked courses in _related_course meta.
		$related = get_post_meta( (int) $p['product_id'], '_related_course', true );
		if ( is_array( $related ) ) {
			$course_ids = array_map( 'intval', $related );
		} elseif ( ! empty( $related ) ) {
			$course_ids = array( (int) $related );
		}
	}
	$course_ids = array_values( array_filter( $course_ids, function ( $cid ) {
		return $cid > 0 && get_post_type( $cid ) === 'sfwd-courses';
	} ) );

	if ( empty( $course_ids ) ) {
		// Pulse treats this as a signal to fall back to the coupon checkout flow.
		return new WP_Error(
			'pulse_no_course',
			'Could not resolve a LearnDash course from the given product_id / learndash_course_id.',
			array( 'status' => 422 )
		);
	}

	// --- Resolve the certificate-grade name ---
	// Prefer explicit first_name/last_name (confirmed by the professional on
	// Pulse's /start page); fall back to splitting the combined name.
	$full_name = isset( $p['name'] ) ? sanitize_text_field( $p['name'] ) : '';
	$first     = isset( $p['first_name'] ) ? sanitize_text_field( $p['first_name'] ) : '';
	$last      = isset( $p['last_name'] ) ? sanitize_text_field( $p['last_name'] ) : '';
	if ( '' === $first && '' !== $full_name ) {
		$parts = preg_split( '/\s+/', trim( $full_name ), 2 );
		$first = $parts[0] ?? '';
		$last  = '' !== $last ? $last : ( $parts[1] ?? '' );
	}
	$display = trim( $first . ' ' . $last );
	if ( '' === $display ) {
		$display = $full_name;
	}

	// --- Find or create the WP user ---
	$user     = get_user_by( 'email', $email );
	$existing = (bool) $user;

	if ( ! $user ) {
		$base = sanitize_user( current( explode( '@', $email ) ), true );
		if ( '' === $base ) {
			$base = 'pulse_user';
		}
		$username = $base;
		$i        = 1;
		while ( username_exists( $username ) ) {
			$username = $base . $i;
			$i++;
		}

		$user_id = wp_insert_user( array(
			'user_login'   => $username,
			'user_email'   => $email,
			'user_pass'    => wp_generate_password( 24 ),
			'first_name'   => $first,
			'last_name'    => $last,
			'display_name' => $display ? $display : $username,
			'role'         => 'subscriber',
		) );
		if ( is_wp_error( $user_id ) ) {
			return new WP_Error( 'pulse_user_create_failed', $user_id->get_error_message(), array( 'status' => 500 ) );
		}
		$user = get_user_by( 'id', $user_id );
	} elseif ( '' !== $first ) {
		// Existing account with no usable name (e.g. created before name
		// confirmation existed, or display name is just the username):
		// backfill so their certificate renders correctly. Never overwrite a
		// name the user already has.
		$cur_first = (string) get_user_meta( $user->ID, 'first_name', true );
		$cur_last  = (string) get_user_meta( $user->ID, 'last_name', true );
		if ( '' === trim( $cur_first . $cur_last ) ) {
			wp_update_user( array(
				'ID'           => $user->ID,
				'first_name'   => $first,
				'last_name'    => $last,
				'display_name' => $display ? $display : $user->display_name,
			) );
		}
	}

	// --- Enroll in course(s) + remember the Pulse send for completion reporting ---
	$ce_send_id = isset( $p['ce_send_id'] ) ? sanitize_text_field( $p['ce_send_id'] ) : '';
	foreach ( $course_ids as $cid ) {
		ld_update_course_access( $user->ID, $cid ); // idempotent — safe on re-clicks
		if ( $ce_send_id ) {
			update_user_meta( $user->ID, 'pulse_ce_send_' . $cid, $ce_send_id );
		}
	}

	// --- One-time magic login link ---
	$token = bin2hex( random_bytes( 32 ) );
	$dest  = get_permalink( $course_ids[0] );
	set_transient(
		'pulse_login_' . hash( 'sha256', $token ),
		array( 'user_id' => $user->ID, 'redirect' => $dest ),
		PULSE_TOKEN_TTL
	);

	return array(
		'success'       => true,
		'user_id'       => $user->ID,
		'existing_user' => $existing,
		'course_ids'    => $course_ids,
		'course_url'    => $dest,
		'login_url'     => add_query_arg( 'pulse_login', $token, home_url( '/' ) ),
	);
}

/* -------------------------------------------------------------------------
 * Magic login handler
 * ---------------------------------------------------------------------- */

add_action( 'init', function () {
	if ( empty( $_GET['pulse_login'] ) ) {
		return;
	}
	nocache_headers();

	$token = sanitize_text_field( wp_unslash( $_GET['pulse_login'] ) );
	$key   = 'pulse_login_' . hash( 'sha256', $token );
	$data  = get_transient( $key );

	if ( ! $data || empty( $data['user_id'] ) ) {
		// Expired or already used — send them to the homepage rather than an error.
		wp_safe_redirect( home_url( '/' ) );
		exit;
	}
	delete_transient( $key ); // single use

	$user = get_user_by( 'id', (int) $data['user_id'] );
	if ( ! $user ) {
		wp_safe_redirect( home_url( '/' ) );
		exit;
	}

	// Defensive: if a different account is logged in on this browser (shared
	// computer at a nurses' station), log it out before logging in the token user.
	if ( is_user_logged_in() && get_current_user_id() !== $user->ID ) {
		wp_logout();
	}
	if ( ! is_user_logged_in() ) {
		wp_set_current_user( $user->ID );
		wp_set_auth_cookie( $user->ID, true );
		do_action( 'wp_login', $user->user_login, $user );
	}

	$redirect = ! empty( $data['redirect'] ) ? $data['redirect'] : home_url( '/' );
	wp_safe_redirect( $redirect );
	exit;
} );

/* -------------------------------------------------------------------------
 * Course completion → Pulse webhook
 * ---------------------------------------------------------------------- */

add_action( 'learndash_course_completed', function ( $data ) {
	$secret = pulse_get_secret();
	$user   = isset( $data['user'] ) ? $data['user'] : null;
	$course = isset( $data['course'] ) ? $data['course'] : null;
	if ( ! $user instanceof WP_User || ! $course instanceof WP_Post ) {
		return;
	}

	$ce_send_id = get_user_meta( $user->ID, 'pulse_ce_send_' . $course->ID, true );

	$certificate = '';
	if ( function_exists( 'learndash_get_course_certificate_link' ) ) {
		$certificate = learndash_get_course_certificate_link( $course->ID, $user->ID );
	}

	// H.I.S. Cornerstone completion email — for regular (non-Pulse-sponsored)
	// learners only. Pulse-sponsored learners get Pulse's congrats email via the
	// webhook below, so this skip prevents double-emailing them.
	if ( ! $ce_send_id && '1' === get_option( 'pulse_hisc_completion_email', '1' ) ) {
		pulse_send_hisc_completion_email( $user, $course, $certificate );
	}

	if ( '' === $secret ) {
		return;
	}

	$body = wp_json_encode( array(
		'event'               => 'course_completed',
		'email'               => $user->user_email,
		'learndash_course_id' => $course->ID,
		'course_title'        => $course->post_title,
		'ce_send_id'          => $ce_send_id ? $ce_send_id : null,
		'certificate_url'     => $certificate ? $certificate : null,
		'completed_at'        => gmdate( 'c' ),
	) );

	$ts  = (string) time();
	$sig = hash_hmac( 'sha256', $ts . '.' . $body, $secret );
	$url = pulse_get_webhook_url();

	wp_remote_post( $url, array(
		'headers'  => array(
			'Content-Type'      => 'application/json',
			'X-Pulse-Timestamp' => $ts,
			'X-Pulse-Signature' => $sig,
		),
		'body'     => $body,
		'timeout'  => 5,
		'blocking' => false, // fire-and-forget; never slow down the learner
	) );
}, 10, 1 );

/* -------------------------------------------------------------------------
 * H.I.S. Cornerstone completion email (non-Pulse learners)
 * ---------------------------------------------------------------------- */

function pulse_send_hisc_completion_email( WP_User $user, WP_Post $course, $certificate_url ) {
	$first = $user->first_name ? $user->first_name : $user->display_name;
	$course_name = $course->post_title;
	$request_url = home_url( '/free-ce/?src=completion' );

	$cert_block = $certificate_url
		? '<p style="margin:0 0 8px;"><a href="' . esc_url( $certificate_url ) . '" style="display:inline-block;background:#4E818B;color:#ffffff;text-decoration:none;padding:13px 30px;border-radius:8px;font-size:15px;font-weight:700;">View Your Certificate</a></p>
		   <p style="margin:0 0 24px;font-size:13px;color:#585858;">Your certificate is also available anytime in your account.</p>'
		: '<p style="margin:0 0 24px;font-size:14px;color:#383B3C;">Your certificate is available in your account.</p>';

	$html = '<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f7f9fa;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;text-align:left;">
<tr><td style="background:#4E818B;padding:18px 28px;">
  <span style="color:#ffffff;font-size:16px;font-weight:700;">H.I.S. Cornerstone Continuing Education</span>
</td></tr>
<tr><td style="padding:28px;">
  <p style="margin:0 0 16px;font-size:15px;color:#383B3C;line-height:1.6;">Hi ' . esc_html( $first ) . ',</p>
  <p style="margin:0 0 20px;font-size:15px;color:#383B3C;line-height:1.6;">
    Congratulations on completing <strong style="color:#4E818B;">' . esc_html( $course_name ) . '</strong>!
    Your dedication to continuing education is what quality care is built on.
  </p>
  ' . $cert_block . '
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#DDE9EE;border-radius:10px;"><tr><td style="padding:20px 22px;">
    <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#383B3C;">Need more CE hours?</p>
    <p style="margin:0 0 14px;font-size:14px;color:#383B3C;line-height:1.6;">
      Local hospice, home health, and rehab organizations sponsor accredited H.I.S. Cornerstone
      courses for healthcare professionals in their communities &mdash; at no cost to you.
      Tell us what you need and a local sponsor can pick it up.
    </p>
    <a href="' . esc_url( $request_url ) . '" style="display:inline-block;background:#4E818B;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:700;">Request a Sponsored Course</a>
  </td></tr></table>
  <p style="margin:24px 0 0;font-size:12px;color:#585858;">
    H.I.S. Cornerstone Continuing Education<br/>
    <em>Quality Education is the Cornerstone for Quality Care</em>
  </p>
</td></tr>
<tr><td style="background:#4E818B;height:6px;font-size:0;line-height:0;">&nbsp;</td></tr>
</table>
</td></tr></table>
</body></html>';

	$headers = array(
		'Content-Type: text/html; charset=UTF-8',
		'From: H.I.S. Cornerstone <' . apply_filters( 'pulse_hisc_from_email', 'no-reply@' . wp_parse_url( home_url(), PHP_URL_HOST ) ) . '>',
	);

	wp_mail(
		$user->user_email,
		sprintf( 'Congratulations — you\'ve completed %s!', $course_name ),
		$html,
		$headers
	);
}

/* -------------------------------------------------------------------------
 * Free CE request form — [pulse_ce_request_form] shortcode + public relay
 * ---------------------------------------------------------------------- */

// Public endpoint the on-page form posts to. WP relays to Pulse server-side
// so the shared secret never reaches the browser.
add_action( 'rest_api_init', function () {
	register_rest_route( 'pulse/v1', '/ce-request', array(
		'methods'             => 'POST',
		'callback'            => 'pulse_handle_public_ce_request',
		'permission_callback' => '__return_true',
	) );
} );

function pulse_handle_public_ce_request( WP_REST_Request $request ) {
	$p = $request->get_json_params();

	// Honeypot — bots fill every field.
	if ( ! empty( $p['website'] ) ) {
		return array( 'success' => true ); // pretend success, drop silently
	}

	// Light rate limit: 5 submissions per IP per hour.
	$ip    = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	$rlkey = 'pulse_cer_' . md5( $ip );
	$count = (int) get_transient( $rlkey );
	if ( $count >= 5 ) {
		return new WP_Error( 'pulse_rate_limited', 'Too many requests — please try again later.', array( 'status' => 429 ) );
	}
	set_transient( $rlkey, $count + 1, HOUR_IN_SECONDS );

	$first_name = isset( $p['first_name'] ) ? sanitize_text_field( $p['first_name'] ) : '';
	$last_name  = isset( $p['last_name'] ) ? sanitize_text_field( $p['last_name'] ) : '';
	$name       = trim( $first_name . ' ' . $last_name );
	if ( '' === $name && isset( $p['name'] ) ) {
		$name = sanitize_text_field( $p['name'] ); // back-compat
	}
	$email      = isset( $p['email'] ) ? sanitize_email( $p['email'] ) : '';
	$discipline = isset( $p['discipline'] ) ? sanitize_text_field( $p['discipline'] ) : '';
	$city       = isset( $p['city'] ) ? sanitize_text_field( $p['city'] ) : '';
	$state      = isset( $p['state'] ) ? strtoupper( sanitize_text_field( $p['state'] ) ) : '';
	$facility   = isset( $p['facility'] ) ? sanitize_text_field( $p['facility'] ) : '';
	$topic      = isset( $p['topic'] ) ? sanitize_text_field( $p['topic'] ) : '';
	$hours      = isset( $p['hours'] ) ? max( 1, min( 30, (int) $p['hours'] ) ) : 1;

	if ( '' === $first_name || '' === $last_name || ! is_email( $email ) || '' === $discipline || '' === $city || strlen( $state ) !== 2 ) {
		return new WP_Error( 'pulse_bad_request', 'Please fill in your first and last name, email, discipline, city, and state.', array( 'status' => 400 ) );
	}
	if ( pulse_get_secret() === '' ) {
		return new WP_Error( 'pulse_not_configured', 'This form is not configured yet.', array( 'status' => 500 ) );
	}

	$body = wp_json_encode( array(
		'name'       => $name,
		'email'      => strtolower( $email ),
		'discipline' => $discipline,
		'city'       => $city,
		'state'      => $state,
		'facility'   => $facility,
		'topic'      => $topic,
		'hours'      => $hours,
		'source'     => 'hiscornerstone',
	) );
	list( $ts, $sig ) = pulse_sign_payload( $body );

	$res = wp_remote_post( pulse_get_api_base() . '/api/hisc/ce-request', array(
		'headers' => array(
			'Content-Type'      => 'application/json',
			'X-Pulse-Timestamp' => $ts,
			'X-Pulse-Signature' => $sig,
		),
		'body'    => $body,
		'timeout' => 12,
	) );

	if ( is_wp_error( $res ) || wp_remote_retrieve_response_code( $res ) >= 400 ) {
		$detail = is_wp_error( $res ) ? $res->get_error_message() : wp_remote_retrieve_body( $res );
		error_log( '[pulse-connect] ce-request relay failed: ' . $detail );
		return new WP_Error( 'pulse_relay_failed', 'Something went wrong submitting your request. Please try again in a moment.', array( 'status' => 502 ) );
	}

	return array( 'success' => true );
}

// [pulse_ce_request_form] — drop into any page/post. Inherits the theme's
// fonts; accents use the H.I.S. Cornerstone palette so it never looks foreign.
add_shortcode( 'pulse_ce_request_form', function () {
	$endpoint = esc_url( rest_url( 'pulse/v1/ce-request' ) );
	$states   = array( 'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC' );
	$disciplines = array( 'Registered Nurse (RN)', 'LVN / LPN', 'Social Worker', 'Case Manager', 'Licensed Professional Counselor', 'Occupational Therapist', 'Physical Therapist', 'Speech-Language Pathologist', 'Other Healthcare Professional' );

	$state_opts = '';
	foreach ( $states as $s ) {
		$state_opts .= '<option value="' . esc_attr( $s ) . '">' . esc_html( $s ) . '</option>';
	}
	$disc_opts = '';
	foreach ( $disciplines as $d ) {
		$disc_opts .= '<option value="' . esc_attr( $d ) . '">' . esc_html( $d ) . '</option>';
	}

	ob_start();
	?>
	<style>
		.pulse-cer{max-width:640px;margin:0 auto;background:#fff;border:1px solid #DDE9EE;border-radius:12px;padding:28px;box-shadow:0 4px 18px rgba(56,59,60,.06);}
		.pulse-cer h3{margin:0 0 6px;color:#4E818B;}
		.pulse-cer .pulse-cer-sub{margin:0 0 20px;color:#383B3C;opacity:.8;font-size:.95em;}
		.pulse-cer label{display:block;font-weight:600;color:#383B3C;font-size:.88em;margin:14px 0 4px;}
		.pulse-cer input,.pulse-cer select{width:100%;box-sizing:border-box;padding:10px 12px;border:1.5px solid #DDE9EE;border-radius:8px;background:#fff;color:#383B3C;font:inherit;}
		.pulse-cer input:focus,.pulse-cer select:focus{outline:none;border-color:#4E818B;}
		.pulse-cer .pulse-cer-row{display:flex;gap:12px;}
		.pulse-cer .pulse-cer-row>div{flex:1;}
		.pulse-cer button{margin-top:20px;width:100%;padding:13px 20px;background:#4E818B;color:#fff;border:none;border-radius:8px;font:inherit;font-weight:700;cursor:pointer;}
		.pulse-cer button:hover{background:#3f6a73;}
		.pulse-cer button:disabled{opacity:.6;cursor:wait;}
		.pulse-cer .pulse-cer-err{color:#b3423f;font-size:.9em;margin-top:10px;display:none;}
		.pulse-cer .pulse-cer-fine{font-size:.78em;color:#383B3C;opacity:.65;margin-top:12px;line-height:1.5;}
		.pulse-cer-done{max-width:640px;margin:0 auto;background:#DDE9EE;border-radius:12px;padding:28px;text-align:center;color:#383B3C;display:none;}
		.pulse-cer-done h3{color:#4E818B;margin:0 0 8px;}
		.pulse-cer .pulse-hp{position:absolute;left:-9999px;opacity:0;height:0;overflow:hidden;}
	</style>
	<form class="pulse-cer" id="pulse-cer-form">
		<h3>Request a Sponsored CE Course</h3>
		<p class="pulse-cer-sub">Tell us what you need — local healthcare partners sponsor accredited CE courses for professionals in their area at no cost to you.</p>
		<div class="pulse-cer-row">
			<div><label for="pcer-first">First name *</label><input id="pcer-first" name="first_name" type="text" required autocomplete="given-name" /></div>
			<div><label for="pcer-last">Last name *</label><input id="pcer-last" name="last_name" type="text" required autocomplete="family-name" /></div>
		</div>
		<label for="pcer-email">Email *</label>
		<input id="pcer-email" name="email" type="email" required autocomplete="email" />
		<label for="pcer-disc">Discipline *</label>
		<select id="pcer-disc" name="discipline" required><option value="">Select your discipline…</option><?php echo $disc_opts; // phpcs:ignore ?></select>
		<div class="pulse-cer-row">
			<div><label for="pcer-city">City *</label><input id="pcer-city" name="city" type="text" required autocomplete="address-level2" /></div>
			<div><label for="pcer-state">State *</label><select id="pcer-state" name="state" required><option value="">State…</option><?php echo $state_opts; // phpcs:ignore ?></select></div>
		</div>
		<label for="pcer-fac">Facility / employer <span style="font-weight:400;opacity:.6;">(optional)</span></label>
		<input id="pcer-fac" name="facility" type="text" autocomplete="organization" />
		<div class="pulse-cer-row">
			<div><label for="pcer-topic">Course topic <span style="font-weight:400;opacity:.6;">(optional)</span></label><input id="pcer-topic" name="topic" type="text" placeholder="e.g. Ethics, Dementia care — or leave blank" /></div>
			<div><label for="pcer-hours">CE hours needed *</label><select id="pcer-hours" name="hours"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="5">5</option><option value="10">10+</option></select></div>
		</div>
		<div class="pulse-hp" aria-hidden="true"><label>Website<input name="website" type="text" tabindex="-1" autocomplete="off" /></label></div>
		<button type="submit" id="pcer-btn">Request My Free CE Course</button>
		<p class="pulse-cer-err" id="pcer-err"></p>
		<p class="pulse-cer-fine">Sponsored courses are fulfilled by local healthcare partners through our partner platform, Pulse. By submitting, you agree to be contacted by email about your request. No cost, no credit card — ever.</p>
	</form>
	<div class="pulse-cer-done" id="pulse-cer-done">
		<h3>Request received!</h3>
		<p>We're matching your request with a sponsor in your area. You'll get an email confirmation now, and your course by email once a sponsor picks it up — usually within a few days.</p>
	</div>
	<script>
	(function(){
		var form=document.getElementById('pulse-cer-form');
		if(!form)return;
		form.addEventListener('submit',function(e){
			e.preventDefault();
			var btn=document.getElementById('pcer-btn'),err=document.getElementById('pcer-err');
			err.style.display='none';btn.disabled=true;btn.textContent='Submitting…';
			var data={};new FormData(form).forEach(function(v,k){data[k]=v;});
			fetch('<?php echo $endpoint; // phpcs:ignore ?>',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
			.then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j};});})
			.then(function(res){
				if(res.ok&&res.j&&res.j.success){form.style.display='none';document.getElementById('pulse-cer-done').style.display='block';}
				else{throw new Error((res.j&&res.j.message)||'Something went wrong.');}
			})
			.catch(function(ex){err.textContent=ex.message||'Something went wrong. Please try again.';err.style.display='block';btn.disabled=false;btn.textContent='Request My Free CE Course';});
		});
	})();
	</script>
	<?php
	return ob_get_clean();
} );

/* -------------------------------------------------------------------------
 * Settings page (Settings → Pulse Connect)
 * ---------------------------------------------------------------------- */

add_action( 'admin_menu', function () {
	add_options_page( 'Pulse Connect', 'Pulse Connect', 'manage_options', 'pulse-connect', 'pulse_render_settings_page' );
} );

add_action( 'admin_init', function () {
	register_setting( 'pulse_connect', 'pulse_shared_secret', array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'pulse_connect', 'pulse_webhook_url', array( 'sanitize_callback' => 'esc_url_raw' ) );
	register_setting( 'pulse_connect', 'pulse_api_url', array( 'sanitize_callback' => 'esc_url_raw' ) );
	register_setting( 'pulse_connect', 'pulse_hisc_completion_email', array( 'sanitize_callback' => 'sanitize_text_field' ) );
} );

function pulse_render_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$secret_from_config = defined( 'PULSE_SHARED_SECRET' ) && PULSE_SHARED_SECRET !== '';
	$learndash_ok       = function_exists( 'ld_update_course_access' );
	$secret_ok          = pulse_get_secret() !== '';
	?>
	<div class="wrap">
		<h1>Pulse Connect</h1>
		<p>Bridge between <strong>pulsereferrals.com</strong> and this site: direct course
			enrollment, one-time login links, and completion reporting.</p>

		<h2>Status</h2>
		<table class="widefat" style="max-width:560px;">
			<tbody>
				<tr>
					<td>Plugin version</td>
					<td><?php echo esc_html( PULSE_CONNECT_VERSION ); ?></td>
				</tr>
				<tr>
					<td>LearnDash detected</td>
					<td><?php echo $learndash_ok ? '✅ Yes' : '❌ No — enrollment will not work'; ?></td>
				</tr>
				<tr>
					<td>Shared secret</td>
					<td><?php echo $secret_ok ? '✅ Set' : '❌ Not set — paste it below'; ?></td>
				</tr>
				<tr>
					<td>Health check</td>
					<td><a href="<?php echo esc_url( rest_url( 'pulse/v1/ping' ) ); ?>" target="_blank" rel="noopener">Open ping endpoint ↗</a></td>
				</tr>
			</tbody>
		</table>

		<form method="post" action="options.php" style="margin-top:24px;">
			<?php settings_fields( 'pulse_connect' ); ?>
			<table class="form-table" style="max-width:720px;">
				<tr>
					<th scope="row"><label for="pulse_shared_secret">Shared secret</label></th>
					<td>
						<?php if ( $secret_from_config ) : ?>
							<p><em>Defined in wp-config.php — the field below is ignored while that constant exists.</em></p>
						<?php endif; ?>
						<input type="text" id="pulse_shared_secret" name="pulse_shared_secret"
							value="<?php echo esc_attr( get_option( 'pulse_shared_secret', '' ) ); ?>"
							class="regular-text code" autocomplete="off"
							<?php disabled( $secret_from_config ); ?> />
						<p class="description">Must exactly match <code>PULSE_WP_SHARED_SECRET</code> in Pulse's Vercel environment variables.</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="pulse_webhook_url">Completion webhook URL</label></th>
					<td>
						<input type="url" id="pulse_webhook_url" name="pulse_webhook_url"
							value="<?php echo esc_attr( get_option( 'pulse_webhook_url', '' ) ); ?>"
							class="regular-text code"
							placeholder="https://pulsereferrals.com/api/webhooks/course-completed" />
						<p class="description">Leave blank for the default (recommended).</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="pulse_api_url">Pulse app URL</label></th>
					<td>
						<input type="url" id="pulse_api_url" name="pulse_api_url"
							value="<?php echo esc_attr( get_option( 'pulse_api_url', '' ) ); ?>"
							class="regular-text code"
							placeholder="https://pulsereferrals.com" />
						<p class="description">Used by the CE request form shortcode. Leave blank for the default (recommended).</p>
					</td>
				</tr>
				<tr>
					<th scope="row">Completion email</th>
					<td>
						<label>
							<input type="checkbox" name="pulse_hisc_completion_email" value="1"
								<?php checked( '1', get_option( 'pulse_hisc_completion_email', '1' ) ); ?> />
							Send the H.I.S. Cornerstone congratulations email when a learner completes a course
						</label>
						<p class="description">Includes their certificate link and the sponsored-course request link.
							Pulse-sponsored learners are excluded automatically (they receive Pulse&#39;s email instead).</p>
					</td>
				</tr>
			</table>
			<p class="description" style="margin-top:8px;">Shortcode for the request form: <code>[pulse_ce_request_form]</code> — add it to any page.</p>
			<?php submit_button( 'Save Settings' ); ?>
		</form>
	</div>
	<?php
}
