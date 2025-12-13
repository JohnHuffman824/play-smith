-- Add section_type column to sections table
ALTER TABLE sections ADD COLUMN section_type VARCHAR(50) NOT NULL DEFAULT 'standard';

-- Create Ideas sections for all existing playbooks
INSERT INTO sections (playbook_id, name, display_order, section_type)
SELECT
    p.id as playbook_id,
    'Ideas' as name,
    COALESCE((SELECT MAX(s.display_order) + 1 FROM sections s WHERE s.playbook_id = p.id), 0) as display_order,
    'ideas' as section_type
FROM playbooks p
WHERE NOT EXISTS (
    SELECT 1
    FROM sections s
    WHERE s.playbook_id = p.id AND s.section_type = 'ideas'
);
