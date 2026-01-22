// js/institutions.js - Gestión de Clientes v4.3 (Optimized & Secure)

let currentClientId = null; // Variable global para saber qué cliente estamos editando

// ==========================================
// UTILS: SEGURIDAD
// ==========================================
// Evita inyección de código HTML malicioso en los nombres
const escapeHTML = (str) => {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión
    const { data: { session } } = await sb.auth.getSession();
    
    // 2. Cargas Iniciales
    await loadTechniciansForSelect();
    await loadInstitutions();
});

// ==========================================
// 1. GESTIÓN PRINCIPAL (INSTITUCIONES)
// ==========================================

async function loadTechniciansForSelect() {
    const select = document.getElementById('techSelect');
    
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
            select.innerHTML += `<option value="${t.id}">${escapeHTML(t.full_name)}</option>`;
        });
    }
}

async function loadInstitutions() {
    const tbody = document.getElementById('instTable');
    tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color:#94a3b8;">Cargando cartera de clientes...</td></tr>';
    
    // Usamos range para asegurar que traiga más de 100 resultados por defecto
    const { data: clients, error } = await sb
        .from('institutions')
        .select(`
            *,
            technician:profiles!institutions_technician_id_fkey(full_name)
        `)
        .order('name')
        .range(0, 999);

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
        const techName = c.technician ? escapeHTML(c.technician.full_name) : '<span style="color:#ef4444; font-size:11px; font-weight:bold;">SIN ASIGNAR</span>';
        
        const row = `
            <tr>
                <td style="font-weight:600; color:#0f172a;">${escapeHTML(c.name)}</td>
                <td>
                    <div style="font-size:12px;">${escapeHTML(c.phone || '-')}</div>
                    <div style="font-size:11px; color:#64748b;">${escapeHTML(c.address || '')}</div>
                </td>
                <td><i class="fas fa-user-hard-hat" style="color:#cbd5e1;"></i> ${techName}</td>
                <td style="text-align:center;">
                    <button class="btn-icon-del" onclick="openEquipModal('${c.id}', '${escapeHTML(c.name)}')" style="color:#3b82f6;" title="Ver Equipos">
                        <i class="fas fa-print"></i> Ver Inventario
                    </button>
                </td>
                <td style="text-align:center;">
                    <button class="btn-icon-del" onclick="openDeptModal('${c.id}', '${escapeHTML(c.name)}')" style="color:#10b981;" title="Ver Áreas">
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
        loadInstitutions();
    }
    
    btn.innerHTML = originalText;
    btn.disabled = false;
});

window.deleteInstitution = async (id) => {
    if(confirm("⚠️ ¿Estás seguro de eliminar este cliente?\n\nSi eliminas al cliente, se borrarán automáticamente todos sus equipos y áreas vinculadas.")) {
        const { error } = await sb.from('institutions').delete().eq('id', id);
        
        if(error) {
            // Manejo específico si falla la Foreing Key (si no corrieron el SQL de cascada)
            if(error.code === '23503') { 
                alert("❌ Error de Base de Datos: No se puede eliminar porque tiene equipos o áreas vinculadas.\n\nSolución: Ejecuta el script SQL 'ON DELETE CASCADE' en Supabase.");
            } else {
                alert("Error: " + error.message);
            }
        } else {
            loadInstitutions();
        }
    }
};

// ==========================================
// 2. GESTIÓN DE MODALES (COMMON)
// ==========================================

window.closeModal = (modalId) => {
    document.getElementById(modalId).style.display = 'none';
    currentClientId = null; // Limpiar referencia global
    // Limpiar contenido para evitar "flasheo" de datos viejos al reabrir
    if(modalId === 'equipModal') document.getElementById('equipList').innerHTML = '';
    if(modalId === 'deptModal') document.getElementById('deptList').innerHTML = '';
};

// ==========================================
// 3. GESTIÓN DE EQUIPOS
// ==========================================

window.openEquipModal = async (id, name) => {
    currentClientId = id;
    document.getElementById('lblEquipClient').innerHTML = name; // Ya viene sanitizado desde el onclick
    document.getElementById('equipModal').style.display = 'flex';
    
    loadEquipList(id);
    loadDeptSelect(id);
};

async function loadEquipList(clientId) {
    const div = document.getElementById('equipList');
    div.innerHTML = '<div style="padding:10px; text-align:center;">Cargando inventario...</div>';

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
        const deptName = eq.departments ? escapeHTML(eq.departments.name) : 'General / Sin Área';
        div.innerHTML += `
            <div class="list-item">
                <div>
                    <strong style="color:#0f172a;">${escapeHTML(eq.model)}</strong> 
                    <span style="font-size:12px; color:#64748b;">(S/N: ${escapeHTML(eq.serial)})</span>
                    <br><span class="tag-dept">${deptName}</span>
                </div>
                <button class="btn-icon-del" onclick="deleteEquip('${eq.id}')" title="Eliminar Equipo">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });
}

window.addEquipmentDirect = async () => {
    const model = document.getElementById('newEquipModel').value.trim();
    const serial = document.getElementById('newEquipSerial').value.trim();
    const deptId = document.getElementById('newEquipDept').value;

    if(!currentClientId) return alert("Error de sesión. Cierre y reabra el modal.");
    if(!model) return alert("Por favor ingrese al menos el modelo.");

    const { error } = await sb.from('equipment').insert([{
        institution_id: currentClientId,
        model: model,
        serial: serial,
        department_id: deptId || null,
        status: 'active'
    }]);

    if(error) {
        alert("Error: " + error.message);
    } else {
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
// 4. GESTIÓN DE DEPARTAMENTOS
// ==========================================

window.openDeptModal = (id, name) => {
    currentClientId = id;
    document.getElementById('lblDeptClient').innerHTML = name;
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
                <span><i class="fas fa-folder" style="color:#fbbf24; margin-right:10px;"></i> ${escapeHTML(d.name)}</span>
                <button class="btn-icon-del" onclick="deleteDept('${d.id}')"><i class="fas fa-trash"></i></button>
            </div>
        `;
    });
}

window.addDepartment = async () => {
    const name = document.getElementById('newDeptName').value.trim();
    if(!currentClientId) return alert("Error de sesión.");
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

async function loadDeptSelect(clientId) {
    const sel = document.getElementById('newEquipDept');
    sel.innerHTML = '<option value="">Cargando...</option>';
    
    const { data: depts } = await sb.from('departments').select('id, name').eq('institution_id', clientId).order('name');
    
    sel.innerHTML = '<option value="">- General / Sin Área -</option>';
    if(depts) {
        depts.forEach(d => sel.innerHTML += `<option value="${d.id}">${escapeHTML(d.name)}</option>`);
    }
}

// ==========================================
// 5. UTILIDADES
// ==========================================

window.logout = async () => {
    await sb.auth.signOut();
    window.location.href = 'index.html';
};
