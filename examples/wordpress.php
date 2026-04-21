<?php
/**
 * HugoSplash Paywall — WordPress shortcode example
 *
 * Drop this in your theme's functions.php (or a mu-plugin) and use the
 * shortcode [hugosplash_paywall id="YOUR_PAYWALL_ID"] in any post or page.
 *
 * For the full-featured plugin (with Gutenberg block, multi-paywall management,
 * webhook sync), grab the paid plugin from https://hugosplash.com/services or
 * contact hi@businessintuitive.tech.
 */

add_shortcode( 'hugosplash_paywall', function ( $atts ) {
    $atts = shortcode_atts( [
        'id'       => '',
        'theme'    => 'light',
        'redirect' => '',
    ], $atts, 'hugosplash_paywall' );

    if ( empty( $atts['id'] ) ) {
        return '<!-- hugosplash_paywall: missing "id" attribute -->';
    }

    // Enqueue the widget script once per page
    add_action( 'wp_footer', function () {
        static $printed = false;
        if ( $printed ) return;
        $printed = true;
        echo '<script src="https://hugosplash.com/paywall.js" defer></script>';
    }, 99 );

    $id       = esc_attr( $atts['id'] );
    $theme    = esc_attr( $atts['theme'] );
    $redirect = esc_attr( $atts['redirect'] );

    $attrs = sprintf( 'data-paywall-id="%s" data-theme="%s"', $id, $theme );
    if ( $redirect ) {
        $attrs .= sprintf( ' data-redirect="%s"', $redirect );
    }

    return sprintf( '<div %s></div>', $attrs );
} );
