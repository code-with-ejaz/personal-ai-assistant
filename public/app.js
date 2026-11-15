const STORAGE_KEY = 'muse-assistant-state-v1';
const form = document.querySelector('#chat-form');
const input = document.querySelector('#message-input');
const messagesEl = document.querySelector('#messages');
const welcome = document.querySelector('#welcome');
const sendButton = document.querySelector('#send-button');
const memoryInput = document.querySelector('#memory-input');
const memoryCount = document.querySelector('#memory-count');
const memoryStatus = document.querySelector('#memory-status');
let state = loadState();
let busy = false;

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      messages: Array.isArray(parsed.messages) ? parsed.messages.filter((m) => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string') : [],
      memory: typeof parsed.memory === 'string' ? parsed.memory.slice(0, 2000) : ''
    };
  } catch {
    return { messages: [], memory: '' };
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    setMemoryStatus('Could not save in this browser');
  }
}

function setMemoryStatus(text) {
  memoryStatus.textContent = text;
  if (text === 'Saved on this device') {
    window.clearTimeout(setMemoryStatus.timer);
    setMemoryStatus.timer = window.setTimeout(() => { memoryStatus.textContent = 'Saved on this device'; }, 1200);
  }
}

function render() {
  messagesEl.replaceChildren();
  welcome.hidden = state.messages.length > 0;
  for (const message of state.messages) {
    const row = document.createElement('article');
    row.className = `message ${message.role === 'user' ? 'message-user' : 'message-assistant'}`;
    if (message.role === 'assistant') {
      const avatar = document.createElement('span');
      avatar.className = 'assistant-avatar';
      avatar.textContent = '✳';
      row.append(avatar);
    }
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = message.content;
    row.append(bubble);
    messagesEl.append(row);
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addMessage(role, content) {
  state.messages.push({ role, content });
  state.messages = state.messages.slice(-20);
  saveState();
  render();
}

function resizeInput() {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
}

async function sendMessage(text) {
  const content = text.trim();
  if (!content || busy) return;
  addMessage('user', content);
  input.value = '';
  resizeInput();
  busy = true;
  sendButton.disabled = true;
  const typing = document.createElement('div');
  typing.className = 'typing-row';
  typing.id = 'typing-indicator';
  typing.innerHTML = '<span class="assistant-avatar">✳</span><span class="typing-dots"><i></i><i></i><i></i></span>';
  messagesEl.append(typing);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: state.messages.slice(-20), memory: state.memory })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.');
    addMessage('assistant', result.reply);
  } catch (error) {
    addMessage('assistant', `Sorry, I couldn't respond. ${error.message}`);
  } finally {
    document.querySelector('#typing-indicator')?.remove();
    busy = false;
    sendButton.disabled = false;
    input.focus();
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  sendMessage(input.value);
});
input.addEventListener('input', resizeInput);
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

memoryInput.value = state.memory;
function updateMemory() {
  state.memory = memoryInput.value.slice(0, 2000);
  memoryCount.textContent = `${state.memory.length}/2000`;
  saveState();
  setMemoryStatus('Saved on this device');
}
memoryInput.addEventListener('input', updateMemory);
memoryCount.textContent = `${state.memory.length}/2000`;

for (const button of document.querySelectorAll('[data-prompt]')) {
  button.addEventListener('click', () => {
    const prompt = button.dataset.prompt;
    if (welcome.hidden) {
      input.value = prompt;
      resizeInput();
      input.focus();
    } else {
      sendMessage(prompt);
    }
    closeMobileMenu();
  });
}

document.querySelector('#new-chat').addEventListener('click', () => {
  state.messages = [];
  saveState();
  render();
  input.focus();
  closeMobileMenu();
});
document.querySelector('#clear-chat').addEventListener('click', () => {
  if (state.messages.length && window.confirm('Clear this conversation? This only removes the chat saved in this browser.')) {
    state.messages = [];
    saveState();
    render();
  }
});

const sidebar = document.querySelector('#sidebar');
const scrim = document.querySelector('#mobile-scrim');
function closeMobileMenu() {
  sidebar.classList.remove('sidebar-open');
  scrim.classList.remove('scrim-visible');
}
document.querySelector('#mobile-menu').addEventListener('click', () => {
  sidebar.classList.toggle('sidebar-open');
  scrim.classList.toggle('scrim-visible');
});
scrim.addEventListener('click', closeMobileMenu);

render();
