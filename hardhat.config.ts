import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { ethers } from "hardhat";
import * as _ from 'lodash';

dotenv.config();

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task('generate-pk', 'Generate private key', async (_, { ethers }) => {
  const signer = ethers.Wallet.createRandom();
  console.log(`Address: ${signer.address}`);
  console.log(`PK: ${signer.privateKey}`);
});

const accounts = [
  process.env.MINTER_PK           || '0x1111111111111111111111111111111111111111111111111111111111111110', // 0
  process.env.OWNER_PK            || '0x1111111111111111111111111111111111111111111111111111111111111111', // 1
                                     '0x1111111111111111111111111111111111111111111111111111111111111112', // 2. approved (used in tests only)
                                     '0x1111111111111111111111111111111111111111111111111111111111111113', // 3. receiver (used in tests only)
  process.env.BRIDGE_DEPLOYER_PK  || '0x1111111111111111111111111111111111111111111111111111111111111114', // 4
  process.env.VALIDATOR_PK        || '0x1111111111111111111111111111111111111111111111111111111111111115', // 5
];

if(accounts.length !== _.uniq(accounts).length) {
  console.error('Private keys not unique! Hardhat produce different addresses for same private keys');
}

import './tasks/deploy-nft';
import './tasks/deploy-bridge';
import './tasks/mint';
import './tasks/init-swap';
import './tasks/validate';
import './tasks/redeem-swap';
import './tasks/nft-owner';

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  solidity: {
    compilers: [{
      version: '0.8.6',
      settings: {
        optimizer: {
          enabled: true,
          runs: 999999,
        }
      }
    }],
  },
  networks: {
    hardhat: {
      chainId: 1337,
      blockGasLimit: 60_000_000, // BSC
      gasPrice: 5_000_000_000, // 5 Gwei
      accounts: accounts.map(privateKey => ({privateKey, balance: '10000000000000000000000'})),
    },
    tbnb: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      chainId: 97,
      blockGasLimit: 60_000_000, // BSC
      gasPrice: 10_000_000_000, // 10 Gwei
      accounts,
    },
    tmatic: {
      url: process.env.TMATIC_RPC || 'https://rpc-mumbai.maticvigil.com/',
      chainId: 80001,
      accounts,
    },
    bnb: {
      url: 'https://bsc-dataseed.binance.org/',
      chainId: 56,
      blockGasLimit: 60_000_000, // BSC
      gasPrice: 5_000_000_000, // 5 Gwei
      accounts,
    },
    matic: {
      url: 'https://rpc-mainnet.maticvigil.com/',
      chainId: 137,
      gasPrice: 50_000_000_000, // 50 Gwei
      accounts,
    },
  }
};

export default config;
