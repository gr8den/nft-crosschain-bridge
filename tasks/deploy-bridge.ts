import { task } from "hardhat/config";
import { getNamedAccounts } from "../utils/named-accounts";

task('deploy-bridge', 'Deploy Bridge contract')
  .addParam('nft', 'NFT contract address')
  .setAction(async (args: { nft: string }, { ethers }) => {
    const { bridgeDeployer, validatorSigner } = await getNamedAccounts(ethers);
    const Bridge = await ethers.getContractFactory('Bridge', bridgeDeployer);

    const bridge = await Bridge.deploy(validatorSigner.address, args.nft);
    await bridge.deployed();

    console.log('Bridge Contract deployed to address:', bridge.address);
  });
