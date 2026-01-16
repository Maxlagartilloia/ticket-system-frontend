const API = "https://TU_BACKEND_URL"; // misma que usas en tickets.js

const institutionSelect = document.getElementById("institution_id");
const table = document.getElementById("departments-table");
const form = document.getElementById("department-form");

async function loadInstitutions() {
    const res = await fetch(`${API}/instituciones`);
    const data = await res.json();

    data.forEach(inst => {
        const option = document.createElement("option");
        option.value = inst.id;
        option.textContent = inst.name;
        institutionSelect.appendChild(option);
    });
}

async function loadDepartments() {
    table.innerHTML = "";
    const res = await fetch(`${API}/departments`);
    const data = await res.json();

    data.forEach(dep => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${dep.id}</td>
            <td>${dep.name}</td>
            <td>${dep.institution.name}</td>
        `;
        table.appendChild(tr);
    });
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
        name: document.getElementById("name").value,
        institution_id: institutionSelect.value
    };

    await fetch(`${API}/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    form.reset();
    loadDepartments();
});

loadInstitutions();
loadDepartments();
