document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("correo").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorDiv = document.getElementById("error");

  errorDiv.textContent = "";

  try {
    const response = await fetch(
      "https://ticket-system-backend-4h25.onrender.com/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          correo: email,
          password: password
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      errorDiv.textContent = data.detail || "Invalid credentials";
      return;
    }

    // Save token
    localStorage.setItem("copiermaster_token", data.access_token);

    // ✅ CORRECT REDIRECT
    window.location.href = "dashboard.html";

  } catch (error) {
    console.error(error);
    errorDiv.textContent = "Server connection error";
  }
});
