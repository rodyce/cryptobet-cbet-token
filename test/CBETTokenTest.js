const BN = require('bn.js');
const CBETToken = artifacts.require('./CBETToken.sol');


contract('CBETToken', function(accounts) {
    const Ten = new BN(10);
    const Million = Ten.pow(new BN(6));
    const WeiFactor = Ten.pow(new BN(18));
    const ExpectedTotalSupply = new BN(950).mul(Million).mul(WeiFactor);

    let token;

    beforeEach(async () => {
        console.log('beforeEach')
        token = await CBETToken.deployed();
    });

    it('CBET ERC20 token must have correct total supply', async () => {
        const totalSupply = await token.totalSupply();
        assert(totalSupply.eq(ExpectedTotalSupply), 'Invalid total supply');
    });
});
