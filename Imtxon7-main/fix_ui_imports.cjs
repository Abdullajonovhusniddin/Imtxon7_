const fs = require('fs');
const path = require('path');

const UI_DIR = path.join(__dirname, 'src', 'components', 'UI');

function traverseAndFix(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            traverseAndFix(fullPath);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            let updated = false;

            // Fix api/api to point to api.js based on depth
            // E.g. src/components/UI/ManagementSidebar/EditGroupSidebar.jsx -> depth is 3 relative to src
            // So api.js is at ../../../api.js
            
            const relPath = path.relative(path.join(__dirname, 'src'), dir);
            const depth = relPath.split(path.sep).length;
            const prefix = '../'.repeat(depth) + 'api';

            // Find imports matching api
            const regex = /import\s+\{.*api.*\}\s+from\s+['"]([^'"]+)['"]/g;
            content = content.replace(regex, (match, p1) => {
                if (p1.includes('api')) {
                    updated = true;
                    return match.replace(p1, prefix);
                }
                return match;
            });

            if (updated) {
                fs.writeFileSync(fullPath, content, 'utf-8');
                console.log('Fixed:', fullPath);
            }
        }
    }
}

traverseAndFix(UI_DIR);
console.log('Done!');
