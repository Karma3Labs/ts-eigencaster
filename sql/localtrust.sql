-- Table: public.localtrust

-- DROP TABLE IF EXISTS public.localtrust;

CREATE TABLE IF NOT EXISTS public.localtrust
(
    strategy_id integer NOT NULL,
    i character varying(255) COLLATE pg_catalog."default" NOT NULL,
    j character varying(255) COLLATE pg_catalog."default" NOT NULL,
    v double precision NOT NULL,
    date date NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT localtrust_strategy_id_i_j_date_unique UNIQUE (strategy_id, i, j, date)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.localtrust
    OWNER to replicator;