const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; 
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = "index.html";

    // Cargar contadores
    const tables = [
        { table: 'tickets', filter: 'open', id: 'openTickets' },
        { table: 'tickets', filter: 'in_progress', id: 'inProgress' },
        { table: 'institutions', id: 'institutions' },
        { table: 'profiles', id: 'totalUsers' }
    ];

    tables.forEach(async (item) => {
        let query = supabase.from(item.table).select('*', { count: 'exact', head: true });
        if (item.filter) query = query.eq('status', item.filter);
        const { count } = await query;
        document.getElementById(item.id).textContent = count || 0;
    });
}

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await supabase.auth.signOut(); window.location.href = "index.html";
});

document.addEventListener("DOMContentLoaded", init);
