-- Fix foreign key constraints for recipe service to allow user deletion
ALTER TABLE recipe.recipes
DROP CONSTRAINT IF EXISTS recipes_created_user_id_fkey,
ADD CONSTRAINT recipes_created_user_id_fkey 
FOREIGN KEY (created_user_id) REFERENCES public.users(id) ON DELETE CASCADE;
