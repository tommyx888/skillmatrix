
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, UserCog, AlertCircle } from "lucide-react";
import { TeamMember, NewSkillCategory } from "@/types/skills";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatEmployeeName as formatEmployeeData } from "../skill-matrix/SkillMatrixTable";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmployeeSkillAssessmentProps {
  selectedEmployees: TeamMember[];
  skillCategories: NewSkillCategory[];
  employeeSkills: Record<string, Record<string, number>>;
  onSkillValueChange: (employeeId: string, skillId: string, value: number) => void;
}

// Format TeamMember objects (which are similar to but not the same as Employee objects)
const formatTeamMemberName = (member: TeamMember): string => {
  if (!member) return "Unknown";
  
  if (member.name) {
    return member.name;
  }
  
  return member.employee_id 
    ? `ID: ${member.employee_id}` 
    : `ID: ${member.id.substring(0, 8)}`;
};

const EmployeeSkillAssessment: React.FC<EmployeeSkillAssessmentProps> = ({
  selectedEmployees,
  skillCategories,
  employeeSkills,
  onSkillValueChange
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("employee-0");
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const allSkills = skillCategories.flatMap(category => 
    category.skills.map(skill => ({
      id: skill.id || `${category.name}-${skill.name}`,
      name: skill.name,
      category: category.name,
      targetLevel: skill.targetLevel
    }))
  );
  
  const levelColors = [
    "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
    "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
  ];
  
  const levelDescriptions = [
    "No knowledge",
    "Basic knowledge",
    "Practical application",
    "Deep understanding", 
    "Expert knowledge"
  ];
  
  const filteredSkills = searchQuery 
    ? allSkills.filter(skill => 
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allSkills;
    
  const handleSkillValueChange = (employeeId: string, skillId: string, value: number) => {
    console.log(`Setting skill ${skillId} for employee ${employeeId} to level ${value}`);
    onSkillValueChange(employeeId, skillId, value);
    toast({
      title: "Skill level updated",
      description: `Assessment updated but not yet saved to database`,
      variant: "default",
    });
  };
  
  return (
    <div className="space-y-6">
      <Card className="border border-primary/10 shadow-md rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-b">
          <div className="flex justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Employee Skill Assessment</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Set the skill levels for each employee. This will create the initial assessment for the skill matrix.
              </p>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search skills..." 
              className="pl-9 rounded-full bg-white/80 dark:bg-gray-800/60 border border-primary/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {saveError && (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}
          
          {selectedEmployees.length > 0 ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <ScrollArea className="w-full max-w-full border-b">
                <TabsList className="p-4 mb-0 flex-wrap">
                  {selectedEmployees.map((employee, index) => (
                    <TabsTrigger 
                      key={employee.id} 
                      value={`employee-${index}`}
                      className="inline-flex items-center px-4 py-2 rounded-full m-1"
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      {formatTeamMemberName(employee)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>
              
              {selectedEmployees.map((employee, index) => (
                <TabsContent key={employee.id} value={`employee-${index}`} className="p-0">
                  <ScrollArea className="h-[calc(100vh-320px)]">
                    <div className="rounded-md min-w-[800px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                            <TableHead className="w-[300px] font-semibold sticky left-0 z-10 bg-gray-50 dark:bg-gray-800/50">Skill</TableHead>
                            <TableHead className="w-[200px] font-semibold sticky left-[300px] z-10 bg-gray-50 dark:bg-gray-800/50">Category</TableHead>
                            <TableHead className="w-[150px] font-semibold">Target Level</TableHead>
                            <TableHead className="font-semibold">Current Level</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSkills.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center h-24">
                                No skills found matching your search.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredSkills.map(skill => {
                              const employeeSkillValue = 
                                employeeSkills[employee.id] && 
                                typeof employeeSkills[employee.id][skill.id] === 'number' ? 
                                employeeSkills[employee.id][skill.id] : 0;
                              
                              return (
                                <TableRow key={`${employee.id}-${skill.id}`} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30">
                                  <TableCell className="font-medium sticky left-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                                    <div className="px-3 py-2 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-lg inline-block shadow-sm">
                                      {skill.name}
                                    </div>
                                  </TableCell>
                                  <TableCell className="sticky left-[300px] z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">{skill.category}</TableCell>
                                  <TableCell>{skill.targetLevel}</TableCell>
                                  <TableCell>
                                    <div className="flex space-x-1">
                                      {[0, 1, 2, 3, 4].map((level) => (
                                        <div
                                          key={level}
                                          className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shadow-sm transition-all duration-150 hover:scale-110 ${
                                            level === employeeSkillValue ? levelColors[level] : "bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                                          }`}
                                          onClick={() => handleSkillValueChange(employee.id, skill.id, level)}
                                          title={levelDescriptions[level]}
                                        >
                                          {level}
                                        </div>
                                      ))}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-2">
                                      {levelDescriptions[employeeSkillValue]}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No team members selected. Please add team members in the previous step.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeSkillAssessment;
