import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Building, Users } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description: string;
  created_at: string;
  units?: Unit[];
}

interface Unit {
  id: string;
  department_id: string;
  name: string;
  description: string;
  created_at: string;
}

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [selectedDepartmentForUnit, setSelectedDepartmentForUnit] = useState<string>('');
  const { toast } = useToast();

  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: '',
  });

  const [unitForm, setUnitForm] = useState({
    name: '',
    description: '',
    department_id: '',
  });

  useEffect(() => {
    fetchDepartmentsAndUnits();
  }, []);

  const fetchDepartmentsAndUnits = async () => {
    try {
      setIsLoading(true);
      
      const [departmentsResponse, unitsResponse] = await Promise.all([
        supabase.from('departments').select('*').order('name'),
        supabase.from('units').select('*').order('name')
      ]);

      if (departmentsResponse.error) throw departmentsResponse.error;
      if (unitsResponse.error) throw unitsResponse.error;

      setDepartments(departmentsResponse.data || []);
      setUnits(unitsResponse.data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch departments and units',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDepartmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingDepartment) {
        const { error } = await supabase
          .from('departments')
          .update(departmentForm)
          .eq('id', editingDepartment.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Department updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('departments')
          .insert([departmentForm]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Department created successfully',
        });
      }

      setDepartmentForm({ name: '', description: '' });
      setEditingDepartment(null);
      setDialogOpen(false);
      fetchDepartmentsAndUnits();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUnit) {
        const { error } = await supabase
          .from('units')
          .update(unitForm)
          .eq('id', editingUnit.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Unit updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('units')
          .insert([unitForm]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Unit created successfully',
        });
      }

      setUnitForm({ name: '', description: '', department_id: '' });
      setEditingUnit(null);
      setUnitDialogOpen(false);
      fetchDepartmentsAndUnits();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department? This will also delete all units in this department.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Department deleted successfully',
      });
      
      fetchDepartmentsAndUnits();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this unit?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Unit deleted successfully',
      });
      
      fetchDepartmentsAndUnits();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const openDepartmentDialog = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setDepartmentForm({
        name: department.name,
        description: department.description,
      });
    } else {
      setEditingDepartment(null);
      setDepartmentForm({ name: '', description: '' });
    }
    setDialogOpen(true);
  };

  const openUnitDialog = (unit?: Unit, departmentId?: string) => {
    if (unit) {
      setEditingUnit(unit);
      setUnitForm({
        name: unit.name,
        description: unit.description,
        department_id: unit.department_id,
      });
    } else {
      setEditingUnit(null);
      setUnitForm({ 
        name: '', 
        description: '', 
        department_id: departmentId || selectedDepartmentForUnit || '' 
      });
    }
    setUnitDialogOpen(true);
  };

  const getDepartmentUnits = (departmentId: string) => {
    return units.filter(unit => unit.department_id === departmentId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Department & Unit Management</h2>
          <p className="text-gray-600">Manage organizational departments and their units</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDepartmentDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDepartment ? 'Edit Department' : 'Add New Department'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleDepartmentSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="dept-name">Department Name</Label>
                  <Input
                    id="dept-name"
                    value={departmentForm.name}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dept-description">Description</Label>
                  <Textarea
                    id="dept-description"
                    value={departmentForm.description}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingDepartment ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => openUnitDialog()}>
                <Users className="h-4 w-4 mr-2" />
                Add Unit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUnit ? 'Edit Unit' : 'Add New Unit'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUnitSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="unit-department">Department</Label>
                  <select
                    id="unit-department"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={unitForm.department_id}
                    onChange={(e) => setUnitForm({ ...unitForm, department_id: e.target.value })}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="unit-name">Unit Name</Label>
                  <Input
                    id="unit-name"
                    value={unitForm.name}
                    onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit-description">Description</Label>
                  <Textarea
                    id="unit-description"
                    value={unitForm.description}
                    onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setUnitDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingUnit ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        {departments.map((department) => {
          const departmentUnits = getDepartmentUnits(department.id);
          
          return (
            <Card key={department.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      {department.name}
                    </CardTitle>
                    <CardDescription>{department.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUnitDialog(undefined, department.id)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Add Unit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDepartmentDialog(department)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDepartment(department.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {departmentUnits.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departmentUnits.map((unit) => (
                        <TableRow key={unit.id}>
                          <TableCell className="font-medium">{unit.name}</TableCell>
                          <TableCell>{unit.description}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openUnitDialog(unit)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUnit(unit.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No units in this department yet.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {departments.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No departments yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first department.</p>
            <Button onClick={() => openDepartmentDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DepartmentManagement;