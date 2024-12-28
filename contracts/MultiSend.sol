// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MultiSend is Ownable {
    using SafeERC20 for IERC20;

    receive() external payable {
        revert();
    }

    uint256 private multiSendCounter;

    event MultiSendCreated(
        address indexed creator,
        address tokenAddress,
        uint256 indexed multiSendIndex,
        uint256 totalAmount
    );

    function multisendToken(
        address token,
        bool ensureExactAmount,
        address[] calldata targets,
        uint256[] calldata amounts,
        uint256 expectedTotal
    ) external {
        require(token != address(0), "Invalid token address");
        require(targets.length == amounts.length, "Length mismatched");
        require(targets.length > 0, "Empty arrays");
        
        multiSendCounter++;
        IERC20 erc20 = IERC20(token);
        uint256 total = 0;

        // Calculate total first
        for(uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "Amount must be greater than 0");
            require(targets[i] != address(0), "Invalid target address");
            total += amounts[i];
        }

        // Validate total matches expected
        require(total == expectedTotal, "Total amount mismatch");

        // Check if sender has sufficient balance
        require(erc20.balanceOf(msg.sender) >= total, "Insufficient balance");

        // Check if contract has sufficient allowance
        require(erc20.allowance(msg.sender, address(this)) >= total, "Insufficient allowance");

        function(
            IERC20,
            address,
            address,
            uint256
        ) transfer = ensureExactAmount
                ? _safeTransferFromEnsureExactAmount
                : _safeTransferFrom;

        // Perform transfers
        for (uint256 i = 0; i < targets.length; i++) {
            transfer(erc20, msg.sender, targets[i], amounts[i]);
        }

        emit MultiSendCreated(
            msg.sender,
            token,
            multiSendCounter,
            total
        );
    }

    function multisendEther(
        address[] calldata targets,
        uint256[] calldata amounts
    ) public payable {
        require(targets.length == amounts.length, "Length mismatched");
        require(targets.length > 0, "Empty arrays");

        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "Amount must be greater than 0");
            require(targets[i] != address(0), "Invalid target address");
            total += amounts[i];
        }

        require(total == msg.value, "Total mismatched");

        for (uint256 i = 0; i < targets.length; i++) {
            payable(targets[i]).transfer(amounts[i]);
        }
    }

    function _safeTransferFromEnsureExactAmount(
        IERC20 token,
        address from,
        address to,
        uint256 amount
    ) private {
        uint256 balanceBefore = token.balanceOf(to);
        token.safeTransferFrom(from, to, amount);
        require(
            token.balanceOf(to) - balanceBefore == (from != to ? amount : 0),
            "Not enough tokens were transferred"
        );
    }

    function _safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 amount
    ) private {
        token.safeTransferFrom(from, to, amount);
    }

    function withdrawWronglySentEther(address to) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(address(this).balance > 0, "No ETH to withdraw");
        payable(to).transfer(address(this).balance);
    }

    function withdrawWronglySentToken(
        address token,
        address to
    ) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(to != address(0), "Invalid address");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        IERC20(token).safeTransfer(to, balance);
    }
}