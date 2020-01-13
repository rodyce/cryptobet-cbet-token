const CBETDistributionContract = artifacts.require('./CBETDistribution.sol')
const CBETTokenContract = artifacts.require('./CBETToken.sol');


module.exports = function(deployer) {
    deployer.deploy(CBETDistributionContract)
    .then(function() {
        return deployer.deploy(CBETTokenContract, CBETDistributionContract.address);
    });
}
