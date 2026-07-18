DROP POLICY IF EXISTS "Trainers can upload verification documents" ON storage.objects;

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

CREATE POLICY del_own_verification
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'verifications' AND owner_id = auth.uid()::text);

CREATE POLICY upd_own_verification
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'verifications' AND owner_id = auth.uid()::text)
  WITH CHECK (
    bucket_id = 'verifications'
    AND (
      (storage.foldername(name))[1] = 'ids'
      OR (storage.foldername(name))[1] = 'kra'
      OR (storage.foldername(name))[1] = 'photos'
    )
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
