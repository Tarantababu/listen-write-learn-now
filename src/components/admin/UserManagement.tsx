
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRoleManagement } from './UserRoleManagement';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdmin } from '@/hooks/use-admin';

const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('roles');
  const { isAdmin, isLoading } = useAdmin();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Loading admin status...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>You need admin privileges to access this feature</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="roles" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="roles">User Roles</TabsTrigger>
          {/* We can add more tabs here in the future if needed */}
        </TabsList>

        <TabsContent value="roles">
          <UserRoleManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;
