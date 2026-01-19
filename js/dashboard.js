const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');

async function initDashboard() {
    // 1. Verificar Sesión (TU CÓDIGO)
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        window.location.href = "index.html";
        return;
    }

    // 2. Cargar Nombre del Usuario (TU CÓDIGO)
    loadUserProfile(session.user.id, session.user.email);

    // 3. Cargar KPIs Numéricos (TU CÓDIGO)
    loadKPIs();

    // 4. NUEVO: Cargar Métricas de Auditoría (SLA y Actividad)
    // Esto es lo único nuevo que se agrega para cumplir la licitación
    calculateSLA(); 
    loadRecentActivity();
}

// --- TU LÓGICA ORIGINAL DE PERFILES ---
async function loadUserProfile(userId, email) {
    try {
        const { data: profile, error } = await sb
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();

        const nameEl = document.getElementById('userName');
        
        if (profile && profile.full_name) {
            nameEl.textContent = profile.full_name; 
        } else {
            nameEl.textContent = email; 
        }
    } catch (err) {
        console.error("Error cargando perfil:", err);
    }
}

// --- TU LÓGICA ORIGINAL DE CONTEO ---
async function loadKPIs() {
    safeCount('tickets', 'openTickets', { status: 'open' });
    safeCount('tickets', 'inProgress', { status: 'in_progress' }); // Asegúrate que este estado exista en DB, si no usa 'open'
    safeCount('institutions', 'institutions');
    safeCount('equipment', 'equipment'); 
}

async function safeCount(table, elementId, filter = null) {
    const el = document.getElementById(elementId);
    if(!el) return; // Protección extra
    try {
        let query = sb.from(table).select('*', { count: 'exact', head: true });
        if (filter) query = query.match(filter);
        
        const { count, error } = await query;
        
        if (error) throw error;
        el.textContent = count || 0;
        
    } catch (err) {
        console.error(`Error contando ${table}:`, err);
        el.textContent = "0";
    }
}

// --- NUEVAS FUNCIONES DE AUDITORÍA (SLA Y ACTIVIDAD) ---

async function calculateSLA() {
    // Traemos tickets cerrados con horas registradas
    const { data: tickets } = await sb.from('tickets')
        .select('created_at, arrival_time')
        .not('arrival_time', 'is', null)
        .not('created_at', 'is', null);

    if (!tickets || tickets.length === 0) {
        document.getElementById('avgResponse').innerText = "N/A";
        return;
    }

    let totalMinutes = 0;
    let validCount = 0;

    tickets.forEach(t => {
        const start = new Date(t.created_at);
        const arrival = new Date(t.arrival_time);
        const diffMs = arrival - start;
        if (diffMs > 0) {
            totalMinutes += Math.floor(diffMs / 60000);
            validCount++;
        }
    });

    if (validCount > 0) {
        const avg = Math.floor(totalMinutes / validCount);
        const h = Math.floor(avg / 60);
        const m = avg % 60;
        document.getElementById('avgResponse').innerText = `${h}h ${m}m`;
    } else {
        document.getElementById('avgResponse').innerText = "--";
    }
}

async function loadRecentActivity() {
    const list = document.getElementById('recentActivity');
    if(!list) return;

    const { data: tickets } = await sb.from('tickets')
        .select('id, status, created_at, institutions(name)')
        .order('created_at', { ascending: false })
        .limit(5);

    list.innerHTML = '';
    if (!tickets || tickets.length === 0) {
        list.innerHTML = '<div style="padding:15px; color:#94a3b8; text-align:center;">Sin actividad reciente.</div>';
        return;
    }

    tickets.forEach(t => {
        const isClosed = t.status === 'closed';
        const color = isClosed ? '#10b981' : '#ef4444';
        const statusText = isClosed ? 'CERRADO' : 'ABIERTO';
        
        list.innerHTML += `
            <div style="padding:10px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-weight:600; font-size:13px; color:#1e293b;">${t.institutions?.name || 'Cliente'}</div>
                    <div style="font-size:11px; color:#64748b;">Ticket #${t.id} - ${new Date(t.created_at).toLocaleDateString()}</div>
                </div>
                <span style="font-size:10px; font-weight:bold; color:${color}; border:1px solid ${color}; padding:1px 5px; border-radius:4px;">
                    ${statusText}
                </span>
            </div>`;
    });
}

// --- TU LÓGICA DE MODAL Y SEGURIDAD ---

window.openProfileModal = () => { document.getElementById('profileModal').style.display = 'flex'; }
window.closeProfileModal = () => { document.getElementById('profileModal').style.display = 'none'; }

document.getElementById('passForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const p1 = document.getElementById('newPass').value;
    const p2 = document.getElementById('confPass').value;
    const btn = e.target.querySelector('.btn-confirm');
    const originalText = btn.innerHTML;

    if (p1.length < 6) return alert("⚠️ La contraseña debe tener al menos 6 caracteres.");
    if (p1 !== p2) return alert("⚠️ Las contraseñas no coinciden.");

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...'; 
    btn.disabled = true;

    const { error } = await sb.auth.updateUser({ password: p1 });

    if (error) {
        alert("Error: " + error.message);
    } else {
        alert("✅ Contraseña actualizada correctamente.");
        closeProfileModal();
        e.target.reset();
    }
    btn.innerHTML = originalText; 
    btn.disabled = false;
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await sb.auth.signOut();
    window.location.href = "index.html";
});

document.addEventListener("DOMContentLoaded", initDashboard);
