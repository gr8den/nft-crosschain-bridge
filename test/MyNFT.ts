import { BigNumber } from "@ethersproject/bignumber";
import chaiAsPromised from "chai-as-promised";
import chai, { assert, expect } from "chai";
import { ethers } from "hardhat";

chai.use(chaiAsPromised);
chai.should();

describe('NFT Contract', () => {
  async function getAccounts() {
    const signers = await ethers.getSigners();

    return {
      minter: signers[0],
      owner: signers[1],
      approved: signers[2],
      receiver: signers[3],
    };
  }

  async function deploy() {
    const { minter } = await getAccounts();
    const MyNFT = await ethers.getContractFactory("MyNFT", minter);
    const myNFT = await MyNFT.deploy();
    await myNFT.deployed();

    return myNFT;
  }

  it("Should deploy", async function () {
    await deploy();
  });


  async function deployAndMint() {
    const { owner } = await getAccounts();
    const byMinter = await deploy();

    const mintTx = await byMinter.mintNFT(owner.address, 'uri_1').then(o => o.wait());
    const transferEv = mintTx.events!.find(o => o.event === 'Transfer')!;
    assert(transferEv, 'Transfer event not found');
    const tokenId = transferEv.args!.tokenId as BigNumber;

    expect(await byMinter.ownerOf(tokenId)).to.equal(owner.address);

    return {
      tokenId,
      byMinter,
    };
  }

  it('Should mint', async () => {
    await deployAndMint();
  });


  it('Should do safe transfer by owner', async () => {
    const { owner, receiver } = await getAccounts();
    const { tokenId, byMinter } = await deployAndMint();
    const byOwner = await ethers.getContractFactory("MyNFT", owner).then(c => c.attach(byMinter.address));

    const transferTx = await byOwner["safeTransferFrom(address,address,uint256)"](owner.address, receiver.address, tokenId).then(tx => tx.wait());

    const transferEv = transferTx.events!.find(o => o.event === 'Transfer')!;
    assert(transferEv, 'Transfer event not found');
    expect(transferEv.args!.from).to.equal(owner.address);
    expect(transferEv.args!.to).to.equal(receiver.address);
    expect(await byMinter.ownerOf(tokenId)).to.equal(receiver.address);
  });

  it('Should do unsafe transfer by owner', async () => {
    const { owner, receiver } = await getAccounts();
    const { tokenId, byMinter } = await deployAndMint();
    const byOwner = await ethers.getContractFactory("MyNFT", owner).then(c => c.attach(byMinter.address));

    const transferTx = await byOwner.transferFrom(owner.address, receiver.address, tokenId).then(tx => tx.wait());

    const transferEv = transferTx.events!.find(o => o.event === 'Transfer')!;
    assert(transferEv, 'Transfer event not found');
    expect(transferEv.args!.from).to.equal(owner.address);
    expect(transferEv.args!.to).to.equal(receiver.address);
    expect(await byMinter.ownerOf(tokenId)).to.equal(receiver.address);
  });

  it('Should transfer by approved', async () => {
    const { owner, receiver, approved } = await getAccounts();
    const { tokenId, byMinter } = await deployAndMint();

    const byOwner = await ethers.getContractFactory("MyNFT", owner).then(c => c.attach(byMinter.address));
    const byApproved = await ethers.getContractFactory("MyNFT", approved).then(c => c.attach(byMinter.address));

    const approveTx = await byOwner.approve(approved.address, tokenId).then(tx => tx.wait());
    expect(await byOwner.getApproved(tokenId)).to.equal(approved.address);

    const approvalEv = approveTx.events!.find(ev => ev.event === 'Approval')!;
    assert(approvalEv, 'Approval event not found');
    expect(approvalEv.args!.owner).to.equal(owner.address);
    expect(approvalEv.args!.approved).to.equal(approved.address);

    await byApproved.transferFrom(owner.address, receiver.address, tokenId).then(tx => tx.wait());
    expect(await byMinter.ownerOf(tokenId)).to.equal(receiver.address);
  });

  it('should failed on transfer without approve', async () => {
    const { owner, receiver, approved } = await getAccounts();
    const { tokenId, byMinter } = await deployAndMint();

    const byOwner = await ethers.getContractFactory("MyNFT", owner).then(c => c.attach(byMinter.address));
    const byApproved = await ethers.getContractFactory("MyNFT", approved).then(c => c.attach(byMinter.address));

    expect(await byOwner.getApproved(tokenId)).not.equal(approved.address);

    await byApproved.transferFrom(owner.address, receiver.address, tokenId)
      .then(tx => tx.wait())
      .should.be.rejectedWith('ERC721: transfer caller is not owner nor approved');
  });

  // todo: should throw when approve by not owner
  // todo: should approve for all
  // todo: should able disable approve
  // todo: should throw when safeTransfer to wrong contract
});
