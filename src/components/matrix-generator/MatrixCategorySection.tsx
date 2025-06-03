
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserPlus, Edit2, Check, X, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import AddSkillButton from "./AddSkillButton";

interface Skill {
  id?: string;       // Add this
  name: string;
  targetLevel: number;
}

interface Category {
  name: string;
  skills: Skill[];
}

interface MatrixCategorySectionProps {
  category: Category;
  categoryIndex: number;
  onSkillUpdate?: (categoryIndex: number, skillIndex: number, value: number) => void;
  onCategoryRename?: (categoryIndex: number, newName: string) => void;
  // Uprava parametrov funkcie, aby prenašala aj ID skilu, ak je dostupné
  onSkillRename?: (categoryIndex: number, skillIndex: number, newName: string, skillId?: string) => void;
  onAddTeamMember?: (categoryIndex: number) => void;
  // Function to add a skill to the category with target level
  onAddSkill?: (categoryIndex: number, skillName: string, targetLevel: number) => void;
  // Support both versions
  onRemoveSkill?: (categoryIndex: number, skillIndex: number) => void;
  onRemoveCategory?: (categoryIndex: number) => void;
  editMode?: boolean;
  // New props for skill averages
  getSkillAverage?: (skillId: string) => number;
  meetsCriteria?: (average: number, target: number) => boolean;
}

const MatrixCategorySection: React.FC<MatrixCategorySectionProps> = ({
  category,
  categoryIndex,
  onSkillUpdate,
  onCategoryRename,
  onSkillRename,
  onAddTeamMember,
  onAddSkill,
  onRemoveSkill,
  onRemoveCategory,
  editMode = false,
  getSkillAverage,
  meetsCriteria
}) => {
  // Add state for new skill target level
  const [newSkillTargetLevel, setNewSkillTargetLevel] = useState(3);
  const [editingCategory, setEditingCategory] = useState(false);
  const [categoryName, setCategoryName] = useState(category.name);
  const [editingSkill, setEditingSkill] = useState<number | null>(null);
  const [skillName, setSkillName] = useState("");
  const [newSkillName, setNewSkillName] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);

  const levelColors = [
    "bg-gray-100 text-gray-500", // 0 - Exempt
    "bg-blue-100 text-blue-700", // 1 - Required
    "bg-yellow-100 text-yellow-700", // 2 - Developing
    "bg-green-100 text-green-700", // 3 - Capable
    "bg-purple-200 text-purple-800", // 4 - Expert
  ];

  const handleLevelClick = (skillIndex: number, level: number) => {
    // Check if onSkillUpdate exists and we're in edit mode before calling it
    if (onSkillUpdate && editMode) {
      console.log(`Changing target level: Skill ${skillIndex}, New level ${level}`);
      onSkillUpdate(categoryIndex, skillIndex, level);
    } else if (!onSkillUpdate) {
      console.error("onSkillUpdate function is not defined");
    } else if (!editMode) {
      console.log("Cannot update target level in read-only mode");
    }
  };

  const handleCategoryEditStart = () => {
    setCategoryName(category.name);
    setEditingCategory(true);
  };

  const handleCategoryEditSave = () => {
    if (onCategoryRename && categoryName.trim() !== "") {
      onCategoryRename(categoryIndex, categoryName);
      toast({
        title: "Kategória premenovaná",
        description: `Kategória bola premenovaná na "${categoryName}"`
      });
    }
    setEditingCategory(false);
  };

  const handleCategoryEditCancel = () => {
    setCategoryName(category.name);
    setEditingCategory(false);
  };

  const handleSkillEditStart = (skillIndex: number) => {
    console.log(`Starting edit of skill at index ${skillIndex}, name: ${category.skills[skillIndex].name}`);
    setSkillName(category.skills[skillIndex].name);
    setEditingSkill(skillIndex);
  };

  const handleSkillEditSave = (skillIndex: number) => {
    console.log(`Saving edit of skill at index ${skillIndex}, new name: ${skillName}`);
    console.log(`Current editing skill index: ${editingSkill}`); // Debugging, should match skillIndex
    
    // Dôležitá kontrola - použijeme aktuálne editovaný index, nie parameter
    // Toto zabezpečí, že sa aktualizuje správny skill
    const actualSkillIndex = editingSkill;
    
    if (actualSkillIndex === null) {
      console.error('No skill is currently being edited!');
      return;
    }
    
    // Získame skill, ktorý aktuálne upravujeme
    const skillToUpdate = category.skills[actualSkillIndex];
    if (!skillToUpdate) {
      console.error(`Skill at index ${actualSkillIndex} not found in category`);
      return;
    }
    
    // Získame ID skilu, ak existuje
    const skillId = skillToUpdate.id;
    console.log(`Skill being updated: Index=${actualSkillIndex}, ID=${skillId || 'undefined'}, Name=${skillToUpdate.name}`);
    
    if (onSkillRename && skillName.trim() !== "") {
      console.log(`Calling onSkillRename with categoryIndex=${categoryIndex}, skillIndex=${actualSkillIndex}, name=${skillName}, skillId=${skillId || 'undefined'}`);
      
      // Pridať ID skilu do volania onSkillRename
      onSkillRename(categoryIndex, actualSkillIndex, skillName, skillId);
      
      toast({
        title: "Zručnosť premenovaná",
        description: `Zručnosť bola premenovaná na "${skillName}"`
      });
    } else {
      console.warn(`Cannot rename skill: onSkillRename=${!!onSkillRename}, skillName=${skillName}`);
    }
    
    setEditingSkill(null);
  };

  const handleSkillEditCancel = () => {
    console.log('Cancelling skill edit');
    setEditingSkill(null);
  };

  const handleAddSkill = () => {
    if (onAddSkill && newSkillName.trim() !== "") {
      const addedSkillName = newSkillName;
      // Pass categoryIndex, skillName and the targetLevel
      onAddSkill(categoryIndex, newSkillName, newSkillTargetLevel);
      setNewSkillName("");
      setNewSkillTargetLevel(3); // Reset to default
      setAddingSkill(false);
      toast({
        title: "Zručnosť pridaná",
        description: `Nová zručnosť "${addedSkillName}" bola pridaná`
      });
    } else if (newSkillName.trim() === "") {
      toast({
        title: "Chyba",
        description: "Názov zručnosti nemôže byť prázdny",
        variant: "destructive"
      });
    }
  };


  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          {editingCategory ? (
            <div className="flex items-center space-x-2">
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="max-w-xs"
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={handleCategoryEditSave}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleCategoryEditCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <CardTitle className="text-lg">{category.name}</CardTitle>
              {onCategoryRename && editMode && (
                <Button size="icon" variant="ghost" onClick={handleCategoryEditStart}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          <div className="flex space-x-2">
            {onAddSkill && editMode && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAddingSkill(true)}
                className="text-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Pridať zručnosť
              </Button>
            )}
            {onAddTeamMember && (
              <Button variant="outline" size="sm" onClick={() => onAddTeamMember(categoryIndex)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Pridať člena tímu
              </Button>
            )}
            {onRemoveCategory && editMode && (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (onRemoveCategory) {
                    onRemoveCategory(categoryIndex);
                    toast({
                      title: "Kategória odstránená",
                      description: `Kategória "${category.name}" bola odstránená`
                    });
                  }
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Odstrániť kategóriu
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {addingSkill && (
          <div className="mb-4 p-3 border rounded-md bg-muted/20">
            <div className="flex items-center space-x-2">
              <Input
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="Zadajte názov novej zručnosti"
                className="flex-1"
                autoFocus
              />
              {/* Target level selector */}
              <div className="flex items-center space-x-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                      newSkillTargetLevel === level
                        ? 'bg-indigo-500 text-white border-indigo-600'
                        : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-indigo-100 hover:text-indigo-700'
                    }`}
                    onClick={() => setNewSkillTargetLevel(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <Button size="sm" onClick={handleAddSkill}>
                <Check className="mr-2 h-4 w-4" />
                Add
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setAddingSkill(false); setNewSkillTargetLevel(3); }}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left font-medium py-2 w-1/2">Skill</th>
              <th className="text-right font-medium py-2 pr-4">Požadovaná úroveň</th>
              {getSkillAverage && <th className="text-right font-medium py-2 pr-4">Priemer tímu</th>}
              {editMode && onRemoveSkill && <th className="w-[60px]"></th>}
            </tr>
          </thead>
          <tbody>
            {category.skills.map((skill, skillIndex) => (
              <tr key={skillIndex} className="border-t">
                <td className="py-3">
                  {editingSkill === skillIndex ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={skillName}
                        onChange={(e) => setSkillName(e.target.value)}
                        className="max-w-xs"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" onClick={() => {
                        console.log(`Saving edited skill - current editing index: ${editingSkill}, row index: ${skillIndex}`);
                        // Dôležité: Použiť editingSkill namiesto skillIndex pre zabezpečenie aktuálne editovaného skillu
                        handleSkillEditSave(editingSkill || 0);
                      }}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={handleSkillEditCancel}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {skill.name}
                      {onSkillRename && editMode && (
                        <Button size="icon" variant="ghost" onClick={() => handleSkillEditStart(skillIndex)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex justify-end space-x-1">
                    {[0, 1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`w-8 h-8 rounded flex items-center justify-center ${
                          level === skill.targetLevel 
                            ? levelColors[level] 
                            : "bg-gray-50 text-gray-400"
                        } ${editMode ? "cursor-pointer" : ""}`}
                        onClick={() => {
                          if (editMode) {
                            console.log(`Clicked level ${level} for skill ${skillIndex}`);
                            handleLevelClick(skillIndex, level);
                          }
                        }}
                      >
                        {level}
                      </div>
                    ))}
                  </div>
                </td>
                {getSkillAverage && skill.id && (
                  <td className="py-3 text-right pr-4">
                    {(() => {
                      const averageLevel = getSkillAverage(skill.id || '');
                      const meetsTarget = meetsCriteria ? meetsCriteria(averageLevel, skill.targetLevel) : false;
                      return (
                        <div className="flex items-center justify-end space-x-2">
                          <span 
                            className={`inline-flex items-center font-medium ${meetsTarget ? 'text-green-600' : 'text-amber-600'}`}
                          >
                            {averageLevel.toFixed(1)}
                            {meetsTarget ? 
                              <span className="ml-1 text-green-600">✓</span> : 
                              <span className="ml-1 text-amber-600">↓</span>}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                )}
                {editMode && onRemoveSkill && (
                  <td className="py-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        console.log(`Removing skill at category ${categoryIndex}, index ${skillIndex}: ${skill.name}`);
                        // Just pass the indices directly - don't try to be fancy here
                        onRemoveSkill(categoryIndex, skillIndex);
                        
                        toast({
                          title: "Zručnosť odstránená",
                          description: `Zručnosť "${skill.name}" bola odstránená`
                        });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default MatrixCategorySection;
