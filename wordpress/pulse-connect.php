<?php
/**
 * Plugin Name: Pulse Connect
 * Description: Bridge between pulsereferrals.com and Hiscornerstone. Provides an HMAC-signed
 *              enrollment endpoint (find-or-create user + LearnDash enroll + one-time magic
 *              login link) and reports LearnDash course completions back to Pulse.
 * Version:     1.1.0
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

define( 'PULSE_CONNECT_VERSION', '1.1.0' );
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

	// --- Find or create the WP user ---
	$user     = get_user_by( 'email', $email );
	$existing = (bool) $user;

	if ( ! $user ) {
		$full_name = isset( $p['name'] ) ? sanitize_text_field( $p['name'] ) : '';
		$parts     = preg_split( '/\s+/', trim( $full_name ), 2 );
		$first     = $parts[0] ?? '';
		$last      = $parts[1] ?? '';

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
			'display_name' => $full_name ? $full_name : $username,
			'role'         => 'subscriber',
		) );
		if ( is_wp_error( $user_id ) ) {
			return new WP_Error( 'pulse_user_create_failed', $user_id->get_error_message(), array( 'status' => 500 ) );
		}
		$user = get_user_by( 'id', $user_id );
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
	if ( '' === $secret ) {
		return;
	}
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
 * Settings page (Settings → Pulse Connect)
 * ---------------------------------------------------------------------- */

add_action( 'admin_menu', function () {
	add_options_page( 'Pulse Connect', 'Pulse Connect', 'manage_options', 'pulse-connect', 'pulse_render_settings_page' );
} );

add_action( 'admin_init', function () {
	register_setting( 'pulse_connect', 'pulse_shared_secret', array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'pulse_connect', 'pulse_webhook_url', array( 'sanitize_callback' => 'esc_url_raw' ) );
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
			</table>
			<?php submit_button( 'Save Settings' ); ?>
		</form>
	</div>
	<?php
}
