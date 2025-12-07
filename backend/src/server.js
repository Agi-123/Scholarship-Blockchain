const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { ethers } = require("ethers");
const scholarshipAbi = require("../scholarshipAbi.json");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SCHOLARSHIP_ADDRESS = process.env.SCHOLARSHIP_ADDRESS;

if (!RPC_URL || !PRIVATE_KEY || !SCHOLARSHIP_ADDRESS) {
  console.warn("⚠️ Please set RPC_URL, PRIVATE_KEY and SCHOLARSHIP_ADDRESS in backend/.env");
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const scholarship = new ethers.Contract(
  SCHOLARSHIP_ADDRESS,
  scholarshipAbi,
  signer
);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/applications/:id", async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const appData = await scholarship.getApplication(id);
    res.json({
      id: appData.id.toString(),
      applicant: appData.applicant,
      studentId: appData.studentId,
      name: appData.name,
      amountRequested: appData.amountRequested.toString(),
      approved: appData.approved,
      disbursed: appData.disbursed
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch application" });
  }
});

app.post("/applications", async (req, res) => {
  try {
    const { studentId, name, amountRequested } = req.body;
    const tx = await scholarship.submitApplication(
      studentId,
      name,
      BigInt(amountRequested)
    );
    await tx.wait();
    res.json({ txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit application" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend API listening on http://localhost:${PORT}`);
});
