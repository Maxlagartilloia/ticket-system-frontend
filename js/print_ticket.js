// ==========================================
// LÓGICA DE IMPRESIÓN (Reporte A4)
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtener ID de la URL (ej: print_ticket.html?id=123)
    const params = new URLSearchParams(window.location.search);
    const ticketId = params.get('id');

    // Validación de seguridad
    if (!ticketId) {
        document.body.innerHTML = `
            <div style="text-align:center; margin-top:50px; color:#ef4444; font-family:sans-serif;">
                <h1><i class="fas fa-exclamation-triangle"></i> Error</h1>
                <p>No se ha especificado un ticket para imprimir.</p>
                <button onclick="window.close()" style="padding:10px 20px; cursor:pointer;">Cerrar Pestaña</button>
            </div>`;
        return;
    }

    try {
        console.log("🖨️ Buscando datos del ticket:", ticketId);

        // 2. Consulta a Supabase (Relaciones completas)
        const { data: t, error } = await sb
            .from('tickets')
            .select(`
                *,
                equipment ( model, brand, serial, physical_location ),
                institutions ( name ), 
                profiles:technician_id ( first_name, last_name )
            `)
            .eq('id', ticketId)
            .single();

        if (error) throw error;
        if (!t) throw new Error("El ticket no existe en la base de datos.");

        // 3. Inyectar Datos en el DOM
        setText('print-id', `#${t.ticket_number}`);
        setText('print-date', new Date(t.created_at).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' }));
        
        // Cliente
        setText('print-client', t.institutions?.name || 'Cliente Desconocido');
        
        // Equipo
        const brand = t.equipment?.brand || '';
        const model = t.equipment?.model || 'Modelo no registrado';
        setText('print-model', `${brand} ${model}`);
        setText('print-serial', t.equipment?.serial || 'S/N');

        // Detalles del Reporte
        setText('print-desc', t.description || 'Sin descripción detallada.');
        
        // Solución Técnica (Manejo de vacíos)
        if (t.solution) {
            setText('print-solution', t.solution);
        } else {
            document.getElementById('print-solution').innerHTML = '<span style="color:#94a3b8; font-style:italic;">(Sin solución registrada)</span>';
        }

        // Técnico Responsable
        if (t.profiles) {
            setText('print-tech', `${t.profiles.first_name || ''} ${t.profiles.last_name || ''}`.trim());
        } else {
            setText('print-tech', 'Sin Técnico Asignado');
        }

        console.log("✅ Datos cargados correctamente. Listo para imprimir.");

    } catch (err) {
        console.error("Error fatal:", err);
        alert("Error al generar el reporte: " + err.message);
    }
});

// Función auxiliar para asignar texto sin romper si el ID no existe
function setText(elementId, text) {
    const el = document.getElementById(elementId);
    if (el) el.innerText = text;
}
