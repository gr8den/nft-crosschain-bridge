import { BigNumber } from "ethers/lib/ethers";
import { task, types } from "hardhat/config";
import { getNamedAccounts } from "../utils/named-accounts";

task('mint', 'Mint NFTs')
  .addParam('contract', 'NFT contract address')
  .addParam('recipient', 'Recipient of newly minted NFTs', process.env.OWNER_ADDRESS)
  .addOptionalParam('uri', 'Token URI', 'default')
  .addOptionalParam('count', 'Count of minted tokens', 10, types.int)
  .setAction(async (args: { count: number, uri: string, contract: string, recipient: string }, { ethers }) => {
    const { minter } = await getNamedAccounts(ethers);
    const byMinter = await ethers.getContractFactory("MyNFT", minter)
      .then(o => o.attach(args.contract));

    for(let i = 0; i < args.count; i++) {
      const mintTx = await byMinter.mintNFT(args.recipient, args.uri).then(tx => tx.wait());
      const transferEvent = mintTx.events!.find(o => o.event === 'Transfer')!;
      const tokenId = transferEvent.args!.tokenId as BigNumber;
      console.log(`Token id: ${tokenId.toHexString()}`);
    }

    console.log(`${args.count} NFTs minted to ${args.recipient}`);
  });
