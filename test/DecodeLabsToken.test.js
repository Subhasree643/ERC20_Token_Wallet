const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("DecodeLabsToken (ERC-20)", function () {
  const SUPPLY = 1_000_000n;
  const ONE = 10n ** 18n;

  async function deployFixture() {
    const [owner, alice, bob] = await ethers.getSigners();
    const token = await ethers.deployContract("DecodeLabsToken", [
      "DecodeLabs Token",
      "DLT",
      SUPPLY,
    ]);
    await token.waitForDeployment();
    return { token, owner, alice, bob };
  }

  describe("Deployment", function () {
    it("sets metadata and mints the full supply to the deployer", async function () {
      const { token, owner } = await loadFixture(deployFixture);
      expect(await token.name()).to.equal("DecodeLabs Token");
      expect(await token.symbol()).to.equal("DLT");
      expect(await token.decimals()).to.equal(18);
      expect(await token.totalSupply()).to.equal(SUPPLY * ONE);
      expect(await token.balanceOf(owner.address)).to.equal(SUPPLY * ONE);
    });
  });

  describe("transfer / balanceOf", function () {
    it("moves tokens and emits Transfer", async function () {
      const { token, owner, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("250.5", 18);
      await expect(token.transfer(alice.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, alice.address, amount);
      expect(await token.balanceOf(alice.address)).to.equal(amount);
      expect(await token.balanceOf(owner.address)).to.equal(SUPPLY * ONE - amount);
    });

    it("allows transferring the exact full balance", async function () {
      const { token, owner, alice, bob } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("10", 18);
      await token.transfer(alice.address, amount);
      await token.connect(alice).transfer(bob.address, amount);
      expect(await token.balanceOf(alice.address)).to.equal(0);
      expect(await token.balanceOf(bob.address)).to.equal(amount);
    });

    it("reverts when amount exceeds balance (overdraft)", async function () {
      const { token, alice, bob } = await loadFixture(deployFixture);
      await token.transfer(alice.address, ethers.parseUnits("5", 18));
      await expect(
        token.connect(alice).transfer(bob.address, ethers.parseUnits("5.000000000000000001", 18))
      ).to.be.revertedWith("Insufficient balance");
      // an account with zero balance can't send anything
      await expect(token.connect(bob).transfer(alice.address, 1)).to.be.revertedWith(
        "Insufficient balance"
      );
    });

    it("reverts when sending to the zero address", async function () {
      const { token } = await loadFixture(deployFixture);
      await expect(token.transfer(ethers.ZeroAddress, 1)).to.be.revertedWith("Invalid recipient");
    });

    it("treats a zero-value transfer as valid and emits the event", async function () {
      const { token, owner, alice } = await loadFixture(deployFixture);
      await expect(token.transfer(alice.address, 0))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, alice.address, 0);
      expect(await token.balanceOf(alice.address)).to.equal(0);
    });

    it("keeps balance unchanged on self-transfer", async function () {
      const { token, owner } = await loadFixture(deployFixture);
      const before = await token.balanceOf(owner.address);
      await token.transfer(owner.address, ethers.parseUnits("1", 18));
      expect(await token.balanceOf(owner.address)).to.equal(before);
    });

    it("preserves exact precision (1 wei and values beyond 2^53)", async function () {
      const { token, alice } = await loadFixture(deployFixture);
      const huge = 9_007_199_254_740_993n; // 2^53 + 1: JS Number cannot represent this exactly
      expect(Number(huge) === Number(huge - 1n)).to.equal(true); // the double-precision trap
      await token.transfer(alice.address, huge);
      expect(await token.balanceOf(alice.address)).to.equal(huge); // BigInt keeps it exact
      await token.transfer(alice.address, 1n);
      expect(await token.balanceOf(alice.address)).to.equal(huge + 1n);
    });
  });

  describe("approve / transferFrom", function () {
    it("approve sets allowance and emits Approval", async function () {
      const { token, owner, alice } = await loadFixture(deployFixture);
      await expect(token.approve(alice.address, 500))
        .to.emit(token, "Approval")
        .withArgs(owner.address, alice.address, 500);
      expect(await token.allowance(owner.address, alice.address)).to.equal(500);
    });

    it("transferFrom spends allowance and moves tokens", async function () {
      const { token, owner, alice, bob } = await loadFixture(deployFixture);
      await token.approve(alice.address, 500);
      await token.connect(alice).transferFrom(owner.address, bob.address, 200);
      expect(await token.balanceOf(bob.address)).to.equal(200);
      expect(await token.allowance(owner.address, alice.address)).to.equal(300);
    });

    it("transferFrom reverts when amount exceeds allowance", async function () {
      const { token, owner, alice, bob } = await loadFixture(deployFixture);
      await token.approve(alice.address, 100);
      await expect(
        token.connect(alice).transferFrom(owner.address, bob.address, 101)
      ).to.be.revertedWith("Insufficient allowance");
    });

    it("transferFrom reverts when owner balance is too low", async function () {
      const { token, alice, bob } = await loadFixture(deployFixture);
      await token.connect(bob).approve(alice.address, 100); // bob has no tokens
      await expect(
        token.connect(alice).transferFrom(bob.address, alice.address, 1)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("does not decrease an unlimited (max uint256) allowance", async function () {
      const { token, owner, alice, bob } = await loadFixture(deployFixture);
      await token.approve(alice.address, ethers.MaxUint256);
      await token.connect(alice).transferFrom(owner.address, bob.address, 1000);
      expect(await token.allowance(owner.address, alice.address)).to.equal(ethers.MaxUint256);
    });
  });
});
