
import React from 'react';
import { useContracts } from "@/hooks/useContracts";
import { ContractActions } from "./ContractActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, AlertTriangle } from "lucide-react";

export function ContractList() {
  const { contracts, loading, fetchContracts, getDaysToExpiry } = useContracts();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'under_review': 'bg-yellow-100 text-yellow-800',
      'pending_approval': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'signed': 'bg-green-100 text-green-800',
      'expired': 'bg-red-100 text-red-800'
    };
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const timeDiff = expiry.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    } else if (daysDiff <= 30) {
      return <Badge className="bg-orange-100 text-orange-800">Expiring Soon</Badge>;
    } else if (daysDiff <= 90) {
      return <Badge className="bg-yellow-100 text-yellow-800">Due Soon</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  if (loading) {
    return <div>Loading contracts...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contracts List</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Days to Expiry</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="font-medium">{contract.id.slice(0, 8)}</TableCell>
                <TableCell>{contract.title}</TableCell>
                <TableCell>{contract.contract_type}</TableCell>
                <TableCell>{getStatusBadge(contract.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {contract.end_date && getDaysToExpiry(contract.end_date).includes('30') && (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    )}
                    <span>{getDaysToExpiry(contract.end_date)}</span>
                    {getExpiryStatus(contract.end_date)}
                  </div>
                </TableCell>
                <TableCell>
                  <ContractActions contract={contract} onUpdate={fetchContracts} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
