# worknoon-chat-wordpress

WordPress plugin that embeds the Worknoon Chat widget on any WordPress site. Provides a floating chat button, shortcode support, and a custom post type for logging chat sessions.

## Tech Stack

| Layer       | Technology                                    |
|-------------|-----------------------------------------------|
| Platform    | WordPress 6.x                                 |
| Plugin type | Standard OOP plugin (no framework dependency) |
| Real-time   | Socket.IO 4 (loaded from CDN)                 |
| Styling     | Vanilla CSS (self-contained)                  |
| API         | Worknoon Chat REST API (JWT auth)             |

## Architecture

```
worknoon-chat/
├── worknoon-chat.php           # Plugin entry point — defines constants, loads classes
├── includes/
│   ├── class-worknoon-chat.php      # Core: enqueues assets, renders widget in wp_footer
│   ├── class-worknoon-cpt.php       # Registers "Chat Session" custom post type
│   ├── class-worknoon-shortcode.php # [worknoon_chat] shortcode
│   ├── class-worknoon-settings.php  # Settings page (WP admin) for API + Socket URLs
│   └── widget-template.php          # HTML template for the floating chat widget
└── assets/
    ├── css/chat.css                 # Widget styles (scoped to .wnc-* prefix)
    └── js/chat.js                   # Widget logic: auth, socket, send/receive
```

### How It Works

1. Plugin enqueues `chat.css` and `chat.js` on every frontend page
2. `wncConfig` JS object is localized with `apiUrl` and `socketUrl` from WP settings
3. Widget renders as a floating button in `wp_footer`
4. On open: if JWT exists in `localStorage`, loads chat directly; otherwise shows login form
5. After login: fetches the user's most recent conversation via REST API
6. Socket.IO connection is established with the JWT; incoming messages update the widget in real-time
7. Users can send messages via the input field — sent via REST API (also broadcast via socket)

### Custom Post Type

A `wnc_chat_session` CPT is registered and visible in WP Admin → Chat Sessions. Intended for admins to annotate or archive chat sessions from the WordPress side. Currently metadata-only (no automated sync) — WooCommerce order linking would be the next step.

### Shortcode

```
[worknoon_chat title="Chat with us"]
```

Renders an inline "Chat with us" button that opens the floating widget. Useful for product pages, support pages, or any post/page content.

## Setup

### Prerequisites

- WordPress 6.x installation (local via LocalWP, Lando, XAMPP, etc.)
- Running `worknoon-chat-backend` instance accessible from the browser

### Install

1. Clone or copy the `worknoon-chat/` folder into your WordPress `wp-content/plugins/` directory:
   ```
   wp-content/plugins/worknoon-chat/
   ```

2. Activate in **WP Admin → Plugins → Worknoon Chat → Activate**

3. Go to **WP Admin → Settings → Worknoon Chat** and enter:
   - **Backend API URL**: e.g. `http://localhost:5000/api`
   - **Socket.IO URL**: e.g. `http://localhost:5000`

4. Visit any frontend page — the floating chat button will appear in the bottom-right corner.

### Shortcode Usage

In any post or page, add:

```
[worknoon_chat title="Chat with support"]
```

This renders an inline button that opens the chat widget.

## Tradeoffs & Intentional Deferrals

Given the assessment timeline, the following were intentionally deferred:

- **WooCommerce order sync** — would use `woocommerce_order_status_changed` action to attach order context to a chat session CPT post on order events. The CPT is already registered as the data store.
- **Product-based chat context** — would read `get_queried_object()` on product pages to pre-populate a chat session with the product ID/title.
- **WordPress user integration** — the widget uses its own JWT auth (matching the Worknoon platform) rather than syncing with WP user accounts. For a tighter integration, a REST endpoint that exchanges a WP nonce for a Worknoon JWT would bridge the two auth systems.
- **AJAX fallback** — the widget uses `fetch()`. A `wp_ajax_` fallback for older environments is straightforward to add.

## Challenges

- CORS: the WordPress frontend (e.g. `http://localhost:8080`) must be in the backend's `CLIENT_URL` or CORS `origin` config. This is a common gotcha in local WordPress setups.
- Socket.IO on HTTPS WordPress sites requires the backend to also be HTTPS (WSS). For local dev, matching HTTP is fine.

---

## Assessment Submission

Submitted for recruitment evaluation purposes at **Worknoon**.

**License: All Rights Reserved** — This code was created as part of a job application assessment and may not be reused, redistributed, or modified without explicit permission from the author.
