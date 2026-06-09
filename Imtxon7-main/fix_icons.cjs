const fs = require('fs');
const path = require('path');

const groupsDir = path.join(__dirname, 'src', 'pages', 'Groups');
const uiDir = path.join(__dirname, 'src', 'components', 'UI');

function fixIconsInFile(filePath) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Fix icon imports: import XIcon from '@mui/icons-material/X' -> import { X as XIcon } from '@mui/icons-material'
    const iconRegex = /import\s+([A-Za-z0-9_]+)\s+from\s+['"]@mui\/icons-material\/([^'"]+)['"]/g;
    content = content.replace(iconRegex, (match, importName, iconName) => {
        updated = true;
        return `import { ${iconName} as ${importName} } from '@mui/icons-material'`;
    });

    if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed icons in:', filePath);
    }
}

function traverseAndFix(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseAndFix(fullPath);
        } else {
            fixIconsInFile(fullPath);
        }
    }
}

traverseAndFix(groupsDir);
traverseAndFix(uiDir);
console.log('Icon fixing complete.');
