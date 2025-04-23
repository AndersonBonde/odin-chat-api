const jsonwebtoken = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const pathToKey = path.join(__dirname, 'id_rsa_priv.pem');
const PRIV_KEY = fs.readFileSync(pathToKey, 'utf8');

function issueJWT(user) {
  const _id = user.id;
  const expiresIn = '1d';
  
  const payload = {
    sub: _id,
    iat: Math.floor(Date.now() / 1000),
  };

  const signedToken = jsonwebtoken.sign(payload, PRIV_KEY, { expiresIn, algorithm: 'RS256' });

  return {
    token: 'Bearer ' + signedToken,
    expires: expiresIn,
  }
}

function getHashedGuestName(ip) {
  const hash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 8);
  return `guest_${hash}`;
}

module.exports = { issueJWT, getHashedGuestName };
