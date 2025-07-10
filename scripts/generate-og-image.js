const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

async function generateOGImage() {
  try {
    // Input and output paths
    const inputPath = path.join(__dirname, '../src/images/screenshots/screenshot-desktop.png');
    const outputPath = path.join(__dirname, '../src/images/og-preview.png');
    
    // Target dimensions for OG image
    const targetWidth = 1200;
    const targetHeight = 630;
    
    // Get input image metadata
    const metadata = await sharp(inputPath).metadata();
    console.log('Original image dimensions:', metadata.width, 'x', metadata.height);
    
    // Minimal padding to maximize device size
    const devicePadding = 20; // Very small padding
    const deviceBezelWidth = 15; // Thin bezel
    const deviceCornerRadius = 20; // Corner radius for device frame
    
    // Calculate available space for the screenshot
    const availableWidth = targetWidth - (devicePadding * 2) - (deviceBezelWidth * 2);
    const availableHeight = targetHeight - (devicePadding * 2) - (deviceBezelWidth * 2);
    
    // Calculate scale to fit
    const scale = Math.min(
      availableWidth / metadata.width,
      availableHeight / metadata.height
    );
    
    const scaledWidth = Math.round(metadata.width * scale);
    const scaledHeight = Math.round(metadata.height * scale);
    
    // Center the device frame
    const deviceX = (targetWidth - scaledWidth - deviceBezelWidth * 2) / 2;
    const deviceY = (targetHeight - scaledHeight - deviceBezelWidth * 2) / 2;
    
    // Create the device frame background (dark gradient)
    const background = Buffer.from(
      `<svg width="${targetWidth}" height="${targetHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
          </linearGradient>
          <filter id="shadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="15"/>
            <feOffset dx="0" dy="15" result="offsetblur"/>
            <feFlood flood-color="#000000" flood-opacity="0.4"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect width="${targetWidth}" height="${targetHeight}" fill="url(#bg)"/>
        
        <!-- Device frame -->
        <rect 
          x="${deviceX}" 
          y="${deviceY}"
          width="${scaledWidth + deviceBezelWidth * 2}" 
          height="${scaledHeight + deviceBezelWidth * 2}"
          rx="${deviceCornerRadius}"
          fill="#1e293b"
          stroke="#334155"
          stroke-width="2"
          filter="url(#shadow)"
        />
        
        <!-- Inner bezel gradient for depth -->
        <rect 
          x="${deviceX + 2}" 
          y="${deviceY + 2}"
          width="${scaledWidth + deviceBezelWidth * 2 - 4}" 
          height="${scaledHeight + deviceBezelWidth * 2 - 4}"
          rx="${deviceCornerRadius - 2}"
          fill="none"
          stroke="#475569"
          stroke-width="1"
          opacity="0.5"
        />
        
        <!-- Screen area -->
        <rect 
          x="${deviceX + deviceBezelWidth}" 
          y="${deviceY + deviceBezelWidth}"
          width="${scaledWidth}" 
          height="${scaledHeight}"
          rx="${deviceCornerRadius - 10}"
          fill="#000000"
        />
        
        <!-- Camera notch (iPad style) -->
        <circle 
          cx="${targetWidth / 2}" 
          cy="${deviceY + 12}"
          r="4"
          fill="#475569"
        />
      </svg>`
    );
    
    // Create the final composite image
    const ogImage = await sharp(background)
      .composite([
        // Add screenshot
        {
          input: await sharp(inputPath)
            .resize(scaledWidth, scaledHeight, {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .toBuffer(),
          left: Math.round(deviceX + deviceBezelWidth),
          top: Math.round(deviceY + deviceBezelWidth)
        }
      ])
      .png()
      .toBuffer();
    
    // Save the final image
    await fs.writeFile(outputPath, ogImage);
    
    console.log(`✅ OG preview image generated successfully!`);
    console.log(`   Output: ${outputPath}`);
    console.log(`   Dimensions: ${targetWidth}x${targetHeight}`);
    console.log(`   Device frame: ${scaledWidth + deviceBezelWidth * 2}x${scaledHeight + deviceBezelWidth * 2}`);
    console.log(`   Screenshot: ${scaledWidth}x${scaledHeight}`);
    
  } catch (error) {
    console.error('Error generating OG image:', error);
    process.exit(1);
  }
}

// Run the script
generateOGImage();