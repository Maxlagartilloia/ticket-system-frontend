const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');
let currentInstId = null;
let isEditing = false;
let editId = null;

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM Cargado. Iniciando script..."); // Debug
    loadTechniciansForSelect();
    loadInstitutions();
});

// 1. CARGAR TÉCNICOS
async function loadTechniciansForSelect() {
    // Solo traemos ID y Nombre
    const { data: techs, error } = await sb.from('profiles')
        .select('id, full_name')
        .eq('role', 'technician');

    const sel = document.getElementById('techSelect');
    if(sel) {
        sel.innerHTML = '<option value="">-- Sin Técnico Fijo --</option>';
        if(techs) {
            techs.forEach(t => {
                sel.innerHTML += `<option value="${t.id}">🔧 ${t.full_name}</option>`;
            });
        }
    }
}

// 2. CARGAR CLIENTES (MODO SEGURO)
async function loadInstitutions() {
    console.log("Cargando clientes..."); 
    
    // NOTA: Quitamos el JOIN con profiles temporalmente para evitar errores de relación.
    // Usaremos una segunda consulta para mapear nombres si es necesario, o mostraremos solo ID por ahora.
    const { data: insts, error } = await sb
        .from('institutions')
        .select('*') 
        .order('id', {ascending: false});

    const tb = document.getElementById('instTable');
    tb.innerHTML = '';

    if (error) {
        console.error("Error Supabase:", error);
        tb.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">ERROR: ${error.message}</td></tr>`;
        return;
    }

    if (!insts || insts.length === 0) {
        tb.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#94a3b8;">La base de datos está vacía.</td></tr>';
        return;
    }

    // Para mostrar el nombre del técnico, necesitamos hacer un truco rápido
    // Mapeamos los técnicos que ya cargamos en el select
    const techMap = {};
    const techOptions = document.getElementById('techSelect').options;
    for(let i=0; i<techOptions.length; i++) {
        if(techOptions[i].value) {
            techMap[techOptions[i].value] = techOptions[i].text.replace('🔧 ', '');
        }
    }

    insts.forEach(i => {
        const safePhone = i.phone || '';
        
        // Buscamos el nombre del técnico en nuestro mapa local
        let techName = '<span style="color:#cbd5e1;">Manual</span>';
        if (i.default_technician_id && techMap[i.default_technician_id]) {
            techName = `<b>${techMap[i.default_technician_id]}</b>`;
        }

        tb.innerHTML += `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px;"><b>${i.id}</b></td>
                <td style="padding:12px; font-weight:600; color:#1e293b;">${i.name}</td>
                <td style="padding:12px;">${safePhone}</td>
                <td style="padding:12px; font-size:13px; color:#475569;">${techName}</td>
                <td style="padding:12px;">
                    <button onclick="openDeptModal(${i.id}, '${i.name}')" class="btn" style="background:#e0f2fe; color:#0369a1; padding:5px 10px; font-size:12px;">
                        <i class="fas fa-sitemap"></i> Áreas
                    </button>
                </td>
                <td style="padding:12px; text-align:center;">
                    <button onclick="startEdit(${i.id}, '${i.name}', '${safePhone}', '${i.address || ''}', '${i.default_technician_id || ''}')" 
                        title="Editar" style="cursor:pointer; border:none; background:none; color:#f59e0b; margin-right:10px;">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button onclick="delInst(${i.id})" title="Eliminar" style="cursor:pointer; border:none; background:none; color:#ef4444;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    });
}

// 3. EDITAR / GUARDAR
window.startEdit = (id, name, phone, address, techId) => {
    isEditing = true;
    editId = id;
    document.getElementById('name').value = name;
    document.getElementById('phone').value = phone;
    document.getElementById('address').value = address;
    document.getElementById('techSelect').value = (techId && techId !== 'null') ? techId : "";

    const btn = document.querySelector('#instForm button');
    btn.innerHTML = 'ACTUALIZAR';
    btn.style.background = '#f59e0b';
    document.querySelector('.scroll-area').scrollTop = 0;
};

document.getElementById('instForm').addEventListener('submit', async(e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;

    const formData = {
        name: document.getElementById('name').value, 
        phone: document.getElementById('phone').value, 
        address: document.getElementById('address').value,
        default_technician_id: document.getElementById('techSelect').value || null
    };

    try {
        if (isEditing) {
            await sb.from('institutions').update(formData).eq('id', editId);
            alert("✅ Actualizado");
        } else {
            await sb.from('institutions').insert([formData]);
            alert("✅ Creado");
        }
        e.target.reset();
        isEditing = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Guardar';
        btn.style.background = 'var(--sidebar-active)';
        loadInstitutions();
    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        btn.disabled = false;
    }
});

// 4. FUNCIONES AUXILIARES
window.openDeptModal = async (id, name) => {
    currentInstId = id; 
    document.getElementById('modalInstName').innerText = name;
    document.getElementById('deptModal').style.display = 'flex'; 
    loadDepartmentsInternal(id);
}
window.closeDeptModal = () => { document.getElementById('deptModal').style.display = 'none'; }

async function loadDepartmentsInternal(instId) {
    const list = document.getElementById('deptList'); list.innerHTML = '<li>Cargando...</li>';
    const { data } = await sb.from('departments').select('*').eq('institution_id', instId);
    list.innerHTML = '';
    data?.forEach(d => { 
        list.innerHTML += `<li class="dept-item"><span>${d.name}</span> <button onclick="deleteDept(${d.id})" class="btn-mini-del"><i class="fas fa-times"></i></button></li>`; 
    });
}
window.addDepartment = async () => {
    const val = document.getElementById('newDeptName').value.trim();
    if(!val) return;
    await sb.from('departments').insert([{ name: val, institution_id: currentInstId }]);
    document.getElementById('newDeptName').value = ''; loadDepartmentsInternal(currentInstId);
}
window.deleteDept = async (id) => { if(confirm('¿Borrar?')) { await sb.from('departments').delete().eq('id', id); loadDepartmentsInternal(currentInstId); } }
window.delInst = async(id) => { if(confirm('¿Eliminar?')) { await sb.from('institutions').delete().eq('id', id); loadInstitutions(); } };
