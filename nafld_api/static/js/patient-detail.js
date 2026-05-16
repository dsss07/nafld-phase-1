// -----------------------------------------------------
// patient-detail.js  (Final Updated)
// -----------------------------------------------------

import {
  doc, getDoc, collection, addDoc, onSnapshot,
  orderBy, query, serverTimestamp, updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const db = window.firebaseDB;
const auth = window.firebaseAuth;

// Helpers
function uid() { return localStorage.getItem("doctorID"); }
function getPID() { return new URL(window.location.href).searchParams.get("id"); }

// =====================================================
// 1) HEADER → Same style as dashboard
// =====================================================
async function loadDoctorHeader() {
  const uidVal = uid();
  if (!uidVal) return;

  const ref = doc(db, "doctors", uidVal);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const d = snap.data();
    document.getElementById("doctor-info").innerHTML =
      `${d.name} • <span style="color:#4f46e5">${d.clinic}</span>`;
  }
}

function setupHeaderActions() {
  const btn = document.getElementById("signout-btn");
  btn.onclick = async () => {
    const { signOut } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    await signOut(auth);
    localStorage.removeItem("doctorID");
    window.location.href = "/";
  };
}

// =====================================================
// 2) LOAD PATIENT INFO
// =====================================================
window.currentPatient = null;

async function loadPatient() {
  const pid = getPID(), uidVal = uid();
  const snap = await getDoc(doc(db, "doctors", uidVal, "patients", pid));

  if (!snap.exists()) return;

  const p = snap.data();
  window.currentPatient = p;

  document.getElementById("patient-info").innerHTML = `
    <h2>${p.name}</h2>
    <p>Age: ${p.age}</p>
    <p>Gender: ${p.gender}</p>
    <p class="muted">(Risk & NAFLD status from Phase 1)</p>
  `;
}

// =====================================================
// 3) REALTIME REPORT LIST + RUN ANALYSIS
// =====================================================
function loadReportsRealtime() {
  const pid = getPID(), uidVal = uid();

  const q = query(
    collection(db, "doctors", uidVal, "patients", pid, "reports"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snap) => {
    const box = document.getElementById("reports-list");
    box.innerHTML = "";

    if (snap.empty) {
      box.innerHTML = "<p class='muted'>No reports yet.</p>";
      return;
    }

    let first = true;

    snap.forEach((docSnap) => {
      const r = docSnap.data();
      const id = docSnap.id;

      let button = "";
      if (first) {
  button = `<button class="btn-add run-btn" data-id="${id}">Run Analysis Phase 1</button>`;
}

      box.innerHTML += `
        <div class="report-card">
          <p><b>Date:</b> ${r.reportDate}</p>
          <p><b>A/G Ratio:</b> ${r.agRatio}</p>
          <p><b>ALP:</b> ${r.alp}, <b>ALT:</b> ${r.alt}, <b>AST:</b> ${r.ast}</p>
          <p><b>Total Bilirubin:</b> ${r.totalBilirubin}</p>
          <p><b>Direct Bilirubin:</b> ${r.directBilirubin}</p>
          <p><b>Total Protein:</b> ${r.totalProtein}</p>

          ${r.nafldResult ? `<p><b>NAFLD:</b> ${r.nafldResult}</p>` : ""}
          ${r.risk ? `<p><b>Risk:</b> ${r.risk}</p>` : ""}

          ${button}
        </div>
      `;

      first = false;
    });

    // Attach listeners
    document.querySelectorAll(".run-btn").forEach(btn => {
      btn.onclick = () => runPhase1(btn.dataset.id);
    });
  });
}

// =====================================================
// 4) PHASE 1 API CALL
// =====================================================
async function runPhase1(reportId) {
  const pid = getPID(), uidVal = uid();

  const reportSnap = await getDoc(
    doc(db, "doctors", uidVal, "patients", pid, "reports", reportId)
  );
  const r = reportSnap.data();
  const p = window.currentPatient;

  // Compute FIB4
  const fib4 = (p.age * r.ast) / (r.alt + 1);

  const body = {
    age: p.age,
    gender: p.gender,
    totalBilirubin: r.totalBilirubin,
    directBilirubin: r.directBilirubin,
    alp: r.alp,
    alt: r.alt,
    ast: r.ast,
    totalProtein: r.totalProtein,
    albumin: r.albumin,
    agRatio: r.agRatio,
    fib4: fib4
  };

  try {
    const res = await fetch("http://127.0.0.1:5000/predict_phase1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    alert(`NAFLD: ${data.nafld}\nRisk: ${data.risk}`);

    await updateDoc(
      doc(db, "doctors", uidVal, "patients", pid, "reports", reportId),
      { nafldResult: data.nafld, risk: data.risk }
    );

  } catch (err) {
    alert("API Error: " + err);
  }
}

// =====================================================
// 5) ADD REPORT MODAL
// =====================================================
function setupModalAndForm() {
  const modal = document.getElementById("report-modal");
  const open = document.getElementById("add-report-btn");
  const close = document.getElementById("close-modal");
  const form = document.getElementById("report-form");

  open.onclick = () => modal.classList.remove("hidden");
  close.onclick = () => modal.classList.add("hidden");

  form.onsubmit = async (e) => {
    e.preventDefault();
    const pid = getPID(), uidVal = uid();

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    [
      "agRatio", "albumin", "alp", "alt", "ast",
      "directBilirubin", "totalBilirubin", "totalProtein"
    ].forEach(k => data[k] = Number(data[k]));

    data.createdAt = serverTimestamp();

    await addDoc(
      collection(db, "doctors", uidVal, "patients", pid, "reports"),
      data
    );

    form.reset();
    modal.classList.add("hidden");
  };
}

// =====================================================
// INIT PAGE
// =====================================================
document.addEventListener("DOMContentLoaded", async () => {
  await loadDoctorHeader();       // Same as dashboard
  setupHeaderActions();

  await loadPatient();
  loadReportsRealtime();
  setupModalAndForm();
});
