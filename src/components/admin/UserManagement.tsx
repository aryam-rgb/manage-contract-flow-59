import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, UserPlus, Shield } from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  created_at: string;
  user_roles?: {
    role: string;
  }[];
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const { toast } = useToast();

  const [createUserForm, setCreateUserForm] = useState({
    email: '',
    password: '',
    username: '',
    fullName: '',
    role: 'user' as 'admin' | 'manager' | 'user',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        user_roles: roles?.filter(role => role.user_id === profile.id) || []
      })) || [];

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch users',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUserRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      // First, delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id);

      // Then insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.id,
          role: selectedRole as 'admin' | 'manager' | 'user'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      setRoleDialogOpen(false);
      setSelectedUser(null);
      setSelectedRole('');
      fetchUsers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      // Note: Due to the foreign key constraint with CASCADE, 
      // deleting the user from auth.users would also delete the profile
      // For now, we'll just show a message that admin should handle this in Supabase dashboard
      toast({
        title: 'User Deletion',
        description: 'User deletion should be handled through the Supabase Auth dashboard for security reasons.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const handleCreateUser = async () => {
    if (!createUserForm.email || !createUserForm.password || !createUserForm.username || !createUserForm.fullName) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'All fields are required',
      });
      return;
    }

    try {
      setIsCreatingUser(true);

      // Create the user in Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: createUserForm.email,
        password: createUserForm.password,
        user_metadata: {
          username: createUserForm.username,
          full_name: createUserForm.fullName,
        },
        email_confirm: true, // Auto-confirm email
      });

      if (error) throw error;

      if (data.user) {
        // The trigger will create the profile and assign default role
        // But we need to update the role if it's not 'user'
        if (createUserForm.role !== 'user') {
          // Delete default role and insert new one
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', data.user.id);

          await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role: createUserForm.role
            });
        }
      }

      toast({
        title: 'Success',
        description: 'User created successfully',
      });

      setCreateUserDialogOpen(false);
      setCreateUserForm({
        email: '',
        password: '',
        username: '',
        fullName: '',
        role: 'user',
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const openRoleDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setSelectedRole(user.user_roles?.[0]?.role || 'user');
    setRoleDialogOpen(true);
  };

  const getUserRole = (user: UserProfile) => {
    return user.user_roles?.[0]?.role || 'user';
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
        </div>
        <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Users
          </CardTitle>
          <CardDescription>
            View and manage all users in the system. Role changes take effect immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(getUserRole(user))}>
                      {getUserRole(user)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRoleDialog(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {users.length === 0 && (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">Users will appear here after they sign up.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Update Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>User</Label>
              <p className="text-sm text-gray-600">
                {selectedUser?.username} ({selectedUser?.full_name})
              </p>
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setRoleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateUserRole}>
                Update Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-username">Username</Label>
              <Input
                id="create-username"
                type="text"
                placeholder="Enter username"
                value={createUserForm.username}
                onChange={(e) => setCreateUserForm({ ...createUserForm, username: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="create-fullname">Full Name</Label>
              <Input
                id="create-fullname"
                type="text"
                placeholder="Enter full name"
                value={createUserForm.fullName}
                onChange={(e) => setCreateUserForm({ ...createUserForm, fullName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="Enter email"
                value={createUserForm.email}
                onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                placeholder="Enter password"
                value={createUserForm.password}
                onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="create-role">Role</Label>
              <Select value={createUserForm.role} onValueChange={(value: 'admin' | 'manager' | 'user') => setCreateUserForm({ ...createUserForm, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCreateUserDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={isCreatingUser}>
                {isCreatingUser ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};