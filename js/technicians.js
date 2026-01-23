<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Usuarios y Roles | CopierMaster Admin</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css"> <style>
        /* --- ESTILOS ESPECÍFICOS DEL MÓDULO --- */
        body { background-color: #f1f5f9; font-family: 'Inter', sans-serif; }
        
        /* Navbar Admin Minimalista */
        .admin-nav {
            background: white; border-bottom: 1px solid #e2e8f0; padding: 15px 30px;
            display: flex; justify-content: space-between; align-items: center;
        }
        .nav-brand { font-weight: 700; font-size: 18px; color: #1e293b; display: flex; align-items: center; gap: 8px; }
        .back-link { 
            text-decoration: none; color: #64748b; font-size: 13px; font-weight: 500; 
            border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; transition: all 0.2s;
        }
        .back-link:hover { background: #f8fafc; color: #0f172a; border-color: #94a3b8; }

        /* Contenedor Principal */
        .container { max-width: 1200px; margin: 40px auto; padding: 0 20px; }
        
        .page-header h1 { font-size: 22px; color: #0f172a; margin: 0 0 10px 0; }
        .page-header p { color: #64748b; font-size: 14px; margin: 0 0 25px 0; display: flex; align-items: center; gap: 6px; }

        /* Barra de Filtros */
        .filter-bar {
            background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;
            display: flex; gap: 10px; margin-bottom: 25px;
        }
        .search-input { 
            flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 15px; 
            font-size: 14px; color: #334155; outline: none; 
        }
        .role-select {
            width: 200px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; 
            font-size: 14px; color: #334155; outline: none; cursor: pointer; background: white;
        }

        /* Tabla Estilo "Enterprise" */
        .users-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .users-table thead { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .users-table th { 
            text-align: left; padding: 15px 20px; font-size: 11px; font-weight: 700; 
            color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; 
        }
        .users-table td { padding: 15px 20px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .users-table tr:last-child td { border-bottom: none; }
        .users-table tr:hover { background-color: #f8fafc; }

        /* Avatar y Usuario */
        .user-cell { display: flex; align-items: center; gap: 12px; }
        .avatar-circle {
            width: 40px; height: 40px; border-radius: 50%; background: #0f172a; 
            color: white; display: flex; align-items: center; justify-content: center; 
            font-weight: 600; font-size: 14px; text-transform: uppercase;
        }
        .user-info .name { font-weight: 600; color: #0f172a; font-size: 14px; display: block; }
        .user-info .id { font-size: 11px; color: #94a3b8; font-family: monospace; }

        /* Badges de Rol (Colores Exactos) */
        .role-badge { padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; display: inline-flex; align-items: center; gap: 6px; }
        
        .role-client { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; } /* Gris */
        .role-supervisor { background: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe; } /* Indigo */
        .role-technician { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; } /* Verde */

        /* Botones de Acción */
        .btn-action-group { display: flex; gap: 8px; }
        .btn-mini {
            background: white; border: 1px solid #cbd5e1; border-radius: 6px; 
            padding: 6px 12px; font-size: 12px; font-weight: 600; color: #475569; 
            cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;
        }
        .btn-mini:hover { border-color: #94a3b8; background: #f1f5f9; color: #0f172a; }
        .btn-del:hover { border-color: #fca5a5; background: #fef2f2; color: #dc2626; }

        /* Modal */
        .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(2px);
            display: none; justify-content: center; align-items: center; z-index: 999;
        }
        .modal-card {
            background: white; width: 400px; padding: 25px; border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
    </style>
</head>
<body>

    <nav class="admin-nav">
        <div class="nav-brand">
            <i class="fas fa-layer-group" style="color: #3b82f6;"></i> CopierMaster <span style="font-weight:400; color:#64748b; font-size:14px;">Admin</span>
        </div>
        <div>
            <span id="userDisplay" style="font-size:13px; color:#64748b; margin-right:15px;">...</span>
            <a href="dashboard.html" class="back-link"><i class="fas fa-arrow-left"></i> Volver al Dashboard</a>
        </div>
    </nav>

    <div class="container">
        
        <div class="page-header">
            <h1>Gestión de Usuarios y Roles</h1>
            <p><i class="fas fa-info-circle"></i> Los usuarios se registran desde la pantalla de Login. Aquí gestionas sus permisos.</p>
        </div>

        <div class="filter-bar">
            <input type="text" id="searchUser" class="search-input" placeholder="Buscar por nombre o email..." onkeyup="filterUsers()">
            <select id="filterRole" class="role-select" onchange="filterUsers()">
                <option value="all">Todos los Roles</option>
                <option value="client">Cliente</option>
                <option value="supervisor">Supervisor</option>
                <option value="technician">Técnico</option>
            </select>
        </div>

        <table class="users-table">
            <thead>
                <tr>
                    <th style="width: 35%;">Usuario</th>
                    <th style="width: 25%;">Email / Contacto</th>
                    <th style="width: 15%;">Rol Actual</th>
                    <th style="width: 15%;">Fecha Registro</th>
                    <th style="width: 10%; text-align: right;">Acciones</th>
                </tr>
            </thead>
            <tbody id="usersTable">
                <tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">Cargando...</td></tr>
            </tbody>
        </table>

    </div>

    <div id="modalEditRole" class="modal-overlay">
        <div class="modal-card">
            <h3 style="margin-top:0; color:#0f172a;">👤 Editar Permisos</h3>
            <form id="formEditRole">
                <input type="hidden" id="editUserId">
                <p style="font-size:14px; color:#64748b; margin-bottom:20px;">
                    Usuario: <strong id="editUserName" style="color:#0f172a;">...</strong>
                </p>
                
                <div style="margin-bottom:25px;">
                    <label style="display:block; font-size:12px; font-weight:700; color:#475569; margin-bottom:8px;">Asignar Nuevo Rol</label>
                    <select id="selectNewRole" style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:6px; font-size:14px;">
                        <option value="client">Cliente</option>
                        <option value="technician">Técnico</option>
                        <option value="supervisor">Supervisor</option>
                    </select>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px;">
                    <button type="button" onclick="document.getElementById('modalEditRole').style.display='none'" class="btn-mini" style="padding:10px 15px;">Cancelar</button>
                    <button type="submit" class="btn-mini" style="background:#0f172a; color:white; border:none; padding:10px 15px;">Guardar Cambios</button>
                </div>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/supabase.js"></script>
    <script src="js/technicians.js"></script>
</body>
</html>
