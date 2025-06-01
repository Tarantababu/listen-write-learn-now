
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/landing/Footer';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Loader2, Calendar, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/SEO';

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

  const featuredPost = posts?.[0];
  const regularPosts = posts?.slice(1) || [];

  return (
    <>
      <SEO
        title="Language Learning Blog - Expert Tips & Techniques"
        description="Discover proven language learning techniques, dictation methods, and educational insights. Get expert tips on vocabulary building, pronunciation, and mastering new languages faster."
        keywords="language learning blog, dictation techniques, language education, learning tips, vocabulary building, foreign language articles, pronunciation guide, language practice"
        url="https://lwlnow.com/blog"
        type="website"
      />
      
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
        <LandingHeader />
        
        <main className="flex-1 container mx-auto px-4 py-16 mt-10">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                <BookOpen className="h-4 w-4" />
                Language Learning Insights
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Master Languages Faster
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Expert insights, proven techniques, and practical tips to accelerate your language learning journey through dictation and active practice.
              </p>
            </div>

            {/* Navigation Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
              <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <span className="text-foreground">Blog</span>
            </nav>
            
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="text-center space-y-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                  <p className="text-muted-foreground">Loading latest articles...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="text-red-500 text-lg font-medium">Unable to load articles</div>
                  <p className="text-muted-foreground">Please try again later or check your connection.</p>
                  <Button asChild>
                    <Link to="/">Return Home</Link>
                  </Button>
                </div>
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="space-y-12">
                {/* Featured Article */}
                {featuredPost && (
                  <section className="mb-16">
                    <div className="flex items-center gap-2 mb-6">
                      <Badge variant="secondary" className="text-sm">Featured Article</Badge>
                    </div>
                    <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/80">
                      <div className="grid md:grid-cols-2 gap-0">
                        {featuredPost.featured_image_url ? (
                          <div className="relative overflow-hidden">
                            <Link to={`/blog/${featuredPost.slug}`}>
                              <img 
                                src={featuredPost.featured_image_url} 
                                alt={featuredPost.title}
                                className="w-full h-64 md:h-full object-cover hover:scale-105 transition-transform duration-500" 
                              />
                            </Link>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                            <BookOpen className="h-16 w-16 text-primary/30" />
                          </div>
                        )}
                        
                        <CardContent className="p-8 flex flex-col justify-center">
                          <CardTitle className="text-2xl mb-4 leading-tight">
                            <Link 
                              to={`/blog/${featuredPost.slug}`} 
                              className="hover:text-primary transition-colors story-link"
                            >
                              {featuredPost.title}
                            </Link>
                          </CardTitle>
                          
                          {featuredPost.excerpt && (
                            <CardDescription className="text-base mb-6 leading-relaxed">
                              {featuredPost.excerpt}
                            </CardDescription>
                          )}
                          
                          <div className="flex items-center justify-between">
                            {featuredPost.published_at && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-2" />
                                <time dateTime={featuredPost.published_at}>
                                  {new Date(featuredPost.published_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </time>
                              </div>
                            )}
                            
                            <Button asChild variant="outline" className="group">
                              <Link to={`/blog/${featuredPost.slug}`}>
                                Read Article
                                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </section>
                )}

                {/* Regular Articles Grid */}
                {regularPosts.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-bold mb-8">Latest Articles</h2>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                      {regularPosts.map((post) => (
                        <Card key={post.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
                          {post.featured_image_url && (
                            <div className="relative overflow-hidden rounded-t-lg">
                              <Link to={`/blog/${post.slug}`}>
                                <img 
                                  src={post.featured_image_url} 
                                  alt={post.title}
                                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" 
                                />
                              </Link>
                            </div>
                          )}
                          
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg leading-tight">
                              <Link 
                                to={`/blog/${post.slug}`} 
                                className="hover:text-primary transition-colors story-link"
                              >
                                {post.title}
                              </Link>
                            </CardTitle>
                          </CardHeader>
                          
                          {post.excerpt && (
                            <CardContent className="pt-0 pb-3">
                              <CardDescription className="leading-relaxed">
                                {post.excerpt.length > 120 ? `${post.excerpt.substring(0, 120)}...` : post.excerpt}
                              </CardDescription>
                            </CardContent>
                          )}
                          
                          <CardFooter className="pt-0 flex items-center justify-between">
                            {post.published_at && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3 mr-1" />
                                <time dateTime={post.published_at}>
                                  {new Date(post.published_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </time>
                              </div>
                            )}
                            
                            <Button asChild variant="ghost" size="sm" className="group p-0 h-auto">
                              <Link to={`/blog/${post.slug}`}>
                                Read more
                                <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                              </Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}

                {/* Call to Action */}
                <section className="mt-16 text-center bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-8">
                  <h2 className="text-2xl font-bold mb-4">Ready to Start Your Language Journey?</h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Join thousands of learners who are mastering new languages through our proven dictation-based approach.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg">
                      <Link to="/signup">Start Learning Free</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link to="/">Learn More</Link>
                    </Button>
                  </div>
                </section>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto space-y-6">
                  <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto" />
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Coming Soon!</h2>
                    <p className="text-muted-foreground">
                      We're preparing exciting language learning content for you. Check back soon for expert tips and insights.
                    </p>
                  </div>
                  <Button asChild>
                    <Link to="/signup">Get Notified When We Publish</Link>
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

export default BlogPage;
