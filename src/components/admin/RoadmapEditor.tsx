import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Save, Trash2, Star, Pencil, Check, X } from 'lucide-react';
import { LanguageLevel, Language, Roadmap, RoadmapNode, RoadmapLanguage } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MultiSelect } from '@/components/ui/multi-select';

// Form schemas
const roadmapFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  level: z.enum(['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']) as z.ZodType<LanguageLevel>,
  description: z.string().optional(),
  languages: z.array(z.string()).min(1, "At least one language is required")
});

const nodeFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  position: z.number().int().min(0),
  defaultExerciseId: z.string().optional(),
  description: z.string().optional(),
  isBonus: z.boolean().default(false),
  language: z.string().optional()
});

type RoadmapFormValues = z.infer<typeof roadmapFormSchema>;
type NodeFormValues = z.infer<typeof nodeFormSchema>;

export const RoadmapEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState('roadmaps');
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [defaultExercises, setDefaultExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRoadmap, setSavingRoadmap] = useState(false);
  const [savingNode, setSavingNode] = useState(false);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'roadmap' | 'node', id: string } | null>(null);
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [roadmapLanguages, setRoadmapLanguages] = useState<RoadmapLanguage[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<{value: string, label: string}[]>([]);

  const roadmapForm = useForm<RoadmapFormValues>({
    resolver: zodResolver(roadmapFormSchema),
    defaultValues: {
      name: '',
      level: 'A1',
      description: '',
      languages: []
    }
  });

  const nodeForm = useForm<NodeFormValues>({
    resolver: zodResolver(nodeFormSchema),
    defaultValues: {
      title: '',
      position: 0,
      description: '',
      isBonus: false,
      language: undefined
    }
  });

  // Setup available languages
  useEffect(() => {
    // All supported languages
    const languages: {value: string, label: string}[] = [
      { value: 'english', label: 'English' },
      { value: 'german', label: 'German' },
      { value: 'spanish', label: 'Spanish' },
      { value: 'french', label: 'French' },
      { value: 'portuguese', label: 'Portuguese' },
      { value: 'italian', label: 'Italian' },
      { value: 'turkish', label: 'Turkish' },
      { value: 'swedish', label: 'Swedish' },
      { value: 'dutch', label: 'Dutch' },
      { value: 'norwegian', label: 'Norwegian' },
      { value: 'russian', label: 'Russian' },
      { value: 'polish', label: 'Polish' },
      { value: 'chinese', label: 'Chinese' },
      { value: 'japanese', label: 'Japanese' },
      { value: 'korean', label: 'Korean' },
      { value: 'arabic', label: 'Arabic' }
    ];
    setAvailableLanguages(languages);
  }, []);

  // Fetch roadmaps
  useEffect(() => {
    const fetchRoadmaps = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('roadmaps')
          .select('*')
          .order('level', { ascending: true });

        if (error) throw error;

        const formattedRoadmaps: Roadmap[] = data.map(roadmap => ({
          id: roadmap.id,
          name: roadmap.name,
          level: roadmap.level as LanguageLevel,
          description: roadmap.description,
          createdAt: new Date(roadmap.created_at),
          updatedAt: new Date(roadmap.updated_at),
          createdBy: roadmap.created_by
        }));

        setRoadmaps(formattedRoadmaps);
      } catch (err: any) {
        console.error('Error fetching roadmaps:', err);
        toast.error('Failed to load roadmaps');
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmaps();
  }, []);

  // Fetch default exercises for selection
  useEffect(() => {
    const fetchDefaultExercises = async () => {
      try {
        const { data, error } = await supabase
          .from('default_exercises')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setDefaultExercises(data);
      } catch (err: any) {
        console.error('Error fetching default exercises:', err);
      }
    };

    fetchDefaultExercises();
  }, []);

  // Fetch nodes when a roadmap is selected
  useEffect(() => {
    if (!selectedRoadmap) {
      setNodes([]);
      return;
    }

    const fetchNodes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('roadmap_nodes')
          .select('*')
          .eq('roadmap_id', selectedRoadmap.id)
          .order('position', { ascending: true });

        if (error) throw error;

        const formattedNodes: RoadmapNode[] = data.map(node => ({
          id: node.id,
          roadmapId: node.roadmap_id,
          defaultExerciseId: node.default_exercise_id,
          title: node.title,
          description: node.description,
          position: node.position,
          isBonus: node.is_bonus,
          language: node.language as Language | undefined,
          createdAt: new Date(node.created_at),
          updatedAt: new Date(node.updated_at)
        }));

        setNodes(formattedNodes);
      } catch (err: any) {
        console.error('Error fetching nodes:', err);
        toast.error('Failed to load roadmap nodes');
      } finally {
        setLoading(false);
      }
    };

    fetchNodes();

    // Also fetch roadmap languages
    const fetchRoadmapLanguages = async () => {
      try {
        const { data, error } = await supabase
          .from('roadmap_languages')
          .select('*')
          .eq('roadmap_id', selectedRoadmap.id);

        if (error) throw error;

        const formattedLanguages: RoadmapLanguage[] = data.map(lang => ({
          id: lang.id,
          roadmapId: lang.roadmap_id,
          language: lang.language as Language,
          createdAt: new Date(lang.created_at)
        }));

        setRoadmapLanguages(formattedLanguages);
        setSelectedLanguages(formattedLanguages.map(l => l.language));
      } catch (err: any) {
        console.error('Error fetching roadmap languages:', err);
      }
    };

    fetchRoadmapLanguages();
  }, [selectedRoadmap]);

  // Set form values when a roadmap is selected for editing
  useEffect(() => {
    if (selectedRoadmap) {
      roadmapForm.reset({
        name: selectedRoadmap.name,
        level: selectedRoadmap.level,
        description: selectedRoadmap.description || '',
        languages: selectedLanguages
      });
    } else {
      roadmapForm.reset({
        name: '',
        level: 'A1' as LanguageLevel,
        description: '',
        languages: []
      });
    }
  }, [selectedRoadmap, roadmapForm, selectedLanguages]);

  // Set form values when a node is selected for editing
  useEffect(() => {
    if (selectedNode) {
      nodeForm.reset({
        title: selectedNode.title,
        position: selectedNode.position,
        defaultExerciseId: selectedNode.defaultExerciseId,
        description: selectedNode.description || '',
        isBonus: selectedNode.isBonus,
        language: selectedNode.language
      });
    } else {
      nodeForm.reset({
        title: '',
        position: nodes.length,
        description: '',
        isBonus: false,
        language: undefined
      });
    }
  }, [selectedNode, nodeForm, nodes.length]);

  // Create or update roadmap
  const handleSaveRoadmap = async (values: RoadmapFormValues) => {
    setSavingRoadmap(true);
    try {
      if (selectedRoadmap) {
        // Update existing roadmap
        const { error: roadmapError } = await supabase
          .from('roadmaps')
          .update({
            name: values.name,
            level: values.level,
            description: values.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedRoadmap.id);

        if (roadmapError) throw roadmapError;

        // Delete existing language associations
        const { error: deleteError } = await supabase
          .from('roadmap_languages')
          .delete()
          .eq('roadmap_id', selectedRoadmap.id);

        if (deleteError) throw deleteError;

        // Create new language associations
        const languageEntries = values.languages.map(lang => ({
          roadmap_id: selectedRoadmap.id,
          language: lang
        }));

        const { error: langError } = await supabase
          .from('roadmap_languages')
          .insert(languageEntries);

        if (langError) throw langError;

        // Update local state
        const updatedRoadmaps = roadmaps.map(roadmap => 
          roadmap.id === selectedRoadmap.id 
            ? { 
                ...roadmap, 
                name: values.name, 
                level: values.level, 
                description: values.description,
                updatedAt: new Date(),
                languages: values.languages as Language[]
              } 
            : roadmap
        );
        setRoadmaps(updatedRoadmaps);
        setSelectedRoadmap({
          ...selectedRoadmap,
          name: values.name,
          level: values.level,
          description: values.description,
          updatedAt: new Date(),
          languages: values.languages as Language[]
        });
        setSelectedLanguages(values.languages);
        toast.success('Roadmap updated successfully');
      } else {
        // Create new roadmap
        const { data: roadmapData, error: roadmapError } = await supabase
          .from('roadmaps')
          .insert([
            {
              name: values.name,
              level: values.level,
              description: values.description
            }
          ])
          .select()
          .single();

        if (roadmapError) throw roadmapError;

        // Create language associations
        const languageEntries = values.languages.map(lang => ({
          roadmap_id: roadmapData.id,
          language: lang
        }));

        const { error: langError } = await supabase
          .from('roadmap_languages')
          .insert(languageEntries);

        if (langError) throw langError;

        // Add to local state
        const newRoadmap: Roadmap = {
          id: roadmapData.id,
          name: roadmapData.name,
          level: roadmapData.level as LanguageLevel,
          description: roadmapData.description,
          createdAt: new Date(roadmapData.created_at),
          updatedAt: new Date(roadmapData.updated_at),
          createdBy: roadmapData.created_by,
          languages: values.languages as Language[]
        };
        setRoadmaps([...roadmaps, newRoadmap]);
        setSelectedRoadmap(newRoadmap);
        setSelectedLanguages(values.languages);
        toast.success('Roadmap created successfully');
      }
    } catch (err: any) {
      console.error('Error saving roadmap:', err);
      toast.error(selectedRoadmap ? 'Failed to update roadmap' : 'Failed to create roadmap');
    } finally {
      setSavingRoadmap(false);
    }
  };

  // Create or update node
  const handleSaveNode = async (values: NodeFormValues) => {
    if (!selectedRoadmap) {
      toast.error('Please select a roadmap first');
      return;
    }

    setSavingNode(true);
    try {
      if (selectedNode) {
        // Update existing node
        const { error } = await supabase
          .from('roadmap_nodes')
          .update({
            title: values.title,
            position: values.position,
            default_exercise_id: values.defaultExerciseId || null,
            description: values.description,
            is_bonus: values.isBonus,
            language: values.language as Language | null, // Cast to Language type or null
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedNode.id);

        if (error) throw error;

        // Update local state
        const updatedNodes = nodes.map(node => 
          node.id === selectedNode.id 
            ? { 
                ...node, 
                title: values.title, 
                position: values.position, 
                defaultExerciseId: values.defaultExerciseId,
                description: values.description,
                isBonus: values.isBonus,
                language: values.language as Language | undefined, // Cast to Language type
                updatedAt: new Date()
              } 
            : node
        );
        setNodes(updatedNodes.sort((a, b) => a.position - b.position));
        setSelectedNode(null);
        setNodeDialogOpen(false);
        toast.success('Node updated successfully');
      } else {
        // Create new node
        const { data, error } = await supabase
          .from('roadmap_nodes')
          .insert([
            {
              roadmap_id: selectedRoadmap.id,
              title: values.title,
              position: values.position,
              default_exercise_id: values.defaultExerciseId || null,
              description: values.description,
              is_bonus: values.isBonus,
              language: values.language as Language | null // Cast to Language type or null
            }
          ])
          .select()
          .single();

        if (error) throw error;

        // Add to local state
        const newNode: RoadmapNode = {
          id: data.id,
          roadmapId: data.roadmap_id,
          defaultExerciseId: data.default_exercise_id,
          title: data.title,
          description: data.description,
          position: data.position,
          isBonus: data.is_bonus,
          language: data.language as Language | undefined, // Cast to Language type
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };
        setNodes([...nodes, newNode].sort((a, b) => a.position - b.position));
        setNodeDialogOpen(false);
        toast.success('Node created successfully');
      }
    } catch (err: any) {
      console.error('Error saving node:', err);
      toast.error(selectedNode ? 'Failed to update node' : 'Failed to create node');
    } finally {
      setSavingNode(false);
    }
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'roadmap') {
        const { error } = await supabase
          .from('roadmaps')
          .delete()
          .eq('id', itemToDelete.id);

        if (error) throw error;

        setRoadmaps(roadmaps.filter(r => r.id !== itemToDelete.id));
        if (selectedRoadmap?.id === itemToDelete.id) {
          setSelectedRoadmap(null);
        }
        toast.success('Roadmap deleted successfully');
      } else {
        const { error } = await supabase
          .from('roadmap_nodes')
          .delete()
          .eq('id', itemToDelete.id);

        if (error) throw error;

        setNodes(nodes.filter(n => n.id !== itemToDelete.id));
        toast.success('Node deleted successfully');
      }
    } catch (err: any) {
      console.error('Error deleting item:', err);
      toast.error(`Failed to delete ${itemToDelete.type}`);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // Open node edit dialog
  const handleEditNode = (node: RoadmapNode) => {
    setSelectedNode(node);
    setNodeDialogOpen(true);
  };

  // Add node button click
  const handleAddNode = () => {
    setSelectedNode(null);
    nodeForm.reset({
      title: '',
      position: nodes.length,
      description: '',
      isBonus: false,
      language: undefined
    });
    setNodeDialogOpen(true);
  };

  // Get language name from language code
  const getLanguageName = (code: string): string => {
    const language = availableLanguages.find(l => l.value === code);
    return language ? language.label : code;
  };

  // Get filtered exercises by language
  const getFilteredExercisesByLanguage = (language: string | undefined) => {
    if (!language) return defaultExercises;
    return defaultExercises.filter(ex => ex.language === language);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="roadmaps" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="roadmaps">Roadmaps</TabsTrigger>
          <TabsTrigger value="nodes" disabled={!selectedRoadmap}>
            Roadmap Nodes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roadmaps">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Roadmap List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Available Roadmaps</CardTitle>
                <CardDescription>
                  Select a roadmap to edit or create a new one
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : roadmaps.length > 0 ? (
                  <div className="space-y-2">
                    {roadmaps.map((roadmap) => (
                      <div 
                        key={roadmap.id}
                        className={`p-3 rounded-md cursor-pointer flex justify-between items-center hover:bg-muted transition-colors ${
                          selectedRoadmap?.id === roadmap.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedRoadmap(roadmap)}
                      >
                        <div>
                          <div className="font-medium">{roadmap.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{roadmap.level}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(roadmap.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {selectedRoadmap?.id === roadmap.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    No roadmaps found
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => {
                    setSelectedRoadmap(null);
                    roadmapForm.reset({
                      name: '',
                      level: 'A1',
                      description: '',
                      languages: []
                    });
                  }}
                  className="w-full"
                  variant="outline"
                  type="button"
                >
                  <Plus className="h-4 w-4 mr-2" /> New Roadmap
                </Button>
              </CardFooter>
            </Card>

            {/* Roadmap Editor */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedRoadmap ? 'Edit Roadmap' : 'Create New Roadmap'}
                </CardTitle>
                <CardDescription>
                  {selectedRoadmap ? 
                    'Update the roadmap details' : 
                    'Enter details for the new roadmap'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...roadmapForm}>
                  <form 
                    onSubmit={roadmapForm.handleSubmit(handleSaveRoadmap)}
                    className="space-y-4"
                  >
                    <FormField
                      control={roadmapForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter roadmap name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={roadmapForm.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language Level</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select language level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="A0">A0 - Absolute Beginner</SelectItem>
                              <SelectItem value="A1">A1 - Beginner</SelectItem>
                              <SelectItem value="A2">A2 - Elementary</SelectItem>
                              <SelectItem value="B1">B1 - Intermediate</SelectItem>
                              <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                              <SelectItem value="C1">C1 - Advanced</SelectItem>
                              <SelectItem value="C2">C2 - Proficiency</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={roadmapForm.control}
                      name="languages"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supported Languages</FormLabel>
                          <FormControl>
                            <MultiSelect
                              options={availableLanguages}
                              placeholder="Select languages..."
                              selected={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormDescription>
                            Select all languages that this roadmap supports
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={roadmapForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter roadmap description" 
                              className="min-h-[100px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between pt-2">
                      <Button 
                        variant="destructive" 
                        type="button"
                        disabled={!selectedRoadmap || savingRoadmap}
                        onClick={() => {
                          if (selectedRoadmap) {
                            setItemToDelete({ type: 'roadmap', id: selectedRoadmap.id });
                            setDeleteDialogOpen(true);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> 
                        Delete
                      </Button>

                      <Button 
                        type="submit" 
                        disabled={savingRoadmap}
                      >
                        {savingRoadmap && (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        )}
                        <Save className="h-4 w-4 mr-2" />
                        {selectedRoadmap ? 'Update Roadmap' : 'Create Roadmap'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nodes">
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Nodes for {selectedRoadmap?.name || 'Roadmap'}
              </CardTitle>
              <CardDescription>
                Configure sequential learning nodes for this roadmap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableCaption>
                    {nodes.length === 0 ? (
                      'No nodes found. Create your first node to get started.'
                    ) : (
                      'List of roadmap nodes in sequential order'
                    )}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Pos</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-32">Type</TableHead>
                      <TableHead className="w-32">Language</TableHead>
                      <TableHead>Exercise</TableHead>
                      <TableHead className="text-right w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : nodes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                          No nodes found
                        </TableCell>
                      </TableRow>
                    ) : (
                      nodes.map((node) => {
                        const exercise = defaultExercises.find(e => e.id === node.defaultExerciseId);
                        
                        return (
                          <TableRow key={node.id}>
                            <TableCell className="font-medium">{node.position + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {node.isBonus && (
                                  <Badge variant="outline" className="bg-amber-500/20 border-amber-500/50">
                                    <Star className="h-3 w-3 text-amber-500 mr-1" />
                                    Bonus
                                  </Badge>
                                )}
                                {node.title}
                              </div>
                            </TableCell>
                            <TableCell>{node.isBonus ? 'Bonus' : 'Required'}</TableCell>
                            <TableCell>
                              {node.language ? (
                                <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30">
                                  {getLanguageName(node.language)}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">None</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {exercise ? (
                                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                  {exercise.title}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">No exercise linked</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditNode(node)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setItemToDelete({ type: 'node', id: node.id });
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddNode} className="ml-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Node
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Node Edit Dialog */}
      <Dialog open={nodeDialogOpen} onOpenChange={setNodeDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedNode ? 'Edit Node' : 'Add Node'}
            </DialogTitle>
            <DialogDescription>
              {selectedNode ? 
                'Update the details for this roadmap node' : 
                'Create a new node in the roadmap sequence'
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...nodeForm}>
            <form onSubmit={nodeForm.handleSubmit(handleSaveNode)} className="space-y-4">
              <FormField
                control={nodeForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Node Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a title for this node" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={nodeForm.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0}
                          onChange={e => field.onChange(parseInt(e.target.value))} 
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={nodeForm.control}
                  name="isBonus"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Bonus Node</FormLabel>
                        <FormDescription>
                          Mark as an optional bonus exercise
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={nodeForm.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedLanguages.length > 0 ? (
                          selectedLanguages.map(lang => (
                            <SelectItem key={lang} value={lang}>
                              {getLanguageName(lang)}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-languages" disabled>
                            No languages available. Add languages to the roadmap first.
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The node will only be available for users learning this language
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={nodeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a brief description" 
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={nodeForm.control}
                name="defaultExerciseId"
                render={({ field }) => {
                  const filteredExercises = getFilteredExercisesByLanguage(nodeForm.watch('language'));
                  return (
                    <FormItem>
                      <FormLabel>Linked Exercise</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an exercise" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredExercises.length > 0 ? (
                            filteredExercises.map(exercise => (
                              <SelectItem key={exercise.id} value={exercise.id}>
                                {exercise.title} ({exercise.language})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              {nodeForm.watch('language') 
                                ? `No exercises available for ${getLanguageName(nodeForm.watch('language'))}`
                                : 'Select a language first'}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {nodeForm.watch('language') 
                          ? `Only showing exercises in ${getLanguageName(nodeForm.watch('language'))}`
                          : 'Select a language first to see relevant exercises'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setNodeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savingNode}>
                  {savingNode && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {selectedNode ? 'Update Node' : 'Create Node'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {itemToDelete?.type}?
              {itemToDelete?.type === 'roadmap' && (
                <span className="block mt-2 text-red-500">
                  This will also delete all nodes associated with this roadmap and cannot be undone.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoadmapEditor;
