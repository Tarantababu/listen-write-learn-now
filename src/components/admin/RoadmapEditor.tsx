import React, { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
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
import { Loader2, Plus, Save, Trash2, Star, Pencil, Check, X, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { roadmapService } from '@/services/roadmapService';

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
  language: z.string({ required_error: "Language is required" }),
  defaultExerciseId: z.string({ required_error: "Exercise is required" }),
  description: z.string().optional(),
  isBonus: z.boolean().default(false)
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
  const [filteredExercises, setFilteredExercises] = useState<any[]>([]);
  const [reorderingNode, setReorderingNode] = useState<string | null>(null);

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
      language: undefined,
      defaultExerciseId: undefined
    }
  });

  // Setup available languages
  useEffect(() => {
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
        const roadmapData = await roadmapService.getRoadmaps();
        setRoadmaps(roadmapData);
      } catch (err: any) {
        console.error('Error fetching roadmaps:', err);
        toast({
          variant: "destructive",
          title: "Failed to load roadmaps",
          description: "Could not fetch the roadmap data. Please try again."
        });
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
        toast({
          variant: "destructive",
          title: "Failed to load exercises",
          description: "Could not fetch available exercises. Some features might be limited."
        });
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
        const nodesData = await roadmapService.getRoadmapNodes(selectedRoadmap.id);
        setNodes(nodesData);
      } catch (err: any) {
        console.error('Error fetching nodes:', err);
        toast({
          variant: "destructive",
          title: "Failed to load roadmap nodes",
          description: "Could not fetch the nodes for this roadmap."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNodes();

    // Also fetch roadmap languages
    const fetchRoadmapLanguages = async () => {
      try {
        const languagesData = await roadmapService.getRoadmapLanguages(selectedRoadmap.id);
        setRoadmapLanguages(languagesData);
        setSelectedLanguages(languagesData.map(l => l.language));
      } catch (err: any) {
        console.error('Error fetching roadmap languages:', err);
        toast({
          variant: "destructive",
          title: "Failed to load roadmap languages",
          description: "Could not fetch the language support information for this roadmap."
        });
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
      
      // Update filtered exercises based on the selected language
      if (selectedNode.language) {
        updateFilteredExercises(selectedNode.language);
      }
    } else {
      nodeForm.reset({
        title: '',
        position: nodes.length,
        description: '',
        isBonus: false,
        language: undefined,
        defaultExerciseId: undefined
      });
      setFilteredExercises([]);
    }
  }, [selectedNode, nodeForm, nodes.length]);

  // Watch language changes to filter exercises
  const selectedLanguage = nodeForm.watch('language');
  
  useEffect(() => {
    if (selectedLanguage) {
      updateFilteredExercises(selectedLanguage);
    }
  }, [selectedLanguage, defaultExercises]);

  // Function to update filtered exercises based on selected language
  const updateFilteredExercises = (language: string) => {
    const exercises = defaultExercises.filter(ex => ex.language === language);
    setFilteredExercises(exercises);
    
    // Clear exercise selection if changing language and current selection isn't available
    const currentExerciseId = nodeForm.getValues('defaultExerciseId');
    if (currentExerciseId) {
      const exerciseExists = exercises.some(ex => ex.id === currentExerciseId);
      if (!exerciseExists) {
        nodeForm.setValue('defaultExerciseId', undefined);
        toast({
          variant: "destructive",
          title: "Exercise unavailable",
          description: `The previously selected exercise is not available in ${getLanguageName(language)}.`
        });
      }
    }
  };

  // Create or update roadmap
  const handleSaveRoadmap = async (values: RoadmapFormValues) => {
    setSavingRoadmap(true);
    try {
      if (selectedRoadmap) {
        // Update existing roadmap
        const updated = await roadmapService.updateRoadmap(selectedRoadmap.id, {
          name: values.name,
          level: values.level,
          description: values.description
        });

        if (!updated) throw new Error("Failed to update roadmap");

        // Set roadmap languages
        const languagesSet = await roadmapService.setRoadmapLanguages(selectedRoadmap.id, values.languages as Language[]);
        if (!languagesSet) throw new Error("Failed to update roadmap languages");

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
        toast({
          variant: "success",
          title: "Roadmap updated successfully",
          description: `The roadmap "${values.name}" has been updated.`
        });
      } else {
        // Create new roadmap
        const newRoadmapId = await roadmapService.createRoadmap({
          name: values.name,
          level: values.level,
          description: values.description
        });

        if (!newRoadmapId) throw new Error("Failed to create roadmap");

        // Set roadmap languages
        const languagesSet = await roadmapService.setRoadmapLanguages(newRoadmapId, values.languages as Language[]);
        if (!languagesSet) throw new Error("Failed to set roadmap languages");

        // Add to local state
        const newRoadmap: Roadmap = {
          id: newRoadmapId,
          name: values.name,
          level: values.level,
          description: values.description,
          createdAt: new Date(),
          updatedAt: new Date(),
          languages: values.languages as Language[]
        };
        setRoadmaps([...roadmaps, newRoadmap]);
        setSelectedRoadmap(newRoadmap);
        setSelectedLanguages(values.languages);
        toast({
          variant: "success",
          title: "Roadmap created successfully",
          description: `The roadmap "${values.name}" has been created.`
        });
      }
    } catch (err: any) {
      console.error('Error saving roadmap:', err);
      toast({
        variant: "destructive",
        title: selectedRoadmap ? 'Failed to update roadmap' : 'Failed to create roadmap',
        description: err.message || "An unexpected error occurred. Please try again."
      });
    } finally {
      setSavingRoadmap(false);
    }
  };

  // Create or update node
  const handleSaveNode = async (values: NodeFormValues) => {
    if (!selectedRoadmap) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please select a roadmap first'
      });
      return;
    }

    setSavingNode(true);
    try {
      // Validate that the language is associated with the roadmap
      if (!selectedLanguages.includes(values.language)) {
        toast({
          variant: "destructive",
          title: "Invalid language",
          description: `The language "${getLanguageName(values.language)}" is not associated with this roadmap.`
        });
        setSavingNode(false);
        return;
      }
      
      // Validate that there's an exercise for this language
      if (!filteredExercises.some(ex => ex.id === values.defaultExerciseId)) {
        toast({
          variant: "destructive",
          title: "Invalid exercise",
          description: `Please select a valid exercise for the "${getLanguageName(values.language)}" language.`
        });
        setSavingNode(false);
        return;
      }

      // Check position value - make sure it's valid
      if (values.position < 0) {
        values.position = 0;
      }

      const maxPosition = nodes.length - (selectedNode ? 1 : 0);
      if (values.position > maxPosition) {
        values.position = maxPosition;
      }

      if (selectedNode) {
        // Handle position updates for other nodes if position changed
        if (values.position !== selectedNode.position) {
          // Reorder the nodes
          await reorderNodes(selectedNode.id, selectedNode.position, values.position);
        }

        // Update existing node
        const updated = await roadmapService.updateNode(selectedNode.id, {
          title: values.title,
          position: values.position,
          defaultExerciseId: values.defaultExerciseId,
          description: values.description,
          isBonus: values.isBonus,
          language: values.language as Language
        });

        if (!updated) throw new Error("Failed to update node");

        // Fetch updated nodes to ensure correct order
        await fetchNodesAfterChange();
        
        setSelectedNode(null);
        setNodeDialogOpen(false);
        toast({
          variant: "success",
          title: "Node updated successfully",
          description: `The node "${values.title}" has been updated.`
        });
      } else {
        // If adding a new node at a specific position, reorder existing nodes
        if (values.position < nodes.length) {
          await batchUpdatePositions(values.position, nodes.length - 1, 1);
        }

        // Create new node
        const newNodeId = await roadmapService.createNode({
          roadmapId: selectedRoadmap.id,
          title: values.title,
          position: values.position,
          defaultExerciseId: values.defaultExerciseId,
          description: values.description,
          isBonus: values.isBonus,
          language: values.language as Language
        });

        if (!newNodeId) throw new Error("Failed to create node");

        // Fetch updated nodes to ensure correct order
        await fetchNodesAfterChange();
        
        setNodeDialogOpen(false);
        toast({
          variant: "success",
          title: "Node created successfully",
          description: `The node "${values.title}" has been created.`
        });
      }
    } catch (err: any) {
      console.error('Error saving node:', err);
      toast({
        variant: "destructive",
        title: selectedNode ? 'Failed to update node' : 'Failed to create node',
        description: err.message || "An unexpected error occurred. Please try again."
      });
    } finally {
      setSavingNode(false);
    }
  };

  // Re-fetch nodes after changes
  const fetchNodesAfterChange = async () => {
    if (!selectedRoadmap) return;
    
    try {
      const nodesData = await roadmapService.getRoadmapNodes(selectedRoadmap.id);
      setNodes(nodesData);
    } catch (err) {
      console.error('Error refreshing nodes:', err);
    }
  };

  // Reorder nodes when a node's position changes
  const reorderNodes = async (nodeId: string, oldPosition: number, newPosition: number) => {
    if (oldPosition === newPosition) return;
    
    try {
      setReorderingNode(nodeId);
      
      if (oldPosition < newPosition) {
        // Moving down - nodes in between need to move up
        await batchUpdatePositions(oldPosition + 1, newPosition, -1);
      } else {
        // Moving up - nodes in between need to move down
        await batchUpdatePositions(newPosition, oldPosition - 1, 1);
      }
    } catch (err) {
      console.error('Error reordering nodes:', err);
      toast({
        variant: "destructive",
        title: "Failed to reorder nodes",
        description: "There was an error updating node positions."
      });
    } finally {
      setReorderingNode(null);
    }
  };

  // Update positions for a range of nodes by an offset
  const batchUpdatePositions = async (startPos: number, endPos: number, offset: number) => {
    if (!selectedRoadmap) return;
    
    // Get nodes in the affected range
    const affectedNodes = nodes.filter(
      node => node.position >= startPos && node.position <= endPos
    );
    
    // Update each node's position
    for (const node of affectedNodes) {
      const newPosition = node.position + offset;
      await roadmapService.updateNodePosition(node.id, newPosition);
    }
  };

  // Move a node up in the sequence
  const handleMoveNodeUp = async (nodeId: string) => {
    const nodeIndex = nodes.findIndex(node => node.id === nodeId);
    if (nodeIndex <= 0) return; // Already at the top
    
    const node = nodes[nodeIndex];
    const newPosition = node.position - 1;
    
    try {
      setReorderingNode(nodeId);
      await reorderNodes(nodeId, node.position, newPosition);
      
      // Update the node's position
      const updated = await roadmapService.updateNodePosition(nodeId, newPosition);
      if (!updated) throw new Error("Failed to update node position");
      
      await fetchNodesAfterChange();
      
      toast({
        title: "Node moved up",
        description: `"${node.title}" moved to position ${newPosition + 1}.`
      });
    } catch (err) {
      console.error('Error moving node up:', err);
      toast({
        variant: "destructive",
        title: "Failed to move node",
        description: "There was an error updating node positions."
      });
    } finally {
      setReorderingNode(null);
    }
  };

  // Move a node down in the sequence
  const handleMoveNodeDown = async (nodeId: string) => {
    const nodeIndex = nodes.findIndex(node => node.id === nodeId);
    if (nodeIndex === -1 || nodeIndex >= nodes.length - 1) return; // Already at the bottom
    
    const node = nodes[nodeIndex];
    const newPosition = node.position + 1;
    
    try {
      setReorderingNode(nodeId);
      await reorderNodes(nodeId, node.position, newPosition);
      
      // Update the node's position
      const updated = await roadmapService.updateNodePosition(nodeId, newPosition);
      if (!updated) throw new Error("Failed to update node position");
      
      await fetchNodesAfterChange();
      
      toast({
        title: "Node moved down",
        description: `"${node.title}" moved to position ${newPosition + 1}.`
      });
    } catch (err) {
      console.error('Error moving node down:', err);
      toast({
        variant: "destructive",
        title: "Failed to move node",
        description: "There was an error updating node positions."
      });
    } finally {
      setReorderingNode(null);
    }
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'roadmap') {
        const deleted = await roadmapService.deleteRoadmap(itemToDelete.id);
        if (!deleted) throw new Error("Failed to delete roadmap");

        setRoadmaps(roadmaps.filter(r => r.id !== itemToDelete.id));
        if (selectedRoadmap?.id === itemToDelete.id) {
          setSelectedRoadmap(null);
        }
        toast({
          variant: "success",
          title: "Roadmap deleted successfully",
          description: "The roadmap and all its nodes have been removed."
        });
      } else {
        const nodeToDelete = nodes.find(n => n.id === itemToDelete.id);
        if (!nodeToDelete) {
          throw new Error("Node not found");
        }

        // Delete the node
        const deleted = await roadmapService.deleteNode(itemToDelete.id);
        if (!deleted) throw new Error("Failed to delete node");

        // Update positions for nodes after the deleted node
        await batchUpdatePositions(
          nodeToDelete.position + 1, 
          nodes.length - 1, 
          -1
        );

        await fetchNodesAfterChange();
        
        toast({
          variant: "success",
          title: "Node deleted successfully",
          description: "The node has been removed from the roadmap."
        });
      }
    } catch (err: any) {
      console.error('Error deleting item:', err);
      toast({
        variant: "destructive",
        title: `Failed to delete ${itemToDelete.type}`,
        description: err.message || "An unexpected error occurred. Please try again."
      });
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
      language: undefined,
      defaultExerciseId: undefined
    });
    setFilteredExercises([]);
    setNodeDialogOpen(true);
  };

  // Get language name from language code
  const getLanguageName = (code: string): string => {
    const language = availableLanguages.find(l => l.value === code);
    return language ? language.label : code;
  };

  // Get exercise name from exercise ID
  const getExerciseName = (exerciseId: string | undefined): string => {
    if (!exerciseId) return "None";
    const exercise = defaultExercises.find(e => e.id === exerciseId);
    return exercise ? exercise.title : "Unknown exercise";
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
                        disabled={savingRoadmap || !roadmapForm.formState.isValid}
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
              <TooltipProvider>
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
                        <TableHead className="w-12 text-center">Pos</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="w-32">Type</TableHead>
                        <TableHead className="w-32">Language</TableHead>
                        <TableHead>Exercise</TableHead>
                        <TableHead className="text-right w-36">Actions</TableHead>
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
                          const isBeingReordered = reorderingNode === node.id;
                          
                          return (
                            <TableRow 
                              key={node.id} 
                              className={isBeingReordered ? "opacity-50 bg-muted/20" : ""}
                            >
                              <TableCell className="font-medium text-center">
                                {node.position + 1}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {node.isBonus && (
                                    <Badge variant="outline" className="bg-amber-500/20 border-amber-500/50">
                                      <Star className="h-3 w-3 text-amber-500 mr-1" />
                                      Bonus
                                    </Badge>
                                  )}
                                  <span className="font-medium">{node.title}</span>
                                </div>
                                {node.description && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1 cursor-help">
                                        {node.description}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[300px]">
                                      <p>{node.description}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
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
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded truncate block max-w-[120px] cursor-help">
                                        {exercise.title}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{exercise.title}</p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Language: {getLanguageName(exercise.language)}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Missing exercise
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleMoveNodeUp(node.id)}
                                        disabled={node.position === 0 || isBeingReordered}
                                      >
                                        <ArrowUp className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Move up</TooltipContent>
                                  </Tooltip>
                                  
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleMoveNodeDown(node.id)}
                                        disabled={node.position === nodes.length - 1 || isBeingReordered}
                                      >
                                        <ArrowDown className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Move down</TooltipContent>
                                  </Tooltip>
                                  
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleEditNode(node)}
                                        disabled={isBeingReordered}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit node</TooltipContent>
                                  </Tooltip>
                                  
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                          setItemToDelete({ type: 'node', id: node.id });
                                          setDeleteDialogOpen(true);
                                        }}
                                        disabled={isBeingReordered}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete node</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TooltipProvider>
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
                      <FormDescription>
                        Position {field.value + 1} of {nodes.length + (selectedNode ? 0 : 1)}
                      </FormDescription>
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
              
              <Alert className="bg-blue-50 mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You must select a language first, then choose an exercise for that language.
                </AlertDescription>
              </Alert>
              
              <FormField
                control={nodeForm.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language <span className="text-destructive">*</span></FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        nodeForm.setValue('defaultExerciseId', undefined);
                      }}
                      value={field.value}
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Linked Exercise <span className="text-destructive">*</span></FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedLanguage}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            selectedLanguage 
                              ? "Select an exercise" 
                              : "Select a language first"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedLanguage ? (
                          filteredExercises.length > 0 ? (
                            filteredExercises.map(exercise => (
                              <SelectItem key={exercise.id} value={exercise.id}>
                                {exercise.title}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-exercises" disabled>
                              No exercises available for {getLanguageName(selectedLanguage)}
                            </SelectItem>
                          )
                        ) : (
                          <SelectItem value="select-language" disabled>
                            Please select a language first
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {selectedLanguage 
                        ? (filteredExercises.length > 0
                            ? `Available exercises for ${getLanguageName(selectedLanguage)}: ${filteredExercises.length}`
                            : `No exercises found for ${getLanguageName(selectedLanguage)}. Please create exercises first.`)
                        : 'You must select a language before choosing an exercise'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setNodeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={savingNode || !nodeForm.formState.isValid}
                >
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
