
// Add the necessary imports and update the component to handle Date vs string conversions
// This is a partial update focused on fixing the type errors

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Directory } from '@/types';

interface DirectoryContextType {
  directories: Directory[];
  currentDirectoryId: string | null;
  setCurrentDirectoryId: React.Dispatch<React.SetStateAction<string | null>>;
  createDirectory: (name: string, parentId?: string | null) => Promise<Directory>;
  updateDirectory: (id: string, name: string) => Promise<void>;
  deleteDirectory: (id: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

const DirectoryContext = createContext<DirectoryContextType | undefined>(undefined);

export const DirectoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [currentDirectoryId, setCurrentDirectoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  // Convert Date objects to ISO strings for consistency
  const dateToString = (date: Date | string): string => {
    if (typeof date === 'string') return date;
    return date.toISOString();
  };

  // Load directories when user changes
  useEffect(() => {
    const fetchDirectories = async () => {
      if (!user) {
        setDirectories([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('directories')
          .select('*')
          .eq('user_id', user.id)
          .order('name');

        if (error) throw error;

        if (data) {
          // Convert any Date objects to strings and ensure userId is present
          const formattedDirectories = data.map(dir => ({
            id: dir.id,
            name: dir.name,
            parentId: dir.parent_id,
            userId: dir.user_id, // Ensure userId is included
            createdAt: dateToString(dir.created_at)
          }));

          setDirectories(formattedDirectories);
        }
      } catch (err) {
        console.error('Error fetching directories:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch directories'));
      } finally {
        setLoading(false);
      }
    };

    fetchDirectories();
  }, [user]);

  const createDirectory = async (name: string, parentId: string | null = null): Promise<Directory> => {
    if (!user) throw new Error('You must be logged in to create directories');

    try {
      const { data, error } = await supabase
        .from('directories')
        .insert({
          name,
          parent_id: parentId,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      const newDirectory: Directory = {
        id: data.id,
        name: data.name,
        parentId: data.parent_id,
        userId: data.user_id,
        createdAt: dateToString(data.created_at)
      };

      setDirectories(prev => [...prev, newDirectory]);
      return newDirectory;
    } catch (err) {
      console.error('Error creating directory:', err);
      throw err instanceof Error ? err : new Error('Failed to create directory');
    }
  };

  const updateDirectory = async (id: string, name: string): Promise<void> => {
    if (!user) throw new Error('You must be logged in to update directories');

    try {
      const { error } = await supabase
        .from('directories')
        .update({ name })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setDirectories(prev =>
        prev.map(dir => (dir.id === id ? { ...dir, name } : dir))
      );
    } catch (err) {
      console.error('Error updating directory:', err);
      throw err instanceof Error ? err : new Error('Failed to update directory');
    }
  };

  const deleteDirectory = async (id: string): Promise<void> => {
    if (!user) throw new Error('You must be logged in to delete directories');

    try {
      const { error } = await supabase
        .from('directories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove this directory and any that have it as a parent
      const removeChildDirectories = (parentId: string): Directory[] => {
        const remainingDirectories = directories.filter(dir => dir.id !== parentId && dir.parentId !== parentId);
        
        // Recursively remove children of children
        const directChildrenIds = directories
          .filter(dir => dir.parentId === parentId)
          .map(dir => dir.id);
        
        return directChildrenIds.length
          ? directChildrenIds.reduce((acc, childId) => removeChildDirectories(childId), remainingDirectories)
          : remainingDirectories;
      };

      setDirectories(removeChildDirectories(id));
      
      // Reset current directory if we're deleting it
      if (currentDirectoryId === id) {
        const parent = directories.find(dir => dir.id === id)?.parentId;
        setCurrentDirectoryId(parent);
      }
    } catch (err) {
      console.error('Error deleting directory:', err);
      throw err instanceof Error ? err : new Error('Failed to delete directory');
    }
  };

  return (
    <DirectoryContext.Provider
      value={{
        directories,
        currentDirectoryId,
        setCurrentDirectoryId,
        createDirectory,
        updateDirectory,
        deleteDirectory,
        loading,
        error
      }}
    >
      {children}
    </DirectoryContext.Provider>
  );
};

export const useDirectoryContext = () => {
  const context = useContext(DirectoryContext);
  if (!context) {
    throw new Error('useDirectoryContext must be used within a DirectoryProvider');
  }
  return context;
};
