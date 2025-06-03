import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Employee, Skill } from '@/types/skills';
import { getMockSkillMatrixData } from '@/services/skillMatrixService';

/**
 * Custom hook to load employee skills data from multiple sources
 * and ensure the skills are properly structured as Record<string, number>
 */
export function useEmployeeSkills() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usedMockData, setUsedMockData] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Load all skills from ALL matrices
        const { data: allMatrices, error: matricesError } = await supabase
          .from("skill_matrices")
          .select("id, name, skills_data, members_data");
        
        if (matricesError) {
          console.error("Error fetching matrices:", matricesError);
          throw new Error("Failed to load matrices data");
        }
        
        console.log(`Found ${allMatrices?.length || 0} skill matrices`);
        
        // Combine skills from all matrices
        const skillsMap = new Map<string, Skill>(); // Use a map to deduplicate skills
        
        if (allMatrices && allMatrices.length > 0) {
          allMatrices.forEach(matrix => {
            if (matrix.skills_data && Array.isArray(matrix.skills_data)) {
              console.log(`Processing matrix: ${matrix.name} with ${matrix.skills_data.length} skills`);
              
              matrix.skills_data.forEach((item: any) => {
                if (item && item.id) {
                  skillsMap.set(item.id, {
                    id: item.id,
                    name: item.name,
                    category_id: item.category || "",
                    target_level: item.target_level || 0
                  });
                }
              });
            }
          });
        }
        
        // Convert map to array
        const skillsList = Array.from(skillsMap.values());
        console.log(`Loaded ${skillsList.length} unique skills from all matrices`);
        
        // 2. Load all employees with their basic info
        const { data: employeesData, error: employeesError } = await supabase
          .from("employees")
          .select("*")
          .order("first_name");
          
        if (employeesError) {
          console.error("Error fetching employees:", employeesError);
          throw new Error("Failed to load employees data");
        }
        
        // 3. For each employee, get their skills from employee_skills AND all matrices
        const employeesWithSkills = await Promise.all(
          (employeesData || []).map(async (employee) => {
            // Initialize skills object
            const skills: Record<string, number> = {};
            
            // Try to fetch from employee_skills table first
            const { data: employeeSkills, error: skillsError } = await supabase
              .from("employee_skills")
              .select("skill_id, skill_level")
              .eq("employee_id", employee.id);
              
            if (!skillsError && employeeSkills && employeeSkills.length > 0) {
              // Found skills in employee_skills table
              employeeSkills.forEach((skill) => {
                skills[skill.skill_id] = skill.skill_level;
              });
              console.log(`Found ${employeeSkills.length} skills for ${employee.first_name} in employee_skills table`);
            }
            
            // ALSO try to fetch from ALL skill matrices to combine all skills
            if (allMatrices && allMatrices.length > 0) {
              for (const matrix of allMatrices) {
                if (matrix.members_data && Array.isArray(matrix.members_data)) {
                  const memberData = matrix.members_data.find(
                    (member: any) => member && typeof member === 'object' && 
                    'id' in member && member.id === employee.id
                  );
                  
                  if (memberData && typeof memberData === 'object' && 
                      'skills' in memberData && memberData.skills && 
                      typeof memberData.skills === 'object') {
                    
                    // Merge skills from this matrix with skills from other sources
                    const matrixSkills = memberData.skills as Record<string, number>;
                    Object.entries(matrixSkills).forEach(([skillId, level]) => {
                      if (typeof level === 'number' && level > 0) { // Only include skills with level > 0
                        skills[skillId] = level;
                      }
                    });
                    
                    console.log(`Found skills for ${employee.first_name} in matrix '${matrix.name}'`);
                  }
                }
              }
            }
            
            // Create full name
            const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
            
            // Create a properly typed Employee object
            return {
              id: employee.id,
              name: fullName || `Employee ${employee.id.substring(0, 8)}`,
              skills: skills,
              first_name: employee.first_name || '',
              last_name: employee.last_name || '',
              employee_id: employee.employee_id || '',
              department: employee.department_number || '',
              position: employee.position || '',
              category: employee.category || '',
            };
          })
        );
        
        // Count employees with skills
        const employeesWithRealSkills = employeesWithSkills.filter(emp => 
          emp.skills && Object.keys(emp.skills).length > 0
        );
        
        console.log(`Loaded ${skillsList.length} skills and ${employeesWithSkills.length} employees`);
        
        // Use only real data from the database
        console.log("Using only real data");
        
        // Log the real skills and employees
        console.log('Real skills count:', skillsList.length);
        console.log('Real skills:', skillsList);
        console.log('Real employees count:', employeesWithSkills.length);
        
        
        // Log some examples of employees with skills
        employeesWithRealSkills.slice(0, 3).forEach(emp => {
          console.log(`Employee ${emp.name} has ${Object.keys(emp.skills).length} skills:`, emp.skills);
        });
        
        // If we have no real data at all, fall back to mock data as a last resort
        if (skillsList.length === 0 && employeesWithRealSkills.length === 0) {
          console.log("No real data found, falling back to mock data");
          const mockData = getMockSkillMatrixData();
          setUsedMockData(true);
          setSkills(mockData.skills.map(s => ({
            id: s.id,
            name: s.name,
            target_level: s.targetLevel,
            category_id: 'Default'
          })));
          setEmployees(mockData.employees);
        } else {
          // Use real data only
          setUsedMockData(false);
          setSkills(skillsList);
          setEmployees(employeesWithSkills);
        }
      } catch (err) {
        console.error("Error in useEmployeeSkills:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
        
        // Fall back to mock data
        const mockData = getMockSkillMatrixData();
        setUsedMockData(true);
        setSkills(mockData.skills.map(s => ({
          id: s.id,
          name: s.name,
          target_level: s.targetLevel,
          category_id: 'Default'
        })));
        setEmployees(mockData.employees);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  return { employees, skills, loading, error, usedMockData };
}
