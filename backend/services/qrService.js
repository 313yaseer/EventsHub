const QRCode = require('qrcode');
const crypto = require('crypto');

function generateQRToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function generateQRDataURL(token) {
  return await QRCode.toDataURL(token, {
    width: 300,
    margin: 2,
    color: {
      dark: '#1e293b',
      light: '#ffffff',
    },
  });
}

module.exports = {
  generateQRToken,
  generateQRDataURL,
};
