const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("LiquidityGeneratorToken", function () {
  let LiquidityGeneratorTokenFactory;
  let factory;
  let token;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  let router;
  let weth;

  const TOKEN_NAME = "Test Token";
  const TOKEN_SYMBOL = "TEST";
  const TOTAL_SUPPLY = ethers.parseEther("1000000"); // 1 million tokens
  const TAX_FEE = 200; // 2%
  const LIQUIDITY_FEE = 300; // 3%
  const CHARITY_FEE = 100; // 1%
  const SERVICE_FEE = ethers.parseEther("0.1");

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, charityAddress, serviceFeeReceiver, ...addrs] = await ethers.getSigners();

    // Deploy mock WETH and Router
    const WETH = await ethers.getContractFactory("MockERC20");
    weth = await WETH.deploy("Wrapped ETH", "WETH");
    await weth.waitForDeployment();

    // Deploy mock Router
    const Router = await ethers.getContractFactory("MockRouter");
    router = await Router.deploy(await weth.getAddress());
    await router.waitForDeployment();

    // Deploy Factory
    LiquidityGeneratorTokenFactory = await ethers.getContractFactory("LiquidityGeneratorTokenFactoryV3");
    factory = await LiquidityGeneratorTokenFactory.deploy();
    await factory.waitForDeployment();
  });

//   0: "TestLiquid"
// 1: "test"
// 2: 1000000000000000000000000000n
// 3: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"
// 4: "0x0000000000000000000000000000000000000000"
// 5: 100n
// 6: 100n
// 7: 0n
// 8: "0xaA669E1093221741Ade565856C0F157AE63DFDd8"
// 9: 0
// length: 10

  describe("Token Creation", function () {
    it("Should create a new token with correct parameters", async function () {
      // const tx = await factory.createToken(
      //   TOKEN_NAME,
      //   TOKEN_SYMBOL,
      //   TOTAL_SUPPLY,
      //   await router.getAddress(),
      //   charityAddress.address,
      //   TAX_FEE,
      //   LIQUIDITY_FEE,
      //   CHARITY_FEE,
      //   serviceFeeReceiver.address,
      //   SERVICE_FEE,
      //   // { value: SERVICE_FEE }
      // );
      const tx = await factory.createToken(
        "TestLiquid",
        "test",
        10000n,
        "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
        "0x0000000000000000000000000000000000000000",
        100n,
        100n,
        0m,
        "0xaA669E1093221741Ade565856C0F157AE63DFDd8",
        0,
        // { value: SERVICE_FEE }
      );


      const receipt = await tx.wait();
      // console.log("receipt", receipt)
      // console.log("All Events:", receipt.events);

      const event = receipt.events?.find(e => e.event === "TokenCreated");
      console.log("events",event)
      // expect(event).to.not.be.undefined;

      // const tokenAddress = event.args.token;
      // token = await ethers.getContractAt("LiquidityGeneratorToken", tokenAddress);

    });

  });

});