import type { ethers as Ethers } from 'ethers';
import { HardhatEthersHelpers } from 'hardhat/types/runtime';

export async function getNamedAccounts(ethers: typeof Ethers & HardhatEthersHelpers) {
  const signers = await ethers.getSigners();

  return {
    minter: signers[0],
    owner: signers[1],
    approved: signers[2],
    receiver: signers[3],
    bridgeDeployer: signers[4],

    // cannot signMessage by SignerWithAddress
    validatorSigner: new ethers.Wallet(process.env.VALIDATOR_PK!),
  };
}
