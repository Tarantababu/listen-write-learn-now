
-- Function to get the next node in a roadmap
CREATE OR REPLACE FUNCTION get_next_roadmap_node(roadmap_id_param UUID, current_position_param INTEGER)
RETURNS UUID AS $$
DECLARE
  next_node_id UUID;
BEGIN
  -- Get the next node by position
  SELECT id INTO next_node_id
  FROM public.roadmap_nodes
  WHERE roadmap_id = roadmap_id_param
    AND position > current_position_param
    AND is_bonus = false  -- Skip bonus nodes for automatic progression
  ORDER BY position
  LIMIT 1;
  
  RETURN next_node_id;
END;
$$ LANGUAGE plpgsql;
