/* 승인된 커뮤니티 앱과 별점을 읽어 app/community.json 으로 저장해요. (공개 함수만 써요: 승인된 앱만 나와요)
   GitHub Actions 가 10분마다 돌려요. 스토어는 이 파일을 읽어서, 사이트 보안 설정(CSP)을 바꾸지 않아도 돼요. */
import { writeFileSync } from 'node:fs';
const SB = 'https://kebsbuvuutilitwlvxzv.supabase.co';
const KEY = 'sb_publishable_4Egu0zm3p6cxWGvP_-GlIw_mlCpO1Nf';
const IMG = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;
const CAT = ['games', 'educations', 'tools', 'social'];
async function rpc(name, args) {
  const r = await fetch(`${SB}/rest/v1/rpc/${name}`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args || {}) });
  if (!r.ok) throw new Error(`${name} ${r.status}`);
  return r.json();
}
const [list, stats] = await Promise.all([rpc('app_store_list'), rpc('app_rating_stats', { p_ids: null })]);
const apps = list.filter(c => CAT.includes(c.category)).map(c => ({
  id: String(c.id), name: String(c.name), tagline: String(c.tagline), category: c.category, tags: (c.tags || []).map(String),
  icon: IMG.test(c.icon || '') ? c.icon : '', dev: String(c.dev || ''),
}));
const st = {};
for (const x of [...stats].sort((a, b) => a.app_id.localeCompare(b.app_id))) st[x.app_id] = { avg: Number(x.avg), n: x.n };
writeFileSync('app/community.json', JSON.stringify({ apps, stats: st }) + '\n');
console.log(`apps ${apps.length}, rated ${Object.keys(st).length}`);
