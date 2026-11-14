/* 앱 스토어 화면. 앱 정보는 apps.json 에서 읽고, 글자는 모두 textContent 로 넣어요(나중에 남이 올린 앱 정보도 같은 방식으로 안전하게). */
(function(){
'use strict';
var SECTIONS=[['games','게임'],['educations','교육'],['tools','도구']];
var FEATURED=['stickseum','crownenvoy'];
var apps=[], tab='all', q='';

function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
function safeUrl(u){try{var x=new URL(u,location.href);return /^https?:$/.test(x.protocol)?x.href:'#'}catch(e){return '#'}}
function hue(id){var h=0;for(var i=0;i<id.length;i++)h=(h*31+id.charCodeAt(i))%360;return h}
function labelOf(sec){for(var i=0;i<SECTIONS.length;i++)if(SECTIONS[i][0]===sec)return SECTIONS[i][1];return ''}

function icon(a,extra){
  var s=el('span','ic'+(extra?' '+extra:''));
  var h=hue(a.id);
  s.style.setProperty('--a','hsl('+h+' 60% 52%)');
  s.style.setProperty('--b','hsl('+((h+40)%360)+' 55% 28%)');
  if(a.icon){
    var im=document.createElement('img');
    im.alt='';im.decoding='async';im.src=safeUrl(a.icon);
    im.onerror=function(){im.remove();s.textContent=(a.name||'?').charAt(0).toUpperCase()};
    s.appendChild(im);
  }else{s.textContent=(a.name||'?').charAt(0).toUpperCase()}
  return s;
}
function devLine(a){
  var f=document.createDocumentFragment();
  if(a.official){f.appendChild(el('i','official','공식'))}
  f.appendChild(document.createTextNode((a.dev||'')+((a.tags&&a.tags.length)?' · '+a.tags.slice(0,2).join(' · '):'')));
  return f;
}
/* "설치": 설치 전용 페이지(흰 화면)를 열어요 */
function getBtn(a){
  if(!a.official) return document.createDocumentFragment();
  var g=el('span','get','설치'); g.setAttribute('role','button');
  g.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();if(/^[a-z]+$/.test(a.id))location.href='https://frenchfries777.com/games/install/?app='+a.id});
  return g;
}
function row(a){
  var r=el('a','row'); r.href=safeUrl(a.url);
  r.appendChild(icon(a));
  var t=el('div','t'); t.appendChild(el('b',null,a.name)); t.appendChild(el('span',null,a.tagline||''));
  var em=el('em'); em.appendChild(devLine(a)); t.appendChild(em);
  r.appendChild(t); r.appendChild(getBtn(a));
  return r;
}
function featured(a){
  var c=el('a','fc'); c.href=safeUrl(a.url);
  var bg=el('div','bg'); if(a.shot)bg.style.backgroundImage='url("'+safeUrl(a.shot)+'")'; c.appendChild(bg);
  var top=el('div'); top.appendChild(el('div','lab',labelOf(a.section)));
  top.appendChild(el('h2',null,a.name)); top.appendChild(el('p',null,a.tagline||'')); c.appendChild(top);
  var bar=el('div','bar'); bar.appendChild(icon(a));
  var d=el('div'); d.appendChild(el('b',null,a.name)); var sm=el('small'); sm.appendChild(devLine(a)); d.appendChild(sm);
  bar.appendChild(d); bar.appendChild(getBtn(a)); c.appendChild(bar);
  return c;
}
function match(a){
  if(!q)return true;
  var s=(a.name+' '+(a.tagline||'')+' '+(a.tags||[]).join(' ')+' '+(a.dev||'')).toLowerCase();
  return s.indexOf(q)>-1;
}
function section(title,list){
  var s=el('section','sec'); var h=el('div','sh'); h.appendChild(el('h3',null,title)); h.appendChild(el('span',null,list.length+'개')); s.appendChild(h);
  var l=el('div','list'); list.forEach(function(a){l.appendChild(row(a))}); s.appendChild(l); return s;
}
function render(){
  var feat=document.getElementById('feat'), body=document.getElementById('body'), h1=document.getElementById('h1'), date=document.getElementById('date');
  feat.textContent='';body.textContent='';
  document.querySelectorAll('.tab').forEach(function(b){b.setAttribute('aria-selected',b.dataset.t===tab?'true':'false')});
  if(q){
    h1.textContent='검색 결과'; date.textContent='';
    var res=apps.filter(match);
    if(!res.length){body.appendChild(el('p','note','찾는 앱이 없어요.'));return}
    body.appendChild(section('"'+q+'"',res));return;
  }
  if(tab==='all'){
    h1.textContent='오늘의 추천';
    date.textContent=new Date().toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'long'});
    FEATURED.forEach(function(id){var a=apps.filter(function(x){return x.id===id})[0];if(a)feat.appendChild(featured(a))});
    SECTIONS.forEach(function(s){var l=apps.filter(function(a){return a.section===s[0]});if(l.length)body.appendChild(section(s[1],l))});
  }else{
    h1.textContent=labelOf(tab); date.textContent='';
    var l2=apps.filter(function(a){return a.section===tab});
    body.appendChild(section(labelOf(tab),l2));
  }
}
function setTab(t){tab=t;try{history.replaceState(null,'',t==='all'?location.pathname:'#'+t)}catch(e){}render()}

document.getElementById('tabs').addEventListener('click',function(e){
  var b=e.target.closest('.tab'); if(!b)return; document.getElementById('q').value=''; q=''; setTab(b.dataset.t);
});
document.getElementById('q').addEventListener('input',function(e){q=e.target.value.trim().toLowerCase();render()});
window.addEventListener('hashchange',function(){var t=location.hash.slice(1);if(t==='games'||t==='educations'||t==='tools')setTab(t);else if(!t)setTab('all')});

/* 스토어 자체를 앱으로 설치 */
var instEv=null, instB=document.getElementById('inst');
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();instEv=e;if(instB)instB.hidden=false});
window.addEventListener('appinstalled',function(){instEv=null;if(instB)instB.hidden=true});
if(instB)instB.addEventListener('click',function(){var e=instEv;if(!e)return;instEv=null;instB.hidden=true;e.prompt()});
try{if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js?v=2').catch(function(){})}catch(e){}

var start=location.hash.slice(1); if(start==='games'||start==='educations'||start==='tools')tab=start;
fetch('apps.json?v=2').then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){apps=j.apps||[];render()})
  .catch(function(){document.getElementById('body').appendChild(el('p','note','앱 목록을 불러오지 못했어요. 새로고침해 보세요.'))});
})();
