// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

interface ITokenLock {
    function lockTokens(
        address _tokenAddress,
        address _beneficiary,
        uint256 _amount,
        uint256 _lockDuration,
        bool _vesting,
        uint256 _firstReleasePercentage,
        uint256 _vestingPeriodInDays,
        uint256 _cycleReleasePercentage
    ) external;
}

contract Subscription is Ownable {
    struct SubStruct {
        ERC20 token;
        ERC20 purchaseToken;
        address creator;
        bool whitelistedEnabled;
        bool finalizedPool;
        bool devFeeInToken;
        uint256 softCap;
        uint256 hardCap;
        uint256 hardCapPerUser;
        uint256 subRate;
        uint256 listingRate;
        uint256 finHardCap;
        uint256 finMoneyPer;
        uint256 moneyRaised;
        uint256 tokensSold;
        uint256 devCommission;
        uint256 devCommissionInToken;
        uint256 startTime;
        uint256 endTime;
        uint256 liquidityAdditionPercent;
        uint256 liquidityUnlockTime;
        uint256 listingAmount;
        address[] investors;
        mapping(address => bool) whitelisted;
        mapping(address => bool) hasInvested;
        mapping(address => uint256) tokensPurchased;
        mapping(address => uint256) tokensInvested;
        mapping(address => uint256) excessTokensInvested;
    }

    uint256 public constant MAX_SUB_DURATION = 30 days;
    uint256 public constant MIN_LIQUIDITY_UNLOCK_TIME = 30 days;
    uint256 public constant MAX_DEV_FEE = 5;
    uint256 public constant MAX_DEV_FEE_IN_TOKEN = 2;

    uint256 public devFeeInTokenPercentage = 2; // 2%
    uint256 public devFee = 5; // 5%
    SubStruct[] public subs;
    mapping(address => uint256[]) private userSubs;
    mapping(address => uint256[]) private userInvested;

    IUniswapV2Factory public immutable uniswapV2Factory;
    IUniswapV2Router02 public immutable uniswapV2Router;
    IUniswapV2Router02 public immutable uniswapV2RouterETH;
    address public immutable WMATIC;
    ITokenLock public tokenLock;

    constructor(
        address _factory,
        address _router,
        address _routerETH,
        address _wmatic,
        address _tokenLock
    ) {
        uniswapV2Factory = IUniswapV2Factory(_factory);
        uniswapV2Router = IUniswapV2Router02(_router);
        uniswapV2RouterETH = IUniswapV2Router02(_routerETH);
        WMATIC = _wmatic;
        tokenLock = ITokenLock(_tokenLock);
    }

    function returnLength() external view returns (uint256) {
        return subs.length;
    }

    function getUserSubs(
        address _user
    ) external view returns (uint256[] memory) {
        return userSubs[_user];
    }

    function getUserInvested(
        address _user
    ) external view returns (uint256[] memory) {
        return userInvested[_user];
    }

    function updateTokenLock(address _newTokenLock) external onlyOwner {
        tokenLock = ITokenLock(_newTokenLock);
    }

    function updateDevFee(uint256 _newFee) external onlyOwner {
        require(_newFee > 0 && _newFee <= MAX_DEV_FEE, "Invalid dev fee");
        devFee = _newFee;
    }

    function updateDevFeeInTokenPercentage(
        uint256 _newPercentage
    ) external onlyOwner {
        require(
            _newPercentage > 0 && _newPercentage <= MAX_DEV_FEE_IN_TOKEN,
            "Invalid dev fee percentage"
        );
        devFeeInTokenPercentage = _newPercentage;
    }

    function calculateTokens(
        uint256 amountA,
        uint256 amountB,
        uint256 decimalsA,
        uint256 decimalsB
    ) internal pure returns (uint256) {
        uint256 tokens;
        if (decimalsA > decimalsB) {
            uint256 differenceInDecimals = decimalsA - decimalsB;
            tokens = amountA * (amountB * (10 ** differenceInDecimals));
        } else if (decimalsA < decimalsB) {
            uint256 differenceInDecimals = decimalsB - decimalsA;
            tokens = (amountA * amountB) / (10 ** differenceInDecimals);
        } else {
            tokens = amountA * amountB;
        }
        return tokens;
    }

    function calculateTokensMul(
        uint256 amountA,
        uint256 amountB,
        uint256 decimalsA,
        uint256 decimalsB
    ) internal pure returns (uint256) {
        uint256 tokens;
        tokens = (amountA * amountB) / (10 ** decimalsB);
        return tokens;
    }

    function calculateTokensDiv(
        uint256 amountA,
        uint256 amountB,
        uint256 decimalsA,
        uint256 decimalsB
    ) internal pure returns (uint256) {
        uint256 tokens;
        if (decimalsA > decimalsB) {
            uint256 differenceInDecimals = decimalsA - decimalsB;
            tokens = amountA / (amountB * (10 ** differenceInDecimals));
        } else if (decimalsA < decimalsB) {
            uint256 differenceInDecimals = decimalsB - decimalsA;
            tokens = ((amountA * (10 ** differenceInDecimals)) / amountB);
        } else {
            tokens = amountA / amountB;
        }
        return tokens;
    }

    function createSub(
        address _tokenAddress,
        address _purchaseTokenAddress,
        bool _whitelistedEnabled,
        bool _devFeeInToken,
        uint256 _softCap,
        uint256 _hardCap,
        uint256 _hardCapPerUser,
        uint256 _subRate,
        uint256 _listingRate,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _liquidityAdditionPercent,
        uint256 _liquidityUnlockTime
    ) external payable {
        require(
            _tokenAddress != address(0),
            "tokenAddress can't be zero address"
        );
        require(
            _softCap >= _hardCap / 2,
            "Softcap must be more than 50% of hardcap"
        );
        require(_startTime >= block.timestamp, "Start Time can't be in past");
        require(
            _endTime - _startTime <= MAX_SUB_DURATION,
            "Sub duration can't exceed one month"
        );
        require(
            _listingRate < _subRate,
            "Listing Rate can't be greater than Sub Rate"
        );
        require(
            _liquidityUnlockTime >= MIN_LIQUIDITY_UNLOCK_TIME,
            "liquidityUnlockTime must be >= 30 days"
        );

        ERC20 token = ERC20(_tokenAddress);

        if (_devFeeInToken) {
            uint256 tokensForDevFee = ((_hardCap * devFeeInTokenPercentage) /
                100);
            require(
                token.allowance(msg.sender, address(this)) >=
                    _hardCap +
                        tokensForDevFee +
                        (_listingRate * _hardCap * _liquidityAdditionPercent) /
                        (100 * _subRate),
                "Check the token allowance"
            );
            token.transferFrom(
                msg.sender,
                address(this),
                _hardCap +
                    tokensForDevFee +
                    (_listingRate * _hardCap * _liquidityAdditionPercent) /
                    (100 * _subRate)
            );
        } else {
            require(
                token.allowance(msg.sender, address(this)) >=
                    _hardCap +
                        (_listingRate * _hardCap * _liquidityAdditionPercent) /
                        (100 * _subRate),
                "Check the token allowance"
            );
            token.transferFrom(
                msg.sender,
                address(this),
                _hardCap +
                    (_listingRate * _hardCap * _liquidityAdditionPercent) /
                    (100 * _subRate)
            );
        }
        (bool success, ) = payable(owner()).call{value: msg.value}("");
        require(success, "Transfer failed");

        subs.push();
        SubStruct storage newSub = subs[subs.length - 1];
        newSub.token = ERC20(_tokenAddress);
        newSub.purchaseToken = ERC20(_purchaseTokenAddress);
        newSub.creator = msg.sender;
        newSub.whitelistedEnabled = _whitelistedEnabled;
        newSub.devFeeInToken = _devFeeInToken;
        newSub.softCap = _softCap;
        newSub.hardCap = _hardCap;
        newSub.hardCapPerUser = _hardCapPerUser;
        newSub.subRate = _subRate;
        newSub.listingRate = _listingRate;
        newSub.finHardCap = _hardCap;
        newSub.startTime = _startTime;
        newSub.endTime = _endTime;
        newSub.liquidityAdditionPercent = _liquidityAdditionPercent;
        newSub.liquidityUnlockTime = _liquidityUnlockTime;
        newSub.listingAmount =
            (_listingRate * _hardCap * _liquidityAdditionPercent) /
            (100 * _subRate);
        userSubs[msg.sender].push(subs.length - 1);
    }

    function whitelistAddress(uint256 _subIndex, address _buyer) external {
        SubStruct storage sub = subs[_subIndex];
        require(sub.whitelistedEnabled == true, "Whitelisting is not enabled");
        require(msg.sender == sub.creator, "Only creator can whitelist");
        require(block.timestamp < sub.endTime, "sub has ended");
        sub.whitelisted[_buyer] = true;
    }

    function buyToken(uint256 _subIndex, uint256 _amount) external payable {
        SubStruct storage sub = subs[_subIndex];

        require(
            block.timestamp >= sub.startTime && block.timestamp <= sub.endTime,
            "sub not active"
        );
        if (sub.whitelistedEnabled) {
            require(sub.whitelisted[msg.sender], "Address not whitelisted");
        }

        if (address(sub.purchaseToken) == address(0)) {
            require(msg.value >= _amount, "Not enough AVAX provided");
        } else {
            require(
                sub.purchaseToken.allowance(msg.sender, address(this)) >=
                    _amount,
                "Check the token allowance"
            );
            sub.purchaseToken.transferFrom(msg.sender, address(this), _amount);
        }

        uint256 purchaseTokenDecimals = 18;
        if (address(sub.purchaseToken) != address(0))
            purchaseTokenDecimals = sub.purchaseToken.decimals();

        uint tokensSold = calculateTokens(
            sub.subRate,
            _amount,
            sub.token.decimals(),
            purchaseTokenDecimals
        );

        sub.tokensInvested[msg.sender] += _amount;
        sub.tokensSold += tokensSold;
        if (!sub.hasInvested[msg.sender]) {
            sub.investors.push(msg.sender);
            sub.hasInvested[msg.sender] = true;
        }
        sub.finMoneyPer += _amount;
        sub.moneyRaised += _amount;
        userSubs[msg.sender].push(subs.length - 1);
    }

    function refundInvestment(uint256 _subIndex) external {
        SubStruct storage sub = subs[_subIndex];

        require(block.timestamp > sub.endTime, "Sub has not ended yet");
        require(sub.tokensSold < sub.softCap, "SoftCap was reached");
        if (msg.sender == sub.creator) {
            sub.token.transfer(sub.creator, sub.token.balanceOf(address(this)));
        } else {
            require(
                sub.tokensInvested[msg.sender] > 0,
                "No investment to refund"
            );
            uint256 investmentToRefund = sub.tokensInvested[msg.sender];
            sub.tokensInvested[msg.sender] = 0;

            if (address(sub.purchaseToken) == address(0)) {
                (bool success, ) = payable(msg.sender).call{
                    value: investmentToRefund
                }("");
                require(success, "Transfer failed");
            } else {
                sub.purchaseToken.transfer(msg.sender, investmentToRefund);
            }
        }
    }

    // Remaining functions (finalizePool, claimTokens, handleAfterSale, collectDevCommission) remain the same as in the previous implementation

    function rescueERC20(
        address _tokenAddress,
        uint256 _amount
    ) external onlyOwner {
        IERC20(_tokenAddress).transfer(owner(), _amount);
    }

    receive() external payable {}
}
