// js/institutions.js - Gestión de Clientes v4.0

let currentClientId = null; // Para saber qué cliente estamos editando en los modales

document.addEventListener('DOMContentLoaded', async () => {
    // Info Usuario
    const { data: { session } } = await sb.auth.getSession();
    if(session) { /* Security.js maneja el nombre */ }

    // Cargas Iniciales
    loadTechniciansForSelect();
    loadInstitutions();
});

// 1. CARGAR TÉCNICOS EN EL SELECT
async function loadTechniciansForSelect() {
    const select = document.getElementById('techSelect');
    const { data: techs } = await sb.from('profiles').select('*').eq('role', 'technician');
    
    select.innerHTML = '<option value="">-- Sin Asignar --</option>';
    if (techs) {
        techs.forEach(t => {
            select.innerHTML += `<option value="${t.id}">${t.full_name}</option>`;
        });
    }
}

// 2. CARGAR INSTITUCIONES (TABLA PRINCIPAL)
async function loadInstitutions() {
    const tbody = document.getElementById('instTable');
    
    // Traemos instituciones y unimos con el nombre del técnico
    // Nota: Esto asume que tienes una tabla 'institutions'. Si usas 'profiles' para clientes, ajusta la query.
    // Asumiré tabla 'institutions' separada o 'profiles' con role='client'.
    // PLAN MAESTRO: Usamos tabla 'institutions' para las EMPRESAS y 'profiles' para los USUARIOS.
    
    const { data: clients, error } = await sb
        .from('institutions')
        .select(`
            *,
            technician:technician_id(full_name)
        `)
        .order('name');

    if (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Error: ${error.message}</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    if (clients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No hay clientes registrados.</td></tr>`;
        return;
    }

    clients.forEach(c => {
        const techName = c.technician ? c.technician.full_name : '<span style="color:#ef4444; font-size:11px;">SIN ASIGNAR</span>';
        
        const row = `
            <tr>
                <td style="font-weight:600; color:#0f172a;">${c.name}</td>
                <td>
                    <div style="font-size:12px;">${c.phone || '-'}</div>
                    <div style="font-size:11px; color:#64748b;">${c.address || ''}</div>
                </td>
                <td><i class="fas fa-user-hard-hat" style="color:#cbd5e1;"></i> ${techName}</td>
                <td style="text-align:center;">
                    <button class="btn-icon-del" onclick="openEquipModal('${c.id}', '${c.name}')" style="color:#3b82f6;">
                        <i class="fas fa-print"></i> Ver Equipos
                    </button>
                </td>
                <td style="text-align:center;">
                    <button class="btn-icon-del" onclick="openDeptModal('${c.id}', '${c.name}')" style="color:#10b981;">
                        <i class="fas fa-sitemap"></i> Ver Áreas
                    </button>
                </td>
                <td style="text-align:center;">
                    <button class="btn-icon-del" onclick="deleteInstitution('${c.id}')" title="Eliminar"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// 3. CREAR INSTITUCIÓN
document.getElementById('instForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newClient = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        technician_id: document.getElementById('techSelect').value || null
    };

    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerText = "Guardando...";
    btn.disabled = true;

    const { error } = await sb.from('institutions').insert([newClient]);

    if (error) {
        alert("Error: " + error.message);
    } else {
        alert("✅ Cliente registrado.");
        e.target.reset();
        loadInstitutions();
    }
    btn.innerHTML = '<i class="fas fa-save"></i> Guardar';
    btn.disabled = false;
});

// 4. GESTIÓN DE EQUIPOS (MODAL)
window.openEquipModal = async (id, name) => {
    currentClientId = id;
    document.getElementById('lblEquipClient').innerText = name;
    document.getElementById('equipModal').style.display = 'flex';
    loadEquipList(id);
    loadDeptSelect(id); // Para el combo de agregar equipo
};

async function loadEquipList(clientId) {
    const div = document.getElementById('equipList');
    div.innerHTML = '<div style="padding:10px; text-align:center;">Cargando...</div>';

    const { data: equips } = await sb
        .from('equipment')
        .select('*, departments(name)') // Join con departamentos
        .eq('institution_id', clientId);

    div.innerHTML = '';
    if (!equips || equips.length === 0) {
        div.innerHTML = '<div style="padding:15px; text-align:center; color:#94a3b8;">No hay equipos registrados.</div>';
        return;
    }

    equips.forEach(eq => {
        const deptName = eq.departments ? eq.departments.name : 'General';
        div.innerHTML += `
            <div class="list-item">
                <div>
                    <strong>${eq.model}</strong> <span style="font-size:12px; color:#64748b;">(S/N: ${eq.serial})</span>
                    <br><span class="tag-dept">${deptName}</span>
                </div>
                <button class="btn-icon-del" onclick="deleteEquip('${eq.id}')"><i class="fas fa-times"></i></button>
            </div>
        `;
    });
}

window.addEquipmentDirect = async () => {
    const model = document.getElementById('newEquipModel').value;
    const serial = document.getElementById('newEquipSerial').value;
    const deptId = document.getElementById('newEquipDept').value;

    if(!model) return alert("Ingrese el modelo");

    const { error } = await sb.from('equipment').insert([{
        institution_id: currentClientId,
        model: model,
        serial: serial,
        department_id: deptId || null
    }]);

    if(error) alert(error.message);
    else {
        document.getElementById('newEquipModel').value = '';
        document.getElementById('newEquipSerial').value = '';
        loadEquipList(currentClientId);
    }
};

// 5. GESTIÓN DE DEPARTAMENTOS (MODAL)
window.openDeptModal = (id, name) => {
    currentClientId = id;
    document.getElementById('lblDeptClient').innerText = name;
    document.getElementById('deptModal').style.display = 'flex';
    loadDeptList(id);
};

async function loadDeptList(clientId) {
    const div = document.getElementById('deptList');
    div.innerHTML = 'Cargando...';
    
    const { data: depts } = await sb.from('departments').select('*').eq('institution_id', clientId);
    
    div.innerHTML = '';
    if(!depts || depts.length === 0) div.innerHTML = '<div style="padding:15px; color:#cbd5e1;">Sin áreas registradas.</div>';
    
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
    if(!name) return;

    const { error } = await sb.from('departments').insert([{ institution_id: currentClientId, name: name }]);
    
    if(error) alert(error.message);
    else {
        document.getElementById('newDeptName').value = '';
        loadDeptList(currentClientId);
    }
};

// Helper: Cargar Departamentos en el Select de Equipos
async function loadDeptSelect(clientId) {
    const sel = document.getElementById('newEquipDept');
    const { data: depts } = await sb.from('departments').select('*').eq('institution_id', clientId);
    sel.innerHTML = '<option value="">- Sin Área -</option>';
    if(depts) depts.forEach(d => sel.innerHTML += `<option value="${d.id}">${d.name}</option>`);
}

// Utilitarios de Borrado (Simples)
window.deleteInstitution = async (id) => { if(confirm("¿Eliminar cliente?")) { await sb.from('institutions').delete().eq('id', id); loadInstitutions(); } };
window.deleteEquip = async (id) => { if(confirm("¿Borrar equipo?")) { await sb.from('equipment').delete().eq('id', id); loadEquipList(currentClientId); } };
window.deleteDept = async (id) => { if(confirm("¿Borrar área?")) { await sb.from('departments').delete().eq('id', id); loadDeptList(currentClientId); } };
window.logout = async () => { await sb.auth.signOut(); window.location.href = 'index.html'; };
