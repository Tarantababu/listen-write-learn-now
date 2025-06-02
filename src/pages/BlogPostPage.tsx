
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { transformBlogPostFromDatabase, transformBlogPostsFromDatabase } from '@/utils/blogPostUtils';
import { format } from 'date-fns';
import SEO from '@/components/SEO';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No slug provided');
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      
      if (error) throw error;
      return transformBlogPostFromDatabase(data);
    },
    enabled: !!slug
  });

  const { data: relatedPosts = [] } = useQuery({
    queryKey: ['related-posts', post?.id],
    queryFn: async () => {
      if (!post?.id) return [];
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .neq('id', post.id)
        .limit(3)
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return transformBlogPostsFromDatabase(data || []);
    },
    enabled: !!post?.id
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <>
      <SEO 
        title={post.metaTitle || post.title}
        description={post.metaDescription || post.excerpt}
        image={post.featuredImage}
      />
      
      <article className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Button variant="ghost" asChild className="mb-6">
                <Link to="/blog">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Blog
                </Link>
              </Button>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {post.publishedAt && format(new Date(post.publishedAt), 'MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{Math.ceil(post.content.split(' ').length / 200)} min read</span>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {post.title}
              </h1>
              
              {post.excerpt && (
                <p className="text-xl text-gray-600 leading-relaxed mb-6">
                  {post.excerpt}
                </p>
              )}
              
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="container mx-auto px-4 -mt-8">
            <div className="max-w-4xl mx-auto">
              <div className="relative rounded-lg overflow-hidden shadow-2xl">
                <img 
                  src={post.featuredImage} 
                  alt={post.title}
                  className="w-full h-96 object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="bg-gray-50 py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {relatedPosts.map((relatedPost) => (
                    <div key={relatedPost.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      {relatedPost.featuredImage && (
                        <div className="aspect-video overflow-hidden">
                          <img 
                            src={relatedPost.featuredImage} 
                            alt={relatedPost.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {relatedPost.title}
                        </h4>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/blog/${relatedPost.slug}`}>
                            Read More
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </article>
    </>
  );
};

export default BlogPostPage;
