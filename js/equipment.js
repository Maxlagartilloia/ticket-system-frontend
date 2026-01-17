const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');

let allEquipment = []; // Guardaremos todo aquí para filtrar rápido

document.addEventListener("DOMContentLoaded", async () => {
    await loadFilterOptions();
    await loadEquipment(); // Carga todo al inicio
});

// 1. CARGA INICIAL DE FILTROS Y DATOS
async function loadFilterOptions() {
    const { data } = await sb.from('institutions').select('*').order('name');
    const sel = document.getElementById('filterClient');
    data.forEach(i => sel.innerHTML += `<option value="${i.id}">${i.name}</option>`);
}

async function loadEquipment() {
    // Traemos TODO (Optimizado)
    const { data, error } = await sb.from('equipment')
        .select('*, institutions(name), departments(name)')
        .eq('status', 'installed') 
        .order('id', { ascending: false });

    if(error) console.error(error);
    allEquipment = data || [];
    renderTable(allEquipment);
}

// 2. LÓGICA DE FILTRADO (CARPETAS)
window.filterByClient = async () => {
    const clientId = document.getElementById('filterClient').value;
    const deptSel = document.getElementById('filterDept');
    
    // Resetear departamentos
    deptSel.innerHTML = '<option value="">-- Todas las Áreas --</option>';
    deptSel.disabled = true;

    if (!clientId) {
        // Si selecciona "Todos", mostrar todo
        renderTable(allEquipment);
        return;
    }

    // Filtrar la lista local
    const filtered = allEquipment.filter(e => e.institution_id == clientId);
    renderTable(filtered);

    // Cargar departamentos de este cliente en el segundo combo
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

// 3. PINTAR TABLA
function renderTable(data) {
    const tb = document.getElementById('equipTable');
    const countLabel = document.getElementById('resultCount');
    tb.innerHTML = '';
    countLabel.innerText = `${data.length} equipos encontrados`;

    if (data.length === 0) {
        tb.innerHTML = '<tr><td colspan="5" style="text-align:center;">No se encontraron equipos con este filtro.</td></tr>';
        return;
    }

    data.forEach(e => {
        tb.innerHTML += `
            <tr>
                <td>
                    <div style="font-weight:700; color:#1e293b;">${e.institutions?.name || 'Sin Cliente'}</div>
                    <div style="font-size:13px; color:#3b82f6;"><i class="fas fa-map-marker-alt"></i> ${e.departments?.name || 'Sin Área'}</div>
                </td>
                <td>
                    <div style="font-weight:600;">${e.brand || ''} ${e.model || 'Modelo Genérico'}</div>
                </td>
                <td>
                    <div style="font-family:monospace; font-weight:bold;">SN: ${e.serial_number || 'N/A'}</div>
                    <div style="font-size:11px; color:#64748b;">IP: ${e.ip_address || '-'}</div>
                </td>
                <td>
                     <span style="background:#dcfce7; color:#166534; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:bold;">INSTALADO</span>
                     <div style="font-size:10px; margin-top:2px;">Cont: ${e.initial_meter_reading}</div>
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

// --- FUNCIONES DE MODALES Y GESTIÓN (IDÉNTICAS AL ANTERIOR) ---
// (Solo pego lo necesario para que funcione, el resto ya lo tienes)
window.openNewModal = () => {
    document.getElementById('newModal').style.display = 'flex';
    loadInstitutionsModal();
}
window.closeModal = (id) => document.getElementById(id).style.display = 'none';

async function loadInstitutionsModal() {
    const { data } = await sb.from('institutions').select('*').order('name');
    const sel = document.getElementById('instSelect');
    sel.innerHTML = '<option value="">Seleccione Cliente...</option>';
    data.forEach(i => sel.innerHTML += `<option value="${i.id}">${i.name}</option>`);
}

window.loadDepts = async (instId) => {
    const sel = document.getElementById('deptSelect');
    sel.innerHTML = '<option>Cargando...</option>';
    const { data } = await sb.from('departments').select('*').eq('institution_id', instId).order('name');
    sel.innerHTML = '<option value="">Seleccione Área...</option>';
    data?.forEach(d => sel.innerHTML += `<option value="${d.id}">${d.name}</option>`);
    sel.disabled = false;
}

// Alta de equipo
document.getElementById('equipForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data, error } = await sb.from('equipment').insert([{
        institution_id: document.getElementById('instSelect').value,
        department_id: document.getElementById('deptSelect').value,
        brand: document.getElementById('brand').value,
        model: document.getElementById('model').value,
        serial_number: document.getElementById('serial').value,
        ip_address: document.getElementById('ip').value,
        installation_date: document.getElementById('installDate').value,
        initial_meter_reading: document.getElementById('initMeter').value,
        status: 'installed',
        name: document.getElementById('brand').value + ' ' + document.getElementById('model').value // Campo legacy
    }]).select();

    if (error) alert("Error: " + error.message);
    else {
        closeModal('newModal');
        e.target.reset();
        loadEquipment(); // Recargar lista
    }
});

// (Agrega aquí las funciones openSwapModal, showHistory y el submit de swapForm del código anterior)
// Si necesitas que te las pegue otra vez completas, avísame, pero son las mismas.
