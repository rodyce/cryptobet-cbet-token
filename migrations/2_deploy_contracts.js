require('dotenv').config();


const CBETDistributionContract = artifacts.require('./CBETDistribution.sol')
const CBETTokenContract = artifacts.require('./CBETToken.sol');
const CBETTokenNoDistribContract = artifacts.require('./CBETTokenNoDistrib.sol');


module.exports = async (deployer) => {
    // Check env setting of whether or not to use the no distribution version
    // of the contract.
    const useNoDistributionTokenVersion =
        process.env.USE_NO_DISTRIBUTION_TOKEN_VERSION === '1';
    if (!useNoDistributionTokenVersion) {
        await deployer.deploy(CBETDistributionContract);
        await deployer.deploy(CBETTokenContract, CBETDistributionContract.address);
    
        const cbetDistributionContract = await CBETDistributionContract.deployed();
        await cbetDistributionContract.setCBETTokenAddress(CBETTokenContract.address);    
    } else {
        await deployer.deploy(CBETTokenNoDistribContract);
        await CBETTokenNoDistribContract.deployed();
    }
}
