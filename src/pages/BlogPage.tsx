
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { transformBlogPostsFromDatabase } from '@/utils/blogPostUtils';
import { format } from 'date-fns';
import SEO from '@/components/SEO';

const BlogPage: React.FC = () => {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return transformBlogPostsFromDatabase(data || []);
    }
  });

  const featuredPost = posts[0];
  const recentPosts = posts.slice(1, 4);
  const olderPosts = posts.slice(4);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading blog posts...</div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Language Learning Blog - Tips, Tricks & Insights"
        description="Discover expert language learning tips, study techniques, and insights to accelerate your language learning journey."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Language Learning Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Expert tips, proven techniques, and insights to accelerate your language learning journey
            </p>
          </div>

          {/* Featured Post */}
          {featuredPost && (
            <div className="mb-16">
              <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="md:flex">
                  {featuredPost.featuredImage && (
                    <div className="md:w-1/2">
                      <img 
                        src={featuredPost.featuredImage} 
                        alt={featuredPost.title}
                        className="w-full h-64 md:h-full object-cover"
                      />
                    </div>
                  )}
                  <div className={featuredPost.featuredImage ? "md:w-1/2 p-8" : "p-8"}>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {featuredPost.publishedAt && format(new Date(featuredPost.publishedAt), 'MMMM d, yyyy')}
                      </span>
                      <Clock className="h-4 w-4 ml-4" />
                      <span>{Math.ceil(featuredPost.content.split(' ').length / 200)} min read</span>
                    </div>
                    
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      {featuredPost.title}
                    </h2>
                    
                    <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                      {featuredPost.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {featuredPost.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <Button asChild>
                        <Link to={`/blog/${featuredPost.slug}`}>
                          Read Article
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Recent Posts */}
          {recentPosts.length > 0 && (
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Recent Articles</h3>
              <div className="grid md:grid-cols-3 gap-8">
                {recentPosts.map((post) => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {post.featuredImage && (
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src={post.featuredImage} 
                          alt={post.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {post.publishedAt && format(new Date(post.publishedAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                      
                      <h4 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                        {post.title}
                      </h4>
                      
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/blog/${post.slug}`}>
                            Read More
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Older Posts */}
          {olderPosts.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">More Articles</h3>
              <div className="space-y-6">
                {olderPosts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {post.publishedAt && format(new Date(post.publishedAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                          
                          <h4 className="text-xl font-semibold text-gray-900 mb-2">
                            {post.title}
                          </h4>
                          
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {post.excerpt}
                          </p>
                          
                          <div className="flex flex-wrap gap-2">
                            {post.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <Button variant="ghost" asChild className="ml-4">
                          <Link to={`/blog/${post.slug}`}>
                            Read
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No blog posts available yet.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogPage;
