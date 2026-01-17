const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');
let instMap = {};

async function load() {
    // Mapa de clientes
    const { data: insts } = await sb.from('institutions').select('id, name');
    insts?.forEach(i => instMap[i.id] = i.name);

    // Tickets
    const { data: tickets } = await sb.from('tickets').select('*').order('created_at', {ascending:false});
    const tb = document.getElementById('ticketTable');
    tb.innerHTML = '';
    
    if(!tickets.length) { tb.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No hay tickets pendientes.</td></tr>'; return; }

    tickets.forEach(t => {
        let badgeColor = '#94a3b8';
        if(t.status === 'open') badgeColor = '#22c55e'; // Verde
        if(t.status === 'in_progress') badgeColor = '#f59e0b'; // Naranja
        if(t.status === 'resolved') badgeColor = '#3b82f6'; // Azul

        tb.innerHTML += `
            <tr style="border-bottom:1px solid #e2e8f0; cursor:pointer;" onclick="location.href='ticket_details.html?id=${t.id}'">
                <td style="padding:15px; font-weight:bold;">#${t.id}</td>
                <td style="padding:15px;">${t.title}</td>
                <td style="padding:15px;">${instMap[t.institution_id] || 'N/A'}</td>
                <td style="padding:15px;"><span style="background:${badgeColor}20; color:${badgeColor}; padding:4px 8px; border-radius:12px; font-weight:700; font-size:12px;">${t.status.toUpperCase()}</span></td>
                <td style="padding:15px;">${t.assigned_to ? 'Asignado' : '<span style="color:#ef4444">Sin Asignar</span>'}</td>
                <td style="padding:15px; text-align:right;"><i class="fas fa-chevron-right" style="color:#ccc;"></i></td>
            </tr>`;
    });
}
document.addEventListener("DOMContentLoaded", load);
