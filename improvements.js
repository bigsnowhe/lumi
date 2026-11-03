(() => {
  const pad = n => String(n).padStart(2, '0');

  // Quote: show once per day
  const shown = localStorage.getItem('magician-quote-date');
  if (shown !== localToday()) {
    document.querySelector('#modal')?.classList.add('open');
    localStorage.setItem('magician-quote-date', localToday());
  }

  // Reusable modal helper
  const modal = (title, body, onSave) => {
    const overlay = document.createElement('div');
    overlay.className = 'task-edit-overlay';
    overlay.innerHTML = `<div class="task-edit-card"><h2>${title}</h2><form>${body}<div class="task-edit-actions"><button type="button" data-cancel>取消</button><button class="save" type="submit">保存</button></div></form></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('[data-cancel]').onclick = () => overlay.remove();
    overlay.onclick = e => { if (e.target === overlay) overlay.remove() };
    overlay.querySelector('form').onsubmit = e => { e.preventDefault(); if (onSave(new FormData(e.target)) !== false) overlay.remove() };
    overlay.querySelector('input')?.focus();
  };

  // New task: form modal
  document.querySelector('#addTask').onclick = () => modal('新任务',
    `<label>任务名称<input name="name" required placeholder="今天要做什么？"></label><label>日期<input name="date" type="date" required value="${fmt(calendarDate)}"></label><label>状态<select name="done"><option value="0">待完成</option><option value="1">已完成</option></select></label><label style="display:flex;align-items:center;gap:6px;margin-top:4px"><input type="checkbox" name="minor" value="1" style="width:auto"> 小事（紧凑显示，不占卡片空间）</label>`,
    f => {
      const n = String(f.get('name') || '').trim(), date = String(f.get('date') || '');
      if (!n || !date) return false;
      const type = classifyTask(n, new Date(date + 'T12:00:00'));
      tasks.push({ id: Date.now(), date, n, ...type, done: f.get('done') === '1', minor: !!f.get('minor') });
      render(); pushCloud?.(); toast(`已加入计划 · ${type.cat}`);
    });

  // Manual time entry: form modal
  manualTime.onclick = () => modal('补记时间',
    `<label>日期<input name="date" type="date" required value="${localToday()}"></label><label>做了什么<input name="activity" required placeholder="例如：商单拍摄"></label><label>时长（分钟）<input name="minutes" type="number" min="1" max="1440" required placeholder="例如：60"></label>`,
    f => {
      const date = String(f.get('date') || ''), activity = String(f.get('activity') || '').trim(), minutes = Number(f.get('minutes'));
      if (!date || !activity || !Number.isFinite(minutes) || minutes <= 0 || minutes > 1440) return false;
      window.magicianTimeLogs.unshift({ id: Date.now(), date, activity, seconds: Math.round(minutes * 60), manual: true });
      saveTimeLogs(); refreshTimeHint(); toast(`已补记 ${activity} · ${minutes} 分钟`);
    });

  // Timer: populate datalist from today's tasks
  const timerList = document.querySelector('#timerTaskList');
  const refreshOptions = () => {
    if (!timerList) return;
    const names = [...new Set([...tasks.filter(t => t.date === localToday() && !t.done).map(t => t.n), '力量训练', '有氧', '做饭', '写脚本', '找素材', '拍摄', '剪辑', '弹钢琴'])];
    timerList.replaceChildren(...names.map(n => { const o = document.createElement('option'); o.value = n; return o }));
  };
  const _render = render;
  render = () => { _render(); refreshOptions() };
  refreshOptions();

  // Recurring tasks: materialize templates into actual task instances
  const materialize = () => {
    if (typeof cloudReady !== 'undefined' && !cloudReady) return;
    let changed = false;
    const start = new Date(localToday() + 'T12:00:00');
    for (const rule of tasks.filter(t => t.isRecurringTemplate && Array.isArray(t.repeatDays))) {
      for (let i = 0; i < 28; i++) {
        const d = new Date(start); d.setDate(d.getDate() + i);
        if (!rule.repeatDays.includes(d.getDay())) continue;
        const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const id = `${rule.id}-${date}`;
        if (tasks.some(t => String(t.id) === id)) continue;
        if (tasks.some(t => t.date === date && t.n === rule.n)) continue;
        if ((window.magicianTrash || []).some(t => String(t.id) === id)) continue;
        const type = rule.c && rule.cat ? { c: rule.c, cat: rule.cat } : classifyTask(rule.n, d);
        tasks.push({ id, recurringId: rule.id, date, n: rule.n, ...type, done: false }); changed = true;
      }
    }
    if (changed) { localStorage.setItem('magician-tasks', JSON.stringify(tasks)); render(); pushCloud?.() }
  };
  window.materializeRecurringTasks = materialize;
  setInterval(materialize, 60000); setTimeout(materialize, 3000);

  // Module panel: wire editing for inventory, recipes, finance, recurring templates
  const panel = document.querySelector('#modulePanel');
  const wireEdits = () => {
    if (!panel.classList.contains('open')) return;
    const heading = panel.querySelector('.module-head h2')?.textContent;

    if (heading === '待办任务' && !panel.querySelector('#repeatCard')) {
      const board = panel.querySelector('.todo-board') || panel.querySelector('.module-grid');
      if (board) {
        const card = document.createElement('div');
        card.className = 'module-card'; card.id = 'repeatCard';
        card.innerHTML = '<h3>固定日程</h3><p>选好每周重复的日子，未来四周会自动加入日程。</p>'
          + '<form id="repeatForm"><input name="name" required placeholder="例如：力量训练" style="width:100%;padding:10px;margin-bottom:8px">'
          + '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:8px">'
          + ['日','一','二','三','四','五','六'].map((x, i) => `<label><input type="checkbox" name="day" value="${i}">周${x}</label>`).join('')
          + '</div><button class="add">添加固定日程</button></form><div id="repeatList"></div>';
        board.insertBefore(card, board.children[1]);
        card.querySelector('form').onsubmit = e => {
          e.preventDefault();
          const f = new FormData(e.target), name = String(f.get('name') || '').trim(), days = f.getAll('day').map(Number);
          if (!name || !days.length) { toast('请填写名称并选择星期'); return }
          tasks.push({ id: `repeat-${Date.now()}`, n: name, isRecurringTemplate: true, repeatDays: days });
          localStorage.setItem('magician-tasks', JSON.stringify(tasks)); materialize(); pushCloud?.(); openModule('inbox');
        };
        const list = card.querySelector('#repeatList');
        for (const rule of tasks.filter(t => t.isRecurringTemplate)) {
          const row = document.createElement('p');
          row.textContent = `${rule.n} · ${rule.repeatDays.map(d => '日一二三四五六'[d]).join('、')}`;
          const btn = document.createElement('button'); btn.type = 'button'; btn.textContent = '停止重复';
          btn.onclick = () => { tasks.splice(tasks.indexOf(rule), 1); localStorage.setItem('magician-tasks', JSON.stringify(tasks)); pushCloud?.(); openModule('inbox') };
          row.append(' ', btn); list.append(row);
        }
      }
    }

    if (heading === '菜谱与库存') {
      panel.querySelectorAll('.stock-row').forEach(row => {
        if (row.dataset.editReady) return; row.dataset.editReady = '1';
        row.querySelector('.stock-name')?.addEventListener('click', () => {
          const i = Number(row.dataset.stockIndex), item = window.magicianInventory[i];
          if (!item) return;
          modal('编辑库存', `<label>食材名称<input name="name" required></label><label>数量<input name="amount" required></label>`, f => {
            item.name = String(f.get('name')).trim(); item.amount = String(f.get('amount')).trim();
            localStorage.setItem('magician-inventory', JSON.stringify(window.magicianInventory)); pushCloud?.(); openModule('food');
          });
          const fields = document.querySelectorAll('.task-edit-overlay input');
          fields[0].value = item.name; fields[1].value = item.amount;
        });
      });
      const recipes = panel.querySelector('.module-card:first-of-type .inventory-list');
      recipes?.querySelectorAll('li').forEach((row, i) => {
        if (row.dataset.editReady) return; row.dataset.editReady = '1'; row.style.cursor = 'pointer';
        row.onclick = () => {
          const item = window.magicianRecipes[i]; if (!item) return;
          modal('编辑菜谱', `<label>菜名<input name="name" required></label><label>食材<input name="ingredients"></label>`, f => {
            item.name = String(f.get('name')).trim(); item.ingredients = String(f.get('ingredients')).trim();
            localStorage.setItem('magician-recipes', JSON.stringify(window.magicianRecipes)); pushCloud?.(); openModule('food');
          });
          const fields = document.querySelectorAll('.task-edit-overlay input');
          fields[0].value = item.name; fields[1].value = item.ingredients || '';
        };
      });
    }

    if (heading === 'Finance') {
      const month = fmt(calendarDate).slice(0, 7);
      const items = window.magicianFinance.map((x, i) => ({ ...x, i })).filter(x => x.date?.startsWith(month)).reverse();
      const card = [...panel.querySelectorAll('.module-card')].find(x => x.querySelector('h3')?.textContent === '记录');
      card?.querySelectorAll('.inventory-list li').forEach((row, i) => {
        if (row.dataset.editReady) return; row.dataset.editReady = '1'; row.style.cursor = 'pointer';
        row.onclick = () => {
          const item = window.magicianFinance[items[i].i];
          modal('编辑记录', `<label>金额<input name="amount" type="number" min="0.01" step="0.01" required></label><label>日期<input name="date" type="date" required></label><label>备注<input name="note"></label>`, f => {
            item.amount = Number(f.get('amount')); item.date = String(f.get('date')); item.note = String(f.get('note')).trim();
            localStorage.setItem('magician-finance', JSON.stringify(window.magicianFinance)); pushCloud?.(); openModule('finance'); window.refreshMagicianSummary?.();
          });
          const fields = document.querySelectorAll('.task-edit-overlay input');
          fields[0].value = item.amount; fields[1].value = item.date; fields[2].value = item.note || '';
        };
      });
    }
  };
  new MutationObserver(() => queueMicrotask(wireEdits)).observe(panel, { childList: true, subtree: false });
  wireEdits();
})();
