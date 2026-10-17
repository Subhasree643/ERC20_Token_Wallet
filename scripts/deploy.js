const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const token = await hre.ethers.deployContract("DecodeLabsToken", [
    "DecodeLabs Token",
    "DLT",
    1_000_000n, // whole tokens; scaled by 10**18 inside the constructor
  ]);
  await token.waitForDeployment();
  console.log("DecodeLabsToken deployed to:", await token.getAddress());
  console.log("Deployer (holds full supply):", deployer.address);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
