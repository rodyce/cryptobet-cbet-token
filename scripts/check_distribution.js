const Web3 = require('web3');
const contract = require('truffle-contract');

const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));

const CBETDistributionAbi = require('../build/contracts/CBETDistribution.json');
const CBETDistribution = contract(CBETDistributionAbi);

const CBETTokenAbi = require('../build/contracts/CBETToken.json');
const CBETToken = contract(CBETTokenAbi);

CBETDistribution.setProvider(web3.currentProvider);
CBETToken.setProvider(web3.currentProvider);
// TODO: Param this
const CBETDistributionAddress = '0xd63e58325A32A910413544Bb8Af4E44f4b1a5ccD';

async function viewContractState() {
    // TODO: Uncomment/remove test code
    //const accounts = await web3.eth.getAccounts();
    const cbetDistribution = await CBETDistribution.at(CBETDistributionAddress);
    //const cbetToken = await CBETToken.at('0x9659027f9015491bD16761846A3776bA1C60e47a');
    const cbetDistributionOwner = await cbetDistribution.owner();
    console.log(`Owner of CBET distribution contract: ${cbetDistributionOwner}`);
    //await cbetDistribution.airdropTokens([receiverAccount], ['4000000000000'], {from: accounts[1]});
    const cbetBalance = await cbetDistribution.getBalance();
    //const cbetBalance = await cbetToken.balanceOf(CBETDistributionAddress);
    //const receiverAccountBalance = await cbetToken.balanceOf(receiverAccount);

    console.log(`CBET Balance ${cbetBalance}`);
}


viewContractState();
