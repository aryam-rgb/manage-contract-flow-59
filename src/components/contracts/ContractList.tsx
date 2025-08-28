
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, Eye, Edit, Calendar, AlertTriangle } from "lucide-react";

interface Contract {
  id: string;
  companyName: string;
  contractTitle: string;
  contractType: string;
  department: string;
  status: 'Draft' | 'Under Review' | 'Pending Approval' | 'Signed' | 'Expired';
  commencementDate: string;
  expiryDate: string;
  daysToExpiry: number;
  contactPerson: string;
}

export function ContractList() {
  const [contracts] = useState<Contract[]>([
    {
      id: 'CNT-001',
      companyName: 'Tech Solutions Ltd',
      contractTitle: 'Software Licensing Agreement',
      contractType: 'License',
      department: 'IT',
      status: 'Signed',
      commencementDate: '2024-01-01',
      expiryDate: '2024-12-31',
      daysToExpiry: 350,
      contactPerson: 'John Smith'
    },
    {
      id: 'CNT-002',
      companyName: 'ABC Consulting',
      contractTitle: 'Management Consultancy Services',
      contractType: 'Consultancy',
      department: 'Operations',
      status: 'Pending Approval',
      commencementDate: '2024-02-01',
      expiryDate: '2025-01-31',
      daysToExpiry: 380,
      contactPerson: 'Jane Doe'
    },
    {
      id: 'CNT-003',
      companyName: 'Office Supplies Co',
      contractTitle: 'Office Equipment Supply',
      contractType: 'Supply',
      department: 'Procurement',
      status: 'Under Review',
      commencementDate: '2024-01-15',
      expiryDate: '2024-03-15',
      daysToExpiry: 30,
      contactPerson: 'Mike Johnson'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Under Review': 'bg-yellow-100 text-yellow-800',
      'Pending Approval': 'bg-blue-100 text-blue-800',
      'Signed': 'bg-green-100 text-green-800',
      'Expired': 'bg-red-100 text-red-800'
    };
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const getExpiryStatus = (daysToExpiry: number) => {
    if (daysToExpiry < 0) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    } else if (daysToExpiry <= 30) {
      return <Badge className="bg-orange-100 text-orange-800">Expiring Soon</Badge>;
    } else if (daysToExpiry <= 90) {
      return <Badge className="bg-yellow-100 text-yellow-800">Due Soon</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.contractTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || statusFilter === 'all' || contract.status === statusFilter;
    const matchesType = !typeFilter || typeFilter === 'all' || contract.contractType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contract Management</h2>
          <p className="text-gray-600 mt-1">Manage and track all contracts</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                <SelectItem value="Signed">Signed</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="License">License</SelectItem>
                <SelectItem value="Consultancy">Consultancy</SelectItem>
                <SelectItem value="Supply">Supply</SelectItem>
                <SelectItem value="Service">Service</SelectItem>
                <SelectItem value="NDA">NDA</SelectItem>
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
          <CardTitle>Contracts List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract ID</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Days to Expiry</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.id}</TableCell>
                  <TableCell>{contract.companyName}</TableCell>
                  <TableCell>{contract.contractTitle}</TableCell>
                  <TableCell>{contract.contractType}</TableCell>
                  <TableCell>{contract.department}</TableCell>
                  <TableCell>{getStatusBadge(contract.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{contract.expiryDate}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {contract.daysToExpiry <= 30 && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                      <span>{contract.daysToExpiry} days</span>
                      {getExpiryStatus(contract.daysToExpiry)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
