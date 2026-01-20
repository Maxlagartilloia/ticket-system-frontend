// js/institutions.js - Gestión de Clientes v4.1 (Restaurado)

let currentClientId = null; // Variable global para saber qué cliente estamos editando en los modales

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión (aunque security.js ya lo hace, cargamos datos extra si hace falta)
    const { data: { session } } = await sb.auth.getSession();
    
    // 2. Cargas Iniciales
    await loadTechniciansForSelect();
    await loadInstitutions();
});

// ==========================================
// 1. GESTIÓN PRINCIPAL (INSTITUCIONES)
// ==========================================

// Cargar técnicos en el select del formulario de creación
async function loadTechniciansForSelect() {
    const select = document.getElementById('techSelect');
    
    // Traemos solo perfiles con rol de técnico
    const { data: techs, error } = await sb
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'technician');
    
    if (error) {
        console.error("Error cargando técnicos:", error);
        return;
    }

    select.innerHTML = '<option value="">-- Asignar Técnico (Opcional) --</option>';
    if (techs && techs.length > 0) {
        techs.forEach(t => {
            select.innerHTML += `<option value="${t.id}">${t.full_name}</option>`;
        });
    }
}

// Cargar la tabla principal de clientes
async function loadInstitutions() {
    const tbody = document.getElementById('instTable');
    tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color:#94a3b8;">Cargando cartera de clientes...</td></tr>';
    
    // Consulta con relación a la tabla profiles para sacar el nombre del técnico
    const { data: clients, error } = await sb
        .from('institutions')
        .select(`
            *,
            technician:profiles(full_name)
        `)
        .order('name');

    if (error) {
        console.error("Error cargando clientes:", error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Error: ${error.message}</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    if (!clients || clients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No hay clientes registrados.</td></tr>`;
        return;
    }

    clients.forEach(c => {
        // Validar si hay técnico asignado
        const techName = c.technician ? c.technician.full_name : '<span style="color:#ef4444; font-size:11px; font-weight:bold;">SIN ASIGNAR</span>';
        
        const row = `
            <tr>
                <td style="font-weight:600; color:#0f172a;">${c.name}</td>
                <td>
                    <div style="font-size:12px;">${c.phone || '-'}</div>
                    <div style="font-size:11px; color:#64748b;">${c.address || ''}</div>
                </td>
                <td><i class="fas fa-user-hard-hat" style="color:#cbd5e1;"></i> ${techName}</td>
                <td style="text-align:center;">
                    <button class="btn-icon-del" onclick="openEquipModal('${c.id}', '${c.name}')" style="color:#3b82f6;" title="Ver Equipos">
                        <i class="fas fa-print"></i> Ver Inventario
                    </button>
                </td>
                <td style="text-align:center;">
                    <button class="btn-icon-del" onclick="openDeptModal('${c.id}', '${c.name}')" style="color:#10b981;" title="Ver Áreas">
                        <i class="fas fa-sitemap"></i> Ver Áreas
                    </button>
                </td>
                <td style="text-align:center;">
                    <button class="btn-icon-del" onclick="deleteInstitution('${c.id}')" title="Eliminar Cliente">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Crear nueva Institución
document.getElementById('instForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerText = "Guardando...";
    btn.disabled = true;

    const newClient = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        technician_id: document.getElementById('techSelect').value || null
    };

    const { error } = await sb.from('institutions').insert([newClient]);

    if (error) {
        alert("Error al guardar: " + error.message);
    } else {
        alert("✅ Cliente registrado exitosamente.");
        e.target.reset();
        loadInstitutions(); // Recargar tabla
    }
    
    btn.innerHTML = originalText;
    btn.disabled = false;
});

// Borrar Institución
window.deleteInstitution = async (id) => {
    if(confirm("⚠️ ¿Estás seguro de eliminar este cliente?\nSe borrarán permanentemente también sus equipos y áreas vinculadas.")) {
        const { error } = await sb.from('institutions').delete().eq('id', id);
        if(error) alert("Error: " + error.message);
        else loadInstitutions();
    }
};

// ==========================================
// 2. GESTIÓN DE EQUIPOS (MODAL)
// ==========================================

window.openEquipModal = async (id, name) => {
    currentClientId = id;
    document.getElementById('lblEquipClient').innerText = name;
    document.getElementById('equipModal').style.display = 'flex';
    
    // Cargar listas necesarias
    loadEquipList(id);
    loadDeptSelect(id); // Llenar el combo de áreas para el formulario de agregar rápido
};

async function loadEquipList(clientId) {
    const div = document.getElementById('equipList');
    div.innerHTML = '<div style="padding:10px; text-align:center;">Cargando inventario...</div>';

    // Traer equipos y unir con nombre del departamento
    const { data: equips, error } = await sb
        .from('equipment')
        .select('*, departments(name)')
        .eq('institution_id', clientId)
        .order('model');

    div.innerHTML = '';
    if (!equips || equips.length === 0) {
        div.innerHTML = '<div style="padding:15px; text-align:center; color:#94a3b8;">No hay equipos registrados para este cliente.</div>';
        return;
    }

    equips.forEach(eq => {
        const deptName = eq.departments ? eq.departments.name : 'General / Sin Área';
        div.innerHTML += `
            <div class="list-item">
                <div>
                    <strong style="color:#0f172a;">${eq.model}</strong> 
                    <span style="font-size:12px; color:#64748b;">(S/N: ${eq.serial})</span>
                    <br><span class="tag-dept">${deptName}</span>
                </div>
                <button class="btn-icon-del" onclick="deleteEquip('${eq.id}')" title="Eliminar Equipo">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });
}

// Agregar Equipo Rápido (Desde Modal)
window.addEquipmentDirect = async () => {
    const model = document.getElementById('newEquipModel').value;
    const serial = document.getElementById('newEquipSerial').value;
    const deptId = document.getElementById('newEquipDept').value;

    if(!model) return alert("Por favor ingrese al menos el modelo.");

    const { error } = await sb.from('equipment').insert([{
        institution_id: currentClientId,
        model: model,
        serial: serial,
        department_id: deptId || null,
        status: 'active' // Estado por defecto
    }]);

    if(error) {
        alert("Error: " + error.message);
    } else {
        // Limpiar campos y recargar lista
        document.getElementById('newEquipModel').value = '';
        document.getElementById('newEquipSerial').value = '';
        loadEquipList(currentClientId);
    }
};

window.deleteEquip = async (id) => {
    if(confirm("¿Borrar este equipo del inventario?")) {
        await sb.from('equipment').delete().eq('id', id);
        loadEquipList(currentClientId);
    }
};

// ==========================================
// 3. GESTIÓN DE DEPARTAMENTOS / ÁREAS (MODAL)
// ==========================================

window.openDeptModal = (id, name) => {
    currentClientId = id;
    document.getElementById('lblDeptClient').innerText = name;
    document.getElementById('deptModal').style.display = 'flex';
    loadDeptList(id);
};

async function loadDeptList(clientId) {
    const div = document.getElementById('deptList');
    div.innerHTML = '<div style="text-align:center; color:#94a3b8;">Cargando áreas...</div>';
    
    const { data: depts } = await sb
        .from('departments')
        .select('*')
        .eq('institution_id', clientId)
        .order('name');
    
    div.innerHTML = '';
    if(!depts || depts.length === 0) {
        div.innerHTML = '<div style="padding:15px; color:#cbd5e1; text-align:center;">Sin áreas registradas.</div>';
        return;
    }
    
    depts.forEach(d => {
        div.innerHTML += `
            <div class="list-item">
                <span><i class="fas fa-folder" style="color:#fbbf24; margin-right:10px;"></i> ${d.name}</span>
                <button class="btn-icon-del" onclick="deleteDept('${d.id}')"><i class="fas fa-trash"></i></button>
            </div>
        `;
    });
}

window.addDepartment = async () => {
    const name = document.getElementById('newDeptName').value;
    if(!name) return alert("Escriba un nombre para el área.");

    const { error } = await sb.from('departments').insert([{ institution_id: currentClientId, name: name }]);
    
    if(error) {
        alert(error.message);
    } else {
        document.getElementById('newDeptName').value = '';
        loadDeptList(currentClientId);
    }
};

window.deleteDept = async (id) => {
    if(confirm("¿Borrar esta área?")) {
        await sb.from('departments').delete().eq('id', id);
        loadDeptList(currentClientId);
    }
};

// Helper: Cargar Departamentos en el Select de "Agregar Equipo Rápido"
async function loadDeptSelect(clientId) {
    const sel = document.getElementById('newEquipDept');
    sel.innerHTML = '<option value="">Cargando...</option>';
    
    const { data: depts } = await sb.from('departments').select('id, name').eq('institution_id', clientId).order('name');
    
    sel.innerHTML = '<option value="">- General / Sin Área -</option>';
    if(depts) {
        depts.forEach(d => sel.innerHTML += `<option value="${d.id}">${d.name}</option>`);
    }
}

// ==========================================
// 4. UTILIDADES GENERALES
// ==========================================

window.logout = async () => {
    await sb.auth.signOut();
    window.location.href = 'index.html';
};
