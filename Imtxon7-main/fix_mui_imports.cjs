const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

// Map of MUI individual path imports to named imports
function fixMuiImports(content) {
    let updated = false;
    
    // Fix @mui/material/* imports (e.g. import Switch from '@mui/material/Switch')
    content = content.replace(
        /import\s+(\w+)\s+from\s+'@mui\/material\/([^']+)'/g,
        (match, name, component) => {
            updated = true;
            // If the name matches component, use named import
            if (name === component) {
                return `import { ${name} } from '@mui/material'`;
            } else {
                return `import { ${component} as ${name} } from '@mui/material'`;
            }
        }
    );
    content = content.replace(
        /import\s+(\w+)\s+from\s+"@mui\/material\/([^"]+)"/g,
        (match, name, component) => {
            updated = true;
            if (name === component) {
                return `import { ${name} } from '@mui/material'`;
            } else {
                return `import { ${component} as ${name} } from '@mui/material'`;
            }
        }
    );
    
    return { content, updated };
}

function processFile(filePath) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) return;
    
    let content = fs.readFileSync(filePath, 'utf-8');
    const result = fixMuiImports(content);
    
    if (result.updated) {
        fs.writeFileSync(filePath, result.content, 'utf-8');
        console.log('Fixed MUI imports:', path.relative(__dirname, filePath));
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

traverse(SRC_DIR);
console.log('Done!');
