(()=>{'use strict';
const toggle=document.querySelector('.mobile-toggle');
const menu=document.querySelector('.nav-links');
const closeMenu=()=>{if(!toggle||!menu)return;menu.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','打开导航');toggle.textContent='☰';};
if(toggle&&menu){
 toggle.addEventListener('click',()=>{const opened=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',String(opened));toggle.setAttribute('aria-label',opened?'关闭导航':'打开导航');toggle.textContent=opened?'×':'☰';});
 menu.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('open')){closeMenu();toggle.focus();}});
 document.addEventListener('click',e=>{if(menu.classList.contains('open')&&!e.target.closest('.site-header'))closeMenu();});
 window.addEventListener('resize',()=>{if(window.innerWidth>800)closeMenu();},{passive:true});
}
const filterButtons=[...document.querySelectorAll('[data-filter]')];
const items=[...document.querySelectorAll('[data-category]')];
const result=document.getElementById('filter-result');
const applyFilter=btn=>{filterButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));const value=btn.dataset.filter;let count=0;items.forEach(item=>{const show=value==='all'||item.dataset.category===value;item.hidden=!show;if(show)count++;});if(result)result.textContent=`已显示 ${count} 个面料方向`;};
filterButtons.forEach(btn=>btn.addEventListener('click',()=>applyFilter(btn)));
if(filterButtons.length)applyFilter(filterButtons.find(b=>b.getAttribute('aria-pressed')==='true')||filterButtons[0]);
// 表单与咨询 API：严格遵循接收端字段约定，不在浏览器端保存密钥。
const NOTIFY_ENDPOINT = 'https://tongzhi.wangxiansheng.com/api/notify.php';
const form=document.getElementById('inquiry-form');
if(!form)return;
const status=document.getElementById('form-status');
const submit=form.querySelector('button[type="submit"]');
const submitLabel=submit.getAttribute('data-default-text')||'提交面料需求';
const fields=name=>form.elements.namedItem(name);
const urlParams=new URLSearchParams(window.location.search);
for(const key of ['material','application']){
 const option=fields(key); const value=urlParams.get(key);
 if(option&&value&&[...option.options].some(item=>item.value===value))option.value=value;
}
let submitting=false;
form.noValidate=true;

function validPhone(value){
 const text=String(value||'').trim(), digits=text.replace(/[^0-9]/g,'');
 return /^[+0-9()（）\s.#xX转分机-]+$/.test(text)&&digits.length>=7&&digits.length<=20;
}
function selectionLabel(name, fallback){
 const select=fields(name),selected=select?.selectedOptions?.[0];
 return selected&&selected.value ? selected.textContent.trim() : fallback;
}
function showStatus(message,kind){
 status.textContent=message;
 status.dataset.kind=kind;
 if(kind==='success'||kind==='error'){
  status.focus({preventScroll:true});
  status.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
 }
}
function validate(){
 for(const key of ['name','company','phone','email','message']){
  const item=fields(key);
  item.setCustomValidity('');
  if(key!=='message')item.value=item.value.trim();
 }
 if(!fields('name').value)fields('name').setCustomValidity('请填写您的姓名。');
 if(!fields('company').value)fields('company').setCustomValidity('请填写公司或品牌名称。');
 if(!validPhone(fields('phone').value))fields('phone').setCustomValidity('请填写有效的手机号或固定电话，可包含区号和分机。');
 const message=fields('message').value.trim();
 if(message.length<10)fields('message').setCustomValidity('请至少填写 10 个字的需求说明。');
 if(message.length>3000)fields('message').setCustomValidity('需求说明请控制在 3000 字以内。');
 return form.reportValidity();
}
function responseError(httpStatus,data){
 const errors={
  origin_not_allowed:'在线提交暂不可用，请拨打 15800700798 联系我们。',
  invalid_api_key:'在线提交暂不可用，请拨打 15800700798 联系我们。',
  invalid_json:'提交格式有误，请稍后再试。',
  empty_payload:'未收到表单内容，请检查后重新提交。',
  payload_too_large:'需求内容过长，请精简后再提交。',
  save_failed:'需求保存失败，请稍后再试或电话联系。',
  method_not_allowed:'在线提交暂不可用，请电话联系。'
 };
 const statuses={
  403:'在线提交暂不可用，请拨打 15800700798 联系我们。',
  413:'需求内容过长，请精简后再提交。',
  415:'提交格式暂不受支持，请电话联系。',
  422:'填写内容未通过校验，请检查后重新提交。',
  429:'提交过于频繁，请稍后再试。',
  503:'咨询服务暂不可用，请稍后再试或电话联系。'
 };
 if(data&&typeof data.code==='string'&&Object.prototype.hasOwnProperty.call(errors,data.code))return errors[data.code];
 return statuses[httpStatus]||'暂时无法确认是否提交成功，请拨打 15800700798 确认，避免重复提交。';
}
function buildInquiryFields(values){
 const pageUrl=new URL(window.location.href);
 pageUrl.search='';pageUrl.hash='';
 const scene=selectionLabel('application','其他应用');
 const material=selectionLabel('material','需要选型建议');
 return {
  source_url:pageUrl.href,
  subject:`微科纺织｜${scene}面料咨询`,
  name:String(values.name||'').trim(),
  phone:String(values.phone||'').trim(),
  message:[
   `公司名称：${String(values.company||'').trim()}`,
   `电子邮箱：${String(values.email||'').trim()||'未填写'}`,
   `应用场景：${scene}`,
   `面料方向：${material}`,
   '',
   '需求说明：',
   String(values.message||'').trim()
  ].join('\n'),
  ua:navigator.userAgent||''
 };
}
form.addEventListener('input',event=>{
 if(typeof event.target.setCustomValidity==='function')event.target.setCustomValidity('');
});
form.addEventListener('submit',async event=>{
 event.preventDefault();
 if(submitting||!validate())return;
 // 隐藏字段防垃圾提交；不返回虚假成功提示。
 if(fields('website')?.value)return;
 const values=Object.fromEntries(new FormData(form));
 const payload=buildInquiryFields(values);
 if(new TextEncoder().encode(payload.message).byteLength>16000){
  showStatus('需求内容过长，请精简后再提交。','error');return;
 }
 const body=new FormData();
 for(const [key,value] of Object.entries(payload))body.append(key,value);
 const controls=[...form.querySelectorAll('input,select,textarea')];
 const previousStates=controls.map(control=>control.disabled);
 submitting=true;
 submit.disabled=true;
 submit.textContent='正在提交…';
 form.setAttribute('aria-busy','true');
 controls.forEach(control=>{control.disabled=true;});
 showStatus('正在提交，请稍候。','pending');
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),30000);
 try{
  const response=await fetch(NOTIFY_ENDPOINT,{
   method:'POST',body,mode:'cors',credentials:'omit',signal:controller.signal
  });
  let data=null;
  try{data=await response.json();}
  catch{throw new Error(responseError(response.status,null));}
  if(!response.ok||!data||typeof data!=='object'||Array.isArray(data)||data.ok!==true){
   throw new Error(responseError(response.status,data));
  }
  form.reset();
  showStatus('提交成功！您的面料需求已收到，我们会根据所留联系方式与您沟通。','success');
 }catch(error){
  const message=error.name==='AbortError'
   ?'等待响应超时，暂时无法确认是否提交成功。请拨打 15800700798 确认，避免重复提交。'
   :error instanceof TypeError
    ?'网络连接异常，暂时无法确认是否提交成功。请拨打 15800700798 确认。'
    :error.message||'暂时无法确认是否提交成功，请电话联系。';
  showStatus(message,'error');
 }finally{
  clearTimeout(timer);
  controls.forEach((control,index)=>{control.disabled=previousStates[index];});
  submitting=false;
  submit.disabled=false;
  submit.innerHTML=`${submitLabel} <span aria-hidden="true">↗</span>`;
  form.removeAttribute('aria-busy');
 }
});
})();
