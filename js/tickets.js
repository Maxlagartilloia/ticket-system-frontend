// js/tickets.js - Lógica de HelpDesk (Cliente y Técnico)

let currentUser = null;
let userProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar Sesión
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = session.user;

    // 2. Obtener Perfil del Usuario (Rol e Institución)
    const { data: profile, error } = await sb
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    if (error) {
        alert("Error cargando perfil: " + error.message);
        return;
    }
    userProfile = profile;

    // 3. Configurar UI según Rol
    setupUIByRole();

    // 4. Cargar Tickets
    loadTickets();
    
    // 5. Configurar Listeners de UI (Fotos, Forms)
    setupEventListeners();
});

// ==========================================
// 1. GESTIÓN DE UI Y ROLES
// ==========================================

function setupUIByRole() {
    const userDisplay = document.getElementById('userDisplay');
    const btnCreate = document.getElementById('btnCreateTicket');
    const title = document.getElementById('dashboardTitle');

    userDisplay.innerHTML = `<i class="fas fa-user-circle"></i> ${userProfile.full_name} (${userProfile.role === 'client' ? 'Cliente' : 'Técnico'})`;

    if (userProfile.role === 'client') {
        // VISTA CLIENTE
        btnCreate.style.display = 'flex'; // Mostrar botón de crear
        title.innerText = "Mis Reportes de Servicio";
    } else {
        // VISTA TÉCNICO
        btnCreate.style.display = 'none'; // Ocultar botón de crear
        title.innerText = "Tickets Asignados / Pendientes";
    }
}

// ==========================================
// 2. CARGA DE DATOS (TICKETS)
// ==========================================

async function loadTickets() {
    const grid = document.getElementById('ticketsGrid');
    const loading = document.getElementById('loadingMsg');
    
    // Consulta base: Traer ticket + datos del equipo
    let query = sb
        .from('tickets')
        .select(`
            *,
            equipment ( model, serial, brand, physical_location )
        `)
        .order('created_at', { ascending: false });

    // FILTRO DE SEGURIDAD SEGÚN ROL
    if (userProfile.role === 'client') {
        // Clientes: Solo ven tickets de SU institución
        // Asumiendo que 'client_id' es el usuario o filtramos por 'institution_id'
        // Si usas institution_id en tickets:
        query = query.eq('institution_id', userProfile.institution_id); 
    } else {
        // Técnicos: Ven tickets asignados a ellos O tickets sin asignar de sus clientes
        // Para simplificar V7.5, mostramos tickets donde él es el técnico
        query = query.eq('technician_id', userProfile.id);
        
        // Opcional: Si quieres que vea todos los abiertos, quita el filtro anterior
    }

    const { data: tickets, error } = await query;

    loading.style.display = 'none';

    if (error) {
        grid.innerHTML = `<div style="color:red; grid-column:1/-1; text-align:center;">Error: ${error.message}</div>`;
        return;
    }

    if (!tickets || tickets.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#94a3b8; padding:40px;">
            <i class="fas fa-folder-open" style="font-size:40px; margin-bottom:10px;"></i><br>
            No hay tickets registrados.
        </div>`;
        return;
    }

    renderTickets(tickets);
}

function renderTickets(tickets) {
    const grid = document.getElementById('ticketsGrid');
    grid.innerHTML = '';

    tickets.forEach(t => {
        // Mapeo de Estados para colores CSS
        const statusClass = `status-${t.status}`; // open, in_progress, closed
        
        // Mapeo de Textos
        let statusText = 'Abierto';
        let statusIcon = 'fa-exclamation-circle';
        let statusColor = '#ef4444'; // Red

        if(t.status === 'in_progress') { statusText = 'En Proceso'; statusIcon = 'fa-tools'; statusColor = '#f59e0b'; }
        if(t.status === 'closed') { statusText = 'Finalizado'; statusIcon = 'fa-check-circle'; statusColor = '#10b981'; }

        const equipModel = t.equipment?.model || 'Modelo Desconocido';
        const equipSerial = t.equipment?.serial || 'S/N --';
        const dateStr = new Date(t.created_at).toLocaleDateString();

        // Botón de acción según rol
        let actionBtn = '';
        if (userProfile.role !== 'client' && t.status !== 'closed') {
            actionBtn = `
                <button onclick="openAttendModal('${t.id}', '${equipModel}', '${t.description}')" class="btn-card" style="background:#0f172a; color:white; padding:8px 15px; width:100%; cursor:pointer;">
                    <i class="fas fa-screwdriver"></i> Atender Ticket
                </button>
            `;
        } else if (t.status === 'closed') {
            actionBtn = `<div style="text-align:center; font-size:12px; color:#10b981; font-weight:600;"><i class="fas fa-check-double"></i> Servicio Completado</div>`;
        } else {
            actionBtn = `<div style="text-align:center; font-size:12px; color:#64748b;">Esperando atención técnica...</div>`;
        }

        const card = `
            <div class="ticket-card ${statusClass}">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:10px;">
                    <div style="font-weight:700; color:#1e293b;">#${t.ticket_number}</div>
                    <div style="font-size:12px; font-weight:600; color:${statusColor}; display:flex; align-items:center; gap:5px;">
                        <i class="fas ${statusIcon}"></i> ${statusText}
                    </div>
                </div>
                
                <h4 style="margin:0 0 5px 0; color:#334155;">${equipModel}</h4>
                <div style="font-size:12px; color:#64748b; margin-bottom:15px;">S/N: ${equipSerial}</div>
                
                <p style="font-size:13px; color:#475569; background:#f8fafc; padding:10px; border-radius:6px; margin-bottom:15px; min-height:40px;">
                    "${t.description}"
                </p>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; font-size:12px; color:#94a3b8;">
                    <span><i class="far fa-calendar"></i> ${dateStr}</span>
                    <span>Prioridad: <strong>${t.priority}</strong></span>
                </div>

                ${actionBtn}
            </div>
        `;
        grid.innerHTML += card;
    });
}

// ==========================================
// 3. CREACIÓN DE TICKETS (MODAL)
// ==========================================

window.showCreateModal = async () => {
    // 1. Cargar equipos de la institución del cliente
    const select = document.getElementById('selectEquipment');
    select.innerHTML = '<option>Cargando...</option>';
    
    const { data: equips } = await sb
        .from('equipment')
        .select('id, model, serial')
        .eq('institution_id', userProfile.institution_id);

    select.innerHTML = '';
    if (equips && equips.length > 0) {
        equips.forEach(eq => {
            select.innerHTML += `<option value="${eq.id}">${eq.model} (S/N: ${eq.serial})</option>`;
        });
    } else {
        select.innerHTML = '<option value="">No hay equipos registrados</option>';
    }

    // 2. Mostrar Modal
    document.getElementById('modalCreate').style.display = 'flex';
};

// Listener del Formulario Crear
document.getElementById('formCreate').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitReport');
    const spinner = btn.querySelector('.loading-spinner');
    const btnText = btn.querySelector('.btn-text');
    
    // UI Loading
    btn.disabled = true;
    spinner.style.display = 'inline-block';
    btnText.innerText = "Enviando...";

    try {
        const equipId = document.getElementById('selectEquipment').value;
        const priority = document.querySelector('input[name="priority"]:checked').value;
        const description = document.getElementById('txtDescription').value;
        const fileInput = document.getElementById('fileEvidence');
        let photoUrl = null;

        // 1. Subir Foto (Si existe)
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${userProfile.institution_id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await sb.storage
                .from('evidence')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = sb.storage
                .from('evidence')
                .getPublicUrl(fileName);
            
            photoUrl = publicUrl;
        }

        // 2. Insertar Ticket (Auto-assign Institution)
        const newTicket = {
            institution_id: userProfile.institution_id,
            client_id: userProfile.id,
            equipment_id: equipId,
            description: description,
            priority: priority,
            status: 'open',
            photo_url: photoUrl
            // technician_id: SE ASIGNA VIA TRIGGER EN SUPABASE O MANUALMENTE LUEGO
            // Si quieres asignarlo aquí directo, necesitas saber quién es el técnico de la institución.
        };

        const { error: insertError } = await sb.from('tickets').insert([newTicket]);
        if (insertError) throw insertError;

        // Éxito
        closeModals();
        e.target.reset();
        removeImage(); // Limpiar preview
        loadTickets(); // Recargar grid
        alert("✅ Reporte creado exitosamente.");

    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        btn.disabled = false;
        spinner.style.display = 'none';
        btnText.innerText = "Enviar Reporte Oficial";
    }
});

// ==========================================
// 4. ATENCIÓN DE TICKETS (TÉCNICO)
// ==========================================

window.openAttendModal = (id, model, desc) => {
    document.getElementById('attendId').value = id;
    document.getElementById('attendTicketInfo').innerHTML = `Servicio para: <strong style="color:#0f172a">${model}</strong><br>"${desc}"`;
    document.getElementById('modalAttend').style.display = 'flex';
};

document.getElementById('formAttend').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('attendId').value;
    
    const updates = {
        diagnosis: document.getElementById('txtDiagnosis').value,
        solution: document.getElementById('txtSolution').value,
        status: document.getElementById('selStatus').value,
        // Opcional: registrar fecha de cierre si status es 'closed'
    };

    const { error } = await sb.from('tickets').update(updates).eq('id', id);

    if (error) {
        alert("Error al actualizar: " + error.message);
    } else {
        alert("✅ Servicio registrado.");
        closeModals();
        e.target.reset();
        loadTickets();
    }
});

// ==========================================
// 5. MANEJO DE IMÁGENES (PREVIEW)
// ==========================================

function setupEventListeners() {
    // Dropzone click
    document.getElementById('uploadDropZone').addEventListener('click', () => {
        document.getElementById('fileEvidence').click();
    });

    // File Change
    document.getElementById('fileEvidence').addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('imagePreview').src = e.target.result;
                document.getElementById('previewContainer').style.display = 'block';
                document.getElementById('uploadDropZone').style.display = 'none'; // Ocultar zona de carga
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
}

window.removeImage = () => {
    document.getElementById('fileEvidence').value = ''; // Reset input
    document.getElementById('previewContainer').style.display = 'none';
    document.getElementById('uploadDropZone').style.display = 'block'; // Mostrar zona de carga
};

// ==========================================
// 6. UTILIDADES GLOBALES
// ==========================================

window.closeModals = () => {
    document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
};

window.logoutSystem = async () => {
    await sb.auth.signOut();
    window.location.href = 'index.html';
};
