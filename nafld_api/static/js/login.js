let isSignup = false;

window.switchMode = function () {
  isSignup = !isSignup;

  document.getElementById("name-block").classList.toggle("hidden", !isSignup);
  document.getElementById("clinic-block").classList.toggle("hidden", !isSignup);

  document.getElementById("submit-btn").innerText = isSignup ? "Sign Up" : "Sign In";

  document.getElementById("form-title").innerText = isSignup ? "Create Account" : "Welcome Doctor";
  document.getElementById("form-subtitle").innerText = isSignup ? "Sign up to begin" : "Login to continue";

  document.getElementById("toggle").innerHTML =
    isSignup
      ? `Already have an account? <button class="link-btn" onclick="switchMode()">Sign In</button>`
      : `Don't have an account? <button class="link-btn" onclick="switchMode()">Sign Up</button>`;
};

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const auth = window.firebaseAuth;
  const db = window.firebaseDB;

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (isSignup) {
    const name = document.getElementById("doctorName").value.trim();
    const clinic = document.getElementById("clinicName").value.trim();

    if (!name || !clinic) {
      return alert("Please enter Doctor name and Clinic name!");
    }

    const { createUserWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    const { setDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "doctors", cred.user.uid), {
        name, clinic, email
      });

      localStorage.setItem("doctorID", cred.user.uid);
      window.location.href = "dashboard.html";
    } catch (err) {
      alert("Signup Error: " + err.message);
    }

  } else {
    const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("doctorID", cred.user.uid);
      window.location.href = "/dashboard";
    } catch (err) {
      alert("Login Error: " + err.message);
    }
  }
});
