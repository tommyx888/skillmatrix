import React, { useState, useEffect } from 'react';
import { EmployeeData } from '@/types/skills';
import { createEmployee, updateEmployee } from '@/services/employeeService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface EmployeeFormProps {
  employee: EmployeeData | null;
  onClose: (refreshList?: boolean) => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onClose }) => {
  const [formData, setFormData] = useState<Partial<EmployeeData>>({
    email: '',
    first_name: '',
    last_name: '',
    employee_id: '',
    category: '',
    hire_date: '',
    department_number: '',
    supervisor: '',
    state: '',
    grade: '',
    skills: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (employee) {
      setFormData({
        email: employee.email || '',
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        employee_id: employee.employee_id || '',
        category: employee.category || '',
        hire_date: employee.hire_date || '',
        department_number: employee.department_number || '',
        supervisor: employee.supervisor || '',
        state: employee.state || '',
        grade: employee.grade || '',
        skills: employee.skills || {},
      });
    }
  }, [employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (employee) {
        // Update existing employee
        await updateEmployee(employee.id, formData);
        toast({
          title: 'Success',
          description: 'Zamestnanec bol úspešne upravený',
        });
      } else {
        // Create new employee
        await createEmployee(formData as Omit<EmployeeData, 'id'>);
        toast({
          title: 'Success',
          description: 'Zamestnanec bol úspešne pridaný',
        });
      }
      onClose(true); // Close form and refresh list
    } catch (error) {
      toast({
        title: 'Chyba',
        description: employee ? 'Nepodarilo sa upraviť zamestnanca' : 'Nepodarilo sa pridať zamestnanca',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{employee ? 'Upraviť zamestnanca' : 'Pridať nového zamestnanca'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Meno</Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Meno"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Priezvisko</Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Priezvisko"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">ID zamestnanca</Label>
              <Input
                id="employee_id"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                placeholder="ID zamestnanca"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="E-mailová adresa"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategória</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Kategória zamestnanca"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Stupeň</Label>
              <Input
                id="grade"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                placeholder="Stupeň zamestnanca"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hire_date">Dátum nástupu</Label>
              <Input
                id="hire_date"
                name="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={handleChange}
                placeholder="Dátum nástupu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Stav</Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Stav"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department_number">Číslo oddelenia</Label>
              <Input
                id="department_number"
                name="department_number"
                value={formData.department_number}
                onChange={handleChange}
                placeholder="Číslo oddelenia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supervisor">Nadriadený</Label>
              <Input
                id="supervisor"
                name="supervisor"
                value={formData.supervisor}
                onChange={handleChange}
                placeholder="Meno nadriadeného"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()} disabled={isSubmitting}>
              Zrušiť
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                  Ukladám...
                </>
              ) : (
                employee ? 'Upraviť zamestnanca' : 'Pridať zamestnanca'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeForm;
