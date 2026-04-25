-- Add sortOrder column to defects table
ALTER TABLE defects ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create column_sort_preferences table
CREATE TABLE IF NOT EXISTS column_sort_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    column_status defect_status NOT NULL,
    sort_field VARCHAR(50) NOT NULL DEFAULT 'defectNumber',
    sort_direction VARCHAR(10) NOT NULL DEFAULT 'asc',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(column_status)
);

-- Create index on sort_order for better performance
CREATE INDEX IF NOT EXISTS idx_defects_sort_order ON defects(sort_order);

-- Insert default preferences for each column
INSERT INTO column_sort_preferences (column_status, sort_field, sort_direction)
VALUES 
    ('TODO', 'defectNumber', 'asc'),
    ('IN_PROGRESS', 'defectNumber', 'asc'),
    ('DONE', 'defectNumber', 'asc')
ON CONFLICT (column_status) DO NOTHING;
