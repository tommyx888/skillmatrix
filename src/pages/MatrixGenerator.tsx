import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Wand2, Save, PlusCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateSkillMatrix, saveSkillMatrix } from "@/services/matrixGeneratorService";
import { fetchEmployees } from "@/services/skillMatrixService";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import MatrixCategorySection from "@/components/matrix-generator/MatrixCategorySection";
import TeamMemberSelector from "@/components/matrix-generator/TeamMemberSelector";
import ManualSkillCreator from "@/components/matrix-generator/ManualSkillCreator";
import EmployeeSkillAssessment from "@/components/matrix-generator/EmployeeSkillAssessment";
import { NewSkillCategory, TeamMember } from "@/types/skills";
import { useAuth } from '@/contexts/AuthContext';
const steps = [
  "Business Areas",
  "Skills Matrix",
  "Team Assessment",
  "Employee Skills",
  "Complete"
];

const departments = [
  { id: "ci", name: "CI" },
  { id: "engineering", name: "Engineering" },
  { id: "finance", name: "Finance" },
  { id: "hr", name: "HR" },
  { id: "it", name: "IT" },
  { id: "logistics", name: "Logistics" },
  { id: "maintenance", name: "Maintenance" },
  { id: "management", name: "Management" },
  { id: "production", name: "Production" },
  { id: "quality", name: "Quality" },
];

const MatrixGenerator = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [generatedMatrix, setGeneratedMatrix] = useState<any>(null);
  const [skillCategories, setSkillCategories] = useState<any[]>([]);
  const [matrixName, setMatrixName] = useState("");
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<TeamMember[]>([]);
  const [creationMode, setCreationMode] = useState<"ai" | "manual">("ai");
  const [manualCategories, setManualCategories] = useState<NewSkillCategory[]>([]);
  const [employeeSkills, setEmployeeSkills] = useState<Record<string, Record<string, number>>>({});
  // Pridanie stavu matrixId pre sledovanie ID matice, ktorú aktuálne upravujeme (potrebné pre DB operácie)
  const [matrixId, setMatrixId] = useState<string>("");
  // Inside your component
  const { userRole } = useAuth();

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
    enabled: currentStep === 2,
  });
  
  const availableTeamMembers: TeamMember[] = React.useMemo(() => {
    if (!employees) return [];
    return employees.map((employee) => ({
      id: employee.id,
      name: employee.name,
      employee_id: employee.employee_id || '',
      hire_date: employee.hire_date || '',
      employer: employee.employer || department,
      role: employee.role || "Team Member",
      department: employee.department || department
    }));
  }, [employees, department]);
  
  const handleSelectDepartment = (selectedDepartment: string) => {
    setDepartment(selectedDepartment);
  };
  
  const handleNextStep = () => {
    if (currentStep === 0) {
      if (!department) {
        toast({
          title: "Department required",
          description: "Please select a department from the dropdown",
          variant: "destructive",
        });
        return;
      }
      
      if (!matrixName.trim()) {
        toast({
          title: "Matrix name required",
          description: "Please provide a name for your skill matrix",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (currentStep === 1) {
      if (creationMode === "ai" && !generatedMatrix) {
        toast({
          title: "Matrix required",
          description: "Please generate a skill matrix or switch to manual creation",
          variant: "destructive",
        });
        return;
      }
      
      if (creationMode === "manual" && manualCategories.length === 0) {
        toast({
          title: "Skills required",
          description: "Please add at least one skill category with skills",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (currentStep === 2 && selectedTeamMembers.length === 0) {
      toast({
        title: "Team members required",
        description: "Please select at least one team member",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep === 2) {
      const newEmployeeSkills: Record<string, Record<string, number>> = {};
      
      selectedTeamMembers.forEach(member => {
        newEmployeeSkills[member.id] = {};
        
        const skills = creationMode === "ai" 
          ? skillCategories.flatMap(category => category.skills)
          : manualCategories.flatMap(category => 
              category.skills.map(skill => ({
                ...skill,
                id: skill.id || `${category.name}-${skill.name}`
              }))
            );
        
        skills.forEach(skill => {
          const skillId = skill.id || `${skill.name}`;
          newEmployeeSkills[member.id][skillId] = 0;
        });
      });
      
      setEmployeeSkills(newEmployeeSkills);
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleGenerateMatrix = async () => {
    if (!department) {
      toast({
        title: "Missing information",
        description: "Department is required to generate a matrix",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await generateSkillMatrix(department, description || `Skills matrix for ${department}`);
      setGeneratedMatrix(result);
      
      const categories = result.skillCategories.map((category: any) => ({
        name: category.name,
        skills: category.skills.map((skill: any) => ({
          name: skill.name,
          targetLevel: skill.targetLevel,
        }))
      }));
      
      setSkillCategories(categories);
      
      toast({
        title: "Matrix generated",
        description: "Your skill matrix has been generated successfully",
      });
    } catch (error) {
      console.error("Error generating matrix:", error);
      toast({
        title: "Generation failed",
        description: "An error occurred while generating the skill matrix",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveMatrix = async () => {
    if (!matrixName.trim()) {
      toast({
        title: "Matrix name required",
        description: "Please provide a name for your skill matrix",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const teamMembersWithRequiredFields = selectedTeamMembers.map((member) => ({
        id: member.id,
        name: member.name,
        role: member.role || "Team Member",
        department: member.department || department,
        employer: member.employer || department
      }));
      
      const matrixData = {
        department,
        description: description || `Skills matrix for ${department}`,
        name: matrixName,
        skillCategories: creationMode === "ai" ? skillCategories : manualCategories,
        teamMembers: teamMembersWithRequiredFields,
        employeeSkills: employeeSkills
      };
      
      // Uloženie matice a získanie jej ID
      const savedMatrixId = await saveSkillMatrix(matrixData);
      
      // Uloženie ID matice do stavu pre použitie pri aktuálnej relatívnej operácii
      if (savedMatrixId && typeof savedMatrixId === 'string') {
        console.log(`Setting matrix ID to: ${savedMatrixId}`);
        setMatrixId(savedMatrixId);
      }
      
      toast({
        title: "Matrix saved",
        description: "Your skill matrix has been saved successfully",
      });
      
      navigate("/skill-matrix");
    } catch (error: any) {
      console.error("Error saving matrix:", error);
      
      if (error.message && error.message.includes("complete_skill_matrices")) {
        toast({
          title: "Matrix partially saved",
          description: "Your primary skill matrix was saved, but there was an issue with additional data. You can still access your matrix.",
          variant: "default",
        });
        navigate("/skill-matrix");
      } else {
        toast({
          title: "Save failed",
          description: "An error occurred while saving the skill matrix",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateSkill = (categoryIndex: number, skillIndex: number, value: number) => {
    const updatedCategories = [...skillCategories];
    updatedCategories[categoryIndex].skills[skillIndex].targetLevel = value;
    setSkillCategories(updatedCategories);
  };
  
  const handleCategoryRename = (categoryIndex: number, newName: string) => {
    const updatedCategories = [...skillCategories];
    updatedCategories[categoryIndex].name = newName;
    setSkillCategories(updatedCategories);
  };
  
  // Pomocná funkcia pre výpis štruktúry kategorii pre debugáciu
  const logSkillCategories = () => {
    if (skillCategories && skillCategories.length > 0) {
      skillCategories.forEach((cat, cIndex) => {
        console.log(`Category ${cIndex}: ${cat.name}`);
        if (cat.skills && cat.skills.length > 0) {
          cat.skills.forEach((skill, sIndex) => {
            console.log(`  Skill ${sIndex}: id=${skill.id || 'undefined'}, name=${skill.name}`);
          });
        }
      });
    }
  };
  
  const handleSkillRename = (categoryIndex: number, skillIndex: number, newName: string, skillId?: string) => {
    console.log(`IMPROVED UPDATE: Renaming skill in category ${categoryIndex}, skill index ${skillIndex}, ID=${skillId || 'undefined'} to '${newName}'`);
    
    // Aktuálny stav pre debugáciu
    const stateCopy = JSON.parse(JSON.stringify(skillCategories));
    
    // Získame skil, ktorý chceme upraviť
    if (!stateCopy[categoryIndex] || !stateCopy[categoryIndex].skills || !stateCopy[categoryIndex].skills[skillIndex]) {
      console.error(`Cannot find skill at category ${categoryIndex}, index ${skillIndex}`);
      return;
    }
    
    const skillToUpdate = stateCopy[categoryIndex].skills[skillIndex];
    const oldName = skillToUpdate.name;
    
    // Ak máme ID skilu (z komponentu), použijeme ho, inak použijeme ten, ktorý existuje v dátach
    const actualSkillId = skillId || skillToUpdate.id;
    
    console.log(`Skill details - Name: ${oldName}, ID: ${actualSkillId || 'undefined'}, Index: ${skillIndex}`);
    
    // Vytvoríme úplne nový objekt kategórií - jednoduchá in-place mutácia pre lokálny UI update
    const directUpdate = [...stateCopy];
    directUpdate[categoryIndex] = {
      ...directUpdate[categoryIndex],
      skills: [...directUpdate[categoryIndex].skills]
    };
    
    // Lokálne aktualizujeme názov skilu pre UI
    directUpdate[categoryIndex].skills[skillIndex] = {
      ...directUpdate[categoryIndex].skills[skillIndex],
      name: newName
    };
    
    // DB update - ak máme ID, aké sa používa v databáze, použijeme AJ tento spôsob aktualizácie
    // Toto zabezpečí synchronizáciu s databázou
    if (actualSkillId && matrixId) {
      console.log(`Performing database update using ID=${actualSkillId}, matrix=${matrixId}, new name=${newName}`);
      
      // Asynchrónne aktualizujeme aj v databáze, ale na UI sa nemáme čakať (aby používateľ hneď videl zmenu)
      import('@/services/matrixGeneratorService')
        .then(({ updateMatrixSkill }) => {
          updateMatrixSkill(matrixId, actualSkillId, newName)
            .then(success => {
              if (success) {
                console.log(`Successfully updated skill ${actualSkillId} in database`);
              } else {
                console.error(`Failed to update skill ${actualSkillId} in database`);
                toast({
                  title: "Chyba pri aktualizácii",
                  description: "Zmeny neboli uložené v databáze. Skúste znova.",
                  variant: "destructive"
                });
              }
            });
        });
    } else {
      console.log('Cannot update in database - missing skill ID or matrix ID');
    }
    
    // Nastavíme nový stav pre UI ihneď
    setSkillCategories(directUpdate);
    console.log(`Directly updated skill ${skillIndex} from '${oldName}' to '${newName}'`);
  };
  
  const handleAddSkill = (categoryIndex: number, skillName: string) => {
    if (creationMode === "ai") {
      const updatedCategories = [...skillCategories];
      updatedCategories[categoryIndex].skills.push({
        name: skillName,
        targetLevel: 0
      });
      setSkillCategories(updatedCategories);
    } else {
      const updatedManualCategories = [...manualCategories];
      updatedManualCategories[categoryIndex].skills.push({
        name: skillName,
        targetLevel: 0
      });
      setManualCategories(updatedManualCategories);
    }
  };
  
  const handleAddTeamMember = (member: TeamMember) => {
    setSelectedTeamMembers((prev) => [...prev, member]);
  };
  
  const handleRemoveTeamMember = (memberId: string) => {
    setSelectedTeamMembers((prev) => prev.filter((member) => member.id !== memberId));
  };
  
  const handleSkillValueChange = (employeeId: string, skillId: string, value: number) => {
    setEmployeeSkills(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [skillId]: value
      }
    }));
  };
  
  const handleDepartmentChange = (value: string) => {
    const selectedDept = departments.find(dept => dept.id === value);
    if (selectedDept) {
      setDepartment(selectedDept.name);
    }
  };
  
  const handleAddCategory = (categoryName: string) => {
    const newCategory = {
      name: categoryName,
      skills: []
    };
    setManualCategories([...manualCategories, newCategory]);
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vytvorte si maticu zručností</h1>
          <p className="text-muted-foreground mt-1">
            Vytvorte komplexnú maticu zručností pre váš tím podľa štandardov automobilového priemyslu
          </p>
        </div>
        // Add this somewhere visible in your UI to check your role
<div className="text-sm p-2 bg-gray-100 rounded">
  Current role: {userRole || 'Not assigned'}
</div>
        <Card className="p-2">
          <CardContent className="pt-4">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentStep === 0}
                  onClick={handlePreviousStep}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Späť
                </Button>
                <Progress
                  value={(currentStep + 1) * (100 / steps.length)}
                  className="h-2 w-full max-w-md mx-auto"
                />
                <Button 
                  onClick={handleNextStep}
                  disabled={currentStep === steps.length - 1}
                >
                  Next
                </Button>
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground max-w-xl mx-auto">
                {steps.map((step, index) => (
                  <div 
                    key={step} 
                    className={`flex flex-col items-center ${
                      index <= currentStep ? "text-primary" : ""
                    }`}
                  >
                    <div 
                      className={`h-3 w-3 rounded-full mb-1 ${
                        index < currentStep 
                          ? "bg-primary" 
                          : index === currentStep 
                          ? "border-2 border-primary" 
                          : "border border-muted-foreground"
                      }`}
                    />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {currentStep === 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Oblasti podnikania</h2>
                <p className="text-muted-foreground">
                  Zadajte podrobnosti o vašej matici zručností a oddelení.
                </p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="department-select">Oddelenie</Label>
                    <Select 
                      onValueChange={handleDepartmentChange}
                      defaultValue={departments.find(dept => dept.name === department)?.id}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Vyberte oddelenie" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="matrix-name">Názov matice</Label>
                    <Input
                      id="matrix-name"
                      placeholder="napr. Hodnotenie zručností dizajnérskeho tímu"
                      value={matrixName}
                      onChange={(e) => setMatrixName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">{department} – Matica zručností</h2>
                  <p className="text-muted-foreground">
                    Vytvorte svoju maticu zručností pomocou AI generovania alebo manuálnym pridaním kategórií a zručností.
                  </p>
                </div>
                
                <Tabs defaultValue="ai" onValueChange={(value) => setCreationMode(value as "ai" | "manual")}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="ai">AI generovanie</TabsTrigger>
                    <TabsTrigger value="manual">Manuálne vytvorenie</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="ai" className="space-y-6">
                    <Button 
                      onClick={handleGenerateMatrix} 
                      disabled={isLoading || !department}
                      className="w-full"
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      {isLoading ? "Generujem..." : "Vygenerovať návrh matice zručností"}
                    </Button>
                    
                    {skillCategories.map((category, categoryIndex) => (
                      <MatrixCategorySection
                        key={categoryIndex}
                        category={category}
                        categoryIndex={categoryIndex}
                        onSkillUpdate={handleUpdateSkill}
                        onCategoryRename={handleCategoryRename}
                        onSkillRename={handleSkillRename}
                        onAddSkill={handleAddSkill}
                        onRemoveSkill={(categoryIndex, skillIndex) => {
                          const updatedCategories = [...skillCategories];
                          updatedCategories[categoryIndex].skills.splice(skillIndex, 1);
                          setSkillCategories(updatedCategories);
                        }}
                        editMode={true}
                      />
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="manual" className="space-y-6">
                    <ManualSkillCreator 
                      categories={manualCategories}
                      onCategoriesChange={setManualCategories}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}
            
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Hodnotenie tímu</h2>
                <p className="text-muted-foreground">
                  Priraďte členov tímu k tejto matici zručností. Vyberte zamestnancov, ktorých chcete hodnotiť podľa definovaných zručností.
                </p>
                
                {employees && employees.length > 0 ? (
                  <TeamMemberSelector 
                    
                    selectedMembers={selectedTeamMembers}
                    onAddMember={handleAddTeamMember}
                    onRemoveMember={handleRemoveTeamMember}
                    showSearch={true}
                    editMode={true}
                  />
                ) : (
                  <div className="bg-muted/30 p-6 rounded-lg">
                    <p className="text-center text-muted-foreground">
                      {isLoading ? "Načítavam zamestnancov..." : "Nenašli sa žiadni zamestnanci. Najskôr pridajte zamestnancov do systému."}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Hodnotenie zručností zamestnancov</h2>
                <p className="text-muted-foreground">
                  Nastavte počiatočné úrovne zručností pre každého člena tímu. Tým vytvoríte východiskový stav vašej matice zručností.
                </p>
                
                <EmployeeSkillAssessment
                  selectedEmployees={selectedTeamMembers}
                  skillCategories={creationMode === "ai" 
                    ? skillCategories.map(cat => ({
                        name: cat.name,
                        skills: cat.skills.map((skill: any) => ({
                          id: skill.id || `${cat.name}-${skill.name}`,
                          name: skill.name,
                          targetLevel: skill.targetLevel
                        }))
                      }))
                    : manualCategories
                  }
                  employeeSkills={employeeSkills}
                  onSkillValueChange={handleSkillValueChange}
                />
              </div>
            )}
            
            {currentStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Hotovo</h2>
                <p className="text-muted-foreground">
                  Vaša matica zručností bola úspešne vytvorená. Teraz ju môžete uložiť a začať používať pre váš tím.
                </p>
                <div className="bg-green-100 dark:bg-green-900/20 p-6 rounded-lg text-green-800 dark:text-green-300">
                  <h3 className="font-medium text-lg">Úspech!</h3>
                  <p>
                    Vaša matica zručností pre oddelenie {department} je pripravená. Obsahuje {
                      creationMode === "ai"
                        ? skillCategories.reduce((acc, cat) => acc + cat.skills.length, 0)
                        : manualCategories.reduce((acc, cat) => acc + cat.skills.length, 0)
                    } zručností
                    v {creationMode === "ai" ? skillCategories.length : manualCategories.length} kategóriách
                    s {selectedTeamMembers.length} priradenými členmi tímu.
                  </p>
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-md border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                  <Info className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p>Poznámka: V niektorých prípadoch sa môže zobraziť chyba o povoleniach pre rozšírené údaje matice, ale vaša hlavná matica bude úspešne uložená.</p>
                  </div>
                </div>
                
                <Button onClick={handleSaveMatrix} className="w-full" disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Ukladám..." : "Uložiť maticu zručností"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default MatrixGenerator;
