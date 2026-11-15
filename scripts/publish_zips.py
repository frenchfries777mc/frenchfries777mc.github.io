#!/usr/bin/env python3
"""승인된 커뮤니티 앱의 zip 파일을 app/<앱 id>/ 폴더로 풀어 올려요. (GitHub Actions 가 10분마다 돌려요)
- 공개 함수 app_zip_list 만 써요: 승인된 앱의 zip 위치만 나와요.
- zip 은 다시 한 번 검사해요(확장자·크기·경로). 하나라도 어긋나면 그 앱은 올리지 않아요.
- 승인이 취소된(반려·내림·철회) 앱 폴더는 지워요.
- 앱 안에서 저장소(localStorage 등)를 못 써도 멈추지 않게, 모든 html 맨 위에 작은 보조 코드를 넣어요."""
import io, json, os, re, shutil, sys, urllib.request, zipfile

SB = 'https://kebsbuvuutilitwlvxzv.supabase.co'
KEY = 'sb_publishable_4Egu0zm3p6cxWGvP_-GlIw_mlCpO1Nf'
UUID = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
ZIPPATH = re.compile(r'^[0-9a-f-]{36}/[0-9a-f-]{36}\.zip$')
OK_EXT = {'html','htm','css','js','mjs','json','txt','md','xml','map','csv','png','jpg','jpeg','gif','webp','avif','svg','ico','mp3','ogg','wav','m4a','flac','mp4','webm','woff','woff2','ttf','otf','wasm','glb','gltf','bin','dat','tsv','webmanifest','atlas','fnt'}
MAX_ZIP = 8 * 1024 * 1024
MAX_TOTAL = 40 * 1024 * 1024
MAX_FILES = 400
SHIM = ('<meta name="robots" content="noindex"><script>(function(){function mk(){var d={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},'
        'setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){d={}},key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}}'
        '["localStorage","sessionStorage"].forEach(function(n){try{window[n].getItem("x")}catch(e){try{Object.defineProperty(window,n,{value:mk(),configurable:true})}catch(e2){}}})})();</script>')

def rpc(name):
    req = urllib.request.Request(f'{SB}/rest/v1/rpc/{name}', data=b'{}', headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

def fetch_zip(path):
    with urllib.request.urlopen(f'{SB}/storage/v1/object/public/app-zips/{path}', timeout=120) as r:
        data = r.read(MAX_ZIP + 1)
    if len(data) > MAX_ZIP:
        raise ValueError('zip 이 너무 커요')
    return data

def clean_name(n):
    n = n.replace('\\', '/')
    if n.startswith('/') or '\x00' in n or re.match(r'^[A-Za-z]:', n):
        raise ValueError('경로가 올바르지 않아요: ' + n)
    parts = [p for p in n.split('/') if p not in ('', '.')]
    if any(p == '..' for p in parts):
        raise ValueError('경로가 올바르지 않아요: ' + n)
    return parts

def extract(data):
    z = zipfile.ZipFile(io.BytesIO(data))
    files = {}
    total = 0
    for info in z.infolist():
        if info.is_dir():
            continue
        if (info.external_attr >> 16) & 0o170000 == 0o120000:
            raise ValueError('바로가기 파일은 쓸 수 없어요')
        parts = clean_name(info.filename)
        if not parts or parts[0] == '__MACOSX' or parts[-1] in ('.DS_Store', 'Thumbs.db'):
            continue
        total += info.file_size
        if total > MAX_TOTAL or len(files) >= MAX_FILES:
            raise ValueError('파일이 너무 크거나 많아요')
        ext = parts[-1].rsplit('.', 1)[-1].lower() if '.' in parts[-1] else ''
        if ext not in OK_EXT:
            raise ValueError('쓸 수 없는 파일 종류예요: ' + info.filename)
        files['/'.join(parts)] = z.read(info)
    if not files:
        raise ValueError('파일이 없어요')
    # 맨 바깥에 index.html 이 없고 폴더 하나만 있으면 그 폴더를 앱 맨 위로 봐요
    if 'index.html' not in files:
        tops = {k.split('/')[0] for k in files}
        if len(tops) == 1:
            pre = tops.pop() + '/'
            files = {k[len(pre):]: v for k, v in files.items() if k.startswith(pre)}
    if 'index.html' not in files:
        raise ValueError('맨 위에 index.html 이 있어야 해요')
    return files

def beacon(app_id):
    # 열린 횟수만 세요: 앱 번호와 "open" 만 보내고, 누가 열었는지는 보내지 않아요
    return ('<script>try{fetch("%s/rest/v1/rpc/app_hit",{method:"POST",keepalive:true,headers:{apikey:"%s","Content-Type":"application/json"},'
            'body:JSON.stringify({p_app:"%s",p_kind:"open"})}).catch(function(){})}catch(e){}</script>') % (SB, KEY, app_id)

def shimmed(b, extra=''):
    s = b.decode('utf-8', 'replace')
    m = re.search(r'<head[^>]*>', s, re.I)
    if m:
        return (s[:m.end()] + SHIM + extra + s[m.end():]).encode()
    return (SHIM + extra + s).encode()

def write_app(app_id, files):
    dest = os.path.join('app', app_id)
    tmp = dest + '.tmp'
    shutil.rmtree(tmp, ignore_errors=True)
    for name, b in files.items():
        p = os.path.join(tmp, name)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        if name.lower().endswith(('.html', '.htm')):
            b = shimmed(b, beacon(app_id) if name == 'index.html' else '')
        with open(p, 'wb') as f:
            f.write(b)
    shutil.rmtree(dest, ignore_errors=True)
    os.rename(tmp, dest)

def main():
    try:
        rows = rpc('app_zip_list')
    except Exception as e:   # 아직 DB 변경 전이거나 잠깐 안 될 때는 아무것도 건드리지 않아요
        print('목록을 못 읽어서 건너뜀:', e, file=sys.stderr)
        return
    approved = {str(x['id']): x['zip_path'] for x in rows if UUID.match(str(x['id'])) and ZIPPATH.match(x.get('zip_path') or '')}
    have = {d for d in os.listdir('app') if UUID.match(d) and os.path.isdir(os.path.join('app', d))}
    for d in sorted(have - set(approved)):
        shutil.rmtree(os.path.join('app', d)); print('내림:', d)
    for app_id, zp in approved.items():
        if app_id in have:
            continue
        try:
            files = extract(fetch_zip(zp))
            write_app(app_id, files)
            print('올림:', app_id, len(files), '개 파일')
        except Exception as e:
            print('건너뜀:', app_id, e, file=sys.stderr)

if __name__ == '__main__':
    main()
