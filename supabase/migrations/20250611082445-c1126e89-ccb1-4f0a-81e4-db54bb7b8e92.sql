
-- Create function to get top pages efficiently
CREATE OR REPLACE FUNCTION get_top_pages(limit_count integer DEFAULT 10)
RETURNS TABLE(page text, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN v.page = '/' THEN 'Home'
      WHEN v.page ~ '^/' THEN initcap(replace(replace(substring(v.page from 2), '-', ' '), '_', ' '))
      ELSE v.page
    END as page,
    COUNT(*) as count
  FROM public.visitors v
  WHERE v.page IS NOT NULL 
    AND v.page NOT LIKE 'button_click:%'
  GROUP BY v.page
  ORDER BY count DESC
  LIMIT limit_count;
END;
$$;

-- Create function to get top referrers efficiently  
CREATE OR REPLACE FUNCTION get_top_referrers(limit_count integer DEFAULT 8)
RETURNS TABLE(name text, value bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN v.referer IS NULL OR v.referer = '' THEN 'Direct / None'
      ELSE 
        CASE 
          WHEN v.referer ~ '^https?://' THEN 
            regexp_replace(
              regexp_replace(v.referer, '^https?://(?:www\.)?([^/]+).*', '\1'),
              '^www\.', ''
            )
          ELSE v.referer
        END
    END as name,
    COUNT(*) as value
  FROM public.visitors v
  GROUP BY 
    CASE 
      WHEN v.referer IS NULL OR v.referer = '' THEN 'Direct / None'
      ELSE 
        CASE 
          WHEN v.referer ~ '^https?://' THEN 
            regexp_replace(
              regexp_replace(v.referer, '^https?://(?:www\.)?([^/]+).*', '\1'),
              '^www\.', ''
            )
          ELSE v.referer
        END
    END
  ORDER BY value DESC
  LIMIT limit_count;
END;
$$;

-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_visitors_page ON public.visitors(page) WHERE page IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visitors_referer ON public.visitors(referer) WHERE referer IS NOT NULL;
