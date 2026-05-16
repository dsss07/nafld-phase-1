import { 
  collection, addDoc, doc, onSnapshot, query, orderBy, getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const db = window.firebaseDB;
const auth = window.firebaseAuth;

// ----------------------------------------------
// UID CHECK
// ----------------------------------------------
function getUID() {
  const uid = localStorage.getItem("doctorID");
  if (!uid) {
    window.location.href = "/";
    return null;
  }
  return uid;
}

// ----------------------------------------------
// LOAD DOCTOR INFO IN HEADER
// ----------------------------------------------
async function loadDoctor() {
  const uidVal = getUID();
  if (!uidVal) return;

  const ref = doc(db, "doctors", uidVal);
  const snap = await getDoc(ref);

  const el = document.getElementById("doctor-info");

  if (snap.exists()) {
    const d = snap.data();
    el.innerHTML = `
      <span class="doc-name">${d.name}</span>
      <span class="doc-clinic">• ${d.clinic}</span>
    `;
  } else {
    el.innerHTML = "Doctor Not Found";
  }
}

// ----------------------------------------------
// SIGNOUT BUTTON
// ----------------------------------------------
function setupHeader() {
  const btn = document.getElementById("signout-btn");

  btn.onclick = async () => {
    const { signOut } = await import(
      "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js"
    );
    await signOut(auth);

    localStorage.removeItem("doctorID");
    window.location.href = "/";
  };
}

// ----------------------------------------------
// OPEN PATIENT DETAILS PAGE
// ----------------------------------------------
window.openPatient = function (id) {
  window.location.href = `/patient-detail?id=${id}`;
};

// ----------------------------------------------
// ADD PATIENT MODAL
// ----------------------------------------------
function setupModal() {
  const modal = document.getElementById("modal");
  const addBtn = document.getElementById("add-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const form = document.getElementById("add-form");

  addBtn.onclick = () => modal.classList.remove("hidden");
  cancelBtn.onclick = () => modal.classList.add("hidden");

  form.onsubmit = async (e) => {
    e.preventDefault();
    const uid = getUID();
    if (!uid) return;

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    data.age = Number(data.age);
    data.createdAt = new Date();

    const patientsRef = collection(db, "doctors", uid, "patients");
    await addDoc(patientsRef, data);

    modal.classList.add("hidden");
    form.reset();
  };
}

// ----------------------------------------------
// LISTEN TO PATIENT LIST
// ----------------------------------------------
function listenPatients() {
  const uid = getUID();
  const list = document.getElementById("patients-list");

  const patientsRef = collection(db, "doctors", uid, "patients");
  const q = query(patientsRef, orderBy("createdAt", "desc"));

  onSnapshot(q, (snap) => {
    list.innerHTML = "";

    snap.forEach((docSnap) => {
      const p = docSnap.data();
      const id = docSnap.id;

      const div = document.createElement("div");
      div.className = "patient-card";

      div.innerHTML = `
        <div class="patient-card-inner">
          <div class="pc-left">
            <h3>${p.name}</h3>
            <p class="muted">${p.gender}</p>
          </div>

          <div class="pc-right">
            <p class="age-text">${p.age} yrs</p>
            <p class="risk-text">${p.risk || "—"}</p>
          </div>

          <button class="btn-primary small-btn" onclick="openPatient('${id}')">
            View
          </button>
        </div>
      `;

      list.appendChild(div);
    });
  });
}

// ----------------------------------------------
// PAGE LOAD
// ----------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  setupHeader();
  loadDoctor();     
  setupModal();
  listenPatients();
});
