import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Clock,
  CheckCircle,
  XCircle,
  UserPlus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Contract {
  id: string;
  title: string;
  contract_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  value: number | null;
  description: string | null;
  priority: string;
  assigned_to: string | null;
  department_id: string | null;
}

interface ContractActionsProps {
  contract: Contract;
  onUpdate: () => void;
}

export function ContractActions({ contract, onUpdate }: ContractActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editData, setEditData] = useState(contract);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleEdit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          title: editData.title,
          contract_type: editData.contract_type,
          status: editData.status,
          start_date: editData.start_date,
          end_date: editData.end_date,
          value: editData.value,
          description: editData.description,
          priority: editData.priority,
          assigned_to: editData.assigned_to,
          department_id: editData.department_id,
        })
        .eq('id', contract.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contract updated successfully"
      });
      setShowEditDialog(false);
      onUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update contract: " + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contract.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contract deleted successfully"
      });
      setShowDeleteDialog(false);
      onUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete contract: " + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ status: newStatus })
        .eq('id', contract.id);

      if (error) throw error;

      // Add activity log
      await supabase
        .from('contract_activities')
        .insert({
          contract_id: contract.id,
          activity_type: 'status_change',
          description: `Status changed from ${contract.status} to ${newStatus}`,
          previous_value: contract.status,
          new_value: newStatus,
          performed_by: (await supabase.auth.getUser()).data.user?.id || ''
        });

      toast({
        title: "Success",
        description: `Contract status updated to ${newStatus}`
      });
      onUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status: " + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Contract
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleStatusChange('pending_review')} disabled={loading}>
            <Clock className="mr-2 h-4 w-4" />
            Send for Review
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange('approved')} disabled={loading}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange('rejected')} disabled={loading}>
            <XCircle className="mr-2 h-4 w-4" />
            Reject
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
            <DialogDescription>
              Update contract details and save changes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={editData.contract_type} 
                  onValueChange={(value) => setEditData({ ...editData, contract_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="supply">Supply</SelectItem>
                    <SelectItem value="consultancy">Consultancy</SelectItem>
                    <SelectItem value="license">License</SelectItem>
                    <SelectItem value="nda">NDA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={editData.start_date || ''}
                  onChange={(e) => setEditData({ ...editData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={editData.end_date || ''}
                  onChange={(e) => setEditData({ ...editData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">Value (KES)</Label>
                <Input
                  id="value"
                  type="number"
                  value={editData.value || ''}
                  onChange={(e) => setEditData({ ...editData, value: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={editData.priority} 
                  onValueChange={(value) => setEditData({ ...editData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contract</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{contract.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}