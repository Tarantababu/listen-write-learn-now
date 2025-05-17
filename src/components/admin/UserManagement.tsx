
import React from 'react';
import { UserRoleManagement } from '@/components/admin/UserRoleManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Users } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('roles');

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-none">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage users and their roles in the application
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="roles">
            <ShieldCheck className="mr-1 h-4 w-4" /> 
            User Roles
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="roles">
          <UserRoleManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;
