# 📜 Certificate Verification Portal (`cert_veri`)
### **Directorate General of Mines Safety (DGMS) — Digital Accreditation & Verification System**

---

## 🌐 Live Public URL

> 🔗 **Production Web Portal**: [https://cert-veri.web.app/](https://cert-veri.web.app/)
>
> ⚡ **Status**: 🟢 Live & Deployed on Firebase Hosting

---

## 📌 Executive Summary

**`cert_veri`** is a high-security, web-based and CLI-enabled cryptographic verification portal built for the **Directorate General of Mines Safety (DGMS), Government of India**. 

The system provides mine inspectors, safety officers, and field supervisors with a tamper-evident mechanism to instantly verify digital certificates issued for industrial mining safety training (e.g., Fire & Explosion Emergency Response, High-Voltage Underground Electrical Isolation, Methane Gas Detection, HazMat Control).

---

## ⚙️ How It Works

```
  +---------------------------------------------------------------+
  |                     User Enters Cert ID                       |
  |                (e.g., JH-FIRE-324968, JH-FIRE-799482)         |
  +-------------------------------+-------------------------------+
                                  |
                                  v
  +---------------------------------------------------------------+
  |                 Query Firestore REST API                      |
  |        https://firestore.googleapis.com/v1/projects/...       |
  |           (Fallback to Mock DB if offline/unreachable)       |
  +-------------------------------+-------------------------------+
                                  |
                                  v
  +---------------------------------------------------------------+
  |            Client-Side Payload Pipe Reconstruction            |
  |        Payload: "certId|workerId|moduleId|score|issuedDate"   |
  +-------------------------------+-------------------------------+
                                  |
                                  v
  +---------------------------------------------------------------+
  |            Cryptographic HMAC-SHA256 Hash Digest              |
  |      Secret Key: "DGMS_MINING_SAFETY_SECRET_KEY_2026"         |
  +-------------------------------+-------------------------------+
                                  |
               +------------------+------------------+
               |                                     |
      [Signature Matches]                   [Signature Mismatches]
               |                                     |
               v                                     v
     Check Expiration Date                  ❌ VERDICT: TAMPERED /
               |                                 FORGED CERTIFICATE
    +----------+----------+
    |                     |
[Not Expired]         [Expired]
    |                     |
    v                     v
✅ VERDICT:           ⚠️ VERDICT:
CERTIFICATE           CERTIFICATE EXPIRED
VERIFIED & VALID
```

---

## 🚀 Key Features & Functionality

1. **Cryptographic Integrity Validation (HMAC-SHA256)**:
   - Reconstructs the exact pipe-delimited payload (`certId|workerId|moduleId|score|issuedDate`).
   - Computes a client-side HMAC-SHA256 Base64 digest using the shared system secret `DGMS_MINING_SAFETY_SECRET_KEY_2026`.
   - Compares the calculated hash against the `signatureHash` stored in Firestore.

2. **Live Cloud Integration with Dual Query Resolution**:
   - Queries live production records from Google Cloud Firestore project `minesafetyar` via REST API.
   - Executes direct GET queries (`/documents/certificates/{certId}`) with automatic fallback to collection group search (`runQuery`).

3. **Tamper & Forgery Detection**:
   - Immediately flags altered worker details, changed scores, manipulated issuing dates, or forged hash signatures.

4. **Expiry Verification**:
   - Automatically cross-references current system timestamps against certificate validity window (`expiryDate`).

5. **Offline Mock Fallback**:
   - Includes local mock certificate definitions for offline evaluation and instant UI testing.

6. **Official Government-Grade Web UI**:
   - Designed using modern CSS design tokens (navy, gold, dark mode, glassmorphism, responsive grid layouts).
   - Features one-click preset test buttons (Live Valid, Expired, Tampered, Not Found).
   - Print-optimised layout for official compliance reporting.

7. **Comprehensive CLI Testing Suite**:
   - Node.js standalone scripts (`test_verify_script.js`, `test_invalid_scenarios.js`, `verify_all_live.js`, `fetch_all_firestore.js`) for automated verification and bulk auditing.

---

## 🔍 Deliverables & Outputs You Can See

### 1. Web Portal Interface (`index.html`)

When running the web server (`npm run dev`), the portal displays:

* **Top Bar**: Official DGMS Government banner with real-time REST query engine status.
* **Search Input Card**: Text field with quick-select test preset pills:
  - `🔥 Live Cert 1 (JH-FIRE-324968)`
  - `🔥 Live Cert 2 (JH-FIRE-799482)`
  - `⚠️ Expired Cert (JH-ELEC-401928)`
  - `❌ Tampered Cert (JH-HAZ-882103)`
  - `🔍 Not Found (JH-UNKNOWN-999)`
* **Verdict Banner**:
  - 🟩 **Green Banner**: `OFFICIAL CERTIFICATE VERIFIED & VALID`
  - 🟧 **Orange Banner**: `CERTIFICATE EXPIRED`
  - 🟥 **Red Banner**: `SIGNATURE MISMATCH / TAMPERED CERTIFICATE` or `NOT FOUND`
* **Attribute Grid**: Displays Certificate ID, Worker Legal Name, Worker ID, Safety Training Module Title, Score (%), Accreditation Body, Issuance Date, and Expiry Date.
* **Cryptographic Signature Audit Box**:
  - Security Protocol used (`HMAC-SHA256 Base64`).
  - Reconstructed Payload Pipe String.
  - Calculated Base64 Signature Hash Digest with a **Copy Hash** button.
* **Print Record Action**: Generates clean, printer-friendly verification certificates.

---

### 2. CLI Execution Outputs

You can execute node command-line verification scripts directly in the terminal:

#### A. Single Certificate Verification (`node test_verify_script.js JH-FIRE-324968`)
```text
======================================================
 VERIFYING CERTIFICATE: JH-FIRE-324968
======================================================
[Firestore API] Fetched document directly from certificates/JH-FIRE-324968.

--- Extracted Firestore Record Attributes ---
ID:           JH-FIRE-324968
Worker ID:    NEW
Worker Name:  New Worker
Module ID:    fire_safety
Module Title: fire_safety
Score:        88%
Issued Date:  2026-09-03
Expiry Date:  2027-09-03
Organization: DGMS Certified Mining Org
Stored Status:VALID
Stored Hash:  G5l3e2s6sFpS...==

--- HMAC-SHA256 Signature Verification ---
Secret Key: "DGMS_MINING_SAFETY_SECRET_KEY_2026"

Testing Candidate [Formatted Date (issuedDate)]:
  Raw Payload:   "JH-FIRE-324968|NEW|fire_safety|88|2026-09-03"
  Computed Hash: G5l3e2s6sFpS...==
  Match Status:  ✅ VERIFIED MATCH

======================================================
 VERDICT: ✅ VERIFIED & VALID
 Cryptographic HMAC-SHA256 Match: G5l3e2s6sFpS...==
======================================================
```

#### B. Full Live Batch Verification (`node verify_all_live.js`)
```text
======================================================
 DGMS LIVE FIRESTORE BATCH CERTIFICATE VERIFIER
 Target Project: minesafetyar
======================================================
Found 2 certificate records in Firestore registry.

[1/2] Certificate: JH-FIRE-324968
  Worker: New Worker (NEW) | Score: 88%
  Module: fire_safety
  Status: ✅ AUTHENTIC & VALID (Signature Match)

[2/2] Certificate: JH-FIRE-799482
  Worker: Verified Miner (W-9921) | Score: 94%
  Module: Underground Fire Preparedness
  Status: ✅ AUTHENTIC & VALID (Signature Match)

------------------------------------------------------
 SUMMARY REPORT:
 Total Processed: 2
 Authentic & Valid: 2
 Expired: 0
 Signature Mismatch / Tampered: 0
------------------------------------------------------
```

---

## 💻 Tech Stack & Dependencies

| Layer | Technology |
|---|---|
| **Hosting & Deployment** | Firebase Hosting ([cert-veri.web.app](https://cert-veri.web.app/)) |
| **Frontend Framework** | HTML5, Vanilla JavaScript (ES Modules), Vite 5.x |
| **Styling** | Vanilla CSS3 (Custom Properties, Glassmorphism, CSS Grid) |
| **Typography** | Google Fonts (*Inter*, *Outfit*, *JetBrains Mono*) |
| **Cryptography** | `crypto-js` (HMAC-SHA256, Base64 Encoding) |
| **Database Integration** | Google Cloud Firestore REST API (`minesafetyar`) |
| **Runtime / Tooling** | Node.js v18+, Vite Dev Server, Firebase CLI |

---

## 🏃 Running the Application

### 1. Access Live Production Web Application
Visit the public live URL: **[https://cert-veri.web.app/](https://cert-veri.web.app/)**

### 2. Launch Local Development Server
```bash
npm run dev
```
Open local browser at `http://localhost:5173`.

### 2. Run CLI Tests
```bash
# Verify specific certificate
node test_verify_script.js JH-FIRE-324968

# Test tampered/invalid scenarios
node test_invalid_scenarios.js

# Audit all live Firestore documents
node verify_all_live.js
```

---

*Document generated automatically for DGMS Certificate Verification Portal (`cert_veri`).*
