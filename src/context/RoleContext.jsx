import { createContext, useContext, useState } from 'react';
import { ROLE_NAV_PERMISSIONS, ROLE_ACTION_PERMISSIONS } from '../data/mockData';

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [currentRole, setCurrentRole] = useState('管理员');
  const [actionPermissions, setActionPermissions] = useState({ ...ROLE_ACTION_PERMISSIONS });

  const canSeeNav = (path) => (ROLE_NAV_PERMISSIONS[currentRole] || []).includes(path);
  const canDo = (action) => (actionPermissions[currentRole] || []).includes(action);

  const updateActionPermission = (role, action, hasPermission) => {
    setActionPermissions((prev) => {
      const perms = prev[role] || [];
      return {
        ...prev,
        [role]: hasPermission ? [...perms, action] : perms.filter((a) => a !== action),
      };
    });
  };

  return (
    <RoleContext.Provider value={{ currentRole, setCurrentRole, canSeeNav, canDo, actionPermissions, updateActionPermission }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
