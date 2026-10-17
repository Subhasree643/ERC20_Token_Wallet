# ERC-20 Token Wallet & Value Transfer (Solidity + Hardhat + ethers v6)

DecodeLabs Blockchain Internship – Project 3.
A from-scratch ERC-20 token with secure transfer logic and real-time balance validation, plus a MetaMask web wallet and a CLI that validate user input securely.

## Features
- Standard ERC-20: `name`, `symbol`, `decimals (18)`, `totalSupply`, `balanceOf`, `transfer`, `approve`, `allowance`, `transferFrom`, `Transfer` / `Approval` events
- Checks-Effects pattern in `_transfer`: blocks overdrafts (`Insufficient balance`) and zero-address recipients
- Zero-value transfers treated as valid and emit the event (per the standard)
- Solidity ≥ 0.8 built-in overflow/underflow protection
- Double-precision safety: amounts handled as `BigInt` / `parseUnits` – never JS `Number`
- Web wallet (`frontend/index.html`) and CLI (`scripts/transfer.js`) validate address + amount before sending

## Tech Stack
Solidity 0.8.20 · Hardhat · Ethers v6 · Chai/Mocha · MetaMask

## Quick Start
```bash
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/demo.js
```

## Run the wallet UI locally
```bash
npx hardhat node                                   # terminal 1 (local chain, chainId 31337)
npx hardhat run scripts/deploy.js --network localhost   # terminal 2 -> copy token address
```
1. In MetaMask add network: RPC `http://127.0.0.1:8545`, Chain ID `31337`; import a private key printed by `hardhat node`.
2. Open `frontend/index.html` in the browser (or `npx serve frontend`).
3. Connect wallet → paste token address → Load token → enter recipient + amount → Send.

## CLI transfer
```bash
TOKEN_ADDRESS=0x... TO=0x... AMOUNT=12.5 npx hardhat run scripts/transfer.js --network localhost
```
(On Windows CMD: `set TOKEN_ADDRESS=0x...` etc., then run the command.)

## Deploy to Sepolia (optional)
```bash
cp .env.example .env   # fill SEPOLIA_RPC_URL and PRIVATE_KEY (testnet-only wallet!)
npx hardhat run scripts/deploy.js --network sepolia
```

## Project Structure
```
contracts/DecodeLabsToken.sol   ERC-20 implementation
scripts/                        deploy, demo, transfer (CLI)
frontend/index.html             MetaMask wallet UI
test/DecodeLabsToken.test.js    unit tests
```

## IPO Architecture (Input → Process → Output)
- **Input:** address regex/`isAddress`, non-negative decimal amount, `parseUnits` scaling
- **Process:** contract `_transfer` – recipient check, balance check, state update
- **Output:** `Transfer` event, UI balance refresh via `balanceOf`

## Security Notes
- Never store real private keys in `.env` committed to Git (`.gitignore` already excludes it)
- Use a testnet-only wallet
- `unchecked` subtraction only after an explicit balance check

## Future Improvements
Gas-fee estimator, transaction history log (from `Transfer` events), minting/burning with access control, permit (EIP-2612).

## License
MIT
