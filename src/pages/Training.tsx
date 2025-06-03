
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, MapPin } from "lucide-react";

const Training = () => {
  // Mock training data - in a real app, this would come from a database or API
  const trainings = [
    {
      id: 1,
      name: "Safety 1",
      skill: "Safety Standards",
      location: "In-house",
      startDate: "2024-10-01",
      status: "On going",
      trainees: ["Peter Martinez", "Eva Mendez"]
    },
    {
      id: 2,
      name: "MS Office 365",
      skill: "MS Office knowledge",
      location: "Online",
      startDate: "2024-09-25",
      status: "On going",
      trainees: ["Martin Krane", "Oliver Novak"]
    },
    {
      id: 3,
      name: "Process Improvement",
      skill: "Process Management",
      location: "In-house",
      startDate: "2024-11-01",
      status: "On going",
      trainees: ["Elena Vagner", "Roman Zach"]
    },
    {
      id: 4,
      name: "Problem-solving Workshop",
      skill: "Problem Solving",
      location: "Online",
      startDate: "2024-09-05",
      status: "On going",
      trainees: ["Michael Kors", "Kevin Logan"]
    },
    {
      id: 5,
      name: "Welding Basics",
      skill: "Welding",
      location: "Online", 
      startDate: "2024-10-01",
      status: "On going",
      trainees: ["Elena Vagner", "Roman Zach", "Michael Kors", "Kevin Logan"]
    }
  ];

  const selectedTraining = trainings[4]; // Welding Basics, as shown in the screenshot

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training and Develop Team</h1>
          <p className="text-muted-foreground mt-1">
            Manage, schedule, and track training activities and employee development
          </p>
        </div>
        
        <Tabs defaultValue="trainings">
          <TabsList>
            <TabsTrigger value="trainings">Trainings</TabsTrigger>
            <TabsTrigger value="matrix">Training Matrix - My Team</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="trainings" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Trainings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Training name</TableHead>
                          <TableHead>Skill</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trainings.map((training) => (
                          <TableRow key={training.id}>
                            <TableCell className="font-medium">{training.name}</TableCell>
                            <TableCell>{training.skill}</TableCell>
                            <TableCell>{training.location}</TableCell>
                            <TableCell>{new Date(training.startDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                                {training.status}
                              </Badge>
                            </TableCell>
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
                    <CardTitle>{selectedTraining.name}</CardTitle>
                    <div className="text-sm text-muted-foreground">General Information</div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium">Name</div>
                        <div>{selectedTraining.name}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium">Skill</div>
                        <div className="flex items-center gap-2">
                          <svg viewBox="0 0 24 24" className="w-4 h-4">
                            <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                          </svg>
                          <span>MS Office knowledge</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium">Location</div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedTraining.location}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium">Duration</div>
                        <div>2 Days</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium">Capacity</div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">Used: 18</Badge>
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">Total: 20</Badge>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium">Start Date</div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(selectedTraining.startDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium">Status</div>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {selectedTraining.status}
                        </Badge>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium">Language</div>
                        <div>EN</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium">Total Cost</div>
                        <div>5000 €</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium flex gap-2 items-center">
                          <Users className="w-4 h-4" />
                          <span>Trainees</span>
                        </div>
                        <div className="mt-2 space-y-2">
                          {selectedTraining.trainees.map((trainee, index) => (
                            <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                              <svg viewBox="0 0 24 24" className="w-4 h-4">
                                <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></circle>
                              </svg>
                              <span>{trainee}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="matrix" className="mt-4">
            <div className="bg-muted/40 p-6 rounded-lg text-center">
              <h3 className="text-lg font-medium">Training Matrix - My Team</h3>
              <p className="text-muted-foreground mt-2">
                View and manage training activities specific to your team.
                This feature will be available in the next release.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="overview" className="mt-4">
            <div className="bg-muted/40 p-6 rounded-lg text-center">
              <h3 className="text-lg font-medium">Training Overview</h3>
              <p className="text-muted-foreground mt-2">
                Get a high-level view of all training activities and progress across teams.
                This feature will be available in the next release.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Training;
