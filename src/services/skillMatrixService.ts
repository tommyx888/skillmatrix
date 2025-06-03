import { supabase, fetchPaginatedEmployees } from "@/integrations/supabase/client";
import { Skill, SkillCategory, Employee, EmployeeSkill } from "@/types/skills";
import { toast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

export async function fetchSkills(): Promise<Skill[]> {
  try {
    console.log("Fetching skills from skill_matrices table");
    const { data, error } = await supabase
      .from("skill_matrices")
      .select("skills_data")
      .limit(1);
    
    if (error) {
      console.error("Error fetching skills from skill_matrices:", error);
      toast({
        title: "Error fetching skills",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
    
    if (!data || data.length === 0 || !data[0].skills_data) {
      console.log("No skill_matrices data found or skills_data is empty");
      return [];
    }
    
    const skillsData = data[0].skills_data;
    
    if (!Array.isArray(skillsData)) {
      console.error("skills_data is not an array", skillsData);
      return [];
    }
    
    const skills: Skill[] = skillsData.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      category_id: item.category || "",
      target_level: item.target_level || 0
    }));
    
    console.log(`Fetched ${skills.length} skills from skill_matrices`);
    return skills;
  } catch (error) {
    console.error("Exception fetching skills:", error);
    toast({
      title: "Error fetching skills",
      description: "An unexpected error occurred",
      variant: "destructive",
    });
    return [];
  }
}

export async function fetchSkillCategories(): Promise<SkillCategory[]> {
  try {
    const skills = await fetchSkills();
    
    const categoryMap = new Map<string, SkillCategory>();
    
    skills.forEach(skill => {
      if (skill.category_id && !categoryMap.has(skill.category_id)) {
        categoryMap.set(skill.category_id, {
          id: skill.category_id,
          name: skill.category_id,
          description: ""
        });
      }
    });
    
    const categories = Array.from(categoryMap.values());
    console.log(`Extracted ${categories.length} categories from skills`);
    
    return categories;
  } catch (error) {
    console.error("Exception fetching skill categories:", error);
    toast({
      title: "Error fetching skill categories",
      description: "An unexpected error occurred",
      variant: "destructive",
    });
    return [];
  }
}

export async function fetchEmployees(): Promise<Employee[]> {
  try {
    console.log("Fetching employees from employees table");
    
    // Use the paginated function with default values (first 20 employees)
    const employeesData = await fetchPaginatedEmployees();
    
    if (!employeesData || employeesData.length === 0) {
      console.log("No employees found");
      return [];
    }
    
    const employees: Employee[] = await Promise.all(
      employeesData.map(async (employee) => {
        let skills: Record<string, number> = {};
        
        try {
          const { data: employeeSkills, error: skillsError } = await supabase
            .from("employee_skills")
            .select("skill_id, skill_level")
            .eq("employee_id", employee.id);
          
          if (!skillsError && employeeSkills && employeeSkills.length > 0) {
            employeeSkills.forEach((skill) => {
              skills[skill.skill_id] = skill.skill_level;
            });
          } else {
            const { data: matrixData, error: matrixError } = await supabase
              .from("skill_matrices")
              .select("members_data")
              .limit(1);
            
            if (!matrixError && matrixData && matrixData.length > 0 && matrixData[0].members_data) {
              const membersData = matrixData[0].members_data;
              
              if (Array.isArray(membersData)) {
                const memberData = membersData.find((member: any) => 
                  member && typeof member === 'object' && 'id' in member && member.id === employee.id
                );
                
                if (memberData && typeof memberData === 'object' && 'skills' in memberData && 
                    memberData.skills && typeof memberData.skills === 'object') {
                  skills = memberData.skills as Record<string, number>;
                }
              }
            }
          }
        } catch (e) {
          console.error(`Error fetching skills for employee ${employee.id}:`, e);
        }
        
        // Create a proper name field from first_name and last_name
        const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
        
        return {
          id: employee.id,
          name: fullName || `Employee ${employee.id.substring(0, 8)}`,
          first_name: employee.first_name || '',
          last_name: employee.last_name || '',
          skills,
          employee_id: employee.employee_id || '', 
          position: employee.position,
          category: employee.category,
          employer: employee.employer,
          gender: employee.gender,
          hire_date: employee.hire_date,
          termination_date: employee.termination_date,
          termination_reason: employee.termination_reason,
          department_number: employee.department_number,
          subdepartment: employee.subdepartment,
          supervisor: employee.supervisor
        };
      })
    );
    
    console.log(`Fetched ${employees.length} employees with their skills:`, employees);
    return employees;
  } catch (error) {
    console.error("Exception fetching employees:", error);
    toast({
      title: "Error fetching employees",
      description: "An unexpected error occurred",
      variant: "destructive",
    });
    return [];
  }
}

export async function updateEmployeeSkill(employeeSkill: Partial<EmployeeSkill>): Promise<boolean> {
  try {
    console.log("Updating employee skill in members_data", employeeSkill);
    
    // First, try to update in employee_skills table if available
    try {
      // Check if a record exists for this employee and skill
      const { data: existingSkill, error: checkError } = await supabase
        .from("employee_skills")
        .select("id")
        .eq("employee_id", employeeSkill.employee_id!)
        .eq("skill_id", employeeSkill.skill_id!)
        .maybeSingle();
      
      if (!checkError) {
        if (existingSkill) {
          // Update existing record
          const { error: updateError } = await supabase
            .from("employee_skills")
            .update({
              skill_level: employeeSkill.level,
              updated_at: new Date().toISOString()
            })
            .eq("id", existingSkill.id);
            
          if (!updateError) {
            console.log("Updated skill in employee_skills table");
            // Also update in skill_matrices for consistency
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from("employee_skills")
            .insert({
              employee_id: employeeSkill.employee_id!,
              skill_id: employeeSkill.skill_id!,
              skill_level: employeeSkill.level,
              assessment_date: new Date().toISOString()
            });
            
          if (!insertError) {
            console.log("Inserted skill in employee_skills table");
            // Also update in skill_matrices for consistency
          }
        }
      }
    } catch (e) {
      console.error("Error updating employee_skills table:", e);
      // Continue to update skill_matrices as fallback
    }
    
    // Update in skill_matrices.members_data for backwards compatibility
    const { data: matrixData, error: fetchError } = await supabase
      .from("skill_matrices")
      .select("id, members_data")
      .limit(1);
    
    if (fetchError || !matrixData || matrixData.length === 0) {
      console.error("Error fetching matrix data:", fetchError);
      toast({
        title: "Error updating skill",
        description: "Could not fetch matrix data",
        variant: "destructive",
      });
      return false;
    }
    
    const matrixId = matrixData[0].id;
    let membersData = matrixData[0].members_data || [];
    
    if (!Array.isArray(membersData)) {
      console.error("members_data is not an array", membersData);
      membersData = [];
    }
    
    // Get employee details to include employee_id
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("employee_id, first_name, last_name")
      .eq("id", employeeSkill.employee_id!)
      .maybeSingle();
      
    const employeeIdValue = employeeData?.employee_id || '';
    const employeeName = employeeData ? 
      `${employeeData.first_name || ''} ${employeeData.last_name || ''}`.trim() :
      `Employee ${employeeSkill.employee_id}`;
    
    console.log(`Retrieved employee_id ${employeeIdValue} for member update`);
    
    // Type safety: Use any type for array manipulation with find and then type check
    let employeeIndex = (membersData as any[]).findIndex((member: any) => 
      member && typeof member === 'object' && 'id' in member && member.id === employeeSkill.employee_id
    );
    
    if (employeeIndex === -1) {
      console.log(`Adding new member with ID ${employeeSkill.employee_id} and employee_id ${employeeIdValue}`);
      (membersData as any[]).push({
        id: employeeSkill.employee_id,
        name: employeeName,
        employee_id: employeeIdValue, // Add employee_id to new member
        skills: {}
      });
      employeeIndex = membersData.length - 1;
    } else if (employeeIdValue && typeof membersData[employeeIndex] === 'object') {
      // Add employee_id to existing members if it's missing
      const memberBefore = membersData[employeeIndex];
      (membersData[employeeIndex] as any).employee_id = employeeIdValue;
      console.log(`Updated existing member: Before: ${JSON.stringify(memberBefore)} After: ${JSON.stringify(membersData[employeeIndex])}`);
    }
    
    // Type check before accessing properties
    if (typeof membersData[employeeIndex] === 'object' && membersData[employeeIndex] !== null) {
      const memberData = membersData[employeeIndex] as any;
      
      if (!memberData.skills) {
        memberData.skills = {};
      }
      
      memberData.skills[employeeSkill.skill_id!] = employeeSkill.level;
    }
    
    console.log("Updated members_data:", membersData);
    
    const { error: updateError } = await supabase
      .from("skill_matrices")
      .update({ 
        members_data: membersData,
        updated_at: new Date().toISOString()
      })
      .eq("id", matrixId);
    
    if (updateError) {
      console.error("Error updating members_data:", updateError);
      toast({
        title: "Error updating skill",
        description: updateError.message,
        variant: "destructive",
      });
      return false;
    }
    
    toast({
      title: "Skill updated",
      description: "Employee skill has been updated successfully",
    });
    return true;
  } catch (error) {
    console.error("Exception updating employee skill:", error);
    toast({
      title: "Error updating skill",
      description: "An unexpected error occurred",
      variant: "destructive",
    });
    return false;
  }
}

export async function addNewSkill(skillName: string, categoryId: string, targetLevel: number = 0): Promise<boolean> {
  try {
    console.log(`Adding new skill "${skillName}" to category "${categoryId}" with target level ${targetLevel}`);
    
    // First, get the current skill matrix data
    const { data: matrixData, error: fetchError } = await supabase
      .from("skill_matrices")
      .select("id, skills_data, members_data")
      .limit(1);
    
    if (fetchError || !matrixData || matrixData.length === 0) {
      console.error("Error fetching matrix data:", fetchError);
      toast({
        title: "Error adding skill",
        description: "Could not fetch matrix data",
        variant: "destructive",
      });
      return false;
    }
    
    const matrixId = matrixData[0].id;
    let skillsData = matrixData[0].skills_data || [];
    let membersData = matrixData[0].members_data || [];
    
    if (!Array.isArray(skillsData)) {
      console.error("skills_data is not an array", skillsData);
      skillsData = [];
    }
    
    if (!Array.isArray(membersData)) {
      console.error("members_data is not an array", membersData);
      membersData = [];
    }
    
    // Generate a unique ID for the new skill
    const skillId = `skill-${Date.now()}`;
    
    // Add the new skill to skills_data
    skillsData.push({
      id: skillId,
      name: skillName,
      category: categoryId,
      target_level: targetLevel
    });
    
    // Set the skill level to 0 for all existing members
    membersData.forEach(member => {
      if (typeof member === 'object' && member !== null && 'skills' in member) {
        const memberData = member as any;
        if (!memberData.skills) {
          memberData.skills = {};
        }
        memberData.skills[skillId] = 0;
      }
    });
    
    // Update the skill matrix
    const { error: updateError } = await supabase
      .from("skill_matrices")
      .update({ 
        skills_data: skillsData,
        members_data: membersData,
        updated_at: new Date().toISOString()
      })
      .eq("id", matrixId);
    
    if (updateError) {
      console.error("Error updating skill matrix:", updateError);
      toast({
        title: "Error adding skill",
        description: updateError.message,
        variant: "destructive",
      });
      return false;
    }
    
    toast({
      title: "Skill added",
      description: `New skill "${skillName}" has been added with default level 0 for all team members`,
    });
    return true;
  } catch (error) {
    console.error("Exception adding new skill:", error);
    toast({
      title: "Error adding skill",
      description: "An unexpected error occurred",
      variant: "destructive",
    });
    return false;
  }
}

export function getMockSkillMatrixData() {
  const skills = [
    { id: "security", name: "Security", targetLevel: 2 },
    { id: "software-dev", name: "Software Development", targetLevel: 3 },
    { id: "data-management", name: "Data Management", targetLevel: 2 },
    { id: "infrastructure", name: "Infrastructure Management", targetLevel: 0 },
    { id: "network", name: "Network Management", targetLevel: 0 },
    { id: "asset", name: "Asset Management", targetLevel: 0 },
    { id: "support", name: "Support Management", targetLevel: 0 },
    { id: "project", name: "Project Office Skills", targetLevel: 2 },
    { id: "microsoft", name: "Microsoft Office Skills", targetLevel: 3 },
    { id: "testing", name: "Testing", targetLevel: 0 },
    { id: "management", name: "Management", targetLevel: 2 },
    { id: "marketing", name: "Marketing", targetLevel: 1 },
    { id: "leadership", name: "Leadership", targetLevel: 3 },
    { id: "student", name: "Student Management", targetLevel: 0 },
    { id: "governance", name: "Governance", targetLevel: 4 }
  ];

  const employees = [
    {
      id: "23-W-1",
      name: "John Wilson",
      skills: {
        "security": 0,
        "software-dev": 0,
        "data-management": 0,
        "infrastructure": 0,
        "network": 0,
        "asset": 0,
        "support": 0,
        "project": 2,
        "microsoft": 3,
        "testing": 0,
        "management": 2,
        "marketing": 1,
        "leadership": 3,
        "student": 0,
        "governance": 4
      }
    },
    {
      id: "23-W-2",
      name: "Donald Lee",
      skills: {
        "security": 0,
        "software-dev": 2,
        "data-management": 1,
        "infrastructure": 0,
        "network": 0,
        "asset": 2,
        "support": 0,
        "project": 3,
        "microsoft": 4,
        "testing": 1,
        "management": 3,
        "marketing": 4,
        "leadership": 3,
        "student": 1,
        "governance": 2
      }
    },
    {
      id: "23-W-3",
      name: "Suzie Arthur",
      skills: {
        "security": 0,
        "software-dev": 4,
        "data-management": 0,
        "infrastructure": 1,
        "network": 2,
        "asset": 1,
        "support": 2,
        "project": 4,
        "microsoft": 3,
        "testing": 2,
        "management": 3,
        "marketing": 4,
        "leadership": 3,
        "student": 1,
        "governance": 2
      }
    }
  ];

  return { skills, employees };
}

export async function ensureMatrixEmployeeIds(matrix: any): Promise<any> {
  if (!matrix || !matrix.employeesData || !Array.isArray(matrix.employeesData)) {
    return matrix;
  }
  
  // Get all unique employee IDs 
  const employeeIds = matrix.employeesData.map((emp: any) => emp.id);
  
  if (employeeIds.length === 0) {
    return matrix;
  }
  
  // Fetch employee_ids from the database
  const { data: employeesData, error } = await supabase
    .from("employees")
    .select("id, employee_id")
    .in("id", employeeIds);
    
  if (error || !employeesData) {
    console.error("Error fetching employee IDs:", error);
    return matrix;
  }
  
  // Create a map of employee ids to employee_ids
  const employeeIdMap = new Map();
  employeesData.forEach(emp => {
    if (emp.employee_id) {
      employeeIdMap.set(emp.id, emp.employee_id);
    }
  });
  
  console.log("Employee ID map:", Object.fromEntries(employeeIdMap));
  
  // Update the matrix data with employee_ids
  const updatedMatrix = { ...matrix };
  updatedMatrix.employeesData = matrix.employeesData.map((emp: any) => {
    // If employee_id is missing but exists in the map, add it
    if ((!emp.employee_id || emp.employee_id === '') && employeeIdMap.has(emp.id)) {
      console.log(`Adding missing employee_id ${employeeIdMap.get(emp.id)} to employee ${emp.name || emp.id}`);
      return {
        ...emp,
        employee_id: employeeIdMap.get(emp.id)
      };
    }
    return emp;
  });
  
  return updatedMatrix;
}
