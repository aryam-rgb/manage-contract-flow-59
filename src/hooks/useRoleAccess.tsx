import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'manager' | 'user' | 'reviewer' | 'approval';

export interface RolePermissions {
  canCreateContract: boolean;
  canEditContract: boolean;
  canReviewContract: boolean;
  canApproveContract: boolean;
  canDeleteContract: boolean;
  canViewAllContracts: boolean;
  canAssignReviewer: boolean;
}

export const useRoleAccess = () => {
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [permissions, setPermissions] = useState<RolePermissions>({
    canCreateContract: false,
    canEditContract: false,
    canReviewContract: false,
    canApproveContract: false,
    canDeleteContract: false,
    canViewAllContracts: false,
    canAssignReviewer: false,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchUserRole = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no role found, default to user
        if (error.code === 'PGRST116') {
          await createDefaultRole();
          return;
        }
        throw error;
      }

      const role = data.role as UserRole;
      setUserRole(role);
      setPermissions(getRolePermissions(role));
    } catch (error) {
      console.error('Error fetching user role:', error);
      // Default to user on error
      setUserRole('user');
      setPermissions(getRolePermissions('user'));
    } finally {
      setLoading(false);
    }
  };

  const createDefaultRole = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: user.id,
          role: 'user',
        }]);

      if (error) throw error;

      setUserRole('user');
      setPermissions(getRolePermissions('user'));
    } catch (error) {
      console.error('Error creating default role:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRolePermissions = (role: UserRole): RolePermissions => {
    switch (role) {
      case 'user': // Department users
        return {
          canCreateContract: true,
          canEditContract: true, // Only own contracts
          canReviewContract: false,
          canApproveContract: false,
          canDeleteContract: false,
          canViewAllContracts: false,
          canAssignReviewer: false,
        };
      case 'reviewer': // Legal reviewers
        return {
          canCreateContract: true,
          canEditContract: true,
          canReviewContract: true,
          canApproveContract: false,
          canDeleteContract: false,
          canViewAllContracts: true,
          canAssignReviewer: true,
        };
      case 'approval': // Legal approvers
        return {
          canCreateContract: true,
          canEditContract: true,
          canReviewContract: true,
          canApproveContract: true,
          canDeleteContract: true,
          canViewAllContracts: true,
          canAssignReviewer: true,
        };
      case 'manager': // Department managers
        return {
          canCreateContract: true,
          canEditContract: true,
          canReviewContract: true,
          canApproveContract: false,
          canDeleteContract: false,
          canViewAllContracts: true,
          canAssignReviewer: false,
        };
      case 'admin':
        return {
          canCreateContract: true,
          canEditContract: true,
          canReviewContract: true,
          canApproveContract: true,
          canDeleteContract: true,
          canViewAllContracts: true,
          canAssignReviewer: true,
        };
      default:
        return {
          canCreateContract: false,
          canEditContract: false,
          canReviewContract: false,
          canApproveContract: false,
          canDeleteContract: false,
          canViewAllContracts: false,
          canAssignReviewer: false,
        };
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole,
        });

      if (error) throw error;

      // If updating current user's role, refresh permissions
      if (userId === user?.id) {
        setUserRole(newRole);
        setPermissions(getRolePermissions(newRole));
      }

      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  };

  const canPerformAction = (action: keyof RolePermissions, contractCreatedBy?: string): boolean => {
    const permission = permissions[action];
    
    // For editing and viewing own contracts
    if (action === 'canEditContract' && contractCreatedBy && user) {
      return permission && (contractCreatedBy === user.id || permissions.canViewAllContracts);
    }
    
    return permission;
  };

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setLoading(false);
    }
  }, [user]);

  return {
    userRole,
    permissions,
    loading,
    updateUserRole,
    canPerformAction,
    refreshRole: fetchUserRole,
  };
};