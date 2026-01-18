const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');

let allEquipment = []; // Cache local

document.addEventListener("DOMContentLoaded", async () => {
    await loadFilterOptions();
    await loadEquipment(); 
});

// 1. CARGA INICIAL
async function loadFilterOptions() {
    const { data } = await sb.from('institutions').select('*').order('name');
    const sel = document.getElementById('filterClient');
    sel.innerHTML = '<option value="">-- Todos los Clientes --</option>';
    data.forEach(i => sel.innerHTML += `<option value="${i.id}">${i.name}</option>`);
}

async function loadEquipment() {
    // Solo mostramos 'installed' (activos en clientes)
    const { data, error } = await sb.from('equipment')
        .select('*, institutions(name), departments(name)')
        .eq('status', 'installed') 
        .order('id', { ascending: false });

    if(error) console.error(error);
    allEquipment = data || [];
    renderTable(allEquipment);
}

// 2. FILTRADO
window.filterByClient = async () => {
    const clientId = document.getElementById('filterClient').value;
    const deptSel = document.getElementById('filterDept');
    
    // Reset Deptos
    deptSel.innerHTML = '<option value="">-- Todas las Áreas --</option>';
    deptSel.disabled = true;

    if (!clientId) {
        renderTable(allEquipment);
        return;
    }

    const filtered = allEquipment.filter(e => e.institution_id == clientId);
    renderTable(filtered);

    // Cargar Deptos del cliente seleccionado
    deptSel.disabled = false;
    const { data: depts } = await sb.from('departments').select('*').eq('institution_id', clientId).order('name');
    depts.forEach(d => deptSel.innerHTML += `<option value="${d.id}">${d.name}</option>`);
}

window.filterByDept = () => {
    const clientId = document.getElementById('filterClient').value;
    const deptId = document.getElementById('filterDept').value;

    let filtered = allEquipment.filter(e => e.institution_id == clientId);
    
    if (deptId) {
        filtered = filtered.filter(e => e.department_id == deptId);
    }
    renderTable(filtered);
}

// 3. RENDER TABLA
function renderTable(data) {
    const tb = document.getElementById('equipTable');
    const countLabel = document.getElementById('resultCount');
    tb.innerHTML = '';
    countLabel.innerText = `${data.length} equipos activos`;

    if (data.length === 0) {
        tb.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">No se encontraron equipos.</td></tr>';
        return;
    }

    data.forEach(e => {
        tb.innerHTML += `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px;">
                    <div style="font-weight:700; color:#1e293b;">${e.institutions?.name || 'Sin Cliente'}</div>
                    <div style="font-size:13px; color:#3b82f6;"><i class="fas fa-map-marker-alt"></i> ${e.departments?.name || 'Sin Área'}</div>
                </td>
                <td style="padding:12px;">
                    <div style="font-weight:600;">${e.brand} ${e.model}</div>
                </td>
                <td style="padding:12px;">
                    <div style="font-family:monospace; font-weight:bold;">SN: ${e.serial_number}</div>
                    <div style="font-size:11px; color:#64748b;">IP: ${e.ip_address || '-'}</div>
                </td>
                <td style="padding:12px;">
                     <span style="background:#dcfce7; color:#166534; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:bold;">🟢 INSTALADO</span>
                     <div style="font-size:10px; margin-top:2px;">Cont: ${e.initial_meter_reading}</div>
                </td>
                <td style="padding:12px; text-align:center;">
                    <button onclick="openSwapModal(${e.id}, '${e.model}')" title="Retirar/Rotar" class="btn" style="width:auto; display:inline-block; padding:8px; background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; margin-right:5px;">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                    <button onclick="showHistory(${e.id})" title="Historial Fallas" class="btn" style="width:auto; display:inline-block; padding:8px; background:#f1f5f9; color:#475569; border:1px solid #cbd5e1;">
                        <i class="fas fa-history"></i>
                    </button>
                </td>
            </tr>`;
    });
}

// 4. NUEVO EQUIPO
window.openNewModal = () => {
    document.getElementById('newModal').style.display = 'flex';
    loadInstitutionsModal();
}
window.closeModal = (id) => document.getElementById(id).style.display = 'none';

async function loadInstitutionsModal() {
    const { data } = await sb.from('institutions').select('id, name').order('name');
    const sel = document.getElementById('instSelect');
    sel.innerHTML = '<option value="">Seleccione Cliente...</option>';
    data.forEach(i => sel.innerHTML += `<option value="${i.id}">${i.name}</option>`);
}

window.loadDepts = async (instId) => {
    const sel = document.getElementById('deptSelect');
    sel.disabled = true; sel.innerHTML = '<option>Cargando...</option>';
    
    const { data } = await sb.from('departments').select('id, name').eq('institution_id', instId).order('name');
    sel.innerHTML = '<option value="">Seleccione Área...</option>';
    data?.forEach(d => sel.innerHTML += `<option value="${d.id}">${d.name}</option>`);
    sel.disabled = false;
}

document.getElementById('equipForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('.btn-confirm');
    btn.innerHTML = 'Guardando...'; btn.disabled = true;

    const { error } = await sb.from('equipment').insert([{
        institution_id: document.getElementById('instSelect').value,
        department_id: document.getElementById('deptSelect').value,
        brand: document.getElementById('brand').value,
        model: document.getElementById('model').value,
        serial_number: document.getElementById('serial').value,
        ip_address: document.getElementById('ip').value,
        installation_date: document.getElementById('installDate').value,
        initial_meter_reading: document.getElementById('initMeter').value,
        status: 'installed',
        name: `${document.getElementById('brand').value} ${document.getElementById('model').value}` // Campo legacy
    }]);

    if (error) alert("Error: " + error.message);
    else {
        closeModal('newModal'); e.target.reset(); loadEquipment();
    }
    btn.innerHTML = 'Guardar'; btn.disabled = false;
});

// 5. ROTACIÓN / RETIRO
window.openSwapModal = (id, model) => {
    document.getElementById('swapEquipId').value = id;
    document.getElementById('swapModel').innerText = model;
    document.getElementById('swapModal').style.display = 'flex';
}

document.getElementById('swapForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('swapEquipId').value;
    const newStatus = document.getElementById('swapDestination').value;
    const reason = document.getElementById('swapReason').value;

    const { error } = await sb.from('equipment')
        .update({ 
            status: newStatus, 
            // Podríamos guardar el motivo en un log aparte, pero por ahora cambiamos estado
            // Idealmente: Crear registro en tabla 'movements' (no implementada aún en este scope simple)
        })
        .eq('id', id);

    if(error) alert("Error: " + error.message);
    else {
        alert("✅ Equipo retirado del inventario activo.");
        closeModal('swapModal'); e.target.reset(); loadEquipment();
    }
});

// 6. HISTORIAL DE FALLAS (Desde Tickets)
window.showHistory = async (equipId) => {
    const list = document.getElementById('historyList');
    list.innerHTML = '<div style="text-align:center; padding:20px;">Cargando historial...</div>';
    document.getElementById('historyModal').style.display = 'flex';

    // Buscamos tickets asociados a este equipo
    const { data: tickets } = await sb.from('tickets')
        .select('created_at, description, status, priority')
        .eq('equipment_id', equipId)
        .order('created_at', { ascending: false });

    if (!tickets || tickets.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:20px; color:#94a3b8;">Sin reportes de falla registrados.</div>';
        return;
    }

    list.innerHTML = '';
    tickets.forEach(t => {
        const date = new Date(t.created_at).toLocaleDateString();
        let color = t.status === 'open' ? 'red' : (t.status === 'closed' ? 'green' : 'orange');
        
        list.innerHTML += `
            <div style="border-bottom:1px solid #eee; padding:10px;">
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#64748b;">
                    <span>${date}</span>
                    <span style="color:${color}; font-weight:bold;">${t.status.toUpperCase()}</span>
                </div>
                <div style="margin-top:5px; font-weight:500;">${t.description}</div>
                <div style="font-size:11px; margin-top:2px;">Prioridad: ${t.priority}</div>
            </div>`;
    });
}
