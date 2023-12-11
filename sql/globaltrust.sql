-- Table: public.globaltrust

-- DROP TABLE IF EXISTS public.globaltrust;

CREATE TABLE IF NOT EXISTS public.globaltrust
(
    strategy_id integer,
    i bigint,
    v real,
    date date DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT globaltrust_strategy_name_date_i_unique UNIQUE (strategy_id, date, i)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.globaltrust
    OWNER to replicator;
-- Index: globaltrust_id_idx

-- DROP INDEX IF EXISTS public.globaltrust_id_idx;

CREATE INDEX IF NOT EXISTS globaltrust_id_idx
    ON public.globaltrust USING btree
    (strategy_id ASC NULLS LAST)
    TABLESPACE pg_default;