// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256) external;
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

interface IUniswapV2Factory {
    event PairCreated(address indexed token0, address indexed token1, address pair, uint);
    function createPair(address tokenA, address tokenB) external returns (address pair);
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

interface IUniswapV2Pair {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function initialize(address _token0, address _token1) external;
}

library TransferHelper {
    function safeTransfer(address token, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0xa9059cbb, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FAILED');
    }

    function safeTransferFrom(address token, address from, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FROM_FAILED');
    }
}

contract ArbitrumRouter {
    address public immutable factory;
    address public immutable WETH;

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, "ArbitrumRouter: EXPIRED");
        _;
    }

    constructor(address _factory, address _WETH) {
        factory = _factory;
        WETH = _WETH;
    }

    receive() external payable {
        assert(msg.sender == WETH); // only accept ETH via fallback from the WETH contract
    }

    // Swap exact tokens for ETH, supporting fee-on-transfer tokens
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual ensure(deadline) {
        require(path[path.length - 1] == WETH, "ArbitrumRouter: INVALID_PATH");
        
        // Transfer tokens from user to pair contract
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, IUniswapV2Factory(factory).getPair(path[0], path[1]), amountIn
        );
        
        // Perform swap logic (simplified)
        uint balanceBefore = address(this).balance;
        
        // In a real implementation, you'd have more complex swap logic
        // This is a placeholder that assumes some external swap mechanism
        IWETH(WETH).deposit{value: amountIn}();
        
        uint amountReceived = address(this).balance - balanceBefore;
        require(amountReceived >= amountOutMin, "ArbitrumRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        
        // Transfer ETH to recipient
        (bool success, ) = to.call{value: amountReceived}("");
        require(success, "ArbitrumRouter: ETH_TRANSFER_FAILED");
    }

    // Optional: Add more swap and liquidity functions as needed
}

contract ArbitrumFactory {
    address public feeTo;
    address public feeToSetter;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, 'ArbitrumFactory: IDENTICAL_ADDRESSES');
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'ArbitrumFactory: ZERO_ADDRESS');
        require(getPair[token0][token1] == address(0), 'ArbitrumFactory: PAIR_EXISTS');
        
        bytes memory bytecode = type(ArbitrumPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        
        ArbitrumPair(pair).initialize(token0, token1);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);
        
        emit PairCreated(token0, token1, pair, allPairs.length);
        return pair;
    }
}

contract ArbitrumPair {
    address public token0;
    address public token1;

    function initialize(address _token0, address _token1) external {
        require(token0 == address(0) && token1 == address(0), 'ArbitrumPair: ALREADY_INITIALIZED');
        token0 = _token0;
        token1 = _token1;
    }
}