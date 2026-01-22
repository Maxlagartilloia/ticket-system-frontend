<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Help Desk | CopierMaster</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        /* ESTILOS GENERALES Y DEL DASHBOARD (Mantenidos) */
        body { background-color: #f1f5f9; font-family: 'Inter', sans-serif; margin: 0; }
        .navbar { background: #0f172a; color: white; padding: 0 20px; height: 60px; display: flex; justify-content: space-between; align-items: center; }
        .user-info { font-size: 14px; color: #cbd5e1; display: flex; align-items: center; gap: 10px; }
        .main-container { max-width: 1200px; margin: 30px auto; padding: 0 20px; }
        .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .page-title { margin: 0; font-size: 24px; color: #1e293b; font-weight: 700; }
        .tickets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .ticket-card { background: white; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .status-open { border-left: 5px solid #ef4444; }
        .status-in_progress { border-left: 5px solid #f59e0b; }
        .status-closed { border-left: 5px solid #10b981; }
        .btn-card { border: none; border-radius: 6px; font-weight: 600; display: flex; justify-content: center; align-items: center; gap: 8px; transition: background 0.2s; }

        /* --- NUEVOS ESTILOS PARA EL MODAL PROFESIONAL --- */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: none; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
        .modal-box-pro { background: white; border-radius: 16px; width: 95%; max-width: 600px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; }
        .modal-header-pro { background: #0f172a; color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
        .modal-header-pro h3 { margin: 0; font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 10px; }
        .modal-body-pro { padding: 25px; max-height: 70vh; overflow-y: auto; }
        
        .form-section { margin-bottom: 20px; }
        .form-label-pro { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px; }
        .form-control-pro { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; box-sizing: border-box; font-family: 'Inter', sans-serif; transition: border-color 0.2s; }
        .form-control-pro:focus { border-color: #2563eb; outline: none; }

        /* Radio buttons de Prioridad */
        .priority-group { display: flex; gap: 15px; flex-wrap: wrap; }
        .priority-radio { display: none; }
        .priority-label {
            padding: 8px 15px; border: 1px solid #cbd5e1; border-radius: 20px; font-size: 12px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 5px;
        }
        .priority-radio:checked + .priority-label.low { background: #ecfdf5; color: #059669; border-color: #6ee7b7; }
        .priority-radio:checked + .priority-label.medium { background: #fff7ed; color: #ea580c; border-color: #fdba74; }
        .priority-radio:checked + .priority-label.high { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }

        /* Área de Subida de Fotos */
        .upload-container { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; background: #f8fafc; transition: border-color 0.2s; position: relative; }
        .upload-container:hover { border-color: #2563eb; background: #eff6ff; }
        .upload-icon { font-size: 32px; color: #64748b; margin-bottom: 10px; }
        .upload-text { font-size: 13px; color: #475569; margin-bottom: 5px; }
        .upload-subtext { font-size: 11px; color: #94a3b8; }
        #fileEvidence { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
        
        /* Previsualización */
        #previewContainer { margin-top: 15px; display: none; position: relative; width: fit-content; }
        #imagePreview { max-width: 100%; height: auto; max-height: 200px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .remove-image-btn { position: absolute; top: -10px; right: -10px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }

        .modal-footer-pro { padding: 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px; border-radius: 0 0 16px 16px; }
        .btn-cancel { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .btn-submit { background: #2563eb; border: none; color: white; padding: 10px 25px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .btn-submit:hover { background: #1d4ed8; }
        .loading-spinner { display: none; }
    </style>
</head>
<body>

    <nav class="navbar">
        <div style="font-weight: 800; font-size: 18px;">CopierMaster <span style="font-weight:400; opacity:0.8;">HelpDesk</span></div>
        <div class="user-info">
            <span id="userDisplay">Cargando...</span>
            <button onclick="logoutSystem()" style="background:#334155; border:none; color:white; padding:8px 12px; border-radius:6px; cursor:pointer;"><i class="fas fa-sign-out-alt"></i></button>
        </div>
    </nav>

    <div class="main-container">
        <div class="header-actions">
            <h1 class="page-title" id="dashboardTitle">Mis Asignaciones</h1>
            <button id="btnCreateTicket" style="display:none; background:#2563eb; color:white; padding:12px 24px; border:none; border-radius:8px; font-weight:600; cursor:pointer; align-items:center; gap:8px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);" onclick="showCreateModal()">
                <i class="fas fa-plus-circle"></i> Nuevo Reporte de Servicio
            </button>
        </div>

        <div id="loadingMsg" style="text-align:center; margin-top:50px; color:#64748b;">
            <i class="fas fa-spinner fa-spin"></i> Conectando...
        </div>

        <div id="ticketsGrid" class="tickets-grid"></div>
    </div>

    <div id="modalCreate" class="modal-overlay">
        <div class="modal-box-pro">
            <div class="modal-header-pro">
                <h3><i class="fas fa-file-medical-alt"></i> Nuevo Reporte de Servicio</h3>
                <button onclick="closeModals()" style="background:none; border:none; color:white; font-size:20px; cursor:pointer;"><i class="fas fa-times"></i></button>
            </div>
            
            <form id="formCreate">
                <div class="modal-body-pro">
                    <div class="form-section">
                        <label class="form-label-pro"><i class="fas fa-print" style="color:#3b82f6;"></i> Equipo Afectado</label>
                        <select id="selectEquipment" class="form-control-pro" required>
                            <option value="">Cargando inventario...</option>
                        </select>
                    </div>

                    <div class="form-section">
                        <label class="form-label-pro"><i class="fas fa-tachometer-alt" style="color:#f59e0b;"></i> Nivel de Urgencia / Impacto</label>
                        <div class="priority-group">
                            <input type="radio" id="prioLow" name="priority" value="Baja" class="priority-radio">
                            <label for="prioLow" class="priority-label low"><i class="fas fa-arrow-down"></i> Baja (Consultas)</label>
                            
                            <input type="radio" id="prioMedium" name="priority" value="Media" class="priority-radio" checked>
                            <label for="prioMedium" class="priority-label medium"><i class="fas fa-minus"></i> Media (Falla parcial)</label>
                            
                            <input type="radio" id="prioHigh" name="priority" value="Alta" class="priority-radio">
                            <label for="prioHigh" class="priority-label high"><i class="fas fa-arrow-up"></i> Alta (Equipo detenido)</label>
                        </div>
                    </div>

                    <div class="form-section">
                        <label class="form-label-pro"><i class="fas fa-align-left" style="color:#64748b;"></i> Descripción Detallada del Problema</label>
                        <textarea id="txtDescription" class="form-control-pro" rows="4" placeholder="Por favor, describa la falla, códigos de error en pantalla, o ruidos inusuales..." required></textarea>
                    </div>

                    <div class="form-section">
                        <label class="form-label-pro"><i class="fas fa-camera" style="color:#64748b;"></i> Evidencia Fotográfica (Opcional)</label>
                        
                        <div class="upload-container" id="uploadDropZone">
                            <i class="fas fa-cloud-upload-alt upload-icon"></i>
                            <div class="upload-text">Toque aquí para seleccionar una foto</div>
                            <div class="upload-subtext">Formatos: JPG, PNG. Máx 5MB.</div>
                            <input type="file" id="fileEvidence" accept="image/png, image/jpeg, image/jpg">
                        </div>
                        
                        <div id="previewContainer">
                            <img id="imagePreview" src="" alt="Previsualización">
                            <button type="button" class="remove-image-btn" onclick="removeImage()"><i class="fas fa-times"></i></button>
                        </div>
                    </div>
                </div>

                <div class="modal-footer-pro">
                    <button type="button" class="btn-cancel" onclick="closeModals()">Cancelar</button>
                    <button type="submit" class="btn-submit" id="btnSubmitReport">
                        <span class="btn-text">Enviar Reporte Oficial</span>
                        <i class="fas fa-paper-plane btn-icon"></i>
                        <i class="fas fa-spinner fa-spin loading-spinner"></i>
                    </button>
                </div>
            </form>
        </div>
    </div>
    <div id="modalAttend" class="modal-overlay">
        <div class="modal-box-pro" style="max-width:500px;">
            <div class="modal-header-pro" style="background:#1e40af; padding:15px;">
                <h3 style="font-size:16px;"><i class="fas fa-tools"></i> Reporte de Servicio Técnico</h3>
            </div>
            <div class="modal-body-pro">
                <p id="attendTicketInfo" style="color:#64748b; font-size:14px; margin-bottom:15px; font-weight:600;"></p>
                <form id="formAttend">
                    <input type="hidden" id="attendId">
                    <div class="form-section">
                        <label class="form-label-pro">Diagnóstico Técnico</label>
                        <textarea id="txtDiagnosis" class="form-control-pro" rows="3" required></textarea>
                    </div>
                    <div class="form-section">
                        <label class="form-label-pro">Solución Aplicada / Repuestos</label>
                        <textarea id="txtSolution" class="form-control-pro" rows="3" required></textarea>
                    </div>
                    <div class="form-section">
                        <label class="form-label-pro">Estado Final</label>
                        <select id="selStatus" class="form-control-pro">
                            <option value="in_progress">En Proceso (Pendiente repuesto/visita)</option>
                            <option value="closed">Finalizado (Equipo operativo)</option>
                        </select>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                        <button type="button" class="btn-cancel" onclick="closeModals()">Cancelar</button>
                        <button type="submit" class="btn-submit" style="background:#10b981;">Registrar Servicio</button>
                    </div>
                </form>
            </div>
        </div>
    </div>


    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/supabase.js"></script>
    <script src="js/tickets.js"></script>
</body>
</html>
