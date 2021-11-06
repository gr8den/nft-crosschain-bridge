import { BigNumber } from "@ethersproject/bignumber";
import chaiAsPromised from "chai-as-promised";
import chai, { assert, expect } from "chai";
import { ethers } from "hardhat";
import { generateNonce } from '../utils/nonce';
import { getNamedAccounts } from "../utils/named-accounts";

chai.use(chaiAsPromised);
chai.should();

describe("Bridge Contract", () => {
  async function getChainId() {
    return getAccounts()
      .then(({minter: signer}) => signer.provider!.getNetwork())
      .then(network => network.chainId);
  }

  async function getAccounts() {
    const signers = await ethers.getSigners();

    return {
      minter: signers[0],
      owner: signers[1],
      // approved: signers[2],
      // receiver: signers[3],
      validator: signers[4], // use BRIDGE_DEPLOYER_PK

      // cannot signMessage by SignerWithAddress
      validatorWallet: new ethers.Wallet(process.env.BRIDGE_DEPLOYER_PK || '0x1111111111111111111111111111111111111111111111111111111111111114'), // todo: divide roles (validator -> bridgeDeployer + validator)
    };
    // return getNamedAccounts(ethers);
  }

  async function deployNFTContract() {
    const { minter } = await getAccounts();
    const MyNFT = await ethers.getContractFactory('MyNFT', minter);
    const myNFT = await MyNFT.deploy();
    await myNFT.deployed();

    return myNFT;
  }

  async function deployNFTAndMint() {
    const { owner } = await getAccounts();
    const byMinter = await deployNFTContract();

    const mintTx = await byMinter.mintNFT(owner.address, 'uri_1').then(o => o.wait());
    const transferEvent = mintTx.events!.find(o => o.event === 'Transfer')!;
    const tokenId = transferEvent.args!.tokenId as BigNumber;

    expect(await byMinter.ownerOf(tokenId)).to.equal(owner.address);

    return {
      tokenId,
      byMinter,
    };
  }

  async function deploy() {
    const { byMinter: nftByMinter, tokenId } = await deployNFTAndMint();

    const { validator } = await getAccounts();
    const Bridge = await ethers.getContractFactory('Bridge', validator);
    const bridgeByValidator = await Bridge.deploy(validator.address, nftByMinter.address);
    await bridgeByValidator.deployed();

    expect(await bridgeByValidator.validator()).to.equal(validator.address);

    return { bridgeByValidator, nftByMinter, tokenId };
  }

  it('Should deploy', async () => {
    await deploy();
  });

  // todo: 0x0 validator address should fail on deploy

  describe('initSwap', () => {
    async function initSwap({ approve }: {approve: boolean}) {
      const chainId = await getChainId();
      const { owner } = await getAccounts();
      const { bridgeByValidator, nftByMinter, tokenId } = await deploy();

      const bridgeByOwner = bridgeByValidator.connect(owner);
      const nftByOwner = nftByMinter.connect(owner);

      expect(await nftByOwner.ownerOf(tokenId)).to.equal(owner.address);

      if(approve) {
        await nftByOwner.approve(bridgeByOwner.address, tokenId).then(tx => tx.wait());
      }
      const nonce = generateNonce();
      const tx = await bridgeByOwner.initSwap(tokenId, chainId, nonce).then(tx => tx.wait());

      // test SwapInited event
      const swapEv = tx.events!.find(ev => ev.event === 'SwapInited')!;
      assert(swapEv, 'SwapInited event not found');
      expect(swapEv.args!.sender).to.equal(owner.address);
      assert(swapEv.args!.tokenId.eq(tokenId));
      assert(swapEv.args!.chainFrom.eq(chainId));
      assert(swapEv.args!.chainTo.eq(chainId));
      assert(swapEv.args!.nonce.eq(nonce));

      // ownership transfered to Bridge contract
      expect(await nftByOwner.ownerOf(tokenId)).to.equal(bridgeByOwner.address);
    }

    it('Should init swap', async () => {
      await initSwap({approve: true});
    });

    it('Should fail because no approve from owner', async () => {
      await initSwap({approve: false}).should.be.rejectedWith('ERC721: transfer caller is not owner nor approved');
    });

    it('Should fail on double call with same arguments with hash error', async () => {
      const nonce = generateNonce();
      const chainId = await getChainId();
      const { owner } = await getAccounts();
      const { bridgeByValidator, nftByMinter, tokenId } = await deploy();

      const bridgeByOwner = bridgeByValidator.connect(owner);
      const nftByOwner = nftByMinter.connect(owner);

      await nftByOwner.approve(bridgeByOwner.address, tokenId).then(tx => tx.wait());

      await bridgeByOwner.initSwap(tokenId, chainId, nonce);
      await bridgeByOwner.initSwap(tokenId, chainId, nonce).should.be.rejectedWith('Duplicate hash');
    });

    // todo: should fail if try init second swap with different nonce with nft transfer error
  });

  describe('redeemSwap', () => {
    async function redeemSwap({ sendNFT, validNonce, redeemOnce }: { sendNFT: boolean, validNonce: boolean, redeemOnce: boolean }) {
      const nonce = generateNonce();

      const { owner, validator, validatorWallet } = await getAccounts();
      expect(validatorWallet.address).to.equal(validator.address);

      const chainId = await getChainId();
      const { bridgeByValidator, nftByMinter, tokenId } = await deploy();

      const bridgeByOwner = bridgeByValidator.connect(owner);
      const nftByOwner = nftByMinter.connect(owner);

      if(sendNFT) {
        // send NFT to Bridge
        await nftByOwner["safeTransferFrom(address,address,uint256)"](owner.address, bridgeByValidator.address, tokenId)
          .then(tx => tx.wait());
        expect(await nftByOwner.ownerOf(tokenId)).to.equal(bridgeByOwner.address);
      }


      // try redeem swap
      const types = [
        'address', 'uint256', 'uint256', 'uint256', 'uint256',
      ];
      const values = [
        owner.address, tokenId, chainId, chainId, nonce
      ];

      const hash = ethers.utils.solidityKeccak256(types, values);
      const sign = await validatorWallet.signMessage(ethers.utils.arrayify(hash));
      const { v, r, s } = ethers.utils.splitSignature(sign);

      const tx = await bridgeByOwner.redeemSwap(tokenId, chainId, validNonce ? nonce : nonce.add(1), v, r, s).then(tx => tx.wait());
      if(!redeemOnce) {
        await bridgeByOwner.redeemSwap(tokenId, chainId, nonce, v, r, s).then(tx => tx.wait());
      }

      // testing SwapRedeemed event
      const ev = tx.events!.find(ev => ev.event === 'SwapRedeemed')!;
      assert(ev, 'SwapRedeemed event not found');
      expect(ev.args!.sender).to.equal(owner.address);
      assert(ev.args!.tokenId.eq(tokenId));
      assert(ev.args!.chainFrom.eq(chainId));
      assert(ev.args!.chainTo.eq(chainId));
      assert(ev.args!.nonce.eq(nonce));

      // NFT must return back
      expect(await nftByOwner.ownerOf(tokenId)).to.equal(owner.address);
    }

    it('Should redeem swap', async () => {
      await redeemSwap({sendNFT: true, validNonce: true, redeemOnce: true});
    });

    it('Should fail on double redeem', async () => {
      await redeemSwap({sendNFT: true, validNonce: true, redeemOnce: false}).should.be.rejectedWith('Already redeemed');
    });

    it('Should fail redeem if no NFT on Bridge', async () => {
      await redeemSwap({sendNFT: false, validNonce: true, redeemOnce: true}).should.be.rejectedWith('ERC721: transfer caller is not owner nor approved');
    });

    it('Should fail hash validation if use different nonce', async () => {
      await redeemSwap({sendNFT: true, validNonce: false, redeemOnce: true}).should.be.rejectedWith('Invalid validator signature');
    });

    // todo: different .sender/tokenId/chainFrom/signature
  });


  it('Should swap 2 full cycle on same network', async () => {
    const chainId = await getChainId();
    const { owner, validatorWallet } = await getAccounts();
    const { bridgeByValidator, nftByMinter, tokenId } = await deploy();

    const bridgeByOwner = bridgeByValidator.connect(owner);
    const nftByOwner = nftByMinter.connect(owner);

    async function signByValidator(sender: string, nonce: BigNumber) {
      const hash = ethers.utils.solidityKeccak256([
        'address', 'uint256', 'uint256', 'uint256', 'uint256',
      ], [
        sender, tokenId, chainId, chainId, nonce
      ]);
      const sign = await validatorWallet.signMessage(ethers.utils.arrayify(hash));
      return ethers.utils.splitSignature(sign);
    }

    // source -> target -> source -> target -> source
    for(let i = 0; i < 4; i++) {
      const nonce = generateNonce();
      await nftByOwner.approve(bridgeByValidator.address, tokenId).then(tx => tx.wait());
      await bridgeByOwner.initSwap(tokenId, chainId, nonce).then(tx => tx.wait());
      expect(await nftByOwner.ownerOf(tokenId)).to.equal(bridgeByOwner.address);

      const { v, r, s } = await signByValidator(owner.address, nonce);
      await bridgeByOwner.redeemSwap(tokenId, chainId, nonce, v, r, s).then(tx => tx.wait());
      expect(await nftByOwner.ownerOf(tokenId)).to.equal(owner.address);
    }
  });
});
