const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken", function () {
  const SUPPLY = 1000n;
  const UNIT = 10n ** 18n;
  let token, owner, alice, bob;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    const MyToken = await ethers.getContractFactory("MyToken");
    token = await MyToken.deploy("MyToken", "MTK", SUPPLY);
    await token.waitForDeployment();
  });

  describe("deployment", () => {
    it("sets metadata", async () => {
      expect(await token.name()).to.equal("MyToken");
      expect(await token.symbol()).to.equal("MTK");
      expect(await token.decimals()).to.equal(18n);
    });

    it("assigns owner and initial supply", async () => {
      expect(await token.owner()).to.equal(owner.address);
      expect(await token.totalSupply()).to.equal(SUPPLY * UNIT);
      expect(await token.balanceOf(owner.address)).to.equal(SUPPLY * UNIT);
    });
  });

  describe("transfer", () => {
    it("moves tokens and emits Transfer", async () => {
      await expect(token.transfer(alice.address, 100n))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, alice.address, 100n);
      expect(await token.balanceOf(alice.address)).to.equal(100n);
    });

    it("reverts on insufficient balance", async () => {
      await expect(token.connect(alice).transfer(bob.address, 1n))
        .to.be.revertedWithCustomError(token, "InsufficientBalance")
        .withArgs(0n, 1n);
    });

    it("reverts on zero address", async () => {
      await expect(token.transfer(ethers.ZeroAddress, 1n)).to.be.revertedWithCustomError(
        token,
        "ZeroAddress"
      );
    });
  });

  describe("approve / transferFrom", () => {
    it("sets allowance and emits Approval", async () => {
      await expect(token.approve(alice.address, 50n))
        .to.emit(token, "Approval")
        .withArgs(owner.address, alice.address, 50n);
      expect(await token.allowance(owner.address, alice.address)).to.equal(50n);
    });

    it("spends allowance on transferFrom", async () => {
      await token.approve(alice.address, 50n);
      await token.connect(alice).transferFrom(owner.address, bob.address, 30n);
      expect(await token.balanceOf(bob.address)).to.equal(30n);
      expect(await token.allowance(owner.address, alice.address)).to.equal(20n);
    });

    it("reverts when allowance too low", async () => {
      await token.approve(alice.address, 10n);
      await expect(token.connect(alice).transferFrom(owner.address, bob.address, 11n))
        .to.be.revertedWithCustomError(token, "InsufficientAllowance")
        .withArgs(10n, 11n);
    });

    it("does not decrease an infinite allowance", async () => {
      await token.approve(alice.address, ethers.MaxUint256);
      await token.connect(alice).transferFrom(owner.address, bob.address, 5n);
      expect(await token.allowance(owner.address, alice.address)).to.equal(ethers.MaxUint256);
    });
  });

  describe("mint", () => {
    it("owner can mint to self and others", async () => {
      await token.mint(100n);
      await token.mintTo(alice.address, 50n);
      expect(await token.balanceOf(alice.address)).to.equal(50n);
      expect(await token.totalSupply()).to.equal(SUPPLY * UNIT + 150n);
    });

    it("non-owner cannot mint", async () => {
      await expect(token.connect(alice).mint(1n)).to.be.revertedWithCustomError(token, "NotOwner");
      await expect(token.connect(alice).mintTo(alice.address, 1n)).to.be.revertedWithCustomError(
        token,
        "NotOwner"
      );
    });
  });

  describe("burn", () => {
    it("burns from caller and reduces supply", async () => {
      await token.burn(100n);
      expect(await token.totalSupply()).to.equal(SUPPLY * UNIT - 100n);
    });

    it("reverts when burning more than balance", async () => {
      await expect(token.connect(alice).burn(1n)).to.be.revertedWithCustomError(
        token,
        "InsufficientBalance"
      );
    });
  });

  describe("ownership", () => {
    it("transfers ownership", async () => {
      await expect(token.transferOwnership(alice.address))
        .to.emit(token, "OwnershipTransferred")
        .withArgs(owner.address, alice.address);
      expect(await token.owner()).to.equal(alice.address);
    });

    it("rejects non-owner and zero address", async () => {
      await expect(token.connect(alice).transferOwnership(alice.address)).to.be.revertedWithCustomError(
        token,
        "NotOwner"
      );
      await expect(token.transferOwnership(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        token,
        "ZeroAddress"
      );
    });
  });
});
