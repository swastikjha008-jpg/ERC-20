const hre = require("hardhat");

async function main() {
  const NAME = process.env.TOKEN_NAME || "MyToken";
  const SYMBOL = process.env.TOKEN_SYMBOL || "MTK";
  const INITIAL_SUPPLY = process.env.TOKEN_INITIAL_SUPPLY || "1000000"; // whole tokens

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const MyToken = await hre.ethers.getContractFactory("MyToken");
  const token = await MyToken.deploy(NAME, SYMBOL, INITIAL_SUPPLY);
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log(`${NAME} (${SYMBOL}) deployed to: ${address}`);
  console.log(`Initial supply: ${INITIAL_SUPPLY} ${SYMBOL}`);
  console.log(
    `Verify: npx hardhat verify --network ${hre.network.name} ${address} "${NAME}" "${SYMBOL}" ${INITIAL_SUPPLY}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
