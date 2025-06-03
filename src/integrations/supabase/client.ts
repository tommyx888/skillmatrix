import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import type { Json } from './types';

const SUPABASE_URL = "https://lwsshzpibfovyqmhvzex.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3c3NoenBpYmZvdnlxbWh2emV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NjgyMjQsImV4cCI6MjA1MzA0NDIyNH0.bY2yuv1TAnBwbAxIF2FZZ7m_WNn_JHYeurwof5EQj9c";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Define additional types for the skill matrices table that includes our new columns
export interface SkillMatrixInsert {
  name: string;
  department: string;
  description?: string;
  skills_data?: Json;
  members_data?: Json;
  created_at?: string;
  updated_at?: string;
  id?: string;
}

export interface SkillMatrixRow extends SkillMatrixInsert {
  id: string;
  created_at: string;
  updated_at: string;
  skills_data: Json;
  members_data: Json;
}

export interface CompleteSkillMatrixInsert {
  matrix_id: string;
  name: string;
  department: string;
  description?: string;
  skill_data: Json;
  employee_data: Json;
  created_by?: string;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

// Define a type for the member data in skill_matrices.members_data
export interface MatrixMemberData {
  id: string;
  skills: Record<string, number>;
  [key: string]: any;
}

// For strongly typing employee skill records
export interface EmployeeSkillRecord {
  employee_id: string;
  skill_id: string;
  skill_level: number;
  assessment_date: string;
  assessed_by?: string | null;
  comments?: string;
  created_at?: string;
  updated_at?: string;
}

// Due to TypeScript limitations with the Supabase client and tables not in the types.ts,
// we use any for now, but maintain our own type safety through our defined interfaces
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Helper function to fetch paginated employees
export const fetchPaginatedEmployees = async (
  page = 0, 
  pageSize = 20, 
  searchQuery = ''
): Promise<any[]> => {
  try {
    const startRow = page * pageSize;
    
    let query = supabase
      .from('employees')
      .select(`
        id, 
        first_name, 
        last_name, 
        user_id,
        employee_id,
        position,
        category,
        employer,
        gender,
        hire_date,
        termination_date,
        termination_reason,
        department_number,
        subdepartment,
        supervisor
      `)
      .range(startRow, startRow + pageSize - 1);
    
    if (searchQuery) {
      query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,employee_id.ilike.%${searchQuery}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching paginated employees:", error);
      return [];
    }
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Exception fetching paginated employees:", error);
    return [];
  }
};

// Helper function to check if we're connected to Supabase
export const checkSupabaseConnection = async () => {
  try {
    // First try to check connection with the skill_matrices table which now has our new columns
    try {
      const response = await supabase
        .from('skill_matrices')
        .select('count')
        .limit(1);
      
      // Check if there's no error in the response
      if (!response.error) {
        return true;
      }
    } catch (e) {
      console.error("Error checking skill_matrices:", e);
    }
    
    // Fallback to checking the employees table
    try {
      const response = await supabase
        .from('employees')
        .select('count')
        .limit(1);
      
      // Return true if there's no error
      return !response.error;
    } catch (e) {
      console.error("Error checking employees table:", e);
      return false;
    }
  } catch (e) {
    console.error("Supabase connection check failed:", e);
    return false;
  }
};
