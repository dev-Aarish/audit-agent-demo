import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// RPC connection to Base Sepolia
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS;
const AUDIT_PRICE = process.env.AUDIT_PRICE || "0.001";

// prevent reusing the same payment
const usedTransactions = new Set();

/*
--------------------------------
Return payment instructions
--------------------------------
*/

export function getPaymentRequest() {
  return {
    amount: AUDIT_PRICE,
    recipient: MERCHANT_ADDRESS,
    network: "sepolia"
  };
}

/*
--------------------------------
Verify payment transaction
--------------------------------
*/

export async function verifyPayment(txHash) {

  try {

    // prevent double use
    if (usedTransactions.has(txHash)) {
      console.log("Transaction already used");
      return false;
    }

    // fetch transaction
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!tx || !receipt) {
      console.log("Transaction not found");
      return false;
    }

    // check transaction success
    if (receipt.status !== 1) {
      console.log("Transaction failed");
      return false;
    }

    // check receiver address
    if (tx.to.toLowerCase() !== MERCHANT_ADDRESS.toLowerCase()) {
      console.log("Wrong recipient");
      return false;
    }

    // check payment amount
    const paidAmount = ethers.formatEther(tx.value);

    if (Number(paidAmount) < Number(AUDIT_PRICE)) {
      console.log("Insufficient payment");
      return false;
    }

    // mark transaction as used
    usedTransactions.add(txHash);

    console.log("Payment verified:", txHash);

    return true;

  } catch (error) {

    console.error("Payment verification failed:", error);
    return false;

  }

}