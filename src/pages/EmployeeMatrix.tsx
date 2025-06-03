import React, { useState, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Employee, Skill } from "@/types/skills";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useEmployeeSkills } from "@/hooks/use-employee-skills";

const EmployeeMatrix = () => {
  // Use the custom hook to fetch employee skills data
  const { employees, skills, loading, error, usedMockData } = useEmployeeSkills();
  
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [skillSearchTerm, setSkillSearchTerm] = useState("");
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("employee-view");
  
  // Set default selections when data is loaded
  useMemo(() => {
    if (employees.length > 0 && !selectedEmployee) {
      setSelectedEmployee(employees[0].id);
    }
    if (skills.length > 0 && !selectedSkill) {
      setSelectedSkill(skills[0].id);
    }
  }, [employees, skills, selectedEmployee, selectedSkill]);

  // Filter employees based on search term
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => 
      employee.name.toLowerCase().includes(employeeSearchTerm.toLowerCase())
    );
  }, [employees, employeeSearchTerm]);

  // Filter skills based on search term
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => 
      skill.name.toLowerCase().includes(skillSearchTerm.toLowerCase())
    );
  }, [skills, skillSearchTerm]);

  // Get the selected employee's skills
  const selectedEmployeeData = useMemo(() => {
    return employees.find(emp => emp.id === selectedEmployee);
  }, [employees, selectedEmployee]);

  // Calculate average skill level for an employee
  const calculateAverageSkillLevel = (employee: Employee | undefined) => {
    if (!employee || !employee.skills) return 0;
    
    // Make sure skills is treated as a Record<string, number>
    const skillsRecord = employee.skills as Record<string, number>;
    const skillValues = Object.values(skillsRecord).filter(val => typeof val === 'number' && val > 0);
    
    if (skillValues.length === 0) return 0;
    
    const sum = skillValues.reduce((acc, val) => acc + val, 0);
    return parseFloat((sum / skillValues.length).toFixed(1));
  };

  // Get all employees with a specific skill, sorted by skill level
  const employeesWithSkill = useMemo(() => {
    if (!selectedSkill) return [];
    
    return employees
      .filter(emp => {
        // Make sure emp.skills exists and has the skill with a value > 0
        return emp.skills && 
               typeof emp.skills === 'object' && 
               selectedSkill in emp.skills && 
               typeof emp.skills[selectedSkill] === 'number' && 
               emp.skills[selectedSkill] > 0;
      })
      .sort((a, b) => {
        const skillA = a.skills ? a.skills[selectedSkill] || 0 : 0;
        const skillB = b.skills ? b.skills[selectedSkill] || 0 : 0;
        return skillB - skillA;
      });
  }, [employees, selectedSkill]);

  // Calculate skill distribution for a specific skill
  const calculateSkillDistribution = (skillId: string) => {
    if (!skillId) return { average: 0, distribution: [0, 0, 0, 0, 0] };
    
    const employeesWithThisSkill = employees.filter(emp => 
      emp.skills && emp.skills[skillId] !== undefined && emp.skills[skillId] > 0
    );
    
    if (employeesWithThisSkill.length === 0) {
      return { average: 0, distribution: [0, 0, 0, 0, 0] };
    }
    
    const distribution = [0, 0, 0, 0, 0]; // Levels 1-5
    let sum = 0;
    
    employeesWithThisSkill.forEach(emp => {
      const level = emp.skills[skillId];
      sum += level;
      if (level >= 1 && level <= 5) {
        distribution[level - 1]++;
      }
    });
    
    const average = parseFloat((sum / employeesWithThisSkill.length).toFixed(1));
    
    return { average, distribution };
  };

  // Function to render skill level badge
  const renderSkillLevelBadge = (level: number) => {
    if (level === 0) return <Badge variant="outline">Not rated</Badge>;
    
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    let text = "Beginner";
    
    if (level === 1) {
      variant = "outline";
      text = "Beginner";
    } else if (level === 2) {
      variant = "secondary";
      text = "Basic";
    } else if (level === 3) {
      variant = "secondary";
      text = "Intermediate";
    } else if (level === 4) {
      variant = "default";
      text = "Advanced";
    } else if (level === 5) {
      variant = "default";
      text = "Expert";
    }
    
    return <Badge variant={variant}>{text} ({level})</Badge>;
  };

  const skillStats = calculateSkillDistribution(selectedSkill);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Matrix</h1>
          <p className="text-muted-foreground mt-1">
            Analyze employee skills and find skilled team members
          </p>
          {usedMockData && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Using sample data</AlertTitle>
              <AlertDescription>
                No real employee skills data was found, displaying sample data instead.
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error loading data</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-[300px] w-full" />
              <Skeleton className="h-[300px] w-full" />
            </div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="employee-view">Employee Skills</TabsTrigger>
              <TabsTrigger value="skill-view">Skill Analysis</TabsTrigger>
            </TabsList>
          
          {/* Employee View Tab */}
          <TabsContent value="employee-view" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Employee</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input 
                    placeholder="Search employees..." 
                    value={employeeSearchTerm}
                    onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                  {employees.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No employees found
                    </div>
                  ) : (
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger className="max-w-md">
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredEmployees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>

            {selectedEmployeeData && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Employee Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <p className="text-sm font-medium">Name:</p>
                        <p className="text-sm">{selectedEmployeeData.name}</p>
                        
                        {selectedEmployeeData.employee_id && (
                          <>
                            <p className="text-sm font-medium">Employee ID:</p>
                            <p className="text-sm">{selectedEmployeeData.employee_id}</p>
                          </>
                        )}
                        
                        {selectedEmployeeData.email && (
                          <>
                            <p className="text-sm font-medium">Email:</p>
                            <p className="text-sm">{selectedEmployeeData.email}</p>
                          </>
                        )}
                        
                        {selectedEmployeeData.department && (
                          <>
                            <p className="text-sm font-medium">Department:</p>
                            <p className="text-sm">{selectedEmployeeData.department}</p>
                          </>
                        )}
                        
                        {selectedEmployeeData.role && (
                          <>
                            <p className="text-sm font-medium">Role:</p>
                            <p className="text-sm">{selectedEmployeeData.role}</p>
                          </>
                        )}
                        
                        <p className="text-sm font-medium">Average Skill Level:</p>
                        <p className="text-sm font-bold">
                          {calculateAverageSkillLevel(selectedEmployeeData)}
                        </p>
                        
                        <p className="text-sm font-medium">Total Skills:</p>
                        <p className="text-sm">
                          {Object.keys(selectedEmployeeData.skills || {}).filter(
                            (skillId) => selectedEmployeeData.skills[skillId] > 0
                          ).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Skill Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((level) => {
                        const skillsAtLevel = Object.entries(selectedEmployeeData.skills || {})
                          .filter(([_, skillLevel]) => skillLevel === level);
                        const percentage = skillsAtLevel.length / 
                          Object.keys(selectedEmployeeData.skills || {}).length * 100 || 0;
                        
                        return (
                          <div key={level} className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Level {level}</span>
                              <span className="text-sm text-muted-foreground">
                                {skillsAtLevel.length} skills ({percentage.toFixed(0)}%)
                              </span>
                            </div>
                            <Progress value={percentage} />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Employee Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Skill</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead className="text-right">Target Level</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          // Get employee's skills
                          const employeeSkills = skills.filter(skill => 
                            selectedEmployeeData.skills && 
                            typeof selectedEmployeeData.skills === 'object' &&
                            skill.id in selectedEmployeeData.skills &&
                            typeof selectedEmployeeData.skills[skill.id] === 'number' &&
                            selectedEmployeeData.skills[skill.id] > 0 // Only show skills with level > 0
                          ).sort((a, b) => 
                            (selectedEmployeeData.skills[b.id] || 0) - 
                            (selectedEmployeeData.skills[a.id] || 0)
                          );
                          
                          // If employee has no skills, show message
                          if (employeeSkills.length === 0) {
                            return (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                  {selectedEmployeeData.name} has no skills assigned yet.
                                </TableCell>
                              </TableRow>
                            );
                          }
                          
                          // Otherwise show employee skills
                          return employeeSkills.map(skill => {
                            const level = selectedEmployeeData.skills[skill.id] || 0;
                            const targetLevel = skill.target_level || 0;
                            return (
                              <TableRow key={skill.id}>
                                <TableCell className="font-medium">
                                  {skill.name || `Skill ${skill.id.substring(0, 6)}`}
                                </TableCell>
                                <TableCell>{skill.category_id || 'Uncategorized'}</TableCell>
                                <TableCell>{renderSkillLevelBadge(level)}</TableCell>
                                <TableCell className="text-right">
                                  {targetLevel > 0 ? targetLevel : '-'}
                                </TableCell>
                              </TableRow>
                            );
                          });
                        })()}
                        
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          {/* Skill View Tab */}
          <TabsContent value="skill-view" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Skill</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input 
                    placeholder="Search skills..." 
                    value={skillSearchTerm}
                    onChange={(e) => setSkillSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                  <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                    <SelectTrigger className="max-w-md">
                      <SelectValue placeholder="Select a skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSkills.map((skill) => (
                        <SelectItem key={skill.id} value={skill.id}>
                          {skill.name || `Skill ${skill.id.substring(0, 6)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {selectedSkill && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Skill Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {skills.find(s => s.id === selectedSkill) && (
                          <>
                            <p className="text-sm font-medium">Skill Name:</p>
                            <p className="text-sm">{skills.find(s => s.id === selectedSkill)?.name || `Skill ${selectedSkill.substring(0, 6)}`}</p>
                            
                            <p className="text-sm font-medium">Category:</p>
                            <p className="text-sm">
                              {skills.find(s => s.id === selectedSkill)?.category_id || 'Uncategorized'}
                            </p>
                            
                            <p className="text-sm font-medium">Target Level:</p>
                            <p className="text-sm">
                              {skills.find(s => s.id === selectedSkill)?.target_level || 'Not set'}
                            </p>
                          </>
                        )}
                        
                        <p className="text-sm font-medium">Average Level:</p>
                        <p className="text-sm font-bold">{skillStats.average}</p>
                        
                        <p className="text-sm font-medium">Employees with skill:</p>
                        <p className="text-sm">{employeesWithSkill.length}</p>
                        
                        <p className="text-sm font-medium">Percentage of team:</p>
                        <p className="text-sm">
                          {employees.length > 0 ? 
                            `${((employeesWithSkill.length / employees.length) * 100).toFixed(1)}%` : 
                            '0%'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Level Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((level) => {
                        const count = skillStats.distribution[level - 1];
                        const percentage = employees.length > 0 ? 
                          (count / employees.length) * 100 : 0;
                        
                        return (
                          <div key={level} className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Level {level}</span>
                              <span className="text-sm text-muted-foreground">
                                {count} employees ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <Progress value={percentage} />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Employees with this Skill</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Employee ID</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Skill Level</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeesWithSkill.map(employee => (
                          <TableRow key={employee.id}>
                            <TableCell className="font-medium">{employee.name}</TableCell>
                            <TableCell>{employee.employee_id || '-'}</TableCell>
                            <TableCell>{employee.department || '-'}</TableCell>
                            <TableCell>{renderSkillLevelBadge(employee.skills[selectedSkill])}</TableCell>
                          </TableRow>
                        ))}
                        {employeesWithSkill.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">
                              No employees have this skill yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
        )}
      </div>
    </MainLayout>
  );
};

export default EmployeeMatrix;
