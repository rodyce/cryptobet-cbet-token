const BN = require('bn.js');

const Ten = new BN(10);
const Million = Ten.pow(new BN(6));
const WeiFactor = Ten.pow(new BN(18));
const ExpectedTotalSupply = new BN(950).mul(Million).mul(WeiFactor);

module.exports = { ExpectedTotalSupply };
