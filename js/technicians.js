// js/technicians.js - Gestión de Perfiles y Roles v1.0

let allUsers = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Seguridad: Solo supervisores deberían ver esto (Opcional, por ahora abierto a staff)
    const { data: { session } } = await sb.auth.getSession();
    if (!session) window.location.href = 'index.html';
    
    // Mostrar info usuario actual
    if(session.user.email) document.getElementById('userDisplay').innerText = session.user.email;

    // 2. Cargar Usuarios
    loadUsers();
});

// ==========================================
// 1. CARGA DE USUARIOS
// ==========================================
async function loadUsers() {
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> Cargando perfiles...</td></tr>';

    // Traemos todos los perfiles
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
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">No hay usuarios registrados.</td></tr>';
        return;
    }

    users.forEach(u => {
        // Iniciales para Avatar
        const initials = u.full_name ? u.full_name.substring(0,2).toUpperCase() : 'US';
        
        // Estilos de Badge
        let badgeClass = 'role-client';
        let icon = 'fa-user';
        let roleName = 'Cliente';

        if(u.role === 'technician') { badgeClass = 'role-technician'; icon = 'fa-tools'; roleName = 'Técnico'; }
        if(u.role === 'supervisor') { badgeClass = 'role-supervisor'; icon = 'fa-user-shield'; roleName = 'Supervisor'; }

        // Fecha
        const date = u.created_at ? new Date(u.created_at).toLocaleDateString() : '-';

        const row = `
            <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:15px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="user-avatar">${initials}</div>
                        <div>
                            <div style="font-weight:600; color:#0f172a;">${escapeHTML(u.full_name)}</div>
                            <div style="font-size:11px; color:#94a3b8;">ID: ${u.id.substring(0,8)}...</div>
                        </div>
                    </div>
                </td>
                <td style="padding:15px; color:#475569;">
                    ${escapeHTML(u.email)}
                </td>
                <td style="padding:15px;">
                    <span class="role-badge ${badgeClass}"><i class="fas ${icon}"></i> ${roleName}</span>
                </td>
                <td style="padding:15px; color:#64748b;">${date}</td>
                <td style="padding:15px; text-align:center;">
                    <div class="action-row">
                        <button onclick="openEditRole('${u.id}', '${u.full_name}', '${u.role}')" class="btn-mini" title="Cambiar Rol">
                            <i class="fas fa-user-tag"></i> Editar
                        </button>
                        <button onclick="deleteUser('${u.id}')" class="btn-mini btn-danger" title="Eliminar Acceso">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// ==========================================
// 2. EDICIÓN DE ROLES
// ==========================================
window.openEditRole = (id, name, currentRole) => {
    document.getElementById('editUserId').value = id;
    document.getElementById('editUserName').innerText = name;
    document.getElementById('selectNewRole').value = currentRole;
    document.getElementById('modalEditRole').style.display = 'flex';
};

document.getElementById('formEditRole').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editUserId').value;
    const newRole = document.getElementById('selectNewRole').value;
    const btn = e.target.querySelector('button[type="submit"]');

    btn.disabled = true; btn.innerText = "Guardando...";

    const { error } = await sb
        .from('profiles')
        .update({ role: newRole })
        .eq('id', id);

    if (error) {
        alert("Error al actualizar: " + error.message);
    } else {
        alert("✅ Rol actualizado correctamente.");
        document.getElementById('modalEditRole').style.display = 'none';
        loadUsers(); // Recargar tabla
    }
    btn.disabled = false; btn.innerText = "Guardar Cambios";
});

// ==========================================
// 3. UTILIDADES
// ==========================================
window.filterUsers = () => {
    const search = document.getElementById('searchUser').value.toLowerCase();
    const roleFilter = document.getElementById('filterRole').value;

    const filtered = allUsers.filter(u => {
        const matchSearch = (u.full_name || '').toLowerCase().includes(search) || (u.email || '').toLowerCase().includes(search);
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    renderTable(filtered);
};

window.deleteUser = async (id) => {
    if(confirm("⚠️ ¿Estás seguro de eliminar este usuario?\nEsta acción puede romper historiales de tickets si el usuario ya tiene actividad.")) {
        // Nota: Esto solo borra el perfil. El usuario de Auth (Login) requiere Service Role para borrarse desde cliente.
        // Para esta versión, borramos el perfil para que no aparezca en listas.
        const { error } = await sb.from('profiles').delete().eq('id', id);
        if(error) alert("Error: " + error.message);
        else loadUsers();
    }
};

window.logoutSystem = async () => {
    await sb.auth.signOut();
    window.location.href = 'index.html';
};

const escapeHTML = (str) => str ? str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])) : '';
