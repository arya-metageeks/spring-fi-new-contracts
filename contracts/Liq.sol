// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";

contract LiquidityGeneratorToken is ERC20, Ownable {
    IUniswapV2Router02 public immutable uniswapV2Router;
    address public immutable uniswapV2Pair;

    // Fee addresses and percentages
    address public charityAddress;
    uint16 public taxFeeBps;
    uint16 public liquidityFeeBps;
    uint16 public charityFeeBps;

    // Tracking liquidity generation
    bool private inSwapAndLiquify;
    bool public swapAndLiquifyEnabled = true;

    uint256 public minTokensToSwap = 500_000 * 10**18; // Minimum tokens to trigger swap

    event SwapAndLiquify(
        uint256 tokensSwapped,
        uint256 ethReceived,
        uint256 tokensIntoLiquidity
    );

    constructor(
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
    ) ERC20(name_, symbol_) {
        require(taxFeeBps_ + liquidityFeeBps_ + charityFeeBps_ <= 10000, "Total fees cannot exceed 100%");

        // Initialize router and create pair
        uniswapV2Router = IUniswapV2Router02(router_);
        uniswapV2Pair = IUniswapV2Factory(uniswapV2Router.factory())
            .createPair(address(this), uniswapV2Router.WETH());

        // Set fee parameters
        charityAddress = charityAddress_;
        taxFeeBps = taxFeeBps_;
        liquidityFeeBps = liquidityFeeBps_;
        charityFeeBps = charityFeeBps_;

        // Mint total supply to contract initially
        _mint(address(this), totalSupply_);

        // Pay service fee if applicable
        // if (serviceFee_ > 0 && serviceFeeReceiver_ != address(0)) {
        //     (bool success, ) = payable(serviceFeeReceiver_).call{value: serviceFee_}("");
        //     require(success, "Service fee transfer failed");
        // }
    }

    // Override transfer and transferFrom to include swap logic
    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        _performSwapAndLiquify(_msgSender(), recipient);
        return super.transfer(recipient, amount);
    }

    function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
        _performSwapAndLiquify(sender, recipient);
        return super.transferFrom(sender, recipient, amount);
    }

    function _performSwapAndLiquify(address from, address to) internal {
        // Perform swap and liquify if conditions are met
        if (
            swapAndLiquifyEnabled && 
            balanceOf(address(this)) >= minTokensToSwap && 
            from != uniswapV2Pair && 
            to != uniswapV2Pair &&
            !inSwapAndLiquify
        ) {
            swapAndLiquify();
        }
    }

    function swapAndLiquify() private {
        inSwapAndLiquify = true;

        uint256 contractTokenBalance = balanceOf(address(this));
        uint256 liquidityTokens = (contractTokenBalance * liquidityFeeBps) / 10000;
        uint256 halfLiquidity = liquidityTokens / 2;
        uint256 swapTokens = liquidityTokens - halfLiquidity;

        uint256 initialBalance = address(this).balance;

        // Swap tokens for ETH
        swapTokensForEth(swapTokens);

        uint256 ethReceived = address(this).balance - initialBalance;
        uint256 liquidityEth = ethReceived / 2;

        // Add liquidity
        addLiquidity(halfLiquidity, liquidityEth);

        // Send charity portion
        uint256 charityTokens = (contractTokenBalance * charityFeeBps) / 10000;
        if (charityTokens > 0) {
            _transfer(address(this), charityAddress, charityTokens);
        }

        emit SwapAndLiquify(swapTokens, ethReceived, liquidityTokens);
        inSwapAndLiquify = false;
    }

    function swapTokensForEth(uint256 tokenAmount) private {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = uniswapV2Router.WETH();

        _approve(address(this), address(uniswapV2Router), tokenAmount);
        uniswapV2Router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokenAmount,
            0,
            path,
            address(this),
            block.timestamp
        );
    }

    function addLiquidity(uint256 tokenAmount, uint256 ethAmount) private {
        _approve(address(this), address(uniswapV2Router), tokenAmount);

        uniswapV2Router.addLiquidityETH{value: ethAmount}(
            address(this),
            tokenAmount,
            0,
            0,
            owner(),
            block.timestamp
        );
    }

    // Allow contract to receive ETH
    receive() external payable {}
}