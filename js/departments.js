const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; 
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadEquip() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return window.location.href = "index.html";

    const { data } = await sb.from('equipment').select('*');
    const tbody = document.getElementById('equipTable');
    tbody.innerHTML = '';
    data?.forEach(e => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${e.model}</strong></td>
                <td>${e.serial_number}</td>
                <td>${e.name}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteEq(${e.id})">Borrar</button></td>
            </tr>`;
    });
}

document.getElementById('equipForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const model = document.getElementById('model').value;
    const serial_number = document.getElementById('serial').value;
    const name = document.getElementById('name').value;
    
    // Ojo: Requiere department_id en la base de datos, 
    // pero para no complicar el form ahora lo mandamos null o creamos un dummy si falla.
    await sb.from('equipment').insert([{ model, serial_number, name }]);
    e.target.reset();
    loadEquip();
});

window.deleteEq = async (id) => {
    if(confirm('¿Eliminar equipo?')) {
        await sb.from('equipment').delete().eq('id', id);
        loadEquip();
    }
}
document.getElementById('logoutBtn').addEventListener('click', async () => { await sb.auth.signOut(); window.location.href = "index.html"; });
document.addEventListener("DOMContentLoaded", loadEquip);
