const { createServer } = require('http');
const next = require('next');

const app = next({ dev: false });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> ToolCompare ready on port ${port}`);
  });
}).catch((err) => {
  console.error('SERVER_BOOT_ERROR:', err);
  process.exit(1);
});
