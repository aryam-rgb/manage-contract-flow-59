import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRoleAccess } from './useRoleAccess';
import { toast } from '@/components/ui/use-toast';

export interface WorkflowStep {
  id: string;
  contract_id: string;
  step_name: string;
  step_order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'returned';
  assigned_to: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowAction {
  action: 'submit' | 'approve' | 'reject' | 'return';
  notes?: string;
}

export const useWorkflow = (contractId?: string) => {
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [currentStep, setCurrentStep] = useState<WorkflowStep | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { userRole, canPerformAction } = useRoleAccess();

  const fetchWorkflowSteps = async (id: string) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contract_workflow_steps')
        .select('*')
        .eq('contract_id', id)
        .order('step_order');

      if (error) throw error;
      
      setWorkflowSteps(data?.map(step => ({
        ...step,
        status: step.status as 'pending' | 'in_progress' | 'completed' | 'rejected' | 'returned'
      })) || []);
      
      // Find current step (first non-completed step)
      const current = data?.find(step => 
        step.status === 'pending' || step.status === 'in_progress' || step.status === 'returned'
      ) || null;
      setCurrentStep(current ? {
        ...current,
        status: current.status as 'pending' | 'in_progress' | 'completed' | 'rejected' | 'returned'
      } : null);
    } catch (error: any) {
      toast({
        title: "Error fetching workflow",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflowAction = async (action: WorkflowAction) => {
    if (!contractId || !user || !currentStep) return false;

    try {
      setLoading(true);

      switch (action.action) {
        case 'submit':
          return await submitForReview();
        case 'approve':
          return await approveStep(action.notes);
        case 'reject':
          return await rejectContract(action.notes || '');
        case 'return':
          return await returnForChanges(action.notes || '');
        default:
          return false;
      }
    } catch (error: any) {
      toast({
        title: "Error processing action",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitForReview = async () => {
    if (!contractId || !user) return false;

    // Update contract status to under_review
    const { error: contractError } = await supabase
      .from('contracts')
      .update({ status: 'under_review' })
      .eq('id', contractId);

    if (contractError) throw contractError;

    // Start first workflow step
    const { error: stepError } = await supabase
      .from('contract_workflow_steps')
      .update({
        status: 'in_progress',
        assigned_to: getAssigneeForStep(1),
      })
      .eq('contract_id', contractId)
      .eq('step_order', 1);

    if (stepError) throw stepError;

    await logWorkflowActivity('submitted', 'Contract submitted for review');
    
    toast({
      title: "Contract submitted",
      description: "Contract has been sent for legal review.",
    });

    await fetchWorkflowSteps(contractId);
    return true;
  };

  const approveStep = async (notes?: string) => {
    if (!contractId || !user || !currentStep) return false;

    // Complete current step
    const { error: stepError } = await supabase
      .from('contract_workflow_steps')
      .update({
        status: 'completed',
        notes,
        completed_at: new Date().toISOString(),
        assigned_to: user.id,
      })
      .eq('id', currentStep.id);

    if (stepError) throw stepError;

    // Check if this is the final step
    const isLastStep = currentStep.step_order === workflowSteps.length;
    
    if (isLastStep) {
      // Final approval - update contract status
      const { error: contractError } = await supabase
        .from('contracts')
        .update({ status: 'approved' })
        .eq('id', contractId);

      if (contractError) throw contractError;
      
      await logWorkflowActivity('approved', 'Contract final approval completed');
      
      toast({
        title: "Contract approved",
        description: "Contract has been fully approved and is ready for signing.",
      });
    } else {
      // Move to next step
      const nextStep = workflowSteps.find(step => step.step_order === currentStep.step_order + 1);
      if (nextStep) {
        const { error: nextStepError } = await supabase
          .from('contract_workflow_steps')
          .update({
            status: 'in_progress',
            assigned_to: getAssigneeForStep(nextStep.step_order),
          })
          .eq('id', nextStep.id);

        if (nextStepError) throw nextStepError;

        // Update contract status based on next step
        let newContractStatus = 'in_review';
        if (nextStep.step_name === 'Management Approval' || nextStep.step_name === 'Final Approval') {
          newContractStatus = 'pending_approval';
        }

        const { error: contractError } = await supabase
          .from('contracts')
          .update({ status: newContractStatus })
          .eq('id', contractId);

        if (contractError) throw contractError;
      }

      await logWorkflowActivity('approved', `Step ${currentStep.step_order} approved, moved to ${nextStep?.step_name || 'next step'}`);
      
      toast({
        title: "Step approved",
        description: `Contract moved to ${nextStep?.step_name || 'next workflow step'}.`,
      });
    }

    await fetchWorkflowSteps(contractId);
    return true;
  };

  const rejectContract = async (reason: string) => {
    if (!contractId || !user || !currentStep) return false;

    // Update current step as rejected
    const { error: stepError } = await supabase
      .from('contract_workflow_steps')
      .update({
        status: 'rejected',
        notes: reason,
        completed_at: new Date().toISOString(),
        assigned_to: user.id,
      })
      .eq('id', currentStep.id);

    if (stepError) throw stepError;

    // Update contract status
    const { error: contractError } = await supabase
      .from('contracts')
      .update({ status: 'rejected' })
      .eq('id', contractId);

    if (contractError) throw contractError;

    await logWorkflowActivity('rejected', `Contract rejected: ${reason}`);
    
    toast({
      title: "Contract rejected",
      description: "Contract has been rejected.",
      variant: "destructive",
    });

    await fetchWorkflowSteps(contractId);
    return true;
  };

  const returnForChanges = async (reason: string) => {
    if (!contractId || !user || !currentStep) return false;

    // Update current step as returned
    const { error: stepError } = await supabase
      .from('contract_workflow_steps')
      .update({
        status: 'returned',
        notes: reason,
        assigned_to: user.id,
      })
      .eq('id', currentStep.id);

    if (stepError) throw stepError;

    // Update contract status back to draft so user can modify
    const { error: contractError } = await supabase
      .from('contracts')
      .update({ status: 'draft' })
      .eq('id', contractId);

    if (contractError) throw contractError;

    await logWorkflowActivity('returned', `Contract returned for changes: ${reason}`);
    
    toast({
      title: "Contract returned",
      description: "Contract has been returned to the user for modifications.",
    });

    await fetchWorkflowSteps(contractId);
    return true;
  };

  const getAssigneeForStep = (stepOrder: number): string | null => {
    // This would typically come from a role assignment system
    // For now, we'll return null and let the system auto-assign based on roles
    return null;
  };

  const logWorkflowActivity = async (activityType: string, description: string) => {
    if (!contractId || !user) return;

    const { error } = await supabase
      .from('contract_activities')
      .insert([{
        contract_id: contractId,
        activity_type: activityType,
        description,
        performed_by: user.id,
        performed_at: new Date().toISOString(),
      }]);

    if (error) {
      console.error('Error logging workflow activity:', error);
    }
  };

  const canPerformWorkflowAction = (action: WorkflowAction['action']): boolean => {
    if (!currentStep || !user) return false;

    switch (action) {
      case 'submit':
        return canPerformAction('canEditContract') && currentStep.status === 'pending';
      case 'approve':
        return canPerformAction('canApproveContract') && currentStep.status === 'in_progress';
      case 'reject':
        return canPerformAction('canReviewContract') && currentStep.status === 'in_progress';
      case 'return':
        return canPerformAction('canReviewContract') && currentStep.status === 'in_progress';
      default:
        return false;
    }
  };

  const getAvailableActions = (): WorkflowAction['action'][] => {
    const actions: WorkflowAction['action'][] = [];

    if (canPerformWorkflowAction('submit')) actions.push('submit');
    if (canPerformWorkflowAction('approve')) actions.push('approve');
    if (canPerformWorkflowAction('reject')) actions.push('reject');
    if (canPerformWorkflowAction('return')) actions.push('return');

    return actions;
  };

  useEffect(() => {
    if (contractId) {
      fetchWorkflowSteps(contractId);
    }
  }, [contractId]);

  return {
    workflowSteps,
    currentStep,
    loading,
    executeWorkflowAction,
    canPerformWorkflowAction,
    getAvailableActions,
    fetchWorkflowSteps,
  };
};