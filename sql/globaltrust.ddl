--
-- Name: globaltrust; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.globaltrust (
    strategy_id integer,
    i bigint,
    v real
);

ALTER TABLE ONLY public.globaltrust
    ADD CONSTRAINT globaltrust_id_i_idx UNIQUE (strategy_id, i);

CREATE INDEX globaltrust_id_idx ON public.globaltrust USING btree (strategy_id);
