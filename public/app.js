const $ = (selector) => document.querySelector(selector);
const state = { messages: [], memory: '', tasks: [], events: [], googleConnected: false, filter: 'open' };
const authScreen = $('#auth-screen'); const shell = $('#app-shell'); const input = $('#message-input'); let busy = false; let memoryTimer;
const titles = { chat: 'Your assistant', dashboard: 'Your overview', tasks: 'My tasks', planner: 'Daily planner', memory: 'Personal memory', calendar: 'Calendar & email' };

async function api(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) } });
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
function toast(text) { const el = $('#toast'); el.textContent = text; el.classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('visible'), 2600); }
function setPage(page) {
  if (!titles[page]) return;
  document.querySelectorAll('.page-view').forEach((el) => el.classList.toggle('active', el.id === `page-${page}`));
  document.querySelectorAll('.nav-item').forEach((el) => el.classList.toggle('active', el.dataset.page === page));
  $('#page-title').firstChild.textContent = titles[page] + ' ';
  $('#clear-chat').hidden = page !== 'chat';
  history.replaceState(null, '', `#${page}`); closeMobileMenu();
  if (page === 'dashboard') renderDashboard(); if (page === 'planner') renderPlanner(); if (page === 'calendar') loadIntegrations();
}
function closeMobileMenu() { $('#sidebar').classList.remove('sidebar-open'); $('#mobile-scrim').classList.remove('scrim-visible'); }
function renderMessages() {
  const container = $('#messages'); container.replaceChildren(); $('#welcome').hidden = state.messages.length > 0;
  for (const message of state.messages) {
    const row = document.createElement('article'); row.className = `message ${message.role === 'user' ? 'message-user' : 'message-assistant'}`;
    if (message.role === 'assistant') { const avatar = document.createElement('span'); avatar.className = 'assistant-avatar'; avatar.textContent = '✳'; row.append(avatar); }
    const bubble = document.createElement('div'); bubble.className = 'message-bubble'; bubble.textContent = message.content; row.append(bubble); container.append(row);
  }
  $('#conversation').scrollTop = $('#conversation').scrollHeight;
}
async function sendMessage(text) {
  const content = text.trim(); if (!content || busy) return;
  state.messages.push({ role: 'user', content }); state.messages = state.messages.slice(-20); renderMessages(); input.value = ''; resizeInput(); busy = true; $('#send-button').disabled = true;
  const typing = document.createElement('div'); typing.className = 'typing-row'; typing.id = 'typing-indicator'; typing.innerHTML = '<span class="assistant-avatar">✳</span><span class="typing-dots"><i></i><i></i><i></i></span>'; $('#messages').append(typing);
  try { const result = await api('/api/chat', { method: 'POST', body: JSON.stringify({ messages: state.messages }) }); state.messages.push({ role: 'assistant', content: result.reply }); state.messages = state.messages.slice(-20); }
  catch (error) { state.messages.push({ role: 'assistant', content: `Sorry, I couldn't respond. ${error.message}` }); }
  finally { $('#typing-indicator')?.remove(); busy = false; $('#send-button').disabled = false; renderMessages(); input.focus(); }
}
function resizeInput() { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 180)}px`; }
function sortTasks(tasks) { const weight = { high: 0, medium: 1, low: 2 }; return [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed) || weight[a.priority] - weight[b.priority] || (a.dueDate || '9999').localeCompare(b.dueDate || '9999')); }
function taskElement(task, compact = false) {
  const row = document.createElement('div'); row.className = `task-row ${task.completed ? 'is-complete' : ''}`;
  const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = task.completed; checkbox.setAttribute('aria-label', `Mark ${task.title} ${task.completed ? 'incomplete' : 'complete'}`);
  checkbox.addEventListener('change', async () => { try { await api(`/api/tasks/${encodeURIComponent(task.id)}`, { method: 'PATCH', body: JSON.stringify({ completed: checkbox.checked }) }); task.completed = checkbox.checked; renderTasks(); renderDashboard(); renderPlanner(); } catch (e) { toast(e.message); } });
  const body = document.createElement('div'); body.className = 'task-body'; const title = document.createElement('span'); title.className = 'task-title'; title.textContent = task.title; body.append(title);
  const meta = document.createElement('span'); meta.className = 'task-meta'; meta.textContent = [task.dueDate ? `Due ${new Date(`${task.dueDate}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : '', task.priority].filter(Boolean).join(' · '); body.append(meta);
  const badge = document.createElement('span'); badge.className = `priority priority-${task.priority}`; badge.textContent = task.priority;
  row.append(checkbox, body, badge);
  if (!compact) { const del = document.createElement('button'); del.className = 'delete-task'; del.textContent = '×'; del.title = 'Delete task'; del.setAttribute('aria-label', `Delete ${task.title}`); del.addEventListener('click', async () => { try { await api(`/api/tasks/${encodeURIComponent(task.id)}`, { method: 'DELETE' }); state.tasks = state.tasks.filter((t) => t.id !== task.id); renderTasks(); renderDashboard(); renderPlanner(); } catch (e) { toast(e.message); } }); row.append(del); }
  return row;
}
function renderTasks() {
  const list = $('#tasks-list'); if (!list) return; list.replaceChildren(); const selected = sortTasks(state.tasks).filter((t) => state.filter === 'all' || (state.filter === 'completed' ? t.completed : !t.completed));
  if (!selected.length) { const empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = state.filter === 'completed' ? 'Completed tasks will show up here.' : 'No tasks here yet. Add something small to get started.'; list.append(empty); }
  selected.forEach((task) => list.append(taskElement(task)));
  document.querySelectorAll('.filter-button').forEach((b) => b.classList.toggle('active', b.dataset.filter === state.filter));
}
function renderDashboard() {
  const open = state.tasks.filter((t) => !t.completed); $('#stat-open').textContent = open.length; $('#stat-done').textContent = state.tasks.filter((t) => t.completed).length;
  const today = new Date().toDateString(); const todayEvents = state.events.filter((e) => new Date(e.start).toDateString() === today); $('#stat-events').textContent = state.googleConnected ? todayEvents.length : '—'; $('#connection-summary').textContent = state.googleConnected ? 'Events on your calendar today' : 'Connect Google to see your day';
  const target = $('#dashboard-tasks'); target.replaceChildren(); const next = sortTasks(open).slice(0, 5); if (!next.length) { target.innerHTML = '<div class="empty-state">You have some breathing room. Add a task whenever you are ready.</div>'; } else next.forEach((t) => target.append(taskElement(t, true)));
}
function renderPlanner() {
  $('#planner-date').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const list = $('#planner-tasks'); list.replaceChildren(); const focus = sortTasks(state.tasks.filter((t) => !t.completed)).slice(0, 5);
  if (!focus.length) list.innerHTML = '<div class="empty-state">No open tasks. Enjoy the space or add a task to plan around.</div>'; else focus.forEach((t) => list.append(taskElement(t, true)));
  const events = $('#planner-events'); events.replaceChildren(); const today = new Date().toDateString(); const todayEvents = state.events.filter((e) => new Date(e.start).toDateString() === today);
  if (!state.googleConnected) events.innerHTML = '<div class="empty-state">Connect Google Calendar on the Calendar & email page to see your events.</div>';
  else if (!todayEvents.length) events.innerHTML = '<div class="empty-state">No more events on your calendar today.</div>';
  else todayEvents.forEach((e) => events.append(eventElement(e)));
}
function eventElement(event) { const row = document.createElement('div'); row.className = 'event-row'; const time = document.createElement('time'); time.textContent = event.start.includes('T') ? new Date(event.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'All day'; const content = document.createElement('div'); const title = document.createElement('strong'); title.textContent = event.title; content.append(title); if (event.location) { const place = document.createElement('small'); place.textContent = event.location; content.append(place); } row.append(time, content); return row; }
async function loadIntegrations() {
  try { const [calendar, mail] = await Promise.all([api('/api/calendar'), api('/api/emails')]); state.googleConnected = calendar.connected || mail.connected; state.events = calendar.events || []; renderGoogleStatus(); renderPlanner(); renderDashboard();
    const eventList = $('#calendar-events'); eventList.replaceChildren(); if (!state.events.length) eventList.innerHTML = `<div class="empty-state">${state.googleConnected ? 'No upcoming events in the next 7 days.' : 'Connect Google to show upcoming events.'}</div>`; else state.events.forEach((e) => eventList.append(eventElement(e)));
    const emailList = $('#email-list'); emailList.replaceChildren(); if (!mail.emails?.length) emailList.innerHTML = `<div class="empty-state">${state.googleConnected ? 'No recent inbox messages found.' : 'Connect Google to show recent inbox messages.'}</div>`; else mail.emails.forEach((email) => emailList.append(emailElement(email)));
  } catch (error) { toast(error.message); }
}
function renderGoogleStatus() { $('#google-status').textContent = state.googleConnected ? 'Google is connected' : 'Google is not connected'; $('#google-description').textContent = state.googleConnected ? 'Calendar events and recent inbox snippets are read-only. Muse does not send mail or edit your calendar.' : 'Connect Google Calendar and Gmail using read-only permissions. You can disconnect at any time.'; $('#connect-google').hidden = state.googleConnected; $('#disconnect-google').hidden = !state.googleConnected; }
function emailElement(email) { const row = document.createElement('article'); row.className = 'email-row'; const subject = document.createElement('strong'); subject.textContent = email.subject; const from = document.createElement('small'); from.textContent = email.from; const snippet = document.createElement('p'); snippet.textContent = email.snippet; row.append(subject, from, snippet); return row; }
async function initApp(user) {
  authScreen.hidden = true; shell.hidden = false; $('#user-chip').textContent = user.username;
  try { const data = await api('/api/state'); state.memory = data.memory; state.tasks = data.tasks; state.googleConnected = data.googleConnected; $('#memory-input').value = state.memory; $('#memory-count').textContent = `${state.memory.length}/5000`; renderGoogleStatus(); renderTasks(); renderDashboard(); renderMessages(); }
  catch (error) { if (error.message.includes('sign in')) showLogin(); else toast(error.message); }
  if (location.search.includes('connected=google')) { history.replaceState(null, '', location.pathname + location.hash); toast('Google account connected.'); await loadIntegrations(); }
  setPage(location.hash.slice(1) || 'chat');
}
function showLogin() { authScreen.hidden = false; shell.hidden = true; }
$('#login-form').addEventListener('submit', async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const errorEl = $('#login-error'); errorEl.textContent = ''; try { const user = await api('/api/login', { method: 'POST', body: JSON.stringify({ username: form.get('username'), password: form.get('password') }) }); await initApp(user); } catch (error) { errorEl.textContent = error.message; } });
$('#logout-button').addEventListener('click', async () => { try { await api('/api/logout', { method: 'POST' }); state.messages = []; showLogin(); } catch (e) { toast(e.message); } });
document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', () => setPage(button.dataset.page)));
document.querySelectorAll('[data-goto]').forEach((button) => button.addEventListener('click', () => setPage(button.dataset.goto)));
$('#mobile-menu').addEventListener('click', () => { $('#sidebar').classList.toggle('sidebar-open'); $('#mobile-scrim').classList.toggle('scrim-visible'); }); $('#mobile-scrim').addEventListener('click', closeMobileMenu);
$('#chat-form').addEventListener('submit', (event) => { event.preventDefault(); sendMessage(input.value); }); input.addEventListener('input', resizeInput); input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); $('#chat-form').requestSubmit(); } });
for (const button of document.querySelectorAll('[data-prompt]')) button.addEventListener('click', () => { sendMessage(button.dataset.prompt); });
$('#new-chat').addEventListener('click', () => { state.messages = []; renderMessages(); input.focus(); closeMobileMenu(); setPage('chat'); });
$('#clear-chat').addEventListener('click', () => { if (state.messages.length && confirm('Clear this conversation from this page?')) { state.messages = []; renderMessages(); } });
$('#task-form').addEventListener('submit', async (event) => { event.preventDefault(); const title = $('#task-title'); try { const result = await api('/api/tasks', { method: 'POST', body: JSON.stringify({ title: title.value, dueDate: $('#task-date').value, priority: $('#task-priority').value }) }); state.tasks.unshift(result.task); title.value = ''; $('#task-date').value = ''; renderTasks(); renderDashboard(); renderPlanner(); toast('Task added.'); } catch (error) { toast(error.message); } });
document.querySelectorAll('.filter-button').forEach((b) => b.addEventListener('click', () => { state.filter = b.dataset.filter; renderTasks(); }));
$('#save-memory').addEventListener('click', async () => { try { const result = await api('/api/memory', { method: 'PUT', body: JSON.stringify({ memory: $('#memory-input').value }) }); state.memory = result.memory; $('#memory-status').textContent = 'Saved to your account'; toast('Memory saved.'); } catch (e) { toast(e.message); } });
$('#clear-memory').addEventListener('click', async () => { $('#memory-input').value = ''; $('#memory-count').textContent = '0/5000'; $('#save-memory').click(); });
$('#memory-input').addEventListener('input', () => { $('#memory-count').textContent = `${$('#memory-input').value.length}/5000`; $('#memory-status').textContent = 'Unsaved changes'; clearTimeout(memoryTimer); memoryTimer = setTimeout(() => $('#save-memory').click(), 900); });
$('#refresh-plan').addEventListener('click', async () => { if (state.googleConnected) await loadIntegrations(); renderPlanner(); toast('Your plan is up to date.'); });
$('#reload-calendar').addEventListener('click', loadIntegrations); $('#reload-emails').addEventListener('click', loadIntegrations);
$('#disconnect-google').addEventListener('click', async () => { if (!confirm('Disconnect Google and remove saved access tokens?')) return; try { await api('/api/integrations/google', { method: 'DELETE' }); state.googleConnected = false; state.events = []; renderGoogleStatus(); await loadIntegrations(); toast('Google disconnected.'); } catch (e) { toast(e.message); } });
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) $('#voice-button').title = 'Voice input is not supported in this browser';
$('#voice-button').addEventListener('click', () => { if (!SpeechRecognition) return toast('Voice input is not supported in this browser. Try a recent Chrome browser.'); const recognition = new SpeechRecognition(); recognition.lang = navigator.language || 'en-US'; recognition.interimResults = false; recognition.maxAlternatives = 1; recognition.onresult = (event) => { input.value = `${input.value}${input.value ? ' ' : ''}${event.results[0][0].transcript}`; resizeInput(); input.focus(); }; recognition.onerror = () => toast('Voice input was not captured. Check microphone permission.'); recognition.start(); });
(async () => { try { const user = await api('/api/me'); if (user.authenticated) await initApp(user); else showLogin(); } catch { showLogin(); } })();
