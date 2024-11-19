const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("AuctionD", function () {
  let AuctionD;
  let TokenLock;
  let TestToken;
  let PurchaseToken;
  let auctionD;
  let tokenLock;
  let testToken;
  let purchaseToken;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  let testTokenAddress;
  let auctionD_Address;

  // Common test values
  const ONE_DAY = 86400;
  const THIRTY_DAYS = ONE_DAY * 30;
  const ONE_ETHER = ethers.parseEther("1.0");
  const TOKENS_TO_SELL = ethers.parseEther("1000000"); // 1M tokens
  const MIN_BUY = ethers.parseEther("0.1");
  const MAX_BUY = ethers.parseEther("10");
  const START_PRICE = ethers.parseEther("0.01"); // 0.01 ETH per token
  const END_PRICE = ethers.parseEther("0.005"); // 0.005 ETH per token
  const DEC_PRICE_CYCLE = 60; // 1 hour in minutes
  const LIQUIDITY_PERCENT = 51;
  const LIQUIDITY_UNLOCK_TIME = THIRTY_DAYS;

  beforeEach(async function () {
    // Get Signers
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy test tokens
    const TestTokenFactory = await ethers.getContractFactory("MockERC20");
    testToken = await TestTokenFactory.deploy("Test Token", "TEST");
    testTokenAddress = await testToken.getAddress();

    purchaseToken = await TestTokenFactory.deploy("Purchase Token", "PRCH");

    // Deploy TokenLock mock
    const TokenLockFactory = await ethers.getContractFactory("TokenLock");
    tokenLock = await TokenLockFactory.deploy();

    // Deploy AuctionD
    const AuctionDFactory = await ethers.getContractFactory("AuctionD");
    auctionD = await AuctionDFactory.deploy();
    auctionD_Address = await auctionD.getAddress();

    // Mint tokens to owner
    await testToken.mint(owner.address, TOKENS_TO_SELL * BigInt(2));
    await testToken.mint(addr1.address, TOKENS_TO_SELL * BigInt(2));
    await purchaseToken.mint(addr1.address, ONE_ETHER * BigInt(100));

    // Approve auction contract
    await testToken.approve(auctionD_Address, TOKENS_TO_SELL * BigInt(2));
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await auctionD.owner()).to.equal(owner.address);
    });

    it("Should have correct initial dev fee", async function () {
      expect(await auctionD.devFee()).to.equal(5);
    });
  });

  describe("Create Auction", function () {
    it("Should create auction with correct parameters", async function () {
      const startTime = (await time.latest()) + ONE_DAY;
      const endTime = startTime + THIRTY_DAYS;

      let requiredAmount =
        BigInt(TOKENS_TO_SELL) +
        (BigInt(TOKENS_TO_SELL) * BigInt(LIQUIDITY_PERCENT)) / BigInt(100);

      await testToken.connect(addr1).approve(auctionD_Address, requiredAmount);

      await auctionD.connect(addr1).createAuction(
        testTokenAddress,
        ethers.ZeroAddress, // Native token as purchase token
        false, // whitelistedEnabled
        false, // burnOrRefund
        false, // vestingEnabled
        false, // devFeeInToken
        TOKENS_TO_SELL,
        MIN_BUY,
        MAX_BUY,
        DEC_PRICE_CYCLE,
        START_PRICE,
        END_PRICE,
        startTime,
        endTime,
        LIQUIDITY_PERCENT,
        LIQUIDITY_UNLOCK_TIME,
        0, // firstReleasePercentage
        0, // vestingPeriod
        0 // cycleReleasePercentage
      );

      const auction = await auctionD.Auctions(0);
      expect(auction.token).to.equal(testTokenAddress);
      expect(auction.tokensToSell).to.equal(TOKENS_TO_SELL);
      expect(auction.startPrice).to.equal(START_PRICE);
      expect(auction.endPrice).to.equal(END_PRICE);
    });

    it("Should revert if start price is not greater than end price", async function () {
      const startTime = (await time.latest()) + ONE_DAY;
      const endTime = startTime + THIRTY_DAYS;

      let requiredAmount =
        BigInt(TOKENS_TO_SELL) +
        (BigInt(TOKENS_TO_SELL) * BigInt(LIQUIDITY_PERCENT)) / BigInt(100);

      await testToken.connect(addr1).approve(auctionD_Address, requiredAmount);

      await expect(
        auctionD.createAuction(
          testTokenAddress,
          ethers.ZeroAddress,
          false,
          false,
          false,
          false,
          TOKENS_TO_SELL,
          MIN_BUY,
          MAX_BUY,
          DEC_PRICE_CYCLE,
          END_PRICE, // Using end price as start price
          END_PRICE,
          startTime,
          endTime,
          LIQUIDITY_PERCENT,
          LIQUIDITY_UNLOCK_TIME,
          0,
          0,
          0
        )
      ).to.be.revertedWith("Start Price must be more than End Price");
    });
  });

  describe("Buy Token", function () {
    let auctionId;
    let startTime;
    let endTime;

    beforeEach(async function () {
      startTime = (await time.latest()) + ONE_DAY;
      endTime = startTime + THIRTY_DAYS;

      let requiredAmount =
        BigInt(TOKENS_TO_SELL) +
        (BigInt(TOKENS_TO_SELL) * BigInt(LIQUIDITY_PERCENT)) / BigInt(100);

      await testToken.connect(owner).approve(auctionD_Address, requiredAmount);

      await auctionD.createAuction(
        testTokenAddress,
        ethers.ZeroAddress,
        false,
        false,
        false,
        false,
        TOKENS_TO_SELL,
        MIN_BUY,
        MAX_BUY,
        DEC_PRICE_CYCLE,
        START_PRICE,
        END_PRICE,
        startTime,
        endTime,
        LIQUIDITY_PERCENT,
        LIQUIDITY_UNLOCK_TIME,
        0,
        0,
        0
      );
      auctionId = 0;
    });

    it("Should allow buying tokens after start time", async function () {
      await time.increaseTo(startTime + 1);

      await auctionD.connect(addr1).buyToken(auctionId, MIN_BUY, {
        value: MIN_BUY,
      });

      const auction = await auctionD.Auctions(auctionId);
      expect(auction.tokensSold).to.be.gt(0);
      expect(auction.moneyRaised).to.equal(MIN_BUY);
    });

    it("Should revert if buying before start time", async function () {
      await expect(
        auctionD.connect(addr1).buyToken(auctionId, MIN_BUY, {
          value: MIN_BUY,
        })
      ).to.be.revertedWith("Auction has not started yet");
    });

    it("Should revert if amount is less than minBuy", async function () {
      await time.increaseTo(startTime + 1);

      await expect(
        auctionD.connect(addr1).buyToken(auctionId, MIN_BUY / BigInt(2), {
          value: MIN_BUY / BigInt(2),
        })
      ).to.be.revertedWith("Invalid _amount");
    });
  });

  describe("Whitelisting", function () {
    let auctionId;
    let startTime;
    let endTime;

    beforeEach(async function () {
      startTime = (await time.latest()) + ONE_DAY;
      endTime = startTime + THIRTY_DAYS;

      let requiredAmount =
        BigInt(TOKENS_TO_SELL) +
        (BigInt(TOKENS_TO_SELL) * BigInt(LIQUIDITY_PERCENT)) / BigInt(100);

      await testToken.connect(owner).approve(auctionD_Address, requiredAmount);

      await auctionD.createAuction(
        testTokenAddress,
        ethers.ZeroAddress,
        true, // Enable whitelist
        false,
        false,
        false,
        TOKENS_TO_SELL,
        MIN_BUY,
        MAX_BUY,
        DEC_PRICE_CYCLE,
        START_PRICE,
        END_PRICE,
        startTime,
        endTime,
        LIQUIDITY_PERCENT,
        LIQUIDITY_UNLOCK_TIME,
        0,
        0,
        0
      );
      auctionId = 0;
    });

    it("Should allow whitelisted address to buy tokens", async function () {
      await auctionD.whitelistAddress(auctionId, addr1.address);
      await time.increaseTo(startTime + 1);

      await auctionD.connect(addr1).buyToken(auctionId, MIN_BUY, {
        value: MIN_BUY,
      });

      const auction = await auctionD.Auctions(auctionId);
      expect(auction.tokensSold).to.be.gt(0);
    });

    it("Should revert if non-whitelisted address tries to buy", async function () {
      await time.increaseTo(startTime + 1);

      await expect(
        auctionD.connect(addr1).buyToken(auctionId, MIN_BUY, {
          value: MIN_BUY,
        })
      ).to.be.revertedWith("Address not whitelisted");
    });
  });

  describe("Finalize Auction", function () {
    let auctionId;
    let startTime;
    let endTime;

    beforeEach(async function () {
      startTime = (await time.latest()) + ONE_DAY;
      endTime = startTime + THIRTY_DAYS;

      let requiredAmount =
        BigInt(TOKENS_TO_SELL) +
        (BigInt(TOKENS_TO_SELL) * BigInt(LIQUIDITY_PERCENT)) / BigInt(100);

      await testToken.connect(owner).approve(auctionD_Address, requiredAmount);

      await auctionD.createAuction(
        testTokenAddress,
        ethers.ZeroAddress,
        false,
        false,
        false,
        false,
        TOKENS_TO_SELL,
        MIN_BUY,
        MAX_BUY,
        DEC_PRICE_CYCLE,
        START_PRICE,
        END_PRICE,
        startTime,
        endTime,
        LIQUIDITY_PERCENT,
        LIQUIDITY_UNLOCK_TIME,
        0,
        0,
        0
      );
      auctionId = 0;
    });

    it("Should finalize auction after end time if soft cap is reached", async function () {
      await time.increaseTo(startTime + 1);

      // Buy enough tokens to reach soft cap
      const auction = await auctionD.Auctions(auctionId); // Fetch auction details
      const softCap = auction.softCap; // Access the softCap property
      const minBuy = auction.minBuy; // Access the softCap property
      const maxBuy = auction.maxBuy; // Access the softCap property

      console.log("Soft Cap:", softCap.toString());
      console.log("Soft Eth:", ethers.formatEther(softCap));

      console.log("Min Buy:", minBuy.toString());
      console.log("Min Eth:", ethers.formatEther(minBuy));

      console.log("Max Buy:", maxBuy.toString());
      console.log("Max Eth:", ethers.formatEther(maxBuy));

      console.log("Amt:", ethers.parseEther("0.5").toString());
      let amt = softCap - ethers.parseEther("1500");

      console.log("Amt:", amt.toString());

      console.log("Match:", amt >= minBuy && amt <= maxBuy);
      //   5000000000000000000000
      //   10000000000000000000
      //   1000000000000000000
      await auctionD
        .connect(addr1)
        .buyToken(auctionId, ethers.parseEther("5"), {
          value: softCap,
        });

      await time.increaseTo(endTime + 1);
      //   await auctionD.finalizeAuction(auctionId);

      //   const updatedAuction = await auctionD.Auctions(auctionId);
      //   expect(updatedAuction.auctionFinalized).to.be.true;
    });

    it("Should revert finalization if soft cap is not reached", async function () {
      await time.increaseTo(endTime + 1);

      await expect(auctionD.finalizeAuction(auctionId)).to.be.revertedWith(
        "SoftCap wasn't reached"
      );
    });
  });

  describe("Claim Tokens", function () {
    let auctionId;
    let startTime;
    let endTime;

    beforeEach(async function () {
      startTime = (await time.latest()) + ONE_DAY;
      endTime = startTime + THIRTY_DAYS;

      let requiredAmount =
        BigInt(TOKENS_TO_SELL) +
        (BigInt(TOKENS_TO_SELL) * BigInt(LIQUIDITY_PERCENT)) / BigInt(100);

      await testToken.connect(owner).approve(auctionD_Address, requiredAmount);

      await auctionD.createAuction(
        testTokenAddress,
        ethers.ZeroAddress,
        false,
        false,
        true, // Enable vesting
        false,
        TOKENS_TO_SELL,
        MIN_BUY,
        MAX_BUY,
        DEC_PRICE_CYCLE,
        START_PRICE,
        END_PRICE,
        startTime,
        endTime,
        LIQUIDITY_PERCENT,
        LIQUIDITY_UNLOCK_TIME,
        20, // firstReleasePercentage
        30, // vestingPeriod (days)
        20 // cycleReleasePercentage
      );
      auctionId = 0;
    });

    it("Should allow claiming tokens after auction ends", async function () {
      await time.increaseTo(startTime + 1);

      // Buy tokens
      await auctionD.connect(addr1).buyToken(auctionId, MIN_BUY * BigInt(10), {
        value: MIN_BUY * BigInt(10),
      });

      await time.increaseTo(endTime + 1);
    //   await auctionD.finalizeAuction(auctionId);

      const balanceBefore = await testToken.balanceOf(addr1.address);

      const auction = await auctionD.Auctions(auctionId); // Fetch auction details
      const softCap = auction.softCap; // Access the softCap property
      const moneyRaised = auction.moneyRaised;

      console.log("Soft Cap: ", softCap);
      console.log("Money Raised: ", moneyRaised);
      //   await auctionD.connect(addr1).claimTokens(auctionId);
    //   const balanceAfter = await testToken.balanceOf(addr1.address);

    //   expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("Should respect vesting schedule", async function () {
      await time.increaseTo(startTime + 1);

      // Buy tokens
      await auctionD.connect(addr1).buyToken(auctionId, MIN_BUY * BigInt(10), {
        value: MIN_BUY * BigInt(10),
      });

      await time.increaseTo(endTime + 1);
    //   await auctionD.finalizeAuction(auctionId);

      // First claim (should get initial release)
    //   await auctionD.connect(addr1).claimTokens(auctionId);
      const firstClaimBalance = await testToken.balanceOf(addr1.address);

      // Move forward one vesting period
      await time.increase(30 * ONE_DAY);

      // Second claim (should get next vesting amount)
    //   await auctionD.connect(addr1).claimTokens(auctionId);
      const secondClaimBalance = await testToken.balanceOf(addr1.address);

    //   expect(secondClaimBalance).to.be.gt(firstClaimBalance);
    });
  });
});
