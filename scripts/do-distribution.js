const fs = require('fs');
const csv = require('fast-csv');
const web3 = require('web3');
const BN = require('bn.js');

const argv = process.argv[0] === 'node' ?
    process.argv.slice(3) : process.argv.slice(2);

const log = typeof console != 'undefined' ? console : {info:function(){}};

const csvFile = './data/cbet_balances.csv';


async function obtainBatches(fileName, batchSize) {
    return await new Promise((resolve, reject) => {
        const allBatches = [];
        let currentBatch = [];
        let index = 0;
        try {
            const stream = fs.createReadStream(fileName);
            const csvStream = csv.parse({ headers: true }).on('data', function(data) {
                if (data.length < 3) {
                    log.warn('Insufficient data in line. Skipping');
                }
                const { address, balance_wei: weiAmount } = data;
                if (!web3.utils.isAddress(address)) {
                    log.warn(`${address} is NOT a valid address. Skipping.`);
                    return;
                }
                if (!web3.utils.isBN(new BN(weiAmount))) {
                    log.warn(`${weiAmount} is NOT a valid amount. Skipping.`);
                    return;
                }
            
                currentBatch.push([address, weiAmount]);
                index++;
                if (index >= batchSize) {
                    allBatches.push(currentBatch);
                    currentBatch = [];
                    index = 0;
                }
            }).on('end', function() {
                allBatches.push(currentBatch);
                resolve(allBatches);
            });
            stream.pipe(csvStream);    
        } catch(err) {
            reject(err);
        }
    });
}


async function main() {
    if (argv.length < 1) {
        log.info('Usage: do-distribution.js <distribution_contract_address> [<batch_size>]');
        return;
    }

    const polyDistributionContractAddress = argv[0];
    const batchSize = argv[1] ? Number(argv[1]) : 50;

    if (!web3.utils.isAddress(polyDistributionContractAddress)) {
        log.error(`${polyDistributionContractAddress} is not a valid address`);
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
    const batches = await obtainBatches(csvFile, batchSize);
    log.info(`Number of batches: ${batches.length}`);
    log.info(`Last address: ${batches.last().last()}`);
    log.info(`contract addr: ${polyDistributionContractAddress}`);
}


main();
