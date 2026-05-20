<?php
/**
 * Plugin Name: Worknoon Chat
 * Plugin URI:  https://github.com/yourusername/worknoon-chat-wordpress
 * Description: Floating real-time chat widget for Worknoon. Integrates with the Worknoon Chat backend via REST API and Socket.IO.
 * Version:     1.0.0
 * Author:      Ademuyiwa Adekunle
 * License:     GPL-2.0+
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'WNC_VERSION', '1.0.0' );
define( 'WNC_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'WNC_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once WNC_PLUGIN_DIR . 'includes/class-worknoon-chat.php';
require_once WNC_PLUGIN_DIR . 'includes/class-worknoon-cpt.php';
require_once WNC_PLUGIN_DIR . 'includes/class-worknoon-shortcode.php';
require_once WNC_PLUGIN_DIR . 'includes/class-worknoon-settings.php';

function wnc_init() {
    $plugin = new Worknoon_Chat();
    $plugin->init();
}
add_action( 'plugins_loaded', 'wnc_init' );
