// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockRouter {
    address public immutable WETH;
    address public immutable factory;

    constructor(address _weth) {
        WETH = _weth;
        factory = address(this); // For simplicity in testing
    }

    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external {
        // Mock implementation - just transfer the tokens
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
    }

    function createPair(address tokenA, address tokenB) external pure returns (address) {
        // Return a dummy address for testing
        return address(0x1234567890123456789012345678901234567890);
    }
}