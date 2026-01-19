const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');

async function initDashboard() {
    // 1. Verificar Sesión
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        window.location.href = "index.html";
        return;
    }

    // 2. Cargar Nombre del Usuario
    loadUserProfile(session.user.id, session.user.email);

    // 3. Cargar KPIs Numéricos
    loadKPIs();

    // 4. NUEVO: Cargar Auditoría (Tiempos SLA y Actividad Reciente)
    loadAuditData();
}

// Perfil de Usuario
async function loadUserProfile(userId, email) {
    try {
        const { data: profile } = await sb.from('profiles').select('full_name').eq('id', userId).single();
        const nameEl = document.getElementById('userName');
        nameEl.textContent = (profile && profile.full_name) ? profile.full_name : email;
    } catch (err) {
        console.error("Error perfil:", err);
    }
}

// KPIs Básicos (Conteo seguro)
async function loadKPIs() {
    safeCount('tickets', 'openTickets', { status: 'open' });
    safeCount('tickets', 'inProgress', { status: 'in_progress' }); // Nota: Asegúrate que uses este estado 'in_progress' o 'open' según tu lógica
    safeCount('institutions', 'institutions');
    safeCount('equipment', 'equipment'); 
}

async function safeCount(table, elementId, filter = null) {
    const el = document.getElementById(elementId);
    if (!el) return;
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

// --- NUEVA LÓGICA DE AUDITORÍA ---
async function loadAuditData() {
    // Traemos tickets para calcular tiempos y mostrar actividad
    const { data: tickets } = await sb.from('tickets')
        .select('id, status, created_at, arrival_time, institutions(name)')
        .order('created_at', { ascending: false });

    if (!tickets) return;

    // A. CALCULAR SLA (Tiempo Promedio de Respuesta)
    let totalMinutes = 0;
    let validCount = 0;

    tickets.forEach(t => {
        if (t.arrival_time && t.created_at) {
            const start = new Date(t.created_at);
            const arrival = new Date(t.arrival_time);
            const diffMs = arrival - start;
            if (diffMs > 0) {
                totalMinutes += Math.floor(diffMs / 60000);
                validCount++;
            }
        }
    });

    const slaEl = document.getElementById('avgResponse');
    if (slaEl) {
        if (validCount > 0) {
            const avg = Math.floor(totalMinutes / validCount);
            const h = Math.floor(avg / 60);
            const m = avg % 60;
            slaEl.innerText = `${h}h ${m}m`;
        } else {
            slaEl.innerText = "--";
        }
    }

    // B. ACTIVIDAD RECIENTE (Top 5)
    const list = document.getElementById('recentActivity');
    if (list) {
        list.innerHTML = '';
        const recent = tickets.slice(0, 5);
        
        if (recent.length === 0) {
            list.innerHTML = '<div style="padding:20px; text-align:center; color:#cbd5e1;">Sin actividad.</div>';
        } else {
            recent.forEach(t => {
                const isClosed = t.status === 'closed';
                const color = isClosed ? '#10b981' : '#ef4444';
                const icon = isClosed ? 'fa-check-circle' : 'fa-clock';
                
                list.innerHTML += `
                    <div class="activity-item">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="width:32px; height:32px; background:${isClosed?'#dcfce7':'#fee2e2'}; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                                <i class="fas ${icon}" style="color:${color}; font-size:14px;"></i>
                            </div>
                            <div>
                                <div style="font-weight:600; font-size:13px; color:#1e293b;">${t.institutions?.name || 'Cliente'}</div>
                                <div style="font-size:11px; color:#64748b;">Ticket #${t.id} • ${new Date(t.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <span style="font-size:10px; font-weight:700; color:${color}; border:1px solid ${color}; padding:2px 6px; border-radius:4px; text-transform:uppercase;">
                            ${isClosed ? 'Cerrado' : 'Abierto'}
                        </span>
                    </div>`;
            });
        }
    }
}

// --- GESTIÓN DE MODAL ---
window.openProfileModal = () => { document.getElementById('profileModal').style.display = 'flex'; }
window.closeProfileModal = () => { document.getElementById('profileModal').style.display = 'none'; }

document.getElementById('passForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const p1 = document.getElementById('newPass').value;
    const p2 = document.getElementById('confPass').value;
    const btn = e.target.querySelector('.btn-confirm');
    const originalText = btn.innerHTML;

    if (p1.length < 6) return alert("⚠️ Mínimo 6 caracteres.");
    if (p1 !== p2) return alert("⚠️ No coinciden.");

    btn.innerHTML = 'Guardando...'; btn.disabled = true;
    const { error } = await sb.auth.updateUser({ password: p1 });
    if (error) alert("Error: " + error.message);
    else { alert("✅ Actualizado."); closeProfileModal(); e.target.reset(); }
    btn.innerHTML = originalText; btn.disabled = false;
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await sb.auth.signOut();
    window.location.href = "index.html";
});

document.addEventListener("DOMContentLoaded", initDashboard);
