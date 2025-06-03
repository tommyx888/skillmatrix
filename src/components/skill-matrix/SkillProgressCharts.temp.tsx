import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { MatrixHistoryEntry } from "@/services/matrixProgressService";
import type { EmployeeData, SkillData } from "@/types/skills";

interface SkillProgressChartsProps {
  snapshotData: MatrixHistoryEntry[];
  chartType: 'team' | 'individuals';
  employees: EmployeeData[];
  skills: SkillData[];
}

const SkillProgressCharts: React.FC<SkillProgressChartsProps> = ({
  snapshotData,
  chartType,
  employees,
  skills
}) => {
  // Process the snapshot data for the chart
  const chartData = useMemo(() => {
    if (!snapshotData || snapshotData.length === 0) return [];
    
    // Sort snapshots by date
    const sortedSnapshots = [...snapshotData].sort((a, b) => 
      new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
    );
    
    return sortedSnapshots.map(snapshot => {
      const employeeSkills = snapshot.employee_skills || {};
      const totalSkillCount = employees.length * skills.length;
      let totalSkillValue = 0;
      let filledSkillCount = 0;
      
      employees.forEach(emp => {
        const empSkills = employeeSkills[emp.id] || {};
        skills.forEach(skill => {
          if (typeof empSkills[skill.id] === 'number') {
            totalSkillValue += empSkills[skill.id];
            filledSkillCount++;
          }
        });
      });
      
      // Use max skill level from skill definition or default to 4
      const maxSkillLevel = 4;
      const percent = totalSkillCount > 0 ? 
        (totalSkillValue / (totalSkillCount * maxSkillLevel)) * 100 : 0;
      
      return {
        date: new Date(snapshot.snapshot_date).toLocaleDateString(),
        percent: Math.round(percent * 10) / 10,
        name: snapshot.snapshot_name || 
          new Date(snapshot.snapshot_date).toLocaleDateString()
      };
    });
  }, [snapshotData, employees, skills]);
  
  // If no data is available, show a message
  if (!snapshotData || snapshotData.length === 0) {
    return (
      <Card className="mt-6 shadow-md border border-primary/10 rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-b">
          <CardTitle className="text-xl font-bold">Team Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No progression data available. Save multiple snapshots to visualize skill progression.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate latest progress percentage
  const latestProgress = chartData.length > 0 ? chartData[chartData.length - 1].percent : 0;
  
  return (
    <Card className="mt-6 shadow-md border border-primary/10 rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-b">
        <CardTitle className="text-xl font-bold">Team Progress Over Time</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4 mb-6 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-semibold">Overall Team Progress</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Latest Progress</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{latestProgress}% Complete</span>
            </div>
            <Progress value={latestProgress} className="h-4 bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
        
        <div className="h-72 border rounded-xl p-4 shadow-sm bg-white dark:bg-gray-900">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{
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
      </CardContent>
    </Card>
  );
};

export default SkillProgressCharts;
