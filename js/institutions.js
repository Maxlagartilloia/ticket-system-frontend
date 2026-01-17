// ==========================================
// INSTITUTIONS DIAGNOSTIC MODE
// ==========================================
const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; 

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadData() {
    console.log("Iniciando carga...");
    const tbody = document.getElementById('institutionsTable');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:blue;">Conectando a base de datos...</td></tr>';

    try {
        // 1. Prueba de conexión básica
        const { data, error } = await sb.from('institutions').select('*').order('id');

        if (error) {
            console.error("ERROR CRÍTICO SUPABASE:", error);
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red; font-weight:bold;">ERROR: ${error.message} (Código: ${error.code})</td></tr>`;
            alert("❌ ERROR DE BASE DE DATOS:\n" + error.message + "\n\nRevisa si ejecutaste el script SQL para quitar los candados (RLS).");
            return;
        }

        console.log("Datos recibidos:", data);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; background:#fff3cd;">⚠️ Conexión exitosa, pero la tabla está VACÍA. Crea una institución arriba.</td></tr>';
            return;
        }

        // Si llegamos aquí, hay datos
        tbody.innerHTML = '';
        data.forEach(inst => {
            tbody.innerHTML += `
                <tr>
                    <td>${inst.id}</td>
                    <td><strong>${inst.name}</strong></td>
                    <td>${inst.address || '-'}</td>
                    <td>${inst.phone || '-'}</td>
                    <td><button class="btn btn-danger btn-sm" onclick="deleteInst(${inst.id})">Eliminar</button></td>
                </tr>`;
        });

    } catch (err) {
        console.error("ERROR DE JAVASCRIPT:", err);
        alert("❌ ERROR DE CÓDIGO:\n" + err.message);
    }
}

// GUARDAR
document.getElementById('institutionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.textContent = "Guardando..."; btn.disabled = true;

    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const phone = document.getElementById('phone').value;

    const { error } = await sb.from('institutions').insert([{ name, address, phone }]);

    if (error) {
        alert("❌ Error al guardar: " + error.message);
    } else {
        alert("✅ Institución guardada. Recargando lista...");
        e.target.reset();
        loadData();
    }
    btn.textContent = "Guardar Institución"; btn.disabled = false;
});

// BORRAR
window.deleteInst = async (id) => {
    if(confirm('¿Borrar esta institución?')) {
        const { error } = await sb.from('institutions').delete().eq('id', id);
        if (error) alert("Error: " + error.message);
        else loadData();
    }
}

// LOGOUT
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await sb.auth.signOut(); 
    window.location.href = "index.html";
});

// INICIAR
document.addEventListener("DOMContentLoaded", loadData);
