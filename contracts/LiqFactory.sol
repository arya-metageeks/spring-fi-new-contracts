// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Liq.sol";

contract LiquidityGeneratorFactoryV2 {
    event TokenCreated(
        address indexed tokenAddress, 
        address indexed creator, 
        string name, 
        string symbol
    );

    function createToken(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        address router_,
        address charityAddress_,
        uint16 taxFeeBps_,
        uint16 liquidityFeeBps_,
        uint16 charityFeeBps_,
        address serviceFeeReceiver_,
        uint256 serviceFee_
    ) external returns (address) {
    // ) external payable returns (address) {
        LiquidityGeneratorToken newToken = new LiquidityGeneratorToken(
        // LiquidityGeneratorToken newToken = new LiquidityGeneratorToken{value: msg.value}(
            name_,
            symbol_,
            totalSupply_,
            router_,
            charityAddress_,
            taxFeeBps_,
            liquidityFeeBps_,
            charityFeeBps_,
            serviceFeeReceiver_,
            serviceFee_
        );

        // Transfer all tokens to the creator
        newToken.transfer(msg.sender, newToken.balanceOf(address(this)));
        
        // Transfer ownership to the creator
        newToken.transferOwnership(payable(msg.sender));

        // Emit event for token creation
        emit TokenCreated(address(newToken), msg.sender, name_, symbol_);

        return address(newToken);
    }
}