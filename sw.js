// 오프라인 지원. 한 번 받아온 것(페이지, 지도 프로그램, 본 적 있는 지도 조각·사진·도보 경로)을 기기에 저장해 두고
// 인터넷이 없을 때 저장본으로 보여 줌.
// ponytail: 저장 용량을 정리하지 않음. 지도를 아주 많이 돌아다니면 수십 MB까지 늘 수 있고, 그때는 CACHE 이름을 바꿔 새로 시작
const CACHE = 'osaka-trip-v1';
const SHELL = ['./', 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js', 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => clients.claim()));
});

const save = (req, res) => {
  if (res.ok || res.type === 'opaque') caches.open(CACHE).then(c => c.put(req, res.clone()));
  return res;
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  const own = new URL(req.url).origin === location.origin;
  // 페이지 자체는 최신본 우선(수정 사항이 바로 반영되게), 실패하면 저장본. 그 외(지도·사진)는 저장본 우선
  e.respondWith(own
    ? fetch(req).then(res => save(req, res)).catch(() => caches.match(req, { ignoreSearch: true }))
    : caches.match(req).then(hit => hit || fetch(req).then(res => save(req, res))));
});
