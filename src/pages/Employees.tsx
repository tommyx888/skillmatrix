import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import EmployeeList from '@/components/employee-management/EmployeeList';

const Employees = () => {
  return (
    <>
      <div className="hidden">
        {/* Title would normally go here with Helmet, but we'll use document.title instead */}
        {document.title = 'Employees | Skill Matrix'}
      </div>
      
      <div className="flex flex-col gap-4 md:gap-8 p-4 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold">Employee Management</h1>
            <p className="text-muted-foreground mt-1">Manage your team members and their information</p>
          </div>
        </div>
        
        <EmployeeList />
      </div>
    </>
  );
};

export default Employees;
