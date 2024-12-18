const createLiquidityGeneratorToken = async (e: React.FormEvent) => {
  

  
      const { signer, provider } = await getProviderAndSigner();
  
      // Key change: Create contract with signer instead of provider
      const contract = new ethers.Contract(
        liquidityGeneratorTokenAddress, 
        liquidityGeneratorTokenABI, 
        await signer // Use signer instead of provider
      );
    
      // Key changes in transaction sending
      const tx = await contract.createToken(...args, {
        gasLimit: 5000000, 
      });

      const receipt = await tx.wait();

      let newTokenAddress = receipt.logs[0].address;
      console.log("NewTokenAddress:", newTokenAddress);
      
      if (newTokenAddress) {
        await addTokenAddress(newTokenAddress);
      }
  
      return receipt;
   
    } catch (error) {
      console.error("Unexpected error in token creation:", error);
  
    }
  };