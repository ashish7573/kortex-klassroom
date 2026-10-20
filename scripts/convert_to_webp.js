const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const projectRoot = process.cwd();
const dirsToConvert = [
  path.join(projectRoot, 'public', 'assets', 'hindi', 'images'),
  path.join(projectRoot, 'public', 'assets', 'hindi', 'words', 'images')
];

async function convertDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.error(`Directory not found: ${dirPath}`);
    return { count: 0, originalBytes: 0, webpBytes: 0 };
  }

  const files = fs.readdirSync(dirPath);
  const pngFiles = files.filter(f => f.toLowerCase().endsWith('.png'));

  console.log(`\nProcessing ${pngFiles.length} PNG files in: ${path.relative(projectRoot, dirPath)}`);

  let count = 0;
  let originalBytes = 0;
  let webpBytes = 0;

  for (const file of pngFiles) {
    const srcPath = path.join(dirPath, file);
    const baseName = path.basename(file, path.extname(file));
    const destPath = path.join(dirPath, `${baseName}.webp`);

    const srcStat = fs.statSync(srcPath);
    originalBytes += srcStat.size;

    try {
      await sharp(srcPath)
        .webp({ quality: 85, effort: 6 })
        .toFile(destPath);

      const destStat = fs.statSync(destPath);
      webpBytes += destStat.size;
      count++;
    } catch (err) {
      console.error(`Error converting ${file}:`, err.message);
    }
  }

  return { count, originalBytes, webpBytes };
}

async function createAliases() {
  console.log('\n--- Creating normalized aliases for spelling and case consistency ---');

  // 1. Swar Vyanjan images
  const swarDir = path.join(projectRoot, 'public', 'assets', 'hindi', 'images');
  const swarAliases = [
    { src: 'khaana.webp', alias: 'khana.webp' },
    { src: 'chaata.webp', alias: 'chhata.webp' },
    { src: 'dhaaga.webp', alias: 'dhaga.webp' },
    { src: 'shehtoot.webp', alias: 'shetoot.webp' },
    { src: 'kshama.webp', alias: 'kshma.webp' }
  ];

  for (const { src, alias } of swarAliases) {
    const srcFile = path.join(swarDir, src);
    const aliasFile = path.join(swarDir, alias);
    if (fs.existsSync(srcFile) && !fs.existsSync(aliasFile)) {
      fs.copyFileSync(srcFile, aliasFile);
      console.log(`Created alias in hindi/images: ${src} -> ${alias}`);
    }
  }

  // 2. Hindi Words images
  const wordsDir = path.join(projectRoot, 'public', 'assets', 'hindi', 'words', 'images');
  const wordAliases = [
    { src: 'Horn.webp', alias: 'MusicalHorn.webp' },
    { src: 'rath.webp', alias: 'Rath.webp' },
    { src: 'Safetypin.webp', alias: 'SafetyPin.webp' },
    { src: 'Rollingpin.webp', alias: 'RollingPin.webp' }
  ];

  for (const { src, alias } of wordAliases) {
    const srcFile = path.join(wordsDir, src);
    const aliasFile = path.join(wordsDir, alias);
    if (fs.existsSync(srcFile) && !fs.existsSync(aliasFile)) {
      fs.copyFileSync(srcFile, aliasFile);
      console.log(`Created alias in words/images: ${src} -> ${alias}`);
    }
  }
}

async function main() {
  console.log('=== Starting Kortex Library WebP Batch Conversion ===');
  const startTime = Date.now();

  let totalCount = 0;
  let totalOrigBytes = 0;
  let totalWebpBytes = 0;

  for (const dir of dirsToConvert) {
    const res = await convertDirectory(dir);
    totalCount += res.count;
    totalOrigBytes += res.originalBytes;
    totalWebpBytes += res.webpBytes;
  }

  await createAliases();

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const origMB = (totalOrigBytes / (1024 * 1024)).toFixed(2);
  const webpMB = (totalWebpBytes / (1024 * 1024)).toFixed(2);
  const savedMB = ((totalOrigBytes - totalWebpBytes) / (1024 * 1024)).toFixed(2);
  const pctSaved = (((totalOrigBytes - totalWebpBytes) / totalOrigBytes) * 100).toFixed(1);

  console.log('\n======================================================');
  console.log(`CONVERSION COMPLETE in ${elapsedSec}s!`);
  console.log(`Total Images Converted: ${totalCount}`);
  console.log(`Original PNG Size:      ${origMB} MB`);
  console.log(`Optimized WebP Size:    ${webpMB} MB`);
  console.log(`Storage & Bandwidth Saved: ${savedMB} MB (${pctSaved}% reduction)`);
  console.log('======================================================\n');
}

main().catch(err => {
  console.error('Conversion failed:', err);
  process.exit(1);
});

