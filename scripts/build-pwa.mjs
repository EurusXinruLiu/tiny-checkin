import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(projectRoot, 'dist');
const iconsDir = path.join(distDir, 'icons');
const fontsDir = path.join(distDir, 'fonts');

await mkdir(iconsDir, { recursive: true });
await Promise.all([
  cp(path.join(projectRoot, 'assets/pwa-icon-192.png'), path.join(iconsDir, 'icon-192.png')),
  cp(path.join(projectRoot, 'assets/pwa-icon-512.png'), path.join(iconsDir, 'icon-512.png')),
  cp(
    path.join(projectRoot, 'assets/apple-touch-icon.png'),
    path.join(iconsDir, 'apple-touch-icon.png'),
  ),
]);

const generatedFontsDir = path.join(
  distDir,
  'assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts',
);
await mkdir(fontsDir, { recursive: true });
const fontFiles = (await readdir(generatedFontsDir)).filter((file) => file.endsWith('.ttf'));
await Promise.all(
  fontFiles.map((file) => cp(path.join(generatedFontsDir, file), path.join(fontsDir, file))),
);

const webBundleDir = path.join(distDir, '_expo/static/js/web');
const bundleFiles = (await readdir(webBundleDir)).filter((file) => file.endsWith('.js'));
for (const bundleFile of bundleFiles) {
  const bundlePath = path.join(webBundleDir, bundleFile);
  const bundle = await readFile(bundlePath, 'utf8');
  const rewrittenBundle = bundle.replace(
    /\/assets\/node_modules\/@expo\/vector-icons\/build\/vendor\/react-native-vector-icons\/Fonts\/([^"']+\.ttf)/g,
    '/fonts/$1',
  );
  await writeFile(bundlePath, rewrittenBundle);
}
await rm(path.join(distDir, 'assets'), { recursive: true, force: true });

const manifest = {
  name: '小小打卡',
  short_name: '小小打卡',
  description: '记录健身、学习和生活习惯的离线月历打卡应用',
  lang: 'zh-CN',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#FBF7FC',
  theme_color: '#8F5BD7',
  icons: [
    {
      src: './icons/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: './icons/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
  ],
};

await writeFile(
  path.join(distDir, 'manifest.webmanifest'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

const indexPath = path.join(distDir, 'index.html');
let html = await readFile(indexPath, 'utf8');
html = html
  .replace('<html lang="en">', '<html lang="zh-CN">')
  .replace(
    /<meta name="viewport"[^>]*>/,
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />',
  )
  .replace('You need to enable JavaScript to run this app.', '请启用 JavaScript 后使用小小打卡。')
  .replace(
    '</head>',
    `  <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="小小打卡" />
    <link rel="manifest" href="./manifest.webmanifest" />
    <link rel="apple-touch-icon" href="./icons/apple-touch-icon.png" />
    <style>
      body { margin: 0; background: #f4eaf6; overscroll-behavior: none; }
      #root { width: 100%; max-width: 480px; margin: 0 auto; background: #fbf7fc; }
      @media (display-mode: standalone) { #root { max-width: none; } }
    </style>
  </head>`,
  );
await writeFile(indexPath, html);

async function listFiles(directory) {
  const entries = await readdir(directory);
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry);
    const info = await stat(absolutePath);
    if (info.isDirectory()) {
      files.push(...(await listFiles(absolutePath)));
    } else if (entry !== 'sw.js') {
      files.push(absolutePath);
    }
  }

  return files;
}

const files = (await listFiles(distDir)).sort();
const precacheUrls = files.map(
  (file) => `./${path.relative(distDir, file).split(path.sep).join('/')}`,
);
const versionHash = createHash('sha256');
for (let index = 0; index < files.length; index += 1) {
  versionHash.update(precacheUrls[index]);
  versionHash.update(await readFile(files[index]));
}
const version = versionHash.digest('hex').slice(0, 12);
const serviceWorker = `const CACHE_NAME = 'tiny-checkin-${version}';
const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html')),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    }),
  );
});
`;

await writeFile(path.join(distDir, 'sw.js'), serviceWorker);
console.log(`PWA ready: ${precacheUrls.length} files cached for offline use.`);
