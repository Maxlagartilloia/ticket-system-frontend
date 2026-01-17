const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; 
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadData() {
    const { data } = await supabase.from('institutions').select('*').order('id');
    const tbody = document.getElementById('institutionsTable');
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
}

document.getElementById('institutionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const phone = document.getElementById('phone').value;
    await supabase.from('institutions').insert([{ name, address, phone }]);
    e.target.reset();
    loadData();
});

window.deleteInst = async (id) => {
    if(confirm('¿Borrar empresa?')) {
        await supabase.from('institutions').delete().eq('id', id);
        loadData();
    }
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut(); window.location.href = "index.html";
});

loadData();
