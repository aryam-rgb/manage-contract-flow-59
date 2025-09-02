
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, Send, Infinity } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useDepartments } from "@/hooks/useDepartments";
import { ContractFormData } from "@/hooks/useContracts";
import { Checkbox } from "@/components/ui/checkbox";

interface ContractFormProps {
  mode: 'create' | 'review' | 'approve';
  onSubmit: (data: ContractFormData) => void;
  initialData?: Partial<ContractFormData>;
}

export function ContractForm({ mode, onSubmit, initialData }: ContractFormProps) {
  const { departments, getUnitsByDepartment } = useDepartments();
  const [isIndefinite, setIsIndefinite] = useState(initialData?.duration === 'Indefinite');
  
  const [formData, setFormData] = useState<ContractFormData>({
    companyName: initialData?.companyName || '',
    contractTitle: initialData?.contractTitle || '',
    contractFilingFileName: initialData?.contractFilingFileName || '',
    contractType: initialData?.contractType || '',
    department: initialData?.department || '',
    unit: initialData?.unit || '',
    contactPerson: initialData?.contactPerson || '',
    duration: initialData?.duration || '',
    commencementDate: initialData?.commencementDate || null,
    expiryDate: initialData?.expiryDate || null,
    validityStatus: initialData?.validityStatus || 'Open',
    description: initialData?.description || '',
    remarks: initialData?.remarks || '',
    attachments: initialData?.attachments || []
  });

  const contractTypes = [
    'Service', 'License', 'Tenancy', 'MOU', 'Supply', 'Consultancy', 
    'NDA', 'Maintenance', 'Works', 'Lease', 'Other'
  ];

  const contractFilingFileNames = [
    'Standard Service Agreement',
    'Software License Agreement',
    'Property Lease Agreement',
    'Memorandum of Understanding',
    'Supply Agreement',
    'Consultancy Agreement',
    'Non-Disclosure Agreement',
    'Maintenance Agreement',
    'Works Contract',
    'Property Lease',
    'Other'
  ];

  const validityStatuses = ['Open', 'Closed', 'Indefinite'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof ContractFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({ ...prev, attachments: files }));
  };

  const handleIndefiniteChange = (checked: boolean) => {
    setIsIndefinite(checked);
    if (checked) {
      setFormData(prev => ({ 
        ...prev, 
        duration: 'Indefinite',
        expiryDate: null,
        validityStatus: 'Indefinite'
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        duration: '',
        validityStatus: 'Open'
      }));
    }
  };

  const getDaysToExpiry = (): string => {
    if (!formData.expiryDate || isIndefinite) return 'N/A';
    
    const expiry = new Date(formData.expiryDate);
    const today = new Date();
    const timeDiff = expiry.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return 'Expired';
    return `${daysDiff} days`;
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
              <Label htmlFor="contractFilingFileName">Contract Filing File Name</Label>
              <Select
                value={formData.contractFilingFileName}
                onValueChange={(value) => handleInputChange('contractFilingFileName', value)}
                disabled={mode === 'approve'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select filing file name" />
                </SelectTrigger>
                <SelectContent>
                  {contractFilingFileNames.map((fileName) => (
                    <SelectItem key={fileName} value={fileName}>{fileName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => {
                  handleInputChange('department', value);
                  handleInputChange('unit', ''); // Reset unit when department changes
                }}
                disabled={mode === 'approve'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => handleInputChange('unit', value)}
                disabled={mode === 'approve' || !formData.department}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {getUnitsByDepartment(formData.department).map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
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
              <Label htmlFor="duration">Duration *</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="indefinite"
                    checked={isIndefinite}
                    onCheckedChange={handleIndefiniteChange}
                    disabled={mode === 'approve'}
                  />
                  <Label htmlFor="indefinite" className="text-sm font-normal">
                    Indefinite Contract
                  </Label>
                </div>
                {!isIndefinite && (
                  <Input
                    id="duration"
                    type="number"
                    placeholder="Duration in months"
                    value={formData.duration === 'Indefinite' ? '' : formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    required
                    disabled={mode === 'approve'}
                  />
                )}
                {isIndefinite && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Infinity className="h-4 w-4" />
                    <span>Contract duration is indefinite</span>
                  </div>
                )}
              </div>
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
              <Label>Expiry Date {!isIndefinite && '*'}</Label>
              {!isIndefinite ? (
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
              ) : (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground p-3 border rounded-md">
                  <Infinity className="h-4 w-4" />
                  <span>No expiry date (indefinite contract)</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="validityStatus">Validity Status *</Label>
              <Select
                value={formData.validityStatus}
                onValueChange={(value: 'Open' | 'Closed' | 'Indefinite') => handleInputChange('validityStatus', value)}
                disabled={mode === 'approve'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select validity status" />
                </SelectTrigger>
                <SelectContent>
                  {validityStatuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Days to Expiry</Label>
              <div className="p-3 border rounded-md bg-muted/50">
                <span className="text-sm font-medium">{getDaysToExpiry()}</span>
              </div>
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
              <Input 
                type="file" 
                multiple 
                onChange={handleFileChange}
                className="mt-2" 
                disabled={mode === 'approve'} 
              />
              {formData.attachments.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    {formData.attachments.length} file(s) selected
                  </p>
                </div>
              )}
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
