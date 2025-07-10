// build.js
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

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

// CSS Minification function
function minifyCSS(css) {
    return css
        // Remove comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove unnecessary whitespace
        .replace(/\s+/g, ' ')
        // Remove whitespace around certain characters
        .replace(/\s*([{}:;,>+~])\s*/g, '$1')
        // Remove trailing semicolons before closing braces
        .replace(/;}/g, '}')
        // Remove leading/trailing whitespace
        .trim();
}

// JavaScript Minification function using Terser
async function minifyJS(js) {
    if (!isProduction) return js;
    
    try {
        const result = await minify(js, {
            compress: {
                dead_code: true,
                drop_console: false, // Keep console.log for debugging, set to true to remove
                drop_debugger: true,
                keep_fargs: false,
                unused: true,
                conditionals: true,
                comparisons: true,
                evaluate: true,
                booleans: true,
                loops: true,
                hoist_funs: true,
                keep_fnames: false,
                hoist_vars: false,
                if_return: true,
                join_vars: true,
                side_effects: false,
                warnings: false
            },
            mangle: {
                toplevel: true,
                reserved: ['

// Process and optimize CSS/JS files in HTML
async function optimizeAssetsInHTML(htmlContent) {
    if (!isProduction) return htmlContent;

    // Process inline CSS
    htmlContent = htmlContent.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, css) => {
        const minifiedCSS = minifyCSS(css);
        return match.replace(css, minifiedCSS);
    });

    // Process inline JavaScript
    const scriptMatches = [];
    let tempContent = htmlContent;
    
    // Find all inline scripts
    tempContent = tempContent.replace(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi, (match, js) => {
        scriptMatches.push({ match, js });
        return `__SCRIPT_PLACEHOLDER_${scriptMatches.length - 1}__`;
    });

    // Minify each script asynchronously
    for (let i = 0; i < scriptMatches.length; i++) {
        const { match, js } = scriptMatches[i];
        const minifiedJS = await minifyJS(js);
        tempContent = tempContent.replace(`__SCRIPT_PLACEHOLDER_${i}__`, match.replace(js, minifiedJS));
    }

    if (scriptMatches.length > 0) {
        console.log('⚡ Minified inline CSS and JavaScript');
    }
    
    return tempContent;
}

// Process external CSS and JS files
async function processExternalAssets(filePath, destPath) {
    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, 'utf8');

    if (!isProduction) {
        // Development: just copy the file
        fs.writeFileSync(destPath, content);
        return;
    }

    if (ext === '.css') {
        const minified = minifyCSS(content);
        fs.writeFileSync(destPath, minified);
        const originalSize = Buffer.byteLength(content, 'utf8');
        const minifiedSize = Buffer.byteLength(minified, 'utf8');
        const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
        console.log(`⚡ Minified CSS: ${path.basename(filePath)} (${savings}% smaller)`);
    } else if (ext === '.js') {
        const minified = await minifyJS(content);
        fs.writeFileSync(destPath, minified);
        const originalSize = Buffer.byteLength(content, 'utf8');
        const minifiedSize = Buffer.byteLength(minified, 'utf8');
        const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
        console.log(`⚡ Minified JS: ${path.basename(filePath)} (${savings}% smaller)`);
    } else {
        // For other files, just copy
        fs.writeFileSync(destPath, content);
    }
}

// Process HTML file
async function processHTML(htmlContent) {
    // Optimize inline assets if production
    htmlContent = await optimizeAssetsInHTML(htmlContent);

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

// Main build function
async function build() {
    // Copy and process index.html
    const indexSrc = path.join(srcDir, 'index.html');
    const indexDest = path.join(distDir, 'index.html');

    if (fs.existsSync(indexSrc)) {
        let htmlContent = fs.readFileSync(indexSrc, 'utf8');
        
        // Process HTML (add GA if production, optimize assets)
        htmlContent = await processHTML(htmlContent);
        
        // Write processed HTML
        fs.writeFileSync(indexDest, htmlContent);
        console.log('✅ Processed and copied index.html to dist/');
    } else {
        console.error('❌ index.html not found in root directory');
        process.exit(1);
    }

    // Copy assets folder recursively with optimization
    async function copyFolderRecursive(src, dest) {
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

        for (const item of items) {
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);

            if (fs.lstatSync(srcPath).isDirectory()) {
                // Recursively copy subdirectories
                await copyFolderRecursive(srcPath, destPath);
            } else {
                // Process file (with optimization if CSS/JS and production)
                await processExternalAssets(srcPath, destPath);
            }
        }

        return true;
    }

    // Copy assets folder if it exists
    if (fs.existsSync(assetsDir)) {
        const assetsDest = path.join(distDir, 'assets');
        if (await copyFolderRecursive(assetsDir, assetsDest)) {
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

    // Process any standalone CSS/JS files in root
    const rootFiles = fs.readdirSync(srcDir);
    for (const file of rootFiles) {
        const ext = path.extname(file).toLowerCase();
        if ((ext === '.css' || ext === '.js') && file !== 'build.js') {
            const srcPath = path.join(srcDir, file);
            const destPath = path.join(distDir, file);
            await processExternalAssets(srcPath, destPath);
        }
    }

    // Build summary
    console.log('\n🎉 Build complete! Files copied to dist/ folder');
    if (isProduction) {
        console.log('🚀 Production build created with Terser JS optimization');
        if (!process.env.GA_MEASUREMENT_ID) {
            console.log('⚠️  No GA_MEASUREMENT_ID found in environment variables');
        }
    } else {
        console.log('🔧 Development build created (no optimization)');
    }
}

// Run the build
build().catch(error => {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
});, 'jQuery'] // Preserve common globals
            },
            format: {
                comments: false,
                beautify: false
            },
            sourceMap: false
        });
        
        return result.code || js;
    } catch (error) {
        console.warn(`⚠️  JavaScript minification failed: ${error.message}`);
        return js; // Return original if minification fails
    }
}

// Process and optimize CSS/JS files in HTML
function optimizeAssetsInHTML(htmlContent) {
    if (!isProduction) return htmlContent;

    // Process inline CSS
    htmlContent = htmlContent.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, css) => {
        const minifiedCSS = minifyCSS(css);
        return match.replace(css, minifiedCSS);
    });

    // Process inline JavaScript
    htmlContent = htmlContent.replace(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi, (match, js) => {
        const minifiedJS = minifyJS(js);
        return match.replace(js, minifiedJS);
    });

    console.log('⚡ Minified inline CSS and JavaScript');
    return htmlContent;
}

// Process external CSS and JS files
function processExternalAssets(filePath, destPath) {
    if (!isProduction) {
        // Development: just copy the file
        fs.copyFileSync(filePath, destPath);
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, 'utf8');

    if (ext === '.css') {
        const minified = minifyCSS(content);
        fs.writeFileSync(destPath, minified);
        console.log(`⚡ Minified CSS: ${path.basename(filePath)}`);
    } else if (ext === '.js') {
        const minified = minifyJS(content);
        fs.writeFileSync(destPath, minified);
        console.log(`⚡ Minified JS: ${path.basename(filePath)}`);
    } else {
        // For other files, just copy
        fs.copyFileSync(filePath, destPath);
    }
}

// Process HTML file
function processHTML(htmlContent) {
    // Optimize inline assets if production
    htmlContent = optimizeAssetsInHTML(htmlContent);

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
    
    // Process HTML (add GA if production, optimize assets)
    htmlContent = processHTML(htmlContent);
    
    // Write processed HTML
    fs.writeFileSync(indexDest, htmlContent);
    console.log('✅ Processed and copied index.html to dist/');
} else {
    console.error('❌ index.html not found in root directory');
    process.exit(1);
}

// Copy assets folder recursively with optimization
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
            // Process file (with optimization if CSS/JS and production)
            processExternalAssets(srcPath, destPath);
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

// Process any standalone CSS/JS files in root
const rootFiles = fs.readdirSync(srcDir);
rootFiles.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if ((ext === '.css' || ext === '.js') && file !== 'build.js') {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(distDir, file);
        processExternalAssets(srcPath, destPath);
    }
});

// Build summary
console.log('\n🎉 Build complete! Files copied to dist/ folder');
if (isProduction) {
    console.log('🚀 Production build created with optimized CSS/JS');
    if (!process.env.GA_MEASUREMENT_ID) {
        console.log('⚠️  No GA_MEASUREMENT_ID found in environment variables');
    }
} else {
    console.log('🔧 Development build created (no optimization)');
}