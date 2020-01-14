pragma solidity ^0.5.0;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./CBETToken.sol";


contract CBETDistribution is Ownable {
    using SafeMath for uint256;

    uint256 public constant FIXED_TOTAL_SUPPLY = 950_000_000 * 10 ** 18;
    uint256 public constant MAX_SUPPLY_TO_ALLOCATE = 107_395_607 * 10 ** 18;
    uint256 public ALLOCATED_SUPPLY = 0;

    address cbetTokenAddress;

    // Keep track of the addresses that have already been allocated for CBET tokens.
    mapping (address => bool) public allocations;

    /**
     * @dev Perform an allocation of CBET tokens to the specified recipients.
     * @param recipients List of recipients.
     * @param amounts List of amounts to allocate to each corresponding recipient.
     */
    function airdropTokens(address[] memory recipients, uint256[] memory amounts) public onlyOwner {
        CBETToken cbetToken = CBETToken(cbetTokenAddress);
        require(recipients.length == amounts.length);
        uint256 airdropped = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            if (allocations[recipients[i]] == false) {
                allocations[recipients[i]] = true;
                require(cbetToken.transfer(recipients[i], amounts[i]));
                airdropped = airdropped.add(amounts[i]);
            }
        }
        require(ALLOCATED_SUPPLY.add(airdropped) < MAX_SUPPLY_TO_ALLOCATE);
        ALLOCATED_SUPPLY = ALLOCATED_SUPPLY.add(airdropped);
    }

    /**
     * @dev Obtain CBET balance of this distribution contract.
     */
    function getBalance() external view returns(uint256) {
        CBETToken cbetToken = CBETToken(cbetTokenAddress);
        return cbetToken.balanceOf(address(this));
    }

    /**
     * @dev Set the CBET token address (only once).
     */
    function setCBETTokenAddress(address _cbetTokenAddress) external {
        if (cbetTokenAddress != address(0)) {
            // Nothing to do. Address was already set.
            return;
        }
        cbetTokenAddress = _cbetTokenAddress;
    }
}
