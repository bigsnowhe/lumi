(()=>{
  const b=document.createElement('button');
  b.innerHTML='✦&nbsp; Lumi';
  b.setAttribute('aria-label','打开 Lumi 助手');
  b.style.cssText='position:fixed;left:22px;bottom:96px;z-index:25;background:#253229;color:#fff;padding:11px 15px;border-radius:10px;box-shadow:0 12px 28px #22302133;font-size:12px;font-weight:600';
  document.body.appendChild(b);
  const side=document.querySelector('.side');
  const menuToggle=document.createElement('button');menuToggle.textContent='‹';menuToggle.title='收起左侧菜单';menuToggle.style.cssText='position:fixed;left:202px;top:196px;z-index:25;width:26px;height:26px;border-radius:50%;background:#fff;border:1px solid #e7e5dd;color:#596057;font-size:20px;line-height:20px;box-shadow:0 4px 10px #0000000d';document.body.appendChild(menuToggle);
  let menuClosed=false;menuToggle.onclick=()=>{menuClosed=!menuClosed;side.style.display=menuClosed?'none':'';document.querySelector('.app').style.gridTemplateColumns=menuClosed?'1fr':'188px minmax(0,1fr)';menuToggle.style.left=menuClosed?'16px':'202px';menuToggle.textContent=menuClosed?'›':'‹';menuToggle.title=menuClosed?'展开左侧菜单':'收起左侧菜单'};
  const mealFor=(date,type)=>(window.magicianMealPlan||[]).find(x=>(x.date||x.day)===date&&(x.type||'lunch')===type);
  const refreshMeals=()=>{
    document.querySelectorAll('.day').forEach(day=>{
      let mealRow=day.querySelector('.meal-row');if(!mealRow){mealRow=document.createElement('div');mealRow.className='meal-row';mealRow.style.cssText='margin:0 -2px 9px;padding:5px 5px;border-radius:6px;background:#f5f2e9;color:#8b8577;font-size:10px;border:1px solid #ede8dc;line-height:1.6';day.querySelector('.day-title')?.insertAdjacentElement('afterend',mealRow)}
      const lunch=mealFor(day.dataset.date,'lunch'),dinner=mealFor(day.dataset.date,'dinner');
      const label=`午餐 · ${lunch?.name||'—'}\n晚餐 · ${dinner?.name||'—'}`;if(mealRow.textContent!==label){mealRow.textContent='';mealRow.append(`午餐 · ${lunch?.name||'—'}`,Object.assign(document.createElement('br')),`晚餐 · ${dinner?.name||'—'}`)}
    });
    const now=new Date(),date=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const value=document.querySelector('#openFood')?.closest('.panel')?.querySelector('.finance-row span:last-child');if(value)value.textContent=mealFor(date,'lunch')?.name||'尚未安排';
  };
  window.refreshMagicianMeals=refreshMeals;
  new MutationObserver(refreshMeals).observe(document.querySelector('#week'),{childList:true});refreshMeals();

  const panel=document.querySelector('#modulePanel'),home=document.querySelector('#homeContent');
  let pending=null;
  let conversation=[];try{conversation=JSON.parse(localStorage.getItem('magician-lumi-conversation')||'[]')}catch{}
  if(!Array.isArray(conversation))conversation=[];
  window.magicianLumiConversation=conversation;
  window.setMagicianLumiConversation=value=>{conversation=Array.isArray(value)?value.slice(-30):[];window.magicianLumiConversation=conversation;localStorage.setItem('magician-lumi-conversation',JSON.stringify(conversation));};
  const saveConversation=()=>{conversation=conversation.slice(-30);window.magicianLumiConversation=conversation;localStorage.setItem('magician-lumi-conversation',JSON.stringify(conversation));pushCloud?.()};
  const chatStyle=document.createElement('style');chatStyle.textContent='.lumi-chat{height:min(45vh,420px);min-height:280px;display:flex;flex-direction:column;border:1px solid var(--line);border-radius:14px;background:#fffefa;overflow:hidden}.lumi-messages{flex:1;overflow:auto;padding:20px;display:flex;flex-direction:column;gap:16px}.lumi-bubble{max-width:min(82%,720px);padding:12px 15px;border-radius:14px;line-height:1.75;white-space:pre-wrap;overflow-wrap:anywhere}.lumi-bubble.user{align-self:flex-end;background:#e8eee6;color:#29382e}.lumi-bubble.assistant{align-self:flex-start;background:#f5f3ed;color:#33372f}.lumi-bubble ul{white-space:normal;padding-left:20px}.lumi-bubble p{margin:8px 0}.lumi-composer{border-top:1px solid var(--line);padding:13px;display:flex;gap:9px;align-items:flex-end;background:#fffefa}.lumi-composer textarea{flex:1;min-width:0;min-height:54px;max-height:170px;resize:vertical;padding:11px;border:1px solid var(--line);border-radius:9px;background:#faf9f5;font:inherit;line-height:1.5}.lumi-composer button{flex:none;height:40px}@media(max-width:720px){.lumi-chat{height:72vh}.lumi-bubble{max-width:94%}.lumi-composer{flex-direction:column;align-items:stretch}.lumi-composer button{width:100%}}';document.head.appendChild(chatStyle);
  const appendBubble=(role,content,html=false)=>{const list=document.querySelector('#lumiMessages');if(!list)return null;const node=document.createElement('div');node.className=`lumi-bubble ${role}`;if(html)node.innerHTML=content;else node.textContent=content;list.appendChild(node);list.scrollTop=list.scrollHeight;return node};
  const esc=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const list=v=>Array.isArray(v)&&v.length?v.map(x=>`<li>${esc(typeof x==='string'?x:(x.name||x.activity||x.summary||JSON.stringify(x)))}</li>`).join(''):'';
  const parsePurchases=text=>{
    if(!/(采购|入库|买了|购买)/.test(text))return [];
    return text.split(/\r?\n/).map(line=>line.match(/^\s*[-•*]\s*(.+?)\s*[：:]\s*(.+?)\s*$/)).filter(Boolean).map(m=>({name:m[1].trim(),amount:m[2].trim().split(/[，,；;（(]/)[0].trim()})).filter(x=>x.name&&/\d/.test(x.amount)&&!/[¥￥]/.test(x.amount));
  };
  const amountOf=x=>String(x.amount||x.quantity||x.qty||x.unitAmount||'').trim();
  const mergeAmount=(oldValue,newValue)=>{
    const a=String(oldValue||'').trim(),b=String(newValue||'').trim();if(!a)return b;if(!b)return a;
    const packed=/^(\d+(?:\.\d+)?)\s*([^\d×xX*+\s]+)\s*[×xX*]\s*(\d+(?:\.\d+)?)\s*([^\d×xX*+\s]+)$/;
    const pa=a.match(packed),pb=b.match(packed);
    if(pa&&pb&&pa[1]===pb[1]&&pa[2]===pb[2]&&pa[4]===pb[4])return `${pa[1]}${pa[2]} × ${Number(pa[3])+Number(pb[3])}${pa[4]}`;
    const simple=/^(\d+(?:\.\d+)?)\s*([^\d+\s]+)$/;const sa=a.match(simple),sb=b.match(simple);
    if(sa&&sb&&sa[2]===sb[2])return `${Number(sa[1])+Number(sb[1])}${sa[2]}`;
    return `${a} + ${b}`;
  };
  const subtractAmount=(oldValue,usedValue)=>{
    const a=String(oldValue||'').trim(),b=String(usedValue||'').trim();
    const simple=/^(\d+(?:\.\d+)?)\s*([^\d+\s]+)$/;const sa=a.match(simple),sb=b.match(simple);
    if(sa&&sb&&sa[2]===sb[2]&&Number(sa[1])>=Number(sb[1]))return `${Number(sa[1])-Number(sb[1])}${sa[2]}`;
    const packed=/^(\d+(?:\.\d+)?)\s*([^\d×xX*+\s]+)\s*[×xX*]\s*(\d+(?:\.\d+)?)\s*([^\d×xX*+\s]+)$/;
    const pa=a.match(packed),pb=b.match(simple);
    if(pa&&pb&&pa[4]===pb[2]&&Number(pa[3])>=Number(pb[1]))return `${pa[1]}${pa[2]} × ${Number(pa[3])-Number(pb[1])}${pa[4]}`;
    return null;
  };
  const stockOperation=x=>/^(use|consume|subtract|remove|decrease|used|减|消耗|使用)$/.test(String(x.operation||x.action||x.type||'').toLowerCase())?'use':'add';
  const stockProblems=changes=>changes.filter(x=>{if(!x.name||!x.amount)return true;if(stockOperation(x)!=='use')return false;const before=(window.magicianInventory||[]).filter(y=>String(y.name||'').trim()===String(x.name).trim()).reduce((sum,y)=>mergeAmount(sum,y.amount),'');return subtractAmount(before,x.amount)===null});
  const timeSeconds=x=>{const direct=Number(x.seconds||x.durationSeconds||0);if(direct>0)return direct;const raw=String(x.duration||x.time||'');const h=raw.match(/(\d+(?:\.\d+)?)\s*(?:小时|h)/i),m=raw.match(/(\d+(?:\.\d+)?)\s*(?:分钟|分|m)/i);return Math.round((Number(h?.[1]||0)*60+Number(m?.[1]||0))*60)};
  const normalizeName=s=>String(s||'').replace(/[\s·•+＋，,。:：()（）]/g,'').toLowerCase();
  const matchingTimeEntries=item=>{const logs=window.magicianTimeLogs||[];if(item.id!=null)return logs.filter(log=>String(log.id)===String(item.id));const date=item.date||localToday(),name=normalizeName(item.activity||item.name);return name?logs.filter(log=>log.date===date&&normalizeName(log.activity)===name):[]};
  const invalidTimeUpdates=preview=>(preview.updatedTimeEntries||[]).filter(item=>{const set=item.set||{},seconds=Number(set.seconds);return matchingTimeEntries(item).length!==1||('seconds' in set&&(!Number.isFinite(seconds)||seconds<=0))||(!('seconds' in set)&&!('qty' in set)&&!String(set.activity||'').trim())});
  const resolveTask=(item,forMove=false)=>{const name=typeof item==='string'?item:(item.name||item.task||''),id=typeof item==='object'?item.id:null,date=typeof item==='object'?(forMove?item.fromDate:(item.date||item.fromDate)):null;const nn=normalizeName(name);let results=tasks.filter(t=>id!=null?String(t.id)===String(id):nn===normalizeName(t.n)&&(!date||t.date===date));if(!results.length&&name&&!id)results=tasks.filter(t=>(!date||t.date===date)&&(normalizeName(t.n).includes(nn)||nn.includes(normalizeName(t.n))));return results};
  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||''));
  const taskProblems=p=>(p.createdTasks||[]).some(item=>!validDate(item.date)||!(item.name||item.task))||(p.completedTasks||[]).some(item=>resolveTask(item).length!==1)||(p.rescheduledTasks||[]).some(item=>resolveTask(item,true).length!==1||!validDate(item.toDate||item.newDate||item.date))||(p.deletedTasks||[]).some(item=>resolveTask(item).length!==1)||(p.updatedTasks||[]).some(item=>resolveTask(item).length!==1);
  const referredDate=text=>{
    const explicit=text.match(/(20\d{2})[年/-](\d{1,2})[月/-](\d{1,2})日?/);
    if(explicit)return `${explicit[1]}-${String(explicit[2]).padStart(2,'0')}-${String(explicit[3]).padStart(2,'0')}`;
    const offset=/前天/.test(text)?-2:/昨天/.test(text)?-1:/(今天|刚刚|刚才|现在)/.test(text)?0:null;
    if(offset===null)return null;
    const day=new Date(`${localToday()}T12:00:00+08:00`);day.setUTCDate(day.getUTCDate()+offset);
    return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(day);
  };
  const mentionedSeconds=text=>{const amounts={一:1,两:2,二:2,三:3,四:4,五:5,半:.5};let seconds=0;for(const match of text.matchAll(/(\d+(?:\.\d+)?|一|两|二|三|四|五|半)\s*个?\s*(小时|分钟|分)/g))seconds+=(Number(match[1])||amounts[match[1]]||0)*(match[2]==='小时'?3600:60);return Math.round(seconds)};
  const completedName=text=>{
    if(/[？?]|有哪些|什么|多少|怎么|如何/.test(text))return null;
    if(/商单.{0,6}脚本|脚本.{0,6}商单/.test(text))return '商单脚本';
    const verb=text.match(/写完|做完|完成了|已完成|练完|锻炼了|做了/);if(!verb)return null;
    let tail=text.slice(verb.index+verb[0].length).split(/[，。；]/)[0];
    tail=tail.replace(/^\s*(?:了)?\s*(?:一篇|一个|一份|一项)?\s*/,'').replace(/(?:用时|花了|用了|耗时|持续).*/,'').replace(/(?:\d+(?:\.\d+)?|一|两|二|三|四|五|半)\s*个?\s*(?:小时|分钟|分).*/,'').split(/(?:就是|叫做|名为|是)/).pop().trim();
    if(!tail)return /锻炼|练完/.test(verb[0])?'锻炼':null;
    if(/^(饭|晚饭|午饭|早餐)$/.test(tail))return '做饭';
    return tail.length<=60?tail:null;
  };
  const prepareCompletion=(preview,text,prior)=>{
    const referringBack=/(它|这个|上面|刚刚|那条)/.test(text)&&/(加入|补|写|记录|完成|done)/i.test(text);
    const candidates=referringBack?[text,...[...prior].reverse().filter(m=>m.role==='user').map(m=>m.content)]:[text];
    const source=candidates.find(value=>/(昨天|前天|今天|20\d{2}[年/-])/.test(value)&&/(写完|做完|完成了|已完成|练完|锻炼了|做了)/.test(value))||text;
    const completed=/(写完|做完|完成了|已完成|练完|锻炼了|做了)/.test(source);
    const date=referredDate(source)||(completed?localToday():null);
    preview.createdTasks=[...(preview.createdTasks||preview.newTasks||[])].map(item=>{
      const raw=typeof item==='string'?{name:item}:item;
      const originalName=raw.name||raw.task||raw.title||'';
      return {name:/商单.{0,6}脚本|脚本.{0,6}商单/.test(originalName)?'商单脚本':originalName,date:validDate(raw.date)?raw.date:referredDate(String(raw.date||''))||date,completed:raw.completed??raw.done??completed};
    });
    preview.createdTasks=preview.createdTasks.filter(item=>{const existing=tasks.find(t=>t.date===item.date&&normalizeName(t.n)===normalizeName(item.name));if(!existing)return true;if(item.completed&&!existing.done&&!preview.completedTasks?.some(t=>resolveTask(t).includes(existing)))preview.completedTasks=[...(preview.completedTasks||[]),{id:existing.id,date:item.date,name:item.name}];return false});
    preview.timeEntries=(preview.timeEntries||[]).map(item=>({...item,date:validDate(item.date)?item.date:referredDate(String(item.date||''))||date||item.date,seconds:Number(item.seconds||item.durationSeconds||0)||Number(item.minutes||0)*60||undefined})).filter(item=>!(window.magicianTimeLogs||[]).some(x=>x.date===item.date&&Number(x.seconds)===timeSeconds(item)&&normalizeName(x.activity)===normalizeName(item.activity||item.name)));
    const name=completedName(source);
    if(completed&&date&&name){
      const existing=tasks.find(t=>t.date===date&&normalizeName(t.n)===normalizeName(name));
      const proposed=preview.createdTasks.some(t=>t.date===date&&normalizeName(t.name||t.task)===normalizeName(name));
      if(existing&&!existing.done&&!preview.completedTasks?.some(t=>resolveTask(t).includes(existing)))preview.completedTasks=[...(preview.completedTasks||[]),{id:existing.id,date,name}];
      if(!existing&&!proposed)preview.createdTasks.push({name,date,completed:true});
      const seconds=mentionedSeconds(source),logged=(window.magicianTimeLogs||[]).some(x=>x.date===date&&Number(x.seconds)===seconds&&normalizeName(x.activity)===normalizeName(name));
      if(seconds&&!logged&&!preview.timeEntries?.length)preview.timeEntries=[{date,activity:name,seconds}];
    }
    const keep=[];for(const item of preview.completedTasks||[]){const matches=resolveTask(item);if(matches.length===1&&matches[0].done)continue;if(matches.length){keep.push(item);continue}const itemName=typeof item==='string'?item:item.name||item.task;const itemDate=typeof item==='string'?date:item.date||date;if(completed&&validDate(itemDate)&&itemName&&!preview.createdTasks.some(t=>t.date===itemDate&&normalizeName(t.name||t.task)===normalizeName(itemName)))preview.createdTasks.push({name:itemName,date:itemDate,completed:true})}
    preview.completedTasks=keep;
    const hasChanges=['createdTasks','completedTasks','rescheduledTasks','deletedTasks','updatedTasks','updatedTimeEntries','deletedTimeEntries','timeEntries','inventoryChanges','deletedInventory','mealPlan','deletedMeals'].some(key=>preview[key]?.length);
    const matchingTask=tasks.find(t=>t.date===date&&normalizeName(t.n)===normalizeName(name));
    const seconds=mentionedSeconds(source),matchingLog=(window.magicianTimeLogs||[]).some(x=>x.date===date&&Number(x.seconds)===seconds&&normalizeName(x.activity)===normalizeName(name));
    return {alreadyRecorded:!hasChanges&&!!matchingTask?.done&&(!seconds||matchingLog),name,date};
  };
  const stockList=v=>v.map(x=>{const existing=(window.magicianInventory||[]).filter(y=>String(y.name||'').trim()===String(x.name||'').trim());const before=existing.reduce((sum,y)=>mergeAmount(sum,y.amount),'');const use=stockOperation(x)==='use';const after=use?subtractAmount(before,x.amount):mergeAmount(before,x.amount);return `<li>${esc(x.name||'未命名食材')} · ${use?'消耗':'入库'} ${esc(x.amount||'数量待补充')}${before?` · 原有 ${esc(before)} → ${esc(after??'数量无法核算')}`:''}</li>`}).join('');
  const currentContext=()=>{
    const todayStr=localToday();
    const todayLogs=(window.magicianTimeLogs||[]).filter(x=>x.date===todayStr);
    const todayTotal=todayLogs.reduce((s,x)=>s+Number(x.seconds||0),0);
    const todaySummary=todayLogs.length?`今日已记录 ${Math.round(todayTotal/60)} 分钟：${todayLogs.map(x=>`${x.activity||'未命名'} ${Math.round(Number(x.seconds||0)/60)}分钟${x.qty>1?' ×'+x.qty:''}`).join('、')}`:'今日暂无时间记录';
    return {
    today:todayStr,timezone:'Asia/Shanghai',todaySummary,
    tasks:tasks.slice(-150).map(t=>({id:t.id,name:t.n,date:t.date,category:t.cat,completed:!!t.done,minor:!!t.minor,note:t.note||''})),
    timeLogs:(window.magicianTimeLogs||[]).slice(0,120),
    inventory:window.magicianInventory||[],recipes:window.magicianRecipes||[],
    weeklyMeals:window.magicianMealPlan||[],
    finance:(window.magicianFinance||[]).slice(-40),
    instructions:'你是 Lumi，阿雪的私人助理。判断用户想新增、修改、完成、删除、查询、统计还是规划，给出可执行的 preview 或直接回答。规则：1）context 才是已保存状态。todaySummary 仅防止重复 timeEntries；任务完成是独立的——即使时间已记录，用户说做完了某事时仍必须生成 completedTasks（已有任务）或 createdTasks+completed:true（新任务）。2）回复不超过两句，用户没要求时不分析负荷。3）确认前不要声称已写入。4）用户要求改动已有任务时必须用 updatedTasks，不能只回复文字。5）用户问统计类问题（花了多少时间、完成了几个、本周总结等）直接从 context 的 tasks 和 timeLogs 计算后回答，不需要 preview。6）批量操作：用户说”把今天没完成的都移到明天”之类，用 rescheduledTasks 列出所有符合条件的任务。7）排程：用户说”帮我排一下这周/明天”时，参考 schedulingRules 和历史记录生成 createdTasks。如果某天超过8h，主动用 rescheduledTasks 建议调整。有商单等临时任务加塞时，自动腾挪非紧急任务。8）行动优先：要建议做某事时直接生成 preview 让用户确认，不要只口头建议然后显示”暂时没有需要写入的内容”。例如用户说”我生病了”→直接生成 rescheduledTasks 把今日未完成任务挪到明天。9）用户说做完了某事：如果 context 里有对应任务，同时生成 completedTasks 和 timeEntries；如果没有对应任务，用 createdTasks 创建一个 completed:true 的任务并附带 timeEntries。preview 字段说明：createdTasks=[{name,date,completed,minor}]，minor:true 只是让卡片紧凑显示，类目由系统自动分类你不需要管。顺手能做完不占整块时间的事自动加 minor:true（检查/续费/回复消息/下单/预约/转账等），回复中不要提类目；updatedTasks=[{name,date,set:{}}] 修改已有任务的属性，例如”改为小事”→set:{minor:true}，”改名”→set:{name:”新名”}，”改分类”→set:{category:”美妆账号”}，”标记未完成”→set:{done:false}；completedTasks=[{name,date}]；rescheduledTasks=[{name,fromDate,toDate}]；deletedTasks=[{name,date}]；timeEntries=[{activity,date,seconds,qty}] qty 表示完成件数（如写了4篇脚本 qty:4），默认1；updatedTimeEntries=[{activity,date,set:{seconds,qty,activity}}] 修改已有时间记录的时长/数量/名称，如"把修改Lumi的时间改为3小时"→set:{seconds:10800}，"产出改成3件"→set:{qty:3}；deletedTimeEntries=[{activity,date}] 删除时间记录；inventoryChanges=[{name,amount,operation}]；deletedInventory=[{name}] 从库存中移除某食材；mealPlan=[{date,name,type}] type 为 “lunch” 或 “dinner”，这是饮食存档不是建议；deletedMeals=[{date,type}] 删除某天的饮食记录；financeEntries=[{type,amount,date,note}] type 为 "income"（商单收入）或 "ads"（投流支出），amount 是数字，date 是 YYYY-MM-DD，note 可选备注；deletedFinance=[{date,note}] 删除某条财务记录（通过日期+备注匹配）。',
    categoryGuide:{'体态锻炼':['力量训练','有氧','普拉提','欧阳春晓','散步','做饭','备餐','采购食材','补充库存'],'美妆账号':['选题','写脚本（每月 1–20 日）','找素材','拍摄','剪辑视频','封面','发布','数据复盘'],'知识付费':['选题会','课程内容','写脚本（每月 21 日起）','直播','学员服务'],'其他工作项目':['合作项目','商务沟通','文创','代购','表格','出差','见师傅'],'休息 / 娱乐':['看电影','手账','弹钢琴','弹吉他','好友聚会'],scriptRule:'写脚本：每月 1–20 日归美妆账号；21 日起归知识付费。'},
    schedulingRules:{daily:'早晨锻炼约2h，下午开始工作约6h。有效时间包含锻炼和娱乐。',filming:'拍摄隔天一次，只在洗头日拍（隔天洗头）。',monthFocus:'每月1-20日以美妆账号为主，20号之后以知识付费为主。',loadLevels:'每日有效时间：<5h轻松，7h正常，8h偏多，9h高负荷，10h+高压。排程时单日不要超过8h，有商单加塞时优先调整非紧急任务到其他天。',principle:'用户需要额外做决策的部分越少越好。排程时直接给出完整建议，只在有冲突需要取舍时才问。'}
  }};

  function open(){
    home.style.display='none';panel.classList.add('open');
    panel.innerHTML=`<div class="module-head"><div><h2>Lumi</h2><p>接着聊就好。涉及任务、库存或排餐时，我会先给你预览。</p></div><button class="back-home" id="lumiBack">← 返回主线一览</button></div><div class="lumi-chat"><div class="lumi-messages" id="lumiMessages"></div><div class="lumi-composer"><textarea id="lumiText" aria-label="给 Lumi 发消息" placeholder="继续告诉 Lumi，例如：那两盒各 250g；或者今天做饭用了两个鸡蛋。"></textarea><button class="add" id="lumiAsk">发送给 Lumi</button></div></div>`;
    document.querySelector('#lumiBack').onclick=close;
    document.querySelector('#lumiAsk').onclick=ask;
    document.querySelector('#lumiText').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask()}};
    if(!conversation.length)appendBubble('assistant','你可以直接把今天的清单或进展发给我。需要补充时，我们就在这里接着聊。');
    else conversation.slice(-30).forEach(m=>appendBubble(m.role,m.content));
  }
  function close(){panel.classList.remove('open');home.style.display='grid';document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.module==='home'))}

  function previewHtml(result){
    const p=result.preview||{};
    const bits=[];
    if(p.createdTasks?.length)bits.push(`<b>将新增 ${p.createdTasks.length} 个任务</b><ul>${p.createdTasks.map(t=>`<li>${esc(t.date||'日期待确认')} · ${esc(t.name||t.task||'任务待确认')} · ${validDate(t.date)?esc(classifyTask(t.name||t.task,new Date(t.date+'T12:00:00')).cat)+' · ':''}${t.completed?'加入 Done':'加入 To do'}</li>`).join('')}</ul>`);
    if(p.completedTasks?.length)bits.push(`<b>将完成 ${p.completedTasks.length} 个任务</b><ul>${list(p.completedTasks)}</ul>`);
    if(p.rescheduledTasks?.length)bits.push(`<b>将调整 ${p.rescheduledTasks.length} 个任务</b><ul>${p.rescheduledTasks.map(x=>`<li>${esc(x.name||x.task||'任务')} → ${esc(x.toDate||x.newDate||x.date||'日期待确认')}</li>`).join('')}</ul>`);
    if(p.deletedTasks?.length)bits.push(`<b>将删除 ${p.deletedTasks.length} 个任务</b><ul>${list(p.deletedTasks)}</ul>`);
    if(p.updatedTasks?.length)bits.push(`<b>将修改 ${p.updatedTasks.length} 个任务</b><ul>${p.updatedTasks.map(t=>`<li>${esc(t.name||'')} · ${t.date||''} → ${Object.entries(t.set||{}).map(([k,v])=>`${k}:${v}`).join(', ')}</li>`).join('')}</ul>`);
    if(p.updatedTimeEntries?.length)bits.push(`<b>将修改 ${p.updatedTimeEntries.length} 条时间记录</b><ul>${p.updatedTimeEntries.map(x=>`<li>${esc(x.activity||x.name||'')} · ${esc(x.date||'今天')} → ${x.set?.seconds?Math.round(x.set.seconds/60)+' 分钟':''}${x.set?.qty?' ×'+x.set.qty:''}${x.set?.activity?' 改名为 '+esc(x.set.activity):''}</li>`).join('')}</ul>`);
    if(invalidTimeUpdates(p).length)bits.push('<p>没有找到唯一对应的原计时记录，或新时长无效。请补充日期和准确的记录名称；这次不会保存。</p>');
    if(p.deletedTimeEntries?.length)bits.push(`<b>将删除 ${p.deletedTimeEntries.length} 条时间记录</b><ul>${p.deletedTimeEntries.map(x=>`<li>${esc(x.activity||x.name||'')} · ${esc(x.date||'今天')}</li>`).join('')}</ul>`);
    if(p.deletedInventory?.length)bits.push(`<b>将移除 ${p.deletedInventory.length} 项库存</b><ul>${p.deletedInventory.map(x=>`<li>${esc(x.name)}</li>`).join('')}</ul>`);
    if(p.deletedMeals?.length)bits.push(`<b>将删除 ${p.deletedMeals.length} 条饮食记录</b><ul>${p.deletedMeals.map(x=>`<li>${esc(x.date||'')} · ${esc(x.type==='dinner'?'晚餐':'午餐')}</li>`).join('')}</ul>`);
    if(p.financeEntries?.length)bits.push(`<b>将记录 ${p.financeEntries.length} 条财务</b><ul>${p.financeEntries.map(x=>`<li>${esc(x.date||'今天')} · ${x.type==='income'?'商单收入':'投流支出'} ¥${esc(x.amount)}${x.note?' · '+esc(x.note):''}</li>`).join('')}</ul>`);
    if(p.deletedFinance?.length)bits.push(`<b>将删除 ${p.deletedFinance.length} 条财务记录</b><ul>${p.deletedFinance.map(x=>`<li>${esc(x.date||'')}${x.note?' · '+esc(x.note):''}</li>`).join('')}</ul>`);
    if(taskProblems(p))bits.push('<p>有任务名称重复、没有匹配的任务，或新日期不明确。请注明任务原日期和目标日期后重新整理。</p>');
    if(p.timeEntries?.length)bits.push(`<b>将补记 ${p.timeEntries.length} 条时间</b><ul>${p.timeEntries.map(x=>`<li>${esc(x.activity||x.name||'未命名事项')} · ${esc(x.date||'今天')} · ${timeSeconds(x)?`${Math.round(timeSeconds(x)/60)} 分钟`:'时长待补充'}${(x.qty||1)>1?` · ${x.qty} 件`:''}</li>`).join('')}</ul>`);
    if(p.inventoryChanges?.length)bits.push(`<b>将更新 ${p.inventoryChanges.length} 项库存</b><ul>${stockList(p.inventoryChanges)}</ul>${stockProblems(p.inventoryChanges).length?'<p>有食材缺少数量、现有库存不足，或单位无法核算；请补充信息后重新整理。</p>':''}`);
    if(p.mealPlan?.length)bits.push(`<b>饮食记录</b><ul>${p.mealPlan.map(x=>`<li>${esc(x.date||'日期待确认')} · ${esc(x.type==='dinner'?'晚餐':'午餐')} · ${esc(x.name||x.recipe||x.meal||'待确认')}</li>`).join('')}</ul>`);
    if(p.grocerySuggestions?.length)bits.push(`<b>建议采购</b><ul>${list(p.grocerySuggestions)}</ul>`);
    if(p.workloadInsight)bits.push(`<b>本周负荷</b><p>${esc(p.workloadInsight)}</p>`);
    if(p.estimationInsight)bits.push(`<b>节奏估计</b><p>${esc(p.estimationInsight)}</p>`);
    return `<div style="color:#263229;font-size:14px">${esc(result.reply||'我已经整理好。')}</div>${bits.length?`<div style="margin-top:12px">${bits.join('')}</div>`:'<p style="margin-top:10px">暂时没有需要写入的内容。</p>'}${result.needsConfirmation&&bits.length&&!taskProblems(p)&&!invalidTimeUpdates(p).length&&!p.timeEntries?.some(x=>!timeSeconds(x))?'<button class="add" id="lumiConfirm" style="margin-top:12px">确认写入 Lumi</button>':''}`;
  }

  let asking=false;
  async function ask(){
    const input=document.querySelector('#lumiText'),button=document.querySelector('#lumiAsk'),text=input.value.trim();
    if(!text||asking)return;
    if(!cloudSession?.access_token){appendBubble('assistant','请先完成邮箱登录，我才能保护你的数据与 API 用量。');return}
    asking=true;button.disabled=true;input.value='';pending=null;document.querySelector('#lumiConfirm')?.remove();
    const prior=conversation.slice(-20);conversation.push({role:'user',content:text});saveConversation();appendBubble('user',text);
    const waiting=appendBubble('assistant','Lumi 正在整理…');
    try{
      const dialogue=prior.map(m=>`${m.role==='user'?'用户':'Lumi'}：${m.content}`).join('\n');
      const prompt=`按 context.instructions 行事。关键细节缺失时只问一个问题。\n${dialogue?`最近对话：\n${dialogue}\n`:''}用户本次消息：${text}`;
      let r,data;for(let attempt=0;attempt<5;attempt++){r=await fetch(`${CLOUD_URL}/functions/v1/lumi-ai`,{method:'POST',headers:{apikey:CLOUD_KEY,'Authorization':`Bearer ${cloudSession.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({prompt,context:currentContext()})});data=await r.json();if(r.ok)break;if(/busy|unavailable|overloaded|rate.limit|繁忙|503|529/i.test(JSON.stringify(data))&&attempt<4){waiting.textContent=`Lumi 排队中，第 ${attempt+2} 次尝试…`;await new Promise(ok=>setTimeout(ok,3000*(attempt+1)));continue}break}
      if(!r.ok)throw new Error(/busy|unavailable|overloaded|繁忙|503|529/i.test(JSON.stringify(data))?'DeepSeek 服务繁忙，请稍后再试':(data.error||'Lumi 暂时无法连接'));
      const purchases=parsePurchases(text),preview=data.preview||{};
      if(purchases.length){const parsedNames=new Set(purchases.map(x=>x.name));const unmatched=purchases.length>=(preview.inventoryChanges||[]).length?[]:(preview.inventoryChanges||[]).map(x=>typeof x==='string'?{name:x,amount:''}:{...x,amount:amountOf(x)}).filter(x=>!parsedNames.has(x.name));preview.inventoryChanges=[...purchases,...unmatched];data.needsConfirmation=true}
      else if(preview.inventoryChanges?.length){const consumption=/(用了|消耗|做菜|做饭|吃掉|用掉)/.test(text)&&!/(采购|入库|买了|购买)/.test(text);preview.inventoryChanges=preview.inventoryChanges.map(x=>typeof x==='string'?{name:x,amount:'',operation:consumption?'use':'add'}:{...x,amount:amountOf(x),operation:x.operation||x.action||x.type||(consumption?'use':'add')})}
      const prepared=prepareCompletion(preview,text,prior);
      const hasActions=['createdTasks','completedTasks','rescheduledTasks','deletedTasks','updatedTasks','updatedTimeEntries','deletedTimeEntries','timeEntries','inventoryChanges','deletedInventory','mealPlan','deletedMeals','financeEntries','deletedFinance'].some(key=>preview[key]?.length);
      data.needsConfirmation=hasActions;
      if(hasActions&&/已处理|已写入|已加入|已记录|已补/.test(data.reply||''))data.reply='这是我准备写入的内容。请先核对下方预览，确认后才会保存。';
      if(!hasActions&&prepared.alreadyRecorded)data.reply=`${prepared.date} 的「${prepared.name}」已在 Done 和计时记录中，这次没有重复写入。`;
      else if(!hasActions&&/^(帮我|请|麻烦)?(写入|记入|补记|补写)/.test(text.trim()))data.reply='这次还没有形成可写入的记录，也没有改动日程。请写明日期、完成的事项和用时，我会先给你核对预览。';
      data.preview=preview;pending=data;waiting.innerHTML=previewHtml(data)+(data._model?`<div style="font-size:10px;color:#aaa;margin-top:8px">model: ${data._model}</div>`:'');conversation.push({role:'assistant',content:data.reply||'我已经整理好。'});saveConversation();const confirm=waiting.querySelector('#lumiConfirm');if(confirm)confirm.onclick=apply;
    }catch(e){const raw=e.message||'请确认网络后重试';const message=`暂时无法整理：${raw.length>80?raw.slice(0,80)+'…':raw}`;waiting.textContent=message;conversation.push({role:'assistant',content:message});saveConversation()}
    finally{asking=false;button.disabled=false;const messages=document.querySelector('#lumiMessages');if(messages)messages.scrollTop=messages.scrollHeight}
  }

  function apply(){
    if(!pending)return;const p=pending.preview||{};
    if(invalidTimeUpdates(p).length){appendBubble('assistant','原计时记录没有唯一匹配上，我没有修改数据。请告诉我日期和记录的准确名称。');return}
    (p.createdTasks||[]).forEach((item,i)=>{const name=String(item.name||item.task||'').trim(),date=item.date;if(!name||!validDate(date))return;const existing=tasks.find(t=>t.date===date&&normalizeName(t.n)===normalizeName(name));if(existing){if(item.completed)existing.done=true;return}tasks.push({id:`lumi-${Date.now()}-${i}`,date,n:name,...classifyTask(name,new Date(date+'T12:00:00')),done:!!item.completed,minor:!!item.minor})});
    (p.completedTasks||[]).forEach(item=>{const [task]=resolveTask(item);if(task)task.done=true});
    (p.rescheduledTasks||[]).forEach(item=>{const [task]=resolveTask(item,true);const date=item.toDate||item.newDate||item.date;if(task&&/^\d{4}-\d{2}-\d{2}$/.test(date))task.date=date});
    (p.deletedTasks||[]).forEach(item=>{const matches=resolveTask(item);matches.forEach(task=>{const idx=tasks.indexOf(task);if(idx>=0){(window.magicianTrash=window.magicianTrash||[]).push(task);tasks.splice(idx,1)}})});
    (p.updatedTasks||[]).forEach(item=>{const [task]=resolveTask(item);if(task&&item.set){if('minor' in item.set)task.minor=!!item.set.minor;if('name' in item.set&&item.set.name)task.n=String(item.set.name).trim();if('date' in item.set&&validDate(item.set.date))task.date=item.set.date;if('done' in item.set)task.done=!!item.set.done;if('category' in item.set){const catMap={'体态锻炼':'health','美妆账号':'beauty','知识付费':'course','其他工作项目':'work','休息 / 娱乐':'rest'};task.cat=item.set.category;task.c=catMap[item.set.category]||task.c}}});
    (p.updatedTimeEntries||[]).forEach(item=>{const [match]=matchingTimeEntries(item);if(match&&item.set){if('seconds' in item.set)match.seconds=Number(item.set.seconds);if('activity' in item.set)match.activity=String(item.set.activity).trim();if('qty' in item.set)match.qty=Number(item.set.qty)||1}});
    (p.deletedTimeEntries||[]).forEach(item=>{const logs=window.magicianTimeLogs||[];const date=item.date||localToday();const idx=logs.findIndex(x=>x.date===date&&normalizeName(x.activity)===normalizeName(item.activity||item.name));if(idx>=0)logs.splice(idx,1)});
    (p.timeEntries||[]).forEach((entry,i)=>{const seconds=timeSeconds(entry),date=entry.date||localToday(),activity=entry.activity||entry.name||'Lumi 补记',qty=Number(entry.qty)||1;if(seconds>0&&!(window.magicianTimeLogs||[]).some(x=>x.date===date&&Number(x.seconds)===seconds&&normalizeName(x.activity)===normalizeName(activity)))(window.magicianTimeLogs=window.magicianTimeLogs||[]).unshift({id:Date.now()+i,date,activity,seconds,qty,manual:true})});
    if(p.inventoryChanges?.length){
      const inventory=window.magicianInventory=window.magicianInventory||[];
      for(const item of p.inventoryChanges){
        if(!item.name||!item.amount)continue;
        const matches=inventory.filter(x=>String(x.name||'').trim()===String(item.name).trim());
        if(matches.length){const first=matches[0];first.amount=matches.slice(1).reduce((value,x)=>mergeAmount(value,x.amount),first.amount);first.amount=stockOperation(item)==='use'?subtractAmount(first.amount,item.amount):mergeAmount(first.amount,item.amount);for(const extra of matches.slice(1)){const at=inventory.indexOf(extra);if(at>=0)inventory.splice(at,1)}}
        else if(stockOperation(item)==='add')inventory.push({name:item.name,amount:item.amount});
      }
    }
    (p.deletedInventory||[]).forEach(item=>{const inv=window.magicianInventory||[];const idx=inv.findIndex(x=>String(x.name||'').trim()===String(item.name||'').trim());if(idx>=0)inv.splice(idx,1)});
    if(p.mealPlan?.length){const meals=window.magicianMealPlan=window.magicianMealPlan||[];p.mealPlan.forEach(meal=>{const date=meal.date||meal.day,type=meal.type||'lunch';if(!date)return;meal.type=type;const i=meals.findIndex(x=>(x.date||x.day)===date&&(x.type||'lunch')===type);if(i>=0)meals[i]=meal;else meals.push(meal)})}
    (p.deletedMeals||[]).forEach(item=>{const meals=window.magicianMealPlan||[];const date=item.date||item.day,type=item.type||'lunch';const idx=meals.findIndex(x=>(x.date||x.day)===date&&(x.type||'lunch')===type);if(idx>=0)meals.splice(idx,1)});
    (p.financeEntries||[]).forEach(item=>{if(!item.type||!item.amount)return;(window.magicianFinance=window.magicianFinance||[]).push({type:item.type,amount:Number(item.amount),date:item.date||localToday(),note:String(item.note||'').trim()})});
    (p.deletedFinance||[]).forEach(item=>{const fin=window.magicianFinance||[];const idx=fin.findIndex(x=>x.date===item.date&&String(x.note||'').trim()===String(item.note||'').trim());if(idx>=0)fin.splice(idx,1)});
    localStorage.setItem('magician-tasks',JSON.stringify(tasks));localStorage.setItem('magician-time-logs',JSON.stringify(window.magicianTimeLogs||[]));
    localStorage.setItem('magician-inventory',JSON.stringify(window.magicianInventory||[]));localStorage.setItem('magician-meal-plan',JSON.stringify(window.magicianMealPlan||[]));localStorage.setItem('magician-finance',JSON.stringify(window.magicianFinance||[]));
    render();refreshTimeHint?.();refreshMeals();pushCloud?.();document.querySelector('#lumiConfirm')?.remove();appendBubble('assistant','已保存在本机。请看右上角同步状态；你也可以继续补充。');conversation.push({role:'assistant',content:'已保存在本机，请查看同步状态。'});saveConversation();toast('已更新记录，请查看同步状态');pending=null;
  }
  b.onclick=open;
})();
