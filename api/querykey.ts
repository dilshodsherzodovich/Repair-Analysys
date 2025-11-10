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
    list: "organizations",
    create: "create-organization",
    edit: "edit-organization",
    delete: "delete-organization",
    statistics: "organizations-statistics",
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
    delete: "delete-order",
  },
} as const;
