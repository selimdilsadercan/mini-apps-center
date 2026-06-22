const fs = require('fs');
const path = require('path');

// Target directory containing the app subdirectories
const appsDir = path.join(__dirname, '../app/apps');

// Read apps.ts contents to extract cancelled (and optionally beta) apps
const appsTsPath = path.join(__dirname, '../lib/apps.ts');
let appsTsContent = '';
try {
  appsTsContent = fs.readFileSync(appsTsPath, 'utf8');
} catch (err) {
  console.error('Failed to read apps.ts:', err);
  process.exit(1);
}

// Simple regex parser to find cancelled app IDs
// Matches structure: id: "app-id", followed by lines that contain isCancelled: true
// We will look for each app block.
const appBlockRegex = /\{\s*id:\s*["']([^"']+)["'][\s\S]*?\}/g;
const cancelledAppIds = [];

let match;
while ((match = appBlockRegex.exec(appsTsContent)) !== null) {
  const block = match[0];
  const appId = match[1];
  if (block.includes('isCancelled: true')) {
    cancelledAppIds.push(appId);
  }
}

console.log('Detected cancelled app IDs from apps.ts:', cancelledAppIds);

// Get argument ('hide' or 'restore')
const mode = process.argv[2] || 'hide';

if (mode === 'hide') {
  console.log('Hiding cancelled apps before build...');
  cancelledAppIds.forEach(appId => {
    const originalPath = path.join(appsDir, appId);
    const hiddenPath = path.join(appsDir, `_${appId}`);
    
    if (fs.existsSync(originalPath)) {
      try {
        fs.renameSync(originalPath, hiddenPath);
        console.log(`Renamed: ${appId} -> _${appId}`);
      } catch (e) {
        console.error(`Failed to rename ${originalPath}:`, e.message);
      }
    } else {
      console.log(`Path not found or already hidden: ${originalPath}`);
    }
  });
} else if (mode === 'restore') {
  console.log('Restoring cancelled apps after build...');
  cancelledAppIds.forEach(appId => {
    const originalPath = path.join(appsDir, appId);
    const hiddenPath = path.join(appsDir, `_${appId}`);
    
    if (fs.existsSync(hiddenPath)) {
      try {
        fs.renameSync(hiddenPath, originalPath);
        console.log(`Restored: _${appId} -> ${appId}`);
      } catch (e) {
        console.error(`Failed to restore ${hiddenPath}:`, e.message);
      }
    } else {
      console.log(`Hidden path not found or already restored: ${hiddenPath}`);
    }
  });
} else {
  console.error('Invalid mode. Use "hide" or "restore".');
  process.exit(1);
}
