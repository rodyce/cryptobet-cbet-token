const CBETToken = artifacts.require('./CBETToken.sol');
const CBETDistribution = artifacts.require('./CBETDistribution.sol');
const { ExpectedTotalSupply } = require('../common/constants.js');


contract('CBETDistribution', function(accounts) {
    let token;
    let tokenDistribution;


    beforeEach(async () => {
        token = await CBETToken.deployed();
        tokenDistribution = await CBETDistribution.deployed();
    });


    it('CBET Token address cannot be modified once set', async () => {
        let callFailed = false;
        try {
            await tokenDistribution.setCBETTokenAddress(
                '0xcf5720702aB2121C502c5e4FBa305ae5D37B376A');
        } catch (err) {
            callFailed = true;
        }
        assert(
            callFailed,
            'Setting the CBET token address for a second time must fail');
        assert(await tokenDistribution.getCBETTokenAddress() === token.address,
            'Token distribution contract must have correct CBET token address');
    });

    it('Distribution contract has correct initial balance', async () => {
        const distributionContractBalance = await tokenDistribution.getBalance();
        assert(ExpectedTotalSupply.eq(distributionContractBalance),
            'Distribution contract does not have correct balance');
    });
});
