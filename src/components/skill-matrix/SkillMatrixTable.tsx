import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight } from "lucide-react";
import { SkillData, EmployeeData } from "@/types/skills";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface SkillMatrixTableProps {
  skills: SkillData[];
  employees: EmployeeData[];
  readOnly?: boolean;
  onSkillValueChange?: (employeeId: string, skillId: string, newValue: number) => void;
  isComparing?: boolean;
  comparisonData?: Record<string, Record<string, { before: number, after: number, change: number }>>;
  // Function to calculate the average skill level for a specific skill
  getSkillAverage?: (skillId: string) => number;
  // Function to check if an average meets the target level
  meetsCriteria?: (average: number, target: number) => boolean;
}

const skillLevelDescriptions = [
  "0-Vynechaná zručnosť",
  "1-Stále sa učí (základy)",
  "2-Plní niektoré požiadavky (práca pod dozorom)",
  "3-Plní všetky požiadavky samostatnej práce",
  "4-Prekračuje požiadavky (môže trénovať)"
];

// Format employee name with better fallbacks for missing data
export const formatEmployeeName = (employee: EmployeeData): string => {
  if (!employee) return "Unknown Employee";
  
  // Try all possible name fields in order of preference
  if (employee.name && employee.name.trim() !== "") return employee.name;
  if (employee.first_name && employee.last_name) return `${employee.first_name} ${employee.last_name}`;
  if (employee.first_name) return employee.first_name;
  if (employee.last_name) return employee.last_name;
  
  // Fall back to employee ID with better formatting
  const idToDisplay = employee.employee_id || (employee.id ? employee.id.substring(0, 8) : "Unknown");
  return `Zamestnanec ${idToDisplay}`;
};

// Format skill name with fallbacks for missing data
export const formatSkillName = (skill: SkillData): string => {
  if (!skill) return "Unknown Skill";
  
  // Try name property first - so spru00e1vnou kontrolou typu
  if (skill.name && typeof skill.name === 'string' && skill.name.trim() !== "") {
    return skill.name;
  }
  
  // Try category if available - s kontrolou typu
  if (skill.category && typeof skill.category === 'string' && skill.category.trim() !== "") {
    return `${skill.category} - Skill ${skill.id.substring(0, 4)}`;
  }
  
  // Fall back to skill ID with better formatting
  return `Skill ${typeof skill.id === 'string' ? skill.id.substring(0, 8) : 'unknown'}`;
};

const SkillMatrixTable: React.FC<SkillMatrixTableProps> = ({
  skills,
  employees,
  readOnly = false,
  onSkillValueChange,
  comparisonData,
  isComparing = false,
  getSkillAverage,
  meetsCriteria
}) => {
  const [skillsPerPage, setSkillsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(0);

  if (!skills || skills.length === 0 || !employees || employees.length === 0) {
    return (
      <Card className="overflow-hidden shadow-md border-primary/10">
        <CardContent className="p-4">
          <div className="text-center py-10 text-muted-foreground">
            Nie sú dostupné žiadne údaje na zobrazenie matice zručností.
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPages = Math.ceil(skills.length / skillsPerPage);
  const paginatedSkills = skills.slice(
    currentPage * skillsPerPage,
    (currentPage + 1) * skillsPerPage
  );

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleSkillsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = Number(e.target.value);
    setSkillsPerPage(newValue);
    setCurrentPage(0);
  };

  const handleIncreaseSkill = (employeeId: string, skillId: string, currentValue: number) => {
    if (currentValue < 4 && onSkillValueChange) {
      onSkillValueChange(employeeId, skillId, currentValue + 1);
    }
  };

  const handleDecreaseSkill = (employeeId: string, skillId: string, currentValue: number) => {
    if (currentValue > 0 && onSkillValueChange) {
      onSkillValueChange(employeeId, skillId, currentValue - 1);
    }
  };

  const getSkillLevelColor = (level: number) => {
    switch (level) {
      case 0: return "bg-gray-50/80 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700";
      case 1: return "bg-purple-50/80 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800";
      case 2: return "bg-amber-50/80 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
      case 3: return "bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case 4: return "bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800";
      default: return "bg-gray-50/80 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700";
    }
  };

  const getSkillLevelTextColor = (level: number) => {
    switch (level) {
      case 0: return "text-gray-600 dark:text-gray-400";
      case 1: return "text-purple-600 dark:text-purple-400";
      case 2: return "text-amber-600 dark:text-amber-400";
      case 3: return "text-blue-600 dark:text-blue-400";
      case 4: return "text-emerald-600 dark:text-emerald-400";
      default: return "text-gray-600 dark:text-gray-400";
    }
  };

  const getSkillLevel = (employee: EmployeeData, skillId: string): number => {
    if (!employee.skills) return 0;
    if (typeof employee.skills === 'object' && employee.skills !== null) {
      const skillValue = employee.skills[skillId];
      if (skillValue !== undefined) {
        const numValue = Number(skillValue);
        return isNaN(numValue) ? 0 : numValue;
      }
    }
    return 0;
  };

  const calculateEmployeeSkillPercentage = (employee: EmployeeData): number => {
    if (!employee.skills || typeof employee.skills !== 'object') return 0;
    let totalSkillValue = 0;
    let skillCount = 0;
    for (const skill of skills) {
      const skillLevel = getSkillLevel(employee, skill.id);
      if (skillLevel > 0) {
        totalSkillValue += skillLevel;
        skillCount++;
      }
    }
    if (skillCount === 0) return 0;
    return Math.round((totalSkillValue / (skillCount * 4)) * 100);
  };

  const calculateOverallSkillPercentage = (): number => {
    let totalPercentage = 0;
    for (const employee of employees) {
      totalPercentage += calculateEmployeeSkillPercentage(employee);
    }
    return Math.round(totalPercentage / employees.length);
  };

  const calculateTargetPercentage = (targetLevel: number): number => {
    if (targetLevel <= 0) return 0;
    return (targetLevel / 4) * 100;
  };

  const calculateSkillPercentage = (level: number): number => {
    return (level / 4) * 100;
  };

  return (
    <Card className="overflow-hidden border-0 shadow-xl rounded-lg bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-950">
      <CardContent className="p-0">
        <div className="p-6 bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-950/40 dark:to-blue-950/40 border-b">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-indigo-900 dark:text-indigo-100">Celková úroveň zručností tímu</h3>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-300 bg-white/50 dark:bg-indigo-950/30 px-3 py-1 rounded-full">{calculateOverallSkillPercentage()}%</span>
            </div>
            <Progress value={calculateOverallSkillPercentage()} className="h-3 bg-white/50 dark:bg-white/10 rounded-full overflow-hidden" indicatorClassName="bg-gradient-to-r from-indigo-500 to-blue-600" />
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrevPage} 
              disabled={currentPage === 0}
              className="h-8 w-8 p-0 rounded-full shadow-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextPage} 
              disabled={currentPage === totalPages - 1}
              className="h-8 w-8 p-0 rounded-full shadow-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="skillsPerPage" className="text-sm">
              Zručnosti na stránku:
            </label>
            <select 
              id="skillsPerPage"
              value={skillsPerPage}
              onChange={handleSkillsPerPageChange}
              className="text-sm p-1 border rounded-md bg-background focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
        <ScrollArea className="h-[calc(120vh-300px)] w-full overflow-x-auto min-w-[800px]">
          <table className="w-full">
            <thead>
              <tr className="bg-indigo-50/80 dark:bg-indigo-950/30">
                <th className="sticky top-0 left-0 z-30 bg-indigo-50/80 dark:bg-indigo-950/30 min-w-[120px] max-w-[120px] px-0.5 py-0.5 font-semibold text-indigo-900 dark:text-indigo-100 border border-indigo-200 dark:border-indigo-800">
                  Employee
                </th>
                <th className="sticky top-0 left-[120px] z-30 bg-indigo-50/80 dark:bg-indigo-950/30 min-w-[120px] max-w-[120px] px-0.5 py-0.5 font-semibold text-indigo-900 dark:text-indigo-100 border border-indigo-200 dark:border-indigo-800">
                  ID zamestnanca
                </th>
                {paginatedSkills.map((skill) => (
                  <th key={skill.id} className="sticky top-0 z-30 min-w-[70px] max-w-[90px] px-0.5 py-0.5 font-semibold text-indigo-900 dark:text-indigo-100 bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                    <div className="h-32 relative">
                      <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center">
                        {/* Skill Name */}
                        <div 
                          className="absolute left-1/2 top-2 transform -translate-x-1/2 w-full"
                        >
                          <div className="bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/60 dark:to-blue-900/60 px-3 py-1.5 mx-auto rounded-full shadow-md text-center text-[0.65rem] font-medium text-indigo-800 dark:text-indigo-100 backdrop-blur-sm border border-white/50 dark:border-indigo-500/20 max-w-[90%] truncate" title={skill.name || `${skill.category ? skill.category + ' - ' : ''}Skill ${skill.id.substring(0, 8)}`}>
                            {formatSkillName(skill)}
                          </div>
                        </div>
                        
                        {/* Target Level */}
                        <div className="absolute left-1/2 top-[45px] transform -translate-x-1/2 w-full">
                          {skill.target_level > 0 && (
                            <div className="mx-auto bg-white/60 dark:bg-indigo-950/40 px-2 py-1 rounded-md shadow-sm text-center text-xs font-semibold text-indigo-700 dark:text-indigo-300 max-w-[85%]">
                              Target: {skill.target_level}
                            </div>
                          )}
                        </div>
                        
                        {/* Team Average */}
                        {getSkillAverage && (
                          <div className="absolute left-1/2 bottom-2 transform -translate-x-1/2 w-full">
                            {(() => {
                              const avgLevel = getSkillAverage(skill.id);
                              const meetsTarget = meetsCriteria ? meetsCriteria(avgLevel, skill.target_level) : false;
                              return (
                                <div className={`mx-auto text-xs font-medium px-2 py-1 rounded-md shadow-sm max-w-[85%] flex items-center justify-center ${meetsTarget ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                  Team: {avgLevel.toFixed(1)}
                                  {meetsTarget ? 
                                    <span className="ml-1">✓</span> : 
                                    <span className="ml-1">↓</span>}
                                </div>
                              );
                            })()} 
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
                <th className="sticky top-0 text-center whitespace-nowrap px-0.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 font-semibold min-w-[50px] max-w-[50px] text-indigo-900 dark:text-indigo-100 z-30 border border-indigo-200 dark:border-indigo-800">
                  <div className="w-full text-center">Overall</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const employeeSkillPercentage = calculateEmployeeSkillPercentage(employee);
                return (
                  <tr key={employee.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors">
                    <td className="sticky left-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm font-medium border-r border-indigo-100 dark:border-indigo-950/30 min-w-[120px] max-w-[120px]">
                      <div className="flex flex-col">
                        <span className="font-semibold text-indigo-900 dark:text-indigo-100">{formatEmployeeName(employee)}</span>
                      </div>
                    </td>
                    <td className="sticky left-[120px] z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-r border-indigo-100 dark:border-indigo-950/30 text-indigo-800/80 dark:text-indigo-200/80 min-w-[120px] max-w-[120px] text-center">
                      {employee.employee_id}
                    </td>
                    {paginatedSkills.map(skill => {
                      const currentLevel = getSkillLevel(employee, skill.id);
                      const skillPercentage = calculateSkillPercentage(currentLevel);
                      
                      // For comparison mode
                      let hasComparisonData = false;
                      let comparisonBefore = 0;
                      let comparisonAfter = 0;
                      let comparisonChange = 0;
                      let isPositiveChange = false;
                      let isNegativeChange = false;
                      
                      if (isComparing && comparisonData && employee.id in comparisonData && skill.id in comparisonData[employee.id]) {
                        hasComparisonData = true;
                        comparisonBefore = comparisonData[employee.id][skill.id].before;
                        comparisonAfter = comparisonData[employee.id][skill.id].after;
                        comparisonChange = comparisonData[employee.id][skill.id].change;
                        isPositiveChange = comparisonChange > 0;
                        isNegativeChange = comparisonChange < 0;
                      }
                      
                      return (
                        <td key={skill.id} className={`text-center m-1 p-0 overflow-hidden`}>
                          <div className={`flex flex-col items-center justify-center p-1 m-0 rounded shadow-sm transition-all ${getSkillLevelColor(currentLevel)} border`}>
                            <div className="flex items-center justify-center gap-1">
                              <div className={`text-lg font-bold ${getSkillLevelTextColor(currentLevel)}`}>{currentLevel}</div>
                              <div className="text-xs text-muted-foreground">({skillPercentage}%)</div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 mb-1 line-clamp-1 w-full hover:line-clamp-none text-center">{skillLevelDescriptions[currentLevel]}</div>
                            {hasComparisonData && (
                              <div className={`text-xs font-medium mb-1 flex items-center ${isPositiveChange ? "text-emerald-600 dark:text-emerald-400" : isNegativeChange ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}>
                                {isPositiveChange && <TrendingUp className="h-3 w-3 mr-1" />}
                                {isNegativeChange && <TrendingDown className="h-3 w-3 mr-1" />}
                                {!isPositiveChange && !isNegativeChange && <Minus className="h-3 w-3 mr-1" />}
                                {isPositiveChange ? "+" : ""}{comparisonChange}
                              </div>
                            )}
                            {!readOnly && (
                              <div className="flex space-x-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-5 w-5 rounded-full bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                  onClick={() => handleDecreaseSkill(employee.id, skill.id, currentLevel)}
                                  disabled={currentLevel === 0}
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-5 w-5 rounded-full bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                  onClick={() => handleIncreaseSkill(employee.id, skill.id, currentLevel)}
                                  disabled={currentLevel === 4}
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-center bg-indigo-100/80 dark:bg-indigo-900/40">
                      <div className="flex flex-col items-center space-y-2 p-1">
                        <div className="text-base font-bold text-indigo-700 dark:text-indigo-300">{employeeSkillPercentage}%</div>
                        <Progress 
                          value={employeeSkillPercentage} 
                          className="h-2 w-full max-w-28 bg-white/50 dark:bg-white/10 rounded-full overflow-hidden" 
                          indicatorClassName="bg-gradient-to-r from-indigo-500 to-blue-600"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SkillMatrixTable;
