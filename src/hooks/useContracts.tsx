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

  const deleteAllContracts = async () => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Delete all contracts (this will cascade and delete related workflow steps and activities)
      const { error } = await supabase
        .from('contracts')
        .delete()
        .neq('id', ''); // Delete all records

      if (error) throw error;

      toast({
        title: "All contracts deleted successfully",
        description: "Database has been reset for fresh testing",
      });

      fetchContracts();
    } catch (error: any) {
      toast({
        title: "Error deleting contracts",
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
    deleteAllContracts,
    updateWorkflowStep,
    getDaysToExpiry,
  };
};