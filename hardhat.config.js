require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const {
  PRIVATE_KEY,
  SEPOLIA_RPC,
  POLYGON_RPC,
  ETHERSCAN_API
} = process.env;

module.exports = {
  solidity: "0.8.17",

  networks: {
    sepolia: {
      url: SEPOLIA_RPC || "",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    },
    polygon: {
      url: POLYGON_RPC || "",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  },

  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API,
      polygon: ETHERSCAN_API
    }
  }
};
