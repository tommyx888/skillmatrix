import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';

type UserWithRole = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_id: string;
};

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Join the auth.users (via profiles), and user_roles tables
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          user_id,
          email,
          first_name,
          last_name,
          user_roles(id, role)
        `);

      if (error) {
        throw error;
      }

      if (data) {
        const formattedUsers = data.map((item) => ({
          id: item.user_id,
          email: item.email,
          first_name: item.first_name,
          last_name: item.last_name,
          role: item.user_roles?.role || 'No role',
          role_id: item.user_roles?.id,
        }));

        setUsers(formattedUsers);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      // Check if user already has a role
      const existingUser = users.find((u) => u.id === userId);
      
      if (existingUser?.role_id) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('id', existingUser.role_id);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });

        if (error) throw error;
      }

      toast({
        title: 'Role updated',
        description: 'User role has been updated successfully',
      });

      // Refresh the user list
      fetchUsers();
    } catch (err: any) {
      console.error('Error updating user role:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to update user role',
      });
    }
  };

  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user roles and permissions for the Skill Matrix application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select
                          defaultValue={user.role}
                          onValueChange={(value) => updateUserRole(user.id, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchUsers()}
                        >
                          Refresh
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
