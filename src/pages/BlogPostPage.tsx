
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from '@/types';
import { Helmet } from 'react-helmet-async';
import { Footer } from '@/components/landing/Footer';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      
      if (error) throw error;
      return data as BlogPost;
    }
  });

  return (
    <>
      <Helmet>
        <title>{post?.meta_title || post?.title || 'Blog Post'} | lwlnow</title>
        <meta name="description" content={post?.meta_description || post?.excerpt || ''} />
        {post?.featured_image_url && <meta property="og:image" content={post.featured_image_url} />}
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <LandingHeader />
        
        <main className="flex-1 container mx-auto px-4 py-16 mt-10">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <Button variant="outline" size="sm" asChild>
                <Link to="/blog">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
                </Link>
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-500">Failed to load blog post</p>
                <Button asChild className="mt-4">
                  <Link to="/blog">Return to Blog</Link>
                </Button>
              </div>
            ) : post ? (
              <article className="prose dark:prose-invert max-w-none">
                <h1 className="text-4xl font-bold mb-6">{post.title}</h1>
                
                {post.published_at && (
                  <div className="text-muted-foreground mb-8">
                    <time dateTime={post.published_at}>
                      {new Date(post.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                  </div>
                )}
                
                {post.featured_image_url && (
                  <img 
                    src={post.featured_image_url} 
                    alt={post.title} 
                    className="w-full h-80 object-cover rounded-lg mb-8" 
                  />
                )}
                
                <Card className="p-8 mb-8">
                  <div dangerouslySetInnerHTML={{ __html: post.content }} />
                </Card>
              </article>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Blog post not found.</p>
                <Button asChild className="mt-4">
                  <Link to="/blog">Return to Blog</Link>
                </Button>
              </div>
            )}
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default BlogPostPage;
