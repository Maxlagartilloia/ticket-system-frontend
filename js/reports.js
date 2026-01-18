const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');

document.addEventListener("DOMContentLoaded", async () => {
    await loadReports();
});

async function loadReports() {
    // 1. Traer TODOS los tickets con sus relaciones
    const { data: tickets, error } = await sb
        .from('tickets')
        .select(`
            *,
            institutions (name),
            profiles:technician_id (full_name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error cargando reportes:", error);
        return;
    }

    // ==========================================
    // 2. CÁLCULOS KPI (INDICADORES)
    // ==========================================
    const total = tickets.length;
    const closedTickets = tickets.filter(t => t.status === 'closed');
    const closedCount = closedTickets.length;
    const high = tickets.filter(t => t.priority === 'Alta').length;
    
    // A. Tasa de éxito
    const rate = total > 0 ? Math.round((closedCount / total) * 100) : 0;

    // B. TIEMPO PROMEDIO REAL (Requisito de Contrato)
    let avgTimeText = "0h";
    
    if (closedCount > 0) {
        let totalDurationMs = 0;
        let validDatesCount = 0;

        closedTickets.forEach(t => {
            if (t.created_at && t.closed_at) {
                const start = new Date(t.created_at);
                const end = new Date(t.closed_at);
                const duration = end - start; 
                
                if (duration > 0) {
                    totalDurationMs += duration;
                    validDatesCount++;
                }
            }
        });

        if (validDatesCount > 0) {
            const avgMs = totalDurationMs / validDatesCount;
            const avgHours = avgMs / (1000 * 60 * 60);

            if (avgHours < 1) {
                avgTimeText = Math.round(avgMs / (1000 * 60)) + " min"; 
            } else if (avgHours > 24) {
                avgTimeText = (avgHours / 24).toFixed(1) + " días"; 
            } else {
                avgTimeText = Math.round(avgHours) + " horas"; 
            }
        }
    }

    // C. Actualizar Pantalla
    document.getElementById('totalTickets').innerText = total;
    document.getElementById('successRate').innerText = `${rate}%`;
    document.getElementById('highPriority').innerText = high;
    document.getElementById('avgTime').innerText = avgTimeText;

    // ==========================================
    // 3. GRÁFICAS VISUALES
    // ==========================================

    // --- GRÁFICA 1: TICKETS POR TÉCNICO ---
    const techCount = {};
    tickets.forEach(t => {
        const name = t.profiles?.full_name || 'Sin Asignar';
        techCount[name] = (techCount[name] || 0) + 1;
    });

    const ctxTech = document.getElementById('techChart');
    if (window.techChartInstance) window.techChartInstance.destroy();

    window.techChartInstance = new Chart(ctxTech, {
        type: 'bar',
        data: {
            labels: Object.keys(techCount),
            datasets: [{
                label: 'Tickets Asignados',
                data: Object.values(techCount),
                backgroundColor: '#3b82f6',
                borderWidth: 1
            }]
        },
        options: { 
            responsive: true,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });

    // --- GRÁFICA 2: TIPOS DE INCIDENTES (Corrección: Usar incident_type, NO prioridad) ---
    const typeCount = {};
    tickets.forEach(t => {
        // Usamos el campo incident_type. Si no existe, ponemos 'General'
        const type = t.incident_type || 'General'; 
        typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const ctxType = document.getElementById('typeChart');
    if (window.typeChartInstance) window.typeChartInstance.destroy();

    window.typeChartInstance = new Chart(ctxType, {
        type: 'doughnut',
        data: {
            labels: Object.keys(typeCount), // Ej: Hardware, Software, Toner
            datasets: [{
                data: Object.values(typeCount),
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                hoverOffset: 4
            }]
        },
        options: { responsive: true }
    });

    // ==========================================
    // 4. TABLA DETALLE (Con columna TIPO)
    // ==========================================
    const tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = '';
    
    tickets.slice(0, 10).forEach(t => {
        const date = new Date(t.created_at).toLocaleDateString();
        let badgeColor = '#64748b'; 
        let statusText = 'Desconocido';

        if (t.status === 'open') { badgeColor = '#ef4444'; statusText = 'Abierto'; } 
        else if (t.status === 'in_progress') { badgeColor = '#f59e0b'; statusText = 'En Proceso'; } 
        else if (t.status === 'closed') { badgeColor = '#16a34a'; statusText = 'Cerrado'; }

        tbody.innerHTML += `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px;">${date}</td>
                <td style="padding:10px; font-weight:bold;">${t.institutions?.name || 'N/A'}</td>
                <td style="padding:10px;">${t.description ? t.description.substring(0, 30) + '...' : '-'}</td>
                <td style="padding:10px;">${t.profiles?.full_name || '<span style="color:#94a3b8;">Sin Asignar</span>'}</td>
                <td style="padding:10px;"><span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:11px;">${t.incident_type || 'General'}</span></td>
                <td style="padding:10px;"><span style="color:${badgeColor}; font-weight:bold;">${statusText}</span></td>
                <td style="padding:10px;">${t.priority || 'Media'}</td>
            </tr>
        `;
    });
}
