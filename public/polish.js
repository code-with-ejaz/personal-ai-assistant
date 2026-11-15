(() => {
  const $ = (selector) => document.querySelector(selector);
  const form = $('#login-form');
  if (!form) return;

  // Add a self-service registration mode, using the existing secure API endpoints.
  const password = form.querySelector('[name="password"]');
  const nameLabel = document.createElement('label');
  nameLabel.className = 'signup-name';
  nameLabel.innerHTML = 'Display name<input name="displayName" maxlength="80" autocomplete="name">';
  password.closest('label').before(nameLabel);
  const switchButton = document.createElement('button');
  switchButton.className = 'auth-switch'; switchButton.type = 'button'; switchButton.textContent = 'New to Muse? Create an account';
  form.append(switchButton);
  let signup = false;
  switchButton.addEventListener('click', () => {
    signup = !signup;
    form.classList.toggle('is-signup', signup);
    form.querySelector('h1').textContent = signup ? 'Make it yours.' : 'Welcome back.';
    form.querySelector('p').textContent = signup ? 'Create your private personal workspace.' : 'Sign in to your personal Muse assistant.';
    password.autocomplete = signup ? 'new-password' : 'current-password';
    password.minLength = signup ? 12 : 1;
    form.querySelector('.primary-button').textContent = signup ? 'Create account' : 'Sign in';
    switchButton.textContent = signup ? 'Already have an account? Sign in' : 'New to Muse? Create an account';
    $('#login-error').textContent = '';
  });
  // Capture before the legacy sign-in handler so exactly one endpoint is called.
  form.addEventListener('submit', async (event) => {
    if (!signup) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const data = new FormData(form); const error = $('#login-error'); error.textContent = '';
    try {
      const response = await fetch('/api/register', { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email:data.get('username'), password:data.get('password'), displayName:data.get('displayName') }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not create your account.');
      // Reload to let the app's normal session bootstrap initialize a clean workspace.
      window.location.reload();
    } catch (e) { error.textContent = e.message; }
  }, true);

  // Premium progressive enhancement stylesheet and installable PWA controls.
  const style = document.createElement('link'); style.rel = 'stylesheet'; style.href = '/premium.css'; document.head.append(style);
  const manifest = document.createElement('link'); manifest.rel = 'manifest'; manifest.href = '/manifest.webmanifest'; document.head.append(manifest);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('/sw.js').catch(() => {});
  let installPrompt;
  window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); installPrompt = event; installButton.hidden = false; });
  const installButton = document.createElement('button'); installButton.className = 'install-button'; installButton.textContent = 'Install app'; installButton.hidden = true; installButton.type = 'button';
  installButton.addEventListener('click', async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; installButton.hidden = true; });
  $('#page-title').parentElement.append(installButton);

  // Small, privacy-preserving productivity extras: focus timer and task export.
  const plannerActions = $('.planner-actions');
  if (plannerActions) {
    const card = document.createElement('section'); card.className = 'focus-card';
    card.innerHTML = '<div class="focus-copy"><strong>Make space for focused work</strong><span>A gentle 25-minute focus session. This timer stays in this tab.</span></div><div class="focus-controls"><span class="focus-clock" id="focus-clock">25:00</span><button class="focus-control" id="focus-toggle" type="button">Start focus</button><button class="focus-control" id="focus-reset" type="button">Reset</button></div>';
    plannerActions.after(card);
    let remaining = 25 * 60; let timer = null;
    const clock = $('#focus-clock'); const toggle = $('#focus-toggle');
    const paint = () => { clock.textContent = `${String(Math.floor(remaining / 60)).padStart(2,'0')}:${String(remaining % 60).padStart(2,'0')}`; };
    toggle.addEventListener('click', () => { if (timer) { clearInterval(timer); timer = null; toggle.textContent = 'Resume focus'; return; } toggle.textContent = 'Pause'; timer = setInterval(() => { remaining -= 1; paint(); if (remaining <= 0) { clearInterval(timer); timer = null; toggle.textContent = 'Start focus'; remaining = 25 * 60; paint(); if ('Notification' in window && Notification.permission === 'granted') new Notification('Focus session complete', { body:'Take a short break, then choose your next step.' }); } }, 1000); });
    $('#focus-reset').addEventListener('click', () => { clearInterval(timer); timer = null; remaining = 25 * 60; paint(); toggle.textContent = 'Start focus'; });
  }
  const taskForm = $('#task-form');
  if (taskForm) { const exportButton = document.createElement('button'); exportButton.type='button'; exportButton.className='export-button'; exportButton.textContent='Export tasks'; taskForm.after(exportButton); exportButton.addEventListener('click', async () => { try { const response=await fetch('/api/state',{credentials:'same-origin'}); const data=await response.json(); if(!response.ok) throw new Error(data.error||'Sign in required'); const rows=[['Task','Due date','Priority','Completed'],...(data.tasks||[]).map(t=>[t.title,t.dueDate||'',t.priority,t.completed?'Yes':'No'])]; const csv=rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(',')).join('\n'); const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); const a=document.createElement('a'); a.href=url; a.download='muse-tasks.csv'; a.click(); URL.revokeObjectURL(url); } catch(e) { $('#toast').textContent=e.message; $('#toast').classList.add('visible'); } }); }
})();
