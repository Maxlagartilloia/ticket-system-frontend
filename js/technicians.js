const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; 
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadTechs() {
    // Buscamos perfiles que sean técnicos o admins
    const { data } = await supabase.from('profiles').select('*');
    const tbody = document.getElementById('techTable');
    tbody.innerHTML = '';
    data?.forEach(tech => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${tech.full_name || 'Sin Nombre'}</strong></td>
                <td>${tech.email}</td>
                <td><span style="background:#e8f5e9; color:#2e7d32; padding:4px 8px; border-radius:4px; font-size:12px;">${tech.role}</span></td>
                <td><button class="btn btn-danger btn-sm">Baja</button></td>
            </tr>`;
    });
}

// Nota: Crear usuarios reales requiere Backend function, 
// por ahora simulamos creación de perfil para la demo.
document.getElementById('techForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    alert("Para crear un usuario real con login, usa el panel de Auth de Supabase por ahora. Esta función estará lista en la v2.1");
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut(); window.location.href = "index.html";
});

loadTechs();
