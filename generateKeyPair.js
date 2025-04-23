const { generateKeyPairSync } = require('node:crypto');
const fs = require('node:fs');

function genKeyPair() {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    }
  });

  fs.writeFileSync(__dirname + '/id_rsa_pub.pem', publicKey);
  fs.writeFileSync(__dirname + '/id_rsa_priv.pem', privateKey);
}

genKeyPair();
