const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; 
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function init() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return window.location.href = "index.html";
    
    // Validar Rol: Solo Admin/Supervisor
    // (Por ahora simplificado, carga reporte diario por defecto)
    loadReport('daily');
}

window.loadReport = async (range) => {
    console.log("Generando reporte:", range);
    let startDate = new Date();
    
    if (range === 'daily') startDate.setHours(0,0,0,0);
    if (range === 'weekly') startDate.setDate(startDate.getDate() - 7);
    if (range === 'monthly') startDate.setMonth(startDate.getMonth() - 1);

    const { data: tickets } = await sb
        .from('tickets')
        .select(`*, profiles(email), institutions(name)`)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

    // CALCULAR METRICAS
    const total = tickets.length;
    let slaFails = 0;
    let totalMinutes = 0;
    let resolvedCount = 0;

    const tbody = document.getElementById('reportTable');
    tbody.innerHTML = '';

    tickets.forEach(t => {
        // Chequeo SLA
        const deadline = new Date(t.sla_deadline);
        const closedAt = t.tech_departure ? new Date(t.tech_departure) : new Date();
        const missedSla = closedAt > deadline;
        if(missedSla) slaFails++;

        // Calculo tiempos
        if(t.tech_arrival && t.tech_departure) {
            const diff = (new Date(t.tech_departure) - new Date(t.tech_arrival)) / 1000 / 60; // Minutos
            totalMinutes += diff;
            resolvedCount++;
        }

        // Fila Tabla
        const slaBadge = missedSla 
            ? '<span style="color:red; font-weight:bold">VENCIDO</span>' 
            : '<span style="color:green">A TIEMPO</span>';

        tbody.innerHTML += `
            <tr>
                <td>${new Date(t.created_at).toLocaleDateString()}</td>
                <td>${t.profiles?.email || 'N/A'}</td>
                <td>${t.institutions?.name}</td>
                <td>${t.tech_arrival ? new Date(t.tech_arrival).toLocaleTimeString() : '-'}</td>
                <td>${t.tech_departure ? new Date(t.tech_departure).toLocaleTimeString() : '-'}</td>
                <td>${t.spare_parts || 'Ninguno'}</td>
                <td>${slaBadge}</td>
            </tr>
        `;
    });

    // Actualizar Tarjetas
    document.getElementById('repTotal').textContent = total;
    document.getElementById('repSlaFail').textContent = slaFails;
    
    const avgMins = resolvedCount > 0 ? Math.round(totalMinutes / resolvedCount) : 0;
    document.getElementById('repAvgTime').textContent = `${avgMins} min`;
}

document.addEventListener("DOMContentLoaded", init);
