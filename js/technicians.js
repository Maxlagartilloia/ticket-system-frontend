const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');

document.addEventListener("DOMContentLoaded", loadTechnicians);

async function loadTechnicians() {
    // 1. Filtrar usuarios que sean Técnicos, Admins o Supervisores
    const { data, error } = await sb
        .from('profiles')
        .select('*')
        .in('role', ['technician', 'admin', 'supervisor'])
        .order('full_name', { ascending: true });

    const tb = document.getElementById('techTable');
    tb.innerHTML = '';

    if (error) {
        console.error(error);
        tb.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Error al cargar datos.</td></tr>';
        return;
    }

    if (!data || data.length === 0) {
        tb.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">No hay personal técnico registrado.</td></tr>';
        return;
    }

    data.forEach(u => {
        // Estética de Badges
        let badgeColor = '#3b82f6'; // Azul por defecto (Técnico)
        let roleName = 'Técnico';

        if (u.role === 'admin' || u.role === 'supervisor') {
            badgeColor = '#ef4444'; // Rojo (Jefe)
            roleName = 'Supervisor';
        }

        // Botón de acción: No permitir borrar al propio admin/supervisor fácilmente desde aquí para evitar auto-bloqueo
        // (En un sistema real validaríamos el ID del usuario actual, aquí lo simplificamos)
        let actionBtn = '';
        if (u.role === 'technician') {
            actionBtn = `
                <button onclick="revokeAccess('${u.id}', '${u.full_name}')" 
                        title="Revocar acceso (Convertir en usuario normal)"
                        style="cursor:pointer; border:1px solid #fee2e2; background:#fef2f2; color:#ef4444; padding:5px 10px; border-radius:6px; font-size:12px;">
                    <i class="fas fa-user-times"></i> Dar de Baja
                </button>`;
        } else {
            actionBtn = `<span style="color:#cbd5e1; font-size:12px; font-style:italic;">Admin</span>`;
        }

        tb.innerHTML += `
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:15px; font-weight:600; color:#1e293b;">
                    ${u.full_name || 'Sin Nombre'}
                </td>
                <td style="padding:15px; color:#64748b;">
                    ${u.email}
                </td>
                <td style="padding:15px;">
                    <span style="background:${badgeColor}; color:white; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:bold; text-transform:uppercase;">
                        ${roleName}
                    </span>
                </td>
                <td style="padding:15px; text-align:center;">
                    ${actionBtn}
                </td>
            </tr>`;
    });
}

// Función para "Despedir" al técnico (Le quita el rol, pero no borra el usuario para mantener historial de tickets)
window.revokeAccess = async (userId, userName) => {
    if (confirm(`¿Estás seguro de quitar los permisos de técnico a ${userName}?\n\nPasará a ser un usuario normal y no podrá ver tickets asignados.`)) {
        
        const { error } = await sb
            .from('profiles')
            .update({ role: 'user' }) // Lo bajamos de rango
            .eq('id', userId);

        if (error) {
            alert("Error al actualizar: " + error.message);
        } else {
            alert("✅ Accesos revocados correctamente.");
            loadTechnicians();
        }
    }
};
