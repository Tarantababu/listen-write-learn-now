
import { BlogPost } from '@/types';

export function transformBlogPostFromDatabase(dbPost: any): BlogPost {
  return {
    id: dbPost.id,
    title: dbPost.title,
    content: dbPost.content,
    excerpt: dbPost.excerpt || '',
    slug: dbPost.slug,
    status: dbPost.status as 'draft' | 'published' | 'archived',
    authorId: dbPost.author_id,
    publishedAt: dbPost.published_at,
    createdAt: dbPost.created_at,
    updatedAt: dbPost.updated_at,
    tags: dbPost.tags || [],
    featuredImage: dbPost.featured_image_url,
    metaTitle: dbPost.meta_title,
    metaDescription: dbPost.meta_description,
  };
}

export function transformBlogPostsFromDatabase(dbPosts: any[]): BlogPost[] {
  return dbPosts.map(transformBlogPostFromDatabase);
}
