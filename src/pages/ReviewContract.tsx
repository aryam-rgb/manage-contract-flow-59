
import React from 'react';
import { ContractForm } from "@/components/contracts/ContractForm";
import { WorkflowStatus } from "@/components/contracts/WorkflowStatus";
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";

const ReviewContract = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const handleSubmit = (data: any) => {
    console.log('Reviewing contract:', data);
    toast({
      title: "Contract updated",
      description: "Contract changes have been saved.",
    });
    navigate('/contracts');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review Contract</h1>
        <p className="text-gray-600 mt-1">Review contract details and provide feedback</p>
      </div>
      
      <WorkflowStatus 
        contractId={id || 'CNT-001'} 
        contractTitle="Software Licensing Agreement"
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
