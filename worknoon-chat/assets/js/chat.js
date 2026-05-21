(function () {
  'use strict';

  const API        = wncConfig.apiUrl;
  const SOCKET_URL = wncConfig.socketUrl;

  let socket      = null;
  let token       = localStorage.getItem('wnc_token');
  let currentUser = null;
  let activeConvId = null;
  let typingTimer = null;

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const toggleBtn      = document.getElementById('wnc-toggle');
  const panel          = document.getElementById('wnc-panel');
  const badge          = document.getElementById('wnc-badge');
  const authView       = document.getElementById('wnc-auth');
  const chatView       = document.getElementById('wnc-chat');
  const endedView      = document.getElementById('wnc-ended');
  const authError      = document.getElementById('wnc-auth-error');
  const emailInput     = document.getElementById('wnc-email');
  const passInput      = document.getElementById('wnc-password');
  const loginBtn       = document.getElementById('wnc-login-btn');
  const logoutBtn      = document.getElementById('wnc-logout-btn');
  const endChatBtn     = document.getElementById('wnc-end-chat-btn');
  const newChatBtn     = document.getElementById('wnc-new-chat-btn');
  const endedLogoutBtn = document.getElementById('wnc-ended-logout-btn');
  const messagesEl     = document.getElementById('wnc-messages');
  const msgInput       = document.getElementById('wnc-msg-input');
  const sendBtn        = document.getElementById('wnc-send-btn');
  const typingEl       = document.getElementById('wnc-typing-indicator');
  const statusDot      = document.getElementById('wnc-chat-status');

  // ── Toggle panel ──────────────────────────────────────────────────────────
  toggleBtn.addEventListener('click', () => {
    const isHidden = panel.hidden;
    panel.hidden = !isHidden;
    toggleBtn.setAttribute('aria-expanded', String(isHidden));

    if (isHidden) {
      token ? showChatView() : showAuthView();
    }
  });

  // ── Auth ──────────────────────────────────────────────────────────────────
  loginBtn.addEventListener('click', login);
  [emailInput, passInput].forEach(el =>
    el.addEventListener('keydown', e => e.key === 'Enter' && login())
  );

  async function login() {
    const email    = emailInput.value.trim();
    const password = passInput.value;
    if (!email || !password) return showAuthError('Please fill in all fields.');

    loginBtn.disabled    = true;
    loginBtn.textContent = 'Logging in…';

    try {
      const res = await apiFetch('/auth/login', 'POST', { email, password });
      token = res.token;
      currentUser = res.user;
      localStorage.setItem('wnc_token', token);
      showChatView();
    } catch (err) {
      showAuthError(err.message || 'Login failed.');
    } finally {
      loginBtn.disabled    = false;
      loginBtn.textContent = 'Login';
    }
  }

  // Sign out from chat header
  logoutBtn.addEventListener('click', doLogout);

  // Sign out from ended screen
  endedLogoutBtn.addEventListener('click', doLogout);

  function doLogout() {
    token = null;
    currentUser = null;
    activeConvId = null;
    localStorage.removeItem('wnc_token');
    socket && socket.disconnect();
    socket = null;
    showAuthView();
  }

  // ── End chat ──────────────────────────────────────────────────────────────
  endChatBtn.addEventListener('click', endChat);

  function endChat() {
    if (activeConvId && socket) {
      socket.emit('typing_stop', { conversationId: activeConvId });
    }
    activeConvId = null;
    messagesEl.innerHTML = '';
    typingEl.hidden = true;

    chatView.hidden  = true;
    endedView.hidden = false;
  }

  // ── New chat ──────────────────────────────────────────────────────────────
  newChatBtn.addEventListener('click', async () => {
    endedView.hidden = true;
    chatView.hidden  = false;
    messagesEl.innerHTML = '';
    appendSystemMessage('Starting a new session…');
    await startNewConversation();
  });

  async function startNewConversation() {
    try {
      // Find an available agent to start a conversation with
      const { users } = await apiFetch('/users');
      const agent = users.find(u => u.role === 'agent') || users[0];

      if (!agent) {
        appendSystemMessage('No agents available right now. Try again later.');
        return;
      }

      const { conversation } = await apiFetch('/conversations', 'POST', {
        participantId: agent._id,
        type: 'direct',
      });

      activeConvId = conversation._id;
      messagesEl.innerHTML = '';

      if (socket) {
        socket.emit('join_conversation', activeConvId);
      }

      appendSystemMessage('New session started. How can we help?');
    } catch (err) {
      appendSystemMessage('Could not start a new session. Please try again.');
    }
  }

  // ── Chat view setup ───────────────────────────────────────────────────────
  async function showChatView() {
    if (!currentUser) {
      try {
        const res = await apiFetch('/auth/me');
        currentUser = res.user;
      } catch {
        localStorage.removeItem('wnc_token');
        token = null;
        showAuthView();
        return;
      }
    }

    authView.hidden  = true;
    endedView.hidden = true;
    chatView.hidden  = false;

    await initConversation();
    connectSocket();
  }

  async function initConversation() {
    try {
      const { conversations } = await apiFetch('/conversations');
      if (conversations.length) {
        activeConvId = conversations[0]._id;
        await loadMessages();
      } else {
        appendSystemMessage('Start chatting! A support agent will respond shortly.');
      }
    } catch {
      appendSystemMessage('Could not load conversations.');
    }
  }

  async function loadMessages() {
    if (!activeConvId) return;
    const { messages } = await apiFetch(`/messages/${activeConvId}`);
    messagesEl.innerHTML = '';
    messages.forEach(renderMessage);
    scrollToBottom();
    apiFetch(`/messages/${activeConvId}/read`, 'PATCH');
  }

  // ── Socket ────────────────────────────────────────────────────────────────
  function connectSocket() {
    if (socket) return;

    socket = io(SOCKET_URL, { auth: { token } });

    socket.on('connect', () => {
      socket.emit('join_conversations');
      if (statusDot) statusDot.classList.add('online');
    });

    socket.on('disconnect', () => {
      if (statusDot) statusDot.classList.remove('online');
    });

    socket.on('new_message', ({ message }) => {
      if (message.conversation !== activeConvId) {
        incrementBadge();
        return;
      }
      renderMessage(message);
      scrollToBottom();
      apiFetch(`/messages/${activeConvId}/read`, 'PATCH');
    });

    socket.on('typing', ({ name, conversationId }) => {
      if (conversationId !== activeConvId) return;
      typingEl.textContent = `${name} is typing…`;
      typingEl.hidden = false;
    });

    socket.on('stop_typing', ({ conversationId }) => {
      if (conversationId !== activeConvId) return;
      typingEl.hidden = true;
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket error:', err.message);
      if (statusDot) statusDot.classList.remove('online');
    });
  }

  // ── Send message ──────────────────────────────────────────────────────────
  sendBtn.addEventListener('click', sendMessage);
  msgInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
    else emitTyping();
  });

  function emitTyping() {
    if (!socket || !activeConvId) return;
    socket.emit('typing_start', { conversationId: activeConvId });
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      socket.emit('typing_stop', { conversationId: activeConvId });
    }, 1500);
  }

  function sendMessage() {
    const content = msgInput.value.trim();
    if (!content || !activeConvId) return;

    msgInput.value = '';
    socket && socket.emit('typing_stop', { conversationId: activeConvId });

    if (!socket) {
      appendSystemMessage('Not connected. Please refresh.');
      return;
    }
    socket.emit('send_message', { conversationId: activeConvId, content });
  }

  // ── Render helpers ────────────────────────────────────────────────────────
  function renderMessage(msg) {
    const isMine = currentUser && (
      msg.sender._id === currentUser._id || msg.sender === currentUser._id
    );
    const div = document.createElement('div');
    div.className = `wnc-message ${isMine ? 'mine' : 'theirs'}`;

    if (!isMine) {
      const sender = document.createElement('div');
      sender.className = 'wnc-message-sender';
      sender.textContent = msg.sender.name || 'Agent';
      div.appendChild(sender);
    }

    const text = document.createElement('div');
    text.textContent = msg.content;
    div.appendChild(text);

    messagesEl.appendChild(div);
  }

  function appendSystemMessage(text) {
    const div = document.createElement('div');
    div.style.cssText = 'text-align:center;font-size:12px;color:#9ca3af;padding:8px 0;';
    div.textContent = text;
    messagesEl.appendChild(div);
  }

  function showAuthView() {
    authView.hidden  = false;
    chatView.hidden  = true;
    endedView.hidden = true;
  }

  function showAuthError(msg) {
    authError.textContent = msg;
    authError.hidden = false;
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function incrementBadge() {
    const current = parseInt(badge.textContent || '0', 10);
    badge.textContent = current + 1;
    badge.hidden = false;
  }

  // ── API helper ────────────────────────────────────────────────────────────
  async function apiFetch(path, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  }
})();
