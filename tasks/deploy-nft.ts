import { task } from "hardhat/config";
import { getNamedAccounts } from "../utils/named-accounts";

task('deploy-nft', 'Deploy NFT contract')
  .setAction(async (args: {}, { ethers }) => {
    const { minter } = await getNamedAccounts(ethers);
    const MyNFT = await ethers.getContractFactory('MyNFT', minter);

    const myNFT = await MyNFT.deploy();
    await myNFT.deployed();

    console.log('NFT Contract deployed to address:', myNFT.address);
    console.log(`Minter address: ${await myNFT.signer.getAddress()}`);
  });
