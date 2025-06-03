
export interface Employee {
  id: string;
  name: string;
  skills: Record<string, number>;
  employee_id?: string;
  position?: string;
  category?: string;
  employer?: string;
  gender?: string;
  hire_date?: string;
  termination_date?: string;
  termination_reason?: string;
  department_number?: string;
  subdepartment?: string;
  supervisor?: string;
  role?: string;
  department?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  state?: string;
  grade?: string;
}

// Alias for Employee to maintain compatibility
export type EmployeeData = Employee;

export interface Skill {
  id: string;
  name: string;
  category_id?: string;
  target_level?: number;
}

export interface SkillData extends Skill {
  category?: string;
  target_level: number;
}

export interface SkillCategory {
  id: string; // Ensuring this is always a string
  name: string;
  description?: string;
  skills?: Skill[];
}

export interface TeamMember {
  id: string;
  name: string;
  employee_id?: string;
  hire_date?: string;
  employer?: string;
  role?: string;
  department?: string;
  skills?: Record<string, number>;
}

export interface NewSkillCategory {
  name: string;
  skills: {
    id?: string;
    name: string;
    targetLevel: number;
  }[];
}

export interface EmployeeSkill {
  employee_id: string;
  skill_id: string;
  level: number;
  skill_level?: number; // Adding this to fix the error in skillMatrixService.ts
  updated_at?: string;
}

export interface CompleteSkillMatrix {
  id: string;
  name: string;
  department: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  skills?: SkillData[];
  employees?: EmployeeData[];
  categories?: SkillCategory[];
}

export interface MatrixHistoryEntryPreview {
  id: string;
  matrix_id: string;
  snapshot_date: string;
  created_by?: string;
  comment?: string;
  skills?: SkillData[];
  employees?: EmployeeData[];
}

export interface MatrixEditActions {
  onEditSkill: (skillId: string, field: string, value: any) => void;
  onAddSkill: () => void;
  onRemoveSkill: (skillId: string) => void;
  onAddCategory: () => void;
  onRemoveCategory: (categoryId: string) => void;
}

export interface AddSkillButtonProps {
  onAddSkill: () => void;
  buttonText?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined;
  size?: "default" | "sm" | "lg" | "icon" | null | undefined;
}
