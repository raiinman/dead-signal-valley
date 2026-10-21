const HUNT_DURATION = 30000;
const TARGET_LIFETIME = 1350;
const MAX_TARGETS = 3;
const BEST_KEY = 'dsv-signal-hunt-best-v1';

export function createSignalHunt(savedBest = 0) {
  let best = Number.isSafeInteger(savedBest) && savedBest >= 0 ? savedBest : 0;
  let running = false, deadline = 0, score = 0, streak = 1, nextId = 0;
  const targets = new Map();
  const snapshot = () => ({ running, deadline, score, streak, best, targets: [...targets.values()] });
  function tick(now) {
    if (!running) return snapshot();
    if (now >= deadline) {
      running = false;
      targets.clear();
    } else {
      for (const [id, target] of targets) {
        if (target.expires <= now) { targets.delete(id); streak = 1; }
      }
    }
    return snapshot();
  }
  return {
    snapshot,
    start(now) {
      targets.clear();
      running = true; deadline = now + HUNT_DURATION; score = 0; streak = 1;
      return snapshot();
    },
    tick,
    spawn(now, blue = false) {
      tick(now);
      if (!running || targets.size >= MAX_TARGETS) return null;
      const target = { id: ++nextId, blue, expires: Math.min(deadline, now + TARGET_LIFETIME) };
      targets.set(target.id, target);
      return target;
    },
    hit(id, now) {
      tick(now);
      const target = targets.get(id);
      if (!running || !target) return 0;
      const points = (target.blue ? 25 : 10) * streak;
      targets.delete(id); score += points; streak = Math.min(5, streak + 1);
      best = Math.max(best, score);
      return points;
    },
    stop() { running = false; targets.clear(); return snapshot(); }
  };
}

export function practiceRhythm(value) {
  const parsed = Number(value);
  const total = Number.isFinite(parsed) ? Math.max(30, Math.min(120, Math.round(parsed / 5) * 5)) : 60;
  const practice = Math.round(total * 0.6), review = Math.round(total * 0.25);
  return { total, practice, review, breaks: total - practice - review };
}

export function initStudioWidgets({ visit = () => {}, playChime = () => {}, toast = () => {} } = {}) {
  const $ = id => document.getElementById(id);
  const listeners = [];
  function listen(el, name, fn) {
    if (!el) return;
    el.addEventListener(name, fn);
    listeners.push(() => el.removeEventListener(name, fn));
  }
  const text = (id, value) => { if ($(id)) $(id).textContent = value; };
  let savedBest = 0;
  try { savedBest = Number(localStorage.getItem(BEST_KEY)); } catch { /* Storage may be restricted. */ }
  const hunt = createSignalHunt(savedBest);
  const stage = $('hunt-stage'), overlay = $('hunt-overlay');
  let huntTimer = null, spawnAt = 0, previousSeconds = 30, guildOpen = false;
  let activePane = 'divisions', relayTimer = null;
  let announcement = $('hunt-announcement');
  if (!announcement && stage) {
    announcement = document.createElement('p');
    announcement.id = 'hunt-announcement';
    announcement.className = 'sr-only';
    announcement.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap';
    stage.parentNode.appendChild(announcement);
  }
  announcement?.setAttribute('role', 'status');
  announcement?.setAttribute('aria-live', 'polite');
  announcement?.setAttribute('aria-atomic', 'true');
  stage?.setAttribute('tabindex', '-1');
  stage?.setAttribute('aria-label', 'Signal Hunt. Use Tab to reach a signal and Enter or Space to catch it.');
  const announce = value => { if (announcement) announcement.textContent = value; };
  function renderHunt(now = performance.now()) {
    const state = hunt.snapshot();
    text('hunt-score', String(state.score));
    text('hunt-best', String(state.best));
    text('hunt-streak', `×${state.streak}`);
    text('hunt-time', `${state.running ? Math.max(0, Math.ceil((state.deadline - now) / 1000)) : previousSeconds}s`);
    const ids = new Set(state.targets.map(target => String(target.id)));
    stage?.querySelectorAll('.hunt-target').forEach(target => {
      if (!ids.has(target.dataset.targetId)) {
        const focused = document.activeElement === target;
        target.remove();
        if (focused) (stage.querySelector('.hunt-target') || stage).focus({ preventScroll: true });
      }
    });
  }
  function finishHunt(message) {
    clearInterval(huntTimer); huntTimer = null;
    hunt.stop();
    renderHunt();
    if (overlay) { overlay.hidden = false; overlay.style.display = 'flex'; }
    text('hunt-status-text', message);
    text('hunt-start-btn', 'Play Signal Hunt Again');
    announce(message);
  }
  function stopHunt() {
    if (huntTimer !== null || hunt.snapshot().running) finishHunt(`Transmission stopped. Score: ${hunt.snapshot().score}. Start again when ready.`);
  }
  function canPlay(pane) { return guildOpen && activePane === pane && !document.hidden; }
  function spawnTarget(now) {
    const target = hunt.spawn(now, Math.random() > 0.72);
    if (!target || !stage) return;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = `hunt-target ${target.blue ? 'blue' : 'amber'}`;
    btn.dataset.targetId = String(target.id);
    btn.style.left = `${15 + Math.random() * 70}%`;
    btn.style.top = `${18 + Math.random() * 64}%`;
    btn.setAttribute('aria-label', `${target.blue ? 'Blue harmonic burst, 25' : 'Amber signal, 10'} points times your streak`);
    btn.addEventListener('click', event => {
      event.stopPropagation();
      if (!canPlay('signal-hunt')) return;
      const now = performance.now();
      const points = hunt.hit(target.id, now);
      if (!points) { renderHunt(now); return; }
      try { localStorage.setItem(BEST_KEY, String(hunt.snapshot().best)); } catch { /* Play works without persistence. */ }
      playChime(target.blue ? 783.99 : 523.25);
      renderHunt(now);
      if (event.detail === 0) (stage.querySelector('.hunt-target') || stage).focus({ preventScroll: true });
    });
    stage.appendChild(btn);
  }
  listen($('hunt-start-btn'), 'click', () => {
    if (!stage || !canPlay('signal-hunt')) return;
    clearInterval(huntTimer);
    stage.querySelectorAll('.hunt-target').forEach(target => target.remove());
    const now = performance.now();
    hunt.start(now); previousSeconds = 30; spawnAt = now + 650;
    if (announcement) delete announcement.dataset.milestone;
    if (overlay) { overlay.hidden = true; overlay.style.display = 'none'; }
    spawnTarget(now); renderHunt(now);
    stage.querySelector('.hunt-target')?.focus({ preventScroll: true });
    announce('Transmission started. Catch signals for 30 seconds.');
    huntTimer = setInterval(() => {
      if (!canPlay('signal-hunt')) { stopHunt(); return; }
      const now = performance.now(), state = hunt.tick(now);
      previousSeconds = Math.max(0, Math.ceil((state.deadline - now) / 1000));
      if (!state.running) {
        finishHunt(`Transmission complete! Final score: ${state.score} points. Best: ${state.best}.`);
        return;
      }
      if (now >= spawnAt) { spawnTarget(now); spawnAt = now + 650; }
      renderHunt(now);
      if (previousSeconds === 15 || previousSeconds === 5) {
        const milestone = `${previousSeconds} seconds remaining. Score: ${state.score}.`;
        if (announcement?.dataset.milestone !== String(previousSeconds)) {
          announce(milestone); if (announcement) announcement.dataset.milestone = String(previousSeconds);
        }
      }
    }, 100);
  });

  const tabs = [...document.querySelectorAll('.guild-tab')];
  document.querySelector('.guild-tabs')?.setAttribute('role', 'tablist');
  function stopRelay() {
    if (relayTimer === null) return;
    clearTimeout(relayTimer); relayTimer = null;
    text('relay-proc-out', 'Local demonstration stopped.');
    text('relay-ev-out', 'No diagnostic checks were run.');
    if ($('relay-send-btn')) $('relay-send-btn').disabled = false;
  }
  function selectPane(tab, focus = false) {
    const pane = tab.dataset.gtab;
    if (!$(`gtab-${pane}`)) return;
    if (pane !== activePane) { stopHunt(); stopRelay(); }
    activePane = pane;
    tabs.forEach(item => {
      const selected = item === tab;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      const panel = $(`gtab-${item.dataset.gtab}`);
      if (panel) panel.hidden = !selected;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.id ||= `studio-tab-${tab.dataset.gtab}`;
    tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', `gtab-${tab.dataset.gtab}`);
    const pane = $(`gtab-${tab.dataset.gtab}`);
    pane?.setAttribute('role', 'tabpanel'); pane?.setAttribute('aria-labelledby', tab.id);
    listen(tab, 'click', () => selectPane(tab));
    listen(tab, 'keydown', event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
      if (next !== null) { event.preventDefault(); event.stopPropagation(); selectPane(tabs[next], true); }
    });
  });
  if (tabs.length) selectPane(tabs.find(tab => tab.classList.contains('active')) || tabs[0]);
  document.querySelectorAll('[data-visit]').forEach(btn => listen(btn, 'click', () => visit(btn.dataset.visit)));
  const relayPayloads = {
    cafe: ['DEMO REQUEST: modular café walk grid and separate PBR parts', 'Illustrating request → model → evidence handoff using the café as an example.', 'Demo only. No geometry, doorway or material verification was executed.'],
    sweeper: ['DEMO REQUEST: Operation Sweeper board verification', 'Illustrating a proposed solver verification workflow.', 'Demo only. No board was solved and no solvability result was measured.'],
    beacon: ['DEMO REQUEST: valley signal receivers', 'Illustrating a request passing between local studio stations.', 'Demo only. No radio hardware, network endpoints or live signal receivers were contacted.']
  };
  $('relay-steps')?.setAttribute('aria-live', 'polite');
  $('relay-steps')?.setAttribute('aria-atomic', 'true');
  listen($('relay-send-btn'), 'click', () => {
    if (!canPlay('relay-tool')) return;
    stopRelay();
    const payload = relayPayloads[$('relay-preset')?.value] || relayPayloads.cafe;
    text('relay-req-out', payload[0]); text('relay-proc-out', 'Running local demonstration...');
    text('relay-ev-out', 'Simulation, not a real diagnostic.');
    $('relay-send-btn').disabled = true;
    relayTimer = setTimeout(() => {
      relayTimer = null;
      if (!canPlay('relay-tool')) return;
      text('relay-proc-out', payload[1]); text('relay-ev-out', payload[2]);
      $('relay-send-btn').disabled = false;
      playChime(659.25);
    }, 480);
  });
  function renderPractice() {
    const rhythm = practiceRhythm($('practice-slider')?.value ?? 60);
    text('practice-total-label', `${rhythm.total} MIN`);
    text('rhythm-practice', `${rhythm.practice} min`);
    text('rhythm-review', `${rhythm.review} min`);
    text('rhythm-breaks', `${rhythm.breaks} min`);
    $('practice-slider')?.setAttribute('aria-valuetext', `${rhythm.total} minutes: ${rhythm.practice} practice, ${rhythm.review} review, ${rhythm.breaks} breaks`);
  }
  listen($('practice-slider'), 'input', renderPractice);
  renderPractice(); renderHunt();
  const visibilityChanged = () => { if (document.hidden) { stopHunt(); stopRelay(); } };
  listen(document, 'visibilitychange', visibilityChanged);
  return {
    onPanelChange(id, open) {
      if (id === 'guild') guildOpen = open;
      else if (open) guildOpen = false;
      if (!guildOpen) { stopHunt(); stopRelay(); }
    },
    onVisibilityChange: visibilityChanged,
    destroy() {
      stopHunt(); stopRelay(); listeners.forEach(remove => remove());
      if (announcement?.id === 'hunt-announcement') announcement.remove();
    }
  };
}
