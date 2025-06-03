import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, Check, Copy, FileText, List } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { NewSkillCategory } from "@/types/skills";
import MatrixCategorySection from "./MatrixCategorySection";
import AddSkillButton from "./AddSkillButton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ManualSkillCreatorProps {
  categories: NewSkillCategory[];
  onCategoriesChange: (categories: NewSkillCategory[]) => void;
}

const ManualSkillCreator: React.FC<ManualSkillCreatorProps> = ({ 
  categories, 
  onCategoriesChange 
}) => {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [addingSkillToCategory, setAddingSkillToCategory] = useState<number | null>(null);
  const [newSkillName, setNewSkillName] = useState("");
  
  // Nové stavy pre hromadné pridávanie zručností
  const [bulkSkillsInput, setBulkSkillsInput] = useState<string>("");
  const [selectedCategoryForBulk, setSelectedCategoryForBulk] = useState<number | null>(null);
  const [defaultTargetLevel, setDefaultTargetLevel] = useState<number>(3);
  const [bulkDialogOpen, setBulkDialogOpen] = useState<boolean>(false);

  const handleAddCategory = () => {
    if (newCategoryName.trim() === "") {
      toast({
        title: "Error",
        description: "Názov kategórie nemôže byť prázdny",
        variant: "destructive"
      });
      return;
    }

    const updatedCategories = [
      ...categories,
      {
        name: newCategoryName,
        skills: []
      }
    ];
    
    onCategoriesChange(updatedCategories);
    setNewCategoryName("");
    setIsAddingCategory(false);
    
    toast({
      title: "Kategória pridaná",
      description: `Nová kategória "${newCategoryName}" bola pridaná`
    });
  };

  const handleRemoveCategory = (categoryIndex: number) => {
    const updatedCategories = [...categories];
    updatedCategories.splice(categoryIndex, 1);
    onCategoriesChange(updatedCategories);
  };

  const handleCategoryRename = (categoryIndex: number, newName: string) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].name = newName;
    onCategoriesChange(updatedCategories);
  };

  const handleSkillRename = (categoryIndex: number, skillIndex: number, newName: string) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].skills[skillIndex].name = newName;
    onCategoriesChange(updatedCategories);
  };

  const handleAddSkill = (categoryIndex: number, skillName: string, targetLevel: number) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].skills.push({
      name: skillName,
      targetLevel: targetLevel // Používa dodanú cieľovú úroveň namiesto 0
    });
    onCategoriesChange(updatedCategories);
    
    toast({
      title: "Zručnosť pridaná",
      description: `Nová zručnosť "${skillName}" bola pridaná`
    });
  };

  const handleAddSkillToCategory = (categoryIndex: number) => {
    setAddingSkillToCategory(categoryIndex);
    setNewSkillName("");
  };

  const handleAddSkillSubmit = () => {
    if (addingSkillToCategory === null) return;
    
    if (newSkillName.trim() === "") {
      toast({
        title: "Error",
        description: "Názov zručnosti nemôže byť prázdny",
        variant: "destructive"
      });
      return;
    }
    
    // Pridávame predvolenú cieľovú úroveň 3 (schopný)
    handleAddSkill(addingSkillToCategory, newSkillName, 3);
    setNewSkillName("");
    setAddingSkillToCategory(null);
  };
  
  // Nová funkcia pre hromadné pridávanie zručností
  const handleBulkAddSkills = () => {
    if (selectedCategoryForBulk === null) {
      toast({
        title: "Vyberte kategóriu",
        description: "Prosím, vyberte kategóriu, do ktorej chcete pridať zručnosti",
        variant: "destructive"
      });
      return;
    }
    
    if (!bulkSkillsInput.trim()) {
      toast({
        title: "Prázdny vstup",
        description: "Zadajte zoznam zručností pre hromadné pridávanie",
        variant: "destructive"
      });
      return;
    }
    
    // Rozdelenie vstupu na riadky
    const skillLines = bulkSkillsInput.split('\n').map(line => line.trim()).filter(line => line);
    
    if (skillLines.length === 0) {
      toast({
        title: "Žiadne platné zručnosti",
        description: "Neboli nájdené žiadne platné názvy zručností na spracovanie",
        variant: "destructive"
      });
      return;
    }
    
    // Pridanie všetkých zručností do vybranej kategórie s predvolenou úrovňou
    const updatedCategories = [...categories];
    const targetCategory = updatedCategories[selectedCategoryForBulk];
    
    skillLines.forEach(skillName => {
      targetCategory.skills.push({
        name: skillName,
        targetLevel: defaultTargetLevel
      });
    });
    
    onCategoriesChange(updatedCategories);
    
    toast({
      title: "Zručnosti pridané",
      description: `${skillLines.length} zručností bolo úspešne pridaných do kategórie "${targetCategory.name}"`
    });
    
    // Reset formulára
    setBulkSkillsInput("");
    setBulkDialogOpen(false);
  };

  const handleRemoveSkill = (categoryIndex: number, skillIndex: number) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].skills.splice(skillIndex, 1);
    onCategoriesChange(updatedCategories);
  };

  const handleSkillUpdate = (categoryIndex: number, skillIndex: number, value: number) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].skills[skillIndex].targetLevel = value;
    onCategoriesChange(updatedCategories);
  };

  return (
    <div className="space-y-6">
      {/* Tlačidlo pre hromadné pridávanie zručností */}
      <div className="flex justify-end mb-4">
        <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <FileText className="h-4 w-4 mr-2" />
              Hromadne pridať zručnosti
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Hromadné pridávanie zručností</DialogTitle>
              <DialogDescription>
                Vložte zoznam zručností (jedna zručnosť na riadok) pre rýchle pridanie do vybranej kategórie.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Výber kategórie */}
              <div className="space-y-2">
                <Label htmlFor="category-select">Vyberte kategóriu</Label>
                <Select onValueChange={(value) => setSelectedCategoryForBulk(Number(value))}>
                  <SelectTrigger id="category-select">
                    <SelectValue placeholder="Vyberte kategóriu" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Nastavenie cieľovej úrovne */}
              <div className="space-y-2">
                <Label htmlFor="target-level">Predvolená cieľová úroveň</Label>
                <Select 
                  defaultValue={defaultTargetLevel.toString()} 
                  onValueChange={(value) => setDefaultTargetLevel(Number(value))}
                >
                  <SelectTrigger id="target-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - Vynechaná zručnosť</SelectItem>
                    <SelectItem value="1">1 - Základná úroveň</SelectItem>
                    <SelectItem value="2">2 - Stredná úroveň</SelectItem>
                    <SelectItem value="3">3 - Pokročilá úroveň</SelectItem>
                    <SelectItem value="4">4 - Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Textové pole pre zoznam zručností */}
              <div className="space-y-2">
                <Label htmlFor="skills-list">Zoznam zručností (jedna na riadok)</Label>
                <Textarea
                  id="skills-list"
                  placeholder="Java\nJavaScript\nReact\nSQL\nDocker"
                  rows={8}
                  value={bulkSkillsInput}
                  onChange={(e) => setBulkSkillsInput(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" onClick={() => setBulkDialogOpen(false)} variant="outline">Zrušiť</Button>
              <Button type="button" onClick={handleBulkAddSkills}>Pridať zručnosti</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {categories.map((category, categoryIndex) => (
        <div key={categoryIndex} className="space-y-2">
          <MatrixCategorySection
            key={categoryIndex}
            category={category}
            categoryIndex={categoryIndex}
            onSkillUpdate={handleSkillUpdate}
            onCategoryRename={handleCategoryRename}
            onSkillRename={handleSkillRename}
            onAddSkill={handleAddSkill}
            onRemoveSkill={handleRemoveSkill}
            onRemoveCategory={handleRemoveCategory}
            editMode={true}
          />
          
          {addingSkillToCategory === categoryIndex ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Input
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="Zadajte názov zručnosti"
                    className="flex-1"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleAddSkillSubmit}>
                    <Check className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAddingSkillToCategory(null)}>
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="outline" 
              size="sm" 
              onClick={() => handleAddSkillToCategory(categoryIndex)}
              className="ml-4 text-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Skill
            </Button>
          )}
        </div>
      ))}

      {isAddingCategory ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Zadajte názov kategórie"
                className="flex-1"
                autoFocus
              />
              <Button onClick={handleAddCategory}>
                <Check className="mr-2 h-4 w-4" />
                Add
              </Button>
              <Button variant="outline" onClick={() => setIsAddingCategory(false)}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <AddSkillButton
          buttonText="Pridať kategóriu zručností"
          onAddSkill={() => setIsAddingCategory(true)}
        />
      )}
    </div>
  );
};

export default ManualSkillCreator;
