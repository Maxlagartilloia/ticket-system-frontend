// ==========================================
// INSTITUTIONS LOGIC (SUPABASE)
// ==========================================

// 1. CONFIGURACIÓN
const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; 

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ================================
// 1. AUTH GUARD
// ================================
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = "index.html";
    }
    // Opcional: Podrías verificar si es admin/supervisor aquí leyendo la tabla profiles
}

// ================================
// 2. CARGAR INSTITUCIONES (READ)
// ================================
async function loadInstitutions() {
    try {
        const tableBody = document.getElementById("institutionsTable");
        if (!tableBody) return;

        // Consulta a Supabase
        const { data, error } = await supabase
            .from('institutions')
            .select('*')
            .order('id', { ascending: true }); // Ordenar por ID

        if (error) throw error;

        // Limpiar tabla
        tableBody.innerHTML = "";

        // Generar filas
        data.forEach(inst => {
            const row = document.createElement("tr");
            
            // Botón de borrar con ID real
            const deleteBtn = `<button class="btn-delete" style="background:#d32f2f; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;" onclick="deleteInstitution(${inst.id})">Delete</button>`;

            row.innerHTML = `
                <td>${inst.id}</td>
                <td><strong>${inst.name}</strong></td>
                <td>${inst.address || "-"}</td>
                <td>${inst.phone || "-"}</td>
                <td>${deleteBtn}</td>
            `;
            tableBody.appendChild(row);
        });

    } catch (err) {
        console.error("Error cargando instituciones:", err.message);
    }
}

// ================================
// 3. CREAR INSTITUCIÓN (CREATE)
// ================================
const form = document.getElementById("institutionForm");
if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const address = document.getElementById("address").value;
        const phone = document.getElementById("phone").value;

        try {
            const { error } = await supabase
                .from('institutions')
                .insert([{ name, address, phone }]); // Insertamos objeto

            if (error) throw error;

            alert("Institución creada exitosamente.");
            form.reset();
            loadInstitutions(); // Recargamos la tabla

        } catch (err) {
            alert("Error al crear: " + err.message);
        }
    });
}

// ================================
// 4. BORRAR INSTITUCIÓN (DELETE)
// ================================
// Hacemos la función global para que el HTML pueda llamarla onclick="..."
window.deleteInstitution = async function(id) {
    if (!confirm("¿Estás seguro de eliminar esta institución?")) return;

    try {
        const { error } = await supabase
            .from('institutions')
            .delete()
            .eq('id', id);

        if (error) throw error;

        loadInstitutions(); // Recargamos la tabla

    } catch (err) {
        alert("No se pudo eliminar: " + err.message);
    }
};

// ================================
// UTILIDADES DE NAVEGACIÓN
// ================================
window.goTo = function(page) {
    window.location.href = page;
}

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = "index.html";
});

// INICIALIZACIÓN
document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    loadInstitutions();
});
