/* 앱을 분리된 칸(iframe) 안에서 열고, 그 앱의 저장 내용(localStorage)을 이 브라우저에 앱별로 따로 보관해요.
   앱은 이 사이트의 로그인·다른 앱의 저장 내용을 볼 수 없어요. 앱 번호별로 나눠 담고, 크기·개수에 상한이 있어요. */
(function(){
'use strict';
var q=new URLSearchParams(location.search),id=q.get('id')||'';
var fr=document.getElementById('fr'),st=document.getElementById('st');
if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)){document.getElementById('err').hidden=false;return}
var KEY='ffapp:'+id,MAXC=150000,MAXK=300,data={};
try{var raw=localStorage.getItem(KEY);if(raw){var o=JSON.parse(raw);if(o&&typeof o==='object')Object.keys(o).forEach(function(k){if(typeof o[k]==='string')data[k]=o[k]})}}catch(e){}
function size(d){var n=0,k=0;for(var x in d){if(Object.prototype.hasOwnProperty.call(d,x)){n+=x.length+d[x].length;k++}}return[n,k]}
fr.setAttribute('sandbox','allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-pointer-lock allow-downloads allow-orientation-lock');
function url(extra){return '/'+id+'/'+(extra||'')+'#ffs='+encodeURIComponent(JSON.stringify(data))}
fr.src=url();fr.hidden=false;
var t=null,last='';
window.addEventListener('message',function(e){
  if(e.source!==fr.contentWindow)return;
  var m=e.data;if(!m||m.ffs!==1||!m.d||typeof m.d!=='object'||Array.isArray(m.d))return;
  var nd={};Object.keys(m.d).forEach(function(k){if(typeof m.d[k]==='string')nd[k]=m.d[k]});
  var s=size(nd);
  if(s[0]>MAXC||s[1]>MAXK){st.textContent='저장 공간이 가득 찼어요(150KB)';return}
  data=nd;clearTimeout(t);t=setTimeout(persist,150);
});
function persist(){
  var j=JSON.stringify(data);if(j===last)return;
  try{localStorage.setItem(KEY,j);last=j;st.textContent=Object.keys(data).length?'저장됨':''}catch(e){st.textContent='저장하지 못했어요'}
}
window.addEventListener('pagehide',persist);
document.addEventListener('visibilitychange',function(){if(document.hidden)persist()});
var armed=false,c=document.getElementById('clr');
c.addEventListener('click',function(){
  if(!armed){armed=true;c.textContent='정말요? 한 번 더';setTimeout(function(){armed=false;c.textContent='저장된 내용 지우기'},4000);return}
  try{localStorage.removeItem(KEY)}catch(e){}
  data={};last='';
  try{fr.contentWindow.postMessage({ffs:1,clear:1},'*')}catch(e){}
  setTimeout(function(){fr.src=url('?r='+Date.now());st.textContent='지웠어요'},400);
  armed=false;c.textContent='저장된 내용 지우기';
});
})();
