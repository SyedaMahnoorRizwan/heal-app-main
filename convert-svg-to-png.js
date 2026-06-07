const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assetsDir = path.join(__dirname, 'assets', 'images');

function getAllSvgFiles(dir) {
  let svgFiles = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      svgFiles = svgFiles.concat(getAllSvgFiles(filePath));
    } else if (path.extname(file) === '.svg') {
      svgFiles.push(filePath);
    }
  });

  return svgFiles;
}

async function convertSvgToPng(svgPath) {
  const pngPath = svgPath.replace('.svg', '.png');
  
  try {
    console.log(`Converting ${svgPath} to ${pngPath}...`);
    await sharp(svgPath)
      .resize(1000, 1000, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(pngPath);
    console.log(`✓ Created ${pngPath}`);
    
    // Delete the original SVG
    fs.unlinkSync(svgPath);
    console.log(`✓ Deleted ${svgPath}\n`);
  } catch (error) {
    console.error(`✗ Error converting ${svgPath}:`, error.message);
  }
}

async function main() {
  console.log('Starting SVG to PNG conversion...\n');
  const svgFiles = getAllSvgFiles(assetsDir);

  if (svgFiles.length === 0) {
    console.log('No SVG files found.');
  } else {
    console.log(`Found ${svgFiles.length} SVG files.\n`);
    for (const svgFile of svgFiles) {
      await convertSvgToPng(svgFile);
    }
    console.log('Conversion complete!');
  }
}

main();
