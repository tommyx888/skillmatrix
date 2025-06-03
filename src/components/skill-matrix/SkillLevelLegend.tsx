
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const SkillLevelLegend = () => {
  const skillLevels = [
    { level: 0, name: "Vynechaná zručnosť", class: "bg-gray-100 dark:bg-gray-800" },
    { level: 1, name: "Stále sa učí (základy)", class: "bg-red-100 dark:bg-red-900/20" },
    { level: 2, name: "Plní niektoré požiadavky (práca pod dozorom)", class: "bg-yellow-100 dark:bg-yellow-900/20" },
    { level: 3, name: "Plní všetky požiadavky samostatnej práce", class: "bg-blue-100 dark:bg-blue-900/20" },
    { level: 4, name: "Prekračuje požiadavky (môže trénovať)", class: "bg-green-100 dark:bg-green-900/20" },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-medium mb-3">Legenda úrovní kompetencií</h3>
        <div className="space-y-2">
          {skillLevels.map((skill) => (
            <div key={skill.level} className="flex items-center gap-2">
              <div className={`w-8 h-8 flex items-center justify-center rounded ${skill.class} text-center`}>
                {skill.level}
              </div>
              <span className="text-sm">{skill.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillLevelLegend;
