const fs = require('fs');
const path = require('path');
const pool = require('./db');

const destDir = path.join(__dirname, '../frontend/public/images');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

const base = 'C:\\\\Users\\\\Ameg A K M\\\\.gemini\\\\antigravity\\\\brain\\\\d9ba9e32-3288-4aff-a2f1-eb2f23c0339e\\\\';
fs.copyFileSync(base + 'wireless_headphones_1775995869900.png', path.join(destDir, 'wireless_headphones.png'));
fs.copyFileSync(base + 'smart_watch_1775995886895.png', path.join(destDir, 'smart_watch.png'));
fs.copyFileSync(base + 'mechanical_keyboard_1775995903193.png', path.join(destDir, 'mechanical_keyboard.png'));

(async () => {
  try {
    await pool.query("UPDATE products SET image='/images/wireless_headphones.png' WHERE name LIKE '%Headphones%'");
    await pool.query("UPDATE products SET image='/images/smart_watch.png' WHERE name LIKE '%Watch%'");
    await pool.query("UPDATE products SET image='/images/mechanical_keyboard.png' WHERE name LIKE '%Keyboard%'");
    console.log('Update success');
  } catch(e) {
    console.log(e);
  } finally {
    process.exit(0);
  }
})();
