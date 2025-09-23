import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/components/ui/use-toast';

export interface Contract {
  id: string;
  title: string;
  contract_type: string;
  status: string;
  priority: string;
  created_by: string;
  assigned_to: string | null;
  department_id: string | null;
  unit_id: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  value: number | null;
  created_at: string;
  updated_at: string;
  company_name?: string;
  contact_person?: string;
  duration?: string;
  commencement_date?: string;
  expiry_date?: string;
  departments?: {
    name: string;
  } | null;
  profiles?: {
    full_name: string;
  } | null;
}

export interface ContractFormData {
  companyName: string;
  contractTitle: string;
  contractFilingFileName: string;
  contractType: string;
  department: string;
  unit: string;
  contactPerson: string;
  duration: string | 'Indefinite';
  commencementDate: Date | null;
  expiryDate: Date | null;
  validityStatus: 'Open' | 'Closed' | 'Indefinite';
  description: string;
  remarks: string;
  attachments: File[];
}

export const useContracts = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch additional data for each contract
      const contractsWithDetails = await Promise.all(
        (data || []).map(async (contract) => {
          let departmentName = null;
          let creatorName = null;

          // Fetch department name if department_id exists
          if (contract.department_id) {
            const { data: dept } = await supabase
              .from('departments')
              .select('name')
              .eq('id', contract.department_id)
              .single();
            departmentName = dept?.name || null;
          }

          // Fetch creator name if created_by exists  
          if (contract.created_by) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', contract.created_by)
              .single();
            creatorName = profile?.full_name || null;
          }

          return {
            ...contract,
            departments: departmentName ? { name: departmentName } : null,
            profiles: creatorName ? { full_name: creatorName } : null
          };
        })
      );

      setContracts(contractsWithDetails);
    } catch (error: any) {
      toast({
        title: "Error fetching contracts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createContract = async (formData: ContractFormData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const contractData = {
        title: formData.contractTitle,
        contract_type: formData.contractType,
        status: 'review',
        priority: 'medium',
        created_by: user.id,
        department_id: formData.department || null,
        unit_id: formData.unit || null,
        description: formData.description,
        start_date: formData.commencementDate?.toISOString(),
        end_date: formData.expiryDate?.toISOString(),
        value: null,
      };

      const { data, error } = await supabase
        .from('contracts')
        .insert([contractData])
        .select()
        .single();

      if (error) throw error;

      // Create initial workflow steps
      await createWorkflowSteps(data.id);

      // Log activity
      await logActivity(data.id, 'status_change', 'Contract created and submitted for review', user.id);

      toast({
        title: "Contract created successfully",
        description: "The contract has been submitted for review.",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error creating contract",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateContract = async (id: string, updates: Partial<Contract>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Backend role validation for status changes
      if (updates.status) {
        const validation = await validateStatusChange(id, updates.status);
        if (!validation.allowed) {
          throw new Error(validation.reason);
        }
      }

      const { data, error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await logActivity(id, 'status_change', 'Contract updated', user.id);
      
      toast({
        title: "Contract updated successfully",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error updating contract",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteContract = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Contract deleted successfully",
      });

      fetchContracts();
    } catch (error: any) {
      toast({
        title: "Error deleting contract",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const createWorkflowSteps = async (contractId: string) => {
    const steps = [
      { step_name: 'Legal Review', step_order: 1, status: 'pending' },
      { step_name: 'Management Approval', step_order: 2, status: 'pending' },
      { step_name: 'Final Approval', step_order: 3, status: 'pending' },
      { step_name: 'Contract Execution', step_order: 4, status: 'pending' },
    ];

    const workflowSteps = steps.map(step => ({
      ...step,
      contract_id: contractId,
    }));

    const { error } = await supabase
      .from('contract_workflow_steps')
      .insert(workflowSteps);

    if (error) throw error;
  };

  const updateWorkflowStep = async (contractId: string, stepOrder: number, status: string, notes?: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Backend role validation for workflow step updates
      const validation = await validateWorkflowAction(contractId, stepOrder, status);
      if (!validation.allowed) {
        throw new Error(validation.reason);
      }

      const { error } = await supabase
        .from('contract_workflow_steps')
        .update({
          status,
          notes,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          assigned_to: user.id,
        })
        .eq('contract_id', contractId)
        .eq('step_order', stepOrder);

      if (error) throw error;

      await logActivity(contractId, 'status_change', `Step ${stepOrder} ${status}`, user.id);
    } catch (error: any) {
      toast({
        title: "Error updating workflow",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logActivity = async (contractId: string, activityType: string, description: string, performedBy: string) => {
    const { error } = await supabase
      .from('contract_activities')
      .insert([{
        contract_id: contractId,
        activity_type: activityType,
        description,
        performed_by: performedBy,
        performed_at: new Date().toISOString(),
      }]);

    if (error) {
      console.error('Error logging activity:', error);
    }
  };

  const validateStatusChange = async (contractId: string, newStatus: string) => {
    if (!user) return { allowed: false, reason: 'User not authenticated' };

    try {
      // Get current contract and user role
      const { data: contract } = await supabase
        .from('contracts')
        .select('status, created_by')
        .eq('id', contractId)
        .single();

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!contract || !userRole) {
        return { allowed: false, reason: 'Contract or user role not found' };
      }

      // Role-based validation logic
      switch (newStatus) {
        case 'under_review':
          // Only contract creators can send for review
          return {
            allowed: contract.created_by === user.id || userRole.role === 'admin',
            reason: (contract.created_by === user.id || userRole.role === 'admin') ? '' : 'Only contract creators can send for review'
          };
        
        case 'approved':
          // Only approval role can approve
          return {
            allowed: userRole.role === 'approval' || userRole.role === 'admin',
            reason: (userRole.role === 'approval' || userRole.role === 'admin') ? '' : 'Only users with approval role can approve contracts'
          };
        
        case 'rejected':
          // Reviewers and approval users can reject
          return {
            allowed: ['reviewer', 'approval', 'admin'].includes(userRole.role),
            reason: ['reviewer', 'approval', 'admin'].includes(userRole.role) ? '' : 'Only reviewers or approvers can reject contracts'
          };
        
        case 'draft':
          // For returning contracts - reviewers and approval users can return
          return {
            allowed: ['reviewer', 'approval', 'admin'].includes(userRole.role),
            reason: ['reviewer', 'approval', 'admin'].includes(userRole.role) ? '' : 'Only reviewers or approvers can return contracts'
          };
        
        default:
          return { allowed: true, reason: '' };
      }
    } catch (error) {
      return { allowed: false, reason: 'Error validating status change' };
    }
  };

  const validateWorkflowAction = async (contractId: string, stepOrder: number, newStatus: string) => {
    if (!user) return { allowed: false, reason: 'User not authenticated' };

    try {
      // Get user role and current workflow step
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const { data: step } = await supabase
        .from('contract_workflow_steps')
        .select('step_name, status, assigned_to')
        .eq('contract_id', contractId)
        .eq('step_order', stepOrder)
        .single();

      if (!userRole || !step) {
        return { allowed: false, reason: 'User role or workflow step not found' };
      }

      // Role-based workflow validation
      switch (newStatus) {
        case 'completed':
          // Check if user can complete this step type
          if (step.step_name === 'Legal Review') {
            return {
              allowed: ['reviewer', 'admin'].includes(userRole.role),
              reason: ['reviewer', 'admin'].includes(userRole.role) ? '' : 'Only reviewers can complete legal review'
            };
          } else if (step.step_name === 'Management Approval' || step.step_name === 'Final Approval') {
            return {
              allowed: ['approval', 'admin'].includes(userRole.role),
              reason: ['approval', 'admin'].includes(userRole.role) ? '' : 'Only users with approval role can complete approval steps'
            };
          }
          break;
        
        case 'rejected':
          return {
            allowed: ['reviewer', 'approval', 'admin'].includes(userRole.role),
            reason: ['reviewer', 'approval', 'admin'].includes(userRole.role) ? '' : 'Only reviewers or approvers can reject'
          };
        
        case 'returned':
          return {
            allowed: ['reviewer', 'approval', 'admin'].includes(userRole.role),
            reason: ['reviewer', 'approval', 'admin'].includes(userRole.role) ? '' : 'Only reviewers or approvers can return for changes'
          };
        
        case 'in_progress':
          // Allow setting to in progress if assigned or has proper role
          return { allowed: true, reason: '' };
        
        default:
          return { allowed: true, reason: '' };
      }

      return { allowed: true, reason: '' };
    } catch (error) {
      return { allowed: false, reason: 'Error validating workflow action' };
    }
  };

  const getDaysToExpiry = (expiryDate: string | null): string => {
    if (!expiryDate) return 'N/A';
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const timeDiff = expiry.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return 'Expired';
    return `${daysDiff} days`;
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  return {
    contracts,
    loading,
    fetchContracts,
    createContract,
    updateContract,
    deleteContract,
    updateWorkflowStep,
    validateStatusChange,
    validateWorkflowAction,
    getDaysToExpiry,
  };
};