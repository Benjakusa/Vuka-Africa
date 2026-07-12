-- Fix storage RLS policies for verification documents
-- The existing policy only allows uploads to gov-ids/ but the app uses ids/, kra/, photos/

DROP POLICY IF EXISTS "Trainers can upload verification documents" ON storage.objects;

-- Allow authenticated users to upload to ids/, kra/, photos/ under verifications/ bucket, in their own subfolder
CREATE POLICY "Trainers can upload verification documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'verifications'::text
    AND auth.role() = 'authenticated'
    AND (
      (storage.foldername(name))[1] = 'ids'
      OR (storage.foldername(name))[1] = 'kra'
      OR (storage.foldername(name))[1] = 'photos'
    )
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow authenticated users to delete their own verification documents
DROP POLICY IF EXISTS "Uploaders can delete own verification documents" ON storage.objects;

CREATE POLICY "Uploaders can delete own verification documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'verifications'::text
    AND owner_id = auth.uid()::text
  );

-- Allow authenticated users to update their own verification documents
DROP POLICY IF EXISTS "Uploaders can update own verification documents" ON storage.objects;

CREATE POLICY "Uploaders can update own verification documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'verifications'::text
    AND owner_id = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'verifications'::text
    AND (
      (storage.foldername(name))[1] = 'ids'
      OR (storage.foldername(name))[1] = 'kra'
      OR (storage.foldername(name))[1] = 'photos'
    )
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
