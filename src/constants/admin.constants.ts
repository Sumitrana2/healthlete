export interface AdminPermissions {
  brands: {
    view: boolean;
    approve: boolean;
    reject: boolean;
    delete: boolean;
  };
  athletes: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  admins: {
    view: boolean;
    create: boolean;
    delete: boolean;
  };
  campaigns: {
    view: boolean;
    edit: boolean;
    delete: boolean;
  };
}

export const SUPER_ADMIN_PERMISSIONS: AdminPermissions = {
  brands: { view: true, approve: true, reject: true, delete: true },
  athletes: { view: true, create: true, edit: true, delete: true },
  admins: { view: true, create: true, delete: true },
  campaigns: { view: true, edit: true, delete: true },
};

export const SUB_ADMIN_PERMISSIONS: AdminPermissions = {
  brands: { view: true, approve: false, reject: false, delete: false },
  athletes: { view: true, create: false, edit: false, delete: false },
  admins: { view: false, create: false, delete: false },
  campaigns: { view: true, edit: false, delete: false },
};
