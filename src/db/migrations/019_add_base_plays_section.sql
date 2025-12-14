-- Add 'base' as a valid section_type value
-- Note: section_type is VARCHAR, so no enum modification needed

-- First, shift all existing sections' display_order up by 1 to make room at position 0
UPDATE sections
SET display_order = display_order + 1;

-- Create Base Plays section for all existing playbooks
INSERT INTO sections (playbook_id, name, display_order, section_type)
SELECT
    p.id as playbook_id,
    'Base Plays' as name,
    0 as display_order,
    'base' as section_type
FROM playbooks p
WHERE NOT EXISTS (
    SELECT 1
    FROM sections s
    WHERE s.playbook_id = p.id AND s.section_type = 'base'
);
