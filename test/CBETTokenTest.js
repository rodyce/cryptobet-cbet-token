const CBETToken = artifacts.require('./CBETToken.sol');
const CBETDistribution = artifacts.require('./CBETDistribution.sol');
const { ExpectedTotalSupply } = require('../common/constants.js');


contract('CBETToken', function(accounts) {
    let token;
    let tokenDistribution;


    beforeEach(async () => {
        token = await CBETToken.deployed();
        tokenDistribution = await CBETDistribution.deployed();
    });


    it('CBET ERC20 token must have correct total supply', async () => {
        const totalSupply = await token.totalSupply();
        assert(totalSupply.eq(ExpectedTotalSupply), 'Invalid total supply');
    });

    it('CBET ERC20 tokens belong to the distribution contract', async () => {
        const tokenDistributionBalance = await token.balanceOf(tokenDistribution.address);
        assert(
            ExpectedTotalSupply.eq(tokenDistributionBalance),
            'Distribution contract must own CBET tokens');
    });
});
