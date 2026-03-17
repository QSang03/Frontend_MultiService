/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Directories to create
const baseDir = 'c:\\Users\\sangnq\\Downloads\\IT Multi-Service\\frontend\\src\\app\\api\\sale\\tickets';
const dirs = [
  path.join(baseDir, 'live-location'),
  path.join(baseDir, 'upgrade-sla')
];

console.log('Creating directories...\n');

// Create directories
dirs.forEach(dir => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✓ Created: ${dir}`);
    } else {
      console.log(`✓ Already exists: ${dir}`);
    }
  } catch (err) {
    console.error(`✗ Error creating ${dir}: ${err.message}`);
  }
});

// List contents
console.log(`\n\nContents of: ${baseDir}\n`);
try {
  const contents = fs.readdirSync(baseDir, { withFileTypes: true });
  contents.sort((a, b) => a.name.localeCompare(b.name));
  
  contents.forEach(item => {
    const type = item.isDirectory() ? '[DIR] ' : '[FILE]';
    console.log(`${type}${item.name}`);
  });
} catch (err) {
  console.error(`Error listing directory: ${err.message}`);
}
