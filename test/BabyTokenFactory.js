// const { expect } = require("chai");
// const { ethers } = require("hardhat");

// describe("BabyTokenFactory", function () {
//   let babyTokenFactory;
//   let owner;
//   let addr1;
//   let addr2;

//   beforeEach(async function () {
//     [owner, addr1, addr2] = await ethers.getSigners();

//     const BabyTokenFactory = await ethers.getContractFactory("BabyTokenFactory");
//     babyTokenFactory = await BabyTokenFactory.deploy();
//   });

//   describe("Token Creation", function () {
//     it("Should create a new token successfully", async function () {
//       // Log all parameters for verification
//       console.log("Starting token creation test...");

//       // 1. Token Basic Info
//       const name = "My Baby Token";
//       const symbol = "MBT";
//       const totalSupply = ethers.parseUnits("1000000", 18); // 1 million tokens
      
//       // 2. Required Addresses Array [4 addresses required]
//       const addrs = [
//         "0x0000000000000000000000000000000000000001", // reward token
//         "0x0000000000000000000000000000000000000002", // router
//         owner.address,                                 // marketing wallet
//         ethers.ZeroAddress                            // dividend tracker implementation
//       ];
//       console.log("Addresses array length:", addrs.length);
      
//       // 3. Fee Settings Array [3 values required]
//       const feeSettings = [
//         5, // 5% token rewards
//         3, // 3% liquidity
//         2  // 2% marketing
//       ];
//       console.log("Fee settings array length:", feeSettings.length);
      
//       // 4. Other Parameters
//       const minimumTokenBalanceForDividends = ethers.parseUnits("10", 18); // 10 tokens
//       const serviceFeeReceiver = addr1.address;
//       const serviceFee = ethers.parseEther("0.1"); // 0.1 ETH service fee

//       console.log("All parameters prepared. Attempting creation...");

//       try {
//         const tx = await babyTokenFactory.createToken(
//           name,                                // string: name_
//           symbol,                              // string: symbol_
//           totalSupply,                         // uint256: totalSupply_
//           addrs,                               // address[4]: addrs
//           feeSettings,                         // uint256[3]: feeSettings
//           minimumTokenBalanceForDividends,     // uint256: minimumTokenBalanceForDividends_
//           serviceFeeReceiver,                  // address: serviceFeeReceiver_
//           serviceFee,                          // uint256: serviceFee_
//         //   { 
//         //     value: serviceFee                  // Send ETH with the transaction
//         //   }
//         );

//         console.log("Transaction sent, waiting for confirmation...");
//         const receipt = await tx.wait();
//         console.log("Transaction confirmed:", receipt.hash);

//         // Verify the transaction was successful
//         expect(receipt.status).to.equal(1);

//       } catch (error) {
//         console.error("Detailed error information:");
//         console.error("Error name:", error.name);
//         console.error("Error message:", error.message);
//         if (error.data) {
//           console.error("Error data:", error.data);
//         }
//         if (error.transaction) {
//           console.error("Failed transaction:", error.transaction);
//         }
//         throw error;
//       }
//     });
//   });
// });


const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BabyTokenFactory", function () {
  let babyTokenFactory;
  let babyTokenImplementation;
  let owner;
  let addr1;
  let addr2;

  before(async function () {
    // Enable mainnet forking if needed
    // await network.provider.request({
    //   method: "hardhat_reset",
    //   params: [{
    //     forking: {
    //       jsonRpcUrl: process.env.MAINNET_RPC_URL,
    //       blockNumber: 15000000
    //     }
    //   }]
    // });
  });

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    console.log("Owner address:", owner.address);

    const name = "My Baby Token";
    const symbol = "MBT";
    const totalSupply = ethers.parseUnits("1000000", 18); // 1 million tokens
    
    // 2. Required Addresses Array [4 addresses required]
    const addrs = [
      "0x9deEA42B6C3AD9e97d8476535b6a181e5311D556", // reward token
      "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", // router
      addr1.address,                                 // marketing wallet
      ethers.ZeroAddress                            // dividend tracker implementation
    ];
    console.log("Addresses array length:", addrs.length);
    
    // 3. Fee Settings Array [3 values required]
    const feeSettings = [
      5, // 5% token rewards
      3, // 3% liquidity
      2  // 2% marketing
    ];
    console.log("Fee settings array length:", feeSettings.length);
    
    // 4. Other Parameters
    const minimumTokenBalanceForDividends = ethers.parseUnits("10", 18); // 10 tokens
    const serviceFeeReceiver = addr1.address;
    const serviceFee = ethers.parseEther("0.1"); // 0.1 ETH service fee

    // First deploy BABYTOKEN implementation
    const BabyToken = await ethers.getContractFactory("BABYTOKEN");
    babyTokenImplementation = await BabyToken.deploy(name,symbol,totalSupply,addrs,feeSettings, minimumTokenBalanceForDividends, serviceFeeReceiver, serviceFee);
    await babyTokenImplementation.waitForDeployment();
    console.log("BabyToken implementation deployed at:", await babyTokenImplementation.getAddress());

    // Then deploy factory
    const BabyTokenFactory = await ethers.getContractFactory("BabyTokenFactory");
    babyTokenFactory = await BabyTokenFactory.deploy();
    await babyTokenFactory.waitForDeployment();
    console.log("Factory deployed at:", await babyTokenFactory.getAddress());
  });

  describe("Token Creation", function () {
    it("Should create a new token successfully", async function () {
      // 1. Token Basic Info
      const name = "My Baby Token";
      const symbol = "MBT";
      const totalSupply = ethers.parseUnits("1000000", 18); // 1 million tokens

      // Deploy mock contracts for testing
      const MockToken = await ethers.getContractFactory("MockERC20");
      const mockRewardToken = await MockToken.deploy("Mock Reward", "MRT");
      await mockRewardToken.waitForDeployment();
      const mockRouter = await MockToken.deploy("Mock Router", "MRTR");
      await mockRouter.waitForDeployment();

      console.log("Mock contracts deployed:");
      console.log("- Reward Token:", await mockRewardToken.getAddress());
      console.log("- Router:", await mockRouter.getAddress());
      
      // 2. Required Addresses Array
      const addrs = [
        await mockRewardToken.getAddress(),  // reward token
        await mockRouter.getAddress(),       // router
        owner.address,                       // marketing wallet
        await babyTokenImplementation.getAddress()  // dividend tracker implementation
      ];

      console.log("\nVerifying addresses array:");
      addrs.forEach((addr, i) => console.log(`Address ${i}: ${addr}`));
      
      // 3. Fee Settings
      const feeSettings = [
        5, // 5% token rewards
        3, // 3% liquidity
        2  // 2% marketing
      ];
      
      // 4. Other Parameters
      const minimumTokenBalanceForDividends = ethers.parseUnits("10", 18);
      const serviceFeeReceiver = addr1.address;
      const serviceFee = ethers.parseEther("0.1");

      console.log("\nPre-transaction checks:");
      console.log("- Owner balance:", ethers.formatEther(await ethers.provider.getBalance(owner.address)));
      console.log("- Service fee:", ethers.formatEther(serviceFee));
      console.log("- Service fee receiver:", serviceFeeReceiver);

      try {
        console.log("\nSending transaction...");
        const tx = await babyTokenFactory.createToken(
            name,symbol,totalSupply,addrs,feeSettings, minimumTokenBalanceForDividends, serviceFeeReceiver, serviceFee
        //   {
        //     value: serviceFee,
        //     gasLimit: 5000000 // Increase gas limit for debugging
        //   }
        );

        console.log("Transaction hash:", tx.hash);
        console.log("Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("\nTransaction confirmed!");
        console.log("Gas used:", receipt.gasUsed.toString());
        
        // Get created token address from events
        const tokenCreatedEvent = receipt.logs.find(
          log => log.fragment && log.fragment.name === 'TokenCreated'
        );

        if (tokenCreatedEvent) {
          const newTokenAddress = tokenCreatedEvent.args[1];
          console.log("New token deployed at:", newTokenAddress);

          // Verify the new token
          const BabyToken = await ethers.getContractFactory("BABYTOKEN");
          const newToken = BabyToken.attach(newTokenAddress);

          console.log("\nVerifying token details:");
          console.log("- Name:", await newToken.name());
          console.log("- Symbol:", await newToken.symbol());
          console.log("- Total Supply:", ethers.formatUnits(await newToken.totalSupply(), 18));
        }

      } catch (error) {
        console.error("\nDetailed error information:");
        console.error("Error message:", error.message);
        
        // Try to get more details about the revert
        if (error.data) {
          console.error("Error data:", error.data);
        }
        
        // Check if it's a specific error type
        if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
          console.error("Contract creation failed - might be an issue with constructor parameters");
        }
        
        // Get the transaction that failed
        if (error.transaction) {
          console.error("\nFailed transaction details:");
          console.error("To:", error.transaction.to);
          console.error("From:", error.transaction.from);
          console.error("Data:", error.transaction.data);
          console.error("Value:", error.transaction.value?.toString());
        }

        throw error;
      }
    });
  });
});