import React, { useState } from "react";
import { ethers } from "ethers";
import abi from "./scholarshipAbi.json";
import "./App.css";

const CONTRACT_ADDRESS = import.meta.env.VITE_SCHOLARSHIP_ADDRESS;

function App() {
  const [account, setAccount] = useState(null);

  // === NAVIGATION STATE ===
  // home | dashboard | about | services | contact | login
  const [currentPage, setCurrentPage] = useState("home");

  // === EXISTING STATES (Dashboard) ===
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [amountEth, setAmountEth] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [queryId, setQueryId] = useState("");
  const [application, setApplication] = useState(null);

  // === STATE UNTUK PANEL ERROR DETAIL ===
  const [txError, setTxError] = useState(null);

  const navItems = [
    { key: "home", label: "Home" },
    { key: "dashboard", label: "Dashboard" },
    { key: "about", label: "About Us" },
    { key: "services", label: "Services" },
    { key: "contact", label: "Contact Us" },
    { key: "login", label: "Login" },
  ];

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask");
        return;
      }
      setTxError(null);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      setStatusType("success");
      setStatus("Wallet connected");
    } catch (err) {
      console.error(err);
      setStatusType("error");

      // kalau user cancel connect di MetaMask
      if (
        err?.code === 4001 ||
        err?.info?.error?.code === 4001 ||
        (err?.message || "").toLowerCase().includes("user rejected")
      ) {
        setStatus("Koneksi wallet dibatalkan di MetaMask.");
      } else {
        setStatus("Failed to connect wallet");
      }
      setTxError(JSON.stringify(err, null, 2));
    }
  }

  async function submitApplication(e) {
    e.preventDefault();
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask");
        return;
      }

      setTxError(null); // bersihkan error lama

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      // User isi dalam ETH, convert ke wei
      const weiAmount = ethers.parseEther(amountEth || "0");

      const tx = await contract.submitApplication(studentId, name, weiAmount);
      setStatusType("info");
      setStatus("Silakan konfirmasi dan tunggu transaksi di MetaMask...");

      await tx.wait();

      setStatusType("success");
      setStatus("Application submitted! Tx: " + tx.hash);

      setStudentId("");
      setName("");
      setAmountEth("");
    } catch (err) {
      console.error(err);

      // Deteksi kasus user menolak transaksi di MetaMask
      const msg = (err?.message || "").toLowerCase();
      let friendly =
        "Failed to submit application. Silakan cek kembali dan coba lagi.";

      if (
        err?.code === 4001 ||
        err?.info?.error?.code === 4001 ||
        msg.includes("user rejected") ||
        msg.includes("user-denied")
      ) {
        friendly =
          "Transaksi dibatalkan di MetaMask (user rejected). Aplikasi TIDAK dikirim, dan saldo kamu aman.";
      }

      setStatusType("error");
      setStatus(friendly);
      setTxError(JSON.stringify(err, null, 2)); // raw JSON buat debugging
    }
  }

  async function fetchApplication() {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask");
        return;
      }
      setTxError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
      const appData = await contract.getApplication(BigInt(queryId));

      setApplication({
        id: appData.id.toString(),
        applicant: appData.applicant,
        studentId: appData.studentId,
        name: appData.name,
        amountRequested: ethers.formatEther(appData.amountRequested),
        approved: appData.approved,
        disbursed: appData.disbursed,
      });
      setStatus("");
    } catch (err) {
      console.error(err);
      setApplication(null);
      setStatusType("error");
      setStatus("Error fetching application");
      setTxError(JSON.stringify(err, null, 2));
    }
  }

  return (
    <div className="app-root">
      <div className="app-shell">
        {/* HEADER */}
        <header className="app-header">
          <div>
            <h1 className="app-title">ScholarChain</h1>
            <p className="app-subtitle">
              Decentralized Scholarship Application &amp; Funding Portal
            </p>
          </div>
          <div className="header-right">
            {CONTRACT_ADDRESS && (
              <span className="badge">
                Contract: {CONTRACT_ADDRESS.slice(0, 6)}…
                {CONTRACT_ADDRESS.slice(-4)}
              </span>
            )}
            <button className="btn-primary" onClick={connectWallet}>
              {account
                ? `Connected: ${account.slice(0, 6)}…${account.slice(-4)}`
                : "Connect Wallet"}
            </button>
          </div>
        </header>

        {/* NAVBAR */}
        <nav className="app-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={
                "nav-link" +
                (currentPage === item.key ? " nav-link-active" : "")
              }
              onClick={() => setCurrentPage(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* ====== HALAMAN HOME ====== */}
        {currentPage === "home" && (
          <main className="home-section">
            <section className="home-hero">
              <h2>Welcome to ScholarChain</h2>
              <p>
                A transparent, blockchain-based platform that helps manage
                scholarship applications and fund disbursement on-chain.
              </p>
              <button
                className="btn-primary"
                onClick={() => setCurrentPage("dashboard")}
              >
                Go to Dashboard
              </button>
            </section>

            <section className="home-highlight">
              <h3>Key Highlights</h3>
              <ul>
                <li>
                  On-chain submission &amp; tracking of scholarship applications
                </li>
                <li>Approval and disbursement via secure smart contracts</li>
                <li>Donor transparency: follow where the funds go</li>
              </ul>
            </section>
          </main>
        )}

        {/* ====== HALAMAN DASHBOARD ====== */}
        {currentPage === "dashboard" && (
          <main className="grid">
            <section className="card">
              <h2 className="card-title">Submit Scholarship Application</h2>
              <p className="card-desc">
                Fill in your student details and requested amount in ETH.
              </p>

              <form className="form" onSubmit={submitApplication}>
                <div className="form-group">
                  <label>Student ID</label>
                  <input
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    placeholder="e.g. 2602xxxxxx"
                  />
                </div>

                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your full name"
                  />
                </div>

                <div className="form-group">
                  <label>Amount Requested (ETH)</label>
                  <input
                    value={amountEth}
                    onChange={(e) => setAmountEth(e.target.value)}
                    required
                    placeholder="0.05"
                  />
                  <span className="helper-text">
                    This will be converted to wei on-chain.
                  </span>
                </div>

                <button type="submit" className="btn-primary full-width">
                  Submit Application
                </button>
              </form>
            </section>

            <section className="card">
              <h2 className="card-title">Track Application Status</h2>
              <p className="card-desc">
                Enter your application ID to see approval and disbursement
                status.
              </p>

              <div className="form-group inline">
                <div className="inline-input">
                  <label>Application ID</label>
                  <input
                    value={queryId}
                    onChange={(e) => setQueryId(e.target.value)}
                    placeholder="e.g. 1"
                  />
                </div>
                <button className="btn-secondary" onClick={fetchApplication}>
                  Fetch
                </button>
              </div>

              {application && (
                <div className="app-card">
                  <h3>Application #{application.id}</h3>
                  <p>
                    <span className="label">Applicant:</span>{" "}
                    {application.applicant}
                  </p>
                  <p>
                    <span className="label">Student ID:</span>{" "}
                    {application.studentId}
                  </p>
                  <p>
                    <span className="label">Name:</span> {application.name}
                  </p>
                  <p>
                    <span className="label">Amount Requested:</span>{" "}
                    {application.amountRequested} ETH
                  </p>
                  <div className="status-badges">
                    <span
                      className={
                        "pill " +
                        (application.approved ? "pill-green" : "pill-gray")
                      }
                    >
                      {application.approved ? "Approved" : "Pending Approval"}
                    </span>
                    <span
                      className={
                        "pill " +
                        (application.disbursed ? "pill-blue" : "pill-gray")
                      }
                    >
                      {application.disbursed ? "Disbursed" : "Not Disbursed"}
                    </span>
                  </div>
                </div>
              )}
            </section>
          </main>
        )}

        {/* ====== HALAMAN ABOUT ====== */}
        {currentPage === "about" && (
          <main className="page-section">
            <h2>About Us</h2>
            <p>
              ScholarChain is a prototype for a decentralized scholarship
              distribution system. It can be adopted by universities or
              foundations to provide more transparency and trust in scholarship
              programs.
            </p>
          </main>
        )}

        {/* ====== HALAMAN SERVICES ====== */}
        {currentPage === "services" && (
          <main className="page-section">
            <h2>Services</h2>
            <ul>
              <li>Blockchain-based scholarship application submission</li>
              <li>On-chain tracking for approval &amp; disbursement</li>
              <li>Donation / funding channel from sponsors</li>
              <li>Audit trail through smart contract events</li>
            </ul>
          </main>
        )}

        {/* ====== HALAMAN CONTACT ====== */}
        {currentPage === "contact" && (
          <main className="page-section">
            <h2>Contact Us</h2>
            <p>
              This demo can be extended for real organizations. Replace this
              section with your campus or foundation contact details.
            </p>
            <div className="form">
              <div className="form-group">
                <label>Your Name</label>
                <input placeholder="Your name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input placeholder="you@example.com" />
              </div>
              <div className="form-group">
                <label>Message</label>
                <input placeholder="Your message..." />
              </div>
              <button className="btn-primary full-width" type="button">
                Send (Mock)
              </button>
              <span className="helper-text">
                This is a mock form for UI demo only.
              </span>
            </div>
          </main>
        )}

        {/* ====== HALAMAN LOGIN ====== */}
        {currentPage === "login" && (
          <main className="page-section">
            <h2>Login</h2>
            <p>
              ScholarChain menggunakan wallet Web3 sebagai identitas. Klik{" "}
              <b>Connect Wallet</b> di pojok kanan atas untuk login.
            </p>
            <p>
              Untuk akses admin (approve / disburse), gunakan wallet admin /
              multisig yang sudah diset di smart contract.
            </p>
          </main>
        )}

        {/* STATUS BAR SINGKAT */}
        {status && (
          <div className={`status-bar status-${statusType}`}>{status}</div>
        )}

        {/* PANEL ERROR DETAIL (JSON dari ethers) */}
        {txError && (
          <div className="error-panel">
            <div className="error-panel-header">
              <span className="error-dot" />
              <span className="error-title">
                Detail Error (untuk debugging / laporan dosen)
              </span>
              <button
                type="button"
                className="error-close"
                onClick={() => setTxError(null)}
              >
                ×
              </button>
            </div>
            <pre className="error-panel-body">{txError}</pre>
          </div>
        )}

        <footer className="app-footer">
          Built for scholarship transparency · Powered by Ethereum &amp; Hardhat
        </footer>
      </div>
    </div>
  );
}

export default App;
