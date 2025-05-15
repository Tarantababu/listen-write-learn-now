
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Plus, ArrowLeft, Pencil, Trash2, Link, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NodeForm } from './NodeForm';
import { ExerciseLinkForm } from './ExerciseLinkForm';
import { getCurriculum, getCurriculumNodes, getNodeExercises, deleteCurriculumNode, unlinkExerciseFromNode } from '@/services/curriculumService';
import LevelBadge from '@/components/LevelBadge';
import { LanguageLevel } from '@/types';

interface CurriculumDetailProps {
  curriculumId: string;
  onBack: () => void;
}

export const CurriculumDetail: React.FC<CurriculumDetailProps> = ({
  curriculumId,
  onBack,
}) => {
  const [curriculum, setCurriculum] = useState<any | null>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [nodeExercises, setNodeExercises] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingExercises, setIsLoadingExercises] = useState<Record<string, boolean>>({});
  const [showNodeForm, setShowNodeForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [editingNode, setEditingNode] = useState<any | null>(null);

  // Load curriculum details
  const loadCurriculum = async () => {
    try {
      setIsLoading(true);
      const curriculumData = await getCurriculum(curriculumId);
      if (curriculumData) {
        setCurriculum(curriculumData);
      }
    } catch (error) {
      console.error('Error loading curriculum:', error);
      toast({
        title: 'Error',
        description: 'Failed to load curriculum details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load curriculum nodes
  const loadNodes = async () => {
    try {
      setIsLoading(true);
      const nodesData = await getCurriculumNodes(curriculumId);
      setNodes(nodesData);
    } catch (error) {
      console.error('Error loading nodes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load curriculum nodes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load exercises for a node
  const loadNodeExercises = async (nodeId: string) => {
    try {
      setIsLoadingExercises(prev => ({ ...prev, [nodeId]: true }));
      const exercises = await getNodeExercises(nodeId);
      setNodeExercises(prev => ({ ...prev, [nodeId]: exercises }));
    } catch (error) {
      console.error('Error loading node exercises:', error);
    } finally {
      setIsLoadingExercises(prev => ({ ...prev, [nodeId]: false }));
    }
  };

  // Handle node deletion
  const handleDeleteNode = async (nodeId: string) => {
    if (!window.confirm('Are you sure you want to delete this node?')) {
      return;
    }

    try {
      await deleteCurriculumNode(nodeId);
      toast({ title: 'Node deleted' });
      loadNodes();
    } catch (error) {
      console.error('Error deleting node:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete node',
        variant: 'destructive',
      });
    }
  };

  // Handle unlinking an exercise from a node
  const handleUnlinkExercise = async (nodeExerciseId: string, nodeId: string) => {
    if (!window.confirm('Are you sure you want to unlink this exercise?')) {
      return;
    }

    try {
      await unlinkExerciseFromNode(nodeExerciseId);
      toast({ title: 'Exercise unlinked' });
      loadNodeExercises(nodeId);
    } catch (error) {
      console.error('Error unlinking exercise:', error);
      toast({
        title: 'Error',
        description: 'Failed to unlink exercise',
        variant: 'destructive',
      });
    }
  };

  // Handle edit node click
  const handleEditNodeClick = (node: any) => {
    setEditingNode(node);
    setShowNodeForm(true);
  };

  // Handle link exercise click
  const handleLinkExerciseClick = (node: any) => {
    setSelectedNode(node);
    setShowLinkForm(true);
  };

  // Reset form states
  const handleCloseNodeForm = () => {
    setEditingNode(null);
    setShowNodeForm(false);
  };

  const handleCloseLinkForm = () => {
    setSelectedNode(null);
    setShowLinkForm(false);
  };

  // Success handlers
  const handleNodeFormSuccess = () => {
    handleCloseNodeForm();
    loadNodes();
  };

  const handleLinkFormSuccess = () => {
    if (selectedNode) {
      loadNodeExercises(selectedNode.id);
    }
    handleCloseLinkForm();
  };

  // Load data on component mount
  useEffect(() => {
    loadCurriculum();
    loadNodes();
  }, [curriculumId]);

  // Load exercises when nodes are loaded or changed
  useEffect(() => {
    nodes.forEach(node => {
      loadNodeExercises(node.id);
    });
  }, [nodes]);

  // Get existing exercise IDs for a node
  const getExistingExerciseIds = (nodeId: string): string[] => {
    return (nodeExercises[nodeId] || []).map(ne => ne.exercise_id);
  };

  if (isLoading && !curriculum) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Curricula
        </Button>
        <Button onClick={() => setShowNodeForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Node
        </Button>
      </div>

      {curriculum && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{curriculum.name}</CardTitle>
                <div className="flex items-center mt-2 space-x-2">
                  <span className="text-sm text-muted-foreground capitalize">
                    {curriculum.language}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <LevelBadge level={curriculum.level as LanguageLevel} />
                  <span className="text-muted-foreground">•</span>
                  <span className={`text-sm ${
                    curriculum.status === 'active' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {curriculum.status}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {curriculum.description && (
              <p className="text-muted-foreground mb-4">{curriculum.description}</p>
            )}

            <h3 className="font-semibold mb-2">Curriculum Nodes</h3>
            
            {nodes.length === 0 ? (
              <div className="flex justify-center items-center h-20 border rounded-md bg-muted/50 text-muted-foreground">
                No nodes added yet
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Completion Req.</TableHead>
                      <TableHead>Exercises</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nodes.sort((a, b) => a.sequence_order - b.sequence_order).map((node) => (
                      <TableRow key={node.id}>
                        <TableCell>{node.sequence_order}</TableCell>
                        <TableCell className="font-medium">{node.name}</TableCell>
                        <TableCell>
                          {node.min_completion_count} completions at {node.min_accuracy_percentage}% accuracy
                        </TableCell>
                        <TableCell>
                          {isLoadingExercises[node.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <span>
                              {nodeExercises[node.id]?.length || 0} exercise(s)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditNodeClick(node)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Node
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleLinkExerciseClick(node)}>
                                <Link className="mr-2 h-4 w-4" />
                                Link Exercise
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteNode(node.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Node
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {selectedNode && nodeExercises[selectedNode.id] && nodeExercises[selectedNode.id].length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Linked Exercises for "{selectedNode.name}"</h4>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Exercise</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nodeExercises[selectedNode.id]
                        .sort((a, b) => a.sequence_order - b.sequence_order)
                        .map((ne) => (
                          <TableRow key={ne.id}>
                            <TableCell>{ne.sequence_order}</TableCell>
                            <TableCell>{ne.exercise?.title || 'Unknown Exercise'}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleUnlinkExercise(ne.id, selectedNode.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showNodeForm} onOpenChange={setShowNodeForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingNode ? 'Edit Node' : 'Add Node'}
            </DialogTitle>
          </DialogHeader>
          <NodeForm
            curriculumId={curriculumId}
            node={editingNode}
            onSuccess={handleNodeFormSuccess}
            onCancel={handleCloseNodeForm}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showLinkForm} onOpenChange={setShowLinkForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Link Exercise to Node</DialogTitle>
          </DialogHeader>
          {selectedNode && (
            <ExerciseLinkForm
              nodeId={selectedNode.id}
              existingExercises={getExistingExerciseIds(selectedNode.id)}
              language={curriculum?.language || ''}
              onSuccess={handleLinkFormSuccess}
              onCancel={handleCloseLinkForm}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
