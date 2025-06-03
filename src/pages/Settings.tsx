
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const Settings = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your skill matrix, manage team structures, and customize assessment criteria
          </p>
        </div>
        
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="matrix">Matrix Configuration</TabsTrigger>
            <TabsTrigger value="teams">Team Management</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure the general settings for your Skill Matrix application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input id="org-name" defaultValue="Acme Corporation" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Administrator Email</Label>
                  <Input id="admin-email" type="email" defaultValue="admin@example.com" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <Switch id="notifications" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="analytics">Usage Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Collect anonymous usage data to improve the application
                    </p>
                  </div>
                  <Switch id="analytics" defaultChecked />
                </div>
                
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="matrix" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Matrix Configuration</CardTitle>
                <CardDescription>
                  Customize your skill matrix structure, categories, and assessment criteria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="matrix-type">Matrix Type</Label>
                  <Select defaultValue="custom">
                    <SelectTrigger id="matrix-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="industry">Industry Specific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rating-scale">Rating Scale</Label>
                  <Select defaultValue="0-4">
                    <SelectTrigger id="rating-scale">
                      <SelectValue placeholder="Select scale" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-4">0-4 Scale</SelectItem>
                      <SelectItem value="1-5">1-5 Scale</SelectItem>
                      <SelectItem value="1-10">1-10 Scale</SelectItem>
                      <SelectItem value="custom">Custom Scale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="assessment-frequency">Assessment Frequency</Label>
                  <Select defaultValue="quarterly">
                    <SelectTrigger id="assessment-frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="biannually">Bi-annually</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="self-assessment">Self Assessment</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow employees to provide self-assessment input
                    </p>
                  </div>
                  <Switch id="self-assessment" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="peer-review">Peer Review</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable peer review for skill assessments
                    </p>
                  </div>
                  <Switch id="peer-review" />
                </div>
                
                <Button>Save Configuration</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="teams" className="mt-6">
            <div className="bg-muted/40 p-6 rounded-lg text-center">
              <h3 className="text-lg font-medium">Team Management</h3>
              <p className="text-muted-foreground mt-2">
                Create and manage team structures, hierarchies, and member assignments.
                This feature will be available in the next release.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="integrations" className="mt-6">
            <div className="bg-muted/40 p-6 rounded-lg text-center">
              <h3 className="text-lg font-medium">Integrations</h3>
              <p className="text-muted-foreground mt-2">
                Connect with other systems like HR software, training platforms, and more.
                This feature will be available in the next release.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;
