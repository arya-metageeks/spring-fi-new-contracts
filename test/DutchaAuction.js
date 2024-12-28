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
  const TOKENS_TO_SELL = ethers.parseEther("1000"); // 1000 tokens
  const MIN_BUY = ethers.parseEther("1"); // 1 token min
  const MAX_BUY = ethers.parseEther("100"); // 100 tokens max
  const START_PRICE = ethers.parseUnits("1", 6); // 1 USDC per token
  const END_PRICE = ethers.parseUnits("0.1", 6); // 0.1 USDC per token
  const DEC_PRICE_CYCLE = 30; // 30 minutes
  const LIQUIDITY_PERCENT = 51;
  const LIQUIDITY_UNLOCK_TIME = THIRTY_DAYS;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy test tokens
    const TestTokenFactory = await ethers.getContractFactory("MockERC20");
    testToken = await TestTokenFactory.deploy("Test Token", "TEST");
    testTokenAddress = await testToken.getAddress();

    purchaseToken = await TestTokenFactory.deploy("USDC", "USDC");
    
    // Deploy TokenLock mock
    const TokenLockFactory = await ethers.getContractFactory("TokenLock");
    tokenLock = await TokenLockFactory.deploy();

    // Deploy AuctionD
    const AuctionDFactory = await ethers.getContractFactory("AuctionD");
    auctionD = await AuctionDFactory.deploy();
    auctionD_Address = await auctionD.getAddress();

    // Mint tokens
    await testToken.mint(owner.address, TOKENS_TO_SELL * BigInt(2));
    await purchaseToken.mint(addr1.address, ethers.parseUnits("10000", 6)); 

    // Approve auction contract
    await testToken.approve(auctionD_Address, TOKENS_TO_SELL * BigInt(2));
  });

  describe("Buy Token", function () {
    let auctionId;
    let startTime;
    let endTime;

    beforeEach(async function () {
      startTime = (await time.latest()) + ONE_DAY;
      endTime = startTime + THIRTY_DAYS;

      let requiredAmount = TOKENS_TO_SELL + (TOKENS_TO_SELL * BigInt(LIQUIDITY_PERCENT)) / BigInt(100);
      
      await testToken.approve(auctionD_Address, requiredAmount);

      await auctionD.createAuction(
        testTokenAddress,
        await purchaseToken.getAddress(), 
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

    it("Should allow buying tokens with USDC-like token", async function () {
      await time.increaseTo(startTime + 1);
  
      const buyAmount = ethers.parseEther("10"); // 10 tokens with 18 decimals
      
      const currentPrice = await auctionD.getCurrentPrice(auctionId);
      console.log("Current Price:", currentPrice.toString());
      
      // Calculate payment with 6 decimals (USDC-like)
      const paymentRequired = ethers.parseUnits("10", 6); // 10 USDC
      console.log("Payment Required:", paymentRequired.toString());
      
      // Approve with enough USDC decimals
      await purchaseToken.connect(addr1).approve(
          auctionD_Address, 
          ethers.parseUnits("1000", 6) // Approve 1000 USDC to be safe
      );
      
      // Verify sufficient USDC balance
      await purchaseToken.mint(
          addr1.address, 
          ethers.parseUnits("1000", 6)
      );
      
      // Buy tokens
      await auctionD.connect(addr1).buyToken(auctionId, buyAmount);
  
      const auction = await auctionD.Auctions(auctionId);
      expect(auction.tokensSold).to.equal(buyAmount);
      expect(auction.moneyRaised).to.be.gt(0);
  });
  });
});