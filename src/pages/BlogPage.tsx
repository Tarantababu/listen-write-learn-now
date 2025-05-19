
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';
import { Footer } from '@/components/landing/Footer';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Loader2 } from 'lucide-react';

const BlogPage: React.FC = () => {
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data as BlogPost[];
    }
  });

  return (
    <>
      <Helmet>
        <title>Blog | lwlnow</title>
        <meta name="description" content="Read the latest articles and updates on language learning techniques." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <LandingHeader />
        
        <main className="flex-1 container mx-auto px-4 py-16 mt-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Blog</h1>
            
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-500">Failed to load blog posts</p>
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="grid gap-8">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardHeader>
                      <CardTitle>
                        <Link 
                          to={`/blog/${post.slug}`} 
                          className="hover:text-primary transition-colors"
                        >
                          {post.title}
                        </Link>
                      </CardTitle>
                      {post.excerpt && (
                        <CardDescription>
                          {post.excerpt}
                        </CardDescription>
                      )}
                    </CardHeader>
                    
                    {post.featured_image_url && (
                      <CardContent>
                        <Link to={`/blog/${post.slug}`}>
                          <img 
                            src={post.featured_image_url} 
                            alt={post.title} 
                            className="w-full h-64 object-cover rounded-md" 
                          />
                        </Link>
                      </CardContent>
                    )}
                    
                    <CardFooter className="text-sm text-muted-foreground">
                      {post.published_at && (
                        <time dateTime={post.published_at}>
                          {new Date(post.published_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </time>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No blog posts have been published yet.</p>
              </div>
            )}
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default BlogPage;
