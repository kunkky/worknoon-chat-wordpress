<?php if ( ! defined( 'ABSPATH' ) ) exit; ?>

<div id="wnc-widget" class="wnc-widget" aria-live="polite" role="region" aria-label="Chat">
    <!-- Toggle button -->
    <button id="wnc-toggle" class="wnc-toggle-btn" aria-expanded="false" aria-controls="wnc-panel">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
        </svg>
        <span class="wnc-unread-badge" id="wnc-badge" hidden>0</span>
    </button>

    <!-- Chat panel -->
    <div id="wnc-panel" class="wnc-panel" hidden>
        <!-- Auth view -->
        <div id="wnc-auth" class="wnc-view">
            <div class="wnc-header">
                <span>Worknoon Chat</span>
            </div>
            <div class="wnc-auth-body">
                <div id="wnc-auth-error" class="wnc-error" hidden></div>
                <input id="wnc-email" type="email" placeholder="Email" class="wnc-input" />
                <input id="wnc-password" type="password" placeholder="Password" class="wnc-input" />
                <button id="wnc-login-btn" class="wnc-btn-primary">Login</button>
                <p class="wnc-auth-note">New here? <a href="<?php echo esc_url( get_option('wnc_api_url') ); ?>/register" target="_blank">Register on Worknoon</a></p>
            </div>
        </div>

        <!-- Chat view -->
        <div id="wnc-chat" class="wnc-view" hidden>
            <div class="wnc-header">
                <span id="wnc-chat-title">Support Chat</span>
                <button id="wnc-logout-btn" class="wnc-logout" title="Logout">&#x2715;</button>
            </div>
            <div id="wnc-messages" class="wnc-messages"></div>
            <div id="wnc-typing-indicator" class="wnc-typing" hidden></div>
            <div class="wnc-input-row">
                <input id="wnc-msg-input" type="text" placeholder="Type a message..." class="wnc-input wnc-msg-input" />
                <button id="wnc-send-btn" class="wnc-btn-primary wnc-send-btn">Send</button>
            </div>
        </div>
    </div>
</div>
