// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenLock
 * @dev Mock contract for testing token locking functionality
 */
contract TokenLock is Ownable {
    struct Lock {
        address tokenAddress;
        address beneficiary;
        uint256 amount;
        uint256 unlockTime;
        bool vesting;
        uint256 firstReleasePercentage;
        uint256 vestingPeriodInDays;
        uint256 cycleReleasePercentage;
        bool claimed;
    }

    // Mapping from lock ID to Lock details
    mapping(uint256 => Lock) public locks;
    uint256 public lockCount;

    event TokensLocked(
        uint256 indexed lockId,
        address indexed tokenAddress,
        address indexed beneficiary,
        uint256 amount,
        uint256 unlockTime,
        bool vesting,
        uint256 firstReleasePercentage,
        uint256 vestingPeriodInDays,
        uint256 cycleReleasePercentage
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Locks tokens for a specified duration
     * @param _tokenAddress The address of the token to lock
     * @param _beneficiary The address that will receive the tokens once unlocked
     * @param _amount The amount of tokens to lock
     * @param _lockDuration The duration for which tokens will be locked (in seconds)
     * @param _vesting Whether the tokens should be released gradually
     * @param _firstReleasePercentage Percentage of tokens to release initially
     * @param _vestingPeriodInDays Period between vesting releases in days
     * @param _cycleReleasePercentage Percentage of tokens to release per cycle
     */
    function lockTokens(
        address _tokenAddress,
        address _beneficiary,
        uint256 _amount,
        uint256 _lockDuration,
        bool _vesting,
        uint256 _firstReleasePercentage,
        uint256 _vestingPeriodInDays,
        uint256 _cycleReleasePercentage
    ) external {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_beneficiary != address(0), "Invalid beneficiary address");
        require(_amount > 0, "Amount must be greater than 0");
        require(_lockDuration > 0, "Lock duration must be greater than 0");

        // Transfer tokens from sender to this contract
        IERC20 token = IERC20(_tokenAddress);
        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "Token transfer failed"
        );

        // Create new lock
        uint256 lockId = lockCount++;
        locks[lockId] = Lock({
            tokenAddress: _tokenAddress,
            beneficiary: _beneficiary,
            amount: _amount,
            unlockTime: block.timestamp + _lockDuration,
            vesting: _vesting,
            firstReleasePercentage: _firstReleasePercentage,
            vestingPeriodInDays: _vestingPeriodInDays,
            cycleReleasePercentage: _cycleReleasePercentage,
            claimed: false
        });

        emit TokensLocked(
            lockId,
            _tokenAddress,
            _beneficiary,
            _amount,
            block.timestamp + _lockDuration,
            _vesting,
            _firstReleasePercentage,
            _vestingPeriodInDays,
            _cycleReleasePercentage
        );
    }

    /**
     * @dev Claims locked tokens if the lock period has expired
     * @param _lockId The ID of the lock to claim
     */
    function claimTokens(uint256 _lockId) external {
        Lock storage lock = locks[_lockId];
        require(!lock.claimed, "Tokens already claimed");
        require(
            msg.sender == lock.beneficiary,
            "Only beneficiary can claim tokens"
        );
        require(block.timestamp >= lock.unlockTime, "Tokens are still locked");

        lock.claimed = true;
        IERC20 token = IERC20(lock.tokenAddress);
        require(
            token.transfer(lock.beneficiary, lock.amount),
            "Token transfer failed"
        );
    }

    /**
     * @dev Views lock information
     * @param _lockId The ID of the lock to view
     */
    function getLock(uint256 _lockId)
        external
        view
        returns (
            address tokenAddress,
            address beneficiary,
            uint256 amount,
            uint256 unlockTime,
            bool vesting,
            uint256 firstReleasePercentage,
            uint256 vestingPeriodInDays,
            uint256 cycleReleasePercentage,
            bool claimed
        )
    {
        Lock storage lock = locks[_lockId];
        return (
            lock.tokenAddress,
            lock.beneficiary,
            lock.amount,
            lock.unlockTime,
            lock.vesting,
            lock.firstReleasePercentage,
            lock.vestingPeriodInDays,
            lock.cycleReleasePercentage,
            lock.claimed
        );
    }
}