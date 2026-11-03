(()=>{
  const pad=n=>String(n).padStart(2,'0');
  const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const plus=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
  const monday=d=>{const x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x};
  const taskFor=(date,index)=>tasks.filter(t=>t.date===iso(date)||(!t.date&&t.d===index)).sort((a,b)=>(a.order||0)-(b.order||0));
  const cn=['一','二','三','四','五','六','日'];

  render=()=>{
    const start=monday(calendarDate), title=document.querySelector('#viewTitle');
    document.querySelector('.topbar .date').textContent=new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(new Date());
    document.querySelector('.side-bottom').innerHTML=`${calendarDate.getMonth()+1} 月 · 第 ${Math.ceil((calendarDate.getDate()+((new Date(calendarDate.getFullYear(),calendarDate.getMonth(),1).getDay()+6)%7))/7)} 周<br>从无到有，日日成型。`;
    document.querySelectorAll('.view-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    if(view==='week'){
      const end=plus(start,6); title.textContent=`${start.getMonth()+1} 月 ${start.getDate()} 日 — ${end.getMonth()+1} 月 ${end.getDate()} 日`;
      week.className='week';
      week.innerHTML=cn.map((name,i)=>{
        const date=plus(start,i),today=iso(date)===iso(new Date());
        const list=taskFor(date,i);
        const dow=date.getDay(),isTrainDay=[1,2,4,5].includes(dow);
        const tidx=list.findIndex(t=>t.n==='锻炼'),train=tidx>=0?list[tidx]:null;
        const rest=train?list.filter((_,j)=>j!==tidx):list;
        const done=list.filter(t=>t.done).length,total=list.length;
        const trainHtml=train?`<div class="training-slot">${taskCard(train)}</div>`:isTrainDay?`<div class="training-slot placeholder"><span class="ts-tag">🏋️ 锻炼</span></div>`:`<div class="training-slot off"></div>`;
        const progress=total?`<span class="day-progress">${done}/${total}</span>`:'';
        return `<div class="day ${today?'today':''}" data-day="${i}" data-date="${iso(date)}"><div class="day-title">周${name}<strong>${date.getDate()}</strong>${progress}</div>${trainHtml}${rest.map(t=>taskCard(t)).join('')||'<div class="empty">留一点空白</div>'}</div>`
      }).join('');
    } else if(view==='day'){
      title.textContent=`${calendarDate.getFullYear()} 年 ${calendarDate.getMonth()+1} 月 ${calendarDate.getDate()} 日`;
      const list=taskFor(calendarDate,0);
      week.className='day-view';week.innerHTML=`<div class="day-hero"><div class="day-date">${pad(calendarDate.getDate())}<br><small>${['SUN','MON','TUE','WED','THU','FRI','SAT'][calendarDate.getDay()]}</small></div><div><b>今天的计划</b><p>把重要的事，留在清醒的时间做。</p></div></div><div class="day-list" data-day="0" data-date="${iso(calendarDate)}">${list.map(t=>`<div class="day-row">${taskCard(t)}<span>⠿</span></div>`).join('')||'<div class="empty">今天留一点空白</div>'}</div>`;
    } else {
      const first=new Date(calendarDate.getFullYear(),calendarDate.getMonth(),1,12),gridStart=monday(first); title.textContent=`${first.getFullYear()} 年 ${first.getMonth()+1} 月`;
      const cells=[];for(let i=0;i<42;i++){const date=plus(gridStart,i),same=date.getMonth()===first.getMonth(),list=taskFor(date,i);cells.push(`<div class="month-cell ${iso(date)===iso(new Date())?'today':''} ${same?'':'muted-cell'}" data-day="${i}" data-date="${iso(date)}"><span class="month-date">${date.getDate()}</span>${list.map(t=>taskCard(t,true)).join('')}</div>`)}
      week.className='month-grid';week.innerHTML=`<div class="month-days">一 二 三 四 五 六 日</div><div class="month-cells">${cells.join('')}</div>`;
    }
    bindTasks();window.refreshMagicianSummary?.();
  };

  bindTasks=()=>{
    document.querySelectorAll('.task').forEach(el=>{
      const check=el.querySelector('.check');check?.addEventListener('pointerdown',e=>e.stopPropagation());
      check?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const t=tasks.find(x=>String(x.id)===el.dataset.id);if(!t)return;t.done=!t.done;localStorage.setItem('magician-tasks',JSON.stringify(tasks));render();pushCloud?.();toast(t.done?'完成啦，做得好。':'已标记为未完成')});
      el.addEventListener('dragstart',e=>{if(e.target.closest('.check')){e.preventDefault();return}e.dataTransfer.setData('task',el.dataset.id)});
    });
    document.querySelectorAll('[data-date]').forEach(target=>{
      target.addEventListener('dragover',e=>{e.preventDefault();target.classList.add('dragover')});
      target.addEventListener('dragleave',()=>target.classList.remove('dragover'));
      target.addEventListener('drop',e=>{
        e.preventDefault();target.classList.remove('dragover');
        const t=tasks.find(x=>String(x.id)===e.dataTransfer.getData('task'));if(!t)return;
        const targetDate=target.dataset.date;
        if(t.date===targetDate){
          const dayTasks=tasks.filter(x=>x.date===targetDate&&String(x.id)!==String(t.id)).sort((a,b)=>(a.order||0)-(b.order||0));
          const taskEls=[...target.querySelectorAll('.task:not(.training-slot .task)')];
          let insertIdx=dayTasks.length;
          for(let j=0;j<taskEls.length;j++){const rect=taskEls[j].getBoundingClientRect();if(e.clientY<rect.top+rect.height/2){const matchTask=tasks.find(x=>String(x.id)===taskEls[j].dataset.id);insertIdx=dayTasks.indexOf(matchTask);if(insertIdx<0)insertIdx=j;break}}
          dayTasks.splice(insertIdx,0,t);
          dayTasks.forEach((task,idx)=>task.order=idx);
          localStorage.setItem('magician-tasks',JSON.stringify(tasks));render();pushCloud?.();toast('已调整顺序');
        }else{
          const old=t.date;t.date=targetDate;
          localStorage.setItem('magician-tasks',JSON.stringify(tasks));render();
          undoFn=()=>{t.date=old;render();pushCloud?.()};pushCloud?.();toast('已更新排期');
        }
      });
    });
  };

  refreshPeriod=()=>{calendarDate=monday(calendarDate);picker.value=iso(calendarDate);localStorage.setItem('magician-calendar-date',iso(calendarDate));render()};
  document.querySelector('#prevPeriod').onclick=()=>{calendarDate=plus(monday(calendarDate),view==='month'?-28:-7);refreshPeriod()};
  document.querySelector('#nextPeriod').onclick=()=>{calendarDate=plus(monday(calendarDate),view==='month'?35:7);refreshPeriod()};
  picker.onchange=e=>{calendarDate=new Date(e.target.value+'T12:00:00');refreshPeriod()};
  refreshPeriod();
})();
