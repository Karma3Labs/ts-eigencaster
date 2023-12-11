-- View: public.mv_follow_links

-- DROP MATERIALIZED VIEW IF EXISTS public.mv_follow_links;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_follow_links
TABLESPACE pg_default
AS
 SELECT id,
    fid AS follower_fid,
    target_fid AS following_fid
   FROM links
  WHERE type = 'follow'::text
WITH DATA;

ALTER TABLE IF EXISTS public.mv_follow_links
    OWNER TO replicator;