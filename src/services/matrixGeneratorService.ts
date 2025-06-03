import { supabase, SkillMatrixInsert, SkillMatrixRow, CompleteSkillMatrixInsert } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CompleteSkillMatrix, SkillData, EmployeeData, NewSkillCategory } from "@/types/skills";
import { saveInitialMatrixHistory } from "./matrixProgressService";

export const generateSkillMatrix = async (department: string, description: string) => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ department, description }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate skill matrix: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error generating skill matrix:", error);
    toast({
      title: "Error generating skill matrix",
      description: error.message || "Failed to generate skill matrix",
      variant: "destructive",
    });
    throw error;
  }
};

export const saveCompleteSkillMatrix = async (matrixData: CompleteSkillMatrixInsert) => {
  try {
    // First, check if the user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.warn("User not authenticated or session error:", sessionError);
      // For now we'll continue with the operation without authentication
    } else {
      console.log("User authenticated with ID:", session.user.id);
      // Add the authenticated user's ID as the creator if not already set
      if (!matrixData.created_by && session.user) {
        matrixData.created_by = session.user.id;
      }
    }
    
    // Skip RLS policy by using an admin role function if available
    try {
      const { data, error } = await supabase
        .from('complete_skill_matrices')
        .insert(matrixData);

      if (error) {
        throw new Error(`Error creating complete skill matrix: ${error.message}`);
      }

      console.log("Complete skill matrix saved to database:", data);
      return data;
    } catch (error: any) {
      // If the operation fails, we might need to skip RLS
      console.error("Failed to save complete skill matrix with RLS:", error);
      throw error;
    }
  } catch (error: any) {
    console.error("Error saving complete skill matrix:", error);
    toast({
      title: "Error saving complete skill matrix",
      description: error.message || "Failed to save complete skill matrix",
      variant: "destructive",
    });
    throw error;
  }
};

export const saveSkillMatrix = async (matrixData: {
  name: string;
  department: string;
  description: string;
  skillCategories: NewSkillCategory[];
  teamMembers: { id: string; name: string; role: string; department?: string }[];
  employeeSkills: Record<string, Record<string, number>>;
}) => {
  try {
    console.log("Saving matrix data:", matrixData);
    
    // Generate skills data
    const skillsData: SkillData[] = [];
    const skillIdMap: Record<string, string> = {}; // Map from composite ID to actual UUID
    
    for (const category of matrixData.skillCategories) {
      for (const skill of category.skills) {
        const skillId = skill.id || crypto.randomUUID();
        // Create a composite ID that we use in the UI
        const compositeId = `${category.name}-${skill.name}`;
        
        skillIdMap[compositeId] = skillId;
        
        skillsData.push({
          id: skillId,
          name: skill.name,
          category: category.name,
          target_level: skill.targetLevel
        });
      }
    }
    
    // Generate employee data
    const employeeData: any[] = [];
    const employeeSkillsById: Record<string, Record<string, number>> = {};
    
    for (const member of matrixData.teamMembers) {
      const skills: Record<string, number> = {};
      
      // Try to set skill values from employeeSkills
      if (matrixData.employeeSkills) {
        if (matrixData.employeeSkills && matrixData.employeeSkills[member.id]) {
          console.log(`Processing skills for employee ${member.id} (${member.name}):`, matrixData.employeeSkills[member.id]);
          
          // Map the composite ids to the actual UUIDs when saving
          Object.entries(matrixData.employeeSkills[member.id]).forEach(([skillKey, skillValue]) => {
            // If the key is a composite id (like "category-skill"), look up the actual UUID
            if (skillKey.includes('-')) {
              const uuid = skillIdMap[skillKey];
              if (uuid) {
                skills[uuid] = skillValue;
                console.log(`Mapping skill ${skillKey} to UUID ${uuid} with value ${skillValue} for employee ${member.name}`);
              } else {
                console.warn(`No UUID found for skill key ${skillKey}`);
                // Handle skills that don't have a mapping - this is safe to skip since it should have a mapping
              }
            } else {
              // If it's already a UUID, use it directly
              skills[skillKey] = skillValue;
              console.log(`Using direct UUID ${skillKey} with value ${skillValue} for employee ${member.name}`);
            }
          });
        } else {
          console.log(`No skills data found for employee ${member.id} (${member.name})`);
          // Set default skill values
          skillsData.forEach(skill => {
            skills[skill.id] = 0;
          });
        }
      }
      
      employeeData.push({
        id: member.id,
        name: member.name,
        role: member.role,
        department: member.department || matrixData.department,
        skills
      });
      
      // Also prepare a clean version of employee skills for the history
      employeeSkillsById[member.id] = skills;
    }
    
    console.log("Final skills data to save:", skillsData);
    console.log("Final employee data to save:", employeeData);
    
    // Save to skill_matrices table
    const { data: matrixData1, error: matrixError } = await supabase
      .from('skill_matrices')
      .insert({
        name: matrixData.name,
        department: matrixData.department,
        description: matrixData.description,
        skills_data: skillsData as any, // Type cast to any to bypass TypeScript errors
        members_data: employeeData as any // Type cast to any to bypass TypeScript errors
      })
      .select('id')
      .single();
    
    if (matrixError) {
      throw new Error(`Error creating skill matrix: ${matrixError.message}`);
    }
    
    console.log("Matrix saved to database with ID:", matrixData1.id);
    
    // Save the initial matrix history with "Original" snapshot name
    await saveInitialMatrixHistory(matrixData1.id, employeeSkillsById);
    
    // Complete skill matrix (optional) - catch errors but don't let them fail the whole operation
    try {
      await saveCompleteSkillMatrix({
        matrix_id: matrixData1.id,
        name: matrixData.name,
        department: matrixData.department,
        description: matrixData.description,
        skill_data: skillsData as any, // Type cast to any
        employee_data: employeeData as any // Type cast to any
      });
    } catch (error) {
      console.error("Error saving complete skill matrix, but main matrix was saved successfully:", error);
      // Don't rethrow the error as we still want to return success since the main matrix was saved
    }
    
    return matrixData1.id;
  } catch (error) {
    console.error("Error saving skill matrix:", error);
    throw error;
  }
};

export async function fetchSkillMatrices() {
  try {
    console.log("Fetching skill matrices");
    
    const { data, error } = await supabase
      .from("skill_matrices")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching skill matrices:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Exception fetching skill matrices:", error);
    return [];
  }
}

export async function updateMatrixActiveStatus(matrixId: string, active: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('skill_matrices')
      .update({ active })
      .eq('id', matrixId);
    
    if (error) {
      console.error("Error updating matrix active status:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception updating matrix active status:", error);
    return false;
  }
}

export async function updateMatrixSkill(
  matrixId: string, 
  skillId: string, 
  newName: string,
  newTargetLevel?: number // Add an optional parameter for target level
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('skill_matrices')
      .select('skills_data')
      .eq('id', matrixId)
      .single();
    
    if (error) {
      console.error("Error fetching skills data:", error);
      return false;
    }
    
    const skillsData = data.skills_data || [];
    
    // Find and update the skill
    const updatedSkillsData = Array.isArray(skillsData) ? skillsData.map((skill: any) => {
      if (skill.id === skillId) {
        return {
          ...skill,
          name: newName,
          target_level: newTargetLevel !== undefined ? newTargetLevel : skill.target_level
        };
      }
      return skill;
    }) : [];
    
    const { error: updateError } = await supabase
      .from('skill_matrices')
      .update({ skills_data: updatedSkillsData })
      .eq('id', matrixId);
    
    if (updateError) {
      console.error("Error updating skill:", updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception updating skill:", error);
    return false;
  }
}

export async function updateMatrixCategory(
  matrixId: string, 
  categoryId: string, 
  newName: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('skill_matrices')
      .select('skills_data')
      .eq('id', matrixId)
      .single();
    
    if (error) {
      console.error("Error fetching skills data:", error);
      return false;
    }
    
    const skillsData = data.skills_data || [];
    
    // Update all skills in the category
    const updatedSkillsData = Array.isArray(skillsData) ? skillsData.map((skill: any) => {
      if (skill.category === categoryId) {
        return {
          ...skill,
          category: newName
        };
      }
      return skill;
    }) : [];
    
    const { error: updateError } = await supabase
      .from('skill_matrices')
      .update({ skills_data: updatedSkillsData })
      .eq('id', matrixId);
    
    if (updateError) {
      console.error("Error updating category:", updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception updating category:", error);
    return false;
  }
}

export async function addMatrixSkill(
  matrixId: string, 
  categoryId: string, 
  skill: { name: string; target_level: number }
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('skill_matrices')
      .select('skills_data')
      .eq('id', matrixId)
      .single();
    
    if (error) {
      console.error("Error fetching skills data:", error);
      return null;
    }
    
    const skillsData = data.skills_data || [];
    
    // Generate a new ID for the skill
    const skillId = crypto.randomUUID();
    
    // Add the new skill
    const newSkill = {
      id: skillId,
      name: skill.name,
      category: categoryId,
      target_level: skill.target_level
    };
    
    const updatedSkillsData = Array.isArray(skillsData) ? [...skillsData, newSkill] : [];
    
    const { error: updateError } = await supabase
      .from('skill_matrices')
      .update({ skills_data: updatedSkillsData })
      .eq('id', matrixId);
    
    if (updateError) {
      console.error("Error adding skill:", updateError);
      return null;
    }
    
    return skillId;
  } catch (error) {
    console.error("Exception adding skill:", error);
    return null;
  }
}

export async function removeMatrixSkill(
  matrixId: string, 
  skillId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('skill_matrices')
      .select('skills_data, members_data')
      .eq('id', matrixId)
      .single();
    
    if (error) {
      console.error("Error fetching matrix data:", error);
      return false;
    }
    
    const skillsData = data.skills_data || [];
    const membersData = data.members_data || [];
    
    // Remove the skill from skills_data
    const updatedSkillsData = Array.isArray(skillsData) ? skillsData.filter((skill: any) => skill.id !== skillId) : [];
    
    // Also remove the skill from all members' skills
    const updatedMembersData = Array.isArray(membersData) ? membersData.map((member: any) => {
      if (member.skills && member.skills[skillId]) {
        const { [skillId]: _, ...remainingSkills } = member.skills;
        return {
          ...member,
          skills: remainingSkills
        };
      }
      return member;
    }) : [];
    
    const { error: updateError } = await supabase
      .from('skill_matrices')
      .update({
        skills_data: updatedSkillsData,
        members_data: updatedMembersData
      })
      .eq('id', matrixId);
    
    if (updateError) {
      console.error("Error removing skill:", updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception removing skill:", error);
    return false;
  }
}

export async function addMatrixCategory(
  matrixId: string, 
  categoryName: string
): Promise<string | null> {
  try {
    // Category ID is just the name for now
    const categoryId = categoryName;
    
    // We don't need to modify anything since categories are implicit in the skills
    return categoryId;
  } catch (error) {
    console.error("Exception adding category:", error);
    return null;
  }
}

export async function removeMatrixCategory(
  matrixId: string, 
  categoryId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('skill_matrices')
      .select('skills_data')
      .eq('id', matrixId)
      .single();
    
    if (error) {
      console.error("Error fetching skills data:", error);
      return false;
    }
    
    const skillsData = data.skills_data || [];
    
    // Remove all skills in the category
    const updatedSkillsData = Array.isArray(skillsData) ? skillsData.filter((skill: any) => skill.category !== categoryId) : [];
    
    const { error: updateError } = await supabase
      .from('skill_matrices')
      .update({ skills_data: updatedSkillsData })
      .eq('id', matrixId);
    
    if (updateError) {
      console.error("Error removing category:", updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception removing category:", error);
    return false;
  }
}

export async function fetchSkillMatrixById(matrixId: string) {
  try {
    // Fetch the matrix details
    const { data: matrixData, error: matrixError } = await supabase
      .from('skill_matrices')
      .select('*')
      .eq('id', matrixId)
      .single();
      
    if (matrixError) {
      throw new Error(`Error fetching skill matrix: ${matrixError.message}`);
    }
    
    if (!matrixData) {
      throw new Error(`Matrix with ID ${matrixId} not found`);
    }
    
    console.log("Fetching matrix by ID:", matrixId);
    console.log("Found matrix in database:", matrixData);
    
    // Process the data to have a consistent format
    const skillsData = matrixData.skills_data || [];
    const membersData = matrixData.members_data || [];
    
    console.log("Using skills and members data from matrix");
    
    const result = {
      id: matrixData.id,
      name: matrixData.name,
      department: matrixData.department,
      description: matrixData.description,
      created_at: matrixData.created_at,
      updated_at: matrixData.updated_at,
      skills_data: skillsData,
      members_data: membersData,
      skillsData: skillsData,
      employeesData: membersData
    };
    
    console.log("Selected matrix data:", JSON.parse(JSON.stringify(result)));
    return result;
  } catch (error: any) {
    console.error("Error fetching skill matrix:", error);
    toast({
      title: "Error fetching skill matrix",
      description: error.message || "Failed to fetch skill matrix",
      variant: "destructive",
    });
    throw error;
  }
}
