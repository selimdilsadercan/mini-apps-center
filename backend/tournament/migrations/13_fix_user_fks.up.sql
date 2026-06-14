-- Fix foreign key constraints for tournament service to allow user deletion
ALTER TABLE tournament.tournaments 
DROP CONSTRAINT IF EXISTS tournaments_admin_user_id_fkey,
ADD CONSTRAINT tournaments_admin_user_id_fkey 
FOREIGN KEY (admin_user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE tournament.participants
DROP CONSTRAINT IF EXISTS participants_user_id_fkey,
ADD CONSTRAINT participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
