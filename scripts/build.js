// build.js
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Define source and destination paths
const srcDir = process.cwd();
const distDir = path.join(srcDir, 'dist');
const assetsDir = path.join(srcDir, 'assets');

// Check if this is a production build
const isProduction = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';

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

// Process HTML file
function processHTML(htmlContent) {
    // If production build and GA_ID exists, inject Google Analytics
    if (isProduction && process.env.GA_MEASUREMENT_ID) {
        const gaScript = `
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${process.env.GA_MEASUREMENT_ID}"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${process.env.GA_MEASUREMENT_ID}');
    </script>
</head>`;
        
        // Inject GA script before closing </head> tag
        htmlContent = htmlContent.replace('</head>', gaScript);
        console.log('📊 Added Google Analytics to production build');
    }
    
    return htmlContent;
}

// Copy and process index.html
const indexSrc = path.join(srcDir, 'index.html');
const indexDest = path.join(distDir, 'index.html');

if (fs.existsSync(indexSrc)) {
    let htmlContent = fs.readFileSync(indexSrc, 'utf8');
    
    // Process HTML (add GA if production)
    htmlContent = processHTML(htmlContent);
    
    // Write processed HTML
    fs.writeFileSync(indexDest, htmlContent);
    console.log('✅ Processed and copied index.html to dist/');
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

// Build summary
console.log('\n🎉 Build complete! Files copied to dist/ folder');
if (isProduction) {
    console.log('🚀 Production build created');
    if (!process.env.GA_MEASUREMENT_ID) {
        console.log('⚠️  No GA_MEASUREMENT_ID found in environment variables');
    }
} else {
    console.log('🔧 Development build created (no analytics)');
}