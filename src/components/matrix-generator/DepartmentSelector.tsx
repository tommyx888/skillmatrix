import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Car, 
  Cog, 
  Cpu, 
  Database, 
  Factory, 
  FileSpreadsheet, 
  FlaskConical, 
  ShieldCheck, 
  Truck, 
  Wrench,
  CheckCircle2,
  Users,
  Building
} from "lucide-react";

interface DepartmentSelectorProps {
  onSelect: (department: string) => void;
  selected: string;
}

const departments = [
  { id: "ci", name: "CI", icon: Factory },
  { id: "engineering", name: "Inžinierstvo", icon: Cog },
  { id: "finance", name: "Financie", icon: FileSpreadsheet },
  { id: "hr", name: "Ľudské zdroje", icon: Users },
  { id: "it", name: "IT", icon: Cpu },
  { id: "logistics", name: "Logistika", icon: Truck },
  { id: "maintenance", name: "Údržba", icon: Wrench },
  { id: "management", name: "Manažment", icon: Building },
  { id: "production", name: "Výroba", icon: Factory },
  { id: "quality", name: "Kvalita", icon: ShieldCheck },
];

const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({ onSelect, selected }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {departments.map((dept) => {
        const Icon = dept.icon;
        const isSelected = selected === dept.name;
        
        return (
          <Card
            key={dept.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              isSelected 
                ? "border-primary border-2 shadow-md bg-primary/5" 
                : "hover:border-primary/50 hover:shadow"
            }`}
            onClick={() => onSelect(dept.name)}
          >
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-full ${
                isSelected 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              }`}>
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-medium">{dept.name}</h3>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Vytvorte maticu zručností pre tím oddelenia {dept.name.toLowerCase()}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default DepartmentSelector;
