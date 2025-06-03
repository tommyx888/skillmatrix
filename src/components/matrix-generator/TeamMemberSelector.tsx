
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, UserX, Filter, SortAsc, Loader2 } from "lucide-react";
import { TeamMember } from "@/types/skills";
import { supabase, fetchPaginatedEmployees } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { 
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TeamMemberSelectorProps {
  availableMembers: TeamMember[];
  selectedMembers: TeamMember[];
  onAddMember: (member: TeamMember) => void;
  onRemoveMember: (memberId: string) => void;
  editMode?: boolean;
  showSearch?: boolean;
  readOnly?: boolean;
}

const TeamMemberSelector: React.FC<TeamMemberSelectorProps> = ({
  availableMembers = [],
  selectedMembers = [],
  onAddMember,
  onRemoveMember,
  editMode = false,
  showSearch = false,
  readOnly = false
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [employeeList, setEmployeeList] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;
  
  const fetchEmployees = useCallback(async (page = 0, append = false) => {
    setLoadingEmployees(true);
    try {
      const data = await fetchPaginatedEmployees(page, pageSize, employeeSearchQuery);
      
      // Format employee data and filter out those who are already selected
      const formattedData = data.map(employee => ({
        id: employee.id,
        name: `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || `Employee ${employee.id}`,
        employee_id: employee.employee_id || 'N/A',
        hire_date: employee.hire_date || 'N/A',
        employer: employee.employer || 'N/A'
      })).filter(employee => 
        !selectedMembers.some(member => member.id === employee.id)
      );
      
      if (append) {
        setEmployeeList(prev => [...prev, ...formattedData]);
      } else {
        setEmployeeList(formattedData);
      }
      
      // Check if we have more data
      setHasMore(data.length === pageSize);
      setCurrentPage(page);
    } catch (error) {
      console.error("Exception fetching employees:", error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive"
      });
    } finally {
      setLoadingEmployees(false);
    }
  }, [pageSize, employeeSearchQuery, selectedMembers]);
  
  const loadMore = useCallback(() => {
    if (!loadingEmployees && hasMore) {
      fetchEmployees(currentPage + 1, true);
    }
  }, [fetchEmployees, currentPage, loadingEmployees, hasMore]);
  
  useEffect(() => {
    if (commandDialogOpen || isDrawerOpen) {
      // Reset to page 0 when search changes
      fetchEmployees(0, false);
    }
  }, [commandDialogOpen, isDrawerOpen, employeeSearchQuery, fetchEmployees]);
  
  // Filter available members based on search query
  const filteredAvailableMembers = Array.isArray(availableMembers) ? availableMembers.filter(
    (member) => 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.employee_id && member.employee_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (member.hire_date && member.hire_date.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (member.employer && member.employer.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];
  
  // Filter selected members based on member search query
  const filteredSelectedMembers = Array.isArray(selectedMembers) ? selectedMembers.filter(
    (member) => 
      member.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      (member.employee_id && member.employee_id.toLowerCase().includes(memberSearchQuery.toLowerCase())) ||
      (member.role && member.role.toLowerCase().includes(memberSearchQuery.toLowerCase())) ||
      (member.department && member.department.toLowerCase().includes(memberSearchQuery.toLowerCase()))
  ) : [];
  
  const isSelected = (memberId: string) => 
    Array.isArray(selectedMembers) && selectedMembers.some((member) => member.id === memberId);
  
  const openCommandSearch = () => {
    setCommandDialogOpen(true);
    fetchEmployees(0, false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Vybraní členovia tímu</CardTitle>
            {editMode && (
              <div className="flex space-x-2">
                <CommandDialog open={commandDialogOpen} onOpenChange={setCommandDialogOpen}>
                  <CommandInput 
                    placeholder="Hľadať zamestnancov podľa mena, ID alebo zamestnávateľa..." 
                    value={employeeSearchQuery}
                    onValueChange={(value) => {
                      setEmployeeSearchQuery(value);
                      // Reset page when search changes
                      setCurrentPage(0);
                    }}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {loadingEmployees ? 
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
                          Načítavam zamestnancov...
                        </div> : 
                        "Nenašli sa žiadni zamestnanci."
                      }
                    </CommandEmpty>
                    <CommandGroup heading="Zamestnanci">
                      <ScrollArea className="h-[300px]">
                        {employeeList.map((employee) => (
                          <CommandItem
                            key={employee.id}
                            value={`${employee.name}-${employee.employee_id || ''}`}
                            className="flex justify-between items-center p-2 hover:bg-accent cursor-pointer rounded-md"
                            onSelect={() => {
                              onAddMember(employee);
                              // Remove the added employee from the list
                              setEmployeeList(list => list.filter(e => e.id !== employee.id));
                              toast({
                                title: "Člen tímu pridaný",
                                description: `${employee.name} bol pridaný do tímu.`
                              });
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{employee.name}</span>
                              <span className="text-muted-foreground text-sm">
                                {employee.employee_id || "—"}
                              </span>
                            </div>
                            <span className="text-muted-foreground text-sm">
                              {employee.employer || "—"}
                            </span>
                          </CommandItem>
                        ))}
                        
                        {hasMore && (
                          <div className="p-2 flex justify-center">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={loadMore}
                              disabled={loadingEmployees}
                              className="w-full"
                            >
                              {loadingEmployees ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Loading more...
                                </>
                              ) : (
                                "Load more employees"
                              )}
                            </Button>
                          </div>
                        )}
                      </ScrollArea>
                    </CommandGroup>
                  </CommandList>
                </CommandDialog>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={openCommandSearch}
                  className="transition-all hover:bg-primary hover:text-white"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Members
                </Button>
                
                <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                  <DrawerTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="md:hidden transition-all hover:bg-primary hover:text-white"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Members
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[85vh]">
                    <DrawerHeader>
                      <DrawerTitle>Add Team Members</DrawerTitle>
                      <DrawerDescription>
                        Search for employees to add to your team matrix.
                      </DrawerDescription>
                    </DrawerHeader>
                    
                    <div className="px-4 py-2">
                      <div className="relative mb-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search employees..." 
                          className="pl-8"
                          value={employeeSearchQuery}
                          onChange={(e) => {
                            setEmployeeSearchQuery(e.target.value);
                            // Reset page when search changes
                            setCurrentPage(0);
                          }}
                        />
                      </div>
                      
                      {loadingEmployees && currentPage === 0 ? (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
                          <span>Loading employees...</span>
                        </div>
                      ) : (
                        <ScrollArea className="max-h-[50vh]">
                          <div className="rounded-md border">
                            {employeeList.length > 0 ? (
                              <div className="divide-y">
                                {employeeList.map((employee) => (
                                  <div 
                                    key={employee.id}
                                    className="flex items-center justify-between p-3 hover:bg-accent/20 transition-colors"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{employee.name}</span>
                                      <div className="text-sm text-muted-foreground flex space-x-2">
                                        <span>{employee.employee_id || "—"}</span>
                                        <span>•</span>
                                        <span>{employee.employer || "—"}</span>
                                      </div>
                                    </div>
                                    <Button 
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        onAddMember(employee);
                                        // Remove the added employee from the list
                                        setEmployeeList(list => list.filter(e => e.id !== employee.id));
                                        toast({
                                          title: "Team member added",
                                          description: `${employee.name} has been added to the team.`
                                        });
                                      }}
                                    >
                                      <UserPlus className="h-4 w-4 text-primary" />
                                    </Button>
                                  </div>
                                ))}
                                
                                {hasMore && (
                                  <div className="p-3 flex justify-center">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={loadMore}
                                      disabled={loadingEmployees}
                                      className="w-full"
                                    >
                                      {loadingEmployees ? (
                                        <>
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                          Loading more...
                                        </>
                                      ) : (
                                        "Load more employees"
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-4 text-center text-muted-foreground">
                                {employeeSearchQuery ? "No employees found matching your search." : "No available employees found."}
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                    
                    <DrawerFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsDrawerOpen(false)}
                      >
                        Close
                      </Button>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search input for selected team members */}
          {selectedMembers.length > 0 && (
            <div className="relative w-full mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search selected members..." 
                className="pl-8"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
              />
            </div>
          )}
          
          {!Array.isArray(selectedMembers) || selectedMembers.length === 0 ? (
            <div className="bg-muted/30 rounded-lg flex flex-col items-center justify-center p-8 text-center">
              <UserPlus className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Žiadni členovia tímu neboli vybraní. {editMode ? "Pridajte členov pomocou tlačidla vyššie." : ""}</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-medium text-center">ID zamestnanca</TableHead>
                    <TableHead className="font-medium">Meno</TableHead>
                    <TableHead className="font-medium hidden md:table-cell">Dátum nástupu</TableHead>
                    <TableHead className="font-medium hidden md:table-cell">Zamestnávateľ</TableHead>
                    <TableHead className="w-[80px] text-right">Akcia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSelectedMembers.map((member) => (
                    <TableRow key={member.id} className="hover:bg-accent/10">
                      <TableCell className="font-mono text-sm text-center">{member.employee_id || "—"}</TableCell>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{member.hire_date || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{member.employer || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onRemoveMember(member.id)}
                          disabled={readOnly}
                          className="hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      
        
      
    </div>
  );
};

export default TeamMemberSelector;
