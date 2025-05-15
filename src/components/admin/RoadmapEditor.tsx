
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageLevel, Language } from '@/types';
import { roadmapService } from '@/services/roadmapService';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const LANGUAGES: Language[] = [
  'english', 'german', 'spanish', 'french', 'portuguese', 'italian',
  'turkish', 'swedish', 'dutch', 'norwegian', 'russian', 'polish',
  'chinese', 'japanese', 'korean', 'arabic'
];

const LEVELS: LanguageLevel[] = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * RoadmapEditor component
 * Allows administrators to manage learning roadmaps and their nodes
 */
const RoadmapEditor: React.FC = () => {
  // Roadmap list state
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Roadmap form state
  const [roadmapName, setRoadmapName] = useState('');
  const [roadmapLevel, setRoadmapLevel] = useState<LanguageLevel>('A1');
  const [roadmapDescription, setRoadmapDescription] = useState('');
  const [roadmapLanguages, setRoadmapLanguages] = useState<Language[]>(['english']);

  // Node list state
  const [nodes, setNodes] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  // Node form state
  const [nodeTitle, setNodeTitle] = useState('');
  const [nodeDescription, setNodeDescription] = useState('');
  const [nodePosition, setNodePosition] = useState(0);
  const [nodeIsBonus, setNodeIsBonus] = useState(false);
  const [nodeLanguage, setNodeLanguage] = useState<Language>('english');
  
  // Tab state
  const [activeTab, setActiveTab] = useState('roadmaps');
  
  // Fetch roadmaps
  useEffect(() => {
    fetchRoadmaps();
  }, []);
  
  // Fetch nodes when selected roadmap changes
  useEffect(() => {
    if (selectedRoadmap) {
      fetchNodes(selectedRoadmap);
    } else {
      setNodes([]);
    }
  }, [selectedRoadmap]);
  
  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      const roadmapList = await roadmapService.getRoadmaps();
      setRoadmaps(roadmapList);
      
      // Select first roadmap if available and none is selected
      if (roadmapList.length > 0 && !selectedRoadmap) {
        setSelectedRoadmap(roadmapList[0].id);
      }
    } catch (error) {
      console.error('Error fetching roadmaps:', error);
      toast({
        variant: "destructive",
        title: "Failed to load roadmaps",
        description: "There was an error loading the roadmaps."
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchNodes = async (roadmapId: string) => {
    try {
      setLoading(true);
      const nodeList = await roadmapService.getRoadmapNodes(roadmapId);
      setNodes(nodeList);
    } catch (error) {
      console.error('Error fetching nodes:', error);
      toast({
        variant: "destructive",
        title: "Failed to load roadmap nodes",
        description: "There was an error loading the roadmap nodes."
      });
    } finally {
      setLoading(false);
    }
  };

  // Roadmap CRUD operations
  const handleCreateRoadmap = async () => {
    try {
      if (!roadmapName) {
        toast({
          variant: "destructive",
          title: "Missing information",
          description: "Please enter a roadmap name."
        });
        return;
      }
      
      await roadmapService.createRoadmap({
        name: roadmapName,
        level: roadmapLevel,
        description: roadmapDescription
      });
      
      // Set the selected languages
      if (roadmapLanguages.length > 0) {
        // We'll handle setting languages in the fetch roadmaps as we need the new ID
        await fetchRoadmaps();
      }
      
      // Reset form
      resetRoadmapForm();
      
      toast({
        title: "Roadmap created",
        description: "The roadmap has been created successfully."
      });
    } catch (error) {
      console.error('Error creating roadmap:', error);
      toast({
        variant: "destructive",
        title: "Failed to create roadmap",
        description: "There was an error creating the roadmap."
      });
    }
  };
  
  const resetRoadmapForm = () => {
    setRoadmapName('');
    setRoadmapLevel('A1');
    setRoadmapDescription('');
    setRoadmapLanguages(['english']);
  };
  
  const handleDeleteRoadmap = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this roadmap? All nodes and user progress will be deleted.')) {
      try {
        await roadmapService.deleteRoadmap(id);
        
        if (selectedRoadmap === id) {
          setSelectedRoadmap(null);
        }
        
        await fetchRoadmaps();
        
        toast({
          title: "Roadmap deleted",
          description: "The roadmap has been deleted successfully."
        });
      } catch (error) {
        console.error('Error deleting roadmap:', error);
        toast({
          variant: "destructive",
          title: "Failed to delete roadmap",
          description: "There was an error deleting the roadmap."
        });
      }
    }
  };

  // Node CRUD operations
  const handleCreateNode = async () => {
    try {
      if (!selectedRoadmap || !nodeTitle) {
        toast({
          variant: "destructive",
          title: "Missing information",
          description: "Please select a roadmap and enter a node title."
        });
        return;
      }
      
      await roadmapService.createNode({
        roadmapId: selectedRoadmap,
        title: nodeTitle,
        description: nodeDescription,
        position: nodePosition,
        isBonus: nodeIsBonus,
        language: nodeLanguage
      });
      
      // Reset form
      resetNodeForm();
      
      // Refresh nodes list
      await fetchNodes(selectedRoadmap);
      
      toast({
        title: "Node created",
        description: "The roadmap node has been created successfully."
      });
    } catch (error) {
      console.error('Error creating node:', error);
      toast({
        variant: "destructive",
        title: "Failed to create node",
        description: "There was an error creating the roadmap node."
      });
    }
  };
  
  const resetNodeForm = () => {
    setNodeTitle('');
    setNodeDescription('');
    setNodePosition(nodes.length); // Set to next position in sequence
    setNodeIsBonus(false);
    setNodeLanguage('english');
  };
  
  const handleDeleteNode = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this node? All user progress for this node will be deleted.')) {
      try {
        await roadmapService.deleteNode(id);
        
        if (selectedNode === id) {
          setSelectedNode(null);
        }
        
        // Refresh nodes list
        if (selectedRoadmap) {
          await fetchNodes(selectedRoadmap);
        }
        
        toast({
          title: "Node deleted",
          description: "The roadmap node has been deleted successfully."
        });
      } catch (error) {
        console.error('Error deleting node:', error);
        toast({
          variant: "destructive",
          title: "Failed to delete node",
          description: "There was an error deleting the roadmap node."
        });
      }
    }
  };
  
  const handleLanguageChange = (language: Language) => {
    if (roadmapLanguages.includes(language)) {
      setRoadmapLanguages(roadmapLanguages.filter(lang => lang !== language));
    } else {
      setRoadmapLanguages([...roadmapLanguages, language]);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue="roadmaps"
        value={activeTab} 
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="roadmaps">Roadmaps</TabsTrigger>
          <TabsTrigger value="nodes" disabled={!selectedRoadmap}>Nodes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="roadmaps">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Roadmap List */}
            <Card>
              <CardHeader>
                <CardTitle>Roadmap List</CardTitle>
                <CardDescription>
                  Select a roadmap to edit or create a new one
                </CardDescription>
              </CardHeader>
              <CardContent>
                {roadmaps.length === 0 ? (
                  <p className="text-muted-foreground">No roadmaps found.</p>
                ) : (
                  <div className="space-y-2">
                    {roadmaps.map((roadmap) => (
                      <div key={roadmap.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div>
                          <div className="font-medium">{roadmap.name}</div>
                          <div className="text-sm text-muted-foreground">Level {roadmap.level}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedRoadmap(roadmap.id)}>
                            Select
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteRoadmap(roadmap.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Create Roadmap Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create Roadmap</CardTitle>
                <CardDescription>
                  Create a new language learning roadmap
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="roadmap-name" className="block text-sm font-medium mb-1">
                    Name
                  </label>
                  <Input
                    id="roadmap-name"
                    value={roadmapName}
                    onChange={(e) => setRoadmapName(e.target.value)}
                    placeholder="e.g., Spanish for Beginners"
                  />
                </div>
                
                <div>
                  <label htmlFor="roadmap-level" className="block text-sm font-medium mb-1">
                    Level
                  </label>
                  <Select value={roadmapLevel} onValueChange={(value) => setRoadmapLevel(value as LanguageLevel)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label htmlFor="roadmap-description" className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <Input
                    id="roadmap-description"
                    value={roadmapDescription}
                    onChange={(e) => setRoadmapDescription(e.target.value)}
                    placeholder="Brief description of this roadmap"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Available Languages
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                      <Badge
                        key={lang}
                        variant={roadmapLanguages.includes(lang) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleLanguageChange(lang)}
                      >
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleCreateRoadmap}>Create Roadmap</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="nodes">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Node List */}
            <Card>
              <CardHeader>
                <CardTitle>Nodes for Selected Roadmap</CardTitle>
                <CardDescription>
                  Manage the learning nodes for this roadmap
                </CardDescription>
              </CardHeader>
              <CardContent>
                {nodes.length === 0 ? (
                  <p className="text-muted-foreground">No nodes found for this roadmap.</p>
                ) : (
                  <div className="space-y-2">
                    {nodes.map((node) => (
                      <div key={node.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div>
                          <div className="font-medium">
                            {node.position}. {node.title} 
                            {node.isBonus && <Badge className="ml-2" variant="outline">Bonus</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {node.language}
                          </div>
                        </div>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteNode(node.id)}>
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Create Node Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create Node</CardTitle>
                <CardDescription>
                  Add a new learning node to this roadmap
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="node-title" className="block text-sm font-medium mb-1">
                    Title
                  </label>
                  <Input
                    id="node-title"
                    value={nodeTitle}
                    onChange={(e) => setNodeTitle(e.target.value)}
                    placeholder="e.g., Basic Greetings"
                  />
                </div>
                
                <div>
                  <label htmlFor="node-description" className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <Input
                    id="node-description"
                    value={nodeDescription}
                    onChange={(e) => setNodeDescription(e.target.value)}
                    placeholder="Brief description of this learning node"
                  />
                </div>
                
                <div>
                  <label htmlFor="node-position" className="block text-sm font-medium mb-1">
                    Position
                  </label>
                  <Input
                    id="node-position"
                    type="number"
                    min={0}
                    value={nodePosition}
                    onChange={(e) => setNodePosition(parseInt(e.target.value))}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    id="node-bonus"
                    type="checkbox"
                    checked={nodeIsBonus}
                    onChange={(e) => setNodeIsBonus(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="node-bonus" className="text-sm font-medium">
                    Bonus Node (optional)
                  </label>
                </div>
                
                <div>
                  <label htmlFor="node-language" className="block text-sm font-medium mb-1">
                    Language
                  </label>
                  <Select value={nodeLanguage} onValueChange={(value) => setNodeLanguage(value as Language)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleCreateNode}>Create Node</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoadmapEditor;
