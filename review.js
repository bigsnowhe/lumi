(()=>{
  const categories=['有效时间','体态锻炼','美妆账号','知识付费','其他工作项目','休息 / 娱乐'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pad=n=>String(n).padStart(2,'0');
  const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const startOfWeek=d=>{const x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x};
  const hours=n=>`${(n/3600).toFixed(1)} 小时`;
  const logs=()=>Array.isArray(window.magicianTimeLogs)?window.magicianTimeLogs:[];
  window.magicianWeeklyReviews=(()=>{try{return JSON.parse(localStorage.getItem('magician-weekly-reviews')||'{}')}catch{return {}}})();
  let chosenMonth=iso(calendarDate).slice(0,7),chosenCategory='有效时间';
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
  function showReview(){
    document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.module==='review'));
    homeContent.style.display='none';modulePanel.classList.add('open');
    const first=new Date(chosenMonth+'-01T12:00:00'),days=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();
    const all=logs().filter(x=>x.date?.startsWith(chosenMonth));
    const selected=chosenCategory==='有效时间'?all:all.filter(x=>categoryFor(x)===chosenCategory);
    const totals={};selected.forEach(x=>totals[x.date]=(totals[x.date]||0)+Number(x.seconds||0));
    const total=selected.reduce((n,x)=>n+Number(x.seconds||0),0),max=Math.max(3600,...Object.values(totals));
    const offset=(first.getDay()+6)%7;
    const cells=Array(offset).fill('<span></span>');
    for(let day=1;day<=days;day++){const date=`${chosenMonth}-${pad(day)}`,secs=totals[date]||0,opacity=secs?Math.max(.25,Math.min(1,secs/max)):.08;cells.push(`<div title="${date} · ${hours(secs)}" style="height:30px;border-radius:5px;background:rgba(66,109,75,${opacity});display:grid;place-items:center;color:${opacity>.52?'white':'#667363'};font-size:11px">${day}</div>`)}
    const weekStart=startOfWeek(calendarDate),weekKey=iso(weekStart),weekEnd=new Date(weekStart);weekEnd.setDate(weekEnd.getDate()+6);
    const weekLogs=logs().filter(x=>x.date>=weekKey&&x.date<=iso(weekEnd));
    const done=tasks.filter(t=>t.done&&t.date>=weekKey&&t.date<=iso(weekEnd)).length;
    modulePanel.innerHTML=`<div class="module-head"><div><h2>每周复盘</h2><p>用真实记录看见自己的节奏。</p></div><button class="back-home" id="reviewBack">← 主线一览</button></div><div class="module-grid"><div class="module-card" style="grid-column:1/-1"><h3>时间热力图</h3><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:12px 0"><input id="reviewMonth" type="month" value="${chosenMonth}" style="padding:8px;border:1px solid var(--line);border-radius:7px"><select id="reviewCategory" style="padding:8px;border:1px solid var(--line);border-radius:7px">${categories.map(c=>`<option ${c===chosenCategory?'selected':''}>${esc(c)}</option>`).join('')}</select><span style="margin-left:auto;font-size:13px;color:#314b36">本月 ${hours(total)}</span></div><div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;max-width:560px"><div style="grid-column:1/-1;display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-size:11px;color:#8b8b82"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>${cells.join('')}</div><p style="margin-top:13px">颜色越深，表示当天记录的时间越多；空白表示没有计时记录。</p></div><div class="module-card"><h3>${weekKey} — ${iso(weekEnd)}</h3><p>完成任务 ${done} 件 · 记录时间 ${hours(weekLogs.reduce((n,x)=>n+Number(x.seconds||0),0))}</p><p>各类时长依据现有计时事项自动归类。</p></div><div class="module-card"><h3>写下这周的复盘</h3><form id="reviewForm"><textarea name="note" rows="7" placeholder="这周完成了什么？有什么值得保留或调整？" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;resize:vertical;font:inherit">${esc(window.magicianWeeklyReviews[weekKey]||'')}</textarea><button class="add" style="margin-top:9px">保存复盘</button></form></div></div>`;
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
    modulePanel.querySelector('#reviewMonth').onchange=e=>{chosenMonth=e.target.value;showReview()};
    modulePanel.querySelector('#reviewCategory').onchange=e=>{chosenCategory=e.target.value;showReview()};
    reviewForm.querySelector('button[type="submit"],button.add').textContent='保存最终复盘';
    reviewForm.onsubmit=e=>{e.preventDefault();window.magicianWeeklyReviews[weekKey]=new FormData(e.target).get('note').trim();localStorage.setItem('magician-weekly-reviews',JSON.stringify(window.magicianWeeklyReviews));pushCloud?.();toast('最终复盘已保存在本机；请查看同步状态')};
  }
  const previousOpen=openModule;
  openModule=key=>key==='review'?showReview():previousOpen(key);
  document.querySelectorAll('.nav button').forEach(btn=>btn.onclick=()=>openModule(btn.dataset.module));
})();
