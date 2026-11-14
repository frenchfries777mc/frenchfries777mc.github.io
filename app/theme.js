/* 앱 스토어 색: frenchfries777.com 의 다크/라이트 설정을 그대로 따라요.
   frenchfries777.com 에서는 localStorage 'ff.theme', 다른 주소(apps.)에서는 쿠키 'ffth' 를 읽어요. */
(function(){try{
  var T=['dark','light','yellow','red','blue'],v='';
  try{v=localStorage.getItem('ff.theme')||'';}catch(e){}
  if(T.indexOf(v)<0){var m=document.cookie.match(/(?:^|; )ffth=([a-z]+)/);v=m?m[1]:'';}
  if(T.indexOf(v)<0)v='dark';
  var h=document.documentElement;
  h.setAttribute('data-st',(v==='light'||v==='yellow')?'light':'dark');
  if(v==='yellow'||v==='red'||v==='blue')h.setAttribute('data-sa',v);else h.removeAttribute('data-sa');
  if(/(^|\.)frenchfries777\.com$/.test(location.hostname))document.cookie='ffth='+v+';domain=.frenchfries777.com;path=/;max-age=31536000;samesite=lax;secure';
  var mt=document.querySelector('meta[name=theme-color]');if(mt)mt.content=(v==='light'||v==='yellow')?'#f6f3ec':'#0e0e0e';
  window.addEventListener('storage',function(e){if(e.key==='ff.theme')location.reload();});
}catch(e){}})();
