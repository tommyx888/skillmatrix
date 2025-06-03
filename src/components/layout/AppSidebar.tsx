
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutGrid, 
  GraduationCap, 
  BarChart, 
  Users, 
  Settings,
  ActivitySquare,
  UserRound
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const AppSidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { name: "Prehľad", icon: LayoutGrid, path: "/" },
    { name: "Matrica zručností", icon: ActivitySquare, path: "/skill-matrix" },
    { name: "Školenia", icon: GraduationCap, path: "/training" },
    { name: "Analýza rozdielov", icon: BarChart, path: "/gap-analysis" },
    { name: "Tímy", icon: Users, path: "/teams" },
    { name: "Zamestnanci", icon: UserRound, path: "/employees" },
    { name: "Nastavenia", icon: Settings, path: "/settings" },
  ];

  return (
    <div className="flex flex-col h-screen bg-sidebar text-sidebar-foreground w-16 fixed left-0 top-0 z-10 shadow-md">
      <div className="p-3 flex justify-center">
        <div className="bg-white rounded-md p-1 w-10 h-10 flex items-center justify-center">
          <svg 
            viewBox="0 0 24 24" 
            width="24" 
            height="24" 
            stroke="currentColor" 
            strokeWidth="2" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-primary"
          >
            <path d="M12 4L4 8l8 4 8-4-8-4z" />
            <path d="M4 12l8 4 8-4" />
            <path d="M4 16l8 4 8-4" />
          </svg>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center flex-1 gap-4 mt-6">
        <TooltipProvider>
          {menuItems.map((item) => (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Link
                  to={item.path}
                  className={cn(
                    "w-10 h-10 rounded-md flex items-center justify-center transition-colors duration-200",
                    location.pathname === item.path 
                      ? "bg-sidebar-accent text-white" 
                      : "text-white/80 hover:bg-sidebar-hover hover:text-white"
                  )}
                  aria-label={item.name}
                >
                  <item.icon size={20} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
};

export default AppSidebar;
