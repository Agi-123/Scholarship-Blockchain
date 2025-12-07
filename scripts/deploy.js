const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // 1) Deploy SimpleMultiSig with the deployer as the only owner (required = 1)
  const owners = [deployer.address];
  const requiredConfirmations = 1;

  const MultiSigFactory = await ethers.getContractFactory("SimpleMultiSig");
  const multiSig = await MultiSigFactory.deploy(owners, requiredConfirmations);
  await multiSig.waitForDeployment();

  const multiSigAddress = await multiSig.getAddress();
  console.log("SimpleMultiSig deployed at:", multiSigAddress);

  // 2) Deploy Scholarship using the multisig as admin
  const ScholarshipFactory = await ethers.getContractFactory("Scholarship");
  const scholarship = await ScholarshipFactory.deploy(multiSigAddress);
  await scholarship.waitForDeployment();

  const scholarshipAddress = await scholarship.getAddress();
  console.log("Scholarship deployed at:", scholarshipAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
