-- Table: public.globaltrust_config

-- DROP TABLE IF EXISTS public.globaltrust_config;

CREATE TABLE IF NOT EXISTS public.globaltrust_config
(
    strategy_id integer NOT NULL,
    strategy_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    pretrust text COLLATE pg_catalog."default",
    localtrust text COLLATE pg_catalog."default",
    alpha real,
    date date NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT globaltrust_config_pkey PRIMARY KEY (strategy_id, date)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.globaltrust_config
    OWNER to replicator;