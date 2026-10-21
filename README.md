# 🪙 ERC-20 Token

A minimal, dependency-free **ERC-20 token** written in Solidity, with a full Hardhat test suite, a deploy script and GitHub Actions CI.

![Solidity](https://img.shields.io/badge/Solidity-0.8.26-363636?style=for-the-badge&logo=solidity&logoColor=white)
![Hardhat](https://img.shields.io/badge/Hardhat-2.x-FFF100?style=for-the-badge&logoColor=black)
![Ethereum](https://img.shields.io/badge/Ethereum-ERC--20-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white)
![Ethers.js](https://img.shields.io/badge/Ethers.js-v6-2535A0?style=for-the-badge&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Mocha](https://img.shields.io/badge/Tests-Mocha%20%2B%20Chai-8D6748?style=for-the-badge&logo=mocha&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 📑 Table of Contents

- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [How the Code Works](#-how-the-code-works)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Security Notes](#-security-notes)
- [License](#-license)

---

## 🧰 Tech Stack

| Tag | Purpose |
|---|---|
| **Solidity 0.8.26** | Smart contract language (built-in overflow checks) |
| **Hardhat** | Compile, test, deploy and verify contracts |
| **Ethers.js v6** | Talk to the blockchain from tests and scripts |
| **Mocha + Chai** | Test runner and assertions |
| **Node.js 20** | Runtime for tooling |
| **GitHub Actions** | CI: compile and test on every push and PR |

---

## ✨ Features

- Standard ERC-20 interface: `transfer`, `approve`, `transferFrom`, `balanceOf`, `allowance`, `totalSupply`
- `Transfer` and `Approval` events
- Custom errors (cheaper gas, clearer reverts than `require` strings)
- Owner-only `mint` / `mintTo`, public `burn`
- `transferOwnership`
- Infinite-allowance support (`type(uint256).max` is never decremented)

---

## 🚀 Quick Start

```bash
# 1. install dependencies
npm install

# 2. compile the contract
npx hardhat compile

# 3. run the test suite
npm test
```

---

## 🧠 How the Code Works

Everything lives in `contracts/MyToken.sol`. Each box below is a copyable snippet followed by what it does.

### 1. State: who owns what

```solidity
string public name;
string public symbol;
uint8 public constant decimals = 18;

address public owner;
uint256 public totalSupply;

mapping(address => uint256) public balanceOf;
mapping(address => mapping(address => uint256)) public allowance;
```

- `name`, `symbol` and `decimals` are the token's metadata. 18 decimals means 1 token = `10^18` base units, like ETH and wei.
- `balanceOf` maps each address to how many base units it holds.
- `allowance[owner][spender]` is how much `spender` is permitted to move on behalf of `owner`.
- `public` makes Solidity auto-generate a getter for each, so wallets and explorers can read them.

### 2. Constructor: create the token

```solidity
constructor(string memory _name, string memory _symbol, uint256 initialSupply) {
    name = _name;
    symbol = _symbol;
    owner = msg.sender;
    emit OwnershipTransferred(address(0), msg.sender);

    if (initialSupply > 0) {
        _mint(msg.sender, initialSupply * 10 ** decimals);
    }
}
```

- Runs once, at deployment.
- The deployer (`msg.sender`) becomes the `owner`.
- `initialSupply` is in whole tokens; it is multiplied by `10 ** decimals` so `1000000` becomes 1,000,000 tokens with 18 decimals.
- The full supply is minted to the deployer.

### 3. `transfer`: send tokens

```solidity
function transfer(address to, uint256 value) external returns (bool) {
    _transfer(msg.sender, to, value);
    return true;
}

function _transfer(address from, address to, uint256 value) internal {
    if (to == address(0)) revert ZeroAddress();
    uint256 bal = balanceOf[from];
    if (bal < value) revert InsufficientBalance(bal, value);
    unchecked {
        balanceOf[from] = bal - value;
        balanceOf[to] += value;
    }
    emit Transfer(from, to, value);
}
```

- Moves `value` base units from the caller to `to`.
- Reverts if sending to the zero address (tokens would be lost) or if the balance is too low.
- `unchecked` skips redundant overflow checks, because the balance check above already guarantees no underflow, which saves gas.
- Emits `Transfer` so wallets and explorers can track it.

### 4. `approve` and `transferFrom`: let someone else spend

```solidity
function approve(address spender, uint256 value) external returns (bool) {
    if (spender == address(0)) revert ZeroAddress();
    allowance[msg.sender][spender] = value;
    emit Approval(msg.sender, spender, value);
    return true;
}

function transferFrom(address from, address to, uint256 value) external returns (bool) {
    uint256 allowed = allowance[from][msg.sender];
    if (allowed != type(uint256).max) {
        if (allowed < value) revert InsufficientAllowance(allowed, value);
        unchecked {
            allowance[from][msg.sender] = allowed - value;
        }
        emit Approval(from, msg.sender, allowance[from][msg.sender]);
    }
    _transfer(from, to, value);
    return true;
}
```

- `approve` says "I allow `spender` to move up to `value` of my tokens." This is what DEXes and dApps ask you to sign.
- `transferFrom` is how the approved spender actually moves the tokens. It checks the allowance, reduces it, then runs the same `_transfer`.
- If the allowance is `type(uint256).max` ("infinite approval"), it is left untouched to save gas.

### 5. `mint`, `burn` and ownership

```solidity
modifier onlyOwner() {
    if (msg.sender != owner) revert NotOwner();
    _;
}

function mint(uint256 amount) external onlyOwner {
    _mint(msg.sender, amount);
}

function mintTo(address to, uint256 amount) external onlyOwner {
    _mint(to, amount);
}

function burn(uint256 amount) external {
    uint256 bal = balanceOf[msg.sender];
    if (bal < amount) revert InsufficientBalance(bal, amount);
    unchecked {
        balanceOf[msg.sender] = bal - amount;
        totalSupply -= amount;
    }
    emit Transfer(msg.sender, address(0), amount);
}
```

- `onlyOwner` is a guard: only the owner can create new tokens.
- `mint` creates tokens for the owner; `mintTo` creates them for any address. Both increase `totalSupply`.
- `burn` destroys the caller's own tokens and lowers `totalSupply`. Anyone can burn their own balance.
- Mints and burns emit `Transfer` from or to the zero address, which is the ERC-20 convention.

---

## 🧪 Testing

Tests live in `test/MyToken.test.js` and use Hardhat's in-memory blockchain, so no network or ETH is needed.

```js
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
```

- First test: sends 100 units, checks the `Transfer` event arguments and the receiver's new balance.
- Second test: Alice has no tokens, so the transfer must revert with the exact custom error and values.
- `connect(alice)` makes the next call come from Alice instead of the deployer.
- `100n` is a JavaScript BigInt; Ethers v6 uses BigInt for all on-chain numbers.

Run everything:

```bash
npm test
```

The suite covers 15 cases: metadata, supply, transfers, approvals, allowance spending, infinite allowance, mint permissions, burn and ownership changes.

---

## 🌐 Deployment

### What the deploy script does

```js
const MyToken = await hre.ethers.getContractFactory("MyToken");
const token = await MyToken.deploy(NAME, SYMBOL, INITIAL_SUPPLY);
await token.waitForDeployment();
console.log(`deployed to: ${await token.getAddress()}`);
```

- `getContractFactory` loads the compiled contract.
- `deploy(...)` sends the deployment transaction with your name, symbol and supply.
- `waitForDeployment()` waits until it is mined, then the address is printed.

### Local node

```bash
npx hardhat node          # terminal 1: starts a local chain
npm run deploy:local      # terminal 2: deploys to it
```

### Sepolia testnet

```bash
cp .env.example .env      # then fill in the values below
npm run deploy:sepolia
```

`.env`:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_wallet_private_key_without_0x
ETHERSCAN_API_KEY=your_etherscan_key

# optional overrides
TOKEN_NAME=MyToken
TOKEN_SYMBOL=MTK
TOKEN_INITIAL_SUPPLY=1000000
```

### Verify on Etherscan

```bash
npx hardhat verify --network sepolia <DEPLOYED_ADDRESS> "MyToken" "MTK" 1000000
```

### Try it in Remix

Paste `contracts/MyToken.sol` into [Remix](https://remix.ethereum.org), compile with 0.8.26 and deploy with constructor args `"MyToken", "MTK", 1000000`.

---

## 📁 Project Structure

```
erc20-token/
├── contracts/
│   └── MyToken.sol          # ERC-20 implementation
├── test/
│   └── MyToken.test.js      # Mocha + Chai tests
├── scripts/
│   └── deploy.js            # deployment script
├── .github/workflows/
│   └── ci.yml               # CI: compile + test on push/PR
├── hardhat.config.js        # compiler, networks, Etherscan
├── .env.example             # template for secrets
├── package.json
└── LICENSE
```

---

## 🔒 Security Notes

- Never commit `.env` or share your private key. It is already in `.gitignore`.
- Use a throwaway wallet for testnets.
- This contract is for learning and prototyping. Get an audit before holding real value.
- The owner can mint without limit; remove `mint`/`mintTo` or renounce ownership if you want a fixed supply.

---

## 📄 License

[MIT](LICENSE) © 2026 Swastik
