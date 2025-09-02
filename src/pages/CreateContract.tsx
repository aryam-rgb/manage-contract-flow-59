
import React from 'react';
import { ContractForm } from "@/components/contracts/ContractForm";
import { useNavigate } from 'react-router-dom';
import { useContracts, ContractFormData } from "@/hooks/useContracts";

const CreateContract = () => {
  const navigate = useNavigate();
  const { createContract } = useContracts();

  const handleSubmit = async (data: ContractFormData) => {
    try {
      await createContract(data);
      navigate('/contracts');
    } catch (error) {
      // Error handling is done in the hook
    }
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
