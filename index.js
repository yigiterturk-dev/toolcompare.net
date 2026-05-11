// index.js - Hostinger Entry Point
const path = require('path');

// Next.js standalone output works by having a server.js in the standalone folder.
// This bridge file tells Hostinger where to find it.
const serverPath = path.join(__dirname, '.next', 'standalone', 'server.js');

if (require('fs').existsSync(serverPath)) {
  require(serverPath);
} else {
  console.error('Next.js standalone server not found at:', serverPath);
  console.log('Falling back to standard next start logic...');
  require('next/dist/bin/next'); 
}
