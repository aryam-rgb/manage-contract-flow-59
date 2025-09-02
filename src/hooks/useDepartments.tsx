import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  name: string;
  description: string | null;
  department_id: string;
  created_at: string;
  updated_at: string;
}

export const useDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching departments",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async (departmentId?: string) => {
    try {
      let query = supabase.from('units').select('*').order('name');
      
      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUnits(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching units",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getUnitsByDepartment = (departmentId: string): Unit[] => {
    return units.filter(unit => unit.department_id === departmentId);
  };

  useEffect(() => {
    fetchDepartments();
    fetchUnits();
  }, []);

  return {
    departments,
    units,
    loading,
    fetchDepartments,
    fetchUnits,
    getUnitsByDepartment,
  };
};