
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ArrowLeft, Plus, Edit, Trash2, Link, AlertCircle, CheckCircle2, Lightning } from 'lucide-react';
import { 
  fetchRoadmap, 
  fetchRoadmapNodes, 
  createRoadmapNode, 
  updateRoadmapNode, 
  deleteRoadmapNode,
  Roadmap, 
  RoadmapNode 
} from '@/services/roadmapService';
import { fetchDefaultExercises } from '@/services/defaultExerciseService';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

const RoadmapNodeEditor: React.FC = () => {
  const { roadmapId } = useParams();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [defaultExercises, setDefaultExercises] = useState<any[]>([]);
  
  // Node form state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentNode, setCurrentNode] = useState<RoadmapNode | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState(1);
  const [isBonus, setIsBonus] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  // Loading states
  const [loadingRoadmap, setLoadingRoadmap] = useState(true);
  const [loadingNodes, setLoadingNodes] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(true);

  useEffect(() => {
    if (!roadmapId) return;
    loadRoadmap();
    loadNodes();
    loadDefaultExercises();
  }, [roadmapId]);

  const loadRoadmap = async () => {
    if (!roadmapId) return;
    
    setLoadingRoadmap(true);
    try {
      const data = await fetchRoadmap(roadmapId);
      if (data) setRoadmap(data);
    } catch (error) {
      console.error('Failed to load roadmap', error);
      toast.error('Failed to load roadmap details');
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const loadNodes = async () => {
    if (!roadmapId) return;
    
    setLoadingNodes(true);
    try {
      const data = await fetchRoadmapNodes(roadmapId);
      setNodes(data);
    } catch (error) {
      console.error('Failed to load roadmap nodes', error);
      toast.error('Failed to load roadmap nodes');
    } finally {
      setLoadingNodes(false);
    }
  };

  const loadDefaultExercises = async () => {
    setLoadingExercises(true);
    try {
      const data = await fetchDefaultExercises();
      setDefaultExercises(data);
    } catch (error) {
      console.error('Failed to load default exercises', error);
      toast.error('Failed to load exercises');
    } finally {
      setLoadingExercises(false);
    }
  };

  const handleAddNode = async () => {
    if (!roadmapId) return;

    try {
      if (!title.trim()) {
        toast.error('Please enter a node title');
        return;
      }

      // Find next available position if not set
      const nextPosition = nodes.length > 0 
        ? Math.max(...nodes.map(node => node.position)) + 1 
        : 1;

      await createRoadmapNode({
        roadmap_id: roadmapId,
        title,
        description,
        position: position || nextPosition,
        is_bonus: isBonus,
        default_exercise_id: selectedExerciseId || null
      });

      setTitle('');
      setDescription('');
      setPosition(nextPosition + 1);
      setIsBonus(false);
      setSelectedExerciseId(null);
      setIsAddDialogOpen(false);
      await loadNodes();
    } catch (error) {
      console.error('Failed to add node', error);
    }
  };

  const handleUpdateNode = async () => {
    if (!currentNode) return;

    try {
      if (!title.trim()) {
        toast.error('Please enter a node title');
        return;
      }

      await updateRoadmapNode(currentNode.id, {
        title,
        description,
        position,
        is_bonus: isBonus,
        default_exercise_id: selectedExerciseId
      });

      setIsEditDialogOpen(false);
      await loadNodes();
    } catch (error) {
      console.error('Failed to update node', error);
    }
  };

  const handleDeleteNode = async () => {
    if (!currentNode) return;

    try {
      await deleteRoadmapNode(currentNode.id);
      setIsDeleteDialogOpen(false);
      setCurrentNode(null);
      await loadNodes();
    } catch (error) {
      console.error('Failed to delete node', error);
    }
  };

  const openAddDialog = () => {
    // Set next available position
    const nextPosition = nodes.length > 0 
      ? Math.max(...nodes.map(node => node.position)) + 1 
      : 1;
    
    setTitle('');
    setDescription('');
    setPosition(nextPosition);
    setIsBonus(false);
    setSelectedExerciseId(null);
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (node: RoadmapNode) => {
    setCurrentNode(node);
    setTitle(node.title);
    setDescription(node.description || '');
    setPosition(node.position);
    setIsBonus(node.is_bonus);
    setSelectedExerciseId(node.default_exercise_id);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (node: RoadmapNode) => {
    setCurrentNode(node);
    setIsDeleteDialogOpen(true);
  };

  const getExerciseTitle = (exerciseId: string | null) => {
    if (!exerciseId) return 'None';
    const exercise = defaultExercises.find(ex => ex.id === exerciseId);
    return exercise ? exercise.title : 'Exercise not found';
  };

  if (loadingRoadmap) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Roadmap not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => navigate('/dashboard/admin')} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h2 className="text-2xl font-bold">
          Edit Roadmap: {roadmap.name} <span className="text-sm font-normal text-muted-foreground ml-2">Level {roadmap.level}</span>
        </h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Roadmap Nodes</CardTitle>
            <CardDescription>Manage the exercises and progression in this roadmap</CardDescription>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Node
          </Button>
        </CardHeader>
        <CardContent>
          {loadingNodes ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : nodes.length === 0 ? (
            <Alert>
              <AlertDescription>
                No nodes in this roadmap yet. Add your first node to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Exercise</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...nodes]
                  .sort((a, b) => a.position - b.position)
                  .map((node) => (
                    <TableRow key={node.id}>
                      <TableCell className="font-medium">{node.position}</TableCell>
                      <TableCell>{node.title}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {node.default_exercise_id ? (
                          <div className="flex items-center">
                            <Link className="h-4 w-4 mr-1 text-blue-500" />
                            {getExerciseTitle(node.default_exercise_id)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No exercise linked</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {node.is_bonus ? (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                            <Lightning className="h-3 w-3 mr-1" /> Bonus
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Regular
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="w-[200px]">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(node)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => openDeleteDialog(node)}
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
        <CardFooter className="flex justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <p className="text-sm text-muted-foreground">
            Total nodes: {nodes.length}
            {nodes.length > 0 && (
              <> | Regular: {nodes.filter(n => !n.is_bonus).length} | Bonus: {nodes.filter(n => n.is_bonus).length}</>
            )}
          </p>
        </CardFooter>
      </Card>

      {/* Add Node Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Node</DialogTitle>
            <DialogDescription>
              Add a new exercise node to this roadmap
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Node title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this node"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                type="number"
                min="1"
                value={position}
                onChange={(e) => setPosition(parseInt(e.target.value))}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="is-bonus" 
                checked={isBonus} 
                onCheckedChange={setIsBonus} 
              />
              <Label htmlFor="is-bonus">Bonus Node</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="exercise">Link Exercise (optional)</Label>
              {loadingExercises ? (
                <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
              ) : (
                <Select value={selectedExerciseId || ''} onValueChange={setSelectedExerciseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {defaultExercises.map(exercise => (
                      <SelectItem key={exercise.id} value={exercise.id}>
                        {exercise.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNode}>
              Add Node
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Node Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Node</DialogTitle>
            <DialogDescription>
              Update this roadmap node
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-position">Position</Label>
              <Input
                id="edit-position"
                type="number"
                min="1"
                value={position}
                onChange={(e) => setPosition(parseInt(e.target.value))}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="edit-is-bonus" 
                checked={isBonus} 
                onCheckedChange={setIsBonus} 
              />
              <Label htmlFor="edit-is-bonus">Bonus Node</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-exercise">Link Exercise (optional)</Label>
              {loadingExercises ? (
                <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
              ) : (
                <Select value={selectedExerciseId || ''} onValueChange={setSelectedExerciseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {defaultExercises.map(exercise => (
                      <SelectItem key={exercise.id} value={exercise.id}>
                        {exercise.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateNode}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Node Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Node</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this node? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteNode}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoadmapNodeEditor;
