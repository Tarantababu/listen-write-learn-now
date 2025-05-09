
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  fetchRoadmaps, 
  createRoadmap, 
  updateRoadmap, 
  deleteRoadmap, 
  Roadmap 
} from '@/services/roadmapService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, LayoutGrid } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const RoadmapsManager: React.FC = () => {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentRoadmap, setCurrentRoadmap] = useState<Roadmap | null>(null);
  
  const [name, setName] = useState('');
  const [level, setLevel] = useState('A1');
  const [description, setDescription] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    loadRoadmaps();
  }, []);

  const loadRoadmaps = async () => {
    setLoading(true);
    try {
      const data = await fetchRoadmaps();
      setRoadmaps(data);
    } catch (error) {
      console.error("Failed to load roadmaps", error);
      toast.error("Failed to load roadmaps");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoadmap = async () => {
    try {
      if (!name.trim()) {
        toast.error("Please enter a name for the roadmap");
        return;
      }

      await createRoadmap({
        name,
        level,
        description,
        created_by: null  // Will be set by the server
      });
      
      setName('');
      setLevel('A1');
      setDescription('');
      setIsCreateDialogOpen(false);
      await loadRoadmaps();
    } catch (error) {
      console.error("Failed to create roadmap", error);
    }
  };

  const handleUpdateRoadmap = async () => {
    try {
      if (!currentRoadmap || !name.trim()) {
        toast.error("Invalid roadmap data");
        return;
      }

      await updateRoadmap(currentRoadmap.id, {
        name,
        level,
        description
      });
      
      setIsEditDialogOpen(false);
      await loadRoadmaps();
    } catch (error) {
      console.error("Failed to update roadmap", error);
    }
  };

  const handleDeleteRoadmap = async () => {
    try {
      if (!currentRoadmap) {
        toast.error("No roadmap selected");
        return;
      }

      await deleteRoadmap(currentRoadmap.id);
      
      setIsDeleteDialogOpen(false);
      setCurrentRoadmap(null);
      await loadRoadmaps();
    } catch (error) {
      console.error("Failed to delete roadmap", error);
    }
  };

  const openEditDialog = (roadmap: Roadmap) => {
    setCurrentRoadmap(roadmap);
    setName(roadmap.name);
    setLevel(roadmap.level);
    setDescription(roadmap.description || '');
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (roadmap: Roadmap) => {
    setCurrentRoadmap(roadmap);
    setIsDeleteDialogOpen(true);
  };

  const navigateToNodeEditor = (roadmap: Roadmap) => {
    navigate(`/dashboard/admin/roadmaps/${roadmap.id}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Language Roadmaps</CardTitle>
            <CardDescription>Create and manage language proficiency level roadmaps</CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Roadmap
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Roadmap</DialogTitle>
                <DialogDescription>
                  Create a new roadmap for a language proficiency level
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="col-span-3"
                    placeholder="Beginner French"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="level" className="text-right">
                    Level
                  </Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1 (Beginner)</SelectItem>
                      <SelectItem value="A2">A2 (Elementary)</SelectItem>
                      <SelectItem value="B1">B1 (Intermediate)</SelectItem>
                      <SelectItem value="B2">B2 (Upper Intermediate)</SelectItem>
                      <SelectItem value="C1">C1 (Advanced)</SelectItem>
                      <SelectItem value="C2">C2 (Proficiency)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="col-span-3"
                    placeholder="A roadmap for beginners learning French"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRoadmap}>
                  Create Roadmap
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : roadmaps.length === 0 ? (
            <Alert>
              <AlertDescription>
                No roadmaps found. Create your first roadmap to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roadmaps.map((roadmap) => (
                  <TableRow key={roadmap.id}>
                    <TableCell className="font-medium">{roadmap.name}</TableCell>
                    <TableCell>{roadmap.level}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {roadmap.description || 'No description'}
                    </TableCell>
                    <TableCell className="w-[200px]">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => navigateToNodeEditor(roadmap)}
                          title="Edit Nodes"
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => openEditDialog(roadmap)}
                          title="Edit Roadmap"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          onClick={() => openDeleteDialog(roadmap)}
                          title="Delete Roadmap"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Roadmap</DialogTitle>
            <DialogDescription>
              Update roadmap details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-level" className="text-right">
                Level
              </Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A1">A1 (Beginner)</SelectItem>
                  <SelectItem value="A2">A2 (Elementary)</SelectItem>
                  <SelectItem value="B1">B1 (Intermediate)</SelectItem>
                  <SelectItem value="B2">B2 (Upper Intermediate)</SelectItem>
                  <SelectItem value="C1">C1 (Advanced)</SelectItem>
                  <SelectItem value="C2">C2 (Proficiency)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRoadmap}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Roadmap</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this roadmap? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRoadmap}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoadmapsManager;
