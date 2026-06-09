const fs = require('fs');
const path = require('path');

const groupsDir = path.join(__dirname, 'src', 'pages', 'Groups');

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

            const relPath = path.relative(path.join(__dirname, 'src'), dir);
            const depth = relPath.split(path.sep).length;
            const prefix = '../'.repeat(depth) + 'api';

            // E.g. import { api } from '../../../api'; or import { getFileUrl } from '../../api'
            const regex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
            content = content.replace(regex, (match, imports, modulePath) => {
                if (modulePath.includes('api') && !modulePath.includes('@mui')) {
                    updated = true;
                    return `import { ${imports} } from '${prefix}'`;
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

traverseAndFix(groupsDir);
console.log('Done!');
