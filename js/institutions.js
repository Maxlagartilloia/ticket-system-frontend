const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');

async function load() {
    const { data, error } = await sb.from('institutions').select('*').order('id', {ascending: false});
    const tb = document.getElementById('instTable');
    tb.innerHTML = '';
    
    if(error) { console.error(error); return; }
    if(!data.length) { tb.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">No hay clientes registrados.</td></tr>'; return; }

    data.forEach(i => {
        tb.innerHTML += `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:15px;"><strong>${i.name}</strong><br><small style="color:#64748b">ID: ${i.id}</small></td>
                <td style="padding:15px;">${i.address || '-'}</td>
                <td style="padding:15px;">${i.phone || '-'}</td>
                <td style="padding:15px; text-align:center;">
                    <button onclick="del(${i.id})" style="color:#ef4444; background:none; border:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
    });
}

document.getElementById('instForm').addEventListener('submit', async(e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.textContent = "Guardando..."; btn.disabled = true;

    await sb.from('institutions').insert([{
        name: document.getElementById('name').value,
        address: document.getElementById('address').value,
        phone: document.getElementById('phone').value
    }]);
    
    e.target.reset(); 
    btn.textContent = "Guardar Cliente"; btn.disabled = false;
    load();
});

window.del = async(id) => { if(confirm('¿Eliminar este cliente? Se borrarán sus tickets.')) { await sb.from('institutions').delete().eq('id',id); load(); }};
document.addEventListener("DOMContentLoaded", load);
