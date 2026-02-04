export const queryKeys = {
  auth: {
    login: "auth-login",
    logout: "auth-logout",
  },

  users: {
    all: "users-all",
    detail: (id: string) => `users-detail-${id}`,
    statistics: "users-statistics",
  },
  organizations: {
    list: "organizations-list",
  },

  monitoring: {
    get: "monitroing",
  },

  classificators: {
    list: "classificators-list",
    create: "create-classificator",
    edit: "edit-classificator",
    delete: "delete-classificator",
    detail: (id: string) => `classificator-detail-${id}`,
  },
  departments: {
    list: "departments",
    create: "create-department",
    edit: "edit-department",
    delete: "delete-department",
  },
  bulletins: {
    list: "bulletins",
    create: "create-bulletin",
    edit: "edit-bulletin",
    delete: "delete-bulletin",
    detail: (id: string) => `bulletin-detail-${id}`,
    createRow: "create-bulletin-row",
    updateRow: "update-bulletin-row",
    deleteRow: "delete-bulletin-row",
    deleteFile: "delete-bulletin-file",
  },
  logs: {
    list: "logs-list",
  },
  orders: {
    all: "orders-all",
    create: "orders-create",
    delete: "delete-order",
    edit: "edit-order",
    confirm: "confirm-order",
  },
  locomotives: {
    list: "locomotives-list",
    models: {
      list: "locomotive-models-list",
    },
    detail: (id: string | number) => `locomotives-detail-${id}`,
  },
  inspectionTypes: {
    list: "inspection-types-list",
  },
  pantograph: {
    all: "pantograph-all",
    create: "pantograph-create",
    update: "pantograph-update",
    delete: "pantograph-delete",
  },
  defectiveWorks: {
    all: "defective-works-all",
    create: "defective-works-create",
    update: "defective-works-update",
    delete: "defective-works-delete",
    bulkCreate: "defective-works-bulk-create",
  },
  delays: {
    all: "delays-all",
    detail: (id: string | number) => `delays-detail-${id}`,
    create: "delays-create",
    update: "delays-update",
    delete: "delays-delete",
    bulkCreate: "delays-bulk-create",
    reports: "delays-reports",
    depotReasonReports: "delays-depot-reason-reports",
  },
  tu152: {
    all: "tu152-all",
    locomotives: "tu152-locomotives",
    locomotiveModels: "tu152-locomotive-models",
    update: "tu152-update",
  },
  components: {
    list: "components-list",
  },
  componentRegistry: {
    all: "component-registry-all",
    create: "component-registry-create",
    delete: "component-registry-delete",
  },
  locomotivePassportInspections: {
    all: "locomotive-passport-inspections-all",
    create: "locomotive-passport-inspections-create",
    update: "locomotive-passport-inspections-update",
    delete: "locomotive-passport-inspections-delete",
  },
  locomotiveReplacementOils: {
    all: "locomotive-replacement-oils-all",
    create: "locomotive-replacement-oils-create",
    update: "locomotive-replacement-oils-update",
    delete: "locomotive-replacement-oils-delete",
  },
  inspections: {
    list: "inspections-list",
    update: (id: number) => `inspections-update-${id}`,
  },
  locomotiveMileageReport: {
    get: "locomotive-mileage-report",
  },
} as const;
