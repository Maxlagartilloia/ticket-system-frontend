const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');
let currentInstId = null;
let isEditing = false;
let editId = null;

// INICIO AUTOMÁTICO
document.addEventListener("DOMContentLoaded", () => {
    loadTechnicians();
    loadInstitutions();
});

// 1. CARGAR TÉCNICOS (DROPDOWN)
async function loadTechnicians() {
    // Gracias al SQL, ahora cualquiera puede leer esta lista
    const { data } = await sb.from('profiles').select('id, full_name').eq('role', 'technician');
    const sel = document.getElementById('techSelect');
    if(sel && data) {
        sel.innerHTML = '<option value="">-- Sin Asignar --</option>';
        data.forEach(t => sel.innerHTML += `<option value="${t.id}">${t.full_name}</option>`);
    }
}

// 2. CARGAR CLIENTES (TABLA PRINCIPAL)
async function loadInstitutions() {
    const { data: insts } = await sb.from('institutions').select('*').order('id', {ascending: false});
    const tb = document.getElementById('instTable');
    tb.innerHTML = '';

    if (!insts || insts.length === 0) {
        tb.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No hay clientes. Usa el formulario de arriba.</td></tr>';
        return;
    }

    // Mapa auxiliar para nombres de técnicos
    const techMap = {};
    const opts = document.getElementById('techSelect').options;
    for(let i=0; i<opts.length; i++) techMap[opts[i].value] = opts[i].text;

    // Contar equipos para el botón
    const { data: equips } = await sb.from('equipment').select('institution_id');
    const counts = {};
    equips?.forEach(e => counts[e.institution_id] = (counts[e.institution_id] || 0) + 1);

    insts.forEach(i => {
        const techName = (i.default_technician_id && techMap[i.default_technician_id]) 
            ? `<b>${techMap[i.default_technician_id]}</b>` 
            : '<span style="color:#ccc;">--</span>';
        
        const count = counts[i.id] || 0;

        tb.innerHTML += `
            <tr>
                <td style="font-weight:600; color:#1e293b;">${i.name}</td>
                <td>${i.phone || ''}</td>
                <td>${techName}</td>
                <td>
                    <button onclick="openEquipModal(${i.id}, '${i.name}')" class="btn" style="background:#fff7ed; color:#c2410c; border:1px solid #ffedd5; font-size:12px; padding:5px 10px;">
                        <i class="fas fa-print"></i> Inventario (${count})
                    </button>
                </td>
                <td>
                    <button onclick="openDeptModal(${i.id}, '${i.name}')" class="btn" style="background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; font-size:12px; padding:5px 10px;">
                        <i class="fas fa-sitemap"></i> Áreas
                    </button>
                </td>
                <td style="text-align:center;">
                    <button onclick="editInst(${i.id}, '${i.name}', '${i.phone||''}', '${i.address||''}', '${i.default_technician_id||''}')" style="cursor:pointer; border:none; background:none; color:#f59e0b; margin-right:5px;"><i class="fas fa-pen"></i></button>
                    <button onclick="delInst(${i.id})" style="cursor:pointer; border:none; background:none; color:#ef4444;"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
    });
}

// 3. GESTIÓN DE EQUIPOS (MODAL)
window.openEquipModal = async (id, name) => {
    currentInstId = id;
    document.getElementById('lblEquipClient').innerText = name;
    document.getElementById('equipModal').style.display = 'flex';
    
    // Cargar Áreas en el Select
    const sel = document.getElementById('newEquipDept');
    sel.innerHTML = '<option>Cargando...</option>';
    const { data: depts } = await sb.from('departments').select('*').eq('institution_id', id);
    sel.innerHTML = '<option value="">- Seleccionar Área -</option>';
    depts?.forEach(d => sel.innerHTML += `<option value="${d.id}">${d.name}</option>`);

    loadEquipList(id);
}

async function loadEquipList(id) {
    const list = document.getElementById('equipList');
    list.innerHTML = '<div style="padding:10px;">Cargando...</div>';
    
    // JOIN manual: traemos equipos y luego cruzamos con departamentos si es necesario
    const { data: equips, error } = await sb.from('equipment')
        .select('*, departments(name)')
        .eq('institution_id', id)
        .order('department_id');
    
    list.innerHTML = '';
    if(!equips || !equips.length) {
        list.innerHTML = '<div style="padding:20px; text-align:center; color:#94a3b8;">Sin equipos registrados.</div>';
        return;
    }

    equips.forEach(e => {
        const deptName = e.departments?.name || 'General';
        list.innerHTML += `
            <div class="list-item">
                <div>
                    <div style="font-weight:bold; color:#334155;">${e.model}</div>
                    <div style="font-size:11px; color:#64748b;">SN: ${e.serial_number}</div>
                </div>
                <div style="text-align:right;">
                    <span class="tag-dept">${deptName}</span>
                    <button onclick="delEquip(${e.id})" class="btn-icon-del" style="margin-left:10px;"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    });
}

window.addEquipmentDirect = async () => {
    const model = document.getElementById('newEquipModel').value;
    const serial = document.getElementById('newEquipSerial').value;
    const dept = document.getElementById('newEquipDept').value;
    
    if(!model || !serial || !dept) return alert("Completa todos los campos");

    const { error } = await sb.from('equipment').insert([{
        model: model, serial_number: serial, institution_id: currentInstId, department_id: dept, status: 'installed'
    }]);

    if(error) alert("Error: " + error.message);
    else {
        document.getElementById('newEquipModel').value = '';
        document.getElementById('newEquipSerial').value = '';
        loadEquipList(currentInstId);
        loadInstitutions(); // Actualizar contador
    }
}

window.delEquip = async (id) => {
    if(confirm("¿Eliminar equipo?")) {
        await sb.from('equipment').delete().eq('id', id);
        loadEquipList(currentInstId);
        loadInstitutions();
    }
}

// 4. FUNCIONES FORMULARIO CLIENTE (CREAR / EDITAR)
window.editInst = (id, name, phone, address, techId) => {
    isEditing = true; editId = id;
    document.getElementById('name').value = name;
    document.getElementById('phone').value = phone;
    document.getElementById('address').value = address;
    document.getElementById('techSelect').value = (techId && techId !== 'null') ? techId : "";
    
    const btn = document.querySelector('#instForm button');
    btn.innerHTML = 'ACTUALIZAR'; btn.style.background = '#f59e0b';
    document.querySelector('.scroll-area').scrollTop = 0;
}

document.getElementById('instForm').addEventListener('submit', async(e) => {
    e.preventDefault();
    const formData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        default_technician_id: document.getElementById('techSelect').value || null
    };

    if(isEditing) await sb.from('institutions').update(formData).eq('id', editId);
    else await sb.from('institutions').insert([formData]);

    e.target.reset();
    isEditing = false;
    document.querySelector('#instForm button').innerHTML = '<i class="fas fa-save"></i> Guardar';
    document.querySelector('#instForm button').style.background = 'var(--sidebar-active)';
    loadInstitutions();
});

// 5. FUNCIONES AUXILIARES (Borrar Cliente, Áreas, Usuarios)
window.delInst = async(id) => { if(confirm("¿Eliminar cliente y TODO su historial?")) { await sb.from('institutions').delete().eq('id', id); loadInstitutions(); } }

window.openDeptModal = async(id, name) => {
    currentInstId = id;
    document.getElementById('lblDeptClient').innerText = name;
    document.getElementById('deptModal').style.display = 'flex';
    loadDepts(id);
}
async function loadDepts(id) {
    const list = document.getElementById('deptList'); list.innerHTML = '...';
    const { data } = await sb.from('departments').select('*').eq('institution_id', id);
    list.innerHTML = '';
    data?.forEach(d => list.innerHTML += `<div class="list-item"><span>${d.name}</span><button onclick="delDept(${d.id})" class="btn-icon-del"><i class="fas fa-trash"></i></button></div>`);
}
window.addDepartment = async() => {
    const name = document.getElementById('newDeptName').value; if(!name) return;
    await sb.from('departments').insert([{ name, institution_id: currentInstId }]);
    document.getElementById('newDeptName').value = ''; loadDepts(currentInstId);
}
window.delDept = async(id) => { if(confirm("¿Borrar área?")) { await sb.from('departments').delete().eq('id', id); loadDepts(currentInstId); } }
