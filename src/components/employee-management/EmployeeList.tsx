import React, { useState, useEffect, useMemo } from 'react';
import { EmployeeData } from '@/types/skills';
import { fetchAllEmployees, deleteEmployee } from '@/services/employeeService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash2, Plus, RefreshCw, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import EmployeeForm from './EmployeeForm';

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({
    employee_id: '',
    email: '',
    category: '',
    department_number: '',
    grade: '',
    state: '',
  });
  const { toast } = useToast();

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllEmployees();
      setEmployees(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Nepodarilo sa načítať zamestnancov',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle filter changes for specific columns
  const handleFilterChange = (column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Filter employees based on name search and column filters
  const filteredEmployees = useMemo(() => {
    // Start with all employees
    let filtered = employees;
    
    // Apply name search if present
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(employee => {
        const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.toLowerCase();
        return fullName.includes(query);
      });
    }
    
    // Apply column filters one by one
    Object.entries(columnFilters).forEach(([column, filterValue]) => {
      if (filterValue.trim()) {
        const query = filterValue.toLowerCase().trim();
        filtered = filtered.filter(employee => {
          const value = employee[column as keyof EmployeeData];
          return value && String(value).toLowerCase().includes(query);
        });
      }
    });
    
    return filtered;
  }, [employees, searchQuery, columnFilters]);

  const handleAddNew = () => {
    setSelectedEmployee(null);
    setIsFormOpen(true);
  };

  const handleEdit = (employee: EmployeeData) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Naozaj chcete odstrániť tohto zamestnanca? Táto akcia je nevratná.')) {
      try {
        await deleteEmployee(id);
        setEmployees(employees.filter(emp => emp.id !== id));
        toast({
          title: 'Úspech',
          description: 'Zamestnanec bol úspešne odstránený',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Nepodarilo sa odstrániť zamestnanca',
          variant: 'destructive',
        });
      }
    }
  };

  const handleFormClose = (refreshList = false) => {
    setIsFormOpen(false);
    setSelectedEmployee(null);
    if (refreshList) {
      fetchEmployees();
    }
  };

  return (
    <Card className="shadow-md border border-primary/10 rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-b">
        <div className="flex flex-row items-center justify-between mb-4">
          <CardTitle className="text-xl font-bold">Správa zamestnancov</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={fetchEmployees} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="default" size="sm" onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Pridať zamestnanca
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hľadať podľa mena..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenašli sa žiadni zamestnanci. Pridajte prvého zamestnanca pre začiatok.</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenašli sa žiadni zodpovedajúci zamestnanci. Skúste upraviť vyhľadávanie alebo filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meno</TableHead>
                  <TableHead>
                    ID zamestnanca
                    <div className="mt-2">
                      <Input 
                        placeholder="Filtrovať ID..." 
                        
                        className="h-7 text-xs"
                        value={columnFilters.employee_id}
                        onChange={(e) => handleFilterChange('employee_id', e.target.value)}
                      />
                    </div>
                  </TableHead>
                  <TableHead>
                    E-mail
                    <div className="mt-2">
                      <Input 
                        placeholder="Filtrovať e-mail..." 
                        
                        className="h-7 text-xs"
                        value={columnFilters.email}
                        onChange={(e) => handleFilterChange('email', e.target.value)}
                      />
                    </div>
                  </TableHead>
                  <TableHead>
                    Kategória
                    <div className="mt-2">
                      <Input 
                        placeholder="Filtrovať kategóriu..." 
                        
                        className="h-7 text-xs"
                        value={columnFilters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                      />
                    </div>
                  </TableHead>
                  <TableHead>
                    Oddelenie
                    <div className="mt-2">
                      <Input 
                        placeholder="Filtrovať oddelenie..." 
                        
                        className="h-7 text-xs"
                        value={columnFilters.department_number}
                        onChange={(e) => handleFilterChange('department_number', e.target.value)}
                      />
                    </div>
                  </TableHead>
                  <TableHead>
                    Stupeň
                    <div className="mt-2">
                      <Input 
                        placeholder="Filtrovať stupeň..." 
                        
                        className="h-7 text-xs"
                        value={columnFilters.grade}
                        onChange={(e) => handleFilterChange('grade', e.target.value)}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      {`${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Nepomenovaný zamestnanec'}
                    </TableCell>
                    <TableCell>{employee.employee_id || '-'}</TableCell>
                    <TableCell>{employee.email || '-'}</TableCell>
                    <TableCell>{employee.category || '-'}</TableCell>
                    <TableCell>{employee.department_number || '-'}</TableCell>
                    <TableCell>{employee.grade || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(employee.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {isFormOpen && (
        <EmployeeForm 
          employee={selectedEmployee} 
          onClose={handleFormClose} 
        />
      )}
    </Card>
  );
};

export default EmployeeList;
