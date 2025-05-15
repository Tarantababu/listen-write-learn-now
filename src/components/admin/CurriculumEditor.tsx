import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageLevel, Language } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import LevelBadge from '@/components/LevelBadge';
import { 
  fetchCurriculumPathsByLanguage,
  fetchCurriculumNodes,
  mapCurriculumPathFromDb,
  mapCurriculumNodeFromDb
} from '@/services/curriculumService';
import { supabase } from '@/integrations/supabase/client';

const languageLevels: LanguageLevel[] = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const availableLanguages: Language[] = [
  'english', 'german', 'spanish', 'french', 'portuguese', 'italian',
  'turkish', 'swedish', 'dutch', 'norwegian', 'russian', 'polish',
  'chinese', 'japanese', 'korean', 'arabic'
];

interface PathFormData {
  id?: string;
  language: Language;
  level: LanguageLevel;
  description: string;
}

interface NodeFormData {
  id?: string;
  curriculumPathId: string;
  title: string;
  description: string;
  position: number;
  isBonus: boolean;
  defaultExerciseId?: string;
}

const CurriculumEditor: React.FC = () => {
  const [paths, setPaths] = useState<any[]>([]);
  const [defaultExercises, setDefaultExercises] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('paths');
  
  const [isPathDialogOpen, setIsPathDialogOpen] = useState(false);
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);
  const [pathForm, setPathForm] = useState<PathFormData>({
    language: 'english',
    level: 'A1',
    description: ''
  });
  const [nodeForm, setNodeForm] = useState<NodeFormData>({
    curriculumPathId: '',
    title: '',
    description: '',
    position: 1,
    isBonus: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<'add' | 'edit'>('add');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  
  // Load curriculum paths and default exercises on mount
  useEffect(() => {
    fetchCurriculumPaths();
    fetchDefaultExercises();
  }, []);
  
  // Load nodes when a path is selected
  useEffect(() => {
    if (selectedPath) {
      fetchCurriculumNodes(selectedPath).then(nodes => {
        setNodes(nodes);
        setLoading(false);
      }).catch(error => {
        console.error('Error fetching curriculum nodes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load curriculum nodes',
          variant: 'destructive'
        });
        setLoading(false);
      });
    }
  }, [selectedPath]);
  
  const fetchCurriculumPaths = async () => {
    try {
      setLoading(true);
      
      // Fetch paths for all languages
      const allPaths: any[] = [];
      for (const language of availableLanguages) {
        const pathsForLanguage = await fetchCurriculumPathsByLanguage(language as Language);
        allPaths.push(...pathsForLanguage);
      }
      
      setPaths(allPaths);
      
      // Set the first path as selected if exists
      if (allPaths && allPaths.length > 0 && !selectedPath) {
        setSelectedPath(allPaths[0].id);
      }
    } catch (error) {
      console.error('Error fetching curriculum paths:', error);
      toast({
        title: 'Error',
        description: 'Failed to load curriculum paths',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDefaultExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('default_exercises')
        .select('id, title, language')
        .order('title');
        
      if (error) throw error;
      
      setDefaultExercises(data || []);
    } catch (error) {
      console.error('Error fetching default exercises:', error);
    }
  };
  
  const handleAddPath = () => {
    setCurrentOperation('add');
    setPathForm({
      language: 'english',
      level: 'A1',
      description: ''
    });
    setIsPathDialogOpen(true);
  };
  
  const handleEditPath = (path: any) => {
    setCurrentOperation('edit');
    setPathForm({
      id: path.id,
      language: path.language,
      level: path.level,
      description: path.description || ''
    });
    setIsPathDialogOpen(true);
  };
  
  const handleAddNode = () => {
    setCurrentOperation('add');
    setNodeForm({
      curriculumPathId: selectedPath || '',
      title: '',
      description: '',
      position: nodes.length + 1,
      isBonus: false
    });
    setIsNodeDialogOpen(true);
  };
  
  const handleEditNode = (node: any) => {
    setCurrentOperation('edit');
    setNodeForm({
      id: node.id,
      curriculumPathId: node.curriculum_path_id,
      title: node.title,
      description: node.description || '',
      position: node.position,
      isBonus: node.is_bonus,
      defaultExerciseId: node.default_exercise_id
    });
    setIsNodeDialogOpen(true);
  };
  
  const handleSavePath = async () => {
    try {
      setSaving(true);
      
      if (currentOperation === 'add') {
        const { error } = await supabase
          .from('curriculum_paths')
          .insert({
            language: pathForm.language,
            level: pathForm.level,
            description: pathForm.description || null
          });
          
        if (error) throw error;
        
        toast({
          title: 'Path created',
          description: 'Curriculum path has been created successfully'
        });
      } else {
        const { error } = await supabase
          .from('curriculum_paths')
          .update({
            language: pathForm.language,
            level: pathForm.level,
            description: pathForm.description || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', pathForm.id);
          
        if (error) throw error;
        
        toast({
          title: 'Path updated',
          description: 'Curriculum path has been updated successfully'
        });
      }
      
      // Refresh paths
      await fetchCurriculumPaths();
      setIsPathDialogOpen(false);
    } catch (error) {
      console.error('Error saving curriculum path:', error);
      toast({
        title: 'Error',
        description: 'Failed to save curriculum path',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleSaveNode = async () => {
    try {
      setSaving(true);
      
      if (currentOperation === 'add') {
        const { error } = await supabase
          .from('curriculum_nodes')
          .insert({
            curriculum_path_id: nodeForm.curriculumPathId,
            title: nodeForm.title,
            description: nodeForm.description || null,
            position: nodeForm.position,
            is_bonus: nodeForm.isBonus,
            default_exercise_id: nodeForm.defaultExerciseId || null
          });
          
        if (error) throw error;
        
        toast({
          title: 'Node created',
          description: 'Curriculum node has been created successfully'
        });
      } else {
        const { error } = await supabase
          .from('curriculum_nodes')
          .update({
            title: nodeForm.title,
            description: nodeForm.description || null,
            position: nodeForm.position,
            is_bonus: nodeForm.isBonus,
            default_exercise_id: nodeForm.defaultExerciseId || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', nodeForm.id);
          
        if (error) throw error;
        
        toast({
          title: 'Node updated',
          description: 'Curriculum node has been updated successfully'
        });
      }
      
      // Refresh nodes
      if (selectedPath) {
        await fetchCurriculumNodes(selectedPath);
      }
      setIsNodeDialogOpen(false);
    } catch (error) {
      console.error('Error saving curriculum node:', error);
      toast({
        title: 'Error',
        description: 'Failed to save curriculum node',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeletePath = async (pathId: string) => {
    if (!window.confirm('Are you sure you want to delete this curriculum path? This will delete all associated nodes and user progress.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('curriculum_paths')
        .delete()
        .eq('id', pathId);
        
      if (error) throw error;
      
      toast({
        title: 'Path deleted',
        description: 'Curriculum path has been deleted successfully'
      });
      
      // Refresh paths and reset selected path
      await fetchCurriculumPaths();
      setSelectedPath(null);
    } catch (error) {
      console.error('Error deleting curriculum path:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete curriculum path',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteNode = async (nodeId: string) => {
    if (!window.confirm('Are you sure you want to delete this node? This will also delete associated user progress.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('curriculum_nodes')
        .delete()
        .eq('id', nodeId);
        
      if (error) throw error;
      
      toast({
        title: 'Node deleted',
        description: 'Curriculum node has been deleted successfully'
      });
      
      // Refresh nodes
      if (selectedPath) {
        await fetchCurriculumNodes(selectedPath);
      }
    } catch (error) {
      console.error('Error deleting curriculum node:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete curriculum node',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Curriculum Management</h2>
        {activeTab === 'paths' ? (
          <Button onClick={handleAddPath}>
            <Plus className="h-4 w-4 mr-2" /> Add Path
          </Button>
        ) : selectedPath && (
          <Button onClick={handleAddNode}>
            <Plus className="h-4 w-4 mr-2" /> Add Node
          </Button>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="paths">Curriculum Paths</TabsTrigger>
          <TabsTrigger value="nodes" disabled={!selectedPath}>Curriculum Nodes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="paths" className="space-y-4 pt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : paths.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No curriculum paths found. Add a new path to get started.</p>
            </div>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Language</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paths.map(path => (
                    <TableRow 
                      key={path.id} 
                      className={selectedPath === path.id ? 'bg-muted/50' : ''}
                      onClick={() => setSelectedPath(path.id)}
                    >
                      <TableCell className="capitalize">{path.language}</TableCell>
                      <TableCell>
                        <LevelBadge level={path.level} />
                      </TableCell>
                      <TableCell>{path.description || '-'}</TableCell>
                      <TableCell>{new Date(path.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPath(path);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePath(path.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="nodes" className="space-y-4 pt-4">
          {!selectedPath ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Please select a curriculum path first.</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : nodes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No nodes found for this curriculum path. Add a new node to get started.</p>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium">
                  {paths.find(p => p.id === selectedPath)?.language} - {paths.find(p => p.id === selectedPath)?.level}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage the exercises for this curriculum path
                </p>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Exercise</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nodes.map(node => (
                    <TableRow key={node.id}>
                      <TableCell>{node.position}</TableCell>
                      <TableCell>{node.title}</TableCell>
                      <TableCell>{node.description || '-'}</TableCell>
                      <TableCell>{node.is_bonus ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        {node.default_exercise_id ? 
                          defaultExercises.find(ex => ex.id === node.default_exercise_id)?.title || 'Unknown' : 
                          'None'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEditNode(node)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDeleteNode(node.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Path Dialog */}
      <Dialog open={isPathDialogOpen} onOpenChange={setIsPathDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentOperation === 'add' ? 'Add New Path' : 'Edit Path'}</DialogTitle>
            <DialogDescription>
              {currentOperation === 'add' ? 'Create a new curriculum path' : 'Edit existing curriculum path'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select 
                value={pathForm.language} 
                onValueChange={(value) => setPathForm({...pathForm, language: value as Language})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map(lang => (
                    <SelectItem key={lang} value={lang} className="capitalize">
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select 
                value={pathForm.level} 
                onValueChange={(value) => setPathForm({...pathForm, level: value as LanguageLevel})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  {languageLevels.map(level => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                value={pathForm.description}
                onChange={(e) => setPathForm({...pathForm, description: e.target.value})}
                placeholder="Curriculum path description"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPathDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePath} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {currentOperation === 'add' ? 'Create Path' : 'Update Path'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Node Dialog */}
      <Dialog open={isNodeDialogOpen} onOpenChange={setIsNodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentOperation === 'add' ? 'Add New Node' : 'Edit Node'}</DialogTitle>
            <DialogDescription>
              {currentOperation === 'add' ? 'Create a new curriculum node' : 'Edit existing curriculum node'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title"
                value={nodeForm.title}
                onChange={(e) => setNodeForm({...nodeForm, title: e.target.value})}
                placeholder="Node title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                value={nodeForm.description}
                onChange={(e) => setNodeForm({...nodeForm, description: e.target.value})}
                placeholder="Node description"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input 
                id="position"
                type="number"
                value={nodeForm.position}
                onChange={(e) => setNodeForm({...nodeForm, position: parseInt(e.target.value)})}
                min={1}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultExercise">Default Exercise (Optional)</Label>
              <Select 
                value={nodeForm.defaultExerciseId || ''} 
                onValueChange={(value) => setNodeForm({...nodeForm, defaultExerciseId: value || undefined})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Exercise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {defaultExercises
                    .filter(ex => ex.language === paths.find(p => p.id === selectedPath)?.language)
                    .map(ex => (
                      <SelectItem key={ex.id} value={ex.id}>
                        {ex.title}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isBonus"
                checked={nodeForm.isBonus}
                onChange={(e) => setNodeForm({...nodeForm, isBonus: e.target.checked})}
              />
              <Label htmlFor="isBonus">Bonus content</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNodeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNode} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {currentOperation === 'add' ? 'Create Node' : 'Update Node'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CurriculumEditor;
