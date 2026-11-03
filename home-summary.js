(() => {
  const pad = n => String(n).padStart(2, '0');
  const money = n => `¥${Number(n || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;

  const update = () => {
    const date = localToday();
    const dayTasks = tasks.filter(t => t.date === date);
    const main = dayTasks.find(t => !t.done) || dayTasks[0];

    const hero = document.querySelector('.hero h1');
    if (hero) hero.textContent = main?.n || '今天还没有排程。';

    const focusSeconds = (window.magicianTimeLogs || []).filter(x => x.date === date).reduce((n, x) => n + Number(x.seconds || 0), 0);
    const note = document.querySelector('.hero-note');
    if (note) note.textContent = focusSeconds
      ? `今天已记录 ${Math.floor(focusSeconds / 3600)}h ${Math.floor(focusSeconds % 3600 / 60)}m`
      : (main ? '来自今天的排程 · 完成后会继续显示下一件事。' : '在周视图或待办任务里添加今天要做的事。');

    const progressMetric = document.querySelector('#progressMetric');
    const progressSub = document.querySelector('#progressSub');
    if (progressMetric) progressMetric.textContent = dayTasks.length ? `${dayTasks.filter(t => t.done).length} / ${dayTasks.length}` : '—';
    if (progressSub) progressSub.textContent = dayTasks.length ? '今日任务完成情况' : '今天暂无任务';

    document.querySelector('#focusMetric').textContent = focusSeconds ? `${Math.floor(focusSeconds / 3600)}h ${pad(Math.floor(focusSeconds % 3600 / 60))}m` : '—';

    const start = new Date(date + 'T12:00:00');
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const weekTasks = tasks.filter(t => { const d = new Date((t.date || '') + 'T12:00:00'); return d >= start && d < new Date(start.getTime() + 7 * 86400000) });
    const load = document.querySelector('.load-status');
    const loadSub = document.querySelector('.load .metric-sub');
    if (load) load.textContent = weekTasks.length ? `${weekTasks.length} 项` : '暂无安排';
    if (loadSub) loadSub.textContent = weekTasks.length
      ? `已完成 ${weekTasks.filter(t => t.done).length} 项 · ${Math.round(weekTasks.filter(t => t.done).length / weekTasks.length * 100)}%`
      : '本周还没有任务';

    const month = date.slice(0, 7);
    const records = (window.magicianFinance || []).filter(x => x.date?.startsWith(month));
    const income = records.filter(x => x.type === 'income').reduce((n, x) => n + Number(x.amount || 0), 0);
    const ads = records.filter(x => x.type === 'ads').reduce((n, x) => n + Number(x.amount || 0), 0);
    const financeMetric = document.querySelector('#financeMetric');
    const financeSub = document.querySelector('#financeSub');
    if (financeMetric) financeMetric.textContent = records.length ? money(income - ads) : '—';
    if (financeSub) financeSub.textContent = records.length ? `收入 ${money(income)} · 投流 ${money(ads)}` : '尚无记录';
    const finance = document.querySelector('.right .panel:last-child');
    if (finance) {
      finance.querySelector('.panel-head .subtle').textContent = `${Number(month.slice(5))} 月`;
      finance.querySelector('.finance-big').textContent = records.length ? money(income - ads) : '—';
      const lines = finance.querySelectorAll('.finance-row span:last-child');
      if (lines[0]) lines[0].textContent = records.length ? money(income) : '—';
      if (lines[1]) lines[1].textContent = records.length ? money(ads) : '—';
    }
  };

  window.refreshMagicianSummary = update;
  update();
})();
