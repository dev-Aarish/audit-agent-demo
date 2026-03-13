import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve("../.env") });

export default {
  solidity: "0.8.20",
  networks: {
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY]
    }
  },
  etherscan: {
  apiKey: process.env.BASESCAN_API_KEY,
  customChains: [
    {
      network: "baseSepolia",
      chainId: 84532,
      urls: {
        apiURL: "https://api-sepolia.basescan.org/api",
        browserURL: "https://sepolia.basescan.org"
      }
    }
  ]
}
};