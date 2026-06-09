const fs = require('fs');
const path = require('path');

const GROUPS_DIR = path.join(__dirname, 'src', 'pages', 'Groups');

function fixRouting(content) {
    let updated = false;
    
    // Replace /dashboard/groups with /groups
    const newContent = content.replace(/\/dashboard\/groups/g, () => {
        updated = true;
        return '/groups';
    });
    
    return { content: newContent, updated };
}

function processFile(filePath) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) return;
    
    let content = fs.readFileSync(filePath, 'utf-8');
    const result = fixRouting(content);
    
    if (result.updated) {
        fs.writeFileSync(filePath, result.content, 'utf-8');
        console.log('Fixed routing:', path.relative(__dirname, filePath));
    }
}

function traverse(dir) {
    for (const item of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, item);
        if (item === 'node_modules' || item === '.git') continue;
        if (fs.statSync(fullPath).isDirectory()) traverse(fullPath);
        else processFile(fullPath);
    }
}

traverse(GROUPS_DIR);
console.log('Routing fix done!');
