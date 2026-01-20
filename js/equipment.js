// js/equipment.js - Gestión de Inventario v4.0

let allEquipment = []; // Cache local para filtros rápidos

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar Combos
    await loadClientsCombo();
    // 2. Cargar Datos
    loadEquipment();
});

// 1. CARGAR DATOS
async function loadEquipment() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Actualizando inventario...</td></tr>';

    const { data, error } = await sb
        .from('equipment')
        .select(`
            *,
            institutions(name),
            departments(name)
        `)
        .order('model');

    if (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Error: ${error.message}</td></tr>`;
        return;
    }

    allEquipment = data;
    filterEquipment(); // Renderizar con filtros aplicados
}

// 2. FILTRADO Y RENDERIZADO
window.filterEquipment = function() {
    const clientFilter = document.getElementById('filterClient').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const tbody = document.getElementById('tableBody');

    // Filtrar en memoria
    const filtered = allEquipment.filter(eq => {
        const matchClient = clientFilter === "" || eq.institution_id === clientFilter;
        // Asumimos campo 'status'. Si no existe en DB, trátalo como 'active' por defecto.
        const eqStatus = eq.status || 'active'; 
        const matchStatus = statusFilter === "" || eqStatus === statusFilter;
        return matchClient && matchStatus;
    });

    document.getElementById('countBadge').innerText = `${filtered.length} equipos`;
    tbody.innerHTML = '';

    if(filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">No se encontraron equipos.</td></tr>';
        return;
    }

    filtered.forEach(eq => {
        const clientName = eq.institutions?.name || 'Sin Asignar';
        const deptName = eq.departments?.name ? ` • ${eq.departments.name}` : '';
        const status = eq.status || 'active';
        
        let stClass = 'st-active';
        let stText = 'En Sitio';
        if(status === 'workshop') { stClass = 'st-workshop'; stText = 'En Taller'; }
        if(status === 'retired') { stClass = 'st-retired'; stText = 'Baja'; }

        const row = `
            <tr>
                <td>
                    <div style="font-weight:700; color:#0f172a;">${eq.model}</div>
                    <div style="font-size:11px; color:#64748b;">S/N: ${eq.serial}</div>
                </td>
                <td>
                    <div style="font-weight:600;">${clientName}</div>
                    <div style="font-size:11px; color:#64748b;">${deptName}</div>
                </td>
                <td style="font-family:monospace;">${eq.ip_address || '--'}</td>
                <td><span class="status-pill ${stClass}">${stText}</span></td>
                <td style="text-align:center;">
                    <button class="btn-icon btn-swap" onclick="openSwapModal('${eq.id}', '${eq.model}')" title="Mover / Dar Baja">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
};

// 3. CARGAR COMBOS
async function loadClientsCombo() {
    const select = document.getElementById('filterClient');
    const newSelect = document.getElementById('newClientSelect');
    
    const { data: clients } = await sb.from('institutions').select('id, name').order('name');
    
    if(clients) {
        clients.forEach(c => {
            const opt = `<option value="${c.id}">${c.name}</option>`;
            select.innerHTML += opt;
            newSelect.innerHTML += opt;
        });
    }
}

window.loadDeptsForNew = async (clientId) => {
    const select = document.getElementById('newDeptSelect');
    select.innerHTML = '<option value="">Cargando...</option>';
    select.disabled = true;

    if(!clientId) {
        select.innerHTML = '<option value="">-- Seleccione Cliente --</option>';
        return;
    }

    const { data: depts } = await sb.from('departments').select('id, name').eq('institution_id', clientId);
    
    select.innerHTML = '<option value="">-- General / Sin Área --</option>';
    if(depts) {
        depts.forEach(d => select.innerHTML += `<option value="${d.id}">${d.name}</option>`);
    }
    select.disabled = false;
};

// 4. NUEVO EQUIPO
document.getElementById('newEquipForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newEquip = {
        institution_id: document.getElementById('newClientSelect').value,
        department_id: document.getElementById('newDeptSelect').value || null,
        model: `${document.getElementById('newBrand').value} ${document.getElementById('newModel').value}`,
        serial: document.getElementById('newSerial').value,
        ip_address: document.getElementById('newIp').value,
        status: 'active'
    };

    const { error } = await sb.from('equipment').insert([newEquip]);

    if(error) alert("Error: " + error.message);
    else {
        alert("✅ Equipo registrado exitosamente.");
        closeModal('newModal');
        loadEquipment();
    }
});

// 5. MOVIMIENTOS
window.openSwapModal = (id, model) => {
    document.getElementById('swapEquipId').value = id;
    document.getElementById('swapEquipName').innerText = model;
    document.getElementById('swapModal').style.display = 'flex';
};

document.getElementById('swapForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('swapEquipId').value;
    const status = document.getElementById('swapAction').value;
    // Aquí podrías guardar un log en una tabla 'equipment_history' si quisieras auditoría
    
    const { error } = await sb.from('equipment').update({ status: status }).eq('id', id);

    if(error) alert("Error: " + error.message);
    else {
        alert("✅ Estado actualizado.");
        closeModal('swapModal');
        loadEquipment();
    }
});

// UTILIDADES
window.openNewModal = () => document.getElementById('newModal').style.display = 'flex';
window.closeModal = (id) => document.getElementById(id).style.display = 'none';
window.logout = async () => { await sb.auth.signOut(); window.location.href = 'index.html'; };
