
-- === 1) Ensure required columns & soft delete ===
alter table public.posts add column if not exists deleted_at timestamptz;
alter table public.posts add column if not exists like_count int default 0;
alter table public.posts add column if not exists comment_count int default 0;

-- === 2) Trigger functions (idempotent) ===
-- If you already have these, this will just replace them with safe versions.

create or replace function public.update_post_comment_count()
returns trigger
language plpgsql
as $$
begin
  update public.posts
     set comment_count = (
       select count(*) from public.comments c
       where c.post_id = (case when tg_op = 'DELETE' then old.post_id else new.post_id end)
     )
   where id = (case when tg_op = 'DELETE' then old.post_id else new.post_id end);
  return null;
end; $$;

create or replace function public.notify_post_comment()
returns trigger
language plpgsql
as $$
begin
  -- no-op placeholder; wire to your notifications table if needed
  return null;
end; $$;

create or replace function public.update_post_like_count()
returns trigger
language plpgsql
as $$
begin
  update public.posts
     set like_count = (
       select count(*) from public.likes l
       where l.post_id = (case when tg_op = 'DELETE' then old.post_id else new.post_id end)
     )
   where id = (case when tg_op = 'DELETE' then old.post_id else new.post_id end);
  return null;
end; $$;

create or replace function public.notify_post_like()
returns trigger
language plpgsql
as $$
begin
  -- no-op placeholder; wire to your notifications table if needed
  return null;
end; $$;

-- === 3) Attach triggers to keep counts in sync (idempotent) ===
drop trigger if exists trg_comments_update_count on public.comments;
create trigger trg_comments_update_count
after insert or delete on public.comments
for each row execute function public.update_post_comment_count();

drop trigger if exists trg_comments_notify on public.comments;
create trigger trg_comments_notify
after insert on public.comments
for each row execute function public.notify_post_comment();

drop trigger if exists trg_likes_update_count on public.likes;
create trigger trg_likes_update_count
after insert or delete on public.likes
for each row execute function public.update_post_like_count();

drop trigger if exists trg_likes_notify on public.likes;
create trigger trg_likes_notify
after insert on public.likes
for each row execute function public.notify_post_like();

-- === 4) SECURE feed RPC (keeps working under RLS) ===
-- - SECURITY DEFINER so it can join profiles despite RLS
-- - Filters hidden users and soft-deleted posts
-- - Returns only safe author fields
create or replace function public.get_post_feed(p_offset int, p_limit int)
returns table (
  post_id uuid,
  author_id uuid,
  created_at timestamptz,
  text text,
  media_urls text[],
  like_count int,
  comment_count int,
  author_display_name text,
  author_avatar_url text,
  author_verified boolean,
  author_vibe text
)
language sql
security definer
set search_path = public
stable
as $$
  with base as (
    select p.id as post_id, p.author_id, p.created_at, p.text, p.media_urls,
           coalesce(p.like_count,0) as like_count,
           coalesce(p.comment_count,0) as comment_count
    from public.posts p
    where p.deleted_at is null
    order by p.created_at desc
    offset greatest(p_offset,0) limit greatest(p_limit,1)
  )
  select
    b.post_id, b.author_id, b.created_at, b.text, b.media_urls,
    b.like_count, b.comment_count,
    pr.display_name as author_display_name,
    pr.avatar_url   as author_avatar_url,
    coalesce(pr.verified,false) as author_verified,
    pr.vibe         as author_vibe
  from base b
  join public.profiles pr on pr.id = b.author_id
  where coalesce(pr.is_visible,false) = true;
$$;

revoke all on function public.get_post_feed(int,int) from public;
grant execute on function public.get_post_feed(int,int) to authenticated;
