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
const CBETDistributionAddress = '0x1F434ed0A09bcE385f28527375FD3E640Fa5C341';

async function viewContractState() {
    const cbetDistribution = await CBETDistribution.at(CBETDistributionAddress);
    const cbetDistributionOwner = await cbetDistribution.owner();
    console.log(`Owner of CBET distribution contract!: ${cbetDistributionOwner}`);
    const cbetBalance = await cbetDistribution.getBalance();
    console.log(`CBET Balance ${cbetBalance}`);
}

async function doSome() {
    const recipients = [
        '0xc8b8Dc8af3630a57595bA8a20a39f3D29186C71D',
        '0x5423d45f8870EbB9CE04e35C63d5246303B7601e',
        '0xF38cc766CDBCa1D851035998dc6B7c0571281f40',
    ]
    const amounts = [
        '94847424649592560463380480',
        '2076700504859049951780864',
        '911666368311951465381888'
    ]
    const accounts = await web3.eth.getAccounts();
    const cbetDistributionOwner = accounts[0];
    const cbetDistribution = await CBETDistribution.at(CBETDistributionAddress);
    const cbetTokenAddress = await cbetDistribution.getCBETTokenAddress();
    const cbetToken = await CBETToken.at(cbetTokenAddress);

    await cbetDistribution.airdropTokens(recipients, amounts, {from: cbetDistributionOwner});
    const someBalance = await cbetToken.balanceOf('0x5423d45f8870EbB9CE04e35C63d5246303B7601e');
    console.log(`Some Balance ${someBalance}`);
}

async function main() {
    await viewContractState();
    await doSome();
}

main()
