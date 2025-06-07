
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText, Image, Download, Trash2, Copy, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdminUpload {
  id: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  description: string | null;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const FileUploadManagement: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Query to fetch uploaded files
  const { data: uploads, isLoading } = useQuery({
    queryKey: ['admin-uploads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_uploads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AdminUpload[];
    }
  });

  // Mutation to upload files
  const uploadMutation = useMutation({
    mutationFn: async (formData: { files: File[], description: string, tags: string[] }) => {
      const uploadPromises = formData.files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = fileName;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('admin-uploads')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data } = supabase.storage
          .from('admin-uploads')
          .getPublicUrl(filePath);

        // Save to admin_uploads table
        const { error: dbError } = await supabase
          .from('admin_uploads')
          .insert({
            filename: fileName,
            original_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            description: formData.description || null,
            tags: formData.tags.length > 0 ? formData.tags : null,
          });

        if (dbError) throw dbError;

        return data.publicUrl;
      });

      return Promise.all(uploadPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-uploads'] });
      setSelectedFiles([]);
      setDescription('');
      setTags('');
      toast.success('Files uploaded successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to upload files: ' + error.message);
    }
  });

  // Mutation to delete files
  const deleteMutation = useMutation({
    mutationFn: async (upload: AdminUpload) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('admin-uploads')
        .remove([upload.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('admin_uploads')
        .delete()
        .eq('id', upload.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-uploads'] });
      toast.success('File deleted successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to delete file: ' + error.message);
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    try {
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
      await uploadMutation.mutateAsync({
        files: selectedFiles,
        description,
        tags: tagArray
      });
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast.success('URL copied to clipboard!');
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('admin-uploads')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Upload images, documents, and other files to make them publicly accessible
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Select Files</Label>
            <Input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              accept="image/*,.pdf,.txt,.doc,.docx"
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files ({selectedFiles.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {getFileIcon(file.type)}
                    {file.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => {
                        setSelectedFiles(files => files.filter((_, i) => i !== index));
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what these files are for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (Optional)</Label>
            <Input
              id="tags"
              placeholder="e.g. blog, hero-image, documentation (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={selectedFiles.length === 0 || uploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
          </Button>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
          <CardDescription>
            Manage your uploaded files and copy public URLs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading files...</div>
          ) : uploads && uploads.length > 0 ? (
            <div className="space-y-4">
              {uploads.map((upload) => {
                const publicUrl = getPublicUrl(upload.file_path);
                return (
                  <div key={upload.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getFileIcon(upload.mime_type)}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{upload.original_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(upload.file_size)} • {new Date(upload.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(publicUrl)}
                        >
                          {copiedUrl === publicUrl ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(publicUrl, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(upload)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {upload.description && (
                      <p className="text-sm text-muted-foreground">{upload.description}</p>
                    )}

                    {upload.tags && upload.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {upload.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Alert>
                      <AlertDescription className="text-xs font-mono break-all">
                        Public URL: {publicUrl}
                      </AlertDescription>
                    </Alert>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No files uploaded yet. Upload your first file above!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUploadManagement;
