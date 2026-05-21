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
  const selectView     = document.getElementById('wnc-select');
  const agentListEl    = document.getElementById('wnc-agent-list');
  const authError      = document.getElementById('wnc-auth-error');
  const emailInput     = document.getElementById('wnc-email');
  const passInput      = document.getElementById('wnc-password');
  const loginBtn       = document.getElementById('wnc-login-btn');
  const logoutBtn      = document.getElementById('wnc-logout-btn');
  const endChatBtn     = document.getElementById('wnc-end-chat-btn');
  const newChatBtn     = document.getElementById('wnc-new-chat-btn');
  const endedLogoutBtn = document.getElementById('wnc-ended-logout-btn');
  const backBtn        = document.getElementById('wnc-back-btn');
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

  // ── New chat → agent selection ────────────────────────────────────────────
  newChatBtn.addEventListener('click', async () => {
    endedView.hidden  = true;
    selectView.hidden = false;
    await loadAgents();
  });

  // Back from agent selection → ended screen
  backBtn.addEventListener('click', () => {
    selectView.hidden = true;
    endedView.hidden  = false;
  });

  async function loadAgents() {
    agentListEl.innerHTML = '<p class="wnc-agent-list-empty">Loading…</p>';
    try {
      const { users } = await apiFetch('/users');
      const agents = users.filter(u => u.role === 'agent');

      if (!agents.length) {
        agentListEl.innerHTML = '<p class="wnc-agent-list-empty">No agents available right now.</p>';
        return;
      }

      agentListEl.innerHTML = '';
      agents.forEach(agent => {
        const initials = agent.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        const item = document.createElement('div');
        item.className = 'wnc-agent-item';
        item.innerHTML = `
          <div class="wnc-agent-avatar">
            ${initials}
            <span class="wnc-agent-presence${agent.isOnline ? ' online' : ''}"></span>
          </div>
          <div class="wnc-agent-info">
            <div class="wnc-agent-name">${agent.name}</div>
            <div class="wnc-agent-status">${agent.isOnline ? 'Online' : 'Offline'}</div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9ca3af">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>`;

        item.addEventListener('click', () => startConversationWith(agent));
        agentListEl.appendChild(item);
      });
    } catch {
      agentListEl.innerHTML = '<p class="wnc-agent-list-empty">Could not load agents. Please try again.</p>';
    }
  }

  async function startConversationWith(agent) {
    selectView.hidden = true;
    chatView.hidden   = false;
    messagesEl.innerHTML = '';
    appendSystemMessage(`Starting a session with ${agent.name}…`);

    try {
      const { conversation } = await apiFetch('/conversations', 'POST', {
        participantId: agent._id,
        type: 'direct',
      });

      activeConvId = conversation._id;
      messagesEl.innerHTML = '';

      if (socket) {
        socket.emit('join_conversation', activeConvId);
      }

      appendSystemMessage(`You're now chatting with ${agent.name}. How can we help?`);
    } catch {
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

    authView.hidden   = true;
    endedView.hidden  = true;
    selectView.hidden = true;
    chatView.hidden   = false;

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
    authView.hidden   = false;
    chatView.hidden   = true;
    endedView.hidden  = true;
    selectView.hidden = true;
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
