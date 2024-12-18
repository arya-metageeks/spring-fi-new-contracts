// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./BabyToken.sol";

contract BabyTokenFactoryV3 {
    // Events
    event TokenCreated(
        address indexed creator,
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 timestamp
    );

    // Receive and fallback functions to accept ETH
    receive() external payable {}

    fallback() external payable {}

    // Array to store all created token addresses
    address[] public createdTokens;

    // Mapping to check if an address is a token created by this factory
    mapping(address => bool) public isTokenCreatedHere;

    // Function to get total number of tokens created
    function getNumberOfTokensCreated() external view returns (uint256) {
        return createdTokens.length;
    }

    // Function to get token address by index
    function getTokenAddressByIndex(
        uint256 index
    ) external view returns (address) {
        require(index < createdTokens.length, "Index out of bounds");
        return createdTokens[index];
    }

    // Function to get all created tokens
    function getAllCreatedTokens() external view returns (address[] memory) {
        return createdTokens;
    }

    /**
     * @dev Create a new BABYTOKEN instance
     * @param name_ Token name
     * @param symbol_ Token symbol
     * @param totalSupply_ Total token supply
     * @param addrs Array of addresses:
     *   - addrs[0]: reward token address
     *   - addrs[1]: router address
     *   - addrs[2]: marketing wallet address
     *   - addrs[3]: dividend tracker implementation address
     * @param feeSettings Array of fee percentages:
     *   - feeSettings[0]: token rewards fee
     *   - feeSettings[1]: liquidity fee
     *   - feeSettings[2]: marketing fee
     * @param minimumTokenBalanceForDividends_ Minimum token balance for dividend eligibility
     * @param serviceFeeReceiver_ Address to receive service fee
     * @param serviceFee_ Amount of service fee
     * @return Address of the newly created token
     */
    function createToken(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        address[4] memory addrs,
        uint256[3] memory feeSettings,
        uint256 minimumTokenBalanceForDividends_,
        address serviceFeeReceiver_,
        uint256 serviceFee_
    ) external returns (address) {
        // ) external payable returns (address) {
        // Validate service fee payment if needed
        // require(msg.value >= serviceFee_, "Insufficient service fee");

        // Deploy new BABYTOKEN
        BABYTOKEN newToken = new BABYTOKEN(
            // BABYTOKEN newToken = new BABYTOKEN{value: serviceFee_}(
            name_,
            symbol_,
            totalSupply_,
            addrs,
            feeSettings,
            minimumTokenBalanceForDividends_,
            serviceFeeReceiver_,
            serviceFee_
        );

        address tokenAddress = address(newToken);
        
        // Store the new token address
        createdTokens.push(tokenAddress);
        isTokenCreatedHere[tokenAddress] = true;
        
        // Transfer tokens to creator
        uint256 contractBalance = newToken.balanceOf(address(this));
        if (contractBalance > 0) {
            newToken.transfer(msg.sender, contractBalance);
        }

        // Transfer ownership to token creator
    
        // Emit event with token details
        emit TokenCreated(
            msg.sender,
            tokenAddress,
            name_,
            symbol_,
            block.timestamp
        );

        newToken.transferOwnership(payable(msg.sender));

        return tokenAddress;
    }

    /**
     * @dev Withdraw any accidentally sent ETH from the factory
     */
    function withdrawETH() external {
        payable(msg.sender).transfer(address(this).balance);
    }
}
