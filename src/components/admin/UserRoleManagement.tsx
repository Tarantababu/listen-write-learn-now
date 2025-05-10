
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, User, Search, Loader2, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/hooks/use-admin';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Define the user data structure
interface UserData {
  id: string;
  email?: string | null;
}

interface UserWithRole {
  id: string;
  email: string;
  isAdmin: boolean;
}

export function UserRoleManagement() {
  const { isAdmin } = useAdmin();
  const [email, setEmail] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [searchedUser, setSearchedUser] = useState<UserWithRole | null>(null);
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminUsers();
    }
  }, [isAdmin]);

  const fetchAdminUsers = async () => {
    try {
      setUserLoading(true);
      
      // Fetch all admin users
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (roleError) throw roleError;
      
      // If there are no admin users, return empty array
      if (!roleData || roleData.length === 0) {
        setUsers([]);
        setUserLoading(false);
        return;
      }
      
      // Get all admin user IDs
      const adminIds = roleData.map(item => item.user_id);
      
      // Fetch user details - now properly typed
      const { data: userData, error: adminError } = await supabase.auth.admin.listUsers();
      
      if (adminError) {
        console.error('Failed to fetch users:', adminError);
        setUsers([]);
        return;
      }
      
      // Filter only admin users and map to our format
      const adminUsers = userData.users
        .filter(user => adminIds.includes(user.id))
        .map(user => ({
          id: user.id,
          email: user.email || 'Unknown email',
          isAdmin: true
        }));
      
      setUsers(adminUsers);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      toast.error('Failed to load admin users');
    } finally {
      setUserLoading(false);
    }
  };

  const searchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    try {
      setSearchLoading(true);
      setSearchedUser(null);
      
      // Search for user by email - now properly typed
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) throw userError;
      
      const foundUser = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!foundUser) {
        toast.error('User not found');
        return;
      }
      
      // Check if user is admin
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', foundUser.id)
        .eq('role', 'admin')
        .single();
      
      setSearchedUser({
        id: foundUser.id,
        email: foundUser.email || 'Unknown email',
        isAdmin: !roleError && roleData !== null 
      });
      
      toast.success('User found');
    } catch (error) {
      console.error('Error searching for user:', error);
      toast.error('Failed to search for user');
    } finally {
      setSearchLoading(false);
    }
  };

  const updateUserRole = async (userId: string, makeAdmin: boolean) => {
    try {
      setUpdateLoading(userId);
      
      if (makeAdmin) {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'admin'
          });
          
        if (error) throw error;
        
        toast.success('User is now an admin');
      } else {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
          
        if (error) throw error;
        
        toast.success('Admin role removed from user');
      }
      
      // Refresh user lists
      fetchAdminUsers();
      
      // Update searched user if applicable
      if (searchedUser && searchedUser.id === userId) {
        setSearchedUser({
          ...searchedUser,
          isAdmin: makeAdmin
        });
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    } finally {
      setUpdateLoading(null);
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Role Management</CardTitle>
          <CardDescription>You need admin privileges to access this feature</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5 text-amber-500" />
          User Role Management
        </CardTitle>
        <CardDescription>
          Manage admin permissions for users in your application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search form */}
        <form onSubmit={searchUser} className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="email-search" className="sr-only">
              Search by email
            </Label>
            <Input
              id="email-search"
              placeholder="Search user by email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit" disabled={searchLoading}>
            {searchLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-1" />
            )}
            <span>Search</span>
          </Button>
        </form>
        
        {/* Search result */}
        {searchedUser && (
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Search Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{searchedUser.email}</p>
                    <div className="flex gap-1 mt-1">
                      {searchedUser.isAdmin ? (
                        <Badge className="bg-amber-500">Admin</Badge>
                      ) : (
                        <Badge variant="outline">User</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant={searchedUser.isAdmin ? "destructive" : "default"}
                      size="sm"
                      disabled={!!updateLoading}
                    >
                      {updateLoading === searchedUser.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : searchedUser.isAdmin ? (
                        <X className="h-4 w-4 mr-1" />
                      ) : (
                        <Shield className="h-4 w-4 mr-1" />
                      )}
                      {searchedUser.isAdmin ? 'Remove Admin' : 'Make Admin'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {searchedUser.isAdmin ? 'Remove admin privileges?' : 'Grant admin privileges?'}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {searchedUser.isAdmin 
                          ? `This will remove admin privileges from ${searchedUser.email}. They will no longer have access to admin features.` 
                          : `This will grant admin privileges to ${searchedUser.email}. They will have full access to all admin features.`}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className={searchedUser.isAdmin ? "bg-destructive hover:bg-destructive/90" : ""}
                        onClick={() => updateUserRole(searchedUser.id, !searchedUser.isAdmin)}
                      >
                        {searchedUser.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Admin users list */}
        <div>
          <h3 className="text-sm font-medium mb-2">Current Administrators</h3>
          
          {userLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              No administrators found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className="bg-amber-500">Admin</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            disabled={!!updateLoading}
                          >
                            {updateLoading === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <X className="h-4 w-4 mr-1" />
                            )}
                            Remove Admin
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove admin privileges?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove admin privileges from {user.email}. They will no longer have access to admin features.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => updateUserRole(user.id, false)}
                            >
                              Remove Admin
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
