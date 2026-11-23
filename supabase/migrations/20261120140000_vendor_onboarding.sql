create table if not exists public.vendor_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  seller_type text not null check (seller_type in ('individual', 'business')),
  first_name text not null,
  last_name text not null,
  legal_full_name text not null,
  date_of_birth date,
  contact_email text not null,
  contact_phone text not null,
  business_name text,
  registration_number text,
  business_type text,
  business_address text,
  business_contact_name text,
  business_contact_email text,
  business_contact_phone text,
  identity_document_path text,
  business_registration_document_path text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendor_business_details_required check (
    seller_type <> 'business'
    or (
      business_name is not null
      and registration_number is not null
      and business_type is not null
      and business_address is not null
      and business_contact_name is not null
      and business_contact_email is not null
      and business_contact_phone is not null
      and business_registration_document_path is not null
    )
  )
);

alter table public.vendor_profiles enable row level security;

drop policy if exists "Vendors can read their own profile" on public.vendor_profiles;
create policy "Vendors can read their own profile"
  on public.vendor_profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'vendor-verification-documents',
  'vendor-verification-documents',
  false,
  4194304,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read their own vendor documents" on storage.objects;
create policy "Users can read their own vendor documents"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'vendor-verification-documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
