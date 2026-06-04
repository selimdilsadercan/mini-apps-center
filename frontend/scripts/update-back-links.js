const fs = require('fs');
const path = require('path');

const files = [
  'app/apps/youtube-discover/page.tsx',
  'app/apps/pdf-tools/page.tsx',
  'app/apps/concert-list/page.tsx',
  'app/apps/itu-yemekhane/page.tsx',
  'app/apps/memedex/page.tsx',
  'app/apps/sticker-editor/page.tsx',
  'app/apps/iskambil/components/IskambilAppBar.tsx',
  'app/apps/hobby-center/page.tsx',
  'app/apps/chocolate-db/page.tsx',
  'app/apps/film-graph/page.tsx',
  'app/apps/tutor-crm/page.tsx',
  'app/apps/icon-set-guide/page.tsx',
  'app/apps/kiler/page.tsx',
  'app/apps/recipe/create/page.tsx',
  'app/apps/game-companion/components/Header.tsx',
  'app/apps/game-companion/components/Sidebar.tsx',
  'app/apps/recipe/page.tsx',
  'app/apps/stop-scroll/page.tsx'
];

files.forEach(relPath => {
  const filePath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping non-existent file: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Insert getRootHomeUrl import if not present
  if (!content.includes('getRootHomeUrl')) {
    if (content.startsWith('"use client";') || content.startsWith("'use client';")) {
      const idx = content.indexOf('\n');
      content = content.substring(0, idx + 1) + 'import { getRootHomeUrl } from "@/lib/apps";\n' + content.substring(idx + 1);
    } else {
      content = 'import { getRootHomeUrl } from "@/lib/apps";\n' + content;
    }
  }

  // Replace router.push('/home') or router.push("/home")
  content = content.replace(/router\.push\(\s*["']\/home["']\s*\)/g, 'window.location.href = getAppRootUrl()');
  
  // Replace Link/a href="/home" or href='/home'
  content = content.replace(/href\s*=\s*["']\/home["']/g, 'href={getAppRootUrl()}');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully updated ${relPath}`);
});
