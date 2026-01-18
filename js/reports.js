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
    
    // A. Tasa de éxito (Tickets cerrados vs Totales)
    const rate = total > 0 ? Math.round((closedCount / total) * 100) : 0;

    // B. TIEMPO PROMEDIO REAL (Requisito del Contrato)
    let avgTimeText = "0h";
    
    if (closedCount > 0) {
        let totalDurationMs = 0;
        let validDatesCount = 0;

        closedTickets.forEach(t => {
            // Solo calculamos si tiene fecha de cierre registrada
            if (t.created_at && t.closed_at) {
                const start = new Date(t.created_at);
                const end = new Date(t.closed_at);
                const duration = end - start; // Diferencia en milisegundos
                
                if (duration > 0) {
                    totalDurationMs += duration;
                    validDatesCount++;
                }
            }
        });

        if (validDatesCount > 0) {
            const avgMs = totalDurationMs / validDatesCount;
            const avgHours = avgMs / (1000 * 60 * 60); // Convertir a horas

            if (avgHours < 1) {
                avgTimeText = Math.round(avgMs / (1000 * 60)) + " min"; // Menos de 1h mostramos minutos
            } else if (avgHours > 24) {
                avgTimeText = (avgHours / 24).toFixed(1) + " días"; // Más de 24h mostramos días
            } else {
                avgTimeText = Math.round(avgHours) + " horas"; // Horas normales
            }
        }
    }

    // C. Actualizar tarjetas en pantalla
    document.getElementById('totalTickets').innerText = total;
    document.getElementById('successRate').innerText = `${rate}%`;
    document.getElementById('highPriority').innerText = high;
    document.getElementById('avgTime').innerText = avgTimeText;

    // ==========================================
    // 3. GRÁFICAS VISUALES (Chart.js)
    // ==========================================

    // --- GRÁFICA 1: TICKETS POR TÉCNICO ---
    const techCount = {};
    tickets.forEach(t => {
        // Si technician_id es null, lo ponemos como "Sin Asignar"
        const name = t.profiles?.full_name || 'Sin Asignar';
        techCount[name] = (techCount[name] || 0) + 1;
    });

    // Destruir gráfica anterior si existe (para evitar bugs al recargar)
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
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });

    // --- GRÁFICA 2: PRIORIDAD / TIPO ---
    const prioCount = { 'Alta': 0, 'Media': 0, 'Baja': 0 };
    tickets.forEach(t => {
        const p = t.priority || 'Media'; // Si es null, asumimos Media
        if (prioCount[p] !== undefined) {
            prioCount[p]++;
        } else {
            // Por si acaso hay un valor raro en la base de datos
            prioCount['Media']++; 
        }
    });

    const ctxType = document.getElementById('typeChart');
    if (window.typeChartInstance) window.typeChartInstance.destroy();

    window.typeChartInstance = new Chart(ctxType, {
        type: 'doughnut',
        data: {
            labels: ['Alta', 'Media', 'Baja'],
            datasets: [{
                data: [prioCount['Alta'], prioCount['Media'], prioCount['Baja']],
                backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                hoverOffset: 4
            }]
        },
        options: { responsive: true }
    });

    // ==========================================
    // 4. TABLA DETALLE (Últimos 10)
    // ==========================================
    const tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = '';
    
    // Tomamos los 10 más recientes
    tickets.slice(0, 10).forEach(t => {
        const date = new Date(t.created_at).toLocaleDateString();
        
        // Colores para el estado
        let badgeColor = '#64748b'; // Gris por defecto
        let statusText = 'Desconocido';

        if (t.status === 'open') {
            badgeColor = '#ef4444'; statusText = 'Abierto';
        } else if (t.status === 'in_progress') {
            badgeColor = '#f59e0b'; statusText = 'En Proceso';
        } else if (t.status === 'closed') {
            badgeColor = '#16a34a'; statusText = 'Cerrado';
        }

        tbody.innerHTML += `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px;">${date}</td>
                <td style="padding:10px; font-weight:bold;">${t.institutions?.name || 'N/A'}</td>
                <td style="padding:10px;">${t.description ? t.description.substring(0, 30) + '...' : 'Sin descripción'}</td>
                <td style="padding:10px;">${t.profiles?.full_name || '<span style="color:#94a3b8; font-style:italic;">Sin Asignar</span>'}</td>
                <td style="padding:10px;"><span style="color:${badgeColor}; font-weight:bold;">${statusText}</span></td>
                <td style="padding:10px;">${t.priority || 'Media'}</td>
            </tr>
        `;
    });
}
