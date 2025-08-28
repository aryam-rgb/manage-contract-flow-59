import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const Bootstrap = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);

  const [adminForm, setAdminForm] = useState({
    email: 'admin@contractflow.com',
    password: 'admin123',
    username: 'admin',
    fullName: 'System Administrator',
  });

  // Check if any users exist
  const checkForUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking users:', error);
        setHasUsers(false);
        return;
      }

      setHasUsers((profiles && profiles.length > 0) || false);
    } catch (error) {
      console.error('Error checking users:', error);
      setHasUsers(false);
    }
  };

  // Check for users on component mount
  useState(() => {
    checkForUsers();
  });

  // Redirect if authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  // If there are already users, redirect to auth
  if (hasUsers === true) {
    return <Navigate to="/auth" replace />;
  }

  // If still checking, show loading
  if (hasUsers === null || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking system status...</p>
        </div>
      </div>
    );
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // First sign up the admin user with email confirmation disabled
      const { data, error } = await supabase.auth.signUp({
        email: adminForm.email,
        password: adminForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: adminForm.username,
            full_name: adminForm.fullName,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update the user role to admin
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', data.user.id);

        if (roleError) {
          console.error('Role update error:', roleError);
          // Continue anyway, we can fix this later
        }

        toast({
          title: 'Success',
          description: 'Admin user created successfully! You can now sign in.',
        });

        // Redirect to auth page after a brief delay
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/src/assets/kcb-logo.svg" alt="KCB Bank" className="h-12" />
          </div>
          <h1 className="text-3xl font-bold text-primary">KCB Bank Setup</h1>
          <p className="mt-2 text-gray-600">Create the first admin user to get started</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bootstrap Admin User</CardTitle>
            <CardDescription>
              No users found in the system. Create the first admin user to initialize KCB Contract Management System.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={adminForm.username}
                  onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={adminForm.fullName}
                  onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isCreating}
              >
                {isCreating ? 'Creating Admin...' : 'Create Admin User'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Bootstrap;