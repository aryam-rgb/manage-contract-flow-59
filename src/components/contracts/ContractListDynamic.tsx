import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Filter, Download, Eye, Edit, Calendar, AlertTriangle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useContracts } from "@/hooks/useContracts";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAuth } from "@/hooks/useAuth";
import { ContractActions } from "./ContractActions";
import { ContractActivities } from "./ContractActivities";
import { exportContracts } from "@/lib/exportUtils";

import { Contract } from "@/hooks/useContracts";

export function ContractListDynamic() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const { toast } = useToast();
  const { contracts, loading, fetchContracts } = useContracts();
  const { userRole, permissions } = useRoleAccess();
  const { user } = useAuth();

  // Clear all contracts on component mount (for fresh testing)
  useEffect(() => {
    const clearAllContracts = async () => {
      try {
        const { error } = await supabase
          .from('contracts')
          .delete()
          .neq('id', ''); // Delete all records

        if (error) throw error;
        
        toast({
          title: "Database Reset",
          description: "All contracts cleared for fresh testing",
        });
      } catch (error: any) {
        console.error('Error clearing contracts:', error);
      }
    };

    clearAllContracts();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'draft': 'bg-muted text-muted-foreground',
      'pending_review': 'bg-yellow-100 text-yellow-800',
      'in_review': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'signed': 'bg-primary/10 text-primary',
      'expired': 'bg-destructive/10 text-destructive'
    };
    return <Badge className={variants[status] || 'bg-muted text-muted-foreground'}>{status.replace('_', ' ')}</Badge>;
  };

  const getExpiryStatus = (endDate: string) => {
    if (!endDate) return null;
    
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <Badge className="bg-destructive/10 text-destructive">Expired</Badge>;
    } else if (diffDays <= 30) {
      return <Badge className="bg-orange-100 text-orange-800">Expiring Soon</Badge>;
    } else if (diffDays <= 90) {
      return <Badge className="bg-yellow-100 text-yellow-800">Due Soon</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || statusFilter === 'all' || contract.status === statusFilter;
    const matchesType = !typeFilter || typeFilter === 'all' || contract.contract_type === typeFilter;
    
    // Role-based filtering for reviewer queue
    let matchesRole = true;
    if (userRole === 'reviewer') {
      // Reviewers should only see contracts in review status (awaiting their action)
      matchesRole = contract.status === 'review' || contract.status === 'in_review';
    } else if (userRole === 'approval') {
      // Approvers should see contracts that have passed review and await approval
      matchesRole = contract.status === 'pending_approval';
    } else if (userRole === 'user') {
      // Regular users only see their own contracts
      matchesRole = contract.created_by === user?.id;
    }
    // Admin and manager can see all contracts (no additional filtering)
    
    return matchesSearch && matchesStatus && matchesType && matchesRole;
  });

  const handleExportReport = () => {
    if (contracts.length === 0) {
      toast({
        title: "No Data",
        description: "No contracts available to export.",
        variant: "destructive",
      });
      return;
    }

    exportContracts(filteredContracts, {
      filename: `contracts_report_${new Date().toISOString().split('T')[0]}.csv`
    });

    toast({
      title: "Export Successful",
      description: `Exported ${filteredContracts.length} contracts to CSV file.`,
    });
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Contract Management</h2>
          <p className="text-muted-foreground mt-1">Manage and track all contracts with real-time activities</p>
        </div>
        <Button onClick={handleExportReport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="space-y-8">
        {/* Contracts List */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filters & Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search contracts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="signed">Signed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="supply">Supply</SelectItem>
                    <SelectItem value="consultancy">Consultancy</SelectItem>
                    <SelectItem value="license">License</SelectItem>
                    <SelectItem value="nda">NDA</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contracts List ({filteredContracts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredContracts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No contracts found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.map((contract) => (
                      <TableRow 
                        key={contract.id}
                        className={`cursor-pointer hover:bg-muted/50 ${selectedContract === contract.id ? 'bg-muted' : ''}`}
                        onClick={() => setSelectedContract(contract.id)}
                      >
                        <TableCell className="font-medium">{contract.title}</TableCell>
                        <TableCell>{contract.contract_type}</TableCell>
                        <TableCell>{contract.departments?.name || 'N/A'}</TableCell>
                        <TableCell>{getStatusBadge(contract.status)}</TableCell>
                        <TableCell>{contract.profiles?.full_name || contract.company_name || 'Unknown'}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{contract.end_date || 'N/A'}</span>
                            {contract.end_date && getExpiryStatus(contract.end_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {contract.value ? `KES ${contract.value.toLocaleString()}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <ContractActions 
                            contract={contract} 
                            onUpdate={fetchContracts} 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activities Panel */}
        <div className="space-y-6">
          {selectedContract ? (
            <ContractActivities contractId={selectedContract} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Contract Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Select a contract to view its activities and TAT tracking</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}