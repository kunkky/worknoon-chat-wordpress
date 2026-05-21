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
                <div class="wnc-header-left">
                    <span id="wnc-chat-title">Support Chat</span>
                    <span id="wnc-chat-status" class="wnc-status-dot"></span>
                </div>
                <div class="wnc-header-actions">
                    <button id="wnc-end-chat-btn" class="wnc-icon-btn" title="End chat session">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </button>
                    <button id="wnc-logout-btn" class="wnc-icon-btn" title="Sign out">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>
            <div id="wnc-messages" class="wnc-messages"></div>
            <div id="wnc-typing-indicator" class="wnc-typing" hidden></div>
            <div class="wnc-input-row">
                <input id="wnc-msg-input" type="text" placeholder="Type a message..." class="wnc-input wnc-msg-input" />
                <button id="wnc-send-btn" class="wnc-btn-primary wnc-send-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Session ended view -->
        <div id="wnc-ended" class="wnc-view" hidden>
            <div class="wnc-header">
                <span>Worknoon Chat</span>
            </div>
            <div class="wnc-ended-body">
                <div class="wnc-ended-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 class="wnc-ended-title">Chat ended</h3>
                <p class="wnc-ended-sub">Thanks for reaching out. We hope we helped!</p>
                <button id="wnc-new-chat-btn" class="wnc-btn-primary">Start new chat</button>
                <button id="wnc-ended-logout-btn" class="wnc-btn-ghost">Sign out</button>
            </div>
        </div>

    </div>
</div>
