const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; 
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cache local para nombres (Evita muchas consultas)
let institutionsMap = {};
let profilesMap = {};

async function init() {
    // 1. Verificar Sesión
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = "index.html";

    // 2. Cargar Datos Auxiliares (Dropdowns)
    await loadDropdowns();

    // 3. Cargar Tickets
    await loadTickets();
}

async function loadDropdowns() {
    // Cargar Instituciones
    const { data: insts } = await supabase.from('institutions').select('id, name');
    const instSelect = document.getElementById('institutionSelect');
    instSelect.innerHTML = '<option value="">Seleccione Cliente...</option>';
    
    insts?.forEach(i => {
        institutionsMap[i.id] = i.name; // Guardar en mapa
        instSelect.innerHTML += `<option value="${i.id}">${i.name}</option>`;
    });

    // Cargar Técnicos (Perfiles)
    const { data: techs } = await supabase.from('profiles').select('id, full_name, email');
    const techSelect = document.getElementById('technicianSelect');
    techSelect.innerHTML = '<option value="">-- Sin Asignar --</option>';

    techs?.forEach(t => {
        profilesMap[t.id] = t.full_name || t.email; // Guardar en mapa
        techSelect.innerHTML += `<option value="${t.id}">${t.full_name || t.email}</option>`;
    });
}

async function loadTickets() {
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

    const tbody = document.getElementById('ticketsTable');
    tbody.innerHTML = '';

    if (!tickets || tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No hay tickets registrados.</td></tr>';
        return;
    }

    tickets.forEach(t => {
        // Traducir IDs a Nombres usando los mapas
        const clientName = institutionsMap[t.institution_id] || 'Desconocido';
        const techName = profilesMap[t.assigned_to] || '<span style="color:#999">Pendiente</span>';
        
        // Estilo de Estado
        const statusBadge = t.status === 'open' 
            ? `<span style="background:#e8f5e9; color:#2e7d32; padding:5px 10px; border-radius:12px; font-weight:bold; font-size:12px;">ABIERTO</span>`
            : `<span style="background:#eee; color:#666; padding:5px 10px; border-radius:12px; font-size:12px;">CERRADO</span>`;

        // Botón de Acción
        const actionBtn = t.status === 'open'
            ? `<button class="btn btn-primary btn-sm" onclick="closeTicket(${t.id})">Cerrar</button>`
            : `<span style="color:#aaa;">-</span>`;

        tbody.innerHTML += `
            <tr>
                <td>#${t.id}</td>
                <td><strong>${t.title}</strong><br><small style="color:#777">${t.priority.toUpperCase()}</small></td>
                <td>${clientName}</td>
                <td>${statusBadge}</td>
                <td>${techName}</td>
                <td>${actionBtn}</td>
            </tr>
        `;
    });
}

// CREAR TICKET
document.getElementById('ticketForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const priority = document.getElementById('priority').value;
    const institution_id = document.getElementById('institutionSelect').value;
    const assigned_to = document.getElementById('technicianSelect').value || null; // Null si está vacío
    const description = document.getElementById('description').value;

    const { error } = await supabase.from('tickets').insert([{
        title, priority, institution_id, assigned_to, description, status: 'open'
    }]);

    if (error) {
        alert("Error al crear ticket: " + error.message);
    } else {
        alert("Ticket creado exitosamente");
        document.getElementById('ticketForm').reset();
        loadTickets(); // Recargar tabla
    }
});

// CERRAR TICKET
window.closeTicket = async (id) => {
    if(!confirm("¿Marcar este ticket como resuelto?")) return;

    const { error } = await supabase
        .from('tickets')
        .update({ status: 'closed' })
        .eq('id', id);

    if (!error) loadTickets();
}

// LOGOUT
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = "index.html";
});

// INICIAR
document.addEventListener("DOMContentLoaded", init);
