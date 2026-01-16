const API_URL = "https://ticket-system-backend-4h25.onrender.com";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            alert("Credenciales incorrectas");
            return;
        }

        const data = await res.json();

        // 🔐 GUARDAR TOKEN (ESTO ES LO QUE FALTABA)
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("user_role", data.role);

        // 👉 REDIRIGIR
        window.location.href = "dashboard.html";

    } catch (err) {
        console.error(err);
        alert("Error de conexión con el servidor");
    }
});
