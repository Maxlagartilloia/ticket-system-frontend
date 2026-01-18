const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');

document.addEventListener("DOMContentLoaded", async () => {
    await loadReports();
});

async function loadReports() {
    // 1. Traer TODOS los tickets con sus relaciones
    // Nota: Traemos technician_id (profiles) y institution_id (institutions)
    const { data: tickets, error } = await sb
        .from('tickets')
        .select(`
            *,
            institutions (name),
            profiles:technician_id (full_name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    // --- CÁLCULOS KPI ---
    const total = tickets.length;
    const closed = tickets.filter(t => t.status === 'closed').length;
    const high = tickets.filter(t => t.priority === 'Alta').length;
    
    // Tasa de éxito
    const rate = total > 0 ? Math.round((closed / total) * 100) : 0;

    // Actualizar tarjetas KPI
    document.getElementById('totalTickets').innerText = total;
    document.getElementById('successRate').innerText = `${rate}%`;
    document.getElementById('highPriority').innerText = high;
    
    // (Cálculo simple de tiempos - Mejora futura: restar fechas reales)
    document.getElementById('avgTime').innerText = "2.5h"; // Simulado por ahora hasta tener fechas de cierre reales

    // --- GRÁFICA 1: TICKETS POR TÉCNICO ---
    const techCount = {};
    tickets.forEach(t => {
        const name = t.profiles?.full_name || 'Sin Asignar';
        techCount[name] = (techCount[name] || 0) + 1;
    });

    new Chart(document.getElementById('techChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(techCount),
            datasets: [{
                label: 'Tickets Asignados',
                data: Object.values(techCount),
                backgroundColor: '#3b82f6'
            }]
        },
        options: { responsive: true }
    });

    // --- GRÁFICA 2: PRIORIDAD / TIPO ---
    const prioCount = { 'Alta': 0, 'Media': 0, 'Baja': 0 };
    tickets.forEach(t => {
        const p = t.priority || 'Media';
        prioCount[p] = (prioCount[p] || 0) + 1;
    });

    new Chart(document.getElementById('typeChart'), {
        type: 'doughnut',
        data: {
            labels: ['Alta', 'Media', 'Baja'],
            datasets: [{
                data: [prioCount['Alta'], prioCount['Media'], prioCount['Baja']],
                backgroundColor: ['#ef4444', '#f59e0b', '#10b981']
            }]
        }
    });

    // --- TABLA DETALLE (Últimos 10) ---
    const tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = '';
    tickets.slice(0, 10).forEach(t => {
        const date = new Date(t.created_at).toLocaleDateString();
        const badgeColor = t.status === 'open' ? '#ef4444' : (t.status === 'in_progress' ? '#f59e0b' : '#16a34a');
        const statusText = t.status === 'open' ? 'Abierto' : (t.status === 'in_progress' ? 'En Proceso' : 'Cerrado');

        tbody.innerHTML += `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px;">${date}</td>
                <td style="padding:10px;">${t.institutions?.name || 'N/A'}</td>
                <td style="padding:10px;">${t.description.substring(0, 30)}...</td>
                <td style="padding:10px;">${t.profiles?.full_name || '-'}</td>
                <td style="padding:10px;"><span style="color:${badgeColor}; font-weight:bold;">${statusText}</span></td>
                <td style="padding:10px;">${t.priority || 'Media'}</td>
            </tr>
        `;
    });
}
