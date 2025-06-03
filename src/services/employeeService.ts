import { supabase } from '@/integrations/supabase/client';
import { EmployeeData } from '@/types/skills';

/**
 * Fetch all employees from the database
 */
export const fetchAllEmployees = async (): Promise<EmployeeData[]> => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('first_name');

  if (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }

  // Add required fields to match the Employee interface
  return (data || []).map(employee => {
    // Create a properly typed employee object with all required fields
    const typedEmployee: EmployeeData = {
      id: employee.id,
      // Use first_name and last_name to create a display name
      name: employee.first_name && employee.last_name ? `${employee.first_name} ${employee.last_name}` : 
            employee.first_name || employee.last_name || 'Unnamed Employee',
      // Initialize empty skills object
      skills: {},
      // Copy all other fields from the database
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      employee_id: employee.employee_id,
      category: employee.category,
      hire_date: employee.hire_date,
      department_number: employee.department_number,
      supervisor: employee.supervisor,
      state: employee.state,
      grade: employee.grade
    };
    
    return typedEmployee;
  });
};

/**
 * Create a new employee
 */
export const createEmployee = async (employee: Omit<EmployeeData, 'id'>): Promise<EmployeeData> => {
  // Create a new employee object with only the fields that exist in the database
  const newEmployee = {
    first_name: employee.first_name || '',
    last_name: employee.last_name || '',
    email: employee.email || '',
    employee_id: employee.employee_id || '',
    category: employee.category || '',
    hire_date: employee.hire_date || '',
    department_number: employee.department_number || '',
    supervisor: employee.supervisor || '',
    state: employee.state || '',
    grade: employee.grade || ''
  };

  const { data, error } = await supabase
    .from('employees')
    .insert([newEmployee])
    .select()
    .single();

  if (error) {
    console.error('Error creating employee:', error);
    throw error;
  }

  // Add required fields to match the Employee interface
  return {
    ...data,
    name: data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : 
          data.first_name || data.last_name || 'Unnamed Employee',
    skills: {}
  };
};

/**
 * Update an existing employee
 */
export const updateEmployee = async (id: string, updates: Partial<EmployeeData>): Promise<EmployeeData> => {
  // Create an update object with only the fields that exist in the database
  const updateData = {
    first_name: updates.first_name,
    last_name: updates.last_name,
    email: updates.email,
    employee_id: updates.employee_id,
    category: updates.category,
    hire_date: updates.hire_date,
    department_number: updates.department_number,
    supervisor: updates.supervisor,
    state: updates.state,
    grade: updates.grade
  };
  
  // Remove undefined fields
  Object.keys(updateData).forEach(key => {
    if (updateData[key as keyof typeof updateData] === undefined) {
      delete updateData[key as keyof typeof updateData];
    }
  });

  const { data, error } = await supabase
    .from('employees')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating employee:', error);
    throw error;
  }

  // Add required fields to match the Employee interface
  return {
    ...data,
    name: data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : 
          data.first_name || data.last_name || 'Unnamed Employee',
    skills: {}
  };
};

/**
 * Delete an employee
 */
export const deleteEmployee = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};
