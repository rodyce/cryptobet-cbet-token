const web3 = require('web3');
const BN = require('bn.js');
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
        const [distributionContractBalance, distributionContractBalance2] =
            await Promise.all([
                tokenDistribution.getBalance(),
                token.balanceOf(tokenDistribution.address)
            ]);
        assert(ExpectedTotalSupply.eq(distributionContractBalance)
                && ExpectedTotalSupply.eq(distributionContractBalance2),
            'Distribution contract does not have correct balance');
    });

    it('Distribution must be open before any airdrop', async () => {
        assert(
            ! await tokenDistribution.distributionClosed(),
            'Distribution must be open before performing airdrops');
    });

    it('Cannot close distribution if no airdrop performed', async () => {
        let callFailed = false;
        try {
            await tokenDistribution.closeDistribution();
        } catch {
            callFailed = true;
        }
        assert(callFailed, 'Cannot close distribution if no airdrops done');
    });

    it('Airdropping to an account more than once has no effect', async () => {
        const address = '0xdda09565F0E561fBc8Cd7bDb0116812Ad4e4bC75';
        const amount = new BN('160895159390000001024');

        const tx1 = await tokenDistribution.airdropTokens([address], [amount]);
        expectTransferEventCount(tx1, 1);
        const addressBalance1 = await token.balanceOf(address);
        const allocatedSupply1 = await tokenDistribution.getAllocatedSupply();

        const tx2 = await tokenDistribution.airdropTokens([address], [amount]);
        expectTransferEventCount(tx2, 0);
        const addressBalance2 = await token.balanceOf(address);
        const allocatedSupply2 = await tokenDistribution.getAllocatedSupply();

        expect(addressBalance1.gt(0)).to.be.true;
        expect(addressBalance1.eq(addressBalance2)).to.be.true;
        expect(allocatedSupply1.eq(allocatedSupply2)).to.be.true;
    });

    it('Accounts with balances of more than 10_000 are not credited', async () => {
        const address = '0xc2638419Bbf6567D22551272d3a67BDf17FE020b';
        const amount = new BN('1056310039858000000000000');

        const addresses = [
            '0x8034B91e6B7C83243b5c457af71088E3d8533DCc',
            address,
            '0x19b48ff9DdF012e92853aDd04a588175f13F95Ea'
        ];
        const amounts = [
            new BN('129033132040000002048'),
            amount,
            new BN('93617755749999998976')
        ];

        const tx = await tokenDistribution.airdropTokens(addresses, amounts);
        expectTransferEventCount(tx, addresses.length - 1);

        const balances = await Promise.all(addresses.map(addr => token.balanceOf(addr)));
        assert([amounts[0], new BN(0), amounts[2]].every(
            (val, idx) => val.eq(balances[idx])),
            'Balances do not match');
    });

    it('Airdrop tokens works as expected', async () => {
        const addressBatch1 = [
            '0xCcD3840922e6b9D6FeA63599B7390bB556356B46',
            '0x4d934E19b51d5a294Eaf4B79C3a37E51427ee1c5',
            '0x7FE458bAB7138060B1f1E8bD1a6dcBa031F98012'
        ];
        const expectedAmountBatch1 = [
            new BN('370210138729999980544'),
            new BN('80611520870000001024'),
            new BN('428639159849999998976')
        ];
        const addressBatch2 = [
            '0xC6e01355A04a245881Ad56CeFA93504cF4d7a142',
            '0xcc4Ae840f8566609d6009C33caA4dAC786120Fc5'
        ];
        const expectedAmountBatch2 = [
            new BN('1561169999998976'),
            new BN('161223041740000002048')
        ];

        const previousAllocatedSupply = await tokenDistribution.getAllocatedSupply();

        // First batch airdrop
        const tx1 = await tokenDistribution.airdropTokens(addressBatch1, expectedAmountBatch1);
        expectTransferEventCount(tx1, addressBatch1.length)
        const balancesBatch1 = await Promise.all(addressBatch1.map(address => token.balanceOf(address)));
        assert(expectedAmountBatch1.every(
            (val, idx) => val.eq(balancesBatch1[idx])),
            'First batch balances are not correct');
        
        // Second batch airdrop
        const tx2 = await tokenDistribution.airdropTokens(addressBatch2, expectedAmountBatch2);
        expectTransferEventCount(tx2, addressBatch2.length);
        const balancesBatch2 = await Promise.all(addressBatch2.map(address => token.balanceOf(address)));
        assert(expectedAmountBatch2.every(
            (val, idx) => val.eq(balancesBatch2[idx])),
            'Second batch balances are not correct');

        const allocatedSupplyBatch1 = expectedAmountBatch1.reduce((a, b) => a.add(b));
        const allocatedSupplyBatch2 = expectedAmountBatch2.reduce((a, b) => a.add(b));
        const expectedAllocatedSupply = allocatedSupplyBatch1
            .add(allocatedSupplyBatch2)
            .add(previousAllocatedSupply);
        const allocatedSupply = await tokenDistribution.getAllocatedSupply();

        assert(allocatedSupply.eq(expectedAllocatedSupply),
            `Incorrect allocated supply: ${expectedAllocatedSupply} != ${allocatedSupply}`);
    });

    it('Closing airdrop causes transfer event of ALL the remaining balance', async () => {
        // Close distribution after successful airdrops.
        const closeTx = await tokenDistribution.closeDistribution();
        // Expect one transfer to be performed (to the owner's address)
        expectTransferEventCount(closeTx, 1);
        assert(
            (await token.balanceOf(tokenDistribution.address)).eq(new BN(0)),
            'Distribution contract balance must be zero after closing');
        assert(
            await tokenDistribution.distributionClosed(),
            'Distribution must be closed after planned airdrops');
    });

    it('Trying to perform an airdrop after closing fails', async () => {
        const address = '0xdda09565F0E561fBc8Cd7bDb0116812Ad4e4bC75';
        const amount = new BN('160895159390000001024');
        let callFailed = false;
        // Attempt airdrop.
        try {
            await tokenDistribution.airdropTokens([address], [amount]);
        } catch {
            callFailed = true;
        }
        assert(callFailed, 'Cannot perform airdrops after distribution is closed');
    });

    const TransferEventHash = web3.utils.keccak256('Transfer(address,address,uint256)');
    function expectTransferEventCount(tx, numExpected) {
        const rawLogs = tx.receipt.rawLogs;
        let count = 0;
        for (const rawLog of rawLogs) {
            if (rawLog.topics[0] === TransferEventHash) {
                count++;
            }
        }

        expect(count).to.equal(numExpected);
    }
});
