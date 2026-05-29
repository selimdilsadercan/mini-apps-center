const fs = require('fs');
const path = require('path');

const ICON_SETS = [
  { id: 'lucide', type: 'line', strokeWidth: 2, lineCap: 'round', lineJoin: 'round' },
  { id: 'tabler-icons', type: 'line', strokeWidth: 2, lineCap: 'round', lineJoin: 'round' },
  { id: 'heroicons', type: 'line', strokeWidth: 1.5, lineCap: 'round', lineJoin: 'round' },
  { id: 'phosphor-icons', type: 'line', strokeWidth: 2, lineCap: 'round', lineJoin: 'round' },
  { id: 'remix-icon', type: 'mixed', strokeWidth: 2, lineCap: 'round', lineJoin: 'round' },
  { id: 'radix-icons', type: 'line', strokeWidth: 1.5, lineCap: 'square', lineJoin: 'miter' },
  { id: 'material-symbols', type: 'solid' },
  { id: 'bootstrap-icons', type: 'mixed', strokeWidth: 1.5, lineCap: 'round', lineJoin: 'round' },
  { id: 'iconoir', type: 'line', strokeWidth: 1.5, lineCap: 'round', lineJoin: 'round' },
  { id: 'mingcute', type: 'mixed', strokeWidth: 2, lineCap: 'round', lineJoin: 'round' },
  { id: 'feather-icons', type: 'line', strokeWidth: 2, lineCap: 'round', lineJoin: 'round' },
  { id: 'solar-icons', type: 'duotone', strokeWidth: 2 },
  { id: 'hugeicons', type: 'line', strokeWidth: 1.5, lineCap: 'round', lineJoin: 'round' },
  { id: 'flowbite-icons', type: 'line', strokeWidth: 2, lineCap: 'round', lineJoin: 'round' },
  { id: 'css-gg', type: 'geometric', strokeWidth: 2 },
  { id: 'eva-icons', type: 'mixed', strokeWidth: 2, lineCap: 'round', lineJoin: 'round' },
  { id: 'octicons', type: 'line', strokeWidth: 1.5, lineCap: 'round', lineJoin: 'round' },
  { id: 'simple-icons', type: 'solid' },
  { id: 'carbon-icons', type: 'line', strokeWidth: 1.5, lineCap: 'round', lineJoin: 'round' },
  { id: 'fluent-ui-icons', type: 'mixed', strokeWidth: 1.5, lineCap: 'round', lineJoin: 'round' }
];

// SVG Paths definitions for standard icons
const SHAPES = {
  home: {
    line: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" />',
    solid: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />'
  },
  search: {
    line: '<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />',
    solid: '<path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />'
  },
  user: {
    line: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />',
    solid: '<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />'
  },
  settings: {
    line: '<circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />',
    solid: '<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0.44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />'
  },
  bell: {
    line: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />',
    solid: '<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />'
  },
  plus: {
    line: '<path d="M5 12h14M12 5v14" />',
    solid: '<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />'
  },
  calendar: {
    line: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><path d="M16 2v4M8 2v4M3 10h18" />',
    solid: '<path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm-5-7h-5v5h5v-5z" />'
  },
  trash: {
    line: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />',
    solid: '<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />'
  },
  'arrow-right': {
    line: '<path d="M5 12h14M12 5l7 7-7 7" />',
    solid: '<path d="M12 4l-1.41 1.41L15.17 10H3v2h12.17l-4.58 4.59L12 18l8-8z" />'
  },
  heart: {
    line: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="none" />',
    solid: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />'
  }
};

const BASE_DIR = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(BASE_DIR)) {
  fs.mkdirSync(BASE_DIR, { recursive: true });
}

ICON_SETS.forEach(set => {
  const setDir = path.join(BASE_DIR, set.id);
  if (!fs.existsSync(setDir)) {
    fs.mkdirSync(setDir, { recursive: true });
  }

  Object.keys(SHAPES).forEach(iconName => {
    let content = '';
    const isSolid = set.type === 'solid' || (set.type === 'mixed' && ['user', 'heart', 'trash', 'bell'].includes(iconName));

    if (isSolid) {
      content = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">${SHAPES[iconName].solid}</svg>`;
    } else if (set.type === 'duotone') {
      // Duotone styling: make the primary shape semi-transparent, secondary shape solid
      const strokeStr = `stroke="currentColor" stroke-width="${set.strokeWidth || 2}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
      let shapeHtml = SHAPES[iconName].line;
      // Add opacity class or attribute to first child path
      shapeHtml = shapeHtml.replace('<path', '<path opacity="0.3" fill="currentColor"');
      content = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" ${strokeStr}>${shapeHtml}</svg>`;
    } else if (set.type === 'geometric') {
      // CSS.gg style: sharp edges, no round caps
      const strokeStr = `stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" fill="none"`;
      content = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" ${strokeStr}>${SHAPES[iconName].line}</svg>`;
    } else {
      // Standard Line (Lucide, Tabler, Heroicons, etc.)
      const strokeWidth = set.strokeWidth || 2;
      const lineCap = set.lineCap || 'round';
      const lineJoin = set.lineJoin || 'round';
      const strokeStr = `stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="${lineCap}" stroke-linejoin="${lineJoin}" fill="none"`;
      content = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" ${strokeStr}>${SHAPES[iconName].line}</svg>`;
    }

    const filePath = path.join(setDir, `${iconName}.svg`);
    fs.writeFileSync(filePath, content, 'utf-8');
  });
});

console.log('Successfully generated 200 SVG icons across 20 packages!');
