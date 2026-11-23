<?php
/**
 * HISC – ASWB compliance: feeds + pilot tester sign-up   v3.0, 2026-11-22
 *
 * REPLACES the "HISC – ASWB compliance feeds" snippet (hisc-aswb-feeds.php, v2 or v2.1).
 * Open that snippet, delete its code, paste everything BELOW the first "<?php" line, save.
 * Scope: Run everywhere. Keep it active.
 *
 * What it does
 *  1. Pilot tester sign-up. The form "Pilot Tester Sign-up" (import hisc-pilot-signup-form.json first)
 *     is placed on /pilot-signup/. When someone signs up, the site:
 *       - finds their account by email, or creates one;
 *       - adds the course to that account (no adding by hand);
 *       - emails the course link, the deadline (10 days) and the feedback-form link.
 *  2. Reminders. Once a day: day 4 and day 8 to people whose feedback form is not in, and a
 *     "one last step" note to people who finished the course but have not sent the form.
 *  3. Feedback form ("Course Pilot Test"). The link in those emails pre-selects the course,
 *     so testers no longer pick "Other".
 *  4. Tools > ASWB pilot testing (wp-admin): tick which courses are open, set the spots,
 *     and see who signed up, started, finished and sent the form.
 *  5. Three read-only addresses for the scheduled "HISC ASWB Compliance" agent:
 *       /wp-json/hisc/v1/pilot-tests?key=…     feedback forms (+ the site's own record of the times)
 *       /wp-json/hisc/v1/pilot-signups?key=…   sign-ups and where each one stands
 *       /wp-json/hisc/v1/swc-reviews?key=…     social work consultant reviews
 *
 * What the feeds leave out
 *  Tester names (initials only), email, phone, address, license numbers. SWC reviews keep the
 *  reviewer's name (it is the record) but not her email or license number.
 *  Gravity Forms keeps the full entries and remains the seven-year record.
 *
 * To switch it off: deactivate the snippet. Nothing is deleted.
 */

if ( ! defined( 'HISC_ASWB_FEED_KEY' ) ) {
	define( 'HISC_ASWB_FEED_KEY', '3ee1aee1a6a5cbf44fb3f294dda7378a7a38f0ca' );
}
if ( ! defined( 'HISC_PILOT_DAYS' ) ) {
	define( 'HISC_PILOT_DAYS', 10 );            // days a tester has to finish
}
if ( ! defined( 'HISC_PILOT_SPOTS' ) ) {
	define( 'HISC_PILOT_SPOTS', 8 );            // default spots per open course
}
if ( ! defined( 'HISC_PILOT_REPLY_TO' ) ) {
	define( 'HISC_PILOT_REPLY_TO', 'hello@hiscornerstone.com' );
}
if ( ! defined( 'HISC_PILOT_FORM_PATH' ) ) {
	define( 'HISC_PILOT_FORM_PATH', '/pilot-test/' );   // page that holds the "Course Pilot Test" form
}
if ( ! defined( 'HISC_PILOT_SIGNED' ) ) {
	define( 'HISC_PILOT_SIGNED', "H.I.S. Cornerstone Continuing Education\nhiscornerstone.com" );
}

/* =====================================================================
 * Finding the three forms (by title, so no form ID is hard-coded)
 * ===================================================================== */

function hisc_pt_form_id( $which, $force = false ) {
	$ids = get_option( 'hisc_pt_form_ids', array() );
	if ( ! is_array( $ids ) ) {
		$ids = array();
	}
	if ( ! $force && ! empty( $ids[ $which ] ) ) {
		return (int) $ids[ $which ];
	}
	// Looking forms up is only done on admin screens, feeds and the daily job — never on a public page load.
	$may_look = $force || is_admin() || wp_doing_cron() || ( defined( 'REST_REQUEST' ) && REST_REQUEST );
	if ( ! $may_look || ! class_exists( 'GFFormsModel' ) ) {
		return 0;
	}
	global $wpdb;
	$table = GFFormsModel::get_form_table_name();
	$rows  = $wpdb->get_results( "SELECT id, title FROM {$table} WHERE is_active = 1 AND is_trash = 0 ORDER BY id ASC" );
	$found = array( 'pilot' => 0, 'signup' => 0, 'swc' => 0 );
	foreach ( (array) $rows as $r ) {
		$t = strtolower( (string) $r->title );
		if ( false !== strpos( $t, 'pilot' ) ) {
			$k = preg_match( '/sign[\s-]?up/', $t ) ? 'signup' : 'pilot';
			if ( ! $found[ $k ] ) {
				$found[ $k ] = (int) $r->id;
			}
		} elseif ( false !== strpos( $t, 'swc' ) && ! $found['swc'] ) {
			$found['swc'] = (int) $r->id;
		}
	}
	update_option( 'hisc_pt_form_ids', $found, false );
	return (int) $found[ $which ];
}

/** Field IDs of the sign-up form, by admin label. */
function hisc_pt_signup_fields( $form ) {
	$map = array();
	foreach ( (array) rgar( $form, 'fields' ) as $field ) {
		$label = trim( (string) ( $field->adminLabel ? $field->adminLabel : $field->label ) );
		$map[ $label ] = (string) $field->id;
	}
	foreach ( array( 'First name', 'Last name', 'Email', 'License type', 'License state', 'Course' ) as $need ) {
		if ( ! isset( $map[ $need ] ) ) {
			$map[ $need ] = '0';
		}
	}
	return $map;
}

function hisc_pt_title( $course_id ) {
	return trim( wp_strip_all_tags( html_entity_decode( (string) get_the_title( $course_id ), ENT_QUOTES, 'UTF-8' ) ) );
}

function hisc_pt_initials( $text ) {
	$out = '';
	foreach ( preg_split( '/\s+/', trim( (string) $text ) ) as $part ) {
		if ( '' !== $part ) {
			$out .= strtoupper( mb_substr( $part, 0, 1 ) );
		}
	}
	return $out;
}

/* =====================================================================
 * Sign-ups: reading them and working out where each one stands
 * ===================================================================== */

/** All sign-ups of the last $days days, oldest first. */
function hisc_pt_signups( $days = 120, $with_status = true ) {
	$form_id = hisc_pt_form_id( 'signup' );
	if ( ! $form_id || ! class_exists( 'GFAPI' ) ) {
		return array();
	}
	$form = GFAPI::get_form( $form_id );
	if ( ! $form ) {
		return array();
	}
	$f       = hisc_pt_signup_fields( $form );
	$entries = GFAPI::get_entries(
		$form_id,
		array( 'status' => 'active', 'start_date' => gmdate( 'Y-m-d', time() - $days * DAY_IN_SECONDS ) ),
		array( 'key' => 'date_created', 'direction' => 'ASC' ),
		array( 'offset' => 0, 'page_size' => 500 )
	);
	if ( is_wp_error( $entries ) ) {
		return array();
	}
	$rows = array();
	foreach ( $entries as $e ) {
		$created = strtotime( $e['date_created'] . ' UTC' );
		$r       = array(
			'id'          => (int) $e['id'],
			'created_ts'  => $created,
			'days'        => (int) floor( ( time() - $created ) / DAY_IN_SECONDS ),
			'first'       => trim( (string) rgar( $e, $f['First name'] ) ),
			'last'        => trim( (string) rgar( $e, $f['Last name'] ) ),
			'email'       => trim( (string) rgar( $e, $f['Email'] ) ),
			'license'     => trim( (string) rgar( $e, $f['License type'] ) ),
			'state'       => trim( (string) rgar( $e, $f['License state'] ) ),
			'course_id'   => absint( rgar( $e, $f['Course'] ) ),
			'pilot_entry' => (int) gform_get_meta( $e['id'], 'hisc_pilot_entry' ),
		);
		if ( $with_status ) {
			$r['user_id']   = (int) gform_get_meta( $e['id'], 'hisc_user_id' );
			$r['deadline']  = (string) gform_get_meta( $e['id'], 'hisc_deadline' );
			$r['reminders'] = array_filter( explode( ',', (string) gform_get_meta( $e['id'], 'hisc_reminders' ) ) );
			$r['welcome']   = (string) gform_get_meta( $e['id'], 'hisc_welcome_sent' );
			$r['error']     = (string) gform_get_meta( $e['id'], 'hisc_error' );
			$r['status']    = hisc_pt_status( $r );
		}
		$rows[] = $r;
	}
	return $rows;
}

function hisc_pt_course_start_ts( $user_id, $course_id ) {
	if ( ! function_exists( 'learndash_get_user_activity' ) ) {
		return 0;
	}
	$a = learndash_get_user_activity( array(
		'user_id'       => $user_id,
		'course_id'     => $course_id,
		'post_id'       => $course_id,
		'activity_type' => 'course',
	) );
	return ( $a && ! empty( $a->activity_started ) ) ? (int) $a->activity_started : 0;
}

function hisc_pt_course_started( $user_id, $course_id, $since_ts ) {
	$progress = get_user_meta( $user_id, '_sfwd-course_progress', true );
	if ( is_array( $progress ) && ! empty( $progress[ $course_id ] ) ) {
		$c = $progress[ $course_id ];
		if ( ! empty( $c['completed'] ) || ! empty( $c['lessons'] ) || ! empty( $c['topics'] ) ) {
			return true;
		}
	}
	$started = hisc_pt_course_start_ts( $user_id, $course_id );
	return $started && $started > $since_ts + 60;
}

/** form_in | finished_no_form | started | not_started | expired_started | expired_not_started */
function hisc_pt_status( $r ) {
	if ( $r['pilot_entry'] ) {
		return 'form_in';
	}
	$uid = isset( $r['user_id'] ) ? (int) $r['user_id'] : 0;
	$cid = (int) $r['course_id'];
	if ( $uid && $cid && function_exists( 'learndash_course_completed' ) && learndash_course_completed( $uid, $cid ) ) {
		return 'finished_no_form';
	}
	$late = $r['days'] > HISC_PILOT_DAYS;
	if ( $uid && $cid && hisc_pt_course_started( $uid, $cid, $r['created_ts'] ) ) {
		return $late ? 'expired_started' : 'started';
	}
	return $late ? 'expired_not_started' : 'not_started';
}

/** Open courses: id => title, spots, taken, full. A spot is held for 10 days, or for good once the form is in. */
function hisc_pt_open_courses( $refresh = false ) {
	static $out = null;
	if ( null !== $out && ! $refresh ) {
		return $out;
	}
	$out = array();
	$set = get_option( 'hisc_pilot_courses', array() );
	if ( ! is_array( $set ) || ! $set ) {
		return $out;
	}
	$taken = array();
	foreach ( hisc_pt_signups( 120, false ) as $r ) {
		if ( $r['pilot_entry'] || $r['days'] <= HISC_PILOT_DAYS ) {
			$taken[ $r['course_id'] ] = isset( $taken[ $r['course_id'] ] ) ? $taken[ $r['course_id'] ] + 1 : 1;
		}
	}
	foreach ( $set as $cid => $spots ) {
		$cid = (int) $cid;
		if ( 'publish' !== get_post_status( $cid ) ) {
			continue;
		}
		$n           = isset( $taken[ $cid ] ) ? $taken[ $cid ] : 0;
		$out[ $cid ] = array(
			'title' => hisc_pt_title( $cid ),
			'spots' => (int) $spots,
			'taken' => $n,
			'full'  => $n >= (int) $spots,
		);
	}
	return $out;
}

function hisc_pt_token( $signup_id ) {
	return $signup_id . '-' . substr( hash_hmac( 'sha256', 'pilot-signup|' . $signup_id, wp_salt( 'auth' ) ), 0, 12 );
}

function hisc_pt_form_link( $course_id, $signup_id ) {
	return add_query_arg(
		array( 'course' => (int) $course_id, 'su' => hisc_pt_token( $signup_id ) ),
		home_url( HISC_PILOT_FORM_PATH )
	);
}

/* =====================================================================
 * The two forms on the page: course lists
 * ===================================================================== */

function hisc_pt_prepare_form( $form ) {
	$form_id = (int) rgar( $form, 'id' );
	if ( ! $form_id || empty( $form['fields'] ) ) {
		return $form;
	}
	$want = isset( $_GET['course'] ) ? absint( $_GET['course'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification

	// Sign-up form: list the open courses that still have a spot.
	if ( $form_id === hisc_pt_form_id( 'signup' ) ) {
		$choices = array();
		foreach ( hisc_pt_open_courses() as $cid => $c ) {
			if ( $c['full'] ) {
				continue;
			}
			$choices[] = array(
				'text'       => $c['title'],
				'value'      => $cid . ' | ' . $c['title'],
				'isSelected' => ( $cid === $want ),
				'price'      => '',
			);
		}
		foreach ( $form['fields'] as $field ) {
			if ( 'Course' !== $field->adminLabel ) {
				continue;
			}
			if ( $choices ) {
				$field->choices     = $choices;
				$field->placeholder = 'Choose a course';
			} else {
				$field->choices     = array( array( 'text' => 'All spots are taken right now — please check back soon', 'value' => '', 'isSelected' => true, 'price' => '' ) );
				$field->placeholder = '';
			}
		}
		return $form;
	}

	// Feedback form: a link that names the course shows only that course.
	if ( $want && $form_id === hisc_pt_form_id( 'pilot' ) && 'sfwd-courses' === get_post_type( $want ) ) {
		$title = hisc_pt_title( $want );
		foreach ( $form['fields'] as $field ) {
			if ( 'select' === $field->type && false !== stripos( (string) $field->label, 'course' ) ) {
				$field->choices     = array( array( 'text' => $title, 'value' => $title, 'isSelected' => true, 'price' => '' ) );
				$field->placeholder = '';
				break;
			}
		}
	}
	return $form;
}
add_filter( 'gform_pre_render', 'hisc_pt_prepare_form' );
add_filter( 'gform_pre_validation', 'hisc_pt_prepare_form' );
add_filter( 'gform_pre_submission_filter', 'hisc_pt_prepare_form' );

/** Sign-up checks: course open, spot free, not already signed up, not already completed. */
function hisc_pt_validate_signup( $result ) {
	$form = $result['form'];
	if ( (int) rgar( $form, 'id' ) !== hisc_pt_form_id( 'signup' ) || ! hisc_pt_form_id( 'signup' ) ) {
		return $result;
	}
	$f     = hisc_pt_signup_fields( $form );
	$email = sanitize_email( (string) rgpost( 'input_' . $f['Email'] ) );
	$cid   = absint( rgpost( 'input_' . $f['Course'] ) );
	$open  = hisc_pt_open_courses();
	$error = '';

	if ( ! $cid || empty( $open[ $cid ] ) ) {
		$error = 'Please choose a course. If none is listed, all spots are taken for now.';
	} elseif ( $open[ $cid ]['full'] ) {
		$error = 'The last spot for that course was just taken. Please choose another course.';
	} elseif ( $email ) {
		foreach ( hisc_pt_signups( 120, false ) as $r ) {
			if ( $r['course_id'] === $cid && 0 === strcasecmp( $r['email'], $email ) ) {
				$error = 'This email address is already signed up for that course. Look for our email with your course link (check spam), or reply to it for help.';
				break;
			}
		}
		if ( ! $error ) {
			$user = get_user_by( 'email', $email );
			if ( $user && function_exists( 'learndash_course_completed' ) && learndash_course_completed( $user->ID, $cid ) ) {
				$error = 'Our records show this account has already completed that course, so it cannot be pilot tested again. Please choose another course.';
			}
		}
	}

	if ( $error ) {
		$result['is_valid'] = false;
		foreach ( $form['fields'] as $field ) {
			if ( 'Course' === $field->adminLabel ) {
				$field->failed_validation  = true;
				$field->validation_message = $error;
			}
		}
		$result['form'] = $form;
	}
	return $result;
}
add_filter( 'gform_validation', 'hisc_pt_validate_signup' );

/* =====================================================================
 * After a form is sent
 * ===================================================================== */

function hisc_pt_after_submission( $entry, $form ) {
	if ( 'spam' === rgar( $entry, 'status' ) ) {
		return;
	}
	$form_id = (int) rgar( $form, 'id' );
	if ( $form_id && $form_id === hisc_pt_form_id( 'signup' ) ) {
		hisc_pt_enroll( $entry, $form );
	} elseif ( $form_id && $form_id === hisc_pt_form_id( 'pilot' ) ) {
		hisc_pt_link_feedback( $entry );
	}
}
add_action( 'gform_after_submission', 'hisc_pt_after_submission', 10, 2 );

function hisc_pt_mail( $to, $subject, $body ) {
	return wp_mail( $to, $subject, $body, array( 'Reply-To: ' . HISC_PILOT_REPLY_TO ) );
}

function hisc_pt_problem( $entry_id, $message ) {
	gform_update_meta( $entry_id, 'hisc_error', $message );
	wp_mail(
		get_option( 'admin_email' ),
		'Pilot tester sign-up needs a look (entry ' . $entry_id . ')',
		"A pilot tester signed up but the site could not finish setting them up.\n\nProblem: " . $message .
		"\n\nSee Tools > ASWB pilot testing, or the entry in Forms > Pilot Tester Sign-up. Adding the course to their account by hand fixes it."
	);
}

/** Sign-up: account, course access, welcome email. */
function hisc_pt_enroll( $entry, $form ) {
	$f     = hisc_pt_signup_fields( $form );
	$id    = (int) $entry['id'];
	$email = sanitize_email( (string) rgar( $entry, $f['Email'] ) );
	$first = sanitize_text_field( (string) rgar( $entry, $f['First name'] ) );
	$last  = sanitize_text_field( (string) rgar( $entry, $f['Last name'] ) );
	$cid   = absint( rgar( $entry, $f['Course'] ) );

	if ( ! is_email( $email ) || ! $cid || 'sfwd-courses' !== get_post_type( $cid ) ) {
		hisc_pt_problem( $id, 'The sign-up had no valid email address or course.' );
		return;
	}

	$is_new = false;
	$user   = get_user_by( 'email', $email );
	if ( ! $user ) {
		$base = sanitize_user( current( explode( '@', $email ) ), true );
		if ( '' === $base ) {
			$base = 'tester';
		}
		$login = $base;
		$n     = 1;
		while ( username_exists( $login ) ) {
			$n++;
			$login = $base . $n;
		}
		$uid = wp_insert_user( array(
			'user_login'   => $login,
			'user_email'   => $email,
			'user_pass'    => wp_generate_password( 24, true ),
			'first_name'   => $first,
			'last_name'    => $last,
			'display_name' => trim( $first . ' ' . $last ),
			'role'         => get_role( 'customer' ) ? 'customer' : get_option( 'default_role', 'subscriber' ),
		) );
		if ( is_wp_error( $uid ) ) {
			hisc_pt_problem( $id, 'Could not create an account for the tester: ' . $uid->get_error_message() );
			return;
		}
		$user   = get_userdata( $uid );
		$is_new = true;
	}

	if ( ! function_exists( 'ld_update_course_access' ) ) {
		hisc_pt_problem( $id, 'LearnDash is not active, so the course could not be added to the account.' );
		return;
	}
	ld_update_course_access( $user->ID, $cid );

	$deadline_ts = time() + HISC_PILOT_DAYS * DAY_IN_SECONDS;
	gform_update_meta( $id, 'hisc_user_id', (int) $user->ID );
	gform_update_meta( $id, 'hisc_course_id', $cid );
	gform_update_meta( $id, 'hisc_deadline', wp_date( 'Y-m-d', $deadline_ts ) );

	// How to get in: a set-password link for a new account, a plain reminder for an existing one.
	if ( $is_new ) {
		$link = '';
		$key  = get_password_reset_key( $user );
		if ( ! is_wp_error( $key ) ) {
			if ( function_exists( 'wc_get_endpoint_url' ) && function_exists( 'wc_get_page_permalink' ) ) {
				$link = add_query_arg(
					array( 'key' => $key, 'id' => $user->ID, 'login' => rawurlencode( $user->user_login ) ),
					wc_get_endpoint_url( 'lost-password', '', wc_get_page_permalink( 'myaccount' ) )
				);
			} else {
				$link = network_site_url( 'wp-login.php?action=rp&key=' . $key . '&login=' . rawurlencode( $user->user_login ), 'login' );
			}
		}
		$step1 = "1. Set your password. We made you an account with this email address.\n   " . $link .
			"\n   (That link works for 24 hours. After that, use \"Lost your password?\" on the login page.)";
	} else {
		$step1 = '1. Log in with your existing H.I.S. Cornerstone account (' . $email . "). The course is already in it.\n" .
			'   Forgot the password? Use "Lost your password?" on the login page.';
	}

	$title = hisc_pt_title( $cid );
	$body  = 'Hi ' . ( $first ? $first : 'there' ) . ",\n\n" .
		'Thank you for agreeing to pilot test "' . $title . "\" for H.I.S. Cornerstone. The course is free for you, and the CE certificate is yours when you finish.\n\n" .
		'Please finish by ' . wp_date( 'l, F j', $deadline_ts ) . ".\n\n" .
		$step1 . "\n\n" .
		"2. Write down your exact times. ASWB, which approves our social work courses, asks for the exact minutes you spend (a) reading the course and (b) taking the posttest, each one separately. It is the one thing that cannot be estimated afterward.\n\n" .
		"3. Take the course, including the posttest and the evaluation:\n   " . get_permalink( $cid ) . "\n\n" .
		"4. Right after you finish, send the feedback form (about 5 minutes):\n   " . hisc_pt_form_link( $cid, $id ) . "\n\n" .
		"If you have a question, a concern or a complaint about the course at any point, reply to this email or write to " . HISC_PILOT_REPLY_TO . " and we will answer it.\n\n" .
		"If it turns out you cannot fit it in, just reply and say so. No hard feelings, and it frees the spot for someone else.\n\n" .
		HISC_PILOT_SIGNED . "\n";

	$sent = hisc_pt_mail( $email, 'Your free pilot course is ready: ' . $title, $body );
	gform_update_meta( $id, 'hisc_welcome_sent', $sent ? gmdate( 'Y-m-d H:i' ) : 'FAILED' );
	if ( ! $sent ) {
		hisc_pt_problem( $id, 'The course was added to the account, but the welcome email could not be sent to the tester.' );
	}
}

/** Feedback form sent: tie it to its sign-up, and record which course the link named. */
function hisc_pt_link_feedback( $entry ) {
	$q = array();
	parse_str( (string) wp_parse_url( (string) rgar( $entry, 'source_url' ), PHP_URL_QUERY ), $q );
	$course = isset( $q['course'] ) ? absint( $q['course'] ) : 0;
	if ( $course ) {
		gform_update_meta( $entry['id'], 'hisc_course_id', $course );
	}

	$signup_id = 0;
	$signup_fm = hisc_pt_form_id( 'signup' );

	// 1. The personal link from our emails.
	if ( ! empty( $q['su'] ) && $signup_fm ) {
		$try = absint( $q['su'] );
		if ( $try && hash_equals( hisc_pt_token( $try ), (string) $q['su'] ) ) {
			$s = GFAPI::get_entry( $try );
			if ( ! is_wp_error( $s ) && (int) $s['form_id'] === $signup_fm ) {
				$signup_id = $try;
			}
		}
	}
	// 2. Otherwise the logged-in tester's open sign-up.
	if ( ! $signup_id && ! empty( $entry['created_by'] ) ) {
		$mine = array();
		foreach ( hisc_pt_signups( 120, true ) as $r ) {
			if ( (int) $r['user_id'] === (int) $entry['created_by'] && ! $r['pilot_entry'] ) {
				$mine[] = $r;
			}
		}
		foreach ( $mine as $r ) {
			if ( $course && $r['course_id'] === $course ) {
				$signup_id = $r['id'];
			}
		}
		if ( ! $signup_id && ! $course && 1 === count( $mine ) ) {
			$signup_id = $mine[0]['id'];
		}
	}

	if ( $signup_id ) {
		gform_update_meta( $signup_id, 'hisc_pilot_entry', (int) $entry['id'] );
		gform_update_meta( $entry['id'], 'hisc_signup_entry', $signup_id );
	}
}

/* =====================================================================
 * Daily reminders
 * ===================================================================== */

add_action( 'init', function () {
	if ( ! wp_next_scheduled( 'hisc_pt_daily' ) ) {
		wp_schedule_event( strtotime( 'tomorrow 15:30 UTC' ), 'daily', 'hisc_pt_daily' ); // about 9:30 AM Central
	}
} );
add_action( 'hisc_pt_daily', 'hisc_pt_send_reminders' );

function hisc_pt_send_reminders() {
	$sent_count = 0;
	foreach ( hisc_pt_signups( 30, true ) as $r ) {
		if ( 'form_in' === $r['status'] || $r['error'] || ! is_email( $r['email'] ) || ! $r['course_id'] ) {
			continue;
		}
		$kind = '';
		if ( 'finished_no_form' === $r['status'] ) {
			if ( ! in_array( 'form', $r['reminders'], true ) && $r['days'] <= 21 ) {
				$kind = 'form';
			}
		} elseif ( $r['days'] >= 8 && $r['days'] <= HISC_PILOT_DAYS ) {
			if ( ! in_array( 'd8', $r['reminders'], true ) ) {
				$kind = 'd8';
			}
		} elseif ( $r['days'] >= 4 && $r['days'] < 8 ) {
			if ( ! in_array( 'd4', $r['reminders'], true ) ) {
				$kind = 'd4';
			}
		}
		if ( ! $kind ) {
			continue;
		}

		$title    = hisc_pt_title( $r['course_id'] );
		$hi       = 'Hi ' . ( $r['first'] ? $r['first'] : 'there' ) . ",\n\n";
		$deadline = $r['deadline'] ? wp_date( 'l, F j', strtotime( $r['deadline'] . ' 12:00:00' ) ) : 'the end of this week';
		$course   = get_permalink( $r['course_id'] );
		$form     = hisc_pt_form_link( $r['course_id'], $r['id'] );

		if ( 'form' === $kind ) {
			$subject = 'One last step: the 5-minute feedback form for ' . $title;
			$body    = $hi . 'Thank you for finishing "' . $title . "\". The last step is the short feedback form, which is the part ASWB needs from a pilot test:\n" .
				$form . "\n\nYou will need your reading time and your posttest time, in minutes.\n\n";
		} elseif ( 'd8' === $kind ) {
			$subject = 'Due ' . $deadline . ': your pilot test of ' . $title;
			$body    = $hi . 'The pilot test of "' . $title . '" is due ' . $deadline . ". If you can fit it in, wonderful: the course is free and the CE certificate is yours.\n\n" .
				'Course: ' . $course . "\nFeedback form (5 minutes, right after you finish): " . $form . "\n\n" .
				"If you cannot, just reply and say so, and we will hand the spot to someone else. Either way, thank you.\n\n";
		} else {
			$subject = 'A quick nudge: your pilot test of ' . $title;
			$body    = $hi . 'A quick nudge on the pilot test of "' . $title . '". There is still plenty of time — it is due ' . $deadline . ".\n\n" .
				'Course: ' . $course . "\nFeedback form (5 minutes, right after you finish): " . $form . "\n\n" .
				"Please remember to write down your exact reading time and posttest time. If life has gotten busy, just reply and say so.\n\n";
		}

		if ( hisc_pt_mail( $r['email'], $subject, $body . HISC_PILOT_SIGNED . "\n" ) ) {
			$r['reminders'][] = $kind;
			gform_update_meta( $r['id'], 'hisc_reminders', implode( ',', $r['reminders'] ) );
			$sent_count++;
		}
	}
	return $sent_count;
}

/* =====================================================================
 * Read-only feeds for the scheduled agent
 * ===================================================================== */

add_action( 'rest_api_init', function () {
	$permission = function ( $request ) {
		return hash_equals( HISC_ASWB_FEED_KEY, (string) $request->get_param( 'key' ) );
	};
	$routes = array(
		'/pilot-tests'   => function () {
			return hisc_pt_feed_entries( 'pilot', false );
		},
		'/swc-reviews'   => function () {
			return hisc_pt_feed_entries( 'swc', true );
		},
		'/pilot-signups' => 'hisc_pt_feed_signups',
	);
	foreach ( $routes as $route => $callback ) {
		register_rest_route( 'hisc/v1', $route, array(
			'methods'             => 'GET',
			'permission_callback' => $permission,
			'callback'            => $callback,
		), true ); // true = take over from an older copy of this snippet, if one is still active
	}
}, 20 );

function hisc_pt_respond( $data ) {
	$data     = array_merge( array( 'snippet_version' => '3.0', 'generated_utc' => gmdate( 'c' ) ), $data );
	$response = rest_ensure_response( $data );
	$response->header( 'Cache-Control', 'no-store, max-age=0' );
	return $response;
}

/** Published courses: id => title in plain lower-case letters, for matching a typed course name. */
function hisc_pt_all_courses() {
	static $out = null;
	if ( null !== $out ) {
		return $out;
	}
	$out = array();
	$ids = get_posts( array(
		'post_type'              => 'sfwd-courses',
		'post_status'            => 'publish',
		'numberposts'            => -1,
		'fields'                 => 'ids',
		'orderby'                => 'title',
		'order'                  => 'ASC',
		'update_post_meta_cache' => false,
		'update_post_term_cache' => false,
	) );
	if ( function_exists( '_prime_post_caches' ) ) {
		_prime_post_caches( $ids, false, false );
	}
	foreach ( $ids as $id ) {
		$out[ (int) $id ] = hisc_pt_title( $id );
	}
	return $out;
}

function hisc_pt_plain( $text ) {
	return trim( preg_replace( '/[^a-z0-9]+/', ' ', strtolower( (string) $text ) ) );
}

/** The site's own record of a tester's posttest(s), to set beside the times they reported. */
function hisc_pt_site_record( $user_id, $course_ids, $submitted_ts ) {
	$attempts = get_user_meta( $user_id, '_sfwd-quizzes', true );
	if ( ! is_array( $attempts ) || ! $attempts ) {
		return array();
	}
	$picked = array();
	foreach ( $attempts as $a ) {
		$end = ! empty( $a['completed'] ) ? (float) $a['completed'] : ( ! empty( $a['time'] ) ? (float) $a['time'] : 0 );
		$beg = ! empty( $a['started'] ) ? (float) $a['started'] : 0;
		if ( $end > 100000000000 ) {
			$end /= 1000; // milliseconds
		}
		if ( $beg > 100000000000 ) {
			$beg /= 1000;
		}
		$cid = isset( $a['course'] ) ? (int) $a['course'] : 0;
		if ( ! $end || $end > $submitted_ts + 600 ) {
			continue; // after the form was sent
		}
		if ( $course_ids ) {
			if ( ! in_array( $cid, $course_ids, true ) ) {
				continue;
			}
		} elseif ( $end < $submitted_ts - 2 * DAY_IN_SECONDS ) {
			continue; // course unknown: only posttests in the two days before the form
		}
		$spent = isset( $a['timespent'] ) ? (float) $a['timespent'] : 0;
		if ( ! $spent && $beg && $end > $beg ) {
			$spent = $end - $beg;
		}
		if ( ! $beg && $spent ) {
			$beg = $end - $spent;
		}
		$course_start = $cid ? hisc_pt_course_start_ts( $user_id, $cid ) : 0;
		$row          = array(
			'course_id'        => $cid,
			'course'           => $cid ? hisc_pt_title( $cid ) : '',
			'posttest_ended'   => wp_date( 'Y-m-d H:i', (int) $end ),
			'posttest_minutes' => round( $spent / 60, 1 ),
			'_end'             => $end,
		);
		if ( $course_start && $beg && $beg > $course_start ) {
			$row['course_opened']              = wp_date( 'Y-m-d H:i', $course_start );
			$row['opened_to_posttest_minutes'] = round( ( $beg - $course_start ) / 60 );
		}
		$picked[] = $row;
	}
	usort( $picked, function ( $x, $y ) {
		return $y['_end'] <=> $x['_end'];
	} );
	$picked = array_slice( $picked, 0, $course_ids ? 1 : 6 );
	foreach ( $picked as $i => $p ) {
		unset( $picked[ $i ]['_end'] );
	}
	return $picked;
}

function hisc_pt_feed_entries( $which, $is_review ) {
	if ( ! class_exists( 'GFAPI' ) ) {
		return new WP_Error( 'hisc_no_gf', 'Gravity Forms is not active.', array( 'status' => 500 ) );
	}
	$form_id = hisc_pt_form_id( $which );
	$form    = $form_id ? GFAPI::get_form( $form_id ) : false;
	if ( ! $form || empty( $form['is_active'] ) ) {
		$form_id = hisc_pt_form_id( $which, true ); // look again in case the form was re-imported
		$form    = $form_id ? GFAPI::get_form( $form_id ) : false;
	}
	if ( ! $form ) {
		return new WP_Error( 'hisc_no_form', 'No active form found for "' . $which . '".', array( 'status' => 404 ) );
	}

	$entries = GFAPI::get_entries(
		$form_id,
		array( 'status' => 'active' ),
		array( 'key' => 'date_created', 'direction' => 'ASC' ),
		array( 'offset' => 0, 'page_size' => 500 )
	);
	if ( is_wp_error( $entries ) ) {
		return $entries;
	}

	$skip_types  = array( 'email', 'phone', 'address', 'html', 'section', 'page', 'captcha', 'fileupload', 'signature', 'password' );
	$skip_labels = '/e-?mail|phone|address|licen[sc]e\s*(number|no\b|no\.|#)/i';

	$out = array();
	foreach ( $entries as $entry ) {
		$row = array(
			'entry_id'      => (int) $entry['id'],
			'submitted_utc' => $entry['date_created'],
			'answers'       => array(),
		);
		$course_text = array();

		// Reviews are submitted while logged in: record whose account sent it.
		if ( $is_review && ! empty( $entry['created_by'] ) ) {
			$user = get_userdata( (int) $entry['created_by'] );
			if ( $user ) {
				$row['submitted_by_account'] = $user->user_email;
			}
		}

		foreach ( $form['fields'] as $field ) {
			if ( in_array( $field->type, $skip_types, true ) ) {
				continue;
			}
			$label = trim( (string) ( $field->adminLabel ? $field->adminLabel : $field->label ) );
			if ( '' === $label ) {
				continue;
			}
			$value = trim( wp_strip_all_tags( (string) $field->get_value_export( $entry, '', true ) ) );

			// Pilot testers go out as initials only — whether the form uses a Name
			// field or plain "First name" / "Last name" text boxes.
			if ( ! $is_review && ( 'name' === $field->type || preg_match( '/^\s*(first|last|full)?\s*name\s*$/i', $label ) ) ) {
				$row['tester'] = ( isset( $row['tester'] ) ? $row['tester'] : '' ) . hisc_pt_initials( $value );
				continue;
			}
			if ( preg_match( $skip_labels, $label ) ) {
				continue;
			}
			// Pilot testers: keep the license TYPE, drop the license NUMBER.
			if ( ! $is_review && preg_match( '/licen[sc]e|qualification|credential/i', $label ) ) {
				$value = trim( preg_replace( '/[#\d]+/', '', $value ) );
			}
			if ( '' === $value ) {
				continue;
			}
			if ( ! $is_review && preg_match( '/course|comment/i', $label ) && mb_strlen( $value ) <= 200 ) {
				$course_text[] = $value;
			}
			$max = $is_review ? 3000 : 800;
			if ( mb_strlen( $value ) > $max ) {
				$value = mb_substr( $value, 0, $max ) . '…';
			}
			$row['answers'][] = array( 'q' => $label, 'a' => $value );
		}

		if ( ! $is_review ) {
			$row = array_merge( $row, hisc_pt_feedback_extras( $entry, $course_text ) );
		}
		$out[] = $row;
	}

	return hisc_pt_respond( array(
		'form'    => $form['title'],
		'form_id' => (int) $form['id'],
		'count'   => count( $out ),
		'entries' => $out,
	) );
}

/** For one feedback form: which course, which sign-up, and the site's record of the posttest. */
function hisc_pt_feedback_extras( $entry, $course_text ) {
	$extra  = array();
	$course = (int) gform_get_meta( $entry['id'], 'hisc_course_id' );
	$how    = $course ? 'course link' : '';
	$ids    = $course ? array( $course ) : array();

	if ( ! $course ) {
		// Match what the tester chose or typed against the course titles.
		foreach ( hisc_pt_all_courses() as $cid => $title ) {
			$t = hisc_pt_plain( $title );
			foreach ( $course_text as $text ) {
				$x = hisc_pt_plain( $text );
				if ( strlen( $x ) >= 12 && strlen( $t ) >= 12 && ( false !== strpos( $t, $x ) || false !== strpos( $x, $t ) ) ) {
					$ids[] = (int) $cid;
					break;
				}
			}
		}
		$ids = array_values( array_unique( $ids ) );
		if ( $ids ) {
			$how = 'course title';
		}
	}
	if ( 1 === count( $ids ) ) {
		$extra['course_id']      = $ids[0];
		$extra['course_on_site'] = hisc_pt_title( $ids[0] );
	}

	$signup = (int) gform_get_meta( $entry['id'], 'hisc_signup_entry' );
	$uid    = $signup ? (int) gform_get_meta( $signup, 'hisc_user_id' ) : 0;
	if ( $signup ) {
		$extra['signup_id'] = $signup;
	}
	if ( ! $uid && ! empty( $entry['created_by'] ) ) {
		$uid = (int) $entry['created_by'];
	}
	if ( $uid ) {
		$record = hisc_pt_site_record( $uid, $ids, strtotime( $entry['date_created'] . ' UTC' ) );
		if ( $record ) {
			$extra['site_record'] = array(
				'matched_by' => $how ? $how : 'nearest posttests before this form',
				'posttests'  => $record,
			);
		} else {
			$extra['site_record'] = 'no posttest found on the site for this tester before this form';
		}
	} else {
		$extra['site_record'] = 'tester was not logged in, so the form cannot be tied to an account';
	}
	return $extra;
}

function hisc_pt_feed_signups() {
	if ( ! hisc_pt_form_id( 'signup' ) && ! hisc_pt_form_id( 'signup', true ) ) {
		return new WP_Error( 'hisc_no_form', 'The "Pilot Tester Sign-up" form has not been imported yet.', array( 'status' => 404 ) );
	}
	$rows    = hisc_pt_signups( 120, true );
	$open    = hisc_pt_open_courses();
	$courses = array();
	$blank   = array( 'not_started' => 0, 'started' => 0, 'finished_no_form' => 0, 'form_in' => 0, 'expired_not_started' => 0, 'expired_started' => 0 );
	$page    = (int) get_option( 'hisc_pilot_signup_page_id' );
	$link    = $page ? get_permalink( $page ) : home_url( '/pilot-signup/' );

	foreach ( $open as $cid => $c ) {
		$courses[ $cid ] = array_merge(
			array( 'course_id' => $cid, 'course' => $c['title'], 'open' => true, 'spots' => $c['spots'], 'spots_left' => max( 0, $c['spots'] - $c['taken'] ), 'signup_link' => add_query_arg( 'course', $cid, $link ), 'signed_up' => 0 ),
			$blank
		);
	}
	$list = array();
	foreach ( $rows as $r ) {
		$cid = $r['course_id'];
		if ( ! isset( $courses[ $cid ] ) ) {
			$courses[ $cid ] = array_merge(
				array( 'course_id' => $cid, 'course' => hisc_pt_title( $cid ), 'open' => false, 'spots' => 0, 'spots_left' => 0, 'signup_link' => '', 'signed_up' => 0 ),
				$blank
			);
		}
		$courses[ $cid ]['signed_up']++;
		$courses[ $cid ][ $r['status'] ]++;

		$item = array(
			'signup_id'      => $r['id'],
			'signed_up_utc'  => gmdate( 'Y-m-d H:i', $r['created_ts'] ),
			'tester'         => hisc_pt_initials( $r['first'] . ' ' . $r['last'] ),
			'license_type'   => trim( preg_replace( '/[#\d]+/', '', $r['license'] ) ),
			'state'          => $r['state'],
			'course_id'      => $cid,
			'status'         => $r['status'],
			'deadline'       => $r['deadline'],
			'days_since'     => $r['days'],
			'reminders_sent' => array_values( $r['reminders'] ),
			'welcome_email'  => $r['welcome'] ? $r['welcome'] : 'not sent',
		);
		if ( $r['pilot_entry'] ) {
			$item['pilot_form_entry'] = $r['pilot_entry'];
		}
		if ( $r['error'] ) {
			$item['problem'] = $r['error'];
		}
		$list[] = $item;
	}

	return hisc_pt_respond( array(
		'days_to_finish' => HISC_PILOT_DAYS,
		'signup_page'    => $link,
		'courses'        => array_values( $courses ),
		'count'          => count( $list ),
		'signups'        => $list,
	) );
}

/* =====================================================================
 * Pages: /pilot-signup/ and /swc-review/ (created once, set to noindex)
 * ===================================================================== */

function hisc_pt_ensure_page( $which, $slug, $title, $option ) {
	if ( get_option( $option ) ) {
		return;
	}
	$form_id = hisc_pt_form_id( $which );
	if ( ! $form_id ) {
		return; // Form not imported yet — try again on a later admin page load.
	}
	$existing = get_page_by_path( $slug );
	if ( $existing ) {
		update_option( $option, (int) $existing->ID, false );
		return;
	}
	$page_id = wp_insert_post( array(
		'post_type'      => 'page',
		'post_status'    => 'publish',
		'post_title'     => $title,
		'post_name'      => $slug,
		'post_content'   => '[gravityform id="' . (int) $form_id . '" title="false" description="true" ajax="false"]',
		'comment_status' => 'closed',
		'ping_status'    => 'closed',
	) );
	if ( $page_id && ! is_wp_error( $page_id ) ) {
		update_post_meta( $page_id, 'rank_math_robots', array( 'noindex', 'nofollow' ) );
		update_option( $option, (int) $page_id, false );
	}
}

add_action( 'admin_init', function () {
	if ( ! current_user_can( 'manage_options' ) || wp_doing_ajax() ) {
		return;
	}
	hisc_pt_ensure_page( 'swc', 'swc-review', 'Social Work Consultant Course Review', 'hisc_swc_review_page_id' );
	hisc_pt_ensure_page( 'signup', 'pilot-signup', 'Pilot Test a Course (Free CE)', 'hisc_pilot_signup_page_id' );
} );

add_filter( 'wp_robots', function ( $robots ) {
	if ( is_page( array( 'pilot-signup', 'swc-review' ) ) ) {
		$robots['noindex']  = true;
		$robots['nofollow'] = true;
	}
	return $robots;
} );

/* =====================================================================
 * Tools > ASWB pilot testing
 * ===================================================================== */

add_action( 'admin_menu', function () {
	add_management_page( 'ASWB pilot testing', 'ASWB pilot testing', 'manage_options', 'hisc-pilot', 'hisc_pt_admin_page' );
} );

function hisc_pt_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	if ( isset( $_POST['hisc_pt_save'] ) && check_admin_referer( 'hisc_pt_save' ) ) {
		$save  = array();
		$open  = isset( $_POST['open'] ) ? (array) wp_unslash( $_POST['open'] ) : array();
		$spots = isset( $_POST['spots'] ) ? (array) wp_unslash( $_POST['spots'] ) : array();
		foreach ( $open as $cid => $on ) {
			$cid = absint( $cid );
			if ( $cid && 'sfwd-courses' === get_post_type( $cid ) ) {
				$n            = isset( $spots[ $cid ] ) ? absint( $spots[ $cid ] ) : 0;
				$save[ $cid ] = $n ? $n : HISC_PILOT_SPOTS;
			}
		}
		update_option( 'hisc_pilot_courses', $save, false );
		echo '<div class="notice notice-success"><p>Saved.</p></div>';
	}

	$forms = array(
		'Pilot Tester Sign-up' => hisc_pt_form_id( 'signup', true ),
		'Course Pilot Test (feedback form)' => hisc_pt_form_id( 'pilot' ),
		'SWC Course Review' => hisc_pt_form_id( 'swc' ),
	);
	$set   = get_option( 'hisc_pilot_courses', array() );
	$set   = is_array( $set ) ? $set : array();
	$open  = hisc_pt_open_courses( true );
	$rows  = hisc_pt_signups( 120, true );
	$page  = (int) get_option( 'hisc_pilot_signup_page_id' );
	$link  = $page ? get_permalink( $page ) : '';
	$names = array(
		'not_started'         => 'Signed up, not started',
		'started'             => 'Started',
		'finished_no_form'    => 'Finished, form not sent',
		'form_in'             => 'Form in',
		'expired_not_started' => 'Ran out of time (never started)',
		'expired_started'     => 'Ran out of time (started)',
	);

	echo '<div class="wrap"><h1>ASWB pilot testing</h1>';

	if ( ! $forms['Pilot Tester Sign-up'] ) {
		echo '<div class="notice notice-warning"><p><strong>The sign-up form is not here yet.</strong> Import <code>hisc-pilot-signup-form.json</code> under Forms &rarr; Import/Export, then reload this page.</p></div>';
	} elseif ( $link ) {
		echo '<p>Sign-up page to share: <a href="' . esc_url( $link ) . '" target="_blank"><strong>' . esc_html( $link ) . '</strong></a></p>';
	} else {
		echo '<p>The sign-up page is being created — reload this page once.</p>';
	}
	echo '<p style="color:#666">Forms found: ';
	$bits = array();
	foreach ( $forms as $name => $id ) {
		$bits[] = esc_html( $name ) . ' ' . ( $id ? '#' . (int) $id : '<strong>not found</strong>' );
	}
	echo implode( ' &middot; ', $bits ) . '</p>'; // phpcs:ignore WordPress.Security.EscapeOutput

	// Where each course stands.
	$tally = array();
	foreach ( $rows as $r ) {
		if ( ! isset( $tally[ $r['course_id'] ] ) ) {
			$tally[ $r['course_id'] ] = array_fill_keys( array_keys( $names ), 0 );
		}
		$tally[ $r['course_id'] ][ $r['status'] ]++;
	}
	foreach ( array_keys( $open ) as $cid ) {
		if ( ! isset( $tally[ $cid ] ) ) {
			$tally[ $cid ] = array_fill_keys( array_keys( $names ), 0 );
		}
	}
	if ( $tally ) {
		echo '<h2>Where each course stands</h2><table class="widefat striped" style="max-width:1100px"><thead><tr><th>Course</th><th>Open</th><th>Spots left</th>';
		foreach ( $names as $n ) {
			echo '<th>' . esc_html( $n ) . '</th>';
		}
		echo '</tr></thead><tbody>';
		foreach ( $tally as $cid => $t ) {
			$is_open = isset( $open[ $cid ] );
			echo '<tr><td>' . esc_html( hisc_pt_title( $cid ) );
			if ( $is_open && $link ) {
				echo '<br><small>' . esc_html( add_query_arg( 'course', $cid, $link ) ) . '</small>';
			}
			echo '</td><td>' . ( $is_open ? 'Yes' : 'No' ) . '</td><td>' . ( $is_open ? (int) max( 0, $open[ $cid ]['spots'] - $open[ $cid ]['taken'] ) . ' of ' . (int) $open[ $cid ]['spots'] : '—' ) . '</td>';
			foreach ( array_keys( $names ) as $k ) {
				echo '<td>' . (int) $t[ $k ] . '</td>';
			}
			echo '</tr>';
		}
		echo '</tbody></table>';
	}

	// Sign-ups.
	if ( $rows ) {
		echo '<h2>Sign-ups (last 120 days)</h2><table class="widefat striped" style="max-width:1100px"><thead><tr><th>Signed up</th><th>Tester</th><th>License</th><th>Course</th><th>Status</th><th>Due</th><th>Reminders</th></tr></thead><tbody>';
		foreach ( array_reverse( $rows ) as $r ) {
			echo '<tr><td>' . esc_html( wp_date( 'M j', $r['created_ts'] ) ) . '</td><td>' . esc_html( trim( $r['first'] . ' ' . $r['last'] ) ) . '<br><small>' . esc_html( $r['email'] ) . '</small></td><td>' .
				esc_html( trim( $r['license'] . ', ' . $r['state'], ', ' ) ) . '</td><td>' . esc_html( hisc_pt_title( $r['course_id'] ) ) . '</td><td>' .
				esc_html( $names[ $r['status'] ] ) . ( $r['error'] ? '<br><strong style="color:#b32d2e">' . esc_html( $r['error'] ) . '</strong>' : '' ) . '</td><td>' .
				esc_html( $r['deadline'] ) . '</td><td>' . esc_html( implode( ', ', $r['reminders'] ) ) . '</td></tr>';
		}
		echo '</tbody></table>';
	}

	// Which courses are open.
	echo '<h2>Courses open for pilot testing</h2><p>Tick a course to list it on the sign-up page. A spot is held for ' . (int) HISC_PILOT_DAYS . ' days, then freed if the feedback form has not come in. Untick a course when it has its five pilot tests.</p>';
	echo '<form method="post">';
	wp_nonce_field( 'hisc_pt_save' );
	echo '<div style="max-height:420px;overflow:auto;border:1px solid #c3c4c7;background:#fff;padding:8px 12px;max-width:900px">';
	foreach ( hisc_pt_all_courses() as $cid => $title ) {
		$on = isset( $set[ $cid ] );
		echo '<p style="margin:4px 0"><label><input type="checkbox" name="open[' . (int) $cid . ']" value="1" ' . checked( $on, true, false ) . '> ' . esc_html( $title ) . '</label> &nbsp; spots <input type="number" min="1" max="50" style="width:64px" name="spots[' . (int) $cid . ']" value="' . (int) ( $on ? $set[ $cid ] : HISC_PILOT_SPOTS ) . '"></p>';
	}
	echo '</div><p><button class="button button-primary" name="hisc_pt_save" value="1">Save</button></p></form></div>';
}
