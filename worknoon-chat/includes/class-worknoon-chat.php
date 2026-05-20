<?php

if ( ! defined( 'ABSPATH' ) ) exit;

class Worknoon_Chat {

    public function init() {
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ] );
        add_action( 'wp_footer', [ $this, 'render_widget' ] );
    }

    public function enqueue_assets() {
        $api_url    = get_option( 'wnc_api_url', '' );
        $socket_url = get_option( 'wnc_socket_url', '' );

        wp_enqueue_style(
            'wnc-chat',
            WNC_PLUGIN_URL . 'assets/css/chat.css',
            [],
            WNC_VERSION
        );

        // Socket.IO client from CDN
        wp_enqueue_script(
            'socket-io',
            'https://cdn.socket.io/4.7.5/socket.io.min.js',
            [],
            '4.7.5',
            true
        );

        wp_enqueue_script(
            'wnc-chat',
            WNC_PLUGIN_URL . 'assets/js/chat.js',
            [ 'socket-io' ],
            WNC_VERSION,
            true
        );

        wp_localize_script( 'wnc-chat', 'wncConfig', [
            'apiUrl'    => esc_url( $api_url ),
            'socketUrl' => esc_url( $socket_url ),
        ] );
    }

    public function render_widget() {
        include WNC_PLUGIN_DIR . 'includes/widget-template.php';
    }
}
