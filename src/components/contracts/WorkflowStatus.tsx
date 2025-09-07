
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle, FileText, User, Calendar, XCircle, RotateCcw } from "lucide-react";
import { useWorkflow, WorkflowAction } from "@/hooks/useWorkflow";
import { ApprovalDialog } from "./ApprovalDialog";

interface WorkflowStatusProps {
  contractId: string;
  contractTitle?: string;
}

export function WorkflowStatus({ contractId, contractTitle = "Contract" }: WorkflowStatusProps) {
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState<WorkflowAction['action'] | null>(null);
  
  const { 
    workflowSteps, 
    currentStep, 
    loading, 
    executeWorkflowAction, 
    getAvailableActions 
  } = useWorkflow(contractId);
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'returned':
        return <RotateCcw className="h-5 w-5 text-orange-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'returned':
        return <Badge className="bg-orange-100 text-orange-800">Returned</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleAction = (action: WorkflowAction['action']) => {
    if (action === 'submit') {
      // Submit action doesn't need approval dialog
      executeWorkflowAction({ action });
    } else {
      // Other actions need approval dialog
      setCurrentAction(action);
      setShowApprovalDialog(true);
    }
  };

  const handleApprovalConfirm = async (reason?: string) => {
    if (currentAction) {
      await executeWorkflowAction({ action: currentAction, notes: reason });
    }
    setShowApprovalDialog(false);
    setCurrentAction(null);
  };

  const getActionButton = (action: WorkflowAction['action']) => {
    switch (action) {
      case 'submit':
        return (
          <Button 
            onClick={() => handleAction('submit')} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            Submit for Review
          </Button>
        );
      case 'approve':
        return (
          <Button 
            onClick={() => handleAction('approve')} 
            className="bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            Approve & Continue
          </Button>
        );
      case 'reject':
        return (
          <Button 
            onClick={() => handleAction('reject')} 
            variant="destructive"
            disabled={loading}
          >
            Reject
          </Button>
        );
      case 'return':
        return (
          <Button 
            onClick={() => handleAction('return')} 
            variant="outline"
            disabled={loading}
          >
            Return for Changes
          </Button>
        );
      default:
        return null;
    }
  };

  const availableActions = getAvailableActions();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Contract Workflow - {contractId}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {workflowSteps.map((step) => (
              <div key={step.id} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">{step.step_name}</h4>
                    {getStatusBadge(step.status)}
                  </div>
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="mr-1 h-4 w-4" />
                      {step.assigned_to ? `Assigned User` : 'Unassigned'}
                    </div>
                    {step.completed_at && (
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        {new Date(step.completed_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {step.notes && (
                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {step.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {availableActions.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {availableActions.map((action) => (
                <div key={action}>
                  {getActionButton(action)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ApprovalDialog
        open={showApprovalDialog}
        onOpenChange={setShowApprovalDialog}
        action={currentAction as 'approve' | 'reject' | 'return' | null}
        onConfirm={handleApprovalConfirm}
        contractTitle={contractTitle}
      />
    </>
  );
}
