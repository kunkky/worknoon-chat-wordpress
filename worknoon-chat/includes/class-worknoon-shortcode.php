<?php

if ( ! defined( 'ABSPATH' ) ) exit;

class Worknoon_Shortcode {

    public static function register() {
        add_shortcode( 'worknoon_chat', [ __CLASS__, 'render' ] );
    }

    public static function render( $atts ) {
        $atts = shortcode_atts( [
            'title' => 'Chat with us',
        ], $atts, 'worknoon_chat' );

        ob_start();
        ?>
        <div class="wnc-inline-trigger" data-title="<?php echo esc_attr( $atts['title'] ); ?>">
            <button class="wnc-open-btn">
                <?php echo esc_html( $atts['title'] ); ?>
            </button>
        </div>
        <?php
        return ob_get_clean();
    }
}

add_action( 'init', [ 'Worknoon_Shortcode', 'register' ] );
