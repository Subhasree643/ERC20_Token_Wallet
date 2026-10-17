const hre = require("hardhat");
const { ethers } = hre;

const fmt = (v) => ethers.formatUnits(v, 18);

async function printBalances(token, label, accounts) {
  console.log(`\n[${label}]`);
  for (const [name, addr] of accounts) {
    console.log(`  ${name.padEnd(6)} ${fmt(await token.balanceOf(addr)).padStart(14)} DLT`);
  }
}

async function main() {
  const [owner, alice, bob] = await ethers.getSigners();
  const token = await ethers.deployContract("DecodeLabsToken", ["DecodeLabs Token", "DLT", 1_000_000n]);
  await token.waitForDeployment();
  console.log("Token deployed:", await token.getAddress());
  const accounts = [["Owner", owner.address], ["Alice", alice.address], ["Bob", bob.address]];

  await printBalances(token, "Initial", accounts);

  console.log("\n--- Owner sends 1,000.5 DLT to Alice ---");
  await (await token.transfer(alice.address, ethers.parseUnits("1000.5", 18))).wait();
  await printBalances(token, "After transfer", accounts);

  console.log("\n--- Alice tries to send 2,000 DLT to Bob (more than her balance) ---");
  try {
    await token.connect(alice).transfer(bob.address, ethers.parseUnits("2000", 18));
  } catch (e) {
    console.log("  Blocked:", e.message.includes("Insufficient balance"), "(Insufficient balance)");
  }

  console.log("\n--- Alice tries to send to the zero address ---");
  try {
    await token.connect(alice).transfer(ethers.ZeroAddress, 1);
  } catch (e) {
    console.log("  Blocked:", e.message.includes("Invalid recipient"), "(Invalid recipient)");
  }

  console.log("\n--- Alice sends a zero-value transfer (valid per ERC-20) ---");
  const rc = await (await token.connect(alice).transfer(bob.address, 0)).wait();
  console.log("  Transfer event emitted:", rc.logs.length === 1);

  console.log("\n--- Double-precision trap (JS Number vs BigInt) ---");
  const raw = 9007199254740993n; // 2^53 + 1
  console.log("  Number(raw) :", Number(raw), "<- precision lost");
  console.log("  BigInt raw  :", raw.toString(), "<- exact");
  await (await token.transfer(bob.address, raw)).wait();
  console.log("  Bob's on-chain balance (raw):", (await token.balanceOf(bob.address)).toString());

  await printBalances(token, "Final", accounts);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
