const CBETDistributionContract = artifacts.require('./CBETDistribution.sol')
const CBETTokenContract = artifacts.require('./CBETToken.sol');


if (process.argv.length < 4) {
    console.error('Need to specify address for token distribution contract');
    process.exit(1);
}

const targetAddress = process.argv[3];

console.log(`Deploying to address ${targetAddress}`);

module.exports = function(deployer) {
    deployer.deploy(CBETDistributionContract);
    deployer.deploy(CBETTokenContract, targetAddress);
}
