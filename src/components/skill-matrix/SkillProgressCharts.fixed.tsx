import React, { useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatrixHistoryEntry } from "@/services/matrixProgressService";
import type { EmployeeData, SkillData } from "@/types/skills";

// Define types for our data structures
type ProgressDataPoint = {
  date: string;
  percent: number;
  name: string;
  employeeCount?: number;
};

type EmployeeProgressData = {
  id: string;
  name: string;
  percent: number;
  skillCount: number;
};

type EmployeeProgressOverTime = {
  id: string;
  name: string;
  data: ProgressDataPoint[];
};

interface SkillProgressChartsProps {
  snapshotData: MatrixHistoryEntry[];
  chartType: 'team' | 'individuals';
  employees: EmployeeData[];
  skills: SkillData[];
}

export const SkillProgressCharts: React.FC<SkillProgressChartsProps> = ({
  snapshotData,
  chartType,
  employees,
  skills
}) => {
  // State for individual employee selection
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  // Process the snapshot data for the team chart
  const teamChartData = useMemo(() => {
    if (!snapshotData || snapshotData.length === 0) return [];
    
    // Sort snapshots by date
    const sortedSnapshots = [...snapshotData].sort((a, b) => 
      new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
    );
    
    return sortedSnapshots.map(snapshot => {
      const employeeSkills = snapshot.employee_skills || {};
      
      // Only count employees that are present in this snapshot
      const employeeIdsInSnapshot = Object.keys(employeeSkills);
      let totalSkillValue = 0;
      let filledSkillCount = 0;
      let totalPossibleSkillCount = 0;
      
      // Calculate based on employees present in this snapshot, not current employees
      employeeIdsInSnapshot.forEach(empId => {
        const empSkills = employeeSkills[empId] || {};
        skills.forEach(skill => {
          totalPossibleSkillCount++; // Count every possible skill for employees in this snapshot
          if (typeof empSkills[skill.id] === 'number') {
            totalSkillValue += empSkills[skill.id];
            filledSkillCount++;
          }
        });
      });
      
      // Use max skill level from skill definition or default to 4
      const maxSkillLevel = 4;
      const percent = totalPossibleSkillCount > 0 ? 
        (totalSkillValue / (totalPossibleSkillCount * maxSkillLevel)) * 100 : 0;
      
      // Prioritize snapshot name, fallback to date if no name is available
      const snapshotName = snapshot.snapshot_name || new Date(snapshot.snapshot_date).toLocaleDateString();
      
      return {
        date: new Date(snapshot.snapshot_date).toLocaleDateString(),
        percent: Math.round(percent * 10) / 10,
        name: snapshotName,
        employeeCount: employeeIdsInSnapshot.length // Add employee count for reference
      };
    });
  }, [snapshotData, skills]);
  
  // Process individual employee progress data for the current snapshot
  const individualProgressData = useMemo(() => {
    if (!snapshotData || snapshotData.length === 0 || !employees.length) return [];
    
    // Get the latest snapshot for individual progress
    const sortedSnapshots = [...snapshotData].sort((a, b) => 
      new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
    );
    
    const latestSnapshot = sortedSnapshots[0];
    const employeeSkills = latestSnapshot.employee_skills || {};
    
    return employees.map(employee => {
      const empSkills = employeeSkills[employee.id] || {};
      let totalSkillValue = 0;
      let filledSkillCount = 0;
      
      skills.forEach(skill => {
        if (typeof empSkills[skill.id] === 'number') {
          totalSkillValue += empSkills[skill.id];
          filledSkillCount++;
        }
      });
      
      // Use max skill level from skill definition or default to 4
      const maxSkillLevel = 4;
      const percent = skills.length > 0 ? 
        (totalSkillValue / (skills.length * maxSkillLevel)) * 100 : 0;
      
      return {
        id: employee.id,
        name: employee.name,
        percent: Math.round(percent * 10) / 10,
        skillCount: filledSkillCount
      };
    }).sort((a, b) => b.percent - a.percent); // Sort by percent descending
  }, [snapshotData, employees, skills]);
  
  // Process individual employee progress over time
  const individualProgressOverTimeData = useMemo(() => {
    if (!snapshotData || snapshotData.length === 0 || !employees.length) return [];
    
    // Sort snapshots by date (oldest first)
    const sortedSnapshots = [...snapshotData].sort((a, b) => 
      new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
    );
    
    // Initialize employee progress data structure
    const employeeProgress: Record<string, EmployeeProgressOverTime> = {};
    
    employees.forEach(employee => {
      employeeProgress[employee.id] = {
        id: employee.id,
        name: employee.name,
        data: []
      };
    });
    
    // Process each snapshot for each employee
    sortedSnapshots.forEach(snapshot => {
      const employeeSkills = snapshot.employee_skills || {};
      const snapshotName = snapshot.snapshot_name || new Date(snapshot.snapshot_date).toLocaleDateString();
      
      employees.forEach(employee => {
        const empSkills = employeeSkills[employee.id] || {};
        let totalSkillValue = 0;
        let filledSkillCount = 0;
        
        skills.forEach(skill => {
          if (typeof empSkills[skill.id] === 'number') {
            totalSkillValue += empSkills[skill.id];
            filledSkillCount++;
          }
        });
        
        // Use max skill level from skill definition or default to 4
        const maxSkillLevel = 4;
        const percent = skills.length > 0 ? 
          (totalSkillValue / (skills.length * maxSkillLevel)) * 100 : 0;
        
        // Only add data point if the employee exists in this snapshot
        if (employeeProgress[employee.id]) {
          employeeProgress[employee.id].data.push({
            date: new Date(snapshot.snapshot_date).toLocaleDateString(),
            percent: Math.round(percent * 10) / 10,
            name: snapshotName
          });
        }
      });
    });
    
    // Convert to array and filter out employees with no data points
    return Object.values(employeeProgress).filter(emp => emp.data.length > 0);
  }, [snapshotData, employees, skills]);
  
  // Calculate latest team progress (based on the most recent snapshot)
  const latestTeamProgress = teamChartData.length > 0 ? 
    teamChartData[teamChartData.length - 1].percent : 0;
  
  // Get selected employee's data
  const selectedEmployeeData = useMemo(() => {
    if (!selectedEmployeeId && individualProgressOverTimeData.length > 0) {
      // Default to first employee if none selected
      return individualProgressOverTimeData[0];
    } else if (selectedEmployeeId) {
      return individualProgressOverTimeData.find(emp => emp.id === selectedEmployeeId) || null;
    }
    return null;
  }, [selectedEmployeeId, individualProgressOverTimeData]);
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">Skill Progress Charts</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="team" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 p-1 rounded-full bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="team" className="rounded-full py-2">Team Progress</TabsTrigger>
            <TabsTrigger value="individual" className="rounded-full py-2">Individual Progress</TabsTrigger>
            <TabsTrigger value="overtime" className="rounded-full py-2">Progress Over Time</TabsTrigger>
          </TabsList>
          
          {/* Team Progress Tab */}
          <TabsContent value="team" className="space-y-6">
            <div className="space-y-4 mb-6 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-semibold">Overall Team Progress</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Latest Progress</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{latestTeamProgress}% Complete</span>
                </div>
              </div>
              <Progress value={latestTeamProgress} className="h-4 bg-gray-100 dark:bg-gray-800" />
            </div>
          
            <div className="h-72 border rounded-xl p-4 shadow-sm bg-white dark:bg-gray-900">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={teamChartData} margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 25
                }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60} 
                    tick={{ fontSize: 12 }} 
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, "Team Average"]} 
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="percent" 
                    stroke="#6366f1" 
                    name="Team Progress" 
                    strokeWidth={2}
                    dot={{ stroke: '#6366f1', strokeWidth: 2, r: 4 }}
                    activeDot={{ stroke: '#4f46e5', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          {/* Individual Progress Tab */}
          <TabsContent value="individual" className="space-y-6">
            <div className="space-y-4 mb-6 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-semibold">Individual Progress</h3>
              <p className="text-sm text-muted-foreground">Progress of each team member based on their latest skill assessments.</p>
            </div>
            
            {individualProgressData.length > 0 ? (
              <div className="space-y-8">
                {individualProgressData.map(employee => {
                  // Find this employee's progress over time data
                  const employeeOverTimeData = individualProgressOverTimeData.find(emp => emp.id === employee.id);
                  
                  return (
                    <div key={employee.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{employee.name}</h4>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{employee.percent}% Complete</span>
                      </div>
                      <Progress value={employee.percent} className="h-3 bg-gray-100 dark:bg-gray-800" />
                      <p className="text-xs text-muted-foreground mt-2 mb-4">Skills assessed: {employee.skillCount}/{skills.length}</p>
                      
                      {/* Individual progress chart */}
                      {employeeOverTimeData && employeeOverTimeData.data.length > 1 ? (
                        <div className="h-48 mt-4 border-t pt-4">
                          <h5 className="text-sm font-medium mb-2">Progress Over Time</h5>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart 
                              data={employeeOverTimeData.data} 
                              margin={{
                                top: 5,
                                right: 20,
                                left: 0,
                                bottom: 20
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                              <XAxis 
                                dataKey="name" 
                                angle={-45} 
                                textAnchor="end" 
                                height={50} 
                                tick={{ fontSize: 10 }} 
                              />
                              <YAxis domain={[0, 100]} />
                              <Tooltip 
                                formatter={(value) => [`${value}%`, "Skill Level"]} 
                                contentStyle={{ 
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                                  border: '1px solid #f0f0f0',
                                  borderRadius: '8px',
                                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                }} 
                              />
                              <Line 
                                type="monotone" 
                                dataKey="percent" 
                                stroke="#8884d8" 
                                name="Skill Progress" 
                                strokeWidth={2}
                                dot={{ stroke: '#8884d8', strokeWidth: 2, r: 3 }}
                                activeDot={{ stroke: '#6b46c1', strokeWidth: 2, r: 5 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-4 border-t pt-4">
                          Not enough historical data to show progress over time.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border rounded-md p-8 text-center">
                <p className="text-muted-foreground">No individual progress data available.</p>
              </div>
            )}
            
            <div className="h-72 border rounded-xl p-4 shadow-sm bg-white dark:bg-gray-900">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={individualProgressData} 
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 30,
                    left: 100,
                    bottom: 5
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={90}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, "Completion"]} 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Legend />
                  <Bar 
                    dataKey="percent" 
                    name="Skill Progress" 
                    fill="#6366f1" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          {/* Progress Over Time Tab */}
          <TabsContent value="overtime" className="space-y-6">
            <div className="space-y-4 mb-6 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-semibold">Individual Progress Over Time</h3>
              <p className="text-sm text-muted-foreground">Track how each team member's skills have developed over time.</p>
              
              {/* Employee selector */}
              <div className="mt-4">
                <label htmlFor="employee-select" className="block text-sm font-medium mb-2">Select Team Member:</label>
                <select 
                  id="employee-select"
                  className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  value={selectedEmployeeId || (individualProgressOverTimeData[0]?.id || '')}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                >
                  {individualProgressOverTimeData.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {selectedEmployeeData ? (
              <>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{selectedEmployeeData.name}</h4>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                      {selectedEmployeeData.data[selectedEmployeeData.data.length - 1]?.percent || 0}% Current
                    </span>
                  </div>
                  <Progress 
                    value={selectedEmployeeData.data[selectedEmployeeData.data.length - 1]?.percent || 0} 
                    className="h-3 bg-gray-100 dark:bg-gray-800" 
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Progress from {selectedEmployeeData.data[0]?.percent || 0}% to {selectedEmployeeData.data[selectedEmployeeData.data.length - 1]?.percent || 0}%
                  </p>
                </div>
                
                <div className="h-72 border rounded-xl p-4 shadow-sm bg-white dark:bg-gray-900">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={selectedEmployeeData.data} 
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 25
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={50} 
                        tick={{ fontSize: 12 }} 
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, "Skill Level"]} 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                          border: '1px solid #f0f0f0',
                          borderRadius: '8px',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                        }} 
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="percent" 
                        stroke="#8884d8" 
                        name={`${selectedEmployeeData.name}'s Progress`} 
                        strokeWidth={2}
                        dot={{ stroke: '#8884d8', strokeWidth: 2, r: 4 }}
                        activeDot={{ stroke: '#6b46c1', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="border rounded-md p-8 text-center">
                <p className="text-muted-foreground">No individual progress data available over time.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
