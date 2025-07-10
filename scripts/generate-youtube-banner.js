import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function generateYouTubeBanner() {
  try {
    // Input and output paths
    const screenshotPath = path.join(__dirname, '../src/images/screenshots/screenshot-desktop.png')
    const logoPath = path.join(__dirname, '../src/images/logo.png')
    const outputPath = path.join(__dirname, '../src/images/youtube-banner.png')

    // YouTube banner dimensions
    const bannerWidth = 2048
    const bannerHeight = 1152

    // Logo dimensions and positioning
    const logoSize = 400 // Logo will be 400x400px for larger banner

    // Screenshot positioning - center it first
    const maxScreenshotWidth = 1200 // Max width for screenshot
    const maxScreenshotHeight = 800 // Max height for screenshot

    // Center the screenshot area
    const screenshotX = (bannerWidth - maxScreenshotWidth) / 2
    const screenshotY = (bannerHeight - maxScreenshotHeight) / 2
    const screenshotWidth = maxScreenshotWidth
    const screenshotHeight = maxScreenshotHeight

    // Position logo to the left of screenshot
    const logoMargin = 20
    const logoX = screenshotX - logoSize - logoMargin
    const logoY = (bannerHeight - logoSize) / 2 // Vertically centered

    // Get screenshot metadata for proper scaling
    const screenshotMetadata = await sharp(screenshotPath).metadata()
    console.log('Screenshot dimensions:', screenshotMetadata.width, 'x', screenshotMetadata.height)

    // Calculate screenshot scale to fit within frame
    const screenshotScale = Math.min(
      screenshotWidth / screenshotMetadata.width,
      screenshotHeight / screenshotMetadata.height
    )

    const scaledScreenshotWidth = Math.round(screenshotMetadata.width * screenshotScale)
    const scaledScreenshotHeight = Math.round(screenshotMetadata.height * screenshotScale)

    // Center the screenshot within its frame
    const centeredScreenshotX = screenshotX + (screenshotWidth - scaledScreenshotWidth) / 2
    const centeredScreenshotY = screenshotY + (screenshotHeight - scaledScreenshotHeight) / 2

    // Frame should fit tightly around the actual screenshot
    const frameMargin = 8
    const frameX = centeredScreenshotX - frameMargin
    const frameY = centeredScreenshotY - frameMargin
    const frameWidth = scaledScreenshotWidth + frameMargin * 2
    const frameHeight = scaledScreenshotHeight + frameMargin * 2

    // Create the background gradient with subtle pattern
    const background = Buffer.from(
      `<svg width="${bannerWidth}" height="${bannerHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
            <stop offset="30%" style="stop-color:#1e293b;stop-opacity:1" />
            <stop offset="70%" style="stop-color:#334155;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#475569;stop-opacity:1" />
          </linearGradient>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <rect width="50" height="50" fill="none" stroke="#334155" stroke-width="0.5" opacity="0.1"/>
          </pattern>
          <filter id="logoShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="15"/>
            <feOffset dx="0" dy="8" result="offsetblur"/>
            <feFlood flood-color="#000000" flood-opacity="0.5"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="screenshotShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="20"/>
            <feOffset dx="0" dy="15" result="offsetblur"/>
            <feFlood flood-color="#000000" flood-opacity="0.6"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect width="${bannerWidth}" height="${bannerHeight}" fill="url(#bg)"/>
        <rect width="${bannerWidth}" height="${bannerHeight}" fill="url(#grid)"/>
        
        <!-- Logo background glow -->
        <circle 
          cx="${logoX + logoSize/2}" 
          cy="${logoY + logoSize/2}" 
          r="${logoSize/2 + 50}" 
          fill="#4a9eff" 
          opacity="0.1" 
          filter="url(#glow)"
        />
        
        <!-- Screenshot frame with multiple layers for depth -->
        <rect 
          x="${frameX - 4}" 
          y="${frameY - 4}"
          width="${frameWidth + 8}" 
          height="${frameHeight + 8}"
          rx="16"
          fill="#0f172a"
          opacity="0.5"
          filter="url(#screenshotShadow)"
        />
        
        <rect 
          x="${frameX}" 
          y="${frameY}"
          width="${frameWidth}" 
          height="${frameHeight}"
          rx="12"
          fill="#1e293b"
          stroke="#475569"
          stroke-width="2"
          filter="url(#screenshotShadow)"
        />
        
        <!-- Inner frame highlight -->
        <rect 
          x="${frameX + 3}" 
          y="${frameY + 3}"
          width="${frameWidth - 6}" 
          height="${frameHeight - 6}"
          rx="10"
          fill="none"
          stroke="#64748b"
          stroke-width="1"
          opacity="0.4"
        />
        
        <!-- Screenshot area -->
        <rect 
          x="${centeredScreenshotX}" 
          y="${centeredScreenshotY}"
          width="${scaledScreenshotWidth}" 
          height="${scaledScreenshotHeight}"
          rx="8"
          fill="#000000"
        />
        
        <!-- Title text -->
        <text x="${bannerWidth - 50}" y="${bannerHeight - 100}" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="end" opacity="0.9">
          Nuclear Blast Simulator
        </text>
        <text x="${bannerWidth - 50}" y="${bannerHeight - 50}" font-family="Arial, sans-serif" font-size="28" fill="#94a3b8" text-anchor="end" opacity="0.8">
          Educational Visualization Platform
        </text>
      </svg>`
    )

    // Prepare composite layers
    const compositeLayers = []

    // Add screenshot
    compositeLayers.push({
      input: await sharp(screenshotPath)
        .resize(scaledScreenshotWidth, scaledScreenshotHeight, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer(),
      left: Math.round(centeredScreenshotX),
      top: Math.round(centeredScreenshotY)
    })

    // Add logo (with shadow effect)
    try {
      const logoBuffer = await sharp(logoPath)
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer()

      compositeLayers.push({
        input: logoBuffer,
        left: Math.round(logoX),
        top: Math.round(logoY)
      })

      console.log('✅ Logo added successfully')
    } catch (logoError) {
      console.warn('⚠️  Logo not found, continuing without logo:', logoError.message)
    }

    // Create the final composite image
    const bannerImage = await sharp(background).composite(compositeLayers).png().toBuffer()

    // Save the final image
    await fs.writeFile(outputPath, bannerImage)

    console.log(`✅ YouTube banner generated successfully!`)
    console.log(`   Output: ${outputPath}`)
    console.log(`   Dimensions: ${bannerWidth}x${bannerHeight}`)
    console.log(`   Logo: ${logoSize}x${logoSize} at (${logoX}, ${logoY})`)
    console.log(
      `   Screenshot: ${scaledScreenshotWidth}x${scaledScreenshotHeight} at (${Math.round(
        centeredScreenshotX
      )}, ${Math.round(centeredScreenshotY)})`
    )
  } catch (error) {
    console.error('Error generating YouTube banner:', error)
    process.exit(1)
  }
}

// Run the script
generateYouTubeBanner()