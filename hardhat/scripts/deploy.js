import pkg from "hardhat";
const { ethers, run } = pkg;

async function main() {
  console.log("Deploying AuditRegistry to Base Sepolia...");

  const AuditRegistry = await ethers.getContractFactory("AuditRegistry");
  const auditRegistry = await AuditRegistry.deploy();

  await auditRegistry.waitForDeployment();

  const address = await auditRegistry.getAddress();
  console.log("AuditRegistry deployed to:", address);

  console.log("Waiting for block confirmations...");
  await auditRegistry.deploymentTransaction().wait(5);

  console.log("Verifying on Basescan...");
  await run("verify:verify", {
    address: address,
    constructorArguments: []
  });

  console.log("Verified on Basescan!");
  console.log("\nUpdate your .env:");
  console.log(`AUDIT_REGISTRY_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});