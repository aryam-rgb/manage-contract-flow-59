
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, Send } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ContractFormProps {
  mode: 'create' | 'review' | 'approve';
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function ContractForm({ mode, onSubmit, initialData }: ContractFormProps) {
  const [formData, setFormData] = useState({
    companyName: initialData?.companyName || '',
    contractTitle: initialData?.contractTitle || '',
    contractType: initialData?.contractType || '',
    department: initialData?.department || '',
    contactPerson: initialData?.contactPerson || '',
    duration: initialData?.duration || '',
    commencementDate: initialData?.commencementDate || null,
    expiryDate: initialData?.expiryDate || null,
    validityStatus: initialData?.validityStatus || 'Open',
    description: initialData?.description || '',
    remarks: initialData?.remarks || '',
    keyTerms: initialData?.keyTerms || [],
    attachments: initialData?.attachments || []
  });

  const contractTypes = [
    'Service', 'License', 'Tenancy', 'MOU', 'Supply', 'Consultancy', 
    'NDA', 'Maintenance', 'Works', 'Lease', 'Other'
  ];

  const departments = [
    'Legal', 'IT', 'Finance', 'HR', 'Operations', 'Risk', 'Compliance', 'Procurement'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addKeyTerm = () => {
    setFormData(prev => ({
      ...prev,
      keyTerms: [...prev.keyTerms, { term: '', description: '', dueDate: null, status: 'Pending' }]
    }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          {mode === 'create' && 'Create New Contract'}
          {mode === 'review' && 'Review Contract'}
          {mode === 'approve' && 'Approve Contract'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                required
                disabled={mode === 'approve'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractTitle">Contract Title *</Label>
              <Input
                id="contractTitle"
                value={formData.contractTitle}
                onChange={(e) => handleInputChange('contractTitle', e.target.value)}
                required
                disabled={mode === 'approve'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractType">Contract Type *</Label>
              <Select
                value={formData.contractType}
                onValueChange={(value) => handleInputChange('contractType', value)}
                disabled={mode === 'approve'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  {contractTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => handleInputChange('department', value)}
                disabled={mode === 'approve'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person *</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                required
                disabled={mode === 'approve'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (months) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                required
                disabled={mode === 'approve'}
              />
            </div>

            <div className="space-y-2">
              <Label>Commencement Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.commencementDate && "text-muted-foreground"
                    )}
                    disabled={mode === 'approve'}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.commencementDate ? format(formData.commencementDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.commencementDate}
                    onSelect={(date) => handleInputChange('commencementDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Expiry Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.expiryDate && "text-muted-foreground"
                    )}
                    disabled={mode === 'approve'}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expiryDate ? format(formData.expiryDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.expiryDate}
                    onSelect={(date) => handleInputChange('expiryDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Contract Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the contract details..."
              rows={4}
              disabled={mode === 'approve'}
            />
          </div>

          {mode !== 'create' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Key Contract Terms</Label>
                {mode === 'review' && (
                  <Button type="button" onClick={addKeyTerm} size="sm">
                    Add Key Term
                  </Button>
                )}
              </div>
              {formData.keyTerms.map((term: any, index: number) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      placeholder="Term name"
                      value={term.term}
                      onChange={(e) => {
                        const newTerms = [...formData.keyTerms];
                        newTerms[index].term = e.target.value;
                        handleInputChange('keyTerms', newTerms);
                      }}
                      disabled={mode === 'approve'}
                    />
                    <Input
                      placeholder="Description"
                      value={term.description}
                      onChange={(e) => {
                        const newTerms = [...formData.keyTerms];
                        newTerms[index].description = e.target.value;
                        handleInputChange('keyTerms', newTerms);
                      }}
                      disabled={mode === 'approve'}
                    />
                    <Select
                      value={term.status}
                      onValueChange={(value) => {
                        const newTerms = [...formData.keyTerms];
                        newTerms[index].status = value;
                        handleInputChange('keyTerms', newTerms);
                      }}
                      disabled={mode === 'approve'}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              placeholder="Additional remarks..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-600">Click to upload or drag and drop files</p>
              <Input type="file" multiple className="hidden" disabled={mode === 'approve'} />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Send className="mr-2 h-4 w-4" />
              {mode === 'create' && 'Submit for Review'}
              {mode === 'review' && 'Send for Approval'}
              {mode === 'approve' && 'Approve Contract'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
