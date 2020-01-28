pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract CBETTokenNoDistrib is ERC20 {
    // CBET token parameters
    string public constant name = 'CryptoBet';
    string public constant symbol = 'CBET';
    uint8 public constant decimals = 18;
    uint256 public constant decimalFactor = 10 ** uint256(decimals);

    /**
     * @dev Constructor for CryptoBet CBET token creation.
     * @dev Assign the total fixed supply of CBET tokens ownership to the
     *      distribution contract address.
     */
    constructor () public {
        // Mint a total fixed supply of 950 millions CBET to the specified
        // address. And yes... That is how an address literal looks like in
        // Solidity.
        super._mint(
            0x89Ac2c53dD852Fe896176CC18D73384844606247,
            950_000_000 * decimalFactor);
    }
}
