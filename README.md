# CryptoBet **CBET** ERC-20 token

Install npm dependencies
```sh
$ npm install
```

Then, run Ganache-CLI to be able to run unit tests
```sh
$ npx ganache-cli
```

Lastly, run the unit tests with `truffle`:
```sh
$ npx truffle test
```

Once everything is working fine, proceed to deploy to a network with `truffle migrate`
```sh
$ npx truffle migrate
```

The target network to perform migration is controlled by the $NETWORK_NAME environment variable.

For reference regarding more environment variables, consult **.env.example** file. You can set the mnemonics to use when migrating and the *Infura* keys to perform migrations.

