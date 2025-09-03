import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, X, RotateCcw } from "lucide-react";

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'approve' | 'reject' | 'return' | null;
  onConfirm: (reason?: string) => void;
  contractTitle: string;
}

export function ApprovalDialog({ 
  open, 
  onOpenChange, 
  action, 
  onConfirm, 
  contractTitle 
}: ApprovalDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
    onOpenChange(false);
  };

  const getActionDetails = () => {
    switch (action) {
      case 'approve':
        return {
          title: 'Approve Contract',
          description: `Are you sure you want to approve "${contractTitle}"?`,
          icon: <CheckCircle className="h-6 w-6 text-green-600" />,
          buttonText: 'Approve',
          buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
          reasonRequired: false,
          reasonLabel: 'Comments (Optional)'
        };
      case 'reject':
        return {
          title: 'Reject Contract',
          description: `Are you sure you want to reject "${contractTitle}"?`,
          icon: <X className="h-6 w-6 text-red-600" />,
          buttonText: 'Reject',
          buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
          reasonRequired: true,
          reasonLabel: 'Reason for Rejection (Required)'
        };
      case 'return':
        return {
          title: 'Return for Changes',
          description: `Return "${contractTitle}" for modifications?`,
          icon: <RotateCcw className="h-6 w-6 text-orange-600" />,
          buttonText: 'Return',
          buttonClass: 'bg-orange-600 hover:bg-orange-700 text-white',
          reasonRequired: true,
          reasonLabel: 'Required Changes (Required)'
        };
      default:
        return null;
    }
  };

  const actionDetails = getActionDetails();
  
  if (!actionDetails) return null;

  const canConfirm = !actionDetails.reasonRequired || reason.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {actionDetails.icon}
            <span>{actionDetails.title}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            {actionDetails.description}
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="reason">{actionDetails.reasonLabel}</Label>
            <Textarea
              id="reason"
              placeholder={
                action === 'reject' 
                  ? "Please provide a detailed reason for rejection..."
                  : action === 'return'
                  ? "Describe what changes are needed..."
                  : "Add any additional comments..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
            {actionDetails.reasonRequired && (
              <p className="text-sm text-muted-foreground">
                * This field is required
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            className={actionDetails.buttonClass}
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {actionDetails.buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}