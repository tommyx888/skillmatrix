
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddSkillButtonProps } from "@/types/skills";

const AddSkillButton: React.FC<AddSkillButtonProps> = ({ 
  onAddSkill, 
  buttonText = "Pridať zručnosť",
  className = "w-full border-dashed",
  variant = "outline",
  size = "default"
}) => {
  return (
    <Button 
      variant={variant} 
      size={size}
      className={className}
      onClick={onAddSkill}
    >
      <Plus className="mr-2 h-4 w-4" />
      {buttonText}
    </Button>
  );
};

export default AddSkillButton;
