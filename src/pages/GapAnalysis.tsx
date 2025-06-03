
import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const GapAnalysis = () => {
  const [chartType, setChartType] = useState<"bar" | "line">("line");
  
  // Mock data for teams gap analysis
  const skills = [
    "Security", "Software Development", "Data Management", "Infrastructure Management", 
    "Network Management", "Asset Management", "Support Management", "Project Office Skills", 
    "Microsoft Office Skills", "Testing", "Management", "Marketing"
  ];
  
  const teams = [
    {
      name: "Team A",
      requiredStaff: {
        "Security": 2, "Software Development": 8, "Data Management": 4, "Infrastructure Management": 12,
        "Network Management": 4, "Asset Management": 2, "Support Management": 4, "Project Office Skills": 5,
        "Microsoft Office Skills": 5, "Testing": 12, "Management": 12, "Marketing": 1
      },
      capableStaff: 5,
      requiredCapableStaff: 5,
      capabilityGap: 28,
      capabilityScore: "65%"
    },
    {
      name: "Team B",
      requiredStaff: {
        "Security": 2, "Software Development": 8, "Data Management": 4, "Infrastructure Management": 5,
        "Network Management": 1, "Asset Management": 2, "Support Management": 6, "Project Office Skills": 3,
        "Microsoft Office Skills": 12, "Testing": 12, "Management": 12, "Marketing": 0
      },
      capableStaff: 4,
      requiredCapableStaff: 6,
      capabilityGap: 36,
      capabilityScore: "48%"
    },
    {
      name: "Team C",
      requiredStaff: {
        "Security": 2, "Software Development": 7, "Data Management": 4, "Infrastructure Management": 7,
        "Network Management": 2, "Asset Management": 8, "Support Management": 2, "Project Office Skills": 4,
        "Microsoft Office Skills": 7, "Testing": 12, "Management": 12, "Marketing": 2
      },
      capableStaff: 3,
      requiredCapableStaff: 6,
      capabilityGap: 45,
      capabilityScore: "35%"
    }
  ];

  // Calculate summary for all teams
  const calculateSummary = () => {
    const summary: Record<string, number> = {};
    
    skills.forEach(skill => {
      summary[skill] = teams.reduce((total, team) => total + team.requiredStaff[skill], 0);
    });
    
    return summary;
  };
  
  const summaryData = calculateSummary();

  // Helper function to determine cell color based on value
  const getCellColorClass = (value: number) => {
    if (value <= 3) return "bg-red-200 text-red-800";
    if (value <= 6) return "bg-orange-200 text-orange-800";
    if (value <= 9) return "bg-yellow-200 text-yellow-800";
    return "bg-green-200 text-green-800";
  };

  // Generate mock trend data for Overall Team Score
  const trendData = [
    { date: "Jan 2025", averageScore: 2.1, percentComplete: 42 },
    { date: "Feb 2025", averageScore: 2.4, percentComplete: 48 },
    { date: "Mar 2025", averageScore: 2.8, percentComplete: 56 },
    { date: "Apr 2025", averageScore: 3.2, percentComplete: 64 },
    { date: "May 2025", averageScore: 3.5, percentComplete: 70 },
  ];

  // Generate mock data for team skills comparison
  const teamSkillsData = [
    { date: "Jan 2025", Security: 1.5, "Software Development": 2.0, "Data Management": 2.2, "Infrastructure Management": 1.8, "Network Management": 2.5 },
    { date: "Feb 2025", Security: 1.8, "Software Development": 2.3, "Data Management": 2.4, "Infrastructure Management": 2.0, "Network Management": 2.7 },
    { date: "Mar 2025", Security: 2.2, "Software Development": 2.5, "Data Management": 2.8, "Infrastructure Management": 2.3, "Network Management": 3.0 },
    { date: "Apr 2025", Security: 2.6, "Software Development": 2.8, "Data Management": 3.0, "Infrastructure Management": 2.7, "Network Management": 3.3 },
    { date: "May 2025", Security: 3.0, "Software Development": 3.2, "Data Management": 3.5, "Infrastructure Management": 3.0, "Network Management": 3.5 },
  ];

  // Generate colors for skills
  const skillColors = {
    "Security": "#8884d8",
    "Software Development": "#82ca9d",
    "Data Management": "#ffc658",
    "Infrastructure Management": "#ff8042",
    "Network Management": "#0088FE",
    "Asset Management": "#00C49F",
    "Support Management": "#FFBB28",
    "Project Office Skills": "#FF8042",
    "Microsoft Office Skills": "#a4de6c",
    "Testing": "#d0ed57",
    "Management": "#25CCF7",
    "Marketing": "#FD7272"
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams Gap Analysis Matrix</h1>
          <p className="text-muted-foreground mt-1">
            Identify skill gaps and plan targeted training to improve team capabilities
          </p>
        </div>
        
        <Tabs defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Capability Summary per Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Teams</TableHead>
                        {skills.map((skill, index) => (
                          <TableHead key={index} className="text-center min-w-[80px]">
                            <div className="transform -rotate-45 origin-left text-xs truncate w-20">
                              {skill}
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center">Count of Capable Staff</TableHead>
                        <TableHead className="text-center">Required Capable Staff</TableHead>
                        <TableHead className="text-center">Capability Gap</TableHead>
                        <TableHead className="text-center">Current Capability %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teams.map((team, teamIndex) => (
                        <TableRow key={teamIndex}>
                          <TableCell className="font-medium">{team.name}</TableCell>
                          {skills.map((skill, skillIndex) => (
                            <TableCell 
                              key={skillIndex} 
                              className={`text-center font-medium ${getCellColorClass(team.requiredStaff[skill])}`}
                            >
                              {team.requiredStaff[skill]}
                            </TableCell>
                          ))}
                          <TableCell className="text-center font-medium">{team.capableStaff}</TableCell>
                          <TableCell className="text-center font-medium">{team.requiredCapableStaff}</TableCell>
                          <TableCell className="text-center font-medium">{team.capabilityGap}</TableCell>
                          <TableCell className="text-center font-medium">{team.capabilityScore}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-medium">Summary GAP (All Teams)</TableCell>
                        {skills.map((skill, skillIndex) => (
                          <TableCell 
                            key={skillIndex} 
                            className={`text-center font-medium ${getCellColorClass(summaryData[skill])}`}
                          >
                            {summaryData[skill]}
                          </TableCell>
                        ))}
                        <TableCell colSpan={4}></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                  {teams.map((team, index) => (
                    <div key={index}>
                      <h3 className="font-medium mb-2 text-center">{team.name}</h3>
                      <div className="relative w-32 h-32 mx-auto">
                        <div className="absolute inset-0 rounded-full bg-red-300"></div>
                        <div 
                          className="absolute inset-0 rounded-full bg-green-300"
                          style={{
                            clipPath: `polygon(0 0, 100% 0, 100% ${100 - parseInt(team.capabilityScore)}%, 0 ${100 - parseInt(team.capabilityScore)}%)`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  <div>
                    <h3 className="font-medium mb-2 text-center">ALL Shifts</h3>
                    <div className="relative w-32 h-32 mx-auto">
                      <div className="absolute inset-0 rounded-full bg-red-300"></div>
                      <div 
                        className="absolute inset-0 rounded-full bg-green-300"
                        style={{
                          clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)"
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4">
            <div className="bg-muted/40 p-6 rounded-lg text-center">
              <h3 className="text-lg font-medium">Gap Analysis Settings</h3>
              <p className="text-muted-foreground mt-2">
                Configure thresholds, visualization options, and metrics for gap analysis.
                This feature will be available in the next release.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Skill Progress Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="teamProgress" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="teamProgress">Team Progress</TabsTrigger>
                <TabsTrigger value="individualProgress">Individual Progress</TabsTrigger>
              </TabsList>
              
              <TabsContent value="teamProgress" className="space-y-4">
                <div className="flex justify-end space-x-2 mb-2">
                  <TabsList className="h-8">
                    <TabsTrigger 
                      value="line" 
                      className={`h-8 px-3 ${chartType === 'line' ? 'bg-primary' : ''}`} 
                      onClick={() => setChartType("line")}
                    >
                      Line
                    </TabsTrigger>
                    <TabsTrigger 
                      value="bar" 
                      className={`h-8 px-3 ${chartType === 'bar' ? 'bg-primary' : ''}`} 
                      onClick={() => setChartType("bar")}
                    >
                      Bar
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                {/* Overall Team Score Trend - Moved Above */}
                <div className="h-48 border rounded-md p-4">
                  <h3 className="text-sm font-medium mb-2">Overall Team Score Trend</h3>
                  <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={trendData} margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5
                    }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip formatter={(value, name) => {
                        if (name === "averageScore") return [`${value}/5`, "Average Score"];
                        if (name === "percentComplete") return [`${value}%`, "Completion"];
                        return [value, name];
                      }} />
                      <Line type="monotone" dataKey="averageScore" stroke="#8884d8" name="Average Score" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Overall Team Progress */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-sm font-medium">Overall Team Progress</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Latest Score: {trendData[trendData.length - 1].averageScore}/5</span>
                      <span>{trendData[trendData.length - 1].percentComplete}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-primary h-4 rounded-full" 
                        style={{ width: `${trendData[trendData.length - 1].percentComplete}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Team Skills Chart - Changed to use chartType state */}
                <div className="h-72 border rounded-md p-4">
                  {chartType === "line" ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={teamSkillsData} margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 25
                      }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" angle={-45} textAnchor="end" height={50} tick={{
                          fontSize: 12
                        }} />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Legend />
                        {Object.keys(skillColors).slice(0, 5).map((skillName) => (
                          <Line 
                            key={skillName} 
                            type="monotone" 
                            dataKey={skillName} 
                            stroke={skillColors[skillName as keyof typeof skillColors]} 
                            activeDot={{r: 8}} 
                            name={skillName} 
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={teamSkillsData} margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 25
                      }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" angle={-45} textAnchor="end" height={50} tick={{
                          fontSize: 12
                        }} />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Legend />
                        {Object.keys(skillColors).slice(0, 5).map((skillName) => (
                          <Bar 
                            key={skillName} 
                            dataKey={skillName} 
                            fill={skillColors[skillName as keyof typeof skillColors]} 
                            name={skillName} 
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="individualProgress" className="space-y-4">
                <div className="space-y-4 mb-4">
                  <h3 className="text-sm font-medium">Individual Progress Overview</h3>
                  {teams.map((team, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{team.name}</span>
                        <span>{team.capabilityScore}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-primary h-4 rounded-full" 
                          style={{ width: team.capabilityScore }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default GapAnalysis;
