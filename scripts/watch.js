// scripts/watch.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const http = require('http');
const url = require('url');

// Configuration
const PORT = 8080;
const DIST_DIR = 'dist';

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m'
};

// Build function
function build(callback) {
    console.log(`${colors.yellow}🔨 Building...${colors.reset}`);
    exec('npm run build', (error, stdout, stderr) => {
        if (error) {
            console.error(`${colors.bright}❌ Build failed:${colors.reset}`, error);
            if (callback) callback(error);
            return;
        }
        console.log(stdout);
        console.log(`${colors.green}✅ Build complete!${colors.reset}`);
        if (callback) callback(null);
    });
}

// Simple static file server
function createServer() {
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };

    const server = http.createServer((req, res) => {
        let pathname = url.parse(req.url).pathname;
        
        // Default to index.html
        if (pathname === '/') {
            pathname = '/index.html';
        }
        
        // Handle directory paths (add index.html)
        if (pathname.endsWith('/')) {
            pathname += 'index.html';
        }

        const filepath = path.join(DIST_DIR, pathname);
        
        fs.readFile(filepath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('404 Not Found');
                return;
            }

            const ext = path.extname(filepath);
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });

    server.listen(PORT, () => {
        console.log(`${colors.green}🚀 Server running at ${colors.bright}http://localhost:${PORT}${colors.reset}`);
        console.log(`${colors.blue}👀 Watching for changes...${colors.reset}`);
        console.log(`${colors.magenta}Press Ctrl+C to stop${colors.reset}\n`);
        
        // Open browser
        const openCommand = process.platform === 'darwin' ? 'open' : 
                          process.platform === 'win32' ? 'start' : 'xdg-open';
        exec(`${openCommand} http://localhost:${PORT}`);
    });
}

// Debounce function to prevent multiple rapid rebuilds
let buildTimeout;
function triggerBuild() {
    clearTimeout(buildTimeout);
    buildTimeout = setTimeout(() => {
        build();
    }, 300);
}

// Set up file watching
function setupWatching() {
    // Watch index.html
    if (fs.existsSync('index.html')) {
        fs.watch('index.html', (eventType) => {
            if (eventType === 'change') {
                console.log(`${colors.blue}📝 Change detected in index.html${colors.reset}`);
                triggerBuild();
            }
        });
    }

    // Watch simulator directory
    if (fs.existsSync('simulator')) {
        fs.watch('simulator', { recursive: true }, (eventType, filename) => {
            if (eventType === 'change' && filename) {
                console.log(`${colors.blue}📝 Change detected in simulator/${filename}${colors.reset}`);
                triggerBuild();
            }
        });
    }

    // Watch learn directory
    if (fs.existsSync('learn')) {
        fs.watch('learn', { recursive: true }, (eventType, filename) => {
            if (eventType === 'change' && filename) {
                console.log(`${colors.blue}📝 Change detected in learn/${filename}${colors.reset}`);
                triggerBuild();
            }
        });
    }

    // Watch assets directory with recursive option
    if (fs.existsSync('assets')) {
        fs.watch('assets', { recursive: true }, (eventType, filename) => {
            if (eventType === 'change' && filename) {
                console.log(`${colors.blue}📝 Change detected in assets/${filename}${colors.reset}`);
                triggerBuild();
            }
        });
    }

    // Watch manifest.json
    if (fs.existsSync('manifest.json')) {
        fs.watch('manifest.json', (eventType) => {
            if (eventType === 'change') {
                console.log(`${colors.blue}📝 Change detected in manifest.json${colors.reset}`);
                triggerBuild();
            }
        });
    }
}

// Clean up on exit
process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}👋 Shutting down...${colors.reset}`);
    process.exit(0);
});

// Main execution
console.log(`${colors.bright}${colors.blue}🚀 Nuclear Blast Simulator - Development Server${colors.reset}\n`);

// Initial build
build((err) => {
    if (!err) {
        // Start server
        createServer();
        
        // Start watching
        setupWatching();
    }
});