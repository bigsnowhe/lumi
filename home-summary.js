(()=>{
  const pad=n=>String(n).padStart(2,'0');
  const today=()=>localToday();
  const money=n=>`¥${Number(n||0).toLocaleString('zh-CN',{maximumFractionDigits:2})}`;
  const update=()=>{
    const date=today(),dayTasks=tasks.filter(t=>t.date===date),main=dayTasks.find(t=>!t.done)||dayTasks[0];
    document.querySelector('.hero h1').textContent=main?.n||'今天还没有排程。';
    document.querySelector('.hero-note').textContent=main?'来自今天的排程 · 完成后会继续显示下一件事。':'在周视图或待办任务里添加今天要做的事。';
    const done=document.querySelector('.metrics .metric:last-child');
    done.querySelector('.metric-value').textContent=dayTasks.length?`${dayTasks.filter(t=>t.done).length} / ${dayTasks.length}`:'—';
    done.querySelector('.metric-sub').textContent=dayTasks.length?'今日任务完成情况':'今天暂无任务';
    const seconds=(window.magicianTimeLogs||[]).filter(x=>x.date===date).reduce((n,x)=>n+Number(x.seconds||0),0);
    document.querySelector('#focusMetric').textContent=seconds?`${Math.floor(seconds/3600)}h ${pad(Math.floor(seconds%3600/60))}m`:'—';
    const month=date.slice(0,7),records=(window.magicianFinance||[]).filter(x=>x.date?.startsWith(month));
    const income=records.filter(x=>x.type==='income').reduce((n,x)=>n+Number(x.amount||0),0);
    const ads=records.filter(x=>x.type==='ads').reduce((n,x)=>n+Number(x.amount||0),0);
    const summary=document.querySelector('.metrics .metric:nth-child(3)');
    summary.querySelector('.metric-value').textContent=records.length?money(income-ads):'—';
    summary.querySelector('.metric-sub').textContent=records.length?`收入 ${money(income)} · 投流 ${money(ads)}`:'尚无记录';
    const finance=document.querySelector('.right .panel:last-child');
    finance.querySelector('.panel-head .subtle').textContent=`${Number(month.slice(5))} 月`;
    finance.querySelector('.finance-big').textContent=records.length?money(income-ads):'—';
    const lines=finance.querySelectorAll('.finance-row span:last-child');
    if(lines[0])lines[0].textContent=records.length?money(income):'—';
    if(lines[1])lines[1].textContent=records.length?money(ads):'—';
  };
  window.refreshMagicianSummary=update;
  update();
})();
