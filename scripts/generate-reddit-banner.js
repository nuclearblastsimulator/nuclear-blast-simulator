import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function generateRedditBanner() {
  try {
    // Input and output paths
    const screenshotPath = path.join(__dirname, '../src/images/screenshots/screenshot-desktop.png')
    const logoPath = path.join(__dirname, '../src/images/logo.png')
    const outputPath = path.join(__dirname, '../src/images/reddit-banner.png')

    // Reddit banner dimensions
    const bannerWidth = 1920
    const bannerHeight = 384

    // Logo dimensions and positioning
    const logoSize = 300 // Logo will be 300x300px

    // Screenshot positioning - center it first
    const maxScreenshotWidth = 800 // Max width for screenshot
    const maxScreenshotHeight = 320 // Max height for screenshot

    // Center the screenshot area
    const screenshotX = (bannerWidth - maxScreenshotWidth) / 2
    const screenshotY = (bannerHeight - maxScreenshotHeight) / 2
    const screenshotWidth = maxScreenshotWidth
    const screenshotHeight = maxScreenshotHeight

    // Position logo 10px to the left of screenshot
    const logoMargin = 5
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
    const frameMargin = 5
    const frameX = centeredScreenshotX - frameMargin
    const frameY = centeredScreenshotY - frameMargin
    const frameWidth = scaledScreenshotWidth + frameMargin * 2
    const frameHeight = scaledScreenshotHeight + frameMargin * 2

    // Create the background gradient
    const background = Buffer.from(
      `<svg width="${bannerWidth}" height="${bannerHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#1e293b;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
          </linearGradient>
          <filter id="logoShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="8"/>
            <feOffset dx="0" dy="4" result="offsetblur"/>
            <feFlood flood-color="#000000" flood-opacity="0.3"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="screenshotShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="12"/>
            <feOffset dx="0" dy="8" result="offsetblur"/>
            <feFlood flood-color="#000000" flood-opacity="0.4"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect width="${bannerWidth}" height="${bannerHeight}" fill="url(#bg)"/>
        
        <!-- Screenshot frame -->
        <rect 
          x="${frameX}" 
          y="${frameY}"
          width="${frameWidth}" 
          height="${frameHeight}"
          rx="10"
          fill="#1e293b"
          stroke="#475569"
          stroke-width="1"
          filter="url(#screenshotShadow)"
        />
        
        <!-- Inner frame highlight -->
        <rect 
          x="${frameX + 2}" 
          y="${frameY + 2}"
          width="${frameWidth - 4}" 
          height="${frameHeight - 4}"
          rx="8"
          fill="none"
          stroke="#64748b"
          stroke-width="1"
          opacity="0.3"
        />
        
        <!-- Screenshot area -->
        <rect 
          x="${centeredScreenshotX}" 
          y="${centeredScreenshotY}"
          width="${scaledScreenshotWidth}" 
          height="${scaledScreenshotHeight}"
          rx="6"
          fill="#000000"
        />
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

    console.log(`✅ Reddit banner generated successfully!`)
    console.log(`   Output: ${outputPath}`)
    console.log(`   Dimensions: ${bannerWidth}x${bannerHeight}`)
    console.log(`   Logo: ${logoSize}x${logoSize} at (${logoX}, ${logoY})`)
    console.log(
      `   Screenshot: ${scaledScreenshotWidth}x${scaledScreenshotHeight} at (${Math.round(
        centeredScreenshotX
      )}, ${Math.round(centeredScreenshotY)})`
    )
  } catch (error) {
    console.error('Error generating Reddit banner:', error)
    process.exit(1)
  }
}

// Run the script
generateRedditBanner()
