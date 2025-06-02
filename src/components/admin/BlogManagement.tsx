
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { BlogPost } from '@/types';
import { format } from 'date-fns';
import BlogPostEditor from '@/components/blog/admin/BlogPostEditor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BlogManagementProps {
  posts: BlogPost[];
  loading: boolean;
}

const BlogManagement: React.FC<BlogManagementProps> = ({ posts, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = () => {
    setSelectedPost(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (post: BlogPost) => {
    setSelectedPost(post);
    setIsEditorOpen(true);
  };

  const handleDelete = async (post: BlogPost) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;
      toast('Post deleted successfully');
      // Refresh would happen here - in a real app you'd refetch the data
    } catch (error) {
      console.error('Error deleting post:', error);
      toast('Failed to delete post');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div>Loading posts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search posts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{post.title}</div>
                    <div className="text-sm text-gray-500 line-clamp-1">
                      {post.excerpt}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(post.status)}>
                    {post.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {post.publishedAt 
                    ? format(new Date(post.publishedAt), 'MMM d, yyyy')
                    : 'Not published'
                  }
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(post)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(post)}
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

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPost ? 'Edit Post' : 'Create New Post'}
            </DialogTitle>
          </DialogHeader>
          <BlogPostEditor
            post={selectedPost}
            onSave={() => {
              setIsEditorOpen(false);
              // Refresh posts would happen here
            }}
            onCancel={() => setIsEditorOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogManagement;
