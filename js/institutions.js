const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');
let currentInstId = null;

document.addEventListener("DOMContentLoaded", () => {
    loadInstitutions();
    loadTechniciansForSelect(); // Cargamos técnicos al inicio
});

// NUEVA FUNCIÓN: Cargar lista de técnicos en el select
async function loadTechniciansForSelect() {
    const { data: techs } = await sb.from('profiles')
        .select('id, full_name')
        .eq('role', 'technician')
        .order('full_name');
    
    const sel = document.getElementById('techSelect');
    if(sel) {
        sel.innerHTML = '<option value="">-- Sin Técnico Fijo --</option>';
        techs?.forEach(t => {
            sel.innerHTML += `<option value="${t.id}">🔧 ${t.full_name}</option>`;
        });
    }
}

// 1. CARGAR LISTA PRINCIPAL
async function loadInstitutions() {
    // JOIN con profiles para traer el nombre del técnico
    const { data: insts, error } = await sb
        .from('institutions')
        .select('*, profiles(full_name)') 
        .order('id', {ascending: false});

    if (error) { console.error(error); return; }

    const { data: depts } = await sb.from('departments').select('institution_id');
    const deptCounts = {};
    depts?.forEach(d => deptCounts[d.institution_id] = (deptCounts[d.institution_id] || 0) + 1);

    const tb = document.getElementById('instTable');
    tb.innerHTML = '';

    if (!insts || insts.length === 0) {
        tb.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#94a3b8;">No hay clientes registrados.</td></tr>';
        return;
    }

    insts.forEach(i => {
        const count = deptCounts[i.id] || 0;
        const btnColor = count > 0 ? '#e0f2fe' : '#f1f5f9';
        const btnTextColor = count > 0 ? '#0369a1' : '#64748b';
        // Mostrar nombre del técnico o "Manual"
        const assignedTech = i.profiles?.full_name || '<span style="color:#cbd5e1; font-style:italic;">Asignación Manual</span>';

        tb.innerHTML += `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px;"><b>${i.id}</b></td>
                <td style="padding:12px; font-weight:600; color:#1e293b;">${i.name}</td>
                <td style="padding:12px;">${i.phone || '<span style="color:#cbd5e1">-</span>'}</td>
                <td style="padding:12px; font-size:13px; color:#475569;"><i class="fas fa-user-cog"></i> ${assignedTech}</td>
                <td style="padding:12px;">
                    <button onclick="openDeptModal(${i.id}, '${i.name}')" class="btn" 
                        style="width:auto; background:${btnColor}; color:${btnTextColor}; padding:6px 12px; font-size:12px; border:1px solid #cbd5e1;">
                        <i class="fas fa-sitemap"></i> Administrar Áreas (${count})
                    </button>
                </td>
                <td style="padding:12px; text-align:center;">
                    <button onclick="viewUsers(${i.id}, '${i.name}')" title="Ver Usuarios" style="cursor:pointer; border:none; background:none; color:#3b82f6; margin-right:8px;">
                        <i class="fas fa-users"></i>
                    </button>
                    <button onclick="delInst(${i.id})" title="Eliminar Cliente" style="cursor:pointer; border:none; background:none; color:#ef4444;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    });
}

// 2. CREAR NUEVO CLIENTE (Actualizado con Técnico)
document.getElementById('instForm').addEventListener('submit', async(e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ...'; btn.disabled = true;

    const techId = document.getElementById('techSelect').value || null;

    try {
        const { error } = await sb.from('institutions').insert([{ 
            name: document.getElementById('name').value, 
            phone: document.getElementById('phone').value, 
            address: document.getElementById('address').value,
            default_technician_id: techId // Guardamos la asignación automática
        }]);
        
        if(error) throw error;
        
        e.target.reset(); 
        await loadInstitutions();
        
    } catch (err) {
        alert("Error al guardar: " + err.message);
    } finally {
        btn.innerHTML = originalText; btn.disabled = false;
    }
});

// 3. GESTIÓN DE DEPARTAMENTOS (Sin cambios)
window.openDeptModal = async (id, name) => {
    currentInstId = id; 
    document.getElementById('modalInstName').innerText = name;
    document.getElementById('deptModal').style.display = 'flex'; 
    loadDepartmentsInternal(id);
}

window.closeDeptModal = () => { 
    document.getElementById('deptModal').style.display = 'none'; 
    loadInstitutions();
}

async function loadDepartmentsInternal(instId) {
    const list = document.getElementById('deptList'); 
    list.innerHTML = '<li style="padding:15px; text-align:center;">Cargando...</li>';
    
    const { data } = await sb.from('departments').select('*').eq('institution_id', instId).order('name');
    
    list.innerHTML = '';
    if(!data || !data.length) {
        list.innerHTML = '<li style="padding:15px; text-align:center; color:#94a3b8; font-style:italic;">No hay áreas registradas.</li>';
        return;
    }

    data.forEach(d => { 
        list.innerHTML += `
            <li class="dept-item">
                <span style="font-weight:500;">${d.name}</span> 
                <button onclick="deleteDept(${d.id})" class="btn-mini-del" title="Borrar Área"><i class="fas fa-times"></i></button>
            </li>`; 
    });
}

window.addDepartment = async () => {
    const input = document.getElementById('newDeptName');
    const val = input.value.trim();
    if(!val) return;
    
    const { error } = await sb.from('departments').insert([{ name: val, institution_id: currentInstId }]);
    
    if(error) alert("Error: " + error.message);
    else {
        input.value = ''; 
        loadDepartmentsInternal(currentInstId);
    }
}

window.deleteDept = async (id) => { 
    if(confirm('¿Seguro que deseas borrar este departamento?')) { 
        const { error } = await sb.from('departments').delete().eq('id', id);
        if(error) alert("No se puede borrar: Probablemente hay equipos asignados a esta área.");
        else loadDepartmentsInternal(currentInstId); 
    } 
}

// 4. VER USUARIOS (Sin cambios)
window.viewUsers = async (id, name) => {
    document.getElementById('modalUserInstName').innerText = name; 
    document.getElementById('usersModal').style.display = 'flex';
    
    const list = document.getElementById('usersList'); 
    list.innerHTML = 'Cargando...';
    
    const { data } = await sb.from('profiles').select('email, full_name, role').eq('institution_id', id);
    
    if(data && data.length > 0) {
        list.innerHTML = data.map(u => `
            <div style="padding:10px; border-bottom:1px solid #eee;">
                <div style="font-weight:bold;">${u.full_name || 'Sin nombre'}</div>
                <div style="font-size:12px; color:#64748b;">${u.email} (${u.role})</div>
            </div>
        `).join('');
    } else {
        list.innerHTML = '<div style="padding:10px; color:#94a3b8;">No hay usuarios vinculados.</div>';
    }
}

// 5. BORRAR INSTITUCIÓN (Sin cambios)
window.delInst = async(id) => { 
    if(confirm('⛔ ¡ADVERTENCIA! \n\nEliminar este cliente borrará también:\n- Todos sus departamentos\n- Historial de tickets\n\n¿Estás realmente seguro?')) { 
        const { error } = await sb.from('institutions').delete().eq('id', id);
        if (error) {
            alert("Error al eliminar: " + error.message);
        } else {
            loadInstitutions(); 
        }
    } 
};
