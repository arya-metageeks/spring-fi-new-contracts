require('dotenv').config();
const { ethers } = require("hardhat");

async function main() {
    // Fetch signers
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Deployment Configuration
    const name = "My Baby Token";
    const symbol = "MBT";
    const totalSupply = ethers.parseUnits("1000000", 18); // 1 million tokens
    
    // IMPORTANT: Replace these with ACTUAL addresses
    const addrs = [
        "0x3a1d6dEe1b62eA305de41a0f97E9D2176Eebc3B3", // [0] reward token 
        "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", // [1] router 
        "0x2Ba1Bf6aB49c0d86CDb12D69A777B6dF39AB79D9", // [2] marketing wallet 
        "0x0000000000000000000000000000000000000000"  // [3] dividend tracker implementation
    ];

    const feeSettings = [
        5, // 5% token rewards
        3, // 3% liquidity
        2  // 2% marketing
    ];

    const minimumTokenBalanceForDividends = ethers.parseUnits("10", 18); // 10 tokens
    const serviceFeeReceiver = "0xaA669E1093221741Ade565856C0F157AE63DFDd8"; // Service fee receiver
    const serviceFee = ethers.parseEther("0.1"); // 0.1 ETH service fee

    // Deploy BabyToken Factory
    const BabyTokenFactory = await ethers.getContractFactory("BabyTokenFactory");
    const babyTokenFactory = await BabyTokenFactory.deploy();
    
    // Wait for deployment and get address
    // await babyTokenFactory.waitForDeployment();
    const factoryAddress = await babyTokenFactory.getAddress();
    console.log("BabyToken Factory deployed to:", factoryAddress);

    // Create Token
    // const createTokenTx = await babyTokenFactory.createToken(
    //     name,
    //     symbol,
    //     totalSupply,
    //     addrs,
    //     feeSettings,
    //     minimumTokenBalanceForDividends,
    //     serviceFeeReceiver,
    //     serviceFee
    // );

    // await createTokenTx.wait();
    // // Wait for transaction confirmation
    // const receipt = await createTokenTx.wait();

    // // Error handling for receipt
    // if (!receipt || !receipt.logs || receipt.logs.length === 0) {
    //     throw new Error("No logs found in transaction receipt");
    // }

    // // Find the token creation log (adjust based on your exact event structure)
    // const tokenCreatedLog = receipt.logs.find(
    //     log => log.fragment && log.fragment.name === 'TokenCreated'
    // );

    // if (!tokenCreatedLog) {
    //     throw new Error("Token creation log not found");
    // }

    // // Extract token address (adjust index if needed)
    // const tokenAddress = tokenCreatedLog.args[1];

    // // Attach to the deployed token contract
    tokenAddress = '0x3a1d6dEe1b62eA305de41a0f97E9D2176Eebc3B3'
    const BabyToken = await ethers.getContractFactory("BABYTOKEN");
    const babyToken = BabyToken.attach(tokenAddress);

    // Retrieve dividend tracker address
    const dividendTrackerAddress = await babyToken.dividendTracker();

    // // Log deployment details
    console.log("BabyToken Factory Address:", factoryAddress);
    console.log("Deployed BabyToken Address:", tokenAddress);
    console.log("Dividend Tracker Address:", dividendTrackerAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment Error:", error);
        process.exit(1);
    });