
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Directory } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DirectoryContextProps {
  directories: Directory[];
  currentDirectoryId: string | null;
  setCurrentDirectoryId: (id: string | null) => void;
  addDirectory: (name: string, parentId?: string | null) => Promise<Directory>;
  updateDirectory: (id: string, name: string) => Promise<void>;
  deleteDirectory: (id: string) => Promise<void>;
  loading: boolean;
  getRootDirectories: () => Directory[];
  getChildDirectories: (parentId: string) => Directory[];
  getDirectoryPath: (directoryId: string) => Directory[];
}

const DirectoryContext = createContext<DirectoryContextProps | undefined>(undefined);

export const useDirectoryContext = () => {
  const context = useContext(DirectoryContext);
  if (!context) {
    throw new Error('useDirectoryContext must be used within a DirectoryProvider');
  }
  return context;
};

export const DirectoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [currentDirectoryId, setCurrentDirectoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load directories from Supabase when user changes
  useEffect(() => {
    const fetchDirectories = async () => {
      if (!user) {
        // If not logged in, use local storage
        const savedDirectories = localStorage.getItem('directories');
        if (savedDirectories) {
          try {
            const parsedDirs = JSON.parse(savedDirectories).map((dir: any) => ({
              ...dir,
              userId: 'local',
              createdAt: typeof dir.createdAt === 'string' ? dir.createdAt : new Date(dir.createdAt).toISOString(),
              updatedAt: dir.updatedAt || new Date().toISOString()
            }));
            setDirectories(parsedDirs);
          } catch (error) {
            console.error('Error parsing stored directories:', error);
            setDirectories([]);
          }
        } else {
          setDirectories([]);
        }
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Now the directories table exists in Supabase
        const { data, error } = await supabase
          .from('directories')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
          setDirectories(data.map(dir => ({
            id: dir.id,
            name: dir.name,
            parentId: dir.parent_id,
            userId: dir.user_id,
            createdAt: dir.created_at,
            updatedAt: dir.created_at // Use created_at since updated_at doesn't exist in the schema
          })));
        }
      } catch (error) {
        console.error('Error fetching directories:', error);
        toast.error('Failed to load directories');
        setDirectories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDirectories();
  }, [user]);

  // Save directories to local storage for non-authenticated users
  useEffect(() => {
    if (!user) {
      localStorage.setItem('directories', JSON.stringify(directories));
    }
  }, [directories, user]);

  const addDirectory = async (name: string, parentId?: string | null): Promise<Directory> => {
    try {
      if (!user) {
        // Handle non-authenticated user
        const currentTime = new Date().toISOString();
        const newDirectory: Directory = {
          id: crypto.randomUUID(),
          name,
          parentId: parentId || null,
          userId: 'local',
          createdAt: currentTime,
          updatedAt: currentTime
        };
        
        setDirectories(prev => [...prev, newDirectory]);
        return newDirectory;
      }

      // Create directory in Supabase
      const { data, error } = await supabase
        .from('directories')
        .insert({
          user_id: user.id,
          name,
          parent_id: parentId
        })
        .select('*')
        .single();

      if (error) throw error;

      const newDirectory: Directory = {
        id: data.id,
        name: data.name,
        parentId: data.parent_id,
        userId: data.user_id,
        createdAt: data.created_at,
        updatedAt: data.created_at // Use created_at since updated_at doesn't exist
      };

      setDirectories(prev => [...prev, newDirectory]);
      return newDirectory;
    } catch (error: any) {
      toast.error('Failed to create directory: ' + error.message);
      throw error;
    }
  };

  const updateDirectory = async (id: string, name: string) => {
    try {
      if (!user) {
        // Handle non-authenticated user
        setDirectories(directories.map(dir => 
          dir.id === id ? { ...dir, name, updatedAt: new Date().toISOString() } : dir
        ));
        return;
      }

      // Update directory in Supabase
      const { error } = await supabase
        .from('directories')
        .update({ name })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setDirectories(directories.map(dir => 
        dir.id === id ? { ...dir, name, updatedAt: new Date().toISOString() } : dir
      ));
    } catch (error: any) {
      toast.error('Failed to update directory: ' + error.message);
      throw error;
    }
  };

  const deleteDirectory = async (id: string) => {
    try {
      if (!user) {
        // Handle non-authenticated user
        setDirectories(directories.filter(dir => dir.id !== id));
        return;
      }

      // Delete directory from Supabase
      const { error } = await supabase
        .from('directories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setDirectories(directories.filter(dir => dir.id !== id));
    } catch (error: any) {
      toast.error('Failed to delete directory: ' + error.message);
      throw error;
    }
  };

  const getRootDirectories = () => {
    return directories.filter(dir => !dir.parentId);
  };

  const getChildDirectories = (parentId: string) => {
    return directories.filter(dir => dir.parentId === parentId);
  };

  const getDirectoryPath = (directoryId: string): Directory[] => {
    const path: Directory[] = [];
    let currentDir = directories.find(dir => dir.id === directoryId);
    
    while (currentDir) {
      path.unshift(currentDir);
      if (!currentDir.parentId) break;
      currentDir = directories.find(dir => dir.id === currentDir!.parentId);
    }
    
    return path;
  };

  const value = {
    directories,
    currentDirectoryId,
    setCurrentDirectoryId,
    addDirectory,
    updateDirectory,
    deleteDirectory,
    loading,
    getRootDirectories,
    getChildDirectories,
    getDirectoryPath
  };

  return (
    <DirectoryContext.Provider value={value}>
      {children}
    </DirectoryContext.Provider>
  );
};
