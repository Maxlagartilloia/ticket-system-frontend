// =========================================================
// GESTIÓN DE INVENTARIO V8.0 (GAD + CSV + COUNTERS)
// =========================================================

let allEquipment = []; // Cache local
let currentEditId = null; // Para edición de contadores

document.addEventListener('DOMContentLoaded', async () => {
    // Verificamos si existe la función de seguridad, si no, intentamos auth básico
    if(typeof verifySession === 'function') await verifySession(); 
    else await sb.auth.getSession();

    await loadClientsCombo();
    loadEquipment();
});

// 1. CARGAR DATOS (Agregamos contadores y fechas)
async function loadEquipment() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> Sincronizando inventario...</td></tr>';

    // Consulta Enterprise: Trae todo + Nombres de Tablas Relacionadas + CONTADORES
    const { data, error } = await sb
        .from('equipment')
        .select(`
            *,
            institutions(name),
            departments(name)
        `)
        .order('brand', { ascending: true });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Error DB: ${error.message}</td></tr>`;
        return;
    }

    allEquipment = data;
    filterEquipment(); // Renderiza la tabla
}

// 2. FILTRADO Y RENDERIZADO (Tu lógica visual + Contadores)
window.filterEquipment = function() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const clientFilter = document.getElementById('filterClient').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const tbody = document.getElementById('tableBody');

    const filtered = allEquipment.filter(eq => {
        const matchClient = clientFilter === "" || eq.institution_id === clientFilter;
        const eqStatus = eq.status || 'active'; 
        const matchStatus = statusFilter === "" || eqStatus === statusFilter;
        
        // Buscador Global
        const matchSearch = search === "" || 
            (eq.model || '').toLowerCase().includes(search) || 
            (eq.serial || '').toLowerCase().includes(search) ||
            (eq.ip_address || '').toLowerCase().includes(search);

        return matchClient && matchStatus && matchSearch;
    });

    if(document.getElementById('countBadge')) {
        document.getElementById('countBadge').innerText = `${filtered.length} equipos`;
    }
    
    tbody.innerHTML = '';

    if(filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#94a3b8;">No se encontraron equipos coinciden.</td></tr>';
        return;
    }

    filtered.forEach(eq => {
        const clientName = eq.institutions?.name || 'Sin Asignar';
        const deptName = eq.departments?.name ? ` • ${eq.departments.name}` : '';
        const status = eq.status || 'active';
        
        // Badge de Estado
        let stClass = 'badge badge-active'; let stText = 'En Sitio';
        if(status === 'workshop') { stClass = 'badge badge-repair'; stText = 'En Taller'; }
        if(status === 'retired') { stClass = 'badge badge-obsolete'; stText = 'Baja'; }

        // Badge de Tipo
        let typeBadge = eq.print_type === 'COLOR' 
            ? '<span class="type-pill tp-color" style="background:#fce7f3; color:#be185d; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold;">COLOR</span>' 
            : '<span class="type-pill tp-bn" style="background:#f1f5f9; color:#475569; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold;">B/N</span>';

        // UBICACIÓN (Fusión Macro + Detalle)
        let locationDisplay = '';
        if(eq.physical_location) {
            locationDisplay += `<div style="font-weight:600; font-size:11px;">${eq.physical_location}</div>`;
        }
        if(eq.location_details) {
            locationDisplay += `<div style="font-size:10px; color:#64748b;">${eq.location_details}</div>`;
        }

        // FECHA MANTENIMIENTO
        const nextDate = eq.next_maintenance_date ? new Date(eq.next_maintenance_date).toLocaleDateString() : '<span style="color:#cbd5e1">-</span>';

        const row = `
            <tr>
                <td>
                    <div style="font-weight:700; color:#0f172a;">${eq.brand || ''} ${eq.model}</div>
                    <div style="font-size:11px; color:#64748b;">${eq.notes || ''}</div>
                    <div style="margin-top:5px;">${typeBadge}</div>
                </td>
                <td>
                    <div style="font-weight:600;">${clientName}</div>
                    <div style="font-size:11px; color:#64748b;">${deptName}</div>
                    <div style="margin-top:4px; color:#ef4444;"><i class="fas fa-map-marker-alt"></i> ${locationDisplay}</div>
                </td>
                <td>
                    <div style="font-family:monospace; background:#f8fafc; padding:2px 5px; border-radius:4px; display:inline-block;">${eq.ip_address || '--'}</div>
                    <div style="font-size:10px; color:#64748b; margin-top:2px;">SN: ${eq.serial || 'N/A'}</div>
                </td>
                <td>
                    <div style="font-size:11px; font-family:'Courier New'; font-weight:bold;">B/N: ${eq.counter_bw || 0}</div>
                    <div style="font-size:11px; font-family:'Courier New'; font-weight:bold; color:#db2777;">Col: ${eq.counter_color || 0}</div>
                </td>
                <td><span class="${stClass}">${stText}</span><br><span style="font-size:10px; color:#64748b;">Próx: ${nextDate}</span></td>
                <td style="text-align:center;">
                    <div style="display:flex; gap:5px; justify-content:center;">
                        <button class="btn-icon" onclick="openCounterModal('${eq.id}', '${eq.model}', ${eq.counter_bw}, ${eq.counter_color})" title="Actualizar Contadores" style="color:#059669;">
                            <i class="fas fa-tachometer-alt"></i>
                        </button>
                        <button class="btn-icon" onclick="openSwapModal('${eq.id}', '${eq.model}')" style="color:#3b82f6;" title="Movimientos">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
};

// 3. NUEVAS FUNCIONES: GESTIÓN DE CONTADORES
window.openCounterModal = (id, model, bw, color) => {
    currentEditId = id;
    document.getElementById('lblCounterModel').innerText = `Equipo: ${model}`;
    document.getElementById('inputCounterBW').value = bw || 0;
    document.getElementById('inputCounterColor').value = color || 0;
    document.getElementById('counterModal').style.display = 'flex';
};

window.saveCounters = async () => {
    const bw = document.getElementById('inputCounterBW').value;
    const color = document.getElementById('inputCounterColor').value;

    if(!currentEditId) return;

    const { error } = await sb
        .from('equipment')
        .update({ 
            counter_bw: bw, 
            counter_color: color,
            last_maintenance_date: new Date() // Actualizamos fecha de último mtto automáticamente
        })
        .eq('id', currentEditId);

    if(error) {
        alert("Error al actualizar: " + error.message);
    } else {
        alert("✅ Contadores actualizados.");
        closeModal('counterModal');
        loadEquipment(); 
    }
};

// 4. LOGICA CSV (TU CÓDIGO ORIGINAL - INTACTO)
window.handleFileUpload = (input) => {
    const file = input.files[0];
    if(!file) return;

    if(confirm(`¿Deseas importar el archivo "${file.name}" a la base de datos?`)) {
        processCSV(file);
    }
    input.value = ''; 
};

async function processCSV(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        const rows = text.split('\n').slice(1); 
        
        let successCount = 0;
        let errorCount = 0;

        const btn = document.querySelector('button[onclick*="csvInput"]');
        if(btn) {
            var originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            btn.disabled = true;
        }

        for (const row of rows) {
            if(!row.trim()) continue; 
            const cols = row.split(','); 
            
            if (cols.length < 7) { errorCount++; continue; }

            const newEquip = {
                physical_location: cols[0]?.trim(),
                model: cols[1]?.trim(),
                brand: cols[2]?.trim(),
                serial: cols[3]?.trim(),
                ip_address: cols[4]?.trim(),
                location_details: cols[5]?.trim(),
                institution_id: cols[6]?.trim(),
                status: 'active',
                print_type: 'BN'
            };

            const { error } = await sb.from('equipment').insert(newEquip);
            
            if (!error) successCount++;
            else {
                console.error("Error importando fila:", row, error.message);
                errorCount++;
            }
        }

        if(btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        alert(`📊 Resultado:\n✅ Cargados: ${successCount}\n❌ Errores: ${errorCount}`);
        loadEquipment(); 
    };
    reader.readAsText(file);
}

// 5. COMBOS Y UTILIDADES (Tu código original)
async function loadClientsCombo() {
    const select = document.getElementById('filterClient');
    if(select) select.innerHTML = '<option value="">Todos los Clientes</option>';
    
    const { data: clients } = await sb.from('institutions').select('id, name').order('name');
    if(clients && select) {
        clients.forEach(c => {
            select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
    }
}

window.openSwapModal = (id, model) => {
    document.getElementById('swapEquipId').value = id;
    document.getElementById('swapEquipName').innerText = model;
    document.getElementById('swapModal').style.display = 'flex';
};

// Listeners de Formularios de Swap (Movimiento)
const swapForm = document.getElementById('swapForm');
if(swapForm) {
    swapForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('swapEquipId').value;
        const status = document.getElementById('swapAction').value;
        const notes = document.getElementById('swapNotes').value;
        
        const { error } = await sb.from('equipment')
            .update({ status: status, notes: notes })
            .eq('id', id);

        if(error) alert("Error: " + error.message);
        else {
            alert("✅ Estado actualizado.");
            closeModal('swapModal');
            loadEquipment();
        }
    });
}

window.closeModal = (id) => document.getElementById(id).style.display = 'none';
window.logout = async () => { await sb.auth.signOut(); window.location.href = 'index.html'; }
