const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');

// Variables para gráficas (para poder destruirlas y redibujarlas al filtrar)
let techChartInstance = null;
let typeChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    // Poner fecha de hoy en el filtro por defecto
    // document.getElementById('filterDate').valueAsDate = new Date(); // Descomentar si quieres filtrar por hoy al inicio
    loadReports();
});

async function loadReports() {
    const dateInput = document.getElementById('filterDate').value;
    
    // Consulta base
    let query = sb.from('tickets')
        .select(`
            *,
            institutions(name),
            equipment(brand, model, serial_number),
            profiles(full_name)
        `)
        .order('created_at', { ascending: false });

    // Si hay fecha seleccionada, filtrar
    if (dateInput) {
        // Rango de todo el día seleccionado
        query = query.gte('created_at', `${dateInput}T00:00:00`)
                     .lte('created_at', `${dateInput}T23:59:59`);
    }

    const { data: tickets, error } = await query;

    if (error) {
        console.error("Error:", error);
        return;
    }

    // 1. CALCULAR Y MOSTRAR KPIs
    calculateKPIs(tickets);

    // 2. DIBUJAR GRÁFICAS
    drawCharts(tickets);

    // 3. LLENAR TABLA DE AUDITORÍA
    fillAuditTable(tickets);
}

// --- LÓGICA DE KPIs ---
function calculateKPIs(tickets) {
    const total = tickets.length;
    const closed = tickets.filter(t => t.status === 'closed').length;
    const high = tickets.filter(t => t.priority === 'Alta').length;
    
    // Tasa de éxito
    const rate = total > 0 ? Math.round((closed / total) * 100) : 0;

    // Tiempo Promedio (Solo de tickets cerrados con tiempos válidos)
    let totalMins = 0;
    let countValid = 0;
    tickets.forEach(t => {
        if (t.arrival_time && t.created_at) {
            const diff = new Date(t.arrival_time) - new Date(t.created_at);
            if (diff > 0) {
                totalMins += diff / 60000;
                countValid++;
            }
        }
    });
    
    let avgText = "0h";
    if (countValid > 0) {
        const avg = Math.floor(totalMins / countValid);
        const h = Math.floor(avg / 60);
        const m = avg % 60;
        avgText = `${h}h ${m}m`;
    }

    document.getElementById('totalTickets').innerText = total;
    document.getElementById('successRate').innerText = `${rate}%`;
    document.getElementById('avgTime').innerText = avgText;
    document.getElementById('highPriority').innerText = high;
}

// --- LÓGICA DE GRÁFICAS (Chart.js) ---
function drawCharts(tickets) {
    // A. Datos por Técnico
    const techCount = {};
    tickets.forEach(t => {
        const name = t.profiles?.full_name || 'Sin Asignar';
        techCount[name] = (techCount[name] || 0) + 1;
    });

    const ctxTech = document.getElementById('techChart').getContext('2d');
    if (techChartInstance) techChartInstance.destroy(); // Limpiar anterior

    techChartInstance = new Chart(ctxTech, {
        type: 'bar',
        data: {
            labels: Object.keys(techCount),
            datasets: [{
                label: 'Tickets Atendidos',
                data: Object.values(techCount),
                backgroundColor: '#3b82f6',
                borderRadius: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // B. Datos por Tipo de Incidente
    const typeCount = {};
    tickets.forEach(t => {
        const type = t.incident_type || 'General';
        typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const ctxType = document.getElementById('typeChart').getContext('2d');
    if (typeChartInstance) typeChartInstance.destroy();

    typeChartInstance = new Chart(ctxType, {
        type: 'doughnut',
        data: {
            labels: Object.keys(typeCount),
            datasets: [{
                data: Object.values(typeCount),
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// --- LÓGICA DE TABLA DE AUDITORÍA ---
function fillAuditTable(tickets) {
    const tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = '';

    if (tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">No hay datos para mostrar.</td></tr>';
        return;
    }

    tickets.forEach(t => {
        // Formato de Fechas y Duración
        let arrivalTime = '--:--';
        let departTime = '--:--';
        let durationTag = '';

        if (t.arrival_time) arrivalTime = new Date(t.arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        if (t.departure_time) departTime = new Date(t.departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        if (t.arrival_time && t.departure_time) {
            const diff = new Date(t.departure_time) - new Date(t.arrival_time);
            const mins = Math.floor(diff / 60000);
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            durationTag = `<span class="tag-sla">Sitio: ${h}h ${m}m</span>`;
        }

        // Estado Visual
        const statusColor = t.status === 'closed' ? '#15803d' : '#b91c1c';
        const statusText = t.status === 'closed' ? 'CERRADO' : 'ABIERTO';

        const row = `
            <tr>
                <td style="padding:12px;">
                    <div style="font-weight:bold; color:#1e293b;">${new Date(t.created_at).toLocaleDateString()}</div>
                    <div style="font-size:11px; color:#64748b;">#${t.id.split('-')[0]}</div>
                    <div style="font-size:10px; font-weight:bold; color:${statusColor}; margin-top:2px;">${statusText}</div>
                </td>
                <td style="padding:12px;">
                    <div style="font-weight:600; font-size:13px;">${t.institutions?.name || '---'}</div>
                    <div style="font-size:11px; color:#475569;">${t.equipment?.model || ''}</div>
                    <div style="font-size:10px; background:#f1f5f9; padding:1px 4px; border-radius:3px; display:inline-block;">SN: ${t.equipment?.serial_number || '-'}</div>
                </td>
                <td style="padding:12px;">
                    <div style="font-style:italic; font-size:12px; color:#334155; margin-bottom:5px;">
                        "${t.technical_report || t.description || 'Sin informe'}"
                    </div>
                    <div style="font-size:11px; color:#64748b;">
                        <i class="fas fa-user-check"></i> ${t.profiles?.full_name || 'Sin Asignar'}
                    </div>
                </td>
                <td style="padding:12px;">
                    <div class="tag-parts">${t.spare_parts || 'Ninguno'}</div>
                    ${t.final_meter_count ? `<div style="font-size:10px; font-weight:bold; margin-top:3px;">Contador: ${t.final_meter_count}</div>` : ''}
                </td>
                <td style="padding:12px;" class="audit-cell">
                    <div>IN: <b>${arrivalTime}</b></div>
                    <div>OUT: <b>${departTime}</b></div>
                    ${durationTag}
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}
