// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BabyToken.sol";

contract BabyTokenFactory {
    function createToken(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        address[4] memory addrs,
        uint256[3] memory feeSettings,
        uint256 minimumTokenBalanceForDividends_,
        address serviceFeeReceiver_,
        uint256 serviceFee_
    ) external payable returns (address) {
        BABYTOKEN newToken = new BABYTOKEN(
            name_,
            symbol_,
            totalSupply_,
            addrs,
            feeSettings,
            minimumTokenBalanceForDividends_,
            serviceFeeReceiver_,
            serviceFee_
        );
        newToken.transfer(msg.sender, newToken.balanceOf(address(this)));
        newToken.transferOwnership(payable(msg.sender));
        return address(newToken);
    }
}
