
export const translations = {
  en: {
    // Survey Headers
    surveyTitle: "Service Assistant",
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
    emailLabel: "Email Address(es) (Separate with commas)",
    unitInfoLabel: "Unit # / Unit Count / Area",
    serviceNeededLabel: "Primary Service Needed",
    timelineLabel: "Project Timeline",
    notesLabel: "Additional Notes and Dynamics",
    photosLabel: "Upload 'Before' Photos (Max 2MB per file)",
    photosPermissionHint: "Setup Note: Ensure Google Script is authorized for Drive access if photos fail to appear.",
    ccManagersLabel: "CC Managers / Boss (Optional)",

    // Placeholders & Default Text
    propertySelectPlaceholder: "Select Property...",
    addressPlaceholder: "Address auto-populates...",
    roleSelectPlaceholder: "Select Role...",
    unitInfoPlaceholder: "Tell us the site directions...",
    otherServicePlaceholder: "Please specify 'Other' service",
    timelineSelectPlaceholder: "Select timeline...",
    notesPlaceholder: "Let it all out here. We'll figure it out fast...",
    dragDropText: "Drag & Drop photos here, or click to select",
    emailPlaceholder: "e.g. you@company.com, boss@company.com",

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
    chatTitle: "Assistant", 
    chatPlaceholder: "Ask about services or get help...",
    chatSend: "Send",

    // Dashboard
    dashboardLoginTitle: "Client Portal",
    dashboardLoginSubtitle: "Secure access for Property Managers",
    accessCodeLabel: "Enter Access Code",
    loginButton: "Enter Dashboard",
    tabOverview: "Resumen",
    tabNewRequest: "Nueva Solicitud",
    tabGallery: "Galería de Fotos",
    tabHistory: "Historial",
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
    
    // Project Management Module
    projTitleClient: "Mis Proyectos",
    projTitleCompany: "Rastreador Global de Proyectos",
    projSubtitleClient: "Rastree el estado de sus servicios solicitados.",
    projSubtitleCompany: "Monitoree trabajos activos en todas las propiedades.",
    projFilterAll: "Todos",
    projFilterProduction: "Producción",
    projFilterProcurement: "Adquisiciones",
    projFilterPlanning: "Planificación",
    projFilterCompleted: "Completado",
    projStatusOnSchedule: "A Tiempo",
    projStatusWaiting: "Esperando Material",
    projStatusPermitting: "Permisos",
    projStatusReady: "Listo",

    // Roles
    roleSiteManager: "Gerente de Sitio",
    roleRegionalManager: "Gerente Regional",
    roleExecutive: "Ejecutivo",
    roleInternalAdmin: "Admin Jes Stone",

    // Company Portal
    companyPortalTitle: "Command Center",
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