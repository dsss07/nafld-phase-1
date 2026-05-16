import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA_J_7R28ah8dD5jz0y_BLIkzxeaI21spU",
  authDomain: "nafld-9c6de.firebaseapp.com",
  projectId: "nafld-9c6de",
  storageBucket: "nafld-9c6de.firebasestorage.app",
  messagingSenderId: "80068011020",
  appId: "1:80068011020:web:d72e767468e610ad333a29"
};

const app = initializeApp(firebaseConfig);

window.firebaseAuth = getAuth(app);
window.firebaseDB = getFirestore(app);
