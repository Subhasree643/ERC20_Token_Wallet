// Secure CLI transfer: validates address + amount BEFORE sending anything.
// Usage:
//   TOKEN_ADDRESS=0x... TO=0x... AMOUNT=12.5 npx hardhat run scripts/transfer.js --network localhost
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const { TOKEN_ADDRESS, TO, AMOUNT } = process.env;

  // ---- INPUT: validate ----
  if (!TOKEN_ADDRESS || !ethers.isAddress(TOKEN_ADDRESS)) throw new Error("Invalid TOKEN_ADDRESS");
  if (!TO || !ethers.isAddress(TO)) throw new Error("Invalid recipient address (TO)");
  if (TO === ethers.ZeroAddress) throw new Error("Recipient cannot be the zero address");
  if (!AMOUNT || !/^\d+(\.\d+)?$/.test(AMOUNT)) {
    throw new Error("AMOUNT must be a non-negative decimal number, e.g. 12.5");
  }

  const [signer] = await ethers.getSigners();
  const token = await ethers.getContractAt("DecodeLabsToken", TOKEN_ADDRESS);
  const decimals = Number(await token.decimals());
  const symbol = await token.symbol();

  // ---- Scaling: string -> BigInt (never Number!) ----
  const amount = ethers.parseUnits(AMOUNT, decimals);
  const balance = await token.balanceOf(signer.address);
  if (amount > balance) {
    throw new Error(
      `Insufficient balance: have ${ethers.formatUnits(balance, decimals)} ${symbol}, ` +
        `trying to send ${AMOUNT}`
    );
  }

  // ---- PROCESS ----
  const tx = await token.transfer(TO, amount);
  await tx.wait();

  // ---- OUTPUT ----
  console.log(`Sent ${AMOUNT} ${symbol} to ${TO}`);
  console.log("Tx hash          :", tx.hash);
  console.log("Sender balance   :", ethers.formatUnits(await token.balanceOf(signer.address), decimals), symbol);
  console.log("Recipient balance:", ethers.formatUnits(await token.balanceOf(TO), decimals), symbol);
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exitCode = 1;
});
