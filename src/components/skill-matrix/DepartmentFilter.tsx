
import React from "react";
import { Building } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface DepartmentFilterProps {
  departments: string[];
  selectedDepartment: string | null;
  onSelectDepartment: (department: string | null) => void;
}

const DepartmentFilter: React.FC<DepartmentFilterProps> = ({
  departments,
  selectedDepartment,
  onSelectDepartment
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="department-filter" className="text-sm font-medium">
        Filtrovať podľa oddelenia
      </Label>
      <Select
        value={selectedDepartment || "all"}
        onValueChange={(value) => onSelectDepartment(value === "all" ? null : value)}
      >
        <SelectTrigger id="department-filter" className="w-full">
          <div className="flex items-center">
            <Building className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Všetky oddelenia" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Všetky oddelenia</SelectItem>
          {departments.map((department) => (
            <SelectItem key={department} value={department}>
              {department}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DepartmentFilter;
