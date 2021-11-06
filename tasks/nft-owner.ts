import { task } from "hardhat/config";

task('nft-owner', 'Get owner of NFT')
  .addParam('contract', 'NFT contract address')
  .addParam('tokenId', 'NFT token ID')
  .setAction(async (args: { contract: string, tokenId: string }, { ethers }) => {
    const nft = await ethers.getContractFactory('MyNFT').then(o => o.attach(args.contract));
    const ownerAddress = await nft.ownerOf(args.tokenId);
    console.log(`Owner of ${args.tokenId} is ${ownerAddress}`);
  });
