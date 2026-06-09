const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

function fixFile(filePath) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) return;

    let content = fs.readFileSync(filePath, 'utf-8');
    let updated = false;

    // Fix: import { api } from '../../api/api' -> import { api } from '../../api'
    // Also fix any ../../../../api/api etc.
    const newContent = content.replace(
        /from\s+['"]([^'"]*\/api\/api)['"]/g,
        (match, p1) => {
            updated = true;
            const fixed = p1.replace(/\/api\/api$/, '/api');
            return `from '${fixed}'`;
        }
    );

    if (updated) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log('Fixed:', path.relative(__dirname, filePath));
    }
}

function traverse(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        if (item === 'node_modules' || item === '.git') continue;
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            traverse(fullPath);
        } else {
            fixFile(fullPath);
        }
    }
}

traverse(SRC_DIR);
console.log('Done!');
