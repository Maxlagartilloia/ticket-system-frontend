// =========================================================
// GESTIÓN DE INVENTARIO V7.5 (GAD + CSV SUPPORT)
// =========================================================

let allEquipment = []; // Cache local

document.addEventListener('DOMContentLoaded', async () => {
    await verifySession(); // Seguridad
    await loadClientsCombo();
    loadEquipment();
});

// 1. CARGAR DATOS (Con JOINs explícitos)
async function loadEquipment() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> Sincronizando inventario...</td></tr>';

    // Consulta Enterprise: Trae todo + Nombres de Tablas Relacionadas
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

// 2. FILTRADO Y RENDERIZADO (Mejorado con Location Details)
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

    document.getElementById('countBadge').innerText = `${filtered.length} equipos`;
    tbody.innerHTML = '';

    if(filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#94a3b8;">No se encontraron equipos coinciden.</td></tr>';
        return;
    }

    filtered.forEach(eq => {
        const clientName = eq.institutions?.name || 'Sin Asignar';
        const deptName = eq.departments?.name ? ` • ${eq.departments.name}` : '';
        const status = eq.status || 'active';
        
        // Badge de Estado
        let stClass = 'st-active'; let stText = 'En Sitio';
        if(status === 'workshop') { stClass = 'st-workshop'; stText = 'En Taller'; }
        if(status === 'retired') { stClass = 'st-retired'; stText = 'Baja'; }

        // Badge de Tipo
        let typeBadge = eq.print_type === 'COLOR' 
            ? '<span class="type-pill tp-color" style="background:#fce7f3; color:#be185d; padding:2px 6px; border-radius:4px; font-size:10px;">COLOR</span>' 
            : '<span class="type-pill tp-bn" style="background:#f1f5f9; color:#475569; padding:2px 6px; border-radius:4px; font-size:10px;">B/N</span>';

        // UBICACIÓN (Fusión Macro + Detalle)
        let locationDisplay = '';
        if(eq.physical_location) {
            locationDisplay += `<div style="font-weight:600; font-size:11px;">${eq.physical_location}</div>`;
        }
        if(eq.location_details) {
            locationDisplay += `<div style="font-size:10px; color:#64748b;">${eq.location_details}</div>`;
        }

        const row = `
            <tr>
                <td>
                    <div style="font-weight:700; color:#0f172a;">${eq.brand || ''} ${eq.model}</div>
                    <div style="font-size:11px; color:#64748b;">${eq.notes || ''}</div>
                </td>
                <td>${typeBadge}</td>
                <td>
                    <div style="font-weight:600;">${clientName}</div>
                    <div style="font-size:11px; color:#64748b;">${deptName}</div>
                    <div style="margin-top:4px; color:#ef4444;"><i class="fas fa-map-marker-alt"></i> ${locationDisplay}</div>
                </td>
                <td>
                    <div style="font-family:monospace; background:#f8fafc; padding:2px 5px; border-radius:4px;">${eq.ip_address || '--'}</div>
                    <div style="font-size:10px; color:#64748b; margin-top:2px;">SN: ${eq.serial || 'N/A'}</div>
                </td>
                <td><span class="${stClass}" style="padding:4px 8px; border-radius:12px; font-size:11px; font-weight:700;">${stText}</span></td>
                <td style="text-align:center;">
                    <button class="btn-icon" onclick="openSwapModal('${eq.id}', '${eq.model}')" style="border:none; background:none; cursor:pointer; color:#3b82f6;">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
};

// 3. LOGICA CSV (IMPORTACIÓN MASIVA)
window.handleFileUpload = (input) => {
    const file = input.files[0];
    if(!file) return;

    if(confirm(`¿Deseas importar el archivo "${file.name}" a la base de datos?`)) {
        processCSV(file);
    }
    input.value = ''; // Limpiar input para permitir subir el mismo archivo si falla
};

async function processCSV(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        const rows = text.split('\n').slice(1); // Saltar cabecera (Fila 1)
        
        let successCount = 0;
        let errorCount = 0;
        const total = rows.length;

        // Mostrar UI de carga
        const btn = document.querySelector('button[onclick*="csvInput"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        btn.disabled = true;

        for (const row of rows) {
            if(!row.trim()) continue; // Saltar filas vacías

            const cols = row.split(','); // OJO: Si tu CSV usa punto y coma, cambia a row.split(';')
            
            // VALIDACIÓN BÁSICA DE ESTRUCTURA
            if (cols.length < 7) { errorCount++; continue; }

            // MAPEO SEGÚN TU ESTRUCTURA V7.5
            // Col A[0]: Ubicación Macro (physical_location)
            // Col B[1]: Modelo
            // Col C[2]: Marca
            // Col D[3]: Serie
            // Col E[4]: IP Address
            // Col F[5]: Detalle Ubicación (location_details)
            // Col G[6]: ID Institución (UUID)

            const newEquip = {
                physical_location: cols[0]?.trim(),
                model: cols[1]?.trim(),
                brand: cols[2]?.trim(),
                serial: cols[3]?.trim(),
                ip_address: cols[4]?.trim(),
                location_details: cols[5]?.trim(),
                institution_id: cols[6]?.trim(),
                status: 'active',
                print_type: 'BN' // Default
            };

            // Insertar en Supabase
            const { error } = await sb.from('equipment').insert(newEquip);
            
            if (!error) successCount++;
            else {
                console.error("Error importando fila:", row, error.message);
                errorCount++;
            }
        }

        // Restaurar UI y Notificar
        btn.innerHTML = originalText;
        btn.disabled = false;
        alert(`📊 Resultado de Importación:\n\n✅ Cargados: ${successCount}\n❌ Errores: ${errorCount}\n\nRevisa la consola (F12) para ver detalles de errores.`);
        loadEquipment(); // Recargar tabla
    };
    reader.readAsText(file);
}

// 4. COMBOS Y FORMULARIOS (Tu código original mantenido)
async function loadClientsCombo() {
    const select = document.getElementById('filterClient');
    const newSelect = document.getElementById('newClientSelect');
    
    // Limpieza inicial
    if(select) select.innerHTML = '<option value="">Todos los Clientes</option>';
    if(newSelect) newSelect.innerHTML = '<option value="">-- Seleccione Cliente --</option>';

    const { data: clients } = await sb.from('institutions').select('id, name').order('name');
    
    if(clients) {
        clients.forEach(c => {
            const opt = `<option value="${c.id}">${c.name}</option>`;
            if(select) select.innerHTML += opt;
            if(newSelect) newSelect.innerHTML += opt;
        });
    }
}

// Carga de Departamentos Dinámica
window.loadDeptsForNew = async (clientId) => {
    const select = document.getElementById('newDeptSelect');
    if(!select) return;
    
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

// CREACIÓN MANUAL (Adaptado para soportar campos nuevos si existen en el form)
const newForm = document.getElementById('newEquipForm');
if(newForm) {
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newEquip = {
            institution_id: document.getElementById('newClientSelect').value,
            department_id: document.getElementById('newDeptSelect')?.value || null,
            brand: document.getElementById('newBrand').value,
            model: document.getElementById('newModel').value,
            serial: document.getElementById('newSerial').value,
            // Campos V7.5
            ip_address: document.getElementById('newIp')?.value || null,
            print_type: document.getElementById('newPrintType')?.value || 'BN',
            physical_location: document.getElementById('newLocation')?.value || '', // Macro
            notes: document.getElementById('newNotes')?.value || '',
            status: 'active'
        };

        const { error } = await sb.from('equipment').insert([newEquip]);

        if(error) alert("Error: " + error.message);
        else {
            alert("✅ Equipo registrado exitosamente.");
            closeModal('newModal');
            e.target.reset();
            loadEquipment();
        }
    });
}

// MOVIMIENTOS Y BAJAS (Mantenido)
window.openSwapModal = (id, model) => {
    document.getElementById('swapEquipId').value = id;
    document.getElementById('swapEquipName').innerText = model;
    document.getElementById('swapModal').style.display = 'flex';
};

const swapForm = document.getElementById('swapForm');
if(swapForm) {
    swapForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('swapEquipId').value;
        const status = document.getElementById('swapAction').value;
        const notes = document.getElementById('swapNotes').value;
        
        const { error } = await sb.from('equipment')
            .update({ status: status, notes: notes }) // Nota: Podrías querer concatenar la nota
            .eq('id', id);

        if(error) alert("Error: " + error.message);
        else {
            alert("✅ Estado actualizado.");
            closeModal('swapModal');
            loadEquipment();
        }
    });
}

// UTILIDADES GLOBALES
window.openNewModal = () => document.getElementById('newModal').style.display = 'flex';
window.closeModal = (id) => document.getElementById(id).style.display = 'none';
window.logout = async () => { await sb.auth.signOut(); window.location.href = 'index.html'; };
