const fs = require('fs');
const csv = require('fast-csv');
const web3 = require('web3');
const BN = require('bn.js');
const assert = require('assert');
const { performance } = require('perf_hooks');
const contract = require('truffle-contract');
const cbetDistributionAbi = require('../build/contracts/CBETDistribution.json');
const cbetDistributionContract = contract(cbetDistributionAbi);
const { AccountBalanceLimit } = require('../common/constants');
const { networks } = require('../truffle-config');

const argv = process.argv[0] === 'node' ?
    process.argv.slice(3) : process.argv.slice(2);

const log = typeof console != 'undefined' ? console : {info:function(){}};

const csvFile = './scripts/data/cbet_balances.csv';
const networkName = process.env['NETWORK_NAME'];
const justCloseDistribution = process.env['JUST_CLOSE_DISTRIBUTION'] === '1';
const gasPrice = '14000000000'; // 14 gwei

if (networks[networkName] === undefined) {
    log.error(`Invalid network: ${networkName}`);
    return;
}

async function obtainBatches(fileName, batchSize) {
    return await new Promise((resolve, reject) => {
        const allAddressBatches = [];
        const allAmountBatches = [];
        let currentAddressBatch = [];
        let currentAmountBatch = [];
        let index = 0;
        try {
            const stream = fs.createReadStream(fileName);
            const csvStream = csv.parse({ headers: true }).on('data', function(data) {
                if (data.length < 3) {
                    log.warn('Insufficient data in line. Skipping');
                }
                const { address, balance_string: balanceStr, balance_wei: weiAmount } = data;
                const weiAmountBN = new BN(weiAmount);
                if (!web3.utils.isAddress(address)) {
                    log.warn(`${address} is NOT a valid address. Skipping.`);
                    return;
                }
                if (!web3.utils.isBN(weiAmountBN)) {
                    log.warn(`${weiAmount} is NOT a valid amount. Skipping.`);
                    return;
                }

                if (weiAmountBN.gt(0) && weiAmountBN.lt(AccountBalanceLimit)) {
                    currentAddressBatch.push(address);
                    currentAmountBatch.push(weiAmount);    
                } else {
                    log.info(`Skipping address ${address}. Amount is: ${balanceStr}`);
                }
                index++;
                if (index >= batchSize) {
                    allAddressBatches.push(currentAddressBatch);
                    allAmountBatches.push(currentAmountBatch);
                    currentAddressBatch = [];
                    currentAmountBatch = [];
                    index = 0;
                }
            }).on('end', function() {
                allAddressBatches.push(currentAddressBatch);
                allAmountBatches.push(currentAmountBatch);
                resolve([allAddressBatches, allAmountBatches]);
            });
            stream.pipe(csvStream);    
        } catch(err) {
            reject(err);
        }
    });
}

function getReceiptDataFromTx(tx) {
    const receipt = {
        transactionHash: tx.receipt.transactionHash,
        transactionIndex: tx.receipt.transactionIndex,
        blockHash: tx.receipt.blockHash,
        blockNumber: tx.receipt.blockNumber,
        from: tx.receipt.from,
        to: tx.receipt.to,
        gasUsed: tx.receipt.gasUsed,
        cumulativeGasUsed: tx.receipt.cumulativeGasUsed
    };
    return receipt;
}

async function main() {
    if (argv.length < 1) {
        log.info('Usage: do-distribution.js <distribution_contract_address> [<batch_size>]');
        return;
    }

    const cbetDistributionContractAddress = argv[0];
    const batchSize = argv[1] ? Number(argv[1]) : 50;

    cbetDistributionContract.setProvider(networks[networkName].provider());

    if (!web3.utils.isAddress(cbetDistributionContractAddress)) {
        log.error(`${cbetDistributionContractAddress} is not a valid address`);
        return;
    }
    if (batchSize < 10) {
        log.error('Batch size must be at least 10');
        return;
    }

    log.info(`
    ---------------------------------------------
    ----- Processing cbet_balances.csv file -----
    ---------------------------------------------
    `);
    if (!Array.prototype.last){
        Array.prototype.last = function(){
            return this[this.length - 1];
        };
    };
    const [addressBatches, amountBatches] = await obtainBatches(csvFile, batchSize);
    assert(addressBatches.length === amountBatches.length);

    // Keep track of the gas used to process all batches.
    let totalGasUsed = 0;
    let totalTimeTaken = 0;
    let batchesProcessed = 0;
    try {
        const cbetDistributionInst = await cbetDistributionContract.at(cbetDistributionContractAddress);
        const cbetDistributionOwner = await cbetDistributionInst.owner();

        const fromData = {
            from: cbetDistributionOwner,
            gasPrice: gasPrice
        };

        if (justCloseDistribution === false) {
            for (var i = 0; i < addressBatches.length; i++) {
                // Get address and amount batches.
                const addressBatch = addressBatches[i];
                const amountBatch = amountBatches[i];
                log.info(`<PROCESSING BATCH ${i+1}>`);
                // Invoke distribution contract function.
                const t0 = performance.now();
                const tx = await cbetDistributionInst.airdropTokens(
                    addressBatch, amountBatch, fromData);
                // Measure time taken.
                const t1 = performance.now();
                const timeTaken = t1 - t0;

                // Obtain receipt data.
                const receipt = getReceiptDataFromTx(tx);
                totalGasUsed += receipt.gasUsed;
                totalTimeTaken += timeTaken;
                batchesProcessed++;
    
                log.info(receipt);
                log.info(`Time taken: ${timeTaken} ms`);
                log.info(`</PROCESSING BATCH ${i+1}>`);
                log.info();
            }
            log.info('Distribution done.');
        } else {
            log.info('Closing distribution...');
            const closeTx = await cbetDistributionInst.closeDistribution(fromData);
            log.info('Distribution closed!');
            const receipt = getReceiptDataFromTx(closeTx);
            totalGasUsed += receipt.gasUsed;
        }
    } catch(err) {
        log.error(err);
    }

    log.info();
    log.info(`Batches processed: ${batchesProcessed} (of size: ${batchSize})`);
    log.info(`Total Gas used: ${totalGasUsed}`);
    log.info(`Total time taken: ${totalTimeTaken} ms.`);
}


main().then(() => {
    process.exit(0);
});
