import React, { useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      
      return {
        date: new Date(snapshot.snapshot_date).toLocaleDateString(),
        percent: Math.round(percent * 10) / 10,
        name: snapshot.snapshot_name || 
          new Date(snapshot.snapshot_date).toLocaleDateString(),
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
      
      // Calculate skill values for this employee
      skills.forEach(skill => {
        if (typeof empSkills[skill.id] === 'number') {
          totalSkillValue += empSkills[skill.id];
          filledSkillCount++;
        }
      });
      
      // Use max skill level from skill definition or default to 4
      const maxSkillLevel = 4;
      const percent = filledSkillCount > 0 ? 
        (totalSkillValue / (filledSkillCount * maxSkillLevel)) * 100 : 0;
      
      return {
        id: employee.id,
        name: employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim(),
        percent: Math.round(percent * 10) / 10,
        skillCount: filledSkillCount
      };
    }).sort((a, b) => b.percent - a.percent); // Sort by highest percent first
  }, [snapshotData, employees, skills]);
  
  // Process individual employee progress over time
  const individualProgressOverTimeData = useMemo(() => {
    if (!snapshotData || snapshotData.length === 0 || !employees.length) return [];
    
    // Sort snapshots by date (oldest to newest)
    const sortedSnapshots = [...snapshotData].sort((a, b) => 
      new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
    );
    
    // Create a map of employee progress over time
    const employeeProgressMap: Record<string, EmployeeProgressOverTime> = {};
    
    // Initialize with all employees we want to track
    employees.forEach(emp => {
      employeeProgressMap[emp.id] = {
        id: emp.id,
        name: emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
        data: []
      };
    });
    
    // Process each snapshot to build progress data for each employee
    sortedSnapshots.forEach(snapshot => {
      const employeeSkills = snapshot.employee_skills || {};
      const snapshotDate = new Date(snapshot.snapshot_date).toLocaleDateString();
      
      // For each employee, calculate their progress in this snapshot
      Object.keys(employeeProgressMap).forEach(empId => {
        const empSkills = employeeSkills[empId] || {};
        let totalSkillValue = 0;
        let filledSkillCount = 0;
        
        // Calculate skill values for this employee in this snapshot
        skills.forEach(skill => {
          if (typeof empSkills[skill.id] === 'number') {
            totalSkillValue += empSkills[skill.id];
            filledSkillCount++;
          }
        });
        
        // Use max skill level from skill definition or default to 4
        const maxSkillLevel = 4;
        const percent = filledSkillCount > 0 ? 
          (totalSkillValue / (filledSkillCount * maxSkillLevel)) * 100 : 0;
        
        // Add this data point to the employee's progress data
        employeeProgressMap[empId].data.push({
          date: snapshotDate,
          percent: Math.round(percent * 10) / 10,
          name: snapshot.snapshot_name || snapshotDate
        });
      });
    });
    
    // Convert the map to an array and filter out employees with no data
    return Object.values(employeeProgressMap)
      .filter(emp => emp.data.length > 0)
      .sort((a, b) => {
        // Sort by the latest percent value (highest first)
        const aLatest = a.data.length > 0 ? a.data[a.data.length - 1].percent : 0;
        const bLatest = b.data.length > 0 ? b.data[b.data.length - 1].percent : 0;
        return bLatest - aLatest;
      });
  }, [snapshotData, employees, skills]);
  
  // Get the selected employee data for individual progress over time
  const selectedEmployeeData = useMemo(() => {
    if (!selectedEmployeeId) {
      // If no employee is selected, use the first one
      return individualProgressOverTimeData.length > 0 ? individualProgressOverTimeData[0] : null;
    }
    
    return individualProgressOverTimeData.find(emp => emp.id === selectedEmployeeId) || null;
  }, [individualProgressOverTimeData, selectedEmployeeId]);
  
  // If no data is available, show a message
  if (!snapshotData || snapshotData.length === 0) {
    return (
      <Card className="mt-6 shadow-md border border-primary/10 rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-b">
          <CardTitle className="text-xl font-bold">Skill Progress</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground py-8">No performance data available. Save matrix snapshots to track progress over time.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate latest progress percentage
  const latestTeamProgress = teamChartData.length > 0 ? teamChartData[teamChartData.length - 1].percent : 0;
  
  return (
    <Card className="mt-6 shadow-md border border-primary/10 rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-b">
        <CardTitle className="text-xl font-bold">Skill Progress Visualization</CardTitle>
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
                <Progress value={latestTeamProgress} className="h-4 bg-gray-100 dark:bg-gray-800" />
              </div>
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
                    dataKey="date" 
                    angle={-45} 
                    textAnchor="end" 
                    height={50} 
                    tick={{ fontSize: 12 }} 
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, "Team Completion"]} 
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
              <h3 className="text-lg font-semibold">Individual Team Member Progress</h3>
              <p className="text-sm text-muted-foreground">Progress of each team member based on their latest skill assessments.</p>
            </div>
            
            {individualProgressData.length > 0 ? (
              <div className="space-y-4">
                {individualProgressData.map(employee => (
                  <div key={employee.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{employee.name}</h4>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{employee.percent}% Complete</span>
                    </div>
                    <Progress value={employee.percent} className="h-3 bg-gray-100 dark:bg-gray-800" />
                    <p className="text-xs text-muted-foreground mt-2">Skills assessed: {employee.skillCount}/{skills.length}</p>
                  </div>
                ))}
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
                        dataKey="date" 
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
