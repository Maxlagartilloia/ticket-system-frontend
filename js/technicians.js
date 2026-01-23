// js/technicians.js - Gestión de Perfiles y Roles (Diseño Blindado v2)

let allUsers = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Check
    const { data: { session } } = await sb.auth.getSession();
    if (!session) window.location.href = 'index.html';
    
    // Mostrar usuario
    if(session.user.email) document.getElementById('userDisplay').innerText = session.user.email;

    // 2. Cargar Datos
    loadUsers();
});

// ==========================================
// 1. CARGA DE USUARIOS
// ==========================================
async function loadUsers() {
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px;"><i class="fas fa-spinner fa-spin"></i> Cargando perfiles...</td></tr>';

    const { data, error } = await sb
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Error: ${error.message}</td></tr>`;
        return;
    }

    allUsers = data;
    renderTable(allUsers);
}

function renderTable(users) {
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = '';

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px; color:#94a3b8;">No se encontraron usuarios.</td></tr>';
        return;
    }

    users.forEach(u => {
        // Iniciales para el Avatar (Seguro contra nombres vacíos)
        let initials = "US";
        if (u.full_name) {
            const parts = u.full_name.trim().split(" ");
            if (parts.length > 1) initials = (parts[0][0] + parts[1][0]).toUpperCase();
            else initials = parts[0].substring(0, 2).toUpperCase();
        }

        // Clases para Badges (Coinciden con el nuevo CSS)
        let badgeClass = 'role-client';
        let icon = 'fa-user';
        let roleText = 'CLIENTE';

        if(u.role === 'supervisor') { badgeClass = 'role-supervisor'; icon = 'fa-user-shield'; roleText = 'SUPERVISOR'; }
        if(u.role === 'technician') { badgeClass = 'role-technician'; icon = 'fa-wrench'; roleText = 'TÉCNICO'; }

        // Fecha
        const dateObj = new Date(u.created_at);
        const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;

        // Construcción de la Fila (Estructura "Blindada" para Mobile/Desktop)
        const row = `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="avatar-circle">${initials}</div>
                        <div class="user-info">
                            <span class="name">${escapeHTML(u.full_name)}</span>
                            <span class="id">ID: ${u.id.substring(0, 8)}...</span>
                        </div>
                    </div>
                </td>
                <td style="font-size: 13px; color: #475569;">
                    ${escapeHTML(u.email)}
                </td>
                <td>
                    <span class="role-badge ${badgeClass}">
                        <i class="fas ${icon}"></i> ${roleText}
                    </span>
                </td>
                <td style="font-size: 13px; color: #64748b;">${dateStr}</td>
                <td>
                    <div class="btn-action-group">
                        <button onclick="openEditRole('${u.id}', '${escapeHTML(u.full_name)}', '${u.role}')" class="btn-mini" title="Editar">
                            <i class="fas fa-user-edit"></i> Editar
                        </button>
                        <button onclick="deleteUser('${u.id}')" class="btn-mini btn-del" title="Eliminar">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// ==========================================
// 2. FILTROS
// ==========================================
window.filterUsers = () => {
    const search = document.getElementById('searchUser').value.toLowerCase();
    const role = document.getElementById('filterRole').value;

    const filtered = allUsers.filter(u => {
        const matchSearch = (u.full_name || '').toLowerCase().includes(search) || (u.email || '').toLowerCase().includes(search);
        const matchRole = role === 'all' || u.role === role;
        return matchSearch && matchRole;
    });

    renderTable(filtered);
};

// ==========================================
// 3. ACCIONES (MODAL)
// ==========================================
window.openEditRole = (id, name, role) => {
    document.getElementById('editUserId').value = id;
    document.getElementById('editUserName').innerText = name;
    document.getElementById('selectNewRole').value = role;
    document.getElementById('modalEditRole').style.display = 'flex';
};

document.getElementById('formEditRole').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    
    btn.disabled = true; btn.innerText = "Guardando...";

    const id = document.getElementById('editUserId').value;
    const newRole = document.getElementById('selectNewRole').value;

    const { error } = await sb.from('profiles').update({ role: newRole }).eq('id', id);

    if (error) alert("Error: " + error.message);
    else {
        document.getElementById('modalEditRole').style.display = 'none';
        loadUsers();
    }
    
    btn.disabled = false; btn.innerText = originalText;
});

window.deleteUser = async (id) => {
    if(confirm("⚠️ ¿Eliminar este usuario definitivamente?")) {
        const { error } = await sb.from('profiles').delete().eq('id', id);
        if(error) alert("Error: " + error.message);
        else loadUsers();
    }
};

const escapeHTML = (str) => str ? str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])) : '';
