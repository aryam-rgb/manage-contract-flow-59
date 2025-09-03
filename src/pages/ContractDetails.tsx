import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, User, Building, FileText, Clock, AlertCircle } from "lucide-react";
import { ContractActions } from "@/components/contracts/ContractActions";
import { WorkflowStatus } from "@/components/contracts/WorkflowStatus";
import { ContractActivities } from "@/components/contracts/ContractActivities";
import { useContracts, Contract } from "@/hooks/useContracts";
import { toast } from "@/components/ui/use-toast";

const ContractDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { contracts, loading } = useContracts();
  const [contract, setContract] = useState<Contract | null>(null);

  useEffect(() => {
    if (id && contracts.length > 0) {
      const foundContract = contracts.find(c => c.id === id);
      setContract(foundContract || null);
    }
  }, [id, contracts]);

  const workflowSteps = [
    { 
      id: '1', 
      title: 'Legal Review', 
      status: contract?.status === 'draft' ? 'pending' as const : 'completed' as const, 
      actor: 'Legal Team', 
      date: contract?.status === 'draft' ? '' : new Date().toLocaleDateString(),
      comments: contract?.status === 'draft' ? '' : 'Initial legal review completed'
    },
    { 
      id: '2', 
      title: 'Department Alignment', 
      status: contract?.status === 'under_review' ? 'current' as const : 
             contract?.status === 'approved' || contract?.status === 'signed' ? 'completed' as const : 'pending' as const, 
      actor: 'Department Head', 
      date: contract?.status === 'approved' || contract?.status === 'signed' ? new Date().toLocaleDateString() : '',
      comments: ''
    },
    { 
      id: '3', 
      title: 'Final Approval', 
      status: contract?.status === 'approved' || contract?.status === 'signed' ? 'completed' as const : 'pending' as const, 
      actor: 'Legal Manager', 
      date: contract?.status === 'approved' || contract?.status === 'signed' ? new Date().toLocaleDateString() : '',
      comments: contract?.status === 'approved' ? 'Contract approved for signing' : ''
    },
    { 
      id: '4', 
      title: 'Contract Signed', 
      status: contract?.status === 'signed' ? 'completed' as const : 'pending' as const, 
      actor: 'Authorized Signatory', 
      date: contract?.status === 'signed' ? new Date().toLocaleDateString() : '',
      comments: ''
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'draft': 'bg-muted text-muted-foreground',
      'under_review': 'bg-yellow-100 text-yellow-800',
      'pending_approval': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'signed': 'bg-primary/10 text-primary',
      'expired': 'bg-destructive/10 text-destructive'
    };
    return <Badge className={variants[status] || 'bg-muted text-muted-foreground'}>{status.replace('_', ' ')}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/contracts')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contracts
        </Button>
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Contract Not Found</h3>
            <p className="text-muted-foreground">The contract you're looking for doesn't exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/contracts')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contracts
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{contract.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-muted-foreground">Contract ID: {contract.id.slice(0, 8)}</span>
              <Separator orientation="vertical" className="h-4" />
              {getStatusBadge(contract.status)}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <ContractActions contract={contract} onUpdate={() => window.location.reload()} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Contract Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contract Type</label>
                  <p className="text-foreground">{contract.contract_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Priority</label>
                  <p className="text-foreground capitalize">{contract.priority}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(contract.start_date)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">End Date</label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(contract.end_date)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Days to Expiry</label>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{getDaysToExpiry(contract.end_date)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contract Value</label>
                  <p className="text-foreground">
                    {contract.value ? `KES ${contract.value.toLocaleString()}` : 'N/A'}
                  </p>
                </div>
              </div>
              
              {contract.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-foreground mt-1">{contract.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created By</label>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Contract Creator</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{contract.department_id || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p className="text-foreground">{formatDate(contract.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-foreground">{formatDate(contract.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Status */}
          <WorkflowStatus 
            contractId={contract.id}
            currentStep={workflowSteps.findIndex(step => step.status === 'current')}
            steps={workflowSteps}
            onAction={(action) => {
              toast({
                title: "Action processed",
                description: `Contract ${action} action completed.`,
              });
            }}
          />
        </div>

        {/* Activities Panel */}
        <div className="space-y-6">
          <ContractActivities contractId={contract.id} />
        </div>
      </div>
    </div>
  );
};

export default ContractDetails;