import express from "express";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// 1. Storage Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "contracts/";
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// 2. Logic Imports
import { verifyPayment, getPaymentRequest, calculatePrice } from "./payments/facinetPayment.js";
import { build402Response } from "./payments/x402.js";
import { audit } from "./agent/auditAgent.js";
import { uploadAuditToIPFS } from "./blockchain/ipfsUploader.js";
import { storeAuditOnChain } from "./blockchain/registryWriter.js";

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "frontend")));

const PORT = process.env.PORT || 8000;

/* --- Internal Payment (Server Pays Fee) --- */
app.post("/pay", async (req, res) => {
    try {
        const { amount } = req.body;
        const { Facinet } = await import("facinet");

        if (!process.env.PAYER_PRIVATE_KEY) throw new Error("PAYER_PRIVATE_KEY missing in .env");

        const facinet = new Facinet({
            privateKey: process.env.PAYER_PRIVATE_KEY,
            network: process.env.NETWORK || "base-sepolia"
        });

        const paymentResult = await facinet.pay({
            amount: amount || "1.00",
            recipient: process.env.RECEIVING_WALLET
        });

        console.log(`[PAYMENT] Sponsored Success: ${amount} USDC`);
        res.json(paymentResult);
    } catch (err) {
        console.error("PAYMENT FAIL:", err.message);
        res.status(500).json({ error: err.message });
    }
});

/* --- Audit Endpoint --- */
app.post("/audit", upload.single("contract"), async (req, res) => {
    let contractPath = req.file ? req.file.path : null;

    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const content = fs.readFileSync(contractPath, "utf8");
        const lineCount = content.split("\n").filter(l => l.trim() !== "").length;
        const requiredAmount = calculatePrice(lineCount);

        const paymentHeader = req.headers["x-payment"];

        if (!paymentHeader) {
            const paymentRequest = getPaymentRequest(requiredAmount);
            return res.status(402)
                .header("Payment-Required", build402Response(paymentRequest))
                .json({ error: "Payment required", amount: requiredAmount, lineCount });
        }

        const paymentData = JSON.parse(Buffer.from(paymentHeader, "base64").toString("utf8"));
        const isPaid = await verifyPayment(paymentData, requiredAmount);
        if (!isPaid) return res.status(402).json({ error: "Payment verification failed." });

        // Audit & Storage
        const report = await audit(contractPath);
        const ipfsCid = await uploadAuditToIPFS(contractPath, report, paymentData);
        const chainResult = await storeAuditOnChain(req.file.originalname, report.securityScore, ipfsCid);

        res.json({
            success: true,
            report,
            ipfs: { url: `${process.env.PINATA_GATEWAY}/ipfs/${ipfsCid}` },
            blockchain: { 
                txHash: chainResult.txHash, 
                explorerUrl: `https://sepolia.basescan.org/tx/${chainResult.txHash}` 
            },
            stats: { lineCount, amountPaid: requiredAmount }
        });

    } catch (err) {
        console.error("AUDIT ERROR:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        if (contractPath && fs.existsSync(contractPath)) fs.unlinkSync(contractPath);
    }
});

app.listen(PORT, () => console.log(`🚀 Auditor running on http://localhost:${PORT}`));