import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from '@/types';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface BlogPostEditorProps {
  post?: BlogPost;
  onSave?: () => void;
}

const BlogPostEditor: React.FC<BlogPostEditorProps> = ({ post, onSave }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth(); // Get the current user
  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [content, setContent] = useState(post?.content || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [featuredImageUrl, setFeaturedImageUrl] = useState(post?.featuredImage || '');
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription || '');
  const [status, setStatus] = useState<'draft' | 'published'>(post?.status as ('draft' | 'published') || 'draft');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [loading, setLoading] = useState(!!id);

  // Fetch post data if editing an existing post
  useEffect(() => {
    if (id) {
      fetchPostData();
    }
  }, [id]);

  const fetchPostData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title);
        setSlug(data.slug);
        setContent(data.content);
        setExcerpt(data.excerpt || '');
        setFeaturedImageUrl(data.featured_image_url || '');
        setMetaTitle(data.meta_title || '');
        setMetaDescription(data.meta_description || '');
        // Type check to ensure status is either 'draft' or 'published'
        const postStatus = data.status === 'published' ? 'published' : 'draft';
        setStatus(postStatus);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast({
        title: "Error",
        description: "Failed to fetch post",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate slug from title
  useEffect(() => {
    if (!post && title && !slug) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  }, [title, post, slug]);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
  };
  
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link', 'image'
  ];

  const savePost = async (publishStatus: 'draft' | 'published') => {
    try {
      if (publishStatus === 'published') {
        setIsPublishing(true);
      } else {
        setIsSaving(true);
      }

      if (!title) {
        toast({
          title: "Error",
          description: "Title is required",
          variant: "destructive"
        });
        return;
      }

      if (!slug) {
        toast({
          title: "Error",
          description: "Slug is required",
          variant: "destructive"
        });
        return;
      }

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save a post",
          variant: "destructive"
        });
        return;
      }

      const currentTime = new Date().toISOString();
      const postData: any = {
        title,
        slug,
        content,
        excerpt,
        featured_image_url: featuredImageUrl,
        status: publishStatus,
        meta_title: metaTitle || title,
        meta_description: metaDescription || excerpt,
        updated_at: currentTime,
        author_id: user.id, // Set the author_id to the current user's ID
      };

      // If we're publishing for the first time, set the published_at date
      if (publishStatus === 'published' && (!post || post.status !== 'published')) {
        postData.published_at = currentTime;
      }

      let result;

      if (id) {
        // Update existing post
        result = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', id);
      } else {
        // Create new post
        result = await supabase
          .from('blog_posts')
          .insert([postData])
          .select();
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: id ? "Post updated" : "Post created",
        description: publishStatus === 'published' 
          ? "Your post has been published" 
          : "Your post has been saved as a draft"
      });

      if (onSave) {
        onSave();
      } else {
        // Redirect to the admin page with blog tab selected
        navigate('/dashboard/admin?tab=blog');
      }

    } catch (error: any) {
      console.error('Error saving post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save post",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline"
          size="sm"
          className="mr-2"
          onClick={() => navigate('/dashboard/admin?tab=blog')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog Posts
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="post-url-slug"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <div className="min-h-[400px] border rounded-md">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
            placeholder="Write your post content here..."
            className="h-[350px] mb-12"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Brief summary of the post"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="featuredImage">Featured Image URL</Label>
        <Input
          id="featuredImage"
          value={featuredImageUrl}
          onChange={(e) => setFeaturedImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="metaTitle">SEO Title</Label>
        <Input
          id="metaTitle"
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
          placeholder="SEO title (optional)"
        />
        <p className="text-sm text-muted-foreground">
          Leave blank to use the post title
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="metaDescription">SEO Description</Label>
        <Textarea
          id="metaDescription"
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          placeholder="SEO description (optional)"
          rows={2}
        />
        <p className="text-sm text-muted-foreground">
          Leave blank to use the post excerpt
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => savePost('draft')}
          disabled={isSaving || isPublishing}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Draft'
          )}
        </Button>
        <Button
          onClick={() => savePost('published')}
          disabled={isSaving || isPublishing}
        >
          {isPublishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            'Publish'
          )}
        </Button>
      </div>
    </div>
  );
};

export default BlogPostEditor;
