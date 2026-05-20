<?php

if ( ! defined( 'ABSPATH' ) ) exit;

class Worknoon_CPT {

    public static function register() {
        register_post_type( 'wnc_chat_session', [
            'labels' => [
                'name'          => __( 'Chat Sessions', 'worknoon-chat' ),
                'singular_name' => __( 'Chat Session', 'worknoon-chat' ),
            ],
            'public'       => false,
            'show_ui'      => true,
            'show_in_menu' => true,
            'supports'     => [ 'title', 'custom-fields' ],
            'menu_icon'    => 'dashicons-format-chat',
        ] );
    }
}

add_action( 'init', [ 'Worknoon_CPT', 'register' ] );
