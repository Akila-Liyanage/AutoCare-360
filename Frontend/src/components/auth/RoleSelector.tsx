import React from 'react';
import { Car, Wrench, ShieldCheck } from 'lucide-react';

export type AuthRole = 'owner' | 'garage' | 'admin';

interface RoleSelectorProps {
  selectedRole: AuthRole;
  onSelectRole: (role: AuthRole) => void;
}

interface RoleItem {
  id: AuthRole;
  label: string;
  activeClass: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const ROLES: RoleItem[] = [
  { id: 'owner', label: 'Vehicle Owner', activeClass: 'is-owner-active', Icon: Car },
  { id: 'garage', label: 'Verified Garage', activeClass: 'is-garage-active', Icon: Wrench },
  { id: 'admin', label: 'System Admin', activeClass: 'is-admin-active', Icon: ShieldCheck },
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onSelectRole }) => {
  return (
    <div className="autocare-role-selector">
      <span className="autocare-role-eyebrow" id="role-selector-label">
        Select Your Access Role
      </span>
      <div 
        className="autocare-role-tabs-grid" 
        role="group" 
        aria-labelledby="role-selector-label"
      >
        {ROLES.map(({ id, label, activeClass, Icon }) => {
          const isActive = selectedRole === id;
          return (
            <button
              key={id}
              type="button"
              className={`autocare-role-tab ${isActive ? activeClass : ''}`}
              onClick={() => onSelectRole(id)}
              aria-pressed={isActive}
              aria-label={`Select ${label} access role`}
            >
              <Icon className="autocare-role-tab-icon" />
              <span className="autocare-role-tab-text">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoleSelector;
