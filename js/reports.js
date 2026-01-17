const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; 
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadReports() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return window.location.href = "index.html";

    const { count: t } = await sb.from('tickets').select('*', { count: 'exact', head: true });
    const { count: c } = await sb.from('institutions').select('*', { count: 'exact', head: true });
    const { count: e } = await sb.from('equipment').select('*', { count: 'exact', head: true });

    document.getElementById('totalT').textContent = t || 0;
    document.getElementById('totalC').textContent = c || 0;
    document.getElementById('totalE').textContent = e || 0;
}

document.getElementById('logoutBtn').addEventListener('click', async () => { await sb.auth.signOut(); window.location.href = "index.html"; });
document.addEventListener("DOMContentLoaded", loadReports);
