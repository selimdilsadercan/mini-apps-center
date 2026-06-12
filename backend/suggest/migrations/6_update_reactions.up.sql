-- Update the reaction check constraint on suggest.suggestions
ALTER TABLE suggest.suggestions DROP CONSTRAINT IF EXISTS suggestions_reaction_check;
ALTER TABLE suggest.suggestions ADD CONSTRAINT suggestions_reaction_check CHECK (reaction IN ('loved', 'skull', 'saved', 'mid', 'perfect'));
