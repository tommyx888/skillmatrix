
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Award } from "lucide-react";

const Teams = () => {
  // Mock data for teams
  const teams = [
    {
      id: "A",
      name: "Engineering",
      members: 18,
      manager: "Sarah Johnson",
      skillCoverage: 85,
      gapScore: 12,
      trainingInProgress: 4
    },
    {
      id: "B",
      name: "Product Development",
      members: 12,
      manager: "Michael Chen",
      skillCoverage: 78,
      gapScore: 24,
      trainingInProgress: 6
    },
    {
      id: "C",
      name: "Customer Support",
      members: 15,
      manager: "Emily Rodriguez",
      skillCoverage: 62,
      gapScore: 32,
      trainingInProgress: 8
    },
    {
      id: "D",
      name: "Marketing",
      members: 8,
      manager: "David Kim",
      skillCoverage: 75,
      gapScore: 18,
      trainingInProgress: 3
    },
    {
      id: "E",
      name: "Sales",
      members: 10,
      manager: "Jessica Liu",
      skillCoverage: 70,
      gapScore: 22,
      trainingInProgress: 5
    }
  ];

  const skillDistribution = [
    { skill: "Technical Skills", beginner: 15, intermediate: 22, advanced: 18, expert: 8 },
    { skill: "Soft Skills", beginner: 10, intermediate: 25, advanced: 20, expert: 8 },
    { skill: "Leadership", beginner: 22, intermediate: 18, advanced: 12, expert: 5 },
    { skill: "Project Management", beginner: 18, intermediate: 24, advanced: 16, expert: 4 }
  ];

  // Helper to determine skill coverage badge color
  const getSkillCoverageColor = (coverage: number) => {
    if (coverage >= 80) return "bg-green-100 text-green-800";
    if (coverage >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };
  
  // Helper to determine gap score badge color
  const getGapScoreColor = (score: number) => {
    if (score <= 15) return "bg-green-100 text-green-800";
    if (score <= 25) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams Overview</h1>
          <p className="text-muted-foreground mt-1">
            Manage team compositions, analyze skill distribution, and monitor progress
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Teams</p>
                  <p className="text-3xl font-bold">{teams.length}</p>
                </div>
                <div className="rounded-full p-2 bg-purple-100 text-purple-600">
                  <Users size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Skill Coverage</p>
                  <p className="text-3xl font-bold">
                    {Math.round(teams.reduce((acc, team) => acc + team.skillCoverage, 0) / teams.length)}%
                  </p>
                </div>
                <div className="rounded-full p-2 bg-blue-100 text-blue-600">
                  <Award size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Training Activities</p>
                  <p className="text-3xl font-bold">
                    {teams.reduce((acc, team) => acc + team.trainingInProgress, 0)}
                  </p>
                </div>
                <div className="rounded-full p-2 bg-green-100 text-green-600">
                  <BarChart3 size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Team Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team ID</TableHead>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Skill Coverage</TableHead>
                      <TableHead>Gap Score</TableHead>
                      <TableHead>Training</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">Team {team.id}</TableCell>
                        <TableCell>{team.name}</TableCell>
                        <TableCell>{team.members}</TableCell>
                        <TableCell>{team.manager}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getSkillCoverageColor(team.skillCoverage)}>
                            {team.skillCoverage}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getGapScoreColor(team.gapScore)}>
                            {team.gapScore}
                          </Badge>
                        </TableCell>
                        <TableCell>{team.trainingInProgress} active</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Skill Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {skillDistribution.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{item.skill}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.beginner + item.intermediate + item.advanced + item.expert} people
                        </span>
                      </div>
                      <div className="flex h-2 mb-1 overflow-hidden rounded bg-gray-200">
                        <div
                          className="bg-red-300"
                          style={{ width: `${(item.beginner / (item.beginner + item.intermediate + item.advanced + item.expert)) * 100}%` }}
                        ></div>
                        <div
                          className="bg-yellow-300"
                          style={{ width: `${(item.intermediate / (item.beginner + item.intermediate + item.advanced + item.expert)) * 100}%` }}
                        ></div>
                        <div
                          className="bg-green-300"
                          style={{ width: `${(item.advanced / (item.beginner + item.intermediate + item.advanced + item.expert)) * 100}%` }}
                        ></div>
                        <div
                          className="bg-blue-300"
                          style={{ width: `${(item.expert / (item.beginner + item.intermediate + item.advanced + item.expert)) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex text-xs justify-between">
                        <span className="text-red-600">Beginner: {item.beginner}</span>
                        <span className="text-yellow-600">Intermediate: {item.intermediate}</span>
                        <span className="text-green-600">Advanced: {item.advanced}</span>
                        <span className="text-blue-600">Expert: {item.expert}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Teams;
