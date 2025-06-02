
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from '@/types';
import { Footer } from '@/components/landing/Footer';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Calendar, Clock, Share2, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import SEO from '@/components/SEO';

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

  // Fetch related posts
  const { data: relatedPosts } = useQuery({
    queryKey: ['related-posts', post?.id],
    queryFn: async () => {
      if (!post?.id) return [];
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .neq('id', post.id)
        .order('published_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data as BlogPost[];
    },
    enabled: !!post?.id
  });

  const estimatedReadTime = post?.content ? Math.ceil(post.content.replace(/<[^>]*>/g, '').split(' ').length / 200) : 0;

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || 'Check out this language learning article',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <>
      <SEO
        title={post?.meta_title || post?.title || 'Blog Post'}
        description={post?.meta_description || post?.excerpt || 'Read this comprehensive article on language learning techniques, dictation methods, and educational insights from lwlnow experts.'}
        keywords={`language learning, dictation, ${post?.title || ''}, education, vocabulary, pronunciation, language practice, learning techniques`}
        image={post?.featured_image_url || "https://lovable.dev/opengraph-image-p98pqg.png"}
        url={`https://lwlnow.com/blog/${slug}`}
        type="article"
        article={post ? {
          author: "lwlnow Expert Team",
          publishedTime: post.published_at || undefined,
          modifiedTime: post.updated_at || undefined,
          section: "Language Learning",
          tags: ["language learning", "dictation", "education", "vocabulary", "pronunciation"]
        } : undefined}
      />
      
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/10">
        <LandingHeader />
        
        <main className="flex-1 container mx-auto px-4 py-16 mt-10">
          <div className="max-w-4xl mx-auto">
            {/* Navigation */}
            <nav className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                <span>/</span>
                <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
                <span>/</span>
                <span className="text-foreground">{post?.title || 'Article'}</span>
              </div>
              
              <Button variant="outline" size="sm" asChild className="group">
                <Link to="/blog">
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to Blog
                </Link>
              </Button>
            </nav>
            
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="text-center space-y-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                  <p className="text-muted-foreground">Loading article...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="text-red-500 text-lg font-medium">Article not found</div>
                  <p className="text-muted-foreground">
                    The article you're looking for may have been moved or doesn't exist.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button asChild>
                      <Link to="/blog">Browse Articles</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/">Go Home</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : post ? (
              <article className="space-y-8">
                {/* Article Header */}
                <header className="space-y-6">
                  <div className="space-y-4">
                    <Badge variant="secondary" className="text-sm">
                      <BookOpen className="h-3 w-3 mr-1" />
                      Language Learning
                    </Badge>
                    
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                      {post.title}
                    </h1>
                    
                    {post.excerpt && (
                      <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                  
                  {/* Article Meta */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                    {post.published_at && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <time dateTime={post.published_at}>
                          {new Date(post.published_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </time>
                      </div>
                    )}
                    
                    {estimatedReadTime > 0 && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{estimatedReadTime} min read</span>
                      </div>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      className="flex items-center gap-2 hover:bg-muted"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                  
                  <Separator />
                </header>
                
                {/* Featured Image */}
                {post.featured_image_url && (
                  <div className="relative overflow-hidden rounded-xl">
                    <img 
                      src={post.featured_image_url} 
                      alt={post.title}
                      className="w-full h-64 md:h-96 object-cover" 
                    />
                  </div>
                )}
                
                {/* Article Content */}
                <Card className="border-0 shadow-lg">
                  <div className="p-8 md:p-12">
                    <div 
                      className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:leading-relaxed prose-p:text-muted-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:pl-6 prose-blockquote:py-4 prose-blockquote:rounded-r-lg prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:border prose-img:rounded-lg prose-img:shadow-md"
                      dangerouslySetInnerHTML={{ __html: post.content }} 
                    />
                  </div>
                </Card>

                {/* Article Footer */}
                <footer className="space-y-8">
                  <Separator />
                  
                  {/* Call to Action */}
                  <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                    <div className="p-8 text-center space-y-4">
                      <h3 className="text-2xl font-bold">Ready to Put This Into Practice?</h3>
                      <p className="text-muted-foreground max-w-2xl mx-auto">
                        Start applying these language learning techniques with our interactive dictation exercises and structured curriculum.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="lg">
                          <Link to="/signup">Start Learning Free</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                          <Link to="/">Explore Features</Link>
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Related Articles */}
                  {relatedPosts && relatedPosts.length > 0 && (
                    <section className="space-y-6">
                      <h3 className="text-2xl font-bold">Related Articles</h3>
                      <div className="grid gap-6 md:grid-cols-3">
                        {relatedPosts.map((relatedPost) => (
                          <Card key={relatedPost.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            {relatedPost.featured_image_url && (
                              <div className="relative overflow-hidden rounded-t-lg">
                                <Link to={`/blog/${relatedPost.slug}`}>
                                  <img 
                                    src={relatedPost.featured_image_url} 
                                    alt={relatedPost.title}
                                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500" 
                                  />
                                </Link>
                              </div>
                            )}
                            
                            <div className="p-4 space-y-2">
                              <h4 className="font-semibold leading-tight">
                                <Link 
                                  to={`/blog/${relatedPost.slug}`} 
                                  className="hover:text-primary transition-colors story-link"
                                >
                                  {relatedPost.title}
                                </Link>
                              </h4>
                              
                              {relatedPost.excerpt && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {relatedPost.excerpt}
                                </p>
                              )}
                              
                              {relatedPost.published_at && (
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <time dateTime={relatedPost.published_at}>
                                    {new Date(relatedPost.published_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </time>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </section>
                  )}
                </footer>
              </article>
            ) : (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto space-y-4">
                  <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto" />
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Article not found</h2>
                    <p className="text-muted-foreground">
                      The article you're looking for doesn't exist or has been removed.
                    </p>
                  </div>
                  <Button asChild>
                    <Link to="/blog">Browse All Articles</Link>
                  </Button>
                </div>
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
