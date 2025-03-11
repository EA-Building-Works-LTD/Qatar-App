const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Run the standard build
console.log('Running standard build...');
execSync('npm run build', { stdio: 'inherit' });

// Ensure the favicon is properly copied
console.log('Ensuring favicon is properly included...');
const faviconSource = path.join(__dirname, 'public', 'favicon_app.ico');
const faviconDest = path.join(__dirname, 'build', 'favicon_app.ico');
const faviconFallback = path.join(__dirname, 'build', 'favicon.ico');

// Copy the favicon_app.ico to the build directory
if (fs.existsSync(faviconSource)) {
  fs.copyFileSync(faviconSource, faviconDest);
  console.log('Copied favicon_app.ico to build directory');
  
  // Also copy it as favicon.ico for compatibility
  fs.copyFileSync(faviconSource, faviconFallback);
  console.log('Copied favicon_app.ico to build/favicon.ico for compatibility');
} else {
  console.error('favicon_app.ico not found in public directory!');
}

console.log('Build completed with favicon handling'); 