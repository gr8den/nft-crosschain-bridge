import { task } from "hardhat/config";
import { getNamedAccounts } from "../utils/named-accounts";

interface Args {
  sender: string,
  tokenId: string,
  chainFrom: string,
  chainTo: string,
  nonce: string,
}

task('validate', 'Validate swap on Bridge')
  .addParam('sender', 'NFT Sender', process.env.OWNER_ADDRESS)
  .addParam('tokenId', 'NFT token ID')
  .addParam('chainFrom', 'Source chain ID')
  .addParam('chainTo', 'Target chain ID')
  .addParam('nonce', 'Nonce used in swap')
  .setAction(async (args: Args, { ethers }) => {
    const { validatorSigner } = await getNamedAccounts(ethers);

    const hash = ethers.utils.solidityKeccak256([
      'address', 'uint256', 'uint256', 'uint256', 'uint256',
    ], [
      args.sender, args.tokenId, args.chainFrom, args.chainTo, args.nonce
    ]);
    const sign = await validatorSigner.signMessage(ethers.utils.arrayify(hash));

    console.log(`Signature: ${sign}`);
  });
