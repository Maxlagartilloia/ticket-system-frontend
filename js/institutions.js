const table = document.getElementById("institutionsTable");
const form = document.getElementById("institutionForm");

let institutions = [];

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const location = document.getElementById("location").value.trim();

  if (!name || !location) return;

  institutions.push({ name, location });
  render();
  form.reset();
});

function render() {
  table.innerHTML = "";
  institutions.forEach((inst, index) => {
    table.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${inst.name}</td>
        <td>${inst.location}</td>
      </tr>
    `;
  });
}
