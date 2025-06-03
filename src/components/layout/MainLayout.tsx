
import React from "react";
import AppSidebar from "./AppSidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 ml-16 p-6">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
