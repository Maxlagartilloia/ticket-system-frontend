const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');
let deptMap = {};

async function init() {
    // Cargar Instituciones
    const { data: insts } = await sb.from('institutions').select('id, name');
    const s = document.getElementById('instSelect');
    s.innerHTML = '<option value="">Seleccione Cliente...</option>';
    insts?.forEach(i => s.innerHTML += `<option value="${i.id}">${i.name}</option>`);

    // Mapa de Depts para la tabla
    const { data: depts } = await sb.from('departments').select('id, name');
    depts?.forEach(d => deptMap[d.id] = d.name);

    loadTable();
}

window.loadDepts = async(id) => {
    const s = document.getElementById('deptSelect');
    s.disabled = true; s.innerHTML = '<option>Cargando...</option>';
    const { data } = await sb.from('departments').select('*').eq('institution_id', id);
    s.innerHTML = '<option value="">Seleccione Departamento...</option>';
    data?.forEach(d => s.innerHTML += `<option value="${d.id}">${d.name}</option>`);
    s.disabled = false;
}

async function loadTable() {
    const { data } = await sb.from('equipment').select('*').order('id', {ascending:false});
    const t = document.getElementById('equipTable');
    t.innerHTML = '';
    data?.forEach(e => {
        t.innerHTML += `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:15px;"><strong>${e.model}</strong></td>
                <td style="padding:15px;">${deptMap[e.department_id] || 'N/A'}</td>
                <td style="padding:15px;"><span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:4px; font-size:12px;">${e.serial_number}</span></td>
                <td style="padding:15px; text-align:center;"><button onclick="del(${e.id})" style="color:red; background:none; border:none; cursor:pointer;"><i class="fas fa-trash"></i></button></td>
            </tr>`;
    });
}

document.getElementById('equipForm').addEventListener('submit', async(e)=>{
    e.preventDefault();
    await sb.from('equipment').insert([{
        institution_id: document.getElementById('instSelect').value,
        department_id: document.getElementById('deptSelect').value,
        model: document.getElementById('model').value,
        serial_number: document.getElementById('serial').value
    }]);
    e.target.reset(); loadTable();
});

window.del = async(id) => { if(confirm('¿Borrar?')) { await sb.from('equipment').delete().eq('id',id); loadTable(); }};
document.addEventListener("DOMContentLoaded", init);
