const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');

async function load() {
    // Filtramos usuarios que sean tecnicos o admins
    const { data } = await sb.from('profiles').select('*').in('role', ['technician', 'admin', 'supervisor']);
    const tb = document.getElementById('techTable');
    tb.innerHTML = '';
    data?.forEach(u => {
        let badgeColor = u.role === 'admin' ? '#ef4444' : '#16a34a';
        tb.innerHTML += `
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:15px;"><strong>${u.full_name || 'Sin Nombre'}</strong></td>
                <td style="padding:15px;"><span style="background:${badgeColor}; color:white; padding:3px 8px; border-radius:10px; font-size:11px; text-transform:uppercase;">${u.role}</span></td>
                <td style="padding:15px;">${u.email}</td>
            </tr>`;
    });
}

document.getElementById('techForm').addEventListener('submit', async(e)=>{
    e.preventDefault();
    // Nota: Crear usuarios reales requiere Admin API. Aquí simulamos inserción de perfil.
    // En producción, el usuario se registra y aquí le editas el ROL.
    const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;
    
    // Buscar si existe perfil
    const { data: exist } = await sb.from('profiles').select('id').eq('email', email).single();
    
    if(exist) {
        await sb.from('profiles').update({ role: 'technician', full_name: name }).eq('id', exist.id);
        alert("Rol actualizado a Técnico");
    } else {
        alert("El usuario debe registrarse (Sign Up) primero en la plataforma.");
    }
    e.target.reset(); load();
});

document.addEventListener("DOMContentLoaded", load);
