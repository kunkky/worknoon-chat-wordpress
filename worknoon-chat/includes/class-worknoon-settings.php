<?php

if ( ! defined( 'ABSPATH' ) ) exit;

class Worknoon_Settings {

    public static function register() {
        add_action( 'admin_menu', [ __CLASS__, 'add_menu' ] );
        add_action( 'admin_init', [ __CLASS__, 'register_settings' ] );
    }

    public static function add_menu() {
        add_options_page(
            'Worknoon Chat Settings',
            'Worknoon Chat',
            'manage_options',
            'worknoon-chat',
            [ __CLASS__, 'render_page' ]
        );
    }

    public static function register_settings() {
        register_setting( 'wnc_options', 'wnc_api_url', [ 'sanitize_callback' => 'esc_url_raw' ] );
        register_setting( 'wnc_options', 'wnc_socket_url', [ 'sanitize_callback' => 'esc_url_raw' ] );

        add_settings_section( 'wnc_main', 'Connection Settings', null, 'worknoon-chat' );

        add_settings_field( 'wnc_api_url', 'Backend API URL', [ __CLASS__, 'api_url_field' ], 'worknoon-chat', 'wnc_main' );
        add_settings_field( 'wnc_socket_url', 'Socket.IO URL', [ __CLASS__, 'socket_url_field' ], 'worknoon-chat', 'wnc_main' );
    }

    public static function api_url_field() {
        $val = get_option( 'wnc_api_url', '' );
        echo '<input type="url" name="wnc_api_url" value="' . esc_attr( $val ) . '" class="regular-text" placeholder="http://localhost:5000/api" />';
    }

    public static function socket_url_field() {
        $val = get_option( 'wnc_socket_url', '' );
        echo '<input type="url" name="wnc_socket_url" value="' . esc_attr( $val ) . '" class="regular-text" placeholder="http://localhost:5000" />';
    }

    public static function render_page() {
        if ( ! current_user_can( 'manage_options' ) ) return;
        ?>
        <div class="wrap">
            <h1>Worknoon Chat Settings</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields( 'wnc_options' );
                do_settings_sections( 'worknoon-chat' );
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }
}

add_action( 'plugins_loaded', [ 'Worknoon_Settings', 'register' ] );
