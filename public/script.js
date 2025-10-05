const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const settingsClose = document.getElementById('settings-close');
const saveSettingsBtn = document.getElementById('save-settings');
const personaBadge = document.getElementById('persona-badge');

// ===== Persona state =====
const PERSONA_KEY = 'chatbot_persona';
const DEFAULT_PERSONA = 'friendly'; // default

function getPersona() {
  return localStorage.getItem(PERSONA_KEY) || DEFAULT_PERSONA;
}

function setPersona(p) {
  localStorage.setItem(PERSONA_KEY, p);
  updatePersonaBadge();
}

function updatePersonaBadge() {
  const p = getPersona();
  const label =
    p === 'professional' ? '🤓 Professional' :
    p === 'ai' ? '🤖 AI Assistant' :
    '😎 Friendly';
  personaBadge.textContent = `Persona: ${label}`;
}

// init radio from saved persona
function initSettingsUI() {
  const saved = getPersona();
  const radios = document.querySelectorAll('input[name="persona"]');
  radios.forEach(r => {
    r.checked = (r.value === saved);
  });
  updatePersonaBadge();
}

// open/close settings
settingsBtn.addEventListener('click', () => {
  initSettingsUI();
  settingsPanel.classList.remove('hidden');
});
settingsClose.addEventListener('click', () => {
  settingsPanel.classList.add('hidden');
});
saveSettingsBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const selected = document.querySelector('input[name="persona"]:checked');
  if (selected) setPersona(selected.value);
  settingsPanel.classList.add('hidden');
});

// ===== Conversation =====
const conversationHistory = [];

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Add user message to history and UI
  conversationHistory.push({ role: 'user', text: userMessage });
  appendMessage('user', userMessage);
  input.value = '';

  // Thinking indicator
  const thinkingMessageElement = appendMessage('bot', 'Gemini is thinking...');

  try {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation: conversationHistory,
        persona: getPersona() // <— kirim persona ke backend
      }),
    });

    const data = await response.json();

    // remove "thinking"
    chatBox.removeChild(thinkingMessageElement);

    if (data.success) {
      conversationHistory.push({ role: 'model', text: data.data });
      appendMessage('bot', data.data);
    } else {
      appendMessage('bot', `Error: ${data.message}`);
    }
  } catch (error) {
    chatBox.removeChild(thinkingMessageElement);
    console.error('Error sending message:', error);
    appendMessage('bot', 'Oops! Something went wrong. Please try again.');
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

// Boot
updatePersonaBadge();
