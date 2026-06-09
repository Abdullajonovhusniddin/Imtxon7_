const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

function fixMuiIconEsm(content) {
    let updated = false;
    
    // Convert named imports back to default ESM imports
    // e.g. import { AddRounded as AddRoundedIcon } from '@mui/icons-material'
    // or import { AddRounded as AddRoundedIcon, CloseRounded as CloseRoundedIcon } from '@mui/icons-material'
    content = content.replace(
        /import\s+\{([^}]+)\}\s+from\s+['"]@mui\/icons-material['"]/g,
        (match, importsStr) => {
            updated = true;
            const imports = importsStr.split(',').map(s => s.trim()).filter(Boolean);
            const lines = imports.map(imp => {
                // Parse "IconName as Alias" or just "IconName"
                let iconName = imp;
                let alias = imp;
                if (imp.includes(' as ')) {
                    const parts = imp.split(' as ');
                    iconName = parts[0].trim();
                    alias = parts[1].trim();
                }
                return `import ${alias} from '@mui/icons-material/esm/${iconName}.js';`;
            });
            return lines.join('\n');
        }
    );
    
    // Also convert any remaining direct default imports to esm
    // import AddRoundedIcon from '@mui/icons-material/AddRounded' -> import AddRoundedIcon from '@mui/icons-material/esm/AddRounded.js'
    content = content.replace(
        /import\s+(\w+)\s+from\s+['"]@mui\/icons-material\/([^'"]+)['"]/g,
        (match, alias, iconName) => {
            if (iconName.startsWith('esm/')) return match;
            updated = true;
            return `import ${alias} from '@mui/icons-material/esm/${iconName}.js';`;
        }
    );
    
    return { content, updated };
}

function processFile(filePath) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) return;
    
    let content = fs.readFileSync(filePath, 'utf-8');
    const result = fixMuiIconEsm(content);
    
    if (result.updated) {
        fs.writeFileSync(filePath, result.content, 'utf-8');
        console.log('Fixed icons to ESM:', path.relative(__dirname, filePath));
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
