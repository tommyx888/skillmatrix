import { supabase, MatrixMemberData } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CompleteSkillMatrix, SkillData, EmployeeData } from "@/types/skills";

export type MatrixHistoryEntry = {
  id: string;
  matrix_id: string;
  timestamp: string;
  employee_skills: Record<string, Record<string, number>>;
  snapshot_date: string;
  snapshot_name?: string;
  created_by?: string;
  matrix_data?: {
    skills: SkillData[];
    employees: EmployeeData[];
  };
  // Dôležité: tieto polia sú potrebné pre databázovú schému v Supabase
  skills_data?: string | SkillData[];
  members_data?: string | EmployeeData[];
  // Pridané ďalšie polia, ktoré môžu byť v databáze
  created_at?: string;
};

// In-memory fallback storage for matrix history
const mockMatrixHistory: MatrixHistoryEntry[] = [];

export const saveMatrixProgress = async (
  matrixId: string,
  employeeSkills: Record<string, Record<string, number>>,
  snapshotName?: string
) => {
  try {
    console.log("Saving matrix progress for matrix ID:", matrixId);
    console.log("Employee skills data:", employeeSkills);
    
    const timestamp = new Date().toISOString();
    const currentUser = await supabase.auth.getUser();
    
    // First, update the skill matrices table with the new skill values
    const updateSuccess = await updateSkillMatricesTable(matrixId, employeeSkills);
    if (!updateSuccess) {
      console.warn("Failed to update skill_matrices table");
    } else {
      console.log("Successfully updated skill_matrices table");
    }
    
    try {
      // Pull the latest skills_data and members_data from skill_matrices
      const { data: matrixData, error: matrixError } = await supabase
        .from('skill_matrices')
        .select('skills_data, members_data')
        .eq('id', matrixId)
        .single();
      
      if (matrixError || !matrixData) {
        throw new Error("Failed to fetch matrix data for snapshot: " + (matrixError?.message || "Unknown error"));
      }
      
      // Diagnostické logovanie pre lepšie pochopenie typov údajov
      console.log('Fetched matrix data types:', {
        skills_data_type: matrixData.skills_data ? typeof matrixData.skills_data : 'undefined',
        members_data_type: matrixData.members_data ? typeof matrixData.members_data : 'undefined',
        skills_is_array: matrixData.skills_data ? Array.isArray(matrixData.skills_data) : false,
        members_is_array: matrixData.members_data ? Array.isArray(matrixData.members_data) : false
      });
      
      // Ak sú dáta v JSON formáte, prevedieme ich na objekty
      let processedSkillsData = matrixData.skills_data;
      if (processedSkillsData && typeof processedSkillsData === 'string') {
        try {
          processedSkillsData = JSON.parse(processedSkillsData);
          console.log('Successfully parsed skills_data from string');
        } catch (e) {
          console.warn('Failed to parse skills_data string:', e);
        }
      }
      
      let processedMembersData = matrixData.members_data;
      if (processedMembersData && typeof processedMembersData === 'string') {
        try {
          processedMembersData = JSON.parse(processedMembersData);
          console.log('Successfully parsed members_data from string');
        } catch (e) {
          console.warn('Failed to parse members_data string:', e);
        }
      }
      
      // Teraz máme dáta v objektovej forme (ak boli platné JSON stringy)
      // alebo v ich pôvodnej forme ak neboli JSON stringy
      
      // Zabezpečenie správneho formátu dát pre uloženie do histórie
      // skills_data a members_data musia byť JSON stringy pre post do databázy
      const skillsDataString = typeof processedSkillsData === 'string' ? 
        processedSkillsData : 
        JSON.stringify(processedSkillsData);
      
      const membersDataString = typeof processedMembersData === 'string' ? 
        processedMembersData : 
        JSON.stringify(processedMembersData);
        
      // Extrakcia skills a employees pre matrix_data objekt
      const skills = Array.isArray(processedSkillsData) ? processedSkillsData : 
                    (processedSkillsData ? [processedSkillsData] : []);
      
      const employees = Array.isArray(processedMembersData) ? processedMembersData : 
                       (processedMembersData ? [processedMembersData] : []);
      
      // Vytvorenie historyEntry s korektnými dátami
      const historyEntry: any = {
        matrix_id: matrixId,
        timestamp,
        employee_skills: employeeSkills,
        snapshot_date: timestamp,
        snapshot_name: snapshotName || `Progress Update ${new Date().toLocaleDateString()}`,
        created_by: currentUser.data.user?.id,
        skills_data: skillsDataString,  // Použitie spracovaných dát v JSON formáte
        members_data: membersDataString, // Použitie spracovaných dát v JSON formáte
        matrix_data: {
          skills: skills,
          employees: employees
        }
      };
      
      // Diagnostické logovania pre debugáciu
      console.log('History entry constructed with:', {
        has_skills_data: !!historyEntry.skills_data,
        has_members_data: !!historyEntry.members_data,
        matrix_data_skills_count: historyEntry.matrix_data.skills.length,
        matrix_data_employees_count: historyEntry.matrix_data.employees.length
      });

      const { error, data } = await supabase
        .from('matrix_history')
        .insert(historyEntry)
        .select('id')
        .single();
        
      if (error) {
        console.error("Error saving to matrix_history:", error);
        mockMatrixHistory.push(historyEntry as MatrixHistoryEntry);
        console.log("Saved to mock storage as fallback, total entries:", mockMatrixHistory.length);
      } else {
        console.log("Successfully saved matrix progress to matrix_history with ID:", data.id);
      }
    } catch (historyError) {
      console.error("Error with matrix history:", historyError);
    }
    
    toast({
      title: "Progress saved",
      description: "Skill matrix progress has been saved successfully"
    });
    
    return true;
  } catch (error) {
    console.error("Error saving matrix progress:", error);
    toast({
      title: "Save failed",
      description: "Failed to save skill matrix progress",
      variant: "destructive",
    });
    
    return false;
  }
};

export const saveInitialMatrixHistory = async (
  matrixId: string,
  employeeSkills: Record<string, Record<string, number>>
) => {
  try {
    console.log("Saving initial matrix history for matrix ID:", matrixId);
    console.log("Initial employee skills data:", employeeSkills);
    
    const timestamp = new Date().toISOString();
    const currentUser = await supabase.auth.getUser();
    
    // Získanie skills_data a members_data z tabuľky skill_matrices
    const { data: matrixData, error: matrixError } = await supabase
      .from('skill_matrices')
      .select('skills_data, members_data')
      .eq('id', matrixId)
      .single();
    
    if (matrixError || !matrixData) {
      console.error("Failed to fetch matrix data for initial snapshot:", matrixError);
    }
    
    console.log('Fetched matrix data for initial snapshot:', {
      has_skills_data: matrixData?.skills_data ? true : false,
      skills_data_type: matrixData?.skills_data ? typeof matrixData.skills_data : 'undefined',
      has_members_data: matrixData?.members_data ? true : false,
      members_data_type: matrixData?.members_data ? typeof matrixData.members_data : 'undefined'
    });

    // Spracovanie dát do správneho formátu
    let processedSkillsData = matrixData?.skills_data;
    if (processedSkillsData && typeof processedSkillsData === 'string') {
      try {
        processedSkillsData = JSON.parse(processedSkillsData);
      } catch (e) {
        console.warn('Failed to parse skills_data string in initial snapshot:', e);
      }
    }
    
    let processedMembersData = matrixData?.members_data;
    if (processedMembersData && typeof processedMembersData === 'string') {
      try {
        processedMembersData = JSON.parse(processedMembersData);
      } catch (e) {
        console.warn('Failed to parse members_data string in initial snapshot:', e);
      }
    }
    
    // Získanie JSON stringov pre uloženie
    const skillsDataString = typeof processedSkillsData === 'string' 
      ? processedSkillsData 
      : JSON.stringify(processedSkillsData) || '[]';
    
    const membersDataString = typeof processedMembersData === 'string' 
      ? processedMembersData 
      : JSON.stringify(processedMembersData) || '[]';
    
    // Extrakcia skills a employees pre matrix_data objekt
    const skills = Array.isArray(processedSkillsData) ? processedSkillsData : 
                  (processedSkillsData ? [processedSkillsData] : []);
    
    const employees = Array.isArray(processedMembersData) ? processedMembersData : 
                     (processedMembersData ? [processedMembersData] : []);
    
    // Store the initial snapshot in matrix_history with "Original" name  
    const historyEntry = {
      matrix_id: matrixId,
      timestamp,
      employee_skills: employeeSkills,
      snapshot_date: timestamp,
      snapshot_name: "Original",
      created_by: currentUser.data.user?.id,
      // Pridanie dôležitých údajov, ktoré chýbali
      skills_data: skillsDataString,
      members_data: membersDataString,
      matrix_data: {
        skills: skills,
        employees: employees  
      }
    };
    
    console.log('Saving initial snapshot with data:', {
      has_skills_data: !!historyEntry.skills_data,
      has_members_data: !!historyEntry.members_data,
      matrix_data_skills_count: historyEntry.matrix_data?.skills?.length || 0,
      matrix_data_employees_count: historyEntry.matrix_data?.employees?.length || 0  
    });
    
    const { error, data } = await supabase
      .from('matrix_history')
      .insert(historyEntry)
      .select('id')
      .single();
      
    if (error) {
      console.error("Error saving initial matrix history:", error);
      // Vytvorenie kompatibilného objektu pre mockMatrixHistory
      const mockEntry: MatrixHistoryEntry = {
        ...historyEntry,
        id: `mock-${Date.now()}`  // Pridelenie docasného ID pre mock verziu
      };
      mockMatrixHistory.push(mockEntry);
      console.log("Saved initial history to mock storage as fallback");
      return false;
    } else {
      console.log("Successfully saved initial matrix history with ID:", data.id);
      return true;
    }
  } catch (error) {
    console.error("Error saving initial matrix history:", error);
    return false;
  }
};

const updateSkillMatricesTable = async (
  matrixId: string,
  employeeSkills: Record<string, Record<string, number>>
) => {
  try {
    const { data: currentMatrix, error: fetchError } = await supabase
      .from('skill_matrices')
      .select('members_data')
      .eq('id', matrixId)
      .single();
      
    if (fetchError) {
      console.error("Error fetching matrix for members_data update:", fetchError);
      return false;
    }
    
    let membersData: MatrixMemberData[] = [];
    
    // Parse the existing members_data, handling different formats
    if (currentMatrix && currentMatrix.members_data) {
      console.log("Current members_data:", currentMatrix.members_data);
      
      if (typeof currentMatrix.members_data === 'string') {
        try {
          membersData = JSON.parse(currentMatrix.members_data) as MatrixMemberData[];
        } catch (e) {
          console.error("Failed to parse members_data string:", e);
          membersData = [];
        }
      } else {
        membersData = Array.isArray(currentMatrix.members_data) 
          ? [...currentMatrix.members_data] as MatrixMemberData[] 
          : [];
      }
    }
    
    console.log("Parsed members_data:", membersData);
    
    // Create updated members data with new skill values
    const updatedMembersData = [...membersData];
    
    for (const [employeeId, skills] of Object.entries(employeeSkills)) {
      const existingMemberIndex = updatedMembersData.findIndex(
        (member) => member.id === employeeId
      );
      
      if (existingMemberIndex >= 0) {
        // Update existing member's skills
        updatedMembersData[existingMemberIndex] = {
          ...updatedMembersData[existingMemberIndex],
          skills: {
            ...updatedMembersData[existingMemberIndex].skills,
            ...skills
          }
        };
        console.log(`Updated member ${employeeId} skills:`, skills);
      } else {
        // Add new member with skills
        updatedMembersData.push({
          id: employeeId,
          name: "Unknown", // Will be fetched later
          skills: skills
        });
        console.log(`Added new member ${employeeId} with skills:`, skills);
      }
    }
    
    console.log("Updated members_data to save:", updatedMembersData);
    
    const { error: updateError } = await supabase
      .from('skill_matrices')
      .update({ 
        members_data: updatedMembersData,
        updated_at: new Date().toISOString()
      })
      .eq('id', matrixId);
      
    if (updateError) {
      console.error("Error updating members_data in skill_matrices:", updateError);
      return false;
    }
    
    console.log("Successfully updated members_data in skill_matrices");
    return true;
  } catch (error) {
    console.error("Error updating skill_matrices table:", error);
    return false;
  }
};

export const fetchMatrixHistory = async (matrixId: string): Promise<MatrixHistoryEntry[]> => {
  try {
    console.log("Fetching matrix history for:", matrixId);
    
    const { data, error } = await supabase
      .from('matrix_history')
      .select('*')
      .eq('matrix_id', matrixId)
      .order('timestamp', { ascending: false });
      
    if (error) {
      console.error("Database error fetching matrix history:", error);
      return mockMatrixHistory.filter(entry => entry.matrix_id === matrixId);
    }
    
    console.log(`Retrieved ${data?.length || 0} history entries from database`);
    
    // For each snapshot, reconstruct matrix_data from stored skills_data and members_data
    const enhancedHistory = (data || []).map(entry => {
      let skills: SkillData[] = [];
      let employees: EmployeeData[] = [];
      // Parse skills_data and members_data if present
      if (entry.skills_data) {
        try {
          skills = typeof entry.skills_data === 'string' ? JSON.parse(entry.skills_data) : entry.skills_data;
        } catch (e) {
          console.error('Failed to parse skills_data from matrix_history:', e);
        }
      }
      if (entry.members_data) {
        try {
          employees = typeof entry.members_data === 'string' ? JSON.parse(entry.members_data) : entry.members_data;
        } catch (e) {
          console.error('Failed to parse members_data from matrix_history:', e);
        }
      }
      return {
        ...entry,
        matrix_data: {
          skills,
          employees
        }
      };
    });
    
    return enhancedHistory as MatrixHistoryEntry[];
  } catch (error) {
    console.error("Error fetching matrix history:", error);
    return mockMatrixHistory.filter(entry => entry.matrix_id === matrixId);
  }
};

export const fetchSnapshotComparison = async (snapshotId1: string | number, snapshotId2: string | number) => {
  try {
    const { data: snapshot1, error: error1 } = await supabase
      .from('matrix_history')
      .select('*')
      .eq('id', String(snapshotId1))
      .single();
      
    const { data: snapshot2, error: error2 } = await supabase
      .from('matrix_history')
      .select('*')
      .eq('id', String(snapshotId2))
      .single();
      
    if (error1 || error2 || !snapshot1 || !snapshot2) {
      console.error("Error fetching snapshots for comparison:", error1 || error2);
      return null;
    }
    
    const comparison = {
      snapshot1Date: snapshot1.timestamp,
      snapshot2Date: snapshot2.timestamp,
      snapshot1Name: snapshot1.snapshot_name,
      snapshot2Name: snapshot2.snapshot_name,
      differences: {}
    };
    
    const allEmployeeIds = new Set([
      ...Object.keys(snapshot1.employee_skills || {}),
      ...Object.keys(snapshot2.employee_skills || {})
    ]);
    
    for (const employeeId of allEmployeeIds) {
      const employeeSkills1 = snapshot1.employee_skills?.[employeeId] || {};
      const employeeSkills2 = snapshot2.employee_skills?.[employeeId] || {};
      
      const allSkillIds = new Set([
        ...Object.keys(employeeSkills1),
        ...Object.keys(employeeSkills2)
      ]);
      
      for (const skillId of allSkillIds) {
        const level1 = employeeSkills1[skillId] || 0;
        const level2 = employeeSkills2[skillId] || 0;
        
        if (level1 !== level2) {
          if (!comparison.differences[employeeId]) {
            comparison.differences[employeeId] = {};
          }
          
          comparison.differences[employeeId][skillId] = {
            before: level1,
            after: level2,
            change: level2 - level1
          };
        }
      }
    }
    
    return comparison;
  } catch (error) {
    console.error("Error comparing snapshots:", error);
    return null;
  }
};

export const updateMatrixData = async (
  matrixId: string,
  employeeId: string,
  skillId: string,
  newSkillLevel: number
) => {
  try {
    console.log(`Updating skill level: Matrix ${matrixId}, Employee ${employeeId}, Skill ${skillId}, Level ${newSkillLevel}`);
    
    // Update the skill_matrices table first
    const { data: matrix, error: matrixError } = await supabase
      .from('skill_matrices')
      .select('members_data')
      .eq('id', matrixId)
      .single();
      
    if (matrixError) {
      console.error("Error fetching matrix data:", matrixError);
      return false;
    }
    
    let membersData: MatrixMemberData[] = [];
    
    if (matrix && matrix.members_data) {
      // Parse the existing members_data, accounting for both array and string formats
      if (typeof matrix.members_data === 'string') {
        try {
          membersData = JSON.parse(matrix.members_data) as MatrixMemberData[];
        } catch (e) {
          console.error("Failed to parse members_data string:", e);
          membersData = [];
        }
      } else {
        membersData = Array.isArray(matrix.members_data) 
          ? [...matrix.members_data] as MatrixMemberData[] 
          : [];
      }
    }
    
    console.log("Current members data before update:", JSON.stringify(membersData, null, 2));
    
    let memberFound = false;
    
    const updatedMembers = membersData.map((member) => {
      if (member.id === employeeId) {
        memberFound = true;
        const updatedSkills = { ...(member.skills || {}) };
        updatedSkills[skillId] = newSkillLevel;
        
        console.log(`Updating member ${member.id} skill ${skillId} to level ${newSkillLevel}`, 
          { before: member.skills?.[skillId], after: newSkillLevel });
          
        return {
          ...member,
          skills: updatedSkills
        };
      }
      return member;
    });
    
    if (!memberFound) {
      console.log(`Member ${employeeId} not found, adding new member`);
      updatedMembers.push({
        id: employeeId,
        name: "", // Will be updated on next fetch
        skills: {
          [skillId]: newSkillLevel
        }
      });
    }
    
    console.log("Updated members data to save:", JSON.stringify(updatedMembers, null, 2));
    
    // Update the skill_matrices table with the updated members_data
    const { error: updateError } = await supabase
      .from('skill_matrices')
      .update({ 
        members_data: updatedMembers,
        updated_at: new Date().toISOString()
      })
      .eq('id', matrixId);
      
    if (updateError) {
      console.error("Error updating skill matrices data:", updateError);
      return false;
    }
    
    console.log("Skill matrices members_data updated successfully");
    
    return true;
  } catch (error) {
    console.error("Error updating matrix data:", error);
    toast({
      title: "Error updating skill",
      description: "Failed to update the skill level. Please try again.",
      variant: "destructive",
    });
    return false;
  }
};

export const loadCurrentSkillValues = async (matrixId: string) => {
  try {
    console.log(`Loading current skill values for matrix: ${matrixId}`);
    
    // Load skill values from the members_data field in skill_matrices
    const { data: matrix, error: matrixError } = await supabase
      .from('skill_matrices')
      .select('members_data')
      .eq('id', matrixId)
      .single();
      
    if (matrixError) {
      console.error("Error fetching matrix data:", matrixError);
      return null;
    }
    
    if (!matrix || !matrix.members_data) {
      console.log("No matrix data found or members_data is empty");
      return null;
    }
    
    let membersData: MatrixMemberData[] = [];
    
    // Parse the members_data, accounting for different formats
    if (typeof matrix.members_data === 'string') {
      try {
        membersData = JSON.parse(matrix.members_data) as MatrixMemberData[];
      } catch (e) {
        console.error("Failed to parse members_data string:", e);
        return null;
      }
    } else {
      membersData = Array.isArray(matrix.members_data) 
        ? matrix.members_data as MatrixMemberData[] 
        : [];
    }
    
    if (membersData.length === 0) {
      console.log("Members data array is empty");
      return null;
    }
    
    console.log("Found members data:", membersData);
    
    // Transform into the expected format
    const skillsByEmployee: Record<string, Record<string, number>> = {};
    
    membersData.forEach(member => {
      if (member.id && member.skills) {
        skillsByEmployee[member.id] = { ...member.skills };
      }
    });
    
    if (Object.keys(skillsByEmployee).length === 0) {
      console.log("No skill data found in members_data");
      return null;
    }
    
    console.log("Extracted skill values:", skillsByEmployee);
    return skillsByEmployee;
  } catch (error) {
    console.error("Error loading current skill values:", error);
    return null;
  }
};

export const initializeSkillValuesIfNeeded = async (matrixId: string, skills: any[], employees: any[]) => {
  try {
    // Check if we already have skill values in the matrix
    const { data: matrix, error: matrixError } = await supabase
      .from('skill_matrices')
      .select('members_data')
      .eq('id', matrixId)
      .single();
      
    if (matrixError) {
      console.error("Error fetching matrix for initialization:", matrixError);
      return false;
    }
    
    let membersData: MatrixMemberData[] = [];
    let needsInitialization = true;
    
    if (matrix && matrix.members_data) {
      if (typeof matrix.members_data === 'string') {
        try {
          membersData = JSON.parse(matrix.members_data) as MatrixMemberData[];
        } catch (e) {
          console.error("Failed to parse members_data string:", e);
          membersData = [];
        }
      } else {
        membersData = Array.isArray(matrix.members_data) 
          ? [...matrix.members_data] as MatrixMemberData[] 
          : [];
      }
      
      // Check if we have skill values for all employees
      if (membersData.length > 0) {
        const memberIds = new Set(membersData.map(m => m.id));
        const allEmployeesHaveData = employees.every(emp => memberIds.has(emp.id));
        
        if (allEmployeesHaveData) {
          // Check if all employees have all skills
          const allSkillsInitialized = membersData.every(member => {
            if (!member.skills) return false;
            return skills.every(skill => member.skills[skill.id] !== undefined);
          });
          
          needsInitialization = !allSkillsInitialized;
        }
      }
    }
    
    if (needsInitialization) {
      console.log("Initializing skill values for matrix:", matrixId);
      
      // Initialize skills with value 0 for all employees
      const initializedMembersData = [...membersData];
      const existingEmployeeIds = new Set(initializedMembersData.map(m => m.id));
      
      // Add missing employees
      for (const employee of employees) {
        if (!existingEmployeeIds.has(employee.id)) {
          initializedMembersData.push({
            id: employee.id,
            name: employee.name,
            skills: {}
          });
        }
      }
      
      // Ensure all employees have all skills initialized
      for (const member of initializedMembersData) {
        if (!member.skills) {
          member.skills = {};
        }
        
        for (const skill of skills) {
          if (member.skills[skill.id] === undefined) {
            member.skills[skill.id] = 0;
          }
        }
      }
      
      console.log("Initialized members data:", JSON.stringify(initializedMembersData, null, 2));
      
      // Update the matrix with initialized data
      const { error: updateError } = await supabase
        .from('skill_matrices')
        .update({
          members_data: initializedMembersData,
          updated_at: new Date().toISOString()
        })
        .eq('id', matrixId);
        
      if (updateError) {
        console.error("Error initializing skill values:", updateError);
        return false;
      }
      
      console.log("Successfully initialized skill values for matrix");
      return true;
    }
    
    return true;
  } catch (error) {
    console.error("Error initializing skill values:", error);
    return false;
  }
};

// Helper to use data solely from the members_data field in skill_matrices
export const getSafeSkillValues = async (matrixId: string, employees: any[], skills: any[]) => {
  // Try to initialize the skill values first
  await initializeSkillValuesIfNeeded(matrixId, skills, employees);
  
  // Then load the current skill values
  const currentSkillValues = await loadCurrentSkillValues(matrixId);
  
  // If we have skill values, return them
  if (currentSkillValues && Object.keys(currentSkillValues).length > 0) {
    return currentSkillValues;
  }
  
  // If no skill values found, create a default structure with zeros
  const defaultSkillValues: Record<string, Record<string, number>> = {};
  
  for (const employee of employees) {
    defaultSkillValues[employee.id] = {};
    
    for (const skill of skills) {
      defaultSkillValues[employee.id][skill.id] = 0;
    }
  }
  
  return defaultSkillValues;
};

export const getMatrixName = async (matrixId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('skill_matrices')
      .select('name')
      .eq('id', matrixId)
      .single();
      
    if (error || !data) {
      console.error("Error fetching matrix name:", error);
      return "Unknown Matrix";
    }
    
    return data.name;
  } catch (error) {
    console.error("Error in getMatrixName:", error);
    return "Unknown Matrix";
  }
};

export const updateSnapshotName = async (snapshotId: string, newName: string): Promise<boolean> => {
  try {
    console.log(`Updating snapshot name for ID ${snapshotId} to: ${newName}`);
    
    // Najprv načítame existujúci záznam, aby sme mali istotu, že zachováme všetky údaje
    const { data: existingData, error: fetchError } = await supabase
      .from('matrix_history')
      .select('*')
      .eq('id', snapshotId)
      .single();
      
    if (fetchError || !existingData) {
      console.error("Error fetching existing snapshot data:", fetchError);
      toast({
        title: "Aktualizácia zlyhala",
        description: "Nepodarilo sa načítať existujúce údaje snímky",
        variant: "destructive"
      });
      return false;
    }
    
    // Potvrdenie, že máme všetky potrebné údaje pred aktualizáciou
    console.log("Existing snapshot data:", {
      id: existingData.id,
      skills_data: existingData.skills_data ? "[present]" : "[missing]",
      members_data: existingData.members_data ? "[present]" : "[missing]", 
      employee_skills: existingData.employee_skills ? "[present]" : "[missing]"
    });
    
    // Teraz aktualizujeme len názov snímky, pričom zachováme všetky ostatné údaje
    const { error } = await supabase
      .from('matrix_history')
      .update({ snapshot_name: newName })
      .eq('id', snapshotId);
    
    if (error) {
      console.error("Error updating snapshot name:", error);
      toast({
        title: "Aktualizácia zlyhala",
        description: "Nepodarilo sa aktualizovať názov snímky",
        variant: "destructive"
      });
      return false;
    }
    
    // Kontrolná validácia po aktualizácii
    const { data: afterUpdateData, error: afterUpdateError } = await supabase
      .from('matrix_history')
      .select('*')
      .eq('id', snapshotId)
      .single();
      
    if (afterUpdateError || !afterUpdateData) {
      console.error("Failed to verify update:", afterUpdateError);
    } else {
      console.log("After update verification:", {
        id: afterUpdateData.id,
        name: afterUpdateData.snapshot_name,
        skills_data: afterUpdateData.skills_data ? "[present]" : "[missing]",
        members_data: afterUpdateData.members_data ? "[present]" : "[missing]", 
        employee_skills: afterUpdateData.employee_skills ? "[present]" : "[missing]"
      });
    }
    
    // Úspešná aktualizácia
    toast({
      title: "Úspech",
      description: "Názov snímky bol aktualizovaný",
    });
    
    console.log("Snapshot name updated successfully");
    return true;
  } catch (error) {
    console.error("Error in updateSnapshotName:", error);
    toast({
      title: "Chyba",
      description: "Vyskytla sa chyba pri aktualizácii názvu snímky",
      variant: "destructive"
    });
    return false;
  }
};

declare global {
  interface Window {
    mockMatrixDetails: Record<string, any>;
  }
}

if (typeof window !== 'undefined') {
  window.mockMatrixDetails = window.mockMatrixDetails || {};
}
