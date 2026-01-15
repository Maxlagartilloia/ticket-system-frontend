const form = document.getElementById("techForm");
const list = document.getElementById("techList");

let technicians = [];

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = techName.value;
  const email = techEmail.value;

  technicians.push({ name, email });
  render();
  form.reset();
});

function render() {
  list.innerHTML = "";
  technicians.forEach(t => {
    list.innerHTML += `<li>${t.name} – ${t.email}</li>`;
  });
}
