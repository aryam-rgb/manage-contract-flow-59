
import React from 'react';
import { ContractForm } from "@/components/contracts/ContractForm";
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/sonner";

const CreateContract = () => {
  const navigate = useNavigate();

  const handleSubmit = (data: any) => {
    console.log('Creating contract:', data);
    toast.success('Contract submitted for review successfully!');
    navigate('/contracts');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Contract</h1>
        <p className="text-gray-600 mt-1">Initiate a new contract for review and approval</p>
      </div>
      <ContractForm mode="create" onSubmit={handleSubmit} />
    </div>
  );
};

export default CreateContract;
