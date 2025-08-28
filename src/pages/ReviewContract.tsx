
import React from 'react';
import { ContractForm } from "@/components/contracts/ContractForm";
import { WorkflowStatus } from "@/components/contracts/WorkflowStatus";
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from "@/components/ui/sonner";

const ReviewContract = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const workflowSteps = [
    { id: '1', title: 'Contract Initiated', status: 'completed' as const, actor: 'John Doe (IT Dept)', date: '2024-01-10', comments: 'Initial contract request submitted' },
    { id: '2', title: 'Legal Review', status: 'current' as const, actor: 'Jane Smith (Legal)', date: '', comments: '' },
    { id: '3', title: 'Department Alignment', status: 'pending' as const, actor: 'John Doe (IT Dept)', date: '', comments: '' },
    { id: '4', title: 'Final Approval', status: 'pending' as const, actor: 'Legal Manager', date: '', comments: '' },
    { id: '5', title: 'Contract Signed', status: 'pending' as const, actor: 'System', date: '', comments: '' }
  ];

  const handleSubmit = (data: any) => {
    console.log('Reviewing contract:', data);
    toast.success('Contract review completed and sent for approval!');
    navigate('/contracts');
  };

  const handleWorkflowAction = (action: string) => {
    console.log('Workflow action:', action);
    if (action === 'approve') {
      toast.success('Contract approved and moved to next step!');
    } else if (action === 'return') {
      toast.info('Contract returned for changes');
    } else if (action === 'reject') {
      toast.error('Contract rejected');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review Contract</h1>
        <p className="text-gray-600 mt-1">Review contract details and provide feedback</p>
      </div>
      
      <WorkflowStatus 
        contractId={id || 'CNT-001'} 
        currentStep={1} 
        steps={workflowSteps}
        onAction={handleWorkflowAction}
      />
      
      <ContractForm 
        mode="review" 
        onSubmit={handleSubmit}
        initialData={{
          companyName: 'Tech Solutions Ltd',
          contractTitle: 'Software Licensing Agreement',
          contractType: 'License',
          department: 'IT',
          contactPerson: 'John Smith',
          duration: '12',
          commencementDate: new Date('2024-01-01'),
          expiryDate: new Date('2024-12-31'),
          description: 'Annual software licensing agreement for enterprise tools'
        }}
      />
    </div>
  );
};

export default ReviewContract;
