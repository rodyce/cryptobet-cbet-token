pragma solidity ^0.5.0;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./CBETToken.sol";


contract CBETDistribution is Ownable {
    using SafeMath for uint256;

    uint256 private constant MAX_SUPPLY_TO_ALLOCATE = 107_395_607 * 10 ** 18;
    uint256 private constant MAX_BALANCE_TO_TRANSFER = 10_000 * 10 ** 18;
    uint256 private allocatedSupply = 0;
    address private cbetTokenAddress;

    bool public distributionClosed = false;

    // Keep track of the addresses that have already been allocated for CBET tokens.
    mapping (address => bool) public allocations;

    /**
     * @dev Perform an allocation of CBET tokens to the specified recipients.
     * @param recipients List of recipients.
     * @param amounts List of amounts to allocate to each corresponding recipient.
     */
    function airdropTokens(address[] memory recipients, uint256[] memory amounts) public onlyOwner {
        // Check if the distribution is not closed.
        require(!distributionClosed);
        // Check the number of recipients and amounts are equal.
        require(recipients.length > 0);
        require(recipients.length == amounts.length);
        // Obtain CBET token contract from its address.
        CBETToken cbetToken = CBETToken(cbetTokenAddress);
        uint256 airdropped = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) {
                // Skip the zero address.
                continue;
            }
            if (allocations[recipients[i]] == false) {
                allocations[recipients[i]] = true;
                // Only transfer if the amount is less than 10,000 CBET.
                if (amounts[i] < MAX_BALANCE_TO_TRANSFER) {
                    // Do and validate transfer.
                    require(cbetToken.transfer(recipients[i], amounts[i]));
                    // Increase airdropped token count.
                    airdropped = airdropped.add(amounts[i]);
                }
            }
        }
        // Check that the allocated supply did not exceed the supply to allocate.
        // Revert if necessary.
        require(allocatedSupply.add(airdropped) <= MAX_SUPPLY_TO_ALLOCATE);
        // Accumulate allocated supply.
        allocatedSupply = allocatedSupply.add(airdropped);
    }

    /**
     * @dev Finish token distribution by sending remaining balance to this
     *      contract's owner.
     */
    function closeDistribution() external onlyOwner {
        if (distributionClosed) {
            // Distribution already closed. Do nothing.
            return;
        }

        require(allocatedSupply > 0);

        // Obtain CBET token contract from its address.
        CBETToken cbetToken = CBETToken(cbetTokenAddress);
        // Obtain this contract's balance.
        uint256 remaining = cbetToken.balanceOf(address(this));
        // Transfer balance to owner.
        cbetToken.transfer(this.owner(), remaining);
        // Allocate rest of supply.
        allocatedSupply = allocatedSupply.add(remaining);
        // Mark the distribution as closed.
        distributionClosed = true;
    }

    /**
     * @dev Obtain CBET balance of this distribution contract.
     */
    function getBalance() external view returns(uint256) {
        CBETToken cbetToken = CBETToken(cbetTokenAddress);
        return cbetToken.balanceOf(address(this));
    }

    /**
     * @dev Obtain current allocated supply of CBET tokens.
     */
    function getAllocatedSupply() external view returns(uint256) {
        return allocatedSupply;
    }

    /**
     * @dev Get the CBET token address.
     */
    function getCBETTokenAddress() public view returns(address) {
        return cbetTokenAddress;
    }
    /**
     * @dev Set the CBET token address (only once).
     */
    function setCBETTokenAddress(address _cbetTokenAddress) external {
        require(cbetTokenAddress == address(0), "CBET Token address previously set");
        cbetTokenAddress = _cbetTokenAddress;
    }
}
