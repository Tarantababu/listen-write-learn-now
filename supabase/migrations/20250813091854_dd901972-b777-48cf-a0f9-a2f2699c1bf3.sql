
-- Create word progression mapping table
CREATE TABLE IF NOT EXISTS word_progression_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  language TEXT NOT NULL,
  complexity_score NUMERIC DEFAULT 50,
  frequency_rank INTEGER,
  syllable_count INTEGER,
  word_family TEXT,
  semantic_category TEXT,
  prerequisite_words TEXT[],
  related_words JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user word progression tracking
CREATE TABLE IF NOT EXISTS user_word_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  word TEXT NOT NULL,
  language TEXT NOT NULL,
  mastery_level INTEGER DEFAULT 1 CHECK (mastery_level >= 1 AND mastery_level <= 10),
  exposure_count INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  first_encountered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_review_due TIMESTAMP WITH TIME ZONE,
  acquisition_velocity NUMERIC DEFAULT 0,
  retention_strength NUMERIC DEFAULT 0,
  contextual_strength JSONB DEFAULT '{}',
  progression_stage TEXT DEFAULT 'new' CHECK (progression_stage IN ('new', 'learning', 'consolidating', 'mastered', 'overlearned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, word, language)
);

-- Create vocabulary progression sessions tracking
CREATE TABLE IF NOT EXISTS vocabulary_progression_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  language TEXT NOT NULL,
  session_type TEXT DEFAULT 'progressive',
  current_complexity_level NUMERIC DEFAULT 30,
  words_introduced INTEGER DEFAULT 0,
  words_reinforced INTEGER DEFAULT 0,
  progression_velocity NUMERIC DEFAULT 1.0,
  session_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_word_progression_user_language ON user_word_progression(user_id, language);
CREATE INDEX IF NOT EXISTS idx_word_progression_mastery ON user_word_progression(mastery_level, progression_stage);
CREATE INDEX IF NOT EXISTS idx_word_progression_next_review ON user_word_progression(next_review_due) WHERE next_review_due IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_word_mappings_complexity ON word_progression_mappings(complexity_score, language);
CREATE INDEX IF NOT EXISTS idx_word_mappings_family ON word_progression_mappings(word_family, language);

-- Enable RLS
ALTER TABLE word_progression_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_word_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_progression_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view word progression mappings" ON word_progression_mappings FOR SELECT USING (true);
CREATE POLICY "Admins can manage word progression mappings" ON word_progression_mappings FOR ALL USING (has_role('admin'::app_role));

CREATE POLICY "Users can manage their own word progression" ON user_word_progression FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progression sessions" ON vocabulary_progression_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_word_progression_mappings_updated_at BEFORE UPDATE ON word_progression_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_word_progression_updated_at BEFORE UPDATE ON user_word_progression FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
