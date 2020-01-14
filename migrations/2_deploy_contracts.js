const CBETDistributionContract = artifacts.require('./CBETDistribution.sol')
const CBETTokenContract = artifacts.require('./CBETToken.sol');


module.exports = async (deployer) => {
    await deployer.deploy(CBETDistributionContract);
    await deployer.deploy(CBETTokenContract, CBETDistributionContract.address);

    const cbetDistributionContract = await CBETDistributionContract.deployed();
    await cbetDistributionContract.setCBETTokenAddress(CBETTokenContract.address);
}
