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
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
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
        status: 'draft',
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
      await logActivity(data.id, 'created', 'Contract created', user.id);

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

      await logActivity(id, 'updated', 'Contract updated', user.id);
      
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
      { step_name: 'Department Alignment', step_order: 2, status: 'pending' },
      { step_name: 'Final Approval', step_order: 3, status: 'pending' },
      { step_name: 'Contract Signed', step_order: 4, status: 'pending' },
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

      await logActivity(contractId, 'workflow_updated', `Step ${stepOrder} ${status}`, user.id);
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
    updateWorkflowStep,
    getDaysToExpiry,
  };
};