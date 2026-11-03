(()=>{
  const categories=['有效时间','体态锻炼','美妆账号','知识付费','其他工作项目','休息 / 娱乐'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pad=n=>String(n).padStart(2,'0');
  const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const startOfWeek=d=>{const x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x};
  const fmtH=n=>{const h=Math.floor(n/3600),m=Math.floor(n%3600/60);return h?`${h}h ${pad(m)}m`:`${m}m`};
  const hours=n=>`${(n/3600).toFixed(1)} 小时`;
  const logs=()=>Array.isArray(window.magicianTimeLogs)?window.magicianTimeLogs:[];
  window.magicianWeeklyReviews=(()=>{try{return JSON.parse(localStorage.getItem('magician-weekly-reviews')||'{}')}catch{return {}}})();
  let chosenMonth=iso(calendarDate).slice(0,7),chosenCategory='有效时间';
  const heatColors=[
    {min:0,bg:'#f0ede6',fg:'#a8a498'},
    {min:0.01,bg:'#dce8d4',fg:'#5e7a52'},
    {min:1800,bg:'#b8d4a8',fg:'#3d6635'},
    {min:3600,bg:'#8ec48b',fg:'#fff'},
    {min:7200,bg:'#5a9e56',fg:'#fff'},
    {min:10800,bg:'#3a7d3a',fg:'#fff'},
    {min:14400,bg:'#1e5c2a',fg:'#fff'}
  ];
  const heatStyle=secs=>{
    let chosen=heatColors[0];
    for(const c of heatColors)if(secs>=c.min)chosen=c;
    return `background:${chosen.bg};color:${chosen.fg}`;
  };
  function categoryFor(log){
    if(categories.includes(log.category))return log.category;
    const name=String(log.activity||log.name||'');
    const matched=tasks.find(t=>t.n===name||name.includes(t.n)||t.n.includes(name));
    if(matched?.cat)return matched.cat;
    if(/休息|娱乐|电影|手账|钢琴|吉他|聚会|游戏/.test(name))return '休息 / 娱乐';
    if(/力量|训练|有氧|普拉提|锻炼|散步|做饭|备餐|采购|库存|瑜伽/.test(name))return '体态锻炼';
    if(/课程|直播|学员|知识付费/.test(name))return '知识付费';
    if(/合作|商务|文创|代购|表格|出差|师傅/.test(name))return '其他工作项目';
    return classifyTask(name,new Date((log.date||iso(calendarDate))+'T12:00:00')).cat;
  }
  function projectEstimates(){
    const all=logs();if(!all.length)return '';
    const byActivity={};
    all.forEach(x=>{const name=String(x.activity||x.name||'').trim();if(!name)return;if(!byActivity[name])byActivity[name]={total:0,count:0,units:0};const q=Number(x.qty)||1;byActivity[name].total+=Number(x.seconds||0);byActivity[name].count++;byActivity[name].units+=q});
    const sorted=Object.entries(byActivity).sort((a,b)=>b[1].total-a[1].total).slice(0,10);
    if(!sorted.length)return '';
    return `<div class="module-card"><h3>项目时间估算</h3><p style="font-size:12px;color:var(--muted);margin-bottom:10px">基于历史记录的平均单件用时</p><table style="width:100%;border-collapse:collapse;font-size:12px">${sorted.map(([name,d])=>`<tr style="border-bottom:1px solid var(--line)"><td style="padding:7px 4px">${esc(name)}</td><td style="padding:7px 4px;text-align:right;white-space:nowrap;color:#5a7a5e">${fmtH(Math.round(d.total/d.units))}/件</td><td style="padding:7px 4px;text-align:right;white-space:nowrap;color:var(--muted)">${d.units} 件</td><td style="padding:7px 4px;text-align:right;white-space:nowrap">${fmtH(d.total)}</td></tr>`).join('')}</table></div>`;
  }
  function dayDetailHtml(date,allLogs){
    const dayLogs=allLogs.filter(x=>x.date===date);
    if(!dayLogs.length)return `<div class="module-card" id="dayDetail"><h3>${date}</h3><p style="font-size:13px;color:var(--muted)">这天没有时间记录</p></div>`;
    const byAct={};dayLogs.forEach(x=>{const name=String(x.activity||x.name||'').trim()||'未命名';if(!byAct[name])byAct[name]={secs:0,qty:0};byAct[name].secs+=Number(x.seconds||0);byAct[name].qty+=Number(x.qty)||1});
    const sorted=Object.entries(byAct).sort((a,b)=>b[1].secs-a[1].secs);
    const total=dayLogs.reduce((n,x)=>n+Number(x.seconds||0),0);
    return `<div class="module-card" id="dayDetail"><h3>${date}</h3><p style="font-size:13px;color:#314b36;font-weight:600;margin-bottom:8px">共 ${fmtH(total)}</p><table style="width:100%;border-collapse:collapse;font-size:12px">${sorted.map(([name,d])=>{const pct=total?Math.round(d.secs/total*100):0;return `<tr style="border-bottom:1px solid var(--line)"><td style="padding:6px 4px">${esc(name)}</td><td style="padding:6px 4px;text-align:right;white-space:nowrap">${fmtH(d.secs)}</td><td style="padding:6px 4px;text-align:right;white-space:nowrap;color:var(--muted)">${pct}%</td></tr>`}).join('')}</table></div>`;
  }
  function showReview(){
    document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.module==='review'));
    homeContent.style.display='none';modulePanel.classList.add('open');
    const first=new Date(chosenMonth+'-01T12:00:00'),days=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();
    const all=logs().filter(x=>x.date?.startsWith(chosenMonth));
    const selected=chosenCategory==='有效时间'?all:all.filter(x=>categoryFor(x)===chosenCategory);
    const totals={};selected.forEach(x=>totals[x.date]=(totals[x.date]||0)+Number(x.seconds||0));
    const total=selected.reduce((n,x)=>n+Number(x.seconds||0),0);
    const offset=(first.getDay()+6)%7;
    const cells=Array(offset).fill('<span></span>');
    for(let day=1;day<=days;day++){const date=`${chosenMonth}-${pad(day)}`,secs=totals[date]||0;cells.push(`<div data-heat-date="${date}" title="${date} · ${hours(secs)}" style="height:32px;border-radius:6px;${heatStyle(secs)};display:grid;place-items:center;font-size:11px;font-weight:500;transition:transform .1s;cursor:pointer" onmouseenter="this.style.transform='scale(1.1)'" onmouseleave="this.style.transform=''">${day}</div>`)}
    const weekStart=startOfWeek(calendarDate),weekKey=iso(weekStart),weekEnd=new Date(weekStart);weekEnd.setDate(weekEnd.getDate()+6);
    const weekLogs=logs().filter(x=>x.date>=weekKey&&x.date<=iso(weekEnd));
    const done=tasks.filter(t=>t.done&&t.date>=weekKey&&t.date<=iso(weekEnd)).length;
    const legendLabels=['','30m','1h','2h','3h','4h+'];
    const legendHtml=`<div style="display:flex;gap:2px;align-items:flex-end;margin-top:10px;font-size:10px;color:var(--muted)"><span style="margin-right:2px">少</span>${heatColors.slice(1).map((c,i)=>`<div style="display:flex;flex-direction:column;align-items:center;gap:2px"><span style="font-size:9px;color:var(--muted)">${legendLabels[i]}</span><span style="display:inline-block;width:16px;height:16px;border-radius:3px;background:${c.bg}"></span></div>`).join('')}<span style="margin-left:2px">多</span></div>`;
    modulePanel.innerHTML=`<div class="module-head"><div><h2>每周复盘</h2><p>用真实记录看见自己的节奏。</p></div><button class="back-home" id="reviewBack">← 主线一览</button></div><div class="module-grid" style="grid-template-columns:1fr 360px"><div class="module-card"><h3>时间热力图</h3><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:12px 0"><input id="reviewMonth" type="month" value="${chosenMonth}" style="padding:8px;border:1px solid var(--line);border-radius:7px"><select id="reviewCategory" style="padding:8px;border:1px solid var(--line);border-radius:7px">${categories.map(c=>`<option ${c===chosenCategory?'selected':''}>${esc(c)}</option>`).join('')}</select><span style="margin-left:auto;font-size:13px;color:#314b36;font-weight:600">本月 ${hours(total)}</span></div><div id="heatGrid" style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;max-width:560px"><div style="grid-column:1/-1;display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-size:11px;color:#8b8b82"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>${cells.join('')}</div>${legendHtml}</div><div id="dayDetailWrap">${dayDetailHtml(iso(new Date()),all)}</div>${projectEstimates()}<div class="module-card"><h3>${weekKey} — ${iso(weekEnd)}</h3><p>完成任务 <b>${done}</b> 件 · 记录时间 <b>${hours(weekLogs.reduce((n,x)=>n+Number(x.seconds||0),0))}</b></p><p style="font-size:12px;color:var(--muted)">各类时长依据现有计时事项自动归类。</p></div><div class="module-card"><h3>写下这周的复盘</h3><form id="reviewForm"><textarea name="note" rows="7" placeholder="这周完成了什么？有什么值得保留或调整？" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;resize:vertical;font:inherit">${esc(window.magicianWeeklyReviews[weekKey]||'')}</textarea><button class="add" style="margin-top:9px">保存复盘</button></form></div></div>`;
    modulePanel.querySelector('#reviewBack').onclick=()=>openModule('home');
    const reviewForm=modulePanel.querySelector('#reviewForm');
    reviewForm.insertAdjacentHTML('afterbegin','<p style="margin:0 0 8px;color:#777e75;font-size:12px">先让 Lumi 起草，再修改成你的最终版本。</p><button type="button" id="draftReview" class="back-home" style="margin-bottom:12px">✦ Lumi 生成草稿</button><p id="draftStatus" style="margin:0 0 10px;font-size:12px;color:#797d73"></p>');
    modulePanel.querySelector('#draftReview').onclick=async()=>{
      const area=reviewForm.querySelector('textarea'),status=modulePanel.querySelector('#draftStatus');
      if(area.value.trim()&&!confirm('当前编辑框已有内容。生成新草稿会替换编辑框内容，已保存的最终复盘不会改变。继续吗？'))return;
      if(!cloudSession?.access_token){status.textContent='请先登录，Lumi 才能生成草稿。';return}
      const btn=modulePanel.querySelector('#draftReview');btn.disabled=true;status.textContent='Lumi 正在根据本周记录起草…';
      const weekTasks=tasks.filter(t=>t.date>=weekKey&&t.date<=iso(weekEnd)).map(t=>({date:t.date,name:t.n,category:t.cat,completed:!!t.done}));
      const timeEntries=weekLogs.map(x=>({date:x.date,activity:x.activity,category:categoryFor(x),minutes:Math.round(Number(x.seconds||0)/60)}));
      try{
        const prompt=`请为 ${weekKey} 至 ${iso(weekEnd)} 写一份第一人称中文每周复盘草稿。只依据以下真实记录，不虚构成果、工时或感受。结构为：本周完成、时间分配与锻炼、未完成与阻碍、下周建议。语气具体、温和、简洁。若记录不足，请明确指出并留下可由我填写的提示。任务：${JSON.stringify(weekTasks)}。计时：${JSON.stringify(timeEntries)}。`;
        const response=await fetch(`${CLOUD_URL}/functions/v1/lumi-ai`,{method:'POST',headers:{apikey:CLOUD_KEY,Authorization:`Bearer ${cloudSession.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({prompt,context:{tasks:weekTasks,timeLogs:timeEntries,mode:'weekly_review_draft'}})});
        const data=await response.json();if(!response.ok)throw new Error(data.error||`请求失败 ${response.status}`);
        const draft=typeof data.reply==='string'?data.reply:typeof data.text==='string'?data.text:typeof data.content==='string'?data.content:'';
        if(!draft.trim())throw new Error('Lumi 没有返回可编辑的复盘文字');
        area.value=draft;status.textContent='草稿已放入编辑框。修改后再点「保存最终复盘」。';
      }catch(err){status.textContent=`生成失败：${err.message||'请稍后重试'}`}finally{btn.disabled=false}
    };
    modulePanel.querySelector('#heatGrid').onclick=e=>{const cell=e.target.closest('[data-heat-date]');if(!cell)return;const date=cell.dataset.heatDate;const wrap=modulePanel.querySelector('#dayDetailWrap');if(wrap)wrap.innerHTML=dayDetailHtml(date,all);modulePanel.querySelectorAll('[data-heat-date]').forEach(c=>c.style.outline='');cell.style.outline='2px solid #5a9e56'};
    modulePanel.querySelector('#reviewMonth').onchange=e=>{chosenMonth=e.target.value;showReview()};
    modulePanel.querySelector('#reviewCategory').onchange=e=>{chosenCategory=e.target.value;showReview()};
    reviewForm.querySelector('button[type="submit"],button.add').textContent='保存最终复盘';
    reviewForm.onsubmit=e=>{e.preventDefault();window.magicianWeeklyReviews[weekKey]=new FormData(e.target).get('note').trim();localStorage.setItem('magician-weekly-reviews',JSON.stringify(window.magicianWeeklyReviews));pushCloud?.();toast('最终复盘已保存在本机；请查看同步状态')};
  }
  const previousOpen=openModule;
  openModule=key=>key==='review'?showReview():previousOpen(key);
  document.querySelectorAll('.nav button').forEach(btn=>btn.onclick=()=>openModule(btn.dataset.module));
})();
