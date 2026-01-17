const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');

document.addEventListener("DOMContentLoaded", () => {
    loadEquipment();
    
    // Setear fecha de hoy por defecto en el modal
    document.getElementById('installDate').valueAsDate = new Date();
});

// --- CARGAR INVENTARIO ---
async function loadEquipment() {
    // Traemos equipos activos (no en taller/baja)
    const { data } = await sb.from('equipment')
        .select('*, institutions(name), departments(name)')
        .eq('status', 'installed') 
        .order('id', { ascending: false });

    const tb = document.getElementById('equipTable');
    tb.innerHTML = '';

    if (!data || data.length === 0) {
        tb.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay equipos instalados.</td></tr>';
        return;
    }

    data.forEach(e => {
        tb.innerHTML += `
            <tr>
                <td>
                    <div style="font-weight:700;">${e.institutions?.name}</div>
                    <div style="font-size:12px; color:#64748b;">${e.departments?.name}</div>
                </td>
                <td>
                    <div style="font-weight:600;">${e.brand} ${e.model}</div>
                </td>
                <td>
                    <div>SN: ${e.serial_number}</div>
                    <div style="font-size:11px; color:#3b82f6;">IP: ${e.ip_address || 'N/A'}</div>
                </td>
                <td>
                    <div>${new Date(e.installation_date).toLocaleDateString()}</div>
                    <div style="font-size:11px;">Ini: ${e.initial_meter_reading}</div>
                </td>
                <td style="text-align:center;">
                    <button onclick="openSwapModal(${e.id}, '${e.model}', '${e.departments?.name}', ${e.department_id})" title="Rotar/Retirar" class="btn" style="width:auto; display:inline-block; padding:8px; background:#fef3c7; color:#d97706; border:1px solid #fcd34d;">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button onclick="showHistory(${e.id})" title="Historial" class="btn" style="width:auto; display:inline-block; padding:8px; background:#f1f5f9; color:#64748b; border:1px solid #cbd5e1;">
                        <i class="fas fa-history"></i>
                    </button>
                </td>
            </tr>`;
    });
}

// --- ALTA DE EQUIPO NUEVO ---
document.getElementById('equipForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Insertar Equipo
    const { data, error } = await sb.from('equipment').insert([{
        institution_id: document.getElementById('instSelect').value,
        department_id: document.getElementById('deptSelect').value,
        brand: document.getElementById('brand').value,
        model: document.getElementById('model').value,
        serial_number: document.getElementById('serial').value,
        ip_address: document.getElementById('ip').value,
        installation_date: document.getElementById('installDate').value,
        initial_meter_reading: document.getElementById('initMeter').value,
        status: 'installed'
    }]).select();

    if (error) alert("Error: " + error.message);
    else {
        // 2. Registrar Log de Instalación
        await sb.from('equipment_logs').insert([{
            equipment_id: data[0].id,
            new_dept_id: document.getElementById('deptSelect').value,
            event_type: 'installation',
            meter_reading: document.getElementById('initMeter').value,
            reason: 'Instalación Inicial'
        }]);

        closeModal('newModal');
        e.target.reset();
        loadEquipment();
    }
});

// --- ROTACIÓN (BAJA/RETIRO) ---
window.openSwapModal = (id, model, deptName, deptId) => {
    document.getElementById('swapEquipId').value = id;
    document.getElementById('swapDeptId').value = deptId;
    document.getElementById('swapModel').innerText = model;
    document.getElementById('swapDept').innerText = deptName;
    
    document.getElementById('swapModal').style.display = 'flex';
}

document.getElementById('swapForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('swapEquipId').value;
    const oldDept = document.getElementById('swapDeptId').value;
    const newStatus = document.getElementById('swapDestination').value; // workshop o retired
    const meter = document.getElementById('swapMeter').value;
    const reason = document.getElementById('swapReason').value;

    // 1. Actualizar Equipo (Quitar de Depto y Cambiar Estado)
    const { error } = await sb.from('equipment').update({
        status: newStatus,
        department_id: null // Se desvincula del departamento
    }).eq('id', id);

    if (error) alert("Error: " + error.message);
    else {
        // 2. Log de Retiro
        await sb.from('equipment_logs').insert([{
            equipment_id: id,
            previous_dept_id: oldDept,
            event_type: 'removal',
            meter_reading: meter,
            reason: reason + ` (Enviado a: ${newStatus})`
        }]);

        closeModal('swapModal');
        e.target.reset();
        loadEquipment();
        alert("Equipo retirado correctamente. Ahora puedes instalar el nuevo.");
    }
});

// --- HISTORIAL ---
window.showHistory = async (id) => {
    document.getElementById('historyModal').style.display = 'flex';
    const list = document.getElementById('historyList');
    list.innerHTML = 'Cargando...';

    const { data } = await sb.from('equipment_logs')
        .select('*, departments!new_dept_id(name), departments!previous_dept_id(name)')
        .eq('equipment_id', id)
        .order('created_at', {ascending: false});

    list.innerHTML = '';
    if(!data.length) list.innerHTML = '<li>Sin historial.</li>';

    data.forEach(log => {
        let icon = '📌';
        if(log.event_type === 'installation') icon = '✅ Instalado en: ' + (log.departments?.name || 'Sitio');
        if(log.event_type === 'removal') icon = '🔻 Retirado de: ' + (log.departments?.name || 'Sitio');

        list.innerHTML += `
            <li style="border-bottom:1px solid #eee; padding:10px 0;">
                <div style="font-weight:bold;">${new Date(log.created_at).toLocaleDateString()} - ${icon}</div>
                <div>Contador: ${log.meter_reading}</div>
                <div style="font-style:italic; color:#64748b;">"${log.reason}"</div>
            </li>`;
    });
}

// UTILIDADES MODAL
window.openNewModal = () => {
    document.getElementById('newModal').style.display = 'flex';
    loadInstitutions();
}
window.closeModal = (id) => document.getElementById(id).style.display = 'none';

async function loadInstitutions() {
    const { data } = await sb.from('institutions').select('*').order('name');
    const sel = document.getElementById('instSelect');
    sel.innerHTML = '<option value="">Seleccione Cliente...</option>';
    data.forEach(i => sel.innerHTML += `<option value="${i.id}">${i.name}</option>`);
}

window.loadDepts = async (instId) => {
    const sel = document.getElementById('deptSelect');
    sel.innerHTML = '<option>Cargando...</option>';
    const { data } = await sb.from('departments').select('*').eq('institution_id', instId);
    sel.innerHTML = '<option value="">Seleccione Área...</option>';
    data?.forEach(d => sel.innerHTML += `<option value="${d.id}">${d.name}</option>`);
    sel.disabled = false;
}
