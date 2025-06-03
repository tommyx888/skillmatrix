import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, ArrowRight, TrendingUp, TrendingDown, Minus, List, ChevronDown, Trash, Edit, X } from "lucide-react";
import type { MatrixHistoryEntry } from "@/services/matrixProgressService";
import { updateSnapshotName } from "@/services/matrixProgressService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SkillData, EmployeeData, MatrixHistoryEntryPreview } from "@/types/skills";
import SkillMatrixTable from "./SkillMatrixTable";
import { SkillProgressCharts } from "./SkillProgressCharts";
import { fetchEmployees } from "@/services/skillMatrixService";
import { fetchSkills } from "@/services/skillMatrixService";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MatrixProgressHistoryProps {
  history: MatrixHistoryEntry[];
  onSelectSnapshot: (snapshot: MatrixHistoryEntry) => void;
  onCompareSnapshots: (snapshotId1: string, snapshotId2: string) => Promise<void>;
  selectedSnapshot: MatrixHistoryEntry | null;
  onDeleteSnapshot: (snapshotId: string) => Promise<boolean | void>;
  onUpdateHistory?: () => void; // Callback pre informovanie rodiča o potrebe obnoviť históriu
}

const MatrixProgressHistory: React.FC<MatrixProgressHistoryProps> = ({
  history,
  onSelectSnapshot,
  onCompareSnapshots,
  selectedSnapshot,
  onDeleteSnapshot,
  onUpdateHistory
}) => {
  const { toast } = useToast();
  const [comparisonSnapshotId, setComparisonSnapshotId] = useState<string | null>(null);
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"dropdown" | "list">("dropdown");
  const [previewData, setPreviewData] = useState<MatrixHistoryEntryPreview | null>(null);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [skills, setSkills] = useState<SkillData[]>([]);
  
  // State pre úpravu názvu snímky priamo v tabuľke (inline editing)
  const [editingSnapshotId, setEditingSnapshotId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  useEffect(() => {
    const loadEmployees = async () => {
      const employeeData = await fetchEmployees();
      setEmployees(employeeData);
    };
    const loadSkills = async () => {
      const skillData = await fetchSkills();
      setSkills(skillData as SkillData[]);
    };
    loadEmployees();
    loadSkills();
  }, []);

  const getEmployeeName = (employeeId: string): string => {
    const employee = employees.find(e => e.id === employeeId);
    
    if (employee) {
      if (employee.name) {
        return employee.name;
      }
      
      if (employee.first_name && employee.last_name) {
        return `${employee.first_name} ${employee.last_name}`;
      } else if (employee.first_name) {
        return employee.first_name;
      } else if (employee.last_name) {
        return employee.last_name;
      }
      
      if (employee.employee_id) {
        return `ID: ${employee.employee_id}`;
      }
    }
    
    return `Employee ${employeeId.substring(0, 8)}...`;
  };

  const getEmployeeId = (employeeId: string): string => {
    const employee = employees.find(e => e.id === employeeId);
    console.log(`Getting employee_id for ${employeeId}:`, employee?.employee_id);
    return employee?.employee_id || '-';
  };

  useEffect(() => {
  if (selectedSnapshot && selectedSnapshot.employee_skills) {
    const employeeData: EmployeeData[] = [];
    const skillsSet = new Set<string>();

    // Prefer snapshot's own matrix_data if available
    const snapshotSkills: SkillData[] = selectedSnapshot.matrix_data?.skills?.length
      ? selectedSnapshot.matrix_data.skills
      : skills;
    const snapshotEmployees: EmployeeData[] = selectedSnapshot.matrix_data?.employees?.length
      ? selectedSnapshot.matrix_data.employees
      : employees;

    // Collect all skill IDs from the snapshot
    Object.entries(selectedSnapshot.employee_skills).forEach(([employeeId, skillsObj]) => {
      Object.keys(skillsObj).forEach(skillId => {
        skillsSet.add(skillId);
      });
    });

    // Map skill IDs to full skill objects
    const skillData: SkillData[] = Array.from(skillsSet).map(skillId => {
      const skill = snapshotSkills.find(s => s.id === skillId);
      return {
        id: skillId,
        name: skill ? skill.name : `Skill ${skillId.substring(0, 4)}...`,
        target_level: skill?.target_level ?? 3
      };
    });

    // Map employee IDs to full employee objects
    Object.entries(selectedSnapshot.employee_skills).forEach(([employeeId, skillsObj]) => {
      // Try to get employee from snapshot's matrix_data.employees or matrix_data.members_data
      let snapshotEmployee = undefined;
      if (selectedSnapshot.matrix_data && Array.isArray(selectedSnapshot.matrix_data.employees)) {
        snapshotEmployee = selectedSnapshot.matrix_data.employees.find((e: any) => e.id === employeeId);
      } else if (selectedSnapshot.matrix_data && Array.isArray(selectedSnapshot.matrix_data.members_data)) {
        snapshotEmployee = selectedSnapshot.matrix_data.members_data.find((e: any) => e.id === employeeId);
      }
      let fullName = '';
      let employeeIdDisplay = '-';
      if (snapshotEmployee) {
        fullName = snapshotEmployee.name || snapshotEmployee.first_name || snapshotEmployee.last_name || '';
        employeeIdDisplay = snapshotEmployee.employee_id || '-';
      } else {
        // fallback to live employees table
        const employee = employees.find(e => e.id === employeeId);
        if (employee) {
          if (employee.first_name && employee.last_name) {
            fullName = `${employee.first_name} ${employee.last_name}`;
          } else if (employee.first_name) {
            fullName = employee.first_name;
          } else if (employee.last_name) {
            fullName = employee.last_name;
          }
          employeeIdDisplay = employee.employee_id || '-';
        }
      }
      if (!fullName) {
        fullName = ` ${employeeId.substring(0, 8)}...`;
      }
      employeeData.push({
        id: employeeId,
        name: fullName,
        employee_id: employeeIdDisplay,
        skills: skillsObj
      });
    });

    setPreviewData({
      id: selectedSnapshot.id,
      matrix_id: selectedSnapshot.matrix_id,
      snapshot_date: selectedSnapshot.snapshot_date,
      skills: skillData,
      employees: employeeData
    });
  } else {
    setPreviewData(null);
  }
}, [selectedSnapshot, employees, skills]);

  const handleDelete = async (snapshotId: string) => {
    if (!onDeleteSnapshot) {
      toast({
        title: "Nepodarilo sa odstrániť",
        description: "Funkcia pre odstránenie snímky nie je k dispozícii",
        variant: "destructive"
      });
      return;
    }
    
    if (window.confirm("Naozaj chcete odstrániť túto snímku histórie? Táto akcia sa nedá vrátiť.")) {
      const success = await onDeleteSnapshot(snapshotId);
      
      if (success) {
        toast({
          title: "Snímka odstránená",
          description: "Snímka histórie bola úspešne odstránená"
        });
      }
    }
  };

  // Táto funkcia už nie je potrebná, presunuli sme logiku priamo do onClick tlačidla
  // Ponechávame ju tu pre spätnú kompatibilitu
  const handleEditName = (snapshotId: string, currentName: string) => {
    console.log("handleEditName called with ID:", snapshotId, "and name:", currentName);
    setEditingSnapshotId(snapshotId);
    setEditingName(currentName || "");
    setIsEditDialogOpen(true);
  };

  const handleSaveName = async () => {
    if (!editingSnapshotId) return;
    
    const success = await updateSnapshotName(editingSnapshotId, editingName);
    
    if (success) {
      // Informujeme rodiča o potrebe obnoviť dáta (ak je definovaný callback)
      if (onUpdateHistory) {
        onUpdateHistory();
      }
      
      // Ukončíme režim úprav
      setEditingSnapshotId(null);
    }
  };

  if (!history || history.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progress History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-2">
            Žiadna história pokroku nie je dostupná. Uložte zmeny, aby ste mohli sledovať vývoj v čase.
          </p>
        </CardContent>
      </Card>;
  }

  const sortedHistory = [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const selectedIndex = sortedHistory.findIndex(item => selectedSnapshot && item.id === selectedSnapshot.id);

  const handlePrevious = () => {
    if (selectedIndex < sortedHistory.length - 1) {
      onSelectSnapshot(sortedHistory[selectedIndex + 1]);
    }
  };

  const handleNext = () => {
    if (selectedIndex > 0) {
      onSelectSnapshot(sortedHistory[selectedIndex - 1]);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };


    // Obnovujeme chýbajúce funkcie
  const handleCompare = () => {
    if (selectedSnapshot && comparisonSnapshotId) {
      onCompareSnapshots(selectedSnapshot.id, comparisonSnapshotId);
      setComparisonDialogOpen(false);
    }
  };

  const handleOpenComparisonDialog = () => {
    // Ukončíme akúkkoľvek prebiehajúcu úpravu názvu
    setEditingSnapshotId(null);
    setComparisonDialogOpen(true);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "dropdown" ? "list" : "dropdown");
  };

  const switchToViewTab = () => {
    setComparisonDialogOpen(false);
  };

  const switchToTeamProgressTab = () => {
    switchToViewTab();
  };

  const switchToIndividualProgressTab = () => {
    switchToViewTab();
  };

  return <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Progress History</CardTitle>
          <Button variant="ghost" size="sm" onClick={toggleViewMode} className="h-8 w-8 p-0">
            {viewMode === "dropdown" ? <List className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="view">
          <TabsList className="w-full">
          <TabsTrigger value="view">Zobraziť históriu</TabsTrigger>
        </TabsList>
          
          <TabsContent value="view" className="space-y-4">
            {viewMode === "list" && (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Názov</TableHead>
                        <TableHead>Matrica</TableHead>
                        <TableHead>Dátum</TableHead>
                        <TableHead className="w-[120px]">Akcie</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedHistory.map(item => (
                        <TableRow key={item.id} className={selectedSnapshot?.id === item.id ? "bg-muted/50" : ""}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              {editingSnapshotId === item.id ? (
                                <div className="flex w-full gap-1">
                                  <Input
                                    autoFocus
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="h-8 py-1 w-full"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSaveName();
                                      } else if (e.key === 'Escape') {
                                        setEditingSnapshotId(null);
                                      }
                                    }}
                                  />
                                  <Button 
                                    size="sm" 
                                    className="h-8 px-2 py-0" 
                                    onClick={handleSaveName}
                                  >
                                    Uložiť
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 px-2 py-0"
                                    onClick={() => setEditingSnapshotId(null)}
                                  >
                                    Zrušiť
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <span className="mr-2">{item.snapshot_name || "Nepomenovaná snímka"}</span>
                                  <Button
                                    variant="outline" 
                                    size="sm" 
                                    className="h-7 px-2 py-0 flex items-center" 
                                    onClick={() => {
                                      console.log("Zapínam inline editáciu pre", item.id);
                                      setEditingSnapshotId(item.id);
                                      setEditingName(item.snapshot_name || "Nepomenovaná snímka");
                                    }}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Upraviť
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            ID matice: {item.matrix_id}
                          </TableCell>
                          <TableCell>{formatDate(item.snapshot_date)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => onSelectSnapshot(item)}>
                                Zobraziť
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(item.id)}
                                className="h-8 w-8"
                                title="Odstrániť"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {selectedSnapshot && (
              <div className="flex items-center justify-between mt-2 mb-4">
                <Button variant="outline" size="sm" onClick={handlePrevious} disabled={selectedIndex >= sortedHistory.length - 1}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Staršie
                </Button>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(sortedHistory[selectedIndex]?.timestamp)}
                </div>
                
                <Button variant="outline" size="sm" onClick={handleNext} disabled={selectedIndex <= 0}>
                  Novšie
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {selectedSnapshot && previewData && (
              <div className="mt-6 border rounded-md p-2">
                <h3 className="text-sm font-medium mb-2 px-2">
                  Náhľad matice – {selectedSnapshot.snapshot_name || formatDate(selectedSnapshot.snapshot_date)}
                </h3>
                <div className="max-h-[1200px] overflow-auto">
                  {/* Normalize employee names for preview */}
                  <SkillMatrixTable 
                    skills={previewData.skills} 
                    employees={previewData.employees.map(employee => {
                      let first_name = employee.first_name || '';
                      let last_name = employee.last_name || '';
                      let name = employee.name || '';
                      if (!name && (first_name || last_name)) {
                        name = `${first_name} ${last_name}`.trim();
                      }
                      if ((!first_name || !last_name) && name) {
                        const parts = name.split(' ');
                        if (!first_name) first_name = parts[0] || '';
                        if (!last_name && parts.length > 1) last_name = parts.slice(1).join(' ');
                      }
                      if (!name) name = `Employee ${String(employee.id).substring(0,8)}`;
                      return {
                        ...employee,
                        first_name,
                        last_name,
                        name,
                      };
                    })} 
                    readOnly={true} 
                  />
                </div>
              </div>
            )}
          </TabsContent>
          

        </Tabs>
      </CardContent>
    </Card>
    
    {/* Odstránili sme dialóg, upravujeme názvy priamo v riadkoch tabuľky */}
};


export default MatrixProgressHistory;
