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

// Copy and process HTML files
function processAndCopyHTML(srcPath, destPath, fileName) {
    if (fs.existsSync(srcPath)) {
        let htmlContent = fs.readFileSync(srcPath, 'utf8');
        
        // Process HTML (add GA if production)
        htmlContent = processHTML(htmlContent);
        
        // Write processed HTML
        fs.writeFileSync(destPath, htmlContent);
        console.log(`✅ Processed and copied ${fileName} to dist/`);
        return true;
    }
    return false;
}

// Copy homepage
const indexSrc = path.join(srcDir, 'index.html');
const indexDest = path.join(distDir, 'index.html');

if (!processAndCopyHTML(indexSrc, indexDest, 'index.html')) {
    console.error('❌ index.html not found in root directory');
    process.exit(1);
}

// Copy simulator directory
const simulatorDir = path.join(srcDir, 'simulator');
const simulatorDistDir = path.join(distDir, 'simulator');

if (fs.existsSync(simulatorDir)) {
    // Create simulator directory in dist
    if (!fs.existsSync(simulatorDistDir)) {
        fs.mkdirSync(simulatorDistDir, { recursive: true });
    }
    
    // Copy simulator index.html
    const simulatorIndexSrc = path.join(simulatorDir, 'index.html');
    const simulatorIndexDest = path.join(simulatorDistDir, 'index.html');
    
    if (!processAndCopyHTML(simulatorIndexSrc, simulatorIndexDest, 'simulator/index.html')) {
        console.error('❌ simulator/index.html not found');
        process.exit(1);
    }
} else {
    console.error('❌ simulator/ directory not found');
    process.exit(1);
}

// Copy learn directory
const learnDir = path.join(srcDir, 'learn');
const learnDistDir = path.join(distDir, 'learn');

if (fs.existsSync(learnDir)) {
    // Create learn directory in dist
    if (!fs.existsSync(learnDistDir)) {
        fs.mkdirSync(learnDistDir, { recursive: true });
    }
    
    // Copy learn index.html
    const learnIndexSrc = path.join(learnDir, 'index.html');
    const learnIndexDest = path.join(learnDistDir, 'index.html');
    
    if (!processAndCopyHTML(learnIndexSrc, learnIndexDest, 'learn/index.html')) {
        console.warn('⚠️  learn/index.html not found');
    }
} else {
    console.log('ℹ️  learn/ directory not found (optional)');
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