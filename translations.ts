

export const translations = {
  en: {
    // Survey Headers
    surveyTitle: "Service Request Survey",
    surveySubtitle: "For",
    surveySubtitleProperties: "Properties",
    languageToggle: "Español",

    // Fieldset Legends
    propertyIdLegend: "Property Identification",
    contactInfoLegend: "Contact Information",
    scopeTimelineLegend: "Scope & Timeline",
    contactMethodLegend: "How would you like to be contacted?",
    photosLegend: "Photos & Attachments",

    // Field Labels
    propertyNameLabel: "Property Name",
    propertyAddressLabel: "Property Address",
    firstNameLabel: "First Name",
    lastNameLabel: "Last Name",
    titleRoleLabel: "Title / Role",
    phoneLabel: "Phone Number",
    emailLabel: "Email Address",
    unitInfoLabel: "Unit # / Unit Count / Area",
    serviceNeededLabel: "Service Needed (Select Multiple)",
    timelineLabel: "Project Timeline",
    notesLabel: "Additional Notes and Dynamics",
    photosLabel: "Upload 'Before' Photos (Max 2MB per file)",
    photosPermissionHint: "Setup Note: Ensure Google Script is authorized for Drive access if photos fail to appear.",

    // Placeholders & Default Text
    propertySelectPlaceholder: "Select Property...",
    addressPlaceholder: "Address auto-populates...",
    roleSelectPlaceholder: "Select Role...",
    unitInfoPlaceholder: "Tell us the site directions...",
    otherServicePlaceholder: "Please specify 'Other' service",
    timelineSelectPlaceholder: "Select timeline...",
    notesPlaceholder: "Let it all out here. We'll figure it out fast...",
    dragDropText: "Drag & Drop photos here, or click to select",

    // Buttons
    generateAIDraftButton: "Generate AI Draft",
    generatingButton: "Generating...",
    submitButton: "SUBMIT FOR IMMEDIATE REPLY",
    submittingButton: "Submitting...",
    submitAnotherButton: "Submit Another Request",
    enterDashboardButton: "Enter Personal Dashboard",
    uploadButton: "Add Photos",
    removePhoto: "Remove",

    // Submission Status Messages
    submitSuccessTitle: "Submission Received!",
    submitSuccessMessage1: "Thank you for your request. Our team will get back to you shortly.",
    submitSuccessMessage2: "You can track this request in your dashboard.",
    photosUploadedBadge: "Photos Uploaded Successfully",
    returnHomeButton: "Return to Home",
    submitErrorTitle: "Submission Failed",
    submitErrorMessage1: "There was an error processing your request.",
    submitErrorMessage2: "Please try again or contact us directly if the problem persists.",
    tryAgainButton: "Try Again",

    // Chat Widget
    chatTitle: "Assistant", // Removed company name
    chatPlaceholder: "Ask about services or get help...",
    chatSend: "Send",

    // Dashboard
    dashboardLoginTitle: "Client Portal",
    dashboardLoginSubtitle: "Secure access for Property Managers",
    accessCodeLabel: "Enter Access Code",
    loginButton: "Enter Dashboard",
    tabOverview: "Overview",
    tabNewRequest: "New Request",
    tabGallery: "Photo Gallery",
    tabHistory: "History",
    // NEW TABS
    tabEstimating: "Quick Estimates",
    tabProjects: "Project Tracking",
    tabDataSources: "Data Sources", // NEW
    
    statsActive: "Active Jobs",
    statsCompleted: "Completed",
    statsPending: "Pending Approval",
    recentActivity: "Recent Activity",
    galleryTitle: "Project Photos",
    gallerySubtitle: "View your recent remodeling updates",
    logout: "Log Out",
    
    // Roles
    roleSiteManager: "Site Manager",
    roleRegionalManager: "Regional Manager",
    roleExecutive: "Executive",
    roleInternalAdmin: "Jes Stone Admin",

    // Company Portal
    companyPortalTitle: "Command Center",
    companyPortalSubtitle: "Internal Administration",
    dataSourcesTitle: "Connected Data Sources",
    dataSourcesSubtitle: "Direct access to backend files.",
    systemStatusTitle: "System Status", // NEW
    testChatButton: "Test Chat Connection", // NEW
    googleSheetLabel: "Responses Database",
    googleDriveLabel: "Photo Repository",
    openSheetButton: "Open Google Sheet",
    openDriveButton: "Open Drive Folder",

    // Options (Arrays)
    SERVICES: [
      'Countertops - Quartz',
      'Countertops - Granite',
      'Cabinets - Refacing',
      'Cabinets - Replacement',
      'Contract Make-Ready',
      'Tile - Wall',
      'Tile - Flooring',
      'Other: we have many Associate Subs',
    ],
    TITLES: [
      'Onsite Manager',
      'Onsite Maintenance',
      'Regional Manager',
    ],
    TIMELINES: [
      'Emergency',
      'Service - Time Sensitive',
      'Service - Repairs',
      'Consultation',
      'CapEx Budget - Future',
      'CapEx Budget - Surplus'
    ],
    CONTACT_METHODS: [
      'Phone Call (immediate)',
      'Email Reply',
      'Text Message (SMS)',
    ],
  },
  es: {
    // Encabezados de la Encuesta
    surveyTitle: "Encuesta de Solicitud de Servicio",
    surveySubtitle: "Para Propiedades de",
    surveySubtitleProperties: "", // Appended after company name
    languageToggle: "English",

    // Leyendas de Fieldset
    propertyIdLegend: "Identificación de la Propiedad",
    contactInfoLegend: "Información de Contacto",
    scopeTimelineLegend: "Alcance y Cronograma",
    contactMethodLegend: "¿Cómo le gustaría ser contactado?",
    photosLegend: "Fotos y Adjuntos",

    // Etiquetas de Campo
    propertyNameLabel: "Nombre de la Propiedad",
    propertyAddressLabel: "Dirección de la Propiedad",
    firstNameLabel: "Nombre",
    lastNameLabel: "Apellido",
    titleRoleLabel: "Título / Cargo",
    phoneLabel: "Número de Teléfono",
    emailLabel: "Correo Electrónico",
    unitInfoLabel: "Nº de Unidad / Cantidad / Área",
    serviceNeededLabel: "Servicio Requerido (Seleccione Múltiples)",
    timelineLabel: "Cronograma del Proyecto",
    notesLabel: "Notas y Dinámicas Adicionales",
    photosLabel: "Subir fotos 'Antes' (Máx. 2MB por archivo)",
    photosPermissionHint: "Nota: Asegúrese de que el Script de Google esté autorizado para acceder a Drive.",

    // Placeholders y Texto por Defecto
    propertySelectPlaceholder: "Seleccione una propiedad...",
    addressPlaceholder: "La dirección se autocompleta...",
    roleSelectPlaceholder: "Seleccione Cargo...",
    unitInfoPlaceholder: "Díganos las direcciones del sitio...",
    otherServicePlaceholder: "Por favor, especifique el servicio 'Otro'",
    timelineSelectPlaceholder: "Seleccione cronograma...",
    notesPlaceholder: "Cuéntenos todo aquí. Lo resolveremos rápido...",
    dragDropText: "Arrastre fotos aquí, o haga clic para seleccionar",

    // Botones
    generateAIDraftButton: "Generar Borrador con IA",
    generatingButton: "Generando...",
    submitButton: "ENVIAR PARA RESPUESTA INMEDIATA",
    submittingButton: "Enviando...",
    submitAnotherButton: "Enviar Otra Solicitud",
    enterDashboardButton: "Entrar al Panel Personal",
    uploadButton: "Agregar Fotos",
    removePhoto: "Eliminar",

    // Mensajes de Estado de Envío
    submitSuccessTitle: "¡Solicitud Recibida!",
    submitSuccessMessage1: "Gracias por su solicitud. Nuestro equipo se pondrá en contacto con usted en breve.",
    submitSuccessMessage2: "Puede rastrear esta solicitud en su panel.",
    photosUploadedBadge: "Fotos Subidas Exitosamente",
    returnHomeButton: "Volver al Inicio",
    submitErrorTitle: "Error en el Envío",
    submitErrorMessage1: "Hubo un error al procesar su solicitud.",
    submitErrorMessage2: "Por favor, inténtelo de nuevo o contáctenos directamente si el problema persiste.",
    tryAgainButton: "Intentar de Nuevo",

    // Chat Widget
    chatTitle: "Asistente",
    chatPlaceholder: "Pregunte sobre servicios o ayuda...",
    chatSend: "Enviar",

    // Dashboard
    dashboardLoginTitle: "Portal de Clientes",
    dashboardLoginSubtitle: "Acceso seguro para Gerentes",
    accessCodeLabel: "Código de Acceso",
    loginButton: "Entrar al Panel",
    tabOverview: "Resumen",
    tabNewRequest: "Nueva Solicitud",
    tabGallery: "Galería de Fotos",
    tabHistory: "Historial",
    // NEW TABS
    tabEstimating: "Estimaciones Rápidas",
    tabProjects: "Seguimiento de Proyectos",
    tabDataSources: "Fuentes de Datos",

    statsActive: "Trabajos Activos",
    statsCompleted: "Completados",
    statsPending: "Pendiente Aprobación",
    recentActivity: "Actividad Reciente",
    galleryTitle: "Fotos del Proyecto",
    gallerySubtitle: "Vea sus actualizaciones recientes",
    logout: "Cerrar Sesión",
    
    // Roles
    roleSiteManager: "Gerente de Sitio",
    roleRegionalManager: "Gerente Regional",
    roleExecutive: "Ejecutivo",
    roleInternalAdmin: "Admin Jes Stone",

    // Company Portal
    companyPortalTitle: "Centro de Comando",
    companyPortalSubtitle: "Administración Interna",
    dataSourcesTitle: "Fuentes de Datos Conectadas",
    dataSourcesSubtitle: "Acceso directo a archivos backend.",
    systemStatusTitle: "Estado del Sistema",
    testChatButton: "Probar Conexión de Chat",
    googleSheetLabel: "Base de Datos de Respuestas",
    googleDriveLabel: "Repositorio de Fotos",
    openSheetButton: "Abrir Hoja de Google",
    openDriveButton: "Abrir Carpeta Drive",

    // Opciones (Arrays)
    SERVICES: [
      'Encimeras - Cuarzo',
      'Encimeras - Granito',
      'Gabinetes - Renovación',
      'Gabinetes - Reemplazo',
      'Preparación para Alquiler',
      'Azulejo - Pared',
      'Azulejo - Piso',
      'Otro: tenemos muchos subcontratistas asociados',
    ],
    TITLES: [
      'Gerente de Sitio',
      'Mantenimiento de Sitio',
      'Gerente Regional',
    ],
    TIMELINES: [
      'Emergencia',
      'Servicio - Urgente',
      'Servicio - Reparaciones',
      'Consulta',
      'Presupuesto CapEx - Futuro',
      'Presupuesto CapEx - Excedente'
    ],
    CONTACT_METHODS: [
      'Llamada Telefónica (inmediata)',
      'Respuesta por Correo Electrónico',
      'Mensaje de Texto (SMS)',
    ],
  }
};