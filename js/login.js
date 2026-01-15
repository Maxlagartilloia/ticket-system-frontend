<script>
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const correo = document.getElementById("correo").value;
  const password = document.getElementById("password").value;

  const res = await fetch("https://ticket-system-backend-4h25.onrender.com/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo, password })
  });

  const data = await res.json();

  if (!res.ok) {
    document.getElementById("error").innerText = data.detail;
    return;
  }

  // 🔐 Guardar SOLO el token
  sessionStorage.setItem("token", data.access_token);

  // 🚀 Redirigir
  window.location.href = "dashboard.html";
});
</script>
