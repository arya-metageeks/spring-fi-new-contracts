// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IUniswapV2Router02 {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external;
}

interface IUniswapV2Factory {
    function createPair(address tokenA, address tokenB) external returns (address pair);
}

// Remove the CustomERC20 contract since we don't need this intermediate layer
contract LiquidityGeneratorTokenFactoryV3 {
    mapping(address => bool) public isTokenCreated;
    
    event TokenCreated(
        address indexed tokenAddress, 
        string name, 
        string symbol, 
        uint256 totalSupply
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
    ) public  returns (address) {
    // ) public payable returns (address) {
        // require(msg.value >= serviceFee_, "Insufficient service fee");
        require(router_ != address(0), "Invalid router");
        require(serviceFeeReceiver_ != address(0), "Invalid fee receiver");
        require(taxFeeBps_ + liquidityFeeBps_ + charityFeeBps_ <= 2500, "Fees exceed 25%");
        require(bytes(name_).length > 0, "Name cannot be empty");
        require(bytes(symbol_).length > 0, "Symbol cannot be empty");
        require(totalSupply_ > 0, "Supply must be positive");

        LiquidityGeneratorToken newToken = new LiquidityGeneratorToken(
            name_,
            symbol_,
            totalSupply_,
            router_,
            charityAddress_,
            taxFeeBps_,
            liquidityFeeBps_,
            charityFeeBps_,
            msg.sender
        );

        isTokenCreated[address(newToken)] = true;
        
        emit TokenCreated(address(newToken), name_, symbol_, totalSupply_);
        
        // payable(serviceFeeReceiver_).transfer(serviceFee_);
        
        // if (msg.value > serviceFee_) {
        //     payable(msg.sender).transfer(msg.value - serviceFee_);
        // }

        return address(newToken);
    }

    receive() external payable {}
}

contract LiquidityGeneratorToken is ERC20, Ownable {
    uint16 public taxFeeBps;
    uint16 public liquidityFeeBps;
    uint16 public charityFeeBps;
    
    address public charityAddress;
    address public uniswapV2Router;
    address public uniswapV2Pair;
    
    bool private inSwapAndLiquify;
    uint256 private constant MIN_TOKENS_BEFORE_SWAP = 500 * 10**18;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        address router_,
        address charityAddress_,
        uint16 taxFeeBps_,
        uint16 liquidityFeeBps_,
        uint16 charityFeeBps_,
        address initialOwner
    ) ERC20(name_, symbol_) Ownable() {
        
        transferOwnership(initialOwner);

        uniswapV2Router = router_;
        IUniswapV2Router02 router = IUniswapV2Router02(router_);
        uniswapV2Pair = IUniswapV2Factory(router.factory()).createPair(
            address(this), 
            router.WETH()
        );

        charityAddress = charityAddress_;
        taxFeeBps = taxFeeBps_;
        liquidityFeeBps = liquidityFeeBps_;
        charityFeeBps = charityFeeBps_;

        _mint(msg.sender, totalSupply_);
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        if (inSwapAndLiquify) {
            super._transfer(from, to, amount);
            return;
        }

        uint256 taxFee = (amount * taxFeeBps) / 10000;
        uint256 liquidityFee = (amount * liquidityFeeBps) / 10000;
        uint256 charityFee = (amount * charityFeeBps) / 10000;
        uint256 transferAmount = amount - taxFee - liquidityFee - charityFee;

        super._transfer(from, to, transferAmount);
        
        if (liquidityFee > 0) {
            super._transfer(from, address(this), liquidityFee);
            if (balanceOf(address(this)) >= MIN_TOKENS_BEFORE_SWAP) {
                _swapAndAddLiquidity(liquidityFee);
            }
        }
        
        if (charityFee > 0 && charityAddress != address(0)) {
            super._transfer(from, charityAddress, charityFee);
        }
    }

    function _swapAndAddLiquidity(uint256 tokenAmount) private {
        inSwapAndLiquify = true;

        _approve(address(this), uniswapV2Router, tokenAmount);

        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = IUniswapV2Router02(uniswapV2Router).WETH();

        IUniswapV2Router02(uniswapV2Router).swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokenAmount,
            0,
            path,
            address(this),
            block.timestamp
        );

        inSwapAndLiquify = false;
    }

    receive() external payable {}
}