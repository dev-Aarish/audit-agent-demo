import express from "express";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import cors from "cors";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "contracts/");
  },
  filename: function (req, file, cb) {

    const uniqueName = Date.now() + ".sol";
    cb(null, uniqueName);

  }
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {

    if (path.extname(file.originalname) !== ".sol") {
      return cb(new Error("Only Solidity files allowed"));
    }

    cb(null, true);
  }
});

import { verifyPayment, getPaymentRequest } from "./payments/facinetPayment.js";
import { audit } from "./agent/auditAgent.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

/*
----------------------------------
Health check
----------------------------------
*/

app.get("/", (req, res) => {
  res.json({
    message: "AI Smart Contract Auditor API running"
  });
});

/*
----------------------------------
Audit endpoint
----------------------------------
*/
app.post("/audit", upload.single("contract"), async (req, res) => {

  try {

    const txHash = req.body.txHash;

    if (!txHash) {
      return res.status(402).json({
        error: "Payment required",
        payment: getPaymentRequest()
      });
    }

    const paid = await verifyPayment(txHash);

    if (!paid) {
      return res.status(402).json({ error: "Invalid payment" });
    }

    const contractPath = req.file.path;

    const report = await audit(contractPath);

    res.json({
      success: true,
      report
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

/*
----------------------------------
Start server
----------------------------------
*/

app.listen(PORT, () => {
  console.log(`Audit server running on port ${PORT}`);
});