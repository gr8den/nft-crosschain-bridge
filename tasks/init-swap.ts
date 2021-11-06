import { task } from "hardhat/config";
import { getNamedAccounts } from "../utils/named-accounts";
import { generateNonce } from "../utils/nonce";

interface Args {
  bridge: string,
  nft: string,
  tokenId: string
  chainTo: string,
}

task('init-swap', 'Init NFTs swap on Bridge')
  .addParam('bridge', 'Bridge contract address')
  .addParam('nft', 'NFT contract address')
  .addParam('tokenId', 'NFT token ID')
  .addParam('chainTo', 'Target chain ID')
  .setAction(async (args: Args, { ethers }) => {
    const nonce = generateNonce();
    const { owner } = await getNamedAccounts(ethers);
    const nftByOwner = await ethers.getContractFactory('MyNFT', owner)
      .then(o => o.attach(args.nft));
    const bridgeByOwner = await ethers.getContractFactory('Bridge', owner)
      .then(o => o.attach(args.bridge));

    console.log(`Sender: ${owner.address}`);

    await nftByOwner.approve(args.bridge, args.tokenId).then(tx => tx.wait());
    await bridgeByOwner.initSwap(args.tokenId, args.chainTo, nonce);

    console.log('Swap inited');
    console.log(`Nonce: ${nonce.toHexString()}`);
  });
