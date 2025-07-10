// build.js
const fs = require('fs');
const path = require('path');

// Define source and destination paths
const srcDir = process.cwd();
const distDir = path.join(srcDir, 'dist');
const assetsDir = path.join(srcDir, 'assets');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
    console.log('✅ Created dist directory');
} else {
    // Clean dist directory
    fs.rmSync(distDir, { recursive: true, force: true });
    fs.mkdirSync(distDir, { recursive: true });
    console.log('🧹 Cleaned dist directory');
}

// Copy index.html
const indexSrc = path.join(srcDir, 'index.html');
const indexDest = path.join(distDir, 'index.html');

if (fs.existsSync(indexSrc)) {
    fs.copyFileSync(indexSrc, indexDest);
    console.log('✅ Copied index.html to dist/');
} else {
    console.error('❌ index.html not found in root directory');
    process.exit(1);
}

// Copy assets folder recursively
function copyFolderRecursive(src, dest) {
    if (!fs.existsSync(src)) {
        console.error(`❌ Source folder ${src} does not exist`);
        return false;
    }

    // Create destination folder
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    // Read all items in source folder
    const items = fs.readdirSync(src);

    items.forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);

        if (fs.lstatSync(srcPath).isDirectory()) {
            // Recursively copy subdirectories
            copyFolderRecursive(srcPath, destPath);
        } else {
            // Copy file
            fs.copyFileSync(srcPath, destPath);
        }
    });

    return true;
}

// Copy assets folder if it exists
if (fs.existsSync(assetsDir)) {
    const assetsDest = path.join(distDir, 'assets');
    if (copyFolderRecursive(assetsDir, assetsDest)) {
        console.log('✅ Copied assets/ folder to dist/');
    }
} else {
    console.warn('⚠️  No assets/ folder found in root directory');
}

// Copy manifest.json if it exists
const manifestSrc = path.join(srcDir, 'manifest.json');
const manifestDest = path.join(distDir, 'manifest.json');

if (fs.existsSync(manifestSrc)) {
    fs.copyFileSync(manifestSrc, manifestDest);
    console.log('✅ Copied manifest.json to dist/');
}

console.log('\n🎉 Build complete! Files copied to dist/ folder');