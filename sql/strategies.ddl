--
-- Name: strategies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.strategies (
    id integer NOT NULL,
    pretrust text,
    localtrust text,
    alpha real
);

CREATE SEQUENCE public.strategies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE ONLY public.strategies ALTER COLUMN id SET DEFAULT nextval('public.strategies_id_seq'::regclass);

ALTER TABLE ONLY public.strategies
    ADD CONSTRAINT strategies_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.strategies
    ADD CONSTRAINT strategies_pt_lt_a_idx UNIQUE (pretrust, localtrust, alpha);








