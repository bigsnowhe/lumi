(()=>{
  const categories=[['health','体态锻炼'],['beauty','美妆账号'],['course','知识付费'],['work','其他工作项目'],['rest','休息 / 娱乐']];
  const calendar=document.querySelector('#week');
  let draggingUntil=0;
  calendar.addEventListener('dragstart',e=>{if(e.target.closest('.task'))draggingUntil=performance.now()+600},true);
  calendar.addEventListener('dragend',()=>{draggingUntil=performance.now()+400},true);
  const close=()=>document.querySelector('.task-edit-overlay')?.remove();
  function openEditor(task){
    close();
    const overlay=document.createElement('div');overlay.className='task-edit-overlay';
    overlay.innerHTML=`<form class="task-edit-card"><h2>编辑任务</h2><label for="editTaskTitle">任务内容</label><input id="editTaskTitle" required maxlength="120"><label for="editTaskDate">排期日期</label><input id="editTaskDate" type="date" required><label for="editTaskCategory">所属类目</label><select id="editTaskCategory">${categories.map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select><label for="editTaskNote">备注</label><input id="editTaskNote" maxlength="300" placeholder="可选"><label style="display:flex;align-items:center;gap:6px;margin-top:8px"><input type="checkbox" id="editTaskMinor" style="width:auto"> 小事（紧凑显示，不占卡片空间）</label><div class="task-edit-actions"><button type="button" class="cancel">取消</button><button type="submit" class="save">保存修改</button></div></form>`;
    document.body.appendChild(overlay);
    const form=overlay.querySelector('form');
    form.querySelector('#editTaskTitle').value=task.n||'';
    form.querySelector('#editTaskDate').value=task.date||'';
    form.querySelector('#editTaskCategory').value=categories.some(([key])=>key===task.c)?task.c:'work';
    form.querySelector('#editTaskNote').value=task.note||'';
    form.querySelector('#editTaskMinor').checked=!!task.minor;
    form.querySelector('.cancel').onclick=close;
    overlay.onclick=e=>{if(e.target===overlay)close()};
    overlay.onkeydown=e=>{if(e.key==='Escape')close()};
    form.onsubmit=e=>{
      e.preventDefault();const n=form.querySelector('#editTaskTitle').value.trim(),date=form.querySelector('#editTaskDate').value,c=form.querySelector('#editTaskCategory').value;
      if(!n||!date)return;
      const live=tasks.find(t=>String(t.id)===String(task.id));if(!live){close();return}
      live.n=n;live.date=date;live.c=c;live.cat=categories.find(([key])=>key===c)?.[1]||'其他工作项目';live.note=form.querySelector('#editTaskNote').value.trim();live.minor=form.querySelector('#editTaskMinor').checked;
      localStorage.setItem('magician-tasks',JSON.stringify(tasks));render();pushCloud?.();close();toast('任务已更新');
    };
    form.querySelector('#editTaskTitle').focus();
  }
  calendar.addEventListener('click',e=>{
    if(performance.now()<draggingUntil||e.target.closest('.check,.trash-task'))return;
    const card=e.target.closest('.task');if(!card)return;
    const task=tasks.find(t=>String(t.id)===card.dataset.id);if(task)openEditor(task);
  });
  calendar.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;if(e.target.closest('button'))return;const card=e.target.closest('.task');if(card){e.preventDefault();const task=tasks.find(t=>String(t.id)===card.dataset.id);if(task)openEditor(task)}});
  // 卡片会随视图切换重新渲染，保持键盘入口。
  const makeFocusable=()=>calendar.querySelectorAll('.task').forEach(card=>{card.tabIndex=0;card.setAttribute('aria-label',`编辑任务：${card.textContent.trim()}`)});
  new MutationObserver(makeFocusable).observe(calendar,{childList:true,subtree:true});makeFocusable();
})();
