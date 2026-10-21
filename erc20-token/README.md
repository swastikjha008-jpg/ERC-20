# ERC-20 Token (Hardhat)

A minimal, dependency-free ERC-20 token written in Solidity 0.8.26, with a full Hardhat test suite, deploy script and GitHub Actions CI.

## Features

- Standard ERC-20: `transfer`, `approve`, `transferFrom`, `balanceOf`, `allowance`, `totalSupply`
- `Transfer` / `Approval` events
- Custom errors (cheaper gas, clearer reverts)
- Owner-only `mint` / `mintTo`, public `burn`
- `transferOwnership`
- Infinite-allowance support (`type(uint256).max` is not decremented)

## Quick start

```bash
npm install
npm test
```

## Deploy

Local node:

```bash
npx hardhat node                # terminal 1
npm run deploy:local            # terminal 2
```

Sepolia testnet:

```bash
cp .env.example .env            # fill in RPC URL, private key, Etherscan key
npm run deploy:sepolia
```

Customize name, symbol and supply with `TOKEN_NAME`, `TOKEN_SYMBOL`, `TOKEN_INITIAL_SUPPLY` (whole tokens) in `.env`.

## Project structure

```
contracts/MyToken.sol      ERC-20 implementation
test/MyToken.test.js       Hardhat + Chai tests
scripts/deploy.js          Deploy script
hardhat.config.js          Hardhat configuration
.github/workflows/ci.yml   CI: compile + test on every push/PR
```

## Notes

- Amounts passed to `mint`, `mintTo`, `burn` and `transfer` are in base units (18 decimals). The constructor takes whole tokens and scales them.
- This contract is for learning and prototyping. Get an audit before holding real value.

## License

MIT
