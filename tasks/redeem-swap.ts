import { task } from "hardhat/config";
import { getNamedAccounts } from "../utils/named-accounts";

interface Args {
  bridge: string,
  tokenId: string,
  chainFrom: string,
  chainTo: string,
  nonce: string,
  sign: string,
}

task('redeem-swap', 'Redeem NFTs swap on Bridge')
  .addParam('bridge', 'Bridge contract address')
  .addParam('tokenId', 'NFT token ID')
  .addParam('chainFrom', 'Source chain ID')
  .addParam('chainTo', 'Target chain ID')
  .addParam('nonce', 'Nonce used in swap')
  .addParam('sign', 'Signature from validator')
  .setAction(async (args: Args, { ethers }) => {
    const { owner } = await getNamedAccounts(ethers);
    const bridgeByOwner = await ethers.getContractFactory('Bridge', owner)
      .then(o => o.attach(args.bridge));

    const { v, r, s } = ethers.utils.splitSignature(args.sign);
    await bridgeByOwner.redeemSwap(args.tokenId, args.chainFrom, args.nonce, v, r, s);

    console.log('Swap done');
  });
