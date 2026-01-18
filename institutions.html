const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');
let currentInstId = null;
let isEditing = false;
let editId = null;

document.addEventListener("DOMContentLoaded", () => {
    loadTechniciansForSelect();
    loadInstitutions();
});

// 1. CARGAR TÉCNICOS
async function loadTechniciansForSelect() {
    const { data: techs } = await sb.from('profiles').select('id, full_name').eq('role', 'technician');
    const sel = document.getElementById('techSelect');
    if(sel) {
        sel.innerHTML = '<option value="">-- Sin Técnico Fijo --</option>';
        techs?.forEach(t => sel.innerHTML += `<option value="${t.id}">🔧 ${t.full_name}</option>`);
    }
}

// 2. CARGAR CLIENTES
async function loadInstitutions() {
    const { data: insts, error } = await sb.from('institutions').select('*').order('id', {ascending: false});
    const tb = document.getElementById('instTable');
    tb.innerHTML = '';

    if (error) { tb.innerHTML = `<tr><td colspan="7" style="color:red;">Error: ${error.message}</td></tr>`; return; }
    if (!insts || !insts.length) { tb.innerHTML = '<tr><td colspan="7" style="text-align:center;">Base de datos vacía.</td></tr>'; return; }

    // Mapas auxiliares
    const techMap = {};
    const opts = document.getElementById('techSelect').options;
    for(let i=0; i<opts.length; i++) techMap[opts[i].value] = opts[i].text.replace('🔧 ', '');

    const { data: equips } = await sb.from('equipment').select('institution_id');
    const equipCounts = {};
    equips?.forEach(e => equipCounts[e.institution_id] = (equipCounts[e.institution_id] || 0) + 1);

    insts.forEach(i => {
        const safePhone = i.phone || '';
        let techName = '<span style="color:#cbd5e1;">Manual</span>';
        if (i.default_technician_id && techMap[i.default_technician_id]) techName = `<b>${techMap[i.default_technician_id]}</b>`;
        const eCount = equipCounts[i.id] || 0;

        tb.innerHTML += `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px;"><b>${i.id}</b></td>
                <td style="padding:12px; font-weight:600; color:#1e293b;">${i.name}</td>
                <td style="padding:12px;">${safePhone}</td>
                <td style="padding:12px; font-size:13px;">${techName}</td>
                <td style="padding:12px;">
                    <button onclick="openEquipModal(${i.id}, '${i.name}')" class="btn" style="background:#fff7ed; color:#c2410c; padding:5px 10px; font-size:12px; border:1px solid #fed7aa;">
                        <i class="fas fa-print"></i> Equipos (${eCount})
                    </button>
                </td>
                <td style="padding:12px;">
                    <button onclick="openDeptModal(${i.id}, '${i.name}')" class="btn" style="background:#e0f2fe; color:#0369a1; padding:5px 10px; font-size:12px; border:1px solid #bae6fd;">
                        <i class="fas fa-sitemap"></i> Áreas
                    </button>
                </td>
                <td style="padding:12px; text-align:center;">
                    <button onclick="startEdit(${i.id}, '${i.name}', '${safePhone}', '${i.address||''}', '${i.default_technician_id||''}')" title="Editar" style="cursor:pointer; border:none; background:none; color:#f59e0b; margin-right:10px;"><i class="fas fa-pen"></i></button>
                    <button onclick="delInst(${i.id})" title="Eliminar" style="cursor:pointer; border:none; background:none; color:#ef4444;"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
    });
}

// ==========================================
// 3. GESTIÓN DE EQUIPOS (MODAL AVANZADO)
// ==========================================

window.openEquipModal = async (id, name) => {
    currentInstId = id; 
    document.getElementById('modalEquipInstName').innerText = name;
    document.getElementById('equipModal').style.display = 'flex';
    
    // 1. Cargar Áreas (Departamentos) para el Select
    const deptSelect = document.getElementById('newEquipDeptSelect');
    deptSelect.innerHTML = '<option value="">Cargando áreas...</option>';
    const { data: depts } = await sb.from('departments').select('*').eq('institution_id', id).order('name');
    
    deptSelect.innerHTML = '<option value="">- Seleccionar Área -</option>';
    if(depts && depts.length > 0) {
        depts.forEach(d => {
            deptSelect.innerHTML += `<option value="${d.id}">${d.name}</option>`;
        });
    } else {
        deptSelect.innerHTML = '<option value="">(Sin áreas creadas)</option>';
    }

    // 2. Cargar Lista de Equipos
    loadEquipListInternal(id);
}

async function loadEquipListInternal(instId) {
    const list = document.getElementById('equipList');
    list.innerHTML = '<div style="padding:20px; text-align:center;">Cargando...</div>';

    const { data: equips } = await sb
        .from('equipment')
        .select('*, departments(name)')
        .eq('institution_id', instId)
        .order('department_id'); 

    list.innerHTML = '';
    if (!equips || !equips.length) {
        list.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:20px;">No hay equipos registrados. Usa el formulario de arriba.</div>';
        return;
    }

    equips.forEach(e => {
        const deptName = e.departments?.name || '<span style="color:orange">Sin Área</span>';
        list.innerHTML += `
            <div class="equip-item">
                <div style="flex:1;">
                    <div style="font-weight:bold; font-size:13px; color:#1e293b;">${e.model}</div>
                    <div style="font-size:11px; color:#64748b;">SN: ${e.serial_number}</div>
                </div>
                <div style="text-align:right; margin-right:15px;">
                    <div style="font-size:10px; background:#f1f5f9; padding:3px 8px; border-radius:10px; color:#475569;">
                        <i class="fas fa-map-marker-alt"></i> ${deptName}
                    </div>
                </div>
                <button onclick="deleteEquipment(${e.id})" title="Eliminar Equipo" style="background:none; border:none; color:#ef4444; cursor:pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>`;
    });
}

// AGREGAR EQUIPO MANUALMENTE
window.addEquipmentDirect = async () => {
    const model = document.getElementById('newEquipModel').value.trim();
    const serial = document.getElementById('newEquipSerial').value.trim();
    const deptId = document.getElementById('newEquipDeptSelect').value;

    if(!model || !serial) { alert("Por favor ingresa Modelo y Serie."); return; }
    if(!deptId) { alert("Por favor selecciona un Área (Departamento)."); return; }

    const btn = document.querySelector('#equipModal .btn'); 
    const originalText = btn.innerHTML;
    btn.innerHTML = '...'; btn.disabled = true;

    try {
        const { error } = await sb.from('equipment').insert([{
            model: model,
            serial_number: serial,
            institution_id: currentInstId,
            department_id: deptId,
            status: 'installed'
        }]);

        if(error) throw error;

        // Limpiar inputs
        document.getElementById('newEquipModel').value = '';
        document.getElementById('newEquipSerial').value = '';
        
        loadEquipListInternal(currentInstId);
        loadInstitutions(); 

    } catch(err) {
        alert("Error: " + err.message);
    } finally {
        btn.innerHTML = originalText; btn.disabled = false;
    }
}

// BORRAR EQUIPO
window.deleteEquipment = async (id) => {
    if(confirm('¿Seguro que deseas eliminar este equipo del inventario?')) {
        const { error } = await sb.from('equipment').delete().eq('id', id);
        if(error) alert("Error: " + error.message);
        else {
            loadEquipListInternal(currentInstId);
            loadInstitutions(); 
        }
    }
}

// 4. EDICIÓN CLIENTE (FORMULARIO PRINCIPAL)
window.startEdit = (id, name, phone, address, techId) => {
    isEditing = true; editId = id;
    document.getElementById('name').value = name;
    document.getElementById('phone').value = phone;
    document.getElementById('address').value = address;
    document.getElementById('techSelect').value = (techId && techId !== 'null') ? techId : "";
    const btn = document.querySelector('#instForm button');
    btn.innerHTML = 'ACTUALIZAR'; btn.style.background = '#f59e0b';
    document.querySelector('.scroll-area').scrollTop = 0;
};

document.getElementById('instForm').addEventListener('submit', async(e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button'); btn.disabled = true;
    const formData = {
        name: document.getElementById('name').value, 
        phone: document.getElementById('phone').value, 
        address: document.getElementById('address').value,
        default_technician_id: document.getElementById('techSelect').value || null
    };
    try {
        if (isEditing) { await sb.from('institutions').update(formData).eq('id', editId); alert("✅ Actualizado"); } 
        else { await sb.from('institutions').insert([formData]); alert("✅ Creado"); }
        e.target.reset(); isEditing = false; btn.innerHTML = '<i class="fas fa-save"></i> Guardar'; btn.style.background = 'var(--sidebar-active)';
        loadInstitutions();
    } catch (err) { alert("Error: " + err.message); } finally { btn.disabled = false; }
});

// 5. FUNCIONES AUXILIARES
window.openDeptModal = async (id, name) => { currentInstId = id; document.getElementById('modalInstName').innerText = name; document.getElementById('deptModal').style.display = 'flex'; loadDepartmentsInternal(id); }
window.closeDeptModal = () => { document.getElementById('deptModal').style.display = 'none'; loadInstitutions(); }
async function loadDepartmentsInternal(instId) {
    const list = document.getElementById('deptList'); list.innerHTML = '<li>Cargando...</li>';
    const { data } = await sb.from('departments').select('*').eq('institution_id', instId).order('name');
    list.innerHTML = '';
    data?.forEach(d => list.innerHTML += `<li class="dept-item"><span>${d.name}</span> <button onclick="deleteDept(${d.id})" class="btn-mini-del"><i class="fas fa-times"></i></button></li>`);
}
window.addDepartment = async () => {
    const val = document.getElementById('newDeptName').value.trim(); if(!val) return;
    await sb.from('departments').insert([{ name: val, institution_id: currentInstId }]);
    document.getElementById('newDeptName').value = ''; loadDepartmentsInternal(currentInstId);
}
window.deleteDept = async (id) => { if(confirm('¿Borrar área?')) { await sb.from('departments').delete().eq('id', id); loadDepartmentsInternal(currentInstId); } }
window.delInst = async(id) => { if(confirm('¿Eliminar cliente?')) { await sb.from('institutions').delete().eq('id', id); loadInstitutions(); } };
window.viewUsers = async (id, name) => {
    document.getElementById('usersModal').style.display = 'flex';
    const list = document.getElementById('usersList'); list.innerHTML = 'Cargando...';
    const { data } = await sb.from('profiles').select('email, full_name, role').eq('institution_id', id);
    list.innerHTML = data?.map(u => `<div style="padding:10px; border-bottom:1px solid #eee;"><b>${u.full_name}</b><br><small>${u.email}</small></div>`).join('') || 'Sin usuarios.';
}
