update storage.buckets
set public = false
where id = 'processed-images';

drop policy if exists "Anyone can read processed images" on storage.objects;
drop policy if exists "Anyone can upload original images" on storage.objects;
drop policy if exists "Anyone can upload processed images" on storage.objects;
