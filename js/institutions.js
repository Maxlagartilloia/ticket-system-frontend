<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Centro de Operaciones | CopierMaster</title>
    <link rel="stylesheet" href="css/styles.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script> <style>
        /* ESTILOS DEL DASHBOARD (KPIs y Tablas) */
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .kpi-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-left: 5px solid #cbd5e1; position: relative; overflow: hidden; }
        .kpi-title { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 5px; }
        .kpi-value { font-size: 28px; font-weight: 800; color: #0f172a; }
        
        .chart-container { position: relative; height: 120px; width: 100%; margin-top: 10px; }
        
        /* Controles y Filtros */
        .control-bar { background: white; padding: 15px 20px; border-radius: 12px; margin-bottom: 25px; display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-end; justify-content: space-between; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .filter-group { display: flex; gap: 10px; align-items: flex-end; }
        .input-group label { display: block; font-size: 11px; font-weight: bold; color: #64748b; margin-bottom: 4px; }
        .input-group input { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; color: #334155; }
        
        .btn-action { padding: 9px 16px; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer; border: none; display: flex; align-items: center; gap: 8px; transition: transform 0.1s; }
        .btn-action:hover { transform: translateY(-1px); }
        .btn-filter { background: #0f172a; color: white; }
        .btn-report { background: #10b981; color: white; }
        .btn-new { background: #ef4444; color: white; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.25); }

        /* Tabla de Servicios */
        .table-wrapper { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f8fafc; padding: 15px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
        td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155; }
        tr:hover { background: #f8fafc; }
        .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .st-open { background: #fee2e2; color: #991b1b; }
        .st-process { background: #fef3c7; color: #92400e; }
        .st-closed { background: #dcfce7; color: #166534; }
        
        .action-icon { cursor: pointer; color: #94a3b8; font-size: 16px; margin-left: 8px; transition: color 0.2s; }
        .action-icon:hover { color: #3b82f6; }
        .pdf-icon { color: #ef4444; }

        /* --- ESTILOS DEL REPORTE PDF (OCULTO) --- */
        /* Este diseño imita exactamente la imagen "Elegante" que subiste */
        #pdf-template-container {
            display: none; /* Oculto en pantalla */
            width: 210mm; min-height: 297mm; padding: 15mm;
            background: white; font-family: 'Inter', sans-serif;
            color: #334155; box-sizing: border-box;
        }
        .pdf-header { display: flex; justify-content: space-between; border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
        .pdf-title { font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1; }
        .pdf-subtitle { font-size: 12px; color: #64748b; margin-top: 5px; }
        .pdf-id-box { text-align: right; }
        .pdf-ticket-id { font-size: 32px; font-weight: 800; color: #ef4444; display: block; }
        .pdf-date { background: #f1f5f9; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #475569; display: inline-block; margin-top: 5px; }

        .pdf-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
        .pdf-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; background: #fff; position: relative; }
        .pdf-card::before { content: ''; position: absolute; left: 0; top: 15px; bottom: 15px; width: 4px; background: #3b82f6; border-radius: 0 4px 4px 0; }
        .pdf-label { font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 4px; display: block; }
        .pdf-value { font-size: 16px; font-weight: 700; color: #0f172a; }

        /* Barras visuales */
        .pdf-metrics { margin-bottom: 30px; }
        .metric-row { display: flex; align-items: center; margin-bottom: 10px; font-size: 11px; font-weight: 600; }
        .metric-label { width: 150px; color: #0f172a; }
        .metric-track { flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin: 0 10px; }
        .metric-fill { height: 100%; border-radius: 4px; }
        .fill-red { background: #ef4444; width: 85%; }
        .fill-green { background: #10b981; width: 98%; }

        /* Área de Evidencia */
        .pdf-evidence { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 10px; text-align: center; margin-bottom: 25px; background: #f8fafc; }
        .pdf-img { max-height: 250px; max-width: 100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .pdf-caption { font-style: italic; color: #64748b; font-size: 12px; margin-top: 10px; }

        /* Banner Técnico (Azul Oscuro) */
        .pdf-tech-banner {
            background: #0f172a; color: white; border-radius: 12px; padding: 20px;
            display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;
        }
        .tech-profile { display: flex; align-items: center; gap: 15px; }
        .tech-initial { width: 50px; height: 50px; background: #3b82f6; color: white; border-radius: 50%; font-size: 24px; font-weight: bold; display: flex; justify-content: center; align-items: center; }
        .tech-times { display: flex; gap: 30px; border-left: 1px solid #334155; padding-left: 30px; }
        .time-box { text-align: center; }
        .time-val { color: #38bdf8; font-weight: 700; font-size: 18px; }
        .time-lbl { font-size: 10px; color: #94a3b8; text-transform: uppercase; }

        /* Solución (Verde) */
        .pdf-solution { background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 12px; padding: 20px; color: #064e3b; margin-bottom: 40px; }
        
        .pdf-footer { display: flex; justify-content: space-between; margin-top: 50px; }
        .sign-line { width: 40%; border-top: 1px solid #0f172a; text-align: center; padding-top: 10px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    </style>
</head>
<body>

    <aside class="sidebar">
        <div class="sidebar-brand">
            <div style="font-weight:800; font-size:20px; color:white; display:flex; align-items:center; gap:10px;">
                <i class="fas fa-layer-group" style="color:#3b82f6;"></i> CopierMaster
            </div>
        </div>
        <ul class="sidebar-menu">
            <li class="menu-item active" onclick="location.href='dashboard.html'"><i class="fas fa-chart-pie"></i> Dashboard</li>
            <li class="menu-item" onclick="location.href='tickets.html'"><i class="fas fa-ticket-alt"></i> Help Desk</li>
            <li class="menu-item" onclick="location.href='institutions.html'"><i class="fas fa-building"></i> Clientes</li>
            <li class="menu-item" onclick="location.href='equipment.html'"><i class="fas fa-print"></i> Equipos</li>
            <li class="menu-item" onclick="location.href='technicians.html'"><i class="fas fa-users-cog"></i> Técnicos</li>
            <li class="menu-item" onclick="location.href='reports.html'"><i class="fas fa-file-invoice-dollar"></i> Reportes</li>
        </ul>
    </aside>

    <main class="main-content">
        <header class="top-bar">
            <div class="page-title">Visión Estratégica</div>
            <div style="display:flex; align-items:center; gap:15px;">
                <span id="userInfo" style="font-weight:600; font-size:13px;">Cargando...</span>
                <button class="btn-logout" onclick="logout()"><i class="fas fa-power-off"></i></button>
            </div>
        </header>

        <div class="scroll-area">
            
            <div class="control-bar">
                <div class="filter-group">
                    <div class="input-group">
                        <label>Desde Fecha</label>
                        <input type="date" id="dateFrom">
                    </div>
                    <div class="input-group">
                        <label>Hasta Fecha</label>
                        <input type="date" id="dateTo">
                    </div>
                    <button class="btn-action btn-filter" onclick="aplicarFiltros()">
                        <i class="fas fa-filter"></i> Actualizar
                    </button>
                </div>
                
                <div style="display:flex; gap:10px;">
                    <button class="btn-action btn-report" onclick="generarReporteConsolidado()">
                        <i class="fas fa-file-excel"></i> Consolidado
                    </button>
                    <button id="btnNewTicket" class="btn-action btn-new" style="display:none;" onclick="abrirModalTicket()">
                        <i class="fas fa-plus-circle"></i> Nuevo Servicio
                    </button>
                </div>
            </div>

            <div class="kpi-grid">
                <div class="kpi-card" style="border-color: #ef4444;">
                    <div class="kpi-title">Pendientes</div>
                    <div class="kpi-value" id="openTickets" style="color:#ef4444">0</div>
                    <div class="chart-container"><canvas id="chartOpen"></canvas></div>
                </div>
                <div class="kpi-card" style="border-color: #f59e0b;">
                    <div class="kpi-title">En Ejecución</div>
                    <div class="kpi-value" id="inProgress" style="color:#f59e0b">0</div>
                    <div class="chart-container"><canvas id="chartProgress"></canvas></div>
                </div>
                <div class="kpi-card" style="border-color: #10b981;">
                    <div class="kpi-title">Finalizados (Mes)</div>
                    <div class="kpi-value" id="closedMonth" style="color:#10b981">0</div>
                    <div class="chart-container"><canvas id="chartClosed"></canvas></div>
                </div>
                <div class="kpi-card" style="border-color: #3b82f6;">
                    <div class="kpi-title">Eficiencia SLA</div>
                    <div class="kpi-value" id="slaRate">98%</div>
                    <small style="color:#64748b;">Tiempo promedio: 2h 15m</small>
                </div>
            </div>

            <div class="table-wrapper">
                <div style="padding:15px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; font-size:16px; color:#0f172a;">Historial de Servicios</h3>
                    <span id="recordCount" style="font-size:12px; color:#64748b;">0 registros</span>
                </div>
                <table id="servicesTable">
                    <thead>
                        <tr>
                            <th>ID Ticket</th>
                            <th>Fecha</th>
                            <th>Cliente / Área</th>
                            <th>Equipo</th>
                            <th>Falla Reportada</th>
                            <th>Técnico</th>
                            <th>Estado</th>
                            <th style="text-align:right;">Reporte</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody">
                        <tr><td colspan="8" style="text-align:center; padding:30px;">Cargando datos...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <div id="newTicketModal" class="modal-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:2000; justify-content:center; align-items:center;">
        <div class="modal-box" style="background:white; padding:30px; border-radius:12px; width:500px;">
            <h3 style="margin-top:0;">Solicitar Servicio Técnico</h3>
            <form onsubmit="crearTicket(event)">
                <div style="margin-bottom:15px;">
                    <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:5px;">Equipo Afectado</label>
                    <select id="deviceSelect" style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:6px;" required>
                        <option value="">Cargando equipos...</option>
                    </select>
                </div>
                <div style="margin-bottom:15px;">
                    <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:5px;">Descripción de la Falla</label>
                    <textarea id="issueDesc" rows="4" style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:6px;" required></textarea>
                </div>
                <div style="text-align:right;">
                    <button type="button" onclick="document.getElementById('newTicketModal').style.display='none'" style="margin-right:10px; padding:10px 20px; border:none; background:transparent; cursor:pointer;">Cancelar</button>
                    <button type="submit" style="background:#ef4444; color:white; border:none; padding:10px 20px; border-radius:6px; font-weight:bold;">Enviar Solicitud</button>
                </div>
            </form>
        </div>
    </div>

    <div id="pdf-template-container">
        
        <div class="pdf-header">
            <div>
                <div class="pdf-title">CopierMaster C&G</div>
                <div class="pdf-subtitle">Soluciones Digitales & Mantenimiento Especializado</div>
                <div class="pdf-subtitle"><i class="fas fa-map-marker-alt"></i> Shushufindi, Sucumbíos | <i class="fas fa-phone"></i> +593 99 123 4567</div>
            </div>
            <div class="pdf-id-box">
                <span style="font-size:10px; color:#94a3b8; font-weight:bold; text-transform:uppercase;">Reporte de Servicio N°</span>
                <span class="pdf-ticket-id" id="pdf-id">#1024</span>
                <span class="pdf-date" id="pdf-date">19 ENE 2026</span>
            </div>
        </div>

        <div class="pdf-info-grid">
            <div class="pdf-card">
                <span class="pdf-label"><i class="fas fa-building"></i> Cliente</span>
                <div class="pdf-value" id="pdf-client">HOSPITAL BÁSICO</div>
                <div style="font-size:11px; color:#64748b; margin-top:2px;">RUC: 1234567890001</div>
            </div>
            <div class="pdf-card">
                <span class="pdf-label"><i class="fas fa-print"></i> Equipo Reportado</span>
                <div class="pdf-value" id="pdf-device">RICOH MP 501 SPF</div>
                <div style="font-size:11px; color:#64748b; margin-top:2px;">Serie: <span id="pdf-serial">W334992100</span></div>
            </div>
        </div>

        <div class="pdf-metrics">
            <div style="font-size:12px; font-weight:800; color:#0f172a; margin-bottom:10px; text-transform:uppercase;">
                <i class="fas fa-chart-bar"></i> Métricas del Servicio
            </div>
            <div class="metric-row">
                <span class="metric-label">Nivel de Criticidad</span>
                <div class="metric-track"><div class="metric-fill fill-red"></div></div>
                <span style="width:80px; text-align:right;">Crítico / Alta</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Tiempo Respuesta (SLA)</span>
                <div class="metric-track"><div class="metric-fill fill-green"></div></div>
                <span style="width:80px; text-align:right;">Óptimo (2h)</span>
            </div>
        </div>

        <div class="pdf-evidence">
            <div style="font-size:10px; font-weight:bold; color:#94a3b8; text-transform:uppercase; margin-bottom:10px;">EVIDENCIA DEL PROBLEMA REPORTADO</div>
            <img id="pdf-photo" src="https://via.placeholder.com/600x300/e2e8f0/94a3b8?text=Sin+Evidencia+Fotogr%C3%A1fica" class="pdf-img">
            <div class="pdf-caption" id="pdf-issue">"El equipo presenta atascos continuos..."</div>
        </div>

        <div class="pdf-tech-banner">
            <div class="tech-profile">
                <div class="tech-initial" id="tech-initial">A</div>
                <div>
                    <span style="font-size:10px; text-transform:uppercase; opacity:0.7;">Técnico Responsable</span>
                    <div style="font-size:18px; font-weight:bold;" id="pdf-tech">Alex Loor</div>
                </div>
            </div>
            <div class="tech-times">
                <div class="time-box">
                    <div class="time-lbl">HORA LLEGADA</div>
                    <div class="time-val" id="pdf-arrival">09:30 AM</div>
                </div>
                <div class="time-box">
                    <div class="time-lbl">HORA SALIDA</div>
                    <div class="time-val" id="pdf-departure">11:15 AM</div>
                </div>
                <div class="time-box">
                    <div class="time-lbl">DURACIÓN</div>
                    <div class="time-val" id="pdf-duration">1h 45m</div>
                </div>
            </div>
        </div>

        <div class="pdf-solution">
            <div style="font-size:10px; font-weight:800; text-transform:uppercase; margin-bottom:5px; color:#047857;">DIAGNÓSTICO Y SOLUCIÓN TÉCNICA</div>
            <p style="margin:0; font-weight:500; font-size:12px; line-height:1.5;" id="pdf-solution">
                Se desmontó la unidad de fusión. Se encontró rodillo de presión desgastado. Se procedió al cambio de repuesto.
            </p>
        </div>

        <div class="pdf-footer">
            <div class="sign-line">Firma Técnico</div>
            <div class="sign-line">Conformidad Cliente</div>
        </div>
        
        <div style="text-align:center; margin-top:20px; font-size:9px; color:#cbd5e1;">
            Documento generado electrónicamente por CopierMaster Enterprise System v4.5
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/supabase.js"></script>
    <script src="js/security.js"></script>
    <script src="js/dashboard.js"></script>
</body>
</html>
