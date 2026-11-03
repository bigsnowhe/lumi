(()=>{
  const capacityKey='magician-weekly-capacity-hours';
  const normalized=s=>String(s||'').toLowerCase().replace(/[\s·•，,。()（）/+-]/g,'');
  const capacity=()=>{const value=Number(localStorage.getItem(capacityKey));return Number.isFinite(value)&&value>0?value:31};
  const hours=n=>`${Number(n.toFixed(1))}h`;
  const defaults=task=>{
    const name=String(task.n||''),category=task.cat||'';
    if(category==='休息 / 娱乐'||task.c==='rest')return 0;
    if(/脚本|大纲/.test(name))return 1;
    if(/剪辑|剪片|剪视频/.test(name))return 2.5;
    if(/拍摄|直播/.test(name))return 2;
    if(/选题会|课程内容|合作项目|出差/.test(name))return 2;
    if(/素材|采购|补充库存|备餐/.test(name))return 1.5;
    if(/发布|封面|数据复盘|商务沟通/.test(name))return 0.75;
    if(category==='体态锻炼'||task.c==='health')return 1;
    return 1.5;
  };
  const estimate=(task,logs)=>{
    const planned=Number(task.plannedMinutes||0)/60||Number(task.plannedHours||task.planHours||0);
    if(Number.isFinite(planned)&&planned>0)return {value:planned,rough:false};
    const matches=logs.filter(log=>normalized(log.activity)===normalized(task.n)&&Number(log.seconds)>0);
    const sameDay=matches.filter(log=>log.date===task.date).reduce((sum,log)=>sum+Number(log.seconds)/3600,0);
    if(task.done&&sameDay>0)return {value:sameDay,rough:false};
    if(matches.length){const samples=matches.map(log=>Number(log.seconds)/3600).sort((a,b)=>a-b);return {value:samples[Math.floor(samples.length/2)],rough:samples.length<3}}
    return {value:defaults(task),rough:true};
  };
  const update=()=>{
    const date=new Date(`${localToday()}T12:00:00`);
    date.setDate(date.getDate()-((date.getDay()+6)%7));
    const end=new Date(date);end.setDate(end.getDate()+7);
    const week=(tasks||[]).filter(task=>!task.isRecurringTemplate&&task.date&&(()=>{const day=new Date(`${task.date}T12:00:00`);return day>=date&&day<end})());
    const load=document.querySelector('.load-status'),sub=document.querySelector('.load .metric-sub');
    if(!load||!sub)return;
    if(!week.length){load.textContent='暂无安排';sub.textContent='有排程后会估算本周负荷';return}
    const logs=window.magicianTimeLogs||[];
    const estimates=week.map(task=>estimate(task,logs));
    const total=estimates.reduce((sum,item)=>sum+item.value,0),available=capacity();
    load.textContent=total<available*0.7?'偏松':total<=available?'正常':'过载';
    load.style.color=total>available?'#a96d60':'#49604a';
    sub.textContent=`${week.length} 项 · 预计 ${hours(total)} / 可用 ${hours(available)}${estimates.some(x=>x.rough)?' · 粗估':''}`;
  };
  const previous=window.refreshMagicianSummary;
  window.refreshMagicianSummary=()=>{previous?.();update()};
  const label=document.querySelector('.load .metric-label');
  if(label){const edit=document.createElement('button');edit.type='button';edit.textContent='调整';edit.title='调整每周可用时长';edit.style.cssText='margin-left:7px;color:#6d806d;text-decoration:underline;font-size:11px';edit.onclick=()=>{
    const overlay=document.createElement('div');overlay.className='task-edit-overlay';
    overlay.innerHTML='<div class="task-edit-card"><h2>每周可用时长</h2><p>用于判断本周是偏松、正常还是过载。</p><form><label>小时<input name="hours" type="number" min="1" max="100" step="0.5" required></label><div class="task-edit-actions"><button type="button" data-cancel>取消</button><button class="save" type="submit">保存</button></div></form></div>';
    document.body.appendChild(overlay);overlay.querySelector('input').value=capacity();overlay.querySelector('input').focus();
    overlay.querySelector('[data-cancel]').onclick=()=>overlay.remove();overlay.onclick=event=>{if(event.target===overlay)overlay.remove()};
    overlay.querySelector('form').onsubmit=event=>{event.preventDefault();const value=Number(new FormData(event.target).get('hours'));if(!Number.isFinite(value)||value<1||value>100)return;localStorage.setItem(capacityKey,String(value));overlay.remove();update();pushCloud?.()};
  };label.appendChild(edit)}
  update();
  setInterval(()=>window.refreshMagicianSummary?.(),60000);
})();
