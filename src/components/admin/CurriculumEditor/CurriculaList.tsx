
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Language, LanguageLevel } from '@/types';
import { CurriculumForm } from './CurriculumForm';
import { getAllCurricula, deleteCurriculum } from '@/services/curriculumService';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LevelBadge from '@/components/LevelBadge';

export const CurriculaList: React.FC<{ onSelectCurriculum: (id: string) => void }> = ({ onSelectCurriculum }) => {
  const [curricula, setCurricula] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState<any | null>(null);
  const [filterLanguage, setFilterLanguage] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Load all curricula
  const loadCurricula = async () => {
    try {
      setIsLoading(true);
      const data = await getAllCurricula();
      setCurricula(data);
    } catch (error) {
      console.error('Error fetching curricula:', error);
      toast({
        title: 'Error',
        description: 'Failed to load curricula',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCurricula();
  }, []);

  // Filter curricula based on search and filters
  const filteredCurricula = curricula.filter(curriculum => {
    const matchesSearch = !searchTerm || 
      curriculum.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = !filterLanguage || 
      curriculum.language === filterLanguage;
    const matchesLevel = !filterLevel || 
      curriculum.level === filterLevel;
    
    return matchesSearch && matchesLanguage && matchesLevel;
  });

  // Handle curriculum deletion
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this curriculum?')) {
      return;
    }

    try {
      await deleteCurriculum(id);
      toast({ title: 'Curriculum deleted' });
      loadCurricula();
    } catch (error) {
      console.error('Error deleting curriculum:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete curriculum',
        variant: 'destructive',
      });
    }
  };

  const handleEditClick = (curriculum: any) => {
    setEditingCurriculum(curriculum);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setEditingCurriculum(null);
    setShowForm(false);
  };

  const handleFormSuccess = () => {
    handleCloseForm();
    loadCurricula();
  };

  // Get unique languages from curricula
  const languages = [...new Set(curricula.map(c => c.language))];
  const levels = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Curricula</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Curriculum
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Input
            placeholder="Search curricula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Select value={filterLanguage} onValueChange={setFilterLanguage}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Languages</SelectItem>
              {languages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Levels</SelectItem>
              {levels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredCurricula.length === 0 ? (
        <div className="flex justify-center items-center h-40 border rounded-md bg-muted/50 text-muted-foreground">
          No curricula found
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCurricula.map((curriculum) => (
                <TableRow key={curriculum.id}>
                  <TableCell className="font-medium">
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-left justify-start"
                      onClick={() => onSelectCurriculum(curriculum.id)}
                    >
                      {curriculum.name}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {curriculum.language.charAt(0).toUpperCase() + curriculum.language.slice(1)}
                  </TableCell>
                  <TableCell>
                    <LevelBadge level={curriculum.level as LanguageLevel} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={curriculum.status === 'active' ? 'outline' : 'secondary'}
                    >
                      {curriculum.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(curriculum)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(curriculum.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCurriculum ? 'Edit Curriculum' : 'New Curriculum'}
            </DialogTitle>
          </DialogHeader>
          <CurriculumForm
            curriculum={editingCurriculum}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
