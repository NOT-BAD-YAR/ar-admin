# 🏛️ Admin Safety & Compliance Command Portal Specification
### **Project 26041 — Government of Jharkhand (Dept. of Higher & Technical Education & DGMS Dhanbad)**
> **Live Data-Driven Workforce Monitoring, Safety Audit & Digital Certificate Verification Platform**

---

## 📌 Executive Overview & Platform Vision

The **Web Admin Compliance Portal** serves as the central **Command & Monitoring Tower** for:
1. **DGMS Inspectors & State Safety Officers (Directorate General of Mines Safety, Dhanbad)**
2. **Mine & Factory Safety Managers (BCCL Coal, SAIL Steel, Mica Processing Units)**
3. **Training & Regional Language Coordinators**

The admin portal directly interfaces with the live Firebase project (`minesafetyar`), capturing offline and online mobile AR safety assessment logs from mid-range Android smartphones deployed across Jharkhand's industrial sectors.

It transforms raw AR simulation data into **actionable statutory compliance monitoring, predictive safety auditing, 7-dimension competency gap analysis, and cryptographic certificate verification**.

---

## 🌐 Firebase Production Schema Integration (`minesafetyar`)

The portal connects to the live Google Cloud Firestore database (`minesafetyar`) using the project credentials:
* **Project ID**: `minesafetyar`
* **API Key**: `AIzaSyBxhWZvIqgIMP1niRSc_H2iRMkdDLNdybI`

### Live Firestore Collections & Data Field Mapping:

```
                                  FIRESTORE DB (minesafetyar)
                                               │
       ┌───────────────────────┬───────────────┴───────────────┬──────────────────────┐
       ▼                       ▼                               ▼                      ▼
  workers/{uid}       workers/{uid}/progress          workers/{uid}/results      certificates/{certId}
 (Master Profile)     (Module Breakdown)             (AR Attempt Telemetry)    (Public QR Registry)
   │                       │                               │                      │
   ├── id                  ├── moduleId                    ├── resultId           ├── id
   ├── name                ├── status (int)                ├── workerId           ├── workerId
   ├── organization        ├── progress (int)              ├── moduleName         ├── workerName
   ├── sector              ├── bestScore (int)             ├── score / percentage ├── moduleId / title
   ├── phone               ├── attempts (int)              ├── mistakesCount      ├── organization
   ├── language            ├── lastAttempt                 ├── completionTimeSec  ├── score (int)
   ├── joinDate            ├── certificateId               ├── timestamp          ├── issuedDate / expiryDate
   ├── overallProgress     └── competencyScores {          ├── stepMetrics[]      ├── status (VALID/EXPIRED)
   ├── certificatesEarned       hazardRecognition,         ├── latitude           └── signatureHash
   └── totalAttempts            extinguisherUse,           ├── longitude               (HMAC-SHA256)
                                ppeSelection,              ├── locationName
                                evacuation,                ├── hasLocation
                                emergencyResponse,         └── capturedOffline
                                timeManagement,
                                quizScore }
```

---

## 🚀 Core Admin Monitoring Modules & Functionalities

### 1. 🖥️ Executive Monitoring Command Center
* **State-Wide Key Performance Indicators (KPIs)**:
  - Total Registered Workers vs. Total Certified Workers.
  - State Overall Compliance Rate (%).
  - DGMS Safety Audit Score (0–100).
  - Active Mining & Industrial Sites Monitored.
  - Underground Offline Assessment Sync Volume.
* **Interactive Geo-Spatial Mine Location Map**:
  - Live map plotting worker assessment locations using `latitude` and `longitude`.
  - District risk heatmaps (Dhanbad, Bokaro, East Singhbhum, Giridih, Hazaribagh, Ranchi).
  - Identifies high-risk mine pits based on localized error frequencies.
* **Live Incident & Safety Alert Feed**:
  - Real-time alerts highlighting mines with high failure rates, un-synced offline queues, or expiring certifications.

---

### 2. ⚖️ DGMS Statutory Compliance & 30-Day Orientation Rule Engine
* **Mines Act 1952 (Sec 28) & Factories Act 1948 Compliance Meter**:
  - Automated statutory audit engine verifying site compliance against Indian mining safety mandates.
* **30-Day New Worker Orientation Enforcement**:
  - **The Problem Addressed**: DGMS Dhanbad recorded 48 fatal mine accidents in 2022-23, largely involving workers with <30 days orientation.
  - **The Feature**: System calculates worker tenure (`Current Date - joinDate`). Automatically flags new recruits with `certificatesEarned === 0` to prevent unauthorized entry into underground shafts.
* **One-Click Official DGMS PDF Audit Report Generator**:
  - Produces printable, official government-formatted compliance pass certificates complete with DGMS inspection seals.

---

### 3. 🎯 7-Dimension Competency Radar & Skill Gap Diagnostics
Instead of showing only a single pass/fail percentage, the portal evaluates workers across **7 granular competency dimensions**:
1. **Hazard Recognition**: Spotting hazard zones, methane leaks, and rock load indicators in AR.
2. **Extinguisher / SCBA Technique**: Accuracy of physical pull-pin, squeeze-sweep, and mask fit gestures.
3. **PPE Selection**: Choosing correct safety gear (SCBA vs dust mask, insulated electrical gloves).
4. **Evacuation Sequencing**: Route navigation time and assembly point protocol.
5. **Emergency Response**: Panic delay in sounding 3D alarm buttons prior to equipment handling.
6. **Time Management**: Speed of completion under simulated emergency stress.
7. **Quiz Score**: Theoretical comprehension (30% weight of total module score).

---

### 4. 📈 Attempt History, Hesitation & Step-by-Step Failure Inspector
* **Hesitation & Panic Index**:
  - Compares `completionTimeSeconds` against `mistakesCount`. Fast time + high mistakes = panic/rushing. Slow time + low mistakes = hesitation under stress.
* **StepMetrics Inspector**:
  - Admins can click any drill attempt to inspect the `stepMetrics` array, pinpointing the exact step where a worker made a procedural mistake.
* **Worker Attempt Improvement Curve**:
  - Tracks score progression across multiple retries (`attempts`).

---

### 5. 🔐 Cryptographic Certificate Ledger & QR Verification Center
* **Live Public Certificate Ledger**:
  - Reads directly from `certificates/{certId}` in Firestore.
* **Client-Side HMAC-SHA256 Signature Verification Engine**:
  - Re-calculates signature hash using secret key `"DGMS_MINING_SAFETY_SECRET_KEY_2026"` and payload string `"certId|workerId|moduleId|score|issuedDate"`.
  - Instantly detects tampered worker details, modified scores, or forged certificates.
* **Interactive QR Hash Verifier Tool**:
  - Built-in verification lookup tool allowing admins/security guards to paste a hash or scan a QR code to verify validity.
* **30-Day Certificate Expiry Warning Engine**:
  - Automatically flags certificates nearing `expiryDate`.

---

### 6. 🗣️ Regional Language & Offline Telemetry Matrix
* **Multilingual Training Adoption**:
  - Analytics breakdown tracking language preferences (**Hindi, Santali - Ol Chiki / Voice, English, Tamil**) across sectors.
  - Monitors audio prompt usage (0.85× slow voiceover) for low-literacy tribal recruits.
* **Offline Field Telemetry Monitor**:
  - Tracks smartphone queue telemetry operating underground or in remote open-cast pits (`capturedOffline: true`).
  - Displays sync status when devices reconnect to network (`synced: true`).

---

## 🛠️ Technology Stack & Architecture

| Layer | Technology Selected |
|---|---|
| **Framework** | React 18 + Vite (Fast SPA execution, responsive dynamic layout) |
| **Icons & Styling** | Lucide React Icons, Custom Vanilla CSS Glassmorphism System |
| **Typography** | Google Fonts (*Plus Jakarta Sans*, *JetBrains Mono*) |
| **Database Connection** | Firebase Web SDK v10 (Firestore REST / Realtime query on `minesafetyar`) |
| **Cryptography** | CryptoJS / Web Crypto API (`HMAC-SHA256 Base64`) |
| **Build & Deploy** | Vite Build System, Firebase Hosting / Vercel ready |

---

## 📌 Expected Admin User Workflow Scenarios

1. **Scenario 1 — DGMS Site Inspection**:
   An inspector opens the portal, clicks **"DGMS Compliance Center"**, filters by Dhanbad Coal Mines, and checks if 100% of workers with `<30 days orientation` have valid certificates before certifying the mine site.

2. **Scenario 2 — Identifying Safety Weaknesses**:
   A mine manager reviews the **5 Safety Domains Analytics** tab and notices that 35% of recruits in Bokaro Steel Plant are failing `Machinery LOTO Safety` due to improper padlock application. They schedule targeted AR retraining.

3. **Scenario 3 — Certificate Verification at Mine Gate**:
   A contractor presents a QR code badge at the pit head. The security guard pastes the hash into the **QR Certificate Ledger Verifier**, confirming authentic status in real-time.

---

*Specification document generated for Project 26041 — Jharkhand AR Industrial Safety Admin Compliance Portal.*
