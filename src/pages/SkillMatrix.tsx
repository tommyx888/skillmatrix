import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SkillMatrixTable from "@/components/skill-matrix/SkillMatrixTable";
import SkillLevelLegend from "@/components/skill-matrix/SkillLevelLegend";
import DepartmentFilter from "@/components/skill-matrix/DepartmentFilter";
import { 
  fetchSkills, 
  fetchEmployees, 
  getMockSkillMatrixData, 
  ensureMatrixEmployeeIds 
} from "@/services/skillMatrixService";
import { 
  fetchSkillMatrices, 
  fetchSkillMatrixById,
  updateMatrixActiveStatus,
  updateMatrixSkill,
  updateMatrixCategory,
  addMatrixSkill,
  removeMatrixSkill,
  addMatrixCategory,
  removeMatrixCategory
} from "@/services/matrixGeneratorService";
import { 
  saveMatrixProgress, 
  fetchMatrixHistory, 
  updateMatrixData,
  fetchSnapshotComparison,
  loadCurrentSkillValues
} from "@/services/matrixProgressService";
import { supabase, MatrixMemberData, fetchPaginatedEmployees } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Wand2, FileText, Save, History, GitCompareIcon, EyeOff, Eye, UserPlus, Users, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogClose, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import MatrixProgressHistory from "@/components/skill-matrix/MatrixProgressHistory";
import { SkillProgressCharts } from "@/components/skill-matrix/SkillProgressCharts";
import { Json } from "@/integrations/supabase/types";
import { SkillData, EmployeeData, MatrixEditActions, TeamMember } from "@/types/skills";
import TeamMemberSelector from "@/components/matrix-generator/TeamMemberSelector";
import MatrixCategorySection from "@/components/matrix-generator/MatrixCategorySection";
import EmployeeList from "@/components/employee-management/EmployeeList";

const SkillMatrix = () => {
  const [useRealData, setUseRealData] = useState(true);
  const [selectedMatrixId, setSelectedMatrixId] = useState<string | null>(null);
  const [selectedMatrix, setSelectedMatrix] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [snapshotName, setSnapshotName] = useState("");
  const [matrixHistory, setMatrixHistory] = useState<any[]>([]);
  const [selectedHistorySnapshot, setSelectedHistorySnapshot] = useState<any>(null);
  const [showingHistoricalData, setShowingHistoricalData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const [showTeamMemberDialog, setShowTeamMemberDialog] = useState(false);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [availableTeamMembers, setAvailableTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<TeamMember[]>([]);
  const [teamMemberSearchQuery, setTeamMemberSearchQuery] = useState("");
  const [availableMemberSearchQuery, setAvailableMemberSearchQuery] = useState("");
  
  const {
    data: savedMatrices,
    isLoading: isLoadingMatrices,
    error: matricesError,
    refetch: refetchMatrices
  } = useQuery({
    queryKey: ['skill_matrices'],
    queryFn: fetchSkillMatrices
  });
  
  useEffect(() => {
    refetchMatrices();
  }, [refetchMatrices]);
  
  useEffect(() => {
    if (selectedMatrixId) {
      fetchMatrixHistory(selectedMatrixId)
        .then(history => setMatrixHistory(history))
        .catch(error => {
          console.error("Error fetching matrix history:", error);
          toast({ title: "Error", description: "Failed to load performance data", variant: "destructive" });
        });
    } else {
      setMatrixHistory([]);
    }
  }, [selectedMatrixId]);

  const departments = useMemo(() => {
    if (!savedMatrices || !Array.isArray(savedMatrices)) return [];
    
    const uniqueDepartments = new Set<string>();
    savedMatrices.forEach(matrix => {
      if (matrix.department) {
        uniqueDepartments.add(matrix.department);
      }
    });
    
    return Array.from(uniqueDepartments).sort();
  }, [savedMatrices]);

  const filteredMatrices = useMemo(() => {
    if (!savedMatrices || !Array.isArray(savedMatrices)) return [];
    
    let matrices = savedMatrices.filter(matrix => showInactive ? true : (matrix.active !== false));
    
    if (selectedDepartment) {
      matrices = matrices.filter(matrix => matrix.department === selectedDepartment);
    }
    
    return matrices;
  }, [savedMatrices, selectedDepartment, showInactive]);
  
  useEffect(() => {
    const fetchSelectedMatrix = async () => {
      if (selectedMatrixId) {
        try {
          const matrixData = await fetchSkillMatrixById(selectedMatrixId);
          if (matrixData) {
            console.log("Selected matrix data:", matrixData);
            
            try {
              if (matrixData.employeesData && 
                  Array.isArray(matrixData.employeesData) && 
                  matrixData.employeesData.length > 0) {
                const currentSkillValues = await loadCurrentSkillValues(selectedMatrixId);
                
                if (currentSkillValues) {
                  console.log("Loaded current skill values from employee_skills table:", currentSkillValues);
                  
                  const updatedEmployees = Array.isArray(matrixData.employeesData) ? 
                    matrixData.employeesData.map((employee: any) => {
                      if (currentSkillValues[employee.id]) {
                        return {
                          ...employee,
                          skills: {
                            ...(employee.skills || {}),
                            ...currentSkillValues[employee.id]
                          }
                        };
                      }
                      return employee;
                    }) : [];
                
                  matrixData.employeesData = updatedEmployees;
                } else {
                  const employeeIds = Array.isArray(matrixData.employeesData) ? 
                    matrixData.employeesData.map((emp: any) => emp.id) : [];
                  
                  if (employeeIds.length > 0) {
                    const { data: employeeSkillsData, error } = await supabase
                      .from('employee_skills')
                      .select('*')
                      .in('employee_id', employeeIds);
                    
                    if (!error && employeeSkillsData && employeeSkillsData.length > 0) {
                      console.log("Fetched employee skills:", employeeSkillsData);
                      
                      const updatedEmployees = Array.isArray(matrixData.employeesData) ? 
                        matrixData.employeesData.map((employee: any) => {
                          const employeeSkills = {...(employee.skills || {})};
                          
                          employeeSkillsData
                            .filter((record: any) => record.employee_id === employee.id)
                            .forEach((record: any) => {
                              employeeSkills[record.skill_id] = record.skill_level;
                            });
                          
                          return {
                            ...employee,
                            skills: employeeSkills
                          };
                        }) : [];
                      
                      matrixData.employeesData = updatedEmployees;
                    } else {
                      console.log("No employee skills found or error:", error);
                      
                      const { data: matrixDataFromDB, error: matrixError } = await supabase
                        .from('skill_matrices')
                        .select('members_data')
                        .eq('id', selectedMatrixId)
                        .single();
                      
                      if (!matrixError && matrixDataFromDB && matrixDataFromDB.members_data) {
                        console.log("Found skills in members_data:", matrixDataFromDB.members_data);
                        
                        const membersData = matrixDataFromDB.members_data;
                        
                        if (membersData && Array.isArray(membersData) && Array.isArray(matrixData.employeesData)) {
                          const updatedEmployees = matrixData.employeesData.map((employee: any) => {
                            const memberData = membersData.find((member: any) => 
                              member && typeof member === 'object' && 'id' in member && member.id === employee.id
                            ) as MatrixMemberData | undefined;
                            
                            if (memberData && memberData.skills) {
                              return {
                                ...employee,
                                skills: memberData.skills
                              };
                            }
                            
                            return employee;
                          });
                          
                          matrixData.employeesData = updatedEmployees;
                        }
                      }
                    }
                  }
                }
              }
                            // Ensure every employee entry in employeesData has first_name, last_name, and name fields
               if (Array.isArray(matrixData.employeesData)) {
                 matrixData.employeesData = matrixData.employeesData.map((employee: any) => {
                   let first_name = employee.first_name || '';
                   let last_name = employee.last_name || '';
                   let name = employee.name || '';
                   // If name is missing, construct it from first/last
                   if (!name && (first_name || last_name)) {
                     name = `${first_name} ${last_name}`.trim();
                   }
                   // If first/last are missing but name exists, try to split name
                   if ((!first_name || !last_name) && name) {
                     const parts = name.split(' ');
                     if (!first_name) first_name = parts[0] || '';
                     if (!last_name && parts.length > 1) last_name = parts.slice(1).join(' ');
                   }
                   // Fallback: use ID
                   if (!name) name = `Employee ${String(employee.id).substring(0,8)}`;
                   return {
                     ...employee,
                     first_name,
                     last_name,
                     name
                   };
                 });
               }
               const enhancedMatrixData = await ensureMatrixEmployeeIds(matrixData);
               setSelectedMatrix(enhancedMatrixData);
              
              if (typeof window !== 'undefined') {
                window.mockMatrixDetails = window.mockMatrixDetails || {};
                window.mockMatrixDetails[selectedMatrixId] = enhancedMatrixData;
              }
              
              const history = await fetchMatrixHistory(selectedMatrixId);
              setMatrixHistory(history);
              setSelectedHistorySnapshot(null);
              setShowingHistoricalData(false);
              setComparisonData(null);
              setIsComparing(false);
            } catch (error) {
              console.error("Error fetching employee skills:", error);
            }
          }
        } catch (error) {
          console.error("Error fetching matrix details:", error);
          toast({
            title: "Error",
            description: "Failed to load the selected matrix",
            variant: "destructive",
          });
        }
      } else {
        setSelectedMatrix(null);
        setMatrixHistory([]);
        setSelectedHistorySnapshot(null);
        setShowingHistoricalData(false);
        setComparisonData(null);
        setIsComparing(false);
      }
    };

    fetchSelectedMatrix();
  }, [selectedMatrixId]);

  const { 
    data: skills, 
    isLoading: isLoadingSkills,
    error: skillsError 
  } = useQuery({
    queryKey: ['skills'],
    queryFn: fetchSkills,
    enabled: useRealData && !selectedMatrix
  });

  const { 
    data: employees, 
    isLoading: isLoadingEmployees,
    error: employeesError 
  } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
    enabled: useRealData && !selectedMatrix
  });

  useEffect(() => {
    if (skillsError || employeesError || (employees && employees.length === 0)) {
      console.log("Falling back to mock data");
      setUseRealData(false);
      toast({
        title: "Using sample data",
        description: "We're showing sample data because there was an issue fetching real data",
      });
    }
  }, [skillsError, employeesError, employees]);

  const mockData = React.useMemo(() => {
    return getMockSkillMatrixData();
  }, []);

  const getCurrentSkillsData = () => {
    if (showingHistoricalData && selectedHistorySnapshot) {
      return selectedMatrix.skillsData;
    } else if (selectedMatrix && selectedMatrix.skillsData && Array.isArray(selectedMatrix.skillsData)) {
      return selectedMatrix.skillsData;
    } else if (useRealData && skills) {
      return skills.map(s => ({ id: s.id, name: s.name, target_level: s.target_level }));
    } else {
      return mockData.skills;
    }
  };
  
  const getCurrentEmployeesData = () => {
    if (showingHistoricalData && selectedHistorySnapshot && selectedHistorySnapshot.matrix_data && Array.isArray(selectedHistorySnapshot.matrix_data.employees)) {
      return selectedHistorySnapshot.matrix_data.employees;
    } else if (selectedMatrix && selectedMatrix.employeesData && Array.isArray(selectedMatrix.employeesData)) {
      return selectedMatrix.employeesData;
    } else if (useRealData && employees) {
      return employees;
    } else {
      return mockData.employees;
    }
  };


  const skillsData = getCurrentSkillsData();
  const employeesData = getCurrentEmployeesData();

  const isLoading = useRealData && (isLoadingSkills || isLoadingEmployees || isLoadingMatrices);

  const handleSkillValueChange = async (employeeId: string, skillId: string, newValue: number) => {
    if (!isEditing) {
      toast({
        title: "Edit mode required",
        description: "Enable edit mode to update skill levels",
        variant: "destructive",
      });
      return;
    }
    
    if (isComparing || showingHistoricalData) {
      toast({
        title: "Cannot edit in comparison mode",
        description: "Exit comparison or historical view to make changes",
        variant: "destructive",
      });
      return;
    }
    
    console.log(`Changing skill value: Employee ${employeeId}, Skill ${skillId}, New Value ${newValue}`);
    
    try {
      const success = await updateMatrixData(selectedMatrixId!, employeeId, skillId, newValue);
      
      if (success) {
        if (selectedMatrix) {
          const updatedMatrix = JSON.parse(JSON.stringify(selectedMatrix));
          
          const employeeIndex = updatedMatrix.employeesData.findIndex((emp: any) => emp.id === employeeId);
          
          if (employeeIndex !== -1) {
            if (!updatedMatrix.employeesData[employeeIndex].skills) {
              updatedMatrix.employeesData[employeeIndex].skills = {};
            }
            
            updatedMatrix.employeesData[employeeIndex].skills[skillId] = newValue;
            
            setSelectedMatrix(updatedMatrix);
            
            if (typeof window !== 'undefined' && window.mockMatrixDetails) {
              window.mockMatrixDetails[selectedMatrixId!] = updatedMatrix;
            }
          }
        }
        
        setHasUnsavedChanges(true);
        
        // Toast notification disabled
      } else {
        toast({
          title: "Update failed",
          description: "Failed to update skill level",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating skill:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating the skill level",
        variant: "destructive",
      });
    }
  };

  const handleSaveProgress = async () => {
    if (!selectedMatrixId || !selectedMatrix) return;
    
    setIsSaving(true);
    
    try {
      const employeeSkills: Record<string, Record<string, number>> = {};
      
      selectedMatrix.employeesData.forEach((emp: any) => {
        // Only use valid UUIDs as keys
        if (emp.id && typeof emp.id === "string" && emp.id.length > 0) {
          employeeSkills[emp.id] = emp.skills || {};
        } else {
          // Log a warning if the employee has a missing or invalid id
          console.warn("Skipping employee with missing or invalid id:", emp);
        }
      });
      
      await saveMatrixProgress(
        selectedMatrixId,
        employeeSkills,
        snapshotName || undefined
      );
      
      setHasUnsavedChanges(false);
      setSnapshotName("");
      
      const history = await fetchMatrixHistory(selectedMatrixId);
      setMatrixHistory(history);
      
      toast({
        title: "Progress saved",
        description: "Skill matrix progress has been saved successfully",
      });
    } catch (error) {
      console.error("Error saving matrix progress:", error);
      toast({
        title: "Save failed",
        description: "Failed to save skill matrix progress",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectSnapshot = (snapshot: any) => {
    setSelectedHistorySnapshot(snapshot);
    setShowingHistoricalData(true);
    setIsComparing(false);
    setComparisonData(null);
    
    if (isEditing) {
      setIsEditing(false);
    }
  };

  const handleReturnToCurrent = () => {
    setSelectedHistorySnapshot(null);
    setShowingHistoricalData(false);
    setIsComparing(false);
    setComparisonData(null);
  };

  const handleCompareSnapshots = async (snapshotId1: string, snapshotId2: string) => {
    try {
      setIsComparing(true);
      
      const comparison = await fetchSnapshotComparison(
        String(snapshotId1), 
        String(snapshotId2)
      );
      
      if (comparison) {
        setComparisonData(comparison);
        
        toast({
          title: "Comparison ready",
          description: "Comparing snapshots from different dates to visualize progress",
        });
      } else {
        toast({
          title: "Comparison failed",
          description: "Unable to compare the selected snapshots",
          variant: "destructive",
        });
        setIsComparing(false);
      }
    } catch (error) {
      console.error("Error comparing snapshots:", error);
      toast({
        title: "Comparison error",
        description: "An error occurred while comparing snapshots",
        variant: "destructive",
      });
      setIsComparing(false);
    }
  };

  const handleToggleMatrixActive = async (matrixId: string, currentActive: boolean) => {
    try {
      await updateMatrixActiveStatus(matrixId, !currentActive);
      
      await refetchMatrices();
      
      toast({
        title: currentActive ? "Matrix deactivated" : "Matrix activated",
        description: `The matrix has been ${currentActive ? "deactivated" : "activated"} successfully`,
      });
      
      if (selectedMatrixId === matrixId) {
        const updatedMatrix = await fetchSkillMatrixById(matrixId);
        setSelectedMatrix(updatedMatrix);
      }
    } catch (error) {
      console.error("Error toggling matrix active status:", error);
      toast({
        title: "Update failed",
        description: "Failed to update matrix status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSnapshot = async (snapshotId: string): Promise<boolean | void> => {
    try {
      if (!selectedMatrixId) return;
      
      const { error } = await supabase
        .from('matrix_progress_snapshots')
        .delete()
        .eq('id', snapshotId);
      
      if (error) {
        console.error('Error deleting snapshot:', error);
        toast({ title: "Chyba", description: "Vyskytla sa chyba pri mazaní snímky", variant: "destructive" });
        return false;
      }
      
      toast({ title: "Úspech", description: "Snímka bola úspešne vymazaná" });
      
      // Aktualizácia lokálnej histórie
      setMatrixHistory(prevHistory => prevHistory.filter(item => item.id !== snapshotId));
      
      // Ak bola vybraná práve táto snímka, zrušiť výber
      if (selectedHistorySnapshot && selectedHistorySnapshot.id === snapshotId) {
        setSelectedHistorySnapshot(null);
        setShowingHistoricalData(false);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting snapshot:', error);
      toast({ title: "Chyba", description: "Vyskytla sa chyba pri mazaní snímky", variant: "destructive" });
      return false;
    }
  };
  
  // Funkcia pre aktualizáciu histórie matice (napr. po úprave názvu snímky)
  const handleUpdateHistory = async () => {
    if (!selectedMatrixId) return;
    
    try {
      const history = await fetchMatrixHistory(selectedMatrixId);
      setMatrixHistory(history);
    } catch (error) {
      console.error("Error updating matrix history:", error);
      toast({ title: "Chyba", description: "Nepodarilo sa aktualizovať históriu matice", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (selectedMatrix && selectedMatrix.employeesData && Array.isArray(selectedMatrix.employeesData)) {
      setSelectedTeamMembers(selectedMatrix.employeesData.map(emp => ({
        id: emp.id,
        name: emp.name,
        role: emp.role || "Team Member",
        department: emp.department
      })));
    } else {
      setSelectedTeamMembers([]);
    }
  }, [selectedMatrixId, selectedMatrix]);

  useEffect(() => {
    const fetchAvailableMembers = async () => {
      if (isEditing && selectedMatrix) {
        try {
          const employeesData = await fetchPaginatedEmployees(0, 100, availableMemberSearchQuery);
          
          if (!employeesData || employeesData.length === 0) {
            console.error("No employees found or error fetching employees");
            toast({
              title: "Error",
              description: "Failed to load team members. Please try again.",
              variant: "destructive",
            });
            return;
          }
          
          console.log(`Fetched ${employeesData.length} employees from database`);
          
          const existingEmployeeIds = new Set(selectedTeamMembers.map(member => member.id));
          const availableEmployees = employeesData.filter(emp => !existingEmployeeIds.has(emp.id));
          
          const formattedEmployees = availableEmployees.map(emp => ({
            id: emp.id,
            name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || `Employee ${emp.id}`,
            employee_id: emp.employee_id,
            role: emp.position || "Team Member",
            department: emp.department_number || selectedMatrix.department,
            employer: emp.employer
          }));
          
          console.log(`Available team members after filtering: ${formattedEmployees.length}`);
          setAvailableTeamMembers(formattedEmployees);
        } catch (error) {
          console.error("Error fetching team members:", error);
          toast({
            title: "Error",
            description: "Failed to load team members. Please try again.",
            variant: "destructive",
          });
        }
      }
    };
    
    fetchAvailableMembers();
  }, [isEditing, selectedMatrix, selectedTeamMembers, availableMemberSearchQuery]);

  // In SkillMatrix.tsx, add this function
  const handleSkillTargetLevelUpdate = async (categoryIndex: number, skillIndex: number, newValue: number) => {
    if (!selectedMatrixId || !selectedMatrix || !Array.isArray(selectedMatrix.skillsData)) return;
    
    try {
      console.log(`Updating target level: Category=${categoryIndex}, SkillIndex=${skillIndex}, NewValue=${newValue}`);
      
      // Get all categories
      const categories = getCategoriesFromSkills(selectedMatrix.skillsData);
      
      if (!categories || categories.length <= categoryIndex) {
        console.error(`Category index ${categoryIndex} out of bounds`);
        return;
      }
      
      const category = categories[categoryIndex];
      
      // Get all skills for this specific category
      const categorySkills = selectedMatrix.skillsData.filter(skill => {
        let skillCategoryId;
        
        if (typeof skill.category === 'object' && skill.category !== null) {
          skillCategoryId = skill.category.id;
        } else {
          skillCategoryId = skill.category;
        }
        
        return skillCategoryId === category.id;
      });
      
      if (skillIndex < 0 || skillIndex >= categorySkills.length) {
        console.error(`Skill index ${skillIndex} out of bounds`);
        return;
      }
      
      // Get the skill to update
      const skillToUpdate = categorySkills[skillIndex];
      
      if (!skillToUpdate) {
        console.error(`Could not find skill at index ${skillIndex}`);
        return;
      }
      
      console.log(`Updating target level for skill: ${skillToUpdate.name} (${skillToUpdate.id})`);
      
      // Update the skill in the backend
      // We need to pass the current name as well as the new target level
      const success = await updateMatrixSkill(
        selectedMatrixId, 
        skillToUpdate.id, 
        skillToUpdate.name, // Keep the existing name
        newValue // New target level
      );
      
      if (success) {
        // Update the local state
        const updatedMatrix = JSON.parse(JSON.stringify(selectedMatrix));
        const skillToUpdateInState = updatedMatrix.skillsData.find(s => s.id === skillToUpdate.id);
        
        if (skillToUpdateInState) {
          skillToUpdateInState.target_level = newValue;
        }
        
        setSelectedMatrix(updatedMatrix);
        
        toast({
          title: "Target level updated",
          description: `Target level for "${skillToUpdate.name}" has been updated to ${newValue}`
        });
      }
    } catch (error) {
      console.error("Error updating skill target level:", error);
      toast({
        title: "Error",
        description: "Failed to update skill target level",
        variant: "destructive"
      });
    }
  };

  const handleSkillRename = async (categoryIndex: number, skillIndex: number, newName: string, skillId?: string) => {
    if (!selectedMatrixId || !selectedMatrix || !Array.isArray(selectedMatrix.skillsData)) return;
    
    try {
      console.log(`SkillMatrix: Renaming skill at category ${categoryIndex}, index ${skillIndex}, ID=${skillId || 'undefined'} to '${newName}'`);
      
      const categories = getCategoriesFromSkills(selectedMatrix.skillsData);
      
      if (categories.length <= categoryIndex) {
        console.error(`Category index ${categoryIndex} out of bounds`);
        return;
      }
      
      const category = categories[categoryIndex];
      console.log(`Found category: ${category.name} (${category.id})`);
      
      // Použijeme skillId, ak existuje, inak hľadáme skill podľa indexu
      let skillToUpdate;
      let skillIdToUse = skillId;
      
      if (!skillIdToUse) {
        // Ak nemáme ID, musíme nájsť skill podľa indexu v kategórii
        const categorySkills = selectedMatrix.skillsData.filter(skill => {
          let skillCategoryId = typeof skill.category === 'object' && skill.category !== null 
            ? skill.category.id 
            : skill.category;
          return skillCategoryId === category.id;
        });
        
        if (skillIndex < 0 || skillIndex >= categorySkills.length) {
          console.error(`Skill index ${skillIndex} out of bounds, category has ${categorySkills.length} skills`);
          return;
        }
        
        skillToUpdate = categorySkills[skillIndex];
        
        if (!skillToUpdate) {
          console.error(`Could not find skill at index ${skillIndex}`);
          return;
        }
        
        skillIdToUse = skillToUpdate.id;
        console.log(`Found skill by index: ${skillToUpdate.name} (${skillIdToUse})`);
      } else {
        // Ak máme ID, použijeme ho priamo
        skillToUpdate = selectedMatrix.skillsData.find((s: any) => s.id === skillIdToUse);
        console.log(`Found skill by ID: ${skillToUpdate ? skillToUpdate.name : 'not found'} (${skillIdToUse})`);
      }
      
      // Ak nemáme ID skilu, nemôžeme aktualizovať databázu, ale môžeme aktualizovať lokálny stav
      if (!skillIdToUse) {
        console.error('Cannot update skill in database - missing skill ID');
        
        // Napriek tomu aktualizujeme UI, aby používateľ videl zmenu
        const updatedMatrix = JSON.parse(JSON.stringify(selectedMatrix));
        const categorySkills = updatedMatrix.skillsData.filter((s: any) => s.category === category.id);
        
        if (skillIndex < categorySkills.length) {
          categorySkills[skillIndex].name = newName;
          setSelectedMatrix(updatedMatrix);
          
          toast({
            title: "Skill renamed locally",
            description: `Skill has been renamed to "${newName}" (local only, not saved to database)`
          });
        }
        
        return;
      }
      
      console.log(`Updating database: Matrix=${selectedMatrixId}, Skill=${skillIdToUse}, NewName=${newName}`);
      const success = await updateMatrixSkill(selectedMatrixId, skillIdToUse, newName);
      
      if (success) {
        const updatedMatrix = JSON.parse(JSON.stringify(selectedMatrix));
        const skillToUpdate = updatedMatrix.skillsData.find((s: any) => s.id === skillIdToUse);
        
        if (skillToUpdate) {
          skillToUpdate.name = newName;
          setSelectedMatrix(updatedMatrix);
        }
        
        toast({
          title: "Skill renamed",
          description: `Skill has been renamed to "${newName}"`
        });
      }
    } catch (error) {
      console.error("Error renaming skill:", error);
      toast({
        title: "Error",
        description: "Failed to rename skill",
        variant: "destructive"
      });
    }
  };

  const handleCategoryRename = async (categoryIndex: number, newName: string) => {
    if (!selectedMatrixId || !selectedMatrix || !Array.isArray(selectedMatrix.skillsData)) return;
    
    try {
      const categories = getCategoriesFromSkills(selectedMatrix.skillsData);
      
      if (categories.length <= categoryIndex) return;
      
      const category = categories[categoryIndex];
      
      const success = await updateMatrixCategory(selectedMatrixId, String(category.id), newName);
      
      if (success) {
        const updatedMatrix = JSON.parse(JSON.stringify(selectedMatrix));
        updatedMatrix.skillsData.forEach((skill: any) => {
          if (skill.category === category.id) {
            skill.category = newName;
          }
        });
        
        setSelectedMatrix(updatedMatrix);
        
        toast({
          title: "Category renamed",
          description: `Category has been renamed to "${newName}"`
        });
      }
    } catch (error) {
      console.error("Error renaming category:", error);
      toast({
        title: "Error",
        description: "Failed to rename category",
        variant: "destructive"
      });
    }
  };

  const handleAddSkill = async (categoryIndex: number, skillName: string, targetLevel: number) => {
    if (!selectedMatrixId || !selectedMatrix || !Array.isArray(selectedMatrix.skillsData)) return;
    
    try {
      console.log("Adding skill correctly:", {
        categoryIndex,
        skillName,
        targetLevel
      });
      
      const categories = getCategoriesFromSkills(selectedMatrix.skillsData);
      
      if (categories.length <= categoryIndex) return;
      
      const category = categories[categoryIndex];
  
      // Make sure we're creating the new skill with the correct property order
      const newSkill = {
        name: String(skillName), // Ensure the skill name is a string
        target_level: Number(targetLevel) // Ensure the target level is a number
      };
  
      console.log("New skill object:", newSkill);
  
      // Add skill to the matrix and get the new skill ID
      const newSkillId = await addMatrixSkill(selectedMatrixId, String(category.id), newSkill);
  
      if (newSkillId) {
        const updatedMatrix = JSON.parse(JSON.stringify(selectedMatrix));
        
        // Add the new skill to the matrix with the correct properties
        updatedMatrix.skillsData.push({
          id: newSkillId,
          name: String(skillName),
          category: category.id,
          target_level: Number(targetLevel)
        });
        
        setSelectedMatrix(updatedMatrix);
        
        toast({
          title: "Skill added",
          description: `New skill "${skillName}" has been added to category "${category.name}"`
        });
      }
    } catch (error) {
      console.error("Error adding skill:", error);
      toast({
        title: "Error",
        description: "Failed to add skill",
        variant: "destructive"
      });
    }
  };

  const handleRemoveSkill = async (categoryIndex: number, skillIndex: number) => {
    if (!selectedMatrixId || !selectedMatrix || !Array.isArray(selectedMatrix.skillsData)) return;
    
    try {
      console.log(`REMOVE SKILL: Category=${categoryIndex}, SkillIndex=${skillIndex}`);
      
      // Get all categories
      const categories = getCategoriesFromSkills(selectedMatrix.skillsData);
      
      if (!categories || categories.length <= categoryIndex) {
        console.error(`Category index ${categoryIndex} out of bounds (categories: ${categories?.length})`);
        return;
      }
      
      const category = categories[categoryIndex];
      console.log(`Category: ${category.name}`);
      
      // Get all skills ONLY for this specific category
      const categorySkills = selectedMatrix.skillsData.filter(skill => {
        let skillCategoryId;
        
        if (typeof skill.category === 'object' && skill.category !== null) {
          skillCategoryId = skill.category.id;
        } else {
          skillCategoryId = skill.category;
        }
        
        const isMatch = skillCategoryId === category.id;
        return isMatch;
      });
      
      console.log(`Category has ${categorySkills.length} skills`);
      
      // Make sure the skill index is valid
      if (skillIndex < 0 || skillIndex >= categorySkills.length) {
        console.error(`Skill index ${skillIndex} out of bounds (skills: ${categorySkills.length})`);
        return;
      }
      
      // Get the skill to delete
      const skillToDelete = categorySkills[skillIndex];
      
      if (!skillToDelete) {
        console.error(`Could not find skill at index ${skillIndex}`);
        return;
      }
      
      console.log(`Will delete skill: ${skillToDelete.name} (${skillToDelete.id})`);
      
      const success = await removeMatrixSkill(selectedMatrixId, skillToDelete.id);
      
      if (success) {
        // Update the local state
        const updatedMatrix = JSON.parse(JSON.stringify(selectedMatrix));
        updatedMatrix.skillsData = updatedMatrix.skillsData.filter(s => s.id !== skillToDelete.id);
        
        setSelectedMatrix(updatedMatrix);
        
        toast({
          title: "Skill removed",
          description: `Skill "${skillToDelete.name}" has been removed`
        });
      }
    } catch (error) {
      console.error("Error removing skill:", error);
      toast({
        title: "Error",
        description: "Failed to remove skill",
        variant: "destructive"
      });
    }
  };

  const handleAddCategory = async (categoryName: string) => {
    if (!selectedMatrixId || !selectedMatrix) return;
    
    try {
      const newCategoryId = await addMatrixCategory(selectedMatrixId, categoryName);
      
      if (newCategoryId) {
        const updatedMatrix = JSON.parse(JSON.stringify(selectedMatrix));
        if (!updatedMatrix.skillsData) {
          updatedMatrix.skillsData = [];
        }
        
        setSelectedMatrix(updatedMatrix);
        setNewCategoryName("");
        setShowAddCategoryDialog(false);
        
        toast({
          title: "Category added",
          description: `New category "${categoryName}" has been added`
        });
      }
    } catch (error) {
      console.error("Error adding category:", error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive"
      });
    }
  };

  const handleRemoveCategory = async (categoryIndex: number) => {
    if (!selectedMatrixId || !selectedMatrix || !Array.isArray(selectedMatrix.skillsData)) return;
    
    try {
      const categories = getCategoriesFromSkills(selectedMatrix.skillsData);
      
      if (categories.length <= categoryIndex) return;
      
      const category = categories[categoryIndex];
      
      const success = await removeMatrixCategory(selectedMatrixId, String(category.id));
      
      if (success) {
        const updatedMatrix = JSON.parse(JSON.stringify(selectedMatrix));
        updatedMatrix.skillsData = updatedMatrix.skillsData.filter((s: any) => s.category !== category.id);
        
        setSelectedMatrix(updatedMatrix);
        
        toast({
          title: "Category removed",
          description: `Category "${category.name}" has been removed`
        });
      }
    } catch (error) {
      console.error("Error removing category:", error);
      toast({
        title: "Error",
        description: "Failed to remove category",
        variant: "destructive"
      });
    }
  };

  const handleAddTeamMember = async (member: TeamMember) => {
    if (!selectedMatrixId || !selectedMatrix) return;
    
    try {
      if (selectedTeamMembers.some(m => m.id === member.id)) {
        toast({
          title: "Member already exists",
          description: `${member.name} is already in the team`
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('skill_matrices')
        .select('members_data')
        .eq('id', selectedMatrixId)
        .single();
      
      if (error) {
        throw error;
      }
      
      const membersData = data.members_data ? 
        (Array.isArray(data.members_data) ? data.members_data : []) : [];
      
      const newMemberData = {
        id: member.id,
        name: member.name,
        role: member.role || "Team Member",
        department: member.department || selectedMatrix.department,
        skills: {}
      };
      
      if (selectedMatrix.skillsData && Array.isArray(selectedMatrix.skillsData)) {
        selectedMatrix.skillsData.forEach(skill => {
          newMemberData.skills[skill.id] = 0;
        });
      }
      
      const updatedMembersData = [...membersData, newMemberData];
      
      const { error: updateError } = await supabase
        .from('skill_matrices')
        .update({ members_data: updatedMembersData })
        .eq('id', selectedMatrixId);
      
      if (updateError) {
        throw updateError;
      }
      
      const updatedMatrix = JSON.parse(JSON.stringify(selectedMatrix));
      if (!updatedMatrix.employeesData) {
        updatedMatrix.employeesData = [];
      }
      updatedMatrix.employeesData.push(newMemberData);
      
      if (!updatedMatrix.members_data) {
        updatedMatrix.members_data = [];
      }
      updatedMatrix.members_data.push(newMemberData);
      
      setSelectedMatrix(updatedMatrix);
      setSelectedTeamMembers([...selectedTeamMembers, member]);
      
      toast({
        title: "Team member added",
        description: `${member.name} has been added to the team`
      });
    } catch (error) {
      console.error("Error adding team member:", error);
      toast({
        title: "Error",
        description: "Failed to add team member",
        variant: "destructive"
      });
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    if (!selectedMatrixId || !selectedMatrix) return;
    
    try {
      const { data, error } = await supabase
        .from('skill_matrices')
        .select('members_data')
        .eq('id', selectedMatrixId)
        .single();
      
      if (error) {
        throw error;
      }
      
      const membersData = data.members_data ? 
        (Array.isArray(data.members_data) ? data.members_data : []) : [];
      
      const updatedMembersData = Array.isArray(membersData) 
        ? membersData.filter((member: any) => member.id !== memberId) 
        : [];
      
      const { error: updateError } = await supabase
        .from('skill_matrices')
        .update({ members_data: updatedMembersData })
        .eq('id', selectedMatrixId);
      
      if (updateError) {
        throw updateError;
      }
      
      const updatedMatrix = JSON.parse(JSON.stringify(selectedMatrix));
      if (updatedMatrix.employeesData) {
        updatedMatrix.employeesData = updatedMatrix.employeesData.filter((emp: any) => emp.id !== memberId);
      }
      
      if (updatedMatrix.members_data) {
        updatedMatrix.members_data = updatedMatrix.members_data.filter((member: any) => member.id !== memberId);
      }
      
      setSelectedMatrix(updatedMatrix);
      setSelectedTeamMembers(selectedTeamMembers.filter(member => member.id !== memberId));
      
      toast({
        title: "Team member removed",
        description: "Team member has been removed from the team"
      });
    } catch (error) {
      console.error("Error removing team member:", error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive"
      });
    }
  };

  const debugSkillsData = () => {
    if (!selectedMatrix || !Array.isArray(selectedMatrix.skillsData)) {
      console.log("No skills data available");
      return;
    }
    
    console.log("All skills:", selectedMatrix.skillsData.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category
    })));
    
    const categories = getCategoriesFromSkills(selectedMatrix.skillsData);
    console.log("Categories:", categories);
    
    categories.forEach((category, catIndex) => {
      const categorySkills = selectedMatrix.skillsData.filter(skill => {
        const skillCategoryId = typeof skill.category === 'object' ? 
          (skill.category?.id || skill.category) : skill.category;
        return skillCategoryId === category.id;
      });
      
      console.log(`Category ${catIndex}: ${category.name} (ID: ${category.id})`);
      console.log(`Skills in this category:`, categorySkills.map((s, idx) => ({
        index: idx,
        id: s.id,
        name: s.name
      })));
    });
  };

  const getCategoriesFromSkills = (skills: SkillData[]) => {
    const categoryMap = new Map<string, { id: string, name: string }>();
  
    if (Array.isArray(skills)) {
      skills.forEach(skill => {
        // Always check if skill.category exists before accessing it
        if (skill && skill.category !== undefined && skill.category !== null) {
          // Handle different category formats consistently
          let categoryId, categoryName;
  
          if (typeof skill.category === 'object' && skill.category !== null) {
            // If category is an object with id and name
            categoryId = skill.category.id || '';
            categoryName = skill.category.name || categoryId;
          } else {
            // If category is just a string ID
            categoryId = String(skill.category);
            categoryName = String(skill.category);
          }
  
          if (categoryId && !categoryMap.has(categoryId)) {
            categoryMap.set(categoryId, {
              id: categoryId,
              name: categoryName
            });
          }
        }
      });
    }
    
    return Array.from(categoryMap.values());
  };

  // Calculate average skill level across all employees for a specific skill
  const calculateAverageSkillLevel = (skillId: string): number => {
    if (!selectedMatrix || !Array.isArray(selectedMatrix.employeesData) || selectedMatrix.employeesData.length === 0) {
      return 0;
    }
    
    let totalValue = 0;
    let count = 0;
    
    selectedMatrix.employeesData.forEach(employee => {
      // Skills are stored as a Record/object with skill IDs as keys
      if (employee.skills && typeof employee.skills === 'object') {
        const skillValue = employee.skills[skillId];
        if (skillValue !== undefined) {
          const numValue = Number(skillValue);
          // Only include employees with skill level greater than 0
          if (!isNaN(numValue) && numValue > 0) {
            totalValue += numValue;
            count++;
          }
        }
      }
    });
    
    console.log(`Average for skill ${skillId}: ${totalValue}/${count} = ${count > 0 ? totalValue/count : 0}`);
    return count > 0 ? Math.round((totalValue / count) * 10) / 10 : 0; // Round to 1 decimal place
  };
  
  // Check if an average skill level meets the target level
  const meetsCriteria = (average: number, target: number): boolean => {
    return average >= target;
  };

  const getSkillsByCategory = () => {
    if (!selectedMatrix || !selectedMatrix.skillsData || !Array.isArray(selectedMatrix.skillsData)) {
      return [];
    }
    
    const skills = selectedMatrix.skillsData;
    const categories = getCategoriesFromSkills(skills);
    
    return categories.map(category => {
      const categorySkills = Array.isArray(skills) ? 
        skills.filter(skill => skill.category === category.id)
          .map(skill => ({
            name: skill.name,
            targetLevel: skill.target_level
          })) : [];
      
      return {
        name: category.name,
        skills: categorySkills
      };
    });
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Komplexné hodnotenie zručností</h1>
            <p className="text-muted-foreground mt-1">
              Vyhodnocujte, sledujte a analyzujte úroveň zručností vo vašich tímoch
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link to="/matrix-generator" className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Vytvoriť maticu
              </Link>
            </Button>
            <Button asChild>
              <Link to="/matrix-generator" className="flex items-center">
                <Wand2 className="mr-2 h-4 w-4" />
                Generátor s podporou AI
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <SkillLevelLegend />
            
            {!isLoadingMatrices && departments.length > 0 && (
              <Card className="mt-6">
                <CardContent className="p-4">
                  <DepartmentFilter 
                    departments={departments}
                    selectedDepartment={selectedDepartment}
                    onSelectDepartment={setSelectedDepartment}
                  />
                  
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <Label htmlFor="show-inactive" className="cursor-pointer">
                      Zobraziť neaktívne matice
                    </Label>
                    <Switch 
                      id="show-inactive" 
                      checked={showInactive}
                      onCheckedChange={setShowInactive}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            
            {filteredMatrices && filteredMatrices.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium">Dostupné matice</h3>
                
                {filteredMatrices.map((matrix) => (
                  <Card 
                    key={matrix.id} 
                    className={`cursor-pointer transition-colors hover:bg-accent/50 ${selectedMatrixId === matrix.id ? 'border-primary' : ''}`}
                    onClick={() => setSelectedMatrixId(matrix.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{matrix.name}</h4>
                          {matrix.active === false && (
                            <Badge variant="outline" className="border-destructive text-destructive">Inactive</Badge>
                          )}
                        </div>
                      </div>
                      
                      {isEditing && selectedMatrixId === matrix.id && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Stav matice</Label>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleMatrixActive(matrix.id, matrix.active !== false);
                              }}
                            >
                              {matrix.active === false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              {matrix.active === false ? "Aktivovať" : "Deaktivovať"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-80 w-full" />
              </div>
            ) : (
              <>
                {selectedMatrix ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold">{selectedMatrix.name}</h2>
                          {selectedMatrix.active === false && (
                            <Badge variant="outline" className="border-destructive text-destructive">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">
                          {selectedMatrix.department} · {Array.isArray(selectedMatrix.employeesData) ? selectedMatrix.employeesData.length : 0} členov tímu
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {showingHistoricalData ? (
                          <Button variant="outline" onClick={handleReturnToCurrent}>
                            Návrat na aktuálne dáta
                          </Button>
                        ) : (
                          <>
                            <Switch checked={isEditing} onCheckedChange={setIsEditing} id="edit-mode" />
                            <Label htmlFor="edit-mode">Režim úprav</Label>
                            
                            {hasUnsavedChanges && (
                              <Button 
                                onClick={() => {
                                  setIsSaving(true);
                                  handleSaveProgress();
                                }} 
                                disabled={isSaving}
                              >
                                {isSaving ? "Saving..." : "Save"}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {isEditing && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Správa matice</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {hasUnsavedChanges && (
                            <div className="flex items-end gap-4">
                              <div className="flex-1">
                                <Label htmlFor="snapshot-name">Uložiť snímku s názvom (voliteľné)</Label>
                                <Input 
                                  id="snapshot-name"
                                  placeholder="napr. Štvrťročné hodnotenie Q2 2024"
                                  value={snapshotName}
                                  onChange={(e) => setSnapshotName(e.target.value)}
                                />
                              </div>
                              <Button 
                                onClick={handleSaveProgress} 
                                disabled={isSaving}
                              >
                                {isSaving ? "Ukladám..." : "Uložiť"}
                              </Button>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Dialog open={showTeamMemberDialog} onOpenChange={setShowTeamMemberDialog}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" className="w-full">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Spravovať členov tímu
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Členovia tímu</DialogTitle>
                                    <DialogDescription>
                                      Pridajte alebo odstráňte členov tímu z tejto matice zručností.
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="space-y-4 pt-4">
                                    <div className="relative">
                                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        className="pl-8"
                                        placeholder="Hľadať členov tímu..."
                                        type="search"
                                        value={availableMemberSearchQuery}
                                        onChange={(e) => setAvailableMemberSearchQuery(e.target.value)}
                                      />
                                    </div>
                                    
                                    <div className="border rounded-md">
                                      <div className="p-2 bg-muted/50 border-b">
                                        <h3 className="text-sm font-medium">Dostupní členovia tímu</h3>
                                      </div>
                                      <div className="p-1 max-h-[200px] overflow-y-auto">
                                        {availableTeamMembers.length > 0 ? (
                                          <div className="space-y-1">
                                            {availableTeamMembers
                                              .filter(member => 
                                                availableMemberSearchQuery === "" || 
                                                member.name.toLowerCase().includes(availableMemberSearchQuery.toLowerCase()) ||
                                                (member.role && member.role.toLowerCase().includes(availableMemberSearchQuery.toLowerCase()))
                                              )
                                              .map((member) => (
                                              <div 
                                                key={member.id}
                                                className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md"
                                              >
                                                <div>
                                                  <p className="font-medium text-sm">{member.name}</p>
                                                  <p className="text-xs text-muted-foreground">{member.role || "Team Member"}</p>
                                                </div>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-7 text-xs"
                                                  onClick={() => handleAddTeamMember(member)}
                                                >
                                                  Add
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="p-4 text-center text-muted-foreground text-sm">
                                            Nenašli sa žiadni dostupní členovia tímu.
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="relative mt-4">
                                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        className="pl-8"
                                        placeholder="Hľadať aktuálnych členov..."
                                        type="search"
                                        value={teamMemberSearchQuery}
                                        onChange={(e) => setTeamMemberSearchQuery(e.target.value)}
                                      />
                                    </div>
                                    
                                    <div className="border rounded-md mt-2">
                                      <div className="p-2 bg-muted/50 border-b">
                                        <h3 className="text-sm font-medium">Aktuálni členovia tímu</h3>
                                      </div>
                                      <div className="p-1 max-h-[200px] overflow-y-auto">
                                        {selectedTeamMembers.length > 0 ? (
                                          <div className="space-y-1">
                                            {selectedTeamMembers
                                              .filter(member => 
                                                teamMemberSearchQuery === "" || 
                                                member.name.toLowerCase().includes(teamMemberSearchQuery.toLowerCase()) ||
                                                (member.role && member.role.toLowerCase().includes(teamMemberSearchQuery.toLowerCase()))
                                              )
                                              .map((member) => (
                                              <div 
                                                key={member.id}
                                                className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md"
                                              >
                                                <div>
                                                  <p className="font-medium text-sm">{member.name}</p>
                                                  <p className="text-xs text-muted-foreground">{member.role || "Team Member"}</p>
                                                </div>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                                  onClick={() => handleRemoveTeamMember(member.id)}
                                                >
                                                  Remove
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="p-4 text-center text-muted-foreground text-sm">
                                            Zatiaľ neboli pridaní žiadni členovia tímu.
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <DialogFooter className="mt-4">
                                    <Button 
                                      variant="outline" 
                                      onClick={() => setShowTeamMemberDialog(false)}
                                    >
                                      Close
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                            
                            
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {!isComparing && (
                      <Tabs defaultValue="matrix">
                        <TabsList>
                          <TabsTrigger value="matrix">Matica zručností</TabsTrigger>
                          <TabsTrigger value="history">
                            <History className="mr-2 h-4 w-4" />
                            História
                          </TabsTrigger>
                          <TabsTrigger value="progress">Vývoj výkonnosti</TabsTrigger>
                          <TabsTrigger value="employees">
                            <Users className="mr-2 h-4 w-4" />
                            Zamestnanci
                          </TabsTrigger>
                          {isEditing && (
                            <>
                              <TabsTrigger value="categories">
                                <FileText className="mr-2 h-4 w-4" />
                                Spravovať kategórie
                              </TabsTrigger>
                              <TabsTrigger value="members">
                                <Users className="mr-2 h-4 w-4" />
                                Spravovať členov tímu
                              </TabsTrigger>
                            </>
                          )}
                        </TabsList>
                        
                        <TabsContent value="matrix" className="p-1">
                          {Array.isArray(skillsData) && skillsData.length > 0 && Array.isArray(employeesData) && employeesData.length > 0 ? (
                            <SkillMatrixTable
                              skills={skillsData}
                              employees={employeesData}
                              onSkillValueChange={handleSkillValueChange}
                              readOnly={!isEditing || showingHistoricalData}
                              isComparing={isComparing}
                              comparisonData={comparisonData}
                              // Add these props for displaying team skill averages
                              getSkillAverage={(skillId) => calculateAverageSkillLevel(skillId)}
                              meetsCriteria={(average, target) => meetsCriteria(average, target)}
                            />
                          ) : (
                            <div className="border rounded-md p-8 text-center">
                              <p className="text-muted-foreground">Pre túto maticu nie sú dostupné žiadne údaje o zručnostiach.</p>
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="history">
                          <MatrixProgressHistory
                            history={matrixHistory}
                            onSelectSnapshot={handleSelectSnapshot}
                            onCompareSnapshots={handleCompareSnapshots}
                            selectedSnapshot={selectedHistorySnapshot}
                            onDeleteSnapshot={handleDeleteSnapshot}
                            onUpdateHistory={handleUpdateHistory}
                          />
                        </TabsContent>
                        
                        <TabsContent value="progress">
                          {selectedMatrix && Array.isArray(selectedMatrix.employeesData) && selectedMatrix.employeesData.length > 0 && Array.isArray(selectedMatrix.skillsData) && selectedMatrix.skillsData.length > 0 ? (
                            <SkillProgressCharts
                              snapshotData={matrixHistory}
                              chartType="team"
                              employees={selectedMatrix.employeesData}
                              skills={selectedMatrix.skillsData}
                            />
                          ) : (
                            <div className="border rounded-md p-8 text-center">
                              <p className="text-muted-foreground">Nie sú dostupné dáta o výkonnosti.</p>
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="employees">
                          <EmployeeList />
                        </TabsContent>
                        
                        <TabsContent value="categories"> 
                          {isEditing && selectedMatrix && (
                            <div className="space-y-6">
                              <div className="bg-muted/50 p-4 rounded-md">
                                <h3 className="font-medium mb-2">Kategórie zručností</h3>
                                <p className="text-sm text-muted-foreground">
                                  Spravujte kategórie zručností a ich zručnosti. Môžete premenovať, pridať alebo odstrániť zručnosti a kategórie.
                                </p>
                              </div>
                              
                              {getSkillsByCategory().map((category, index) => (
                              <MatrixCategorySection
                              key={index}
                              category={category}
                              categoryIndex={index}
                              onCategoryRename={(newName) => handleCategoryRename(index, newName)}
                              onSkillRename={(categoryIndex, skillIndex, newName, skillId) => handleSkillRename(categoryIndex, skillIndex, newName, skillId)}
                              onAddSkill={(categoryIndex, skillName, targetLevel) => handleAddSkill(categoryIndex, skillName, targetLevel)}
                              onRemoveSkill={(categoryIdx, skillIdx) => handleRemoveSkill(categoryIdx, skillIdx)}
                              onRemoveCategory={() => handleRemoveCategory(index)}
                              // Add this line to pass the onSkillUpdate function
                              onSkillUpdate={(categoryIdx, skillIdx, newValue) => handleSkillTargetLevelUpdate(categoryIdx, skillIdx, newValue)}
                              // Add these props for skill averages
                              getSkillAverage={(skillId) => calculateAverageSkillLevel(skillId)}
                              meetsCriteria={(average, target) => meetsCriteria(average, target)} 
                              editMode={true}
                            />
                              ))}
                              
                              <Button 
                                variant="outline" 
                                className="w-full mt-4"
                                onClick={() => setShowAddCategoryDialog(true)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Pridať novú kategóriu
                              </Button>
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="members">
                          {isEditing && selectedMatrix && (
                            <div className="space-y-6">
                              <div className="bg-muted/50 p-4 rounded-md">
                                <h3 className="font-medium mb-2">Členovia tímu</h3>
                                <p className="text-sm text-muted-foreground">
                                  Spravujte členov tímu pre túto maticu zručností. Pridávajte alebo odstraňujte členov podľa potreby.
                                </p>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">Aktuálni členovia tímu</h3>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setShowTeamMemberDialog(true)}
                                >
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Pridať člena
                                </Button>
                              </div>
                              
                              {selectedTeamMembers.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {selectedTeamMembers.map((member) => (
                                    <Card key={member.id} className="hover:bg-accent/50 transition-colors">
                                      <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                          <h4 className="font-medium">{member.name}</h4>
                                          <p className="text-sm text-muted-foreground">{member.role || "Team Member"}</p>
                                        </div>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                          onClick={() => handleRemoveTeamMember(member.id)}
                                        >
                                          Remove
                                        </Button>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-12 border rounded-md">
                                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                  <h3 className="text-lg font-medium mb-2">Žiadni členovia tímu</h3>
                                  <p className="text-muted-foreground mb-4">
                                    Pridajte členov tímu, aby ste mohli začať sledovať ich zručnosti.
                                  </p>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setShowTeamMemberDialog(true)}
                                  >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Pridať členov tímu
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    )}
                    
                    {isComparing && comparisonData && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Porovnanie snímok</h3>
                          <Button variant="outline" onClick={() => {
                            setIsComparing(false);
                            setComparisonData(null);
                          }}>
                            Ukončiť porovnávanie
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-md">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Od</p>
                            <p className="font-medium">
                              {comparisonData.snapshot1 && comparisonData.snapshot1.created_at 
                                ? new Date(comparisonData.snapshot1.created_at).toLocaleDateString()
                                : "Unknown Date"}
                            </p>
                          </div>
                          
                          <GitCompareIcon className="h-5 w-5 text-muted-foreground" />
                          
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Do</p>
                            <p className="font-medium">
                              {comparisonData.snapshot2 && comparisonData.snapshot2.created_at
                                ? new Date(comparisonData.snapshot2.created_at).toLocaleDateString()
                                : "Unknown Date"}
                            </p>
                          </div>
                        </div>
                        
                        {Array.isArray(skillsData) && skillsData.length > 0 && Array.isArray(employeesData) && employeesData.length > 0 ? (
                          <SkillMatrixTable
                            skills={skillsData}
                            employees={employeesData}
                            onSkillValueChange={() => {}}
                            readOnly={true}
                            isComparing={true}
                            comparisonData={comparisonData}
                          />
                        ) : (
                          <div className="border rounded-md p-8 text-center">
                            <p className="text-muted-foreground">Nie sú dostupné dáta na porovnanie.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border rounded-md p-8 text-center">
                    <h2 className="text-xl font-semibold mb-4">Nie je vybraná žiadna matica</h2>
                    <p className="text-muted-foreground mb-6">Vyberte existujúcu maticu z ponuky alebo vytvorte novú.</p>
                    <Button asChild>
                      <Link to="/matrix-generator">
                        <Wand2 className="mr-2 h-4 w-4" />
                        Vytvoriť novú maticu
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SkillMatrix;
