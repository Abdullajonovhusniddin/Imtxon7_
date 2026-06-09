const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

function fixMuiIconImports(content) {
    let updated = false;
    
    // Fix @mui/icons-material/* imports
    // e.g. import AddRoundedIcon from '@mui/icons-material/AddRounded'
    content = content.replace(
        /import\s+(\w+)\s+from\s+['"]@mui\/icons-material\/([^'"]+)['"]/g,
        (match, alias, iconName) => {
            updated = true;
            return `import { ${iconName} as ${alias} } from '@mui/icons-material'`;
        }
    );
    
    return { content, updated };
}

function processFile(filePath) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) return;
    
    let content = fs.readFileSync(filePath, 'utf-8');
    const result = fixMuiIconImports(content);
    
    if (result.updated) {
        fs.writeFileSync(filePath, result.content, 'utf-8');
        console.log('Fixed icons:', path.relative(__dirname, filePath));
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
