pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract CBETToken is ERC20 {
    // Define a total fixed supply of 950 millions CBET
    uint256 constant totalFixedSupply = 950_000_000 * 10 ** 18;

    /**
     * @dev Constructor for CryptoBet CBET token creation.
     * @dev Assign the total fixed supply of CBET tokens ownership to the
     *      distribution contract address.
     */
    constructor (address distributionContractAddress) public {
        super._mint(distributionContractAddress, totalFixedSupply);
    }
}
