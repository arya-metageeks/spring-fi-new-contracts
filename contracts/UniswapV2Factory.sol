// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

interface IERC20Metadata is IERC20 {
    function decimals() external view returns (uint8);
}

interface IUniswapV2Pair {
    function initialize(address token0, address token1) external;
}

contract UniswapV2Factory is Ownable {
    // Mapping of token pairs to their respective pair addresses
    mapping(address => mapping(address => address)) public getPair;
    
    // Array of all created pairs
    address[] public allPairs;

    // Configuration parameters
    uint256 public pairCreationFee;

    // Events
    event PairCreated(
        address indexed token0, 
        address indexed token1, 
        address pair, 
        uint256 pairNumber
    );

    // Errors
    error IdenticalAddresses();
    error ZeroAddress();
    error PairAlreadyExists();
    error InsufficientFeePayment();

    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
    }

    // Public method for creating pairs
    function createPair(
        address tokenA, 
        address tokenB
    ) public returns (address pair) {
        // Validate inputs
        if (tokenA == tokenB) revert IdenticalAddresses();
        if (tokenA == address(0) || tokenB == address(0)) revert ZeroAddress();

        // Sort tokens
        (address token0, address token1) = tokenA < tokenB 
            ? (tokenA, tokenB) 
            : (tokenB, tokenA);

        // Check pair doesn't already exist
        if (getPair[token0][token1] != address(0)) revert PairAlreadyExists();

        // Generate pair creation bytecode
        bytes memory bytecode = type(UniswapV2Pair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));

        // Deploy pair using CREATE2
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        // Initialize pair
        IUniswapV2Pair(pair).initialize(token0, token1);

        // Record pair
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length);
        return pair;
    }

    // Getter functions
    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }
}

// Pair contract for deployment
contract UniswapV2Pair {
    address public token0;
    address public token1;

    function initialize(address _token0, address _token1) external {
        require(token0 == address(0) && token1 == address(0), "Already initialized");
        token0 = _token0;
        token1 = _token1;
    }
}

contract UniswapV2FactoryETH is UniswapV2Factory {
    // Wrapped Ethereum contract address
    address public immutable WETH;

    // Whitelist for token creation
    mapping(address => bool) public tokenWhitelist;

    // Events
    event TokenWhitelisted(address indexed token, bool status);
    event ETHPairCreated(address indexed token, address pair);

    // Custom Errors
    error WETHNotAllowed();
    error TokenNotWhitelisted();
    error InvalidTokenAddress();

    constructor(
        address initialOwner, 
        address feeSetter, 
        address _weth
    ) UniswapV2Factory(initialOwner) {
        if (_weth == address(0)) revert InvalidTokenAddress();
        WETH = _weth;
    }

    // Create a pair with WETH
    function createPairETH(
        address token
    ) external payable returns (address pair) {
        // Validate token
        if (token == address(0)) revert InvalidTokenAddress();
        if (token == WETH) revert WETHNotAllowed();
        if (!tokenWhitelist[token] && !isValidToken(token)) revert TokenNotWhitelisted();

        // Wrap ETH if needed
        if (msg.value > 0) {
            IWETH(WETH).deposit{value: msg.value}();
        }

        // Create pair with WETH using public createPair method
        return super.createPair(token, WETH);
    }

    // Get existing WETH pair for a token
    function getPairETH(address token) external view returns (address) {
        return getPair[token][WETH];
    }

    // Whitelist management (only owner)
    function setTokenWhitelist(
        address token, 
        bool status
    ) external onlyOwner {
        tokenWhitelist[token] = status;
        emit TokenWhitelisted(token, status);
    }

    // Basic token validation
    function isValidToken(address token) public view returns (bool) {
        // Check if contract exists and has valid metadata
        try IERC20Metadata(token).decimals() returns (uint8 decimals) {
            return decimals <= 18 && decimals > 0;
        } catch {
            return false;
        }
    }

    // Allow contract to receive ETH
    receive() external payable {
        // Only accept ETH from WETH contract or during WETH wrapping
        require(msg.sender == WETH || msg.sender == address(this), "Invalid ETH transfer");
    }
}