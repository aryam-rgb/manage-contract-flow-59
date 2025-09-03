import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MoreVertical, Eye, Edit, Send, CheckCircle, X, Download, Trash2, RotateCcw } from "lucide-react";
import { useContracts, Contract } from "@/hooks/useContracts";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { ApprovalDialog } from './ApprovalDialog';

interface ContractActionsProps {
  contract: Contract;
  onUpdate?: () => void;
}

export function ContractActions({ contract, onUpdate }: ContractActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState<'approve' | 'reject' | 'return' | null>(null);
  const { updateContract, deleteContract, updateWorkflowStep } = useContracts();
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/contracts/${contract.id}`);
  };

  const handleEditContract = () => {
    navigate(`/contracts/${contract.id}/edit`);
  };

  const handleSendForReview = async () => {
    try {
      await updateContract(contract.id, { status: 'under_review' });
      await updateWorkflowStep(contract.id, 1, 'in_progress');
      toast({
        title: "Contract sent for review",
        description: "The contract has been submitted for legal review.",
      });
      onUpdate?.();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleApprovalAction = (action: 'approve' | 'reject' | 'return') => {
    setCurrentAction(action);
    setShowApprovalDialog(true);
  };

  const handleApprovalConfirm = async (reason?: string) => {
    try {
      switch (currentAction) {
        case 'approve':
          await updateContract(contract.id, { status: 'approved' });
          await updateWorkflowStep(contract.id, 3, 'completed', reason || 'Contract approved');
          toast({
            title: "Contract approved",
            description: "The contract has been approved successfully.",
          });
          break;
        case 'reject':
          await updateContract(contract.id, { status: 'rejected' });
          await updateWorkflowStep(contract.id, 1, 'rejected', reason || 'Contract rejected');
          toast({
            title: "Contract rejected",
            description: "The contract has been rejected.",
            variant: "destructive",
          });
          break;
        case 'return':
          await updateContract(contract.id, { status: 'under_review' });
          await updateWorkflowStep(contract.id, 1, 'returned', reason || 'Returned for changes');
          toast({
            title: "Contract returned",
            description: "The contract has been returned for changes.",
          });
          break;
      }
      onUpdate?.();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation and download
    toast({
      title: "PDF Download",
      description: "PDF generation feature will be implemented soon.",
    });
  };

  const handleDelete = async () => {
    try {
      await deleteContract(contract.id);
      setShowDeleteDialog(false);
      onUpdate?.();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const canEdit = contract.status === 'draft' || contract.status === 'under_review';
  const canApprove = contract.status === 'under_review';
  const canReject = contract.status === 'under_review';
  const canSendForReview = contract.status === 'draft';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-background border shadow-lg">
          <DropdownMenuItem onClick={handleViewDetails} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          
          {canEdit && (
            <DropdownMenuItem onClick={handleEditContract} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              Edit Contract
            </DropdownMenuItem>
          )}
          
          {canSendForReview && (
            <DropdownMenuItem onClick={handleSendForReview} className="cursor-pointer">
              <Send className="mr-2 h-4 w-4" />
              Send for Review
            </DropdownMenuItem>
          )}
          
          {canApprove && (
            <DropdownMenuItem onClick={() => handleApprovalAction('approve')} className="cursor-pointer">
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </DropdownMenuItem>
          )}
          
          {canReject && (
            <>
              <DropdownMenuItem onClick={() => handleApprovalAction('reject')} className="cursor-pointer">
                <X className="mr-2 h-4 w-4" />
                Reject
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleApprovalAction('return')} className="cursor-pointer">
                <RotateCcw className="mr-2 h-4 w-4" />
                Return for Changes
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleDownloadPDF} className="cursor-pointer">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the contract
              "{contract.title}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Contract
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ApprovalDialog
        open={showApprovalDialog}
        onOpenChange={setShowApprovalDialog}
        action={currentAction}
        onConfirm={handleApprovalConfirm}
        contractTitle={contract.title}
      />
    </>
  );
}