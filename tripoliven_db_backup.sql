--
-- PostgreSQL database dump
--

\restrict gpFlWDYpeF1cDYQeblCfcv6FDSLM4Z9FgjsiQksnGJnMcf3MkXftzhcobh7JubC

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(255) NOT NULL,
    details text,
    ip_address character varying(100),
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    rif character varying(255) NOT NULL,
    state character varying(255) NOT NULL,
    address text,
    phone character varying(100),
    contact_person character varying(255),
    email character varying(255),
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO postgres;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    manager_id integer,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: dispatches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dispatches (
    id integer NOT NULL,
    client_id integer NOT NULL,
    product_type character varying(255) NOT NULL,
    quantity_tm double precision NOT NULL,
    destination_state character varying(255) NOT NULL,
    dispatch_datetime character varying(255) NOT NULL,
    order_number character varying(255) NOT NULL,
    driver_name character varying(255),
    license_plate character varying(100),
    status character varying(100) DEFAULT 'Despachado'::character varying NOT NULL,
    created_by integer,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dispatches OWNER TO postgres;

--
-- Name: dispatches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dispatches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dispatches_id_seq OWNER TO postgres;

--
-- Name: dispatches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dispatches_id_seq OWNED BY public.dispatches.id;


--
-- Name: positions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.positions (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    department_id integer NOT NULL,
    description text,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.positions OWNER TO postgres;

--
-- Name: positions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.positions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.positions_id_seq OWNER TO postgres;

--
-- Name: positions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.positions_id_seq OWNED BY public.positions.id;


--
-- Name: product_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_types (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    status character varying(100) DEFAULT 'Activo'::character varying NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.product_types OWNER TO postgres;

--
-- Name: product_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_types_id_seq OWNER TO postgres;

--
-- Name: product_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_types_id_seq OWNED BY public.product_types.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    system_role character varying(100) DEFAULT 'Usuario'::character varying NOT NULL,
    status character varying(100) DEFAULT 'Activo'::character varying NOT NULL,
    position_id integer,
    department_id integer,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: dispatches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatches ALTER COLUMN id SET DEFAULT nextval('public.dispatches_id_seq'::regclass);


--
-- Name: positions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions ALTER COLUMN id SET DEFAULT nextval('public.positions_id_seq'::regclass);


--
-- Name: product_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_types ALTER COLUMN id SET DEFAULT nextval('public.product_types_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, details, ip_address, createdat) FROM stdin;
1	1	INICIO_SESION_EXITOSO	Sesión iniciada correctamente. Rol: Administrador.	::1	2026-05-20 22:35:20.60955
2	1	INICIO_SESION_EXITOSO	Sesión iniciada correctamente. Rol: Administrador.	::1	2026-05-20 23:36:23.794002
3	\N	INICIO_SESION_FALLIDO	Intento de acceso fallido con el usuario: "ngarcia".	::1	2026-05-21 00:41:25.097643
4	1	INICIO_SESION_EXITOSO	Sesión iniciada correctamente. Rol: Administrador.	::1	2026-05-21 00:41:30.430057
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id, name, rif, state, address, phone, contact_person, email, createdat) FROM stdin;
1	Alimentos Oriente 1	J-40000001-6	Amazonas	Zona Industrial, Avenida Principal, local 4, Estado Amazonas	0241-8000001	Gerente de Logística 1	contacto@alimentosoriente1.com	2026-05-20 22:41:49.365422
2	Detergentes Caribe 2	J-40000002-7	Anzoátegui	Zona Industrial, Avenida Principal, local 8, Estado Anzoátegui	0241-8000002	Gerente de Logística 2	contacto@detergentescaribe2.com	2026-05-20 22:41:49.368142
3	Química Latina 3	J-40000003-8	Apure	Zona Industrial, Avenida Principal, local 12, Estado Apure	0241-8000003	Gerente de Logística 3	contacto@qumicalatina3.com	2026-05-20 22:41:49.369482
4	Distribuidora del Centro 4	J-40000004-9	Aragua	Zona Industrial, Avenida Principal, local 16, Estado Aragua	0241-8000004	Gerente de Logística 4	contacto@distribuidoradelcentro4.com	2026-05-20 22:41:49.37059
5	Inversiones Oriente 5	J-40000005-1	Barinas	Zona Industrial, Avenida Principal, local 20, Estado Barinas	0241-8000005	Gerente de Logística 5	contacto@inversionesoriente5.com	2026-05-20 22:41:49.37175
6	Consorcio Caribe 6	J-40000006-2	Bolívar	Zona Industrial, Avenida Principal, local 24, Estado Bolívar	0241-8000006	Gerente de Logística 6	contacto@consorciocaribe6.com	2026-05-20 22:41:49.372737
7	Logística Latina 7	J-40000007-3	Carabobo	Zona Industrial, Avenida Principal, local 28, Estado Carabobo	0241-8000007	Gerente de Logística 7	contacto@logsticalatina7.com	2026-05-20 22:41:49.37377
8	Suministros del Centro 8	J-40000008-4	Cojedes	Zona Industrial, Avenida Principal, local 32, Estado Cojedes	0241-8000008	Gerente de Logística 8	contacto@suministrosdelcentro8.com	2026-05-20 22:41:49.374789
9	Industrias Oriente 9	J-40000009-5	Delta Amacuro	Zona Industrial, Avenida Principal, local 36, Estado Delta Amacuro	0241-8000009	Gerente de Logística 9	contacto@industriasoriente9.com	2026-05-20 22:41:49.375747
10	Corporación Caribe 10	J-40000010-6	Distrito Capital	Zona Industrial, Avenida Principal, local 40, Estado Distrito Capital	0241-8000010	Gerente de Logística 10	contacto@corporacincaribe10.com	2026-05-20 22:41:49.376657
11	Alimentos Latina 11	J-40000011-7	Falcón	Zona Industrial, Avenida Principal, local 44, Estado Falcón	0241-8000011	Gerente de Logística 11	contacto@alimentoslatina11.com	2026-05-20 22:41:49.377408
12	Detergentes del Centro 12	J-40000012-8	Guárico	Zona Industrial, Avenida Principal, local 48, Estado Guárico	0241-8000012	Gerente de Logística 12	contacto@detergentesdelcentro12.com	2026-05-20 22:41:49.378092
13	Química Oriente 13	J-40000013-9	Lara	Zona Industrial, Avenida Principal, local 52, Estado Lara	0241-8000013	Gerente de Logística 13	contacto@qumicaoriente13.com	2026-05-20 22:41:49.379356
14	Distribuidora Caribe 14	J-40000014-1	Mérida	Zona Industrial, Avenida Principal, local 56, Estado Mérida	0241-8000014	Gerente de Logística 14	contacto@distribuidoracaribe14.com	2026-05-20 22:41:49.380367
15	Inversiones Latina 15	J-40000015-2	Miranda	Zona Industrial, Avenida Principal, local 60, Estado Miranda	0241-8000015	Gerente de Logística 15	contacto@inversioneslatina15.com	2026-05-20 22:41:49.381821
16	Consorcio del Centro 16	J-40000016-3	Monagas	Zona Industrial, Avenida Principal, local 64, Estado Monagas	0241-8000016	Gerente de Logística 16	contacto@consorciodelcentro16.com	2026-05-20 22:41:49.382878
17	Logística Oriente 17	J-40000017-4	Nueva Esparta	Zona Industrial, Avenida Principal, local 68, Estado Nueva Esparta	0241-8000017	Gerente de Logística 17	contacto@logsticaoriente17.com	2026-05-20 22:41:49.383708
18	Suministros Caribe 18	J-40000018-5	Portuguesa	Zona Industrial, Avenida Principal, local 72, Estado Portuguesa	0241-8000018	Gerente de Logística 18	contacto@suministroscaribe18.com	2026-05-20 22:41:49.384529
19	Industrias Latina 19	J-40000019-6	Sucre	Zona Industrial, Avenida Principal, local 76, Estado Sucre	0241-8000019	Gerente de Logística 19	contacto@industriaslatina19.com	2026-05-20 22:41:49.38528
20	Corporación del Centro 20	J-40000020-7	Táchira	Zona Industrial, Avenida Principal, local 80, Estado Táchira	0241-8000020	Gerente de Logística 20	contacto@corporacindelcentro20.com	2026-05-20 22:41:49.386075
21	Alimentos Oriente 21	J-40000021-8	Trujillo	Zona Industrial, Avenida Principal, local 84, Estado Trujillo	0241-8000021	Gerente de Logística 21	contacto@alimentosoriente21.com	2026-05-20 22:41:49.386854
22	Detergentes Caribe 22	J-40000022-9	Vargas	Zona Industrial, Avenida Principal, local 88, Estado Vargas	0241-8000022	Gerente de Logística 22	contacto@detergentescaribe22.com	2026-05-20 22:41:49.387537
23	Química Latina 23	J-40000023-1	Yaracuy	Zona Industrial, Avenida Principal, local 92, Estado Yaracuy	0241-8000023	Gerente de Logística 23	contacto@qumicalatina23.com	2026-05-20 22:41:49.388156
24	Distribuidora del Centro 24	J-40000024-2	Zulia	Zona Industrial, Avenida Principal, local 96, Estado Zulia	0241-8000024	Gerente de Logística 24	contacto@distribuidoradelcentro24.com	2026-05-20 22:41:49.388898
25	Inversiones Oriente 25	J-40000025-3	Amazonas	Zona Industrial, Avenida Principal, local 100, Estado Amazonas	0241-8000025	Gerente de Logística 25	contacto@inversionesoriente25.com	2026-05-20 22:41:49.389572
26	Consorcio Caribe 26	J-40000026-4	Anzoátegui	Zona Industrial, Avenida Principal, local 104, Estado Anzoátegui	0241-8000026	Gerente de Logística 26	contacto@consorciocaribe26.com	2026-05-20 22:41:49.390276
27	Logística Latina 27	J-40000027-5	Apure	Zona Industrial, Avenida Principal, local 108, Estado Apure	0241-8000027	Gerente de Logística 27	contacto@logsticalatina27.com	2026-05-20 22:41:49.390993
28	Suministros del Centro 28	J-40000028-6	Aragua	Zona Industrial, Avenida Principal, local 112, Estado Aragua	0241-8000028	Gerente de Logística 28	contacto@suministrosdelcentro28.com	2026-05-20 22:41:49.391716
29	Industrias Oriente 29	J-40000029-7	Barinas	Zona Industrial, Avenida Principal, local 116, Estado Barinas	0241-8000029	Gerente de Logística 29	contacto@industriasoriente29.com	2026-05-20 22:41:49.392449
30	Corporación Caribe 30	J-40000030-8	Bolívar	Zona Industrial, Avenida Principal, local 120, Estado Bolívar	0241-8000030	Gerente de Logística 30	contacto@corporacincaribe30.com	2026-05-20 22:41:49.393278
31	Alimentos Latina 31	J-40000031-9	Carabobo	Zona Industrial, Avenida Principal, local 124, Estado Carabobo	0241-8000031	Gerente de Logística 31	contacto@alimentoslatina31.com	2026-05-20 22:41:49.394072
32	Detergentes del Centro 32	J-40000032-1	Cojedes	Zona Industrial, Avenida Principal, local 128, Estado Cojedes	0241-8000032	Gerente de Logística 32	contacto@detergentesdelcentro32.com	2026-05-20 22:41:49.394786
33	Química Oriente 33	J-40000033-2	Delta Amacuro	Zona Industrial, Avenida Principal, local 132, Estado Delta Amacuro	0241-8000033	Gerente de Logística 33	contacto@qumicaoriente33.com	2026-05-20 22:41:49.39553
34	Distribuidora Caribe 34	J-40000034-3	Distrito Capital	Zona Industrial, Avenida Principal, local 136, Estado Distrito Capital	0241-8000034	Gerente de Logística 34	contacto@distribuidoracaribe34.com	2026-05-20 22:41:49.396649
35	Inversiones Latina 35	J-40000035-4	Falcón	Zona Industrial, Avenida Principal, local 140, Estado Falcón	0241-8000035	Gerente de Logística 35	contacto@inversioneslatina35.com	2026-05-20 22:41:49.397728
36	Cliente Empresa 1 C.A.	J-65275750-8	Miranda	Av. Principal, Zona Industrial 1	0414-6634714	Contacto 1	contacto1@empresa1.com	2026-05-21 00:53:57.496236
37	Cliente Empresa 2 C.A.	J-90237203-6	Carabobo	Av. Principal, Zona Industrial 2	0414-2524874	Contacto 2	contacto2@empresa2.com	2026-05-21 00:53:57.501486
38	Cliente Empresa 3 C.A.	J-41123187-0	Carabobo	Av. Principal, Zona Industrial 3	0414-4272508	Contacto 3	contacto3@empresa3.com	2026-05-21 00:53:57.502599
39	Cliente Empresa 4 C.A.	J-20678758-3	Aragua	Av. Principal, Zona Industrial 4	0414-8654017	Contacto 4	contacto4@empresa4.com	2026-05-21 00:53:57.505642
40	Cliente Empresa 5 C.A.	J-44752343-3	Aragua	Av. Principal, Zona Industrial 5	0414-9452538	Contacto 5	contacto5@empresa5.com	2026-05-21 00:53:57.506772
41	Cliente Empresa 6 C.A.	J-13914870-0	Distrito Capital	Av. Principal, Zona Industrial 6	0414-3221534	Contacto 6	contacto6@empresa6.com	2026-05-21 00:53:57.507881
42	Cliente Empresa 7 C.A.	J-92416381-5	Aragua	Av. Principal, Zona Industrial 7	0414-4319882	Contacto 7	contacto7@empresa7.com	2026-05-21 00:53:57.508775
43	Cliente Empresa 8 C.A.	J-39018803-3	Distrito Capital	Av. Principal, Zona Industrial 8	0414-1462314	Contacto 8	contacto8@empresa8.com	2026-05-21 00:53:57.509649
44	Cliente Empresa 9 C.A.	J-84307655-2	Distrito Capital	Av. Principal, Zona Industrial 9	0414-2519390	Contacto 9	contacto9@empresa9.com	2026-05-21 00:53:57.510618
45	Cliente Empresa 10 C.A.	J-80042892-4	Miranda	Av. Principal, Zona Industrial 10	0414-2935670	Contacto 10	contacto10@empresa10.com	2026-05-21 00:53:57.511339
46	Cliente Empresa 11 C.A.	J-93679272-5	Distrito Capital	Av. Principal, Zona Industrial 11	0414-4222166	Contacto 11	contacto11@empresa11.com	2026-05-21 00:53:57.511999
47	Cliente Empresa 12 C.A.	J-64244111-5	Aragua	Av. Principal, Zona Industrial 12	0414-5651123	Contacto 12	contacto12@empresa12.com	2026-05-21 00:53:57.512655
48	Cliente Empresa 13 C.A.	J-47534301-6	Distrito Capital	Av. Principal, Zona Industrial 13	0414-5688168	Contacto 13	contacto13@empresa13.com	2026-05-21 00:53:57.513385
49	Cliente Empresa 14 C.A.	J-55994417-2	Miranda	Av. Principal, Zona Industrial 14	0414-1693359	Contacto 14	contacto14@empresa14.com	2026-05-21 00:53:57.514177
50	Cliente Empresa 15 C.A.	J-86405755-0	Lara	Av. Principal, Zona Industrial 15	0414-1078736	Contacto 15	contacto15@empresa15.com	2026-05-21 00:53:57.514776
51	Cliente Empresa 16 C.A.	J-78251115-0	Lara	Av. Principal, Zona Industrial 16	0414-1414571	Contacto 16	contacto16@empresa16.com	2026-05-21 00:53:57.515802
52	Cliente Empresa 17 C.A.	J-92695833-7	Lara	Av. Principal, Zona Industrial 17	0414-3607239	Contacto 17	contacto17@empresa17.com	2026-05-21 00:53:57.5166
53	Cliente Empresa 18 C.A.	J-12023389-5	Carabobo	Av. Principal, Zona Industrial 18	0414-3658511	Contacto 18	contacto18@empresa18.com	2026-05-21 00:53:57.517236
54	Cliente Empresa 19 C.A.	J-86180697-6	Aragua	Av. Principal, Zona Industrial 19	0414-3565105	Contacto 19	contacto19@empresa19.com	2026-05-21 00:53:57.517813
55	Cliente Empresa 20 C.A.	J-58558737-0	Lara	Av. Principal, Zona Industrial 20	0414-7333793	Contacto 20	contacto20@empresa20.com	2026-05-21 00:53:57.518473
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name, description, manager_id, createdat) FROM stdin;
1	Tecnología (TI)	Soporte y desarrollo de sistemas	\N	2026-05-20 22:35:14.396939
\.


--
-- Data for Name: dispatches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dispatches (id, client_id, product_type, quantity_tm, destination_state, dispatch_datetime, order_number, driver_name, license_plate, status, created_by, createdat) FROM stdin;
1	1	Otros	24.65	Amazonas	2026-05-05T10:03	TRIP-26001	Carlos Eduardo Gómez	J01KL1M	Entregado	1	2026-05-20 22:41:49.400611
2	2	Otros	24.95	Anzoátegui	2026-05-19T14:15	TRIP-26002	José Gregorio Rodríguez	G70HI8J	Transito	1	2026-05-20 22:41:49.405568
3	3	Pirofosfato	16.77	Apure	2026-05-20T13:29	TRIP-26003	Manuel Vicente Díaz	H80IJ9K	Despachado	1	2026-05-20 22:41:49.406793
4	4	Tripolifosfato	15.05	Aragua	2026-05-05T14:29	TRIP-26004	Carlos Eduardo Gómez	K12LM2N	Entregado	1	2026-05-20 22:41:49.407818
5	5	Tripolifosfato	19.88	Barinas	2026-05-13T16:17	TRIP-26005	Daniel Eduardo Morales	K12LM2N	Transito	1	2026-05-20 22:41:49.408806
6	6	Otros	43.87	Bolívar	2026-04-24T13:45	TRIP-26006	Juan Carlos Pérez	B20CD3E	Despachado	1	2026-05-20 22:41:49.409778
7	7	Tripolifosfato	26.48	Carabobo	2026-05-08T11:47	TRIP-26007	Pedro José González	I90JK0L	Entregado	1	2026-05-20 22:41:49.410707
8	8	Pirofosfato	47.91	Cojedes	2026-05-14T14:39	TRIP-26008	Juan Carlos Pérez	I90JK0L	Transito	1	2026-05-20 22:41:49.411818
9	9	Ácido Fosfórico	21.74	Delta Amacuro	2026-05-17T08:46	TRIP-26009	Pedro José González	K12LM2N	Despachado	1	2026-05-20 22:41:49.41299
10	10	Ácido Fosfórico	23.5	Distrito Capital	2026-04-24T14:01	TRIP-26010	Francisco Javier Silva	F60GH7I	Entregado	1	2026-05-20 22:41:49.414221
11	11	Pirofosfato	32.85	Falcón	2026-05-16T14:56	TRIP-26011	Ramón Antonio Castillo	D40EF5G	Transito	1	2026-05-20 22:41:49.41629
12	12	Ácido Fosfórico	22.25	Guárico	2026-04-30T08:06	TRIP-26012	Jesús Alberto Hernández	E50FG6H	Despachado	1	2026-05-20 22:41:49.417256
13	13	Tripolifosfato	27.14	Lara	2026-05-03T14:40	TRIP-26013	Carlos Eduardo Gómez	F60GH7I	Entregado	1	2026-05-20 22:41:49.418387
14	14	Ácido Fosfórico	25.17	Mérida	2026-05-05T09:21	TRIP-26014	Daniel Eduardo Morales	B20CD3E	Transito	1	2026-05-20 22:41:49.419391
15	15	Otros	26.01	Miranda	2026-04-24T08:00	TRIP-26015	Miguel Ángel Torres	E50FG6H	Despachado	1	2026-05-20 22:41:49.420371
16	16	Tripolifosfato	11.41	Monagas	2026-05-10T09:14	TRIP-26016	Juan Carlos Pérez	D40EF5G	Entregado	1	2026-05-20 22:41:49.421125
17	17	Ácido Fosfórico	20.18	Nueva Esparta	2026-04-30T10:49	TRIP-26017	Luis Alejandro Mendoza	A10BC2D	Transito	1	2026-05-20 22:41:49.421936
18	18	Ácido Fosfórico	43.49	Portuguesa	2026-05-04T08:26	TRIP-26018	Miguel Ángel Torres	F60GH7I	Despachado	1	2026-05-20 22:41:49.42265
19	19	Tripolifosfato	26.23	Sucre	2026-04-24T14:00	TRIP-26019	Juan Carlos Pérez	I90JK0L	Entregado	1	2026-05-20 22:41:49.423402
20	20	Pirofosfato	33.79	Táchira	2026-04-21T08:36	TRIP-26020	Miguel Ángel Torres	D40EF5G	Transito	1	2026-05-20 22:41:49.424166
21	21	Pirofosfato	47.94	Trujillo	2026-05-14T13:16	TRIP-26021	Luis Alejandro Mendoza	J01KL1M	Despachado	1	2026-05-20 22:41:49.424886
22	22	Pirofosfato	38.2	Vargas	2026-05-19T15:22	TRIP-26022	Manuel Vicente Díaz	G70HI8J	Entregado	1	2026-05-20 22:41:49.425623
23	23	Otros	26.52	Yaracuy	2026-05-14T12:28	TRIP-26023	Francisco Javier Silva	J01KL1M	Transito	1	2026-05-20 22:41:49.426325
24	24	Tripolifosfato	18.61	Zulia	2026-04-22T16:49	TRIP-26024	Jesús Alberto Hernández	A10BC2D	Despachado	1	2026-05-20 22:41:49.426998
25	25	Ácido Fosfórico	25.15	Amazonas	2026-04-22T09:11	TRIP-26025	Francisco Javier Silva	B20CD3E	Entregado	1	2026-05-20 22:41:49.427822
26	26	Pirofosfato	30.36	Anzoátegui	2026-05-01T12:02	TRIP-26026	Pedro José González	D40EF5G	Transito	1	2026-05-20 22:41:49.42878
27	27	Pirofosfato	36.22	Apure	2026-05-12T14:26	TRIP-26027	Miguel Ángel Torres	F60GH7I	Despachado	1	2026-05-20 22:41:49.42979
28	28	Otros	28.69	Aragua	2026-05-05T15:05	TRIP-26028	Daniel Eduardo Morales	G70HI8J	Entregado	1	2026-05-20 22:41:49.430862
29	29	Ácido Fosfórico	14.98	Barinas	2026-05-17T13:36	TRIP-26029	Ramón Antonio Castillo	F60GH7I	Transito	1	2026-05-20 22:41:49.432101
30	30	Otros	37.15	Bolívar	2026-05-13T14:14	TRIP-26030	Daniel Eduardo Morales	G70HI8J	Despachado	1	2026-05-20 22:41:49.433394
31	31	Otros	35.77	Carabobo	2026-05-06T08:09	TRIP-26031	Carlos Eduardo Gómez	H80IJ9K	Entregado	1	2026-05-20 22:41:49.434512
32	32	Pirofosfato	19.52	Cojedes	2026-04-28T14:02	TRIP-26032	Luis Alejandro Mendoza	H80IJ9K	Transito	1	2026-05-20 22:41:49.435612
33	33	Pirofosfato	22.98	Delta Amacuro	2026-05-18T16:27	TRIP-26033	Manuel Vicente Díaz	D40EF5G	Despachado	1	2026-05-20 22:41:49.4367
34	34	Pirofosfato	18.84	Distrito Capital	2026-05-16T13:09	TRIP-26034	Carlos Eduardo Gómez	G70HI8J	Entregado	1	2026-05-20 22:41:49.437743
35	35	Pirofosfato	20.62	Falcón	2026-05-05T13:04	TRIP-26035	Jesús Alberto Hernández	C30DE4F	Transito	1	2026-05-20 22:41:49.438658
36	1	Tripolifosfato	22.92	Guárico	2026-04-22T08:21	TRIP-26036	Luis Alejandro Mendoza	I90JK0L	Despachado	1	2026-05-20 22:41:49.439454
37	2	Tripolifosfato	48	Lara	2026-04-25T08:47	TRIP-26037	Pedro José González	J01KL1M	Entregado	1	2026-05-20 22:41:49.4402
38	3	Otros	36.28	Mérida	2026-05-16T16:35	TRIP-26038	Jesús Alberto Hernández	D40EF5G	Transito	1	2026-05-20 22:41:49.44102
39	4	Pirofosfato	29.42	Miranda	2026-04-24T12:52	TRIP-26039	Jorge Luis Rivas	L23MN3O	Despachado	1	2026-05-20 22:41:49.442028
40	5	Otros	15.4	Monagas	2026-04-21T15:44	TRIP-26040	Manuel Vicente Díaz	I90JK0L	Entregado	1	2026-05-20 22:41:49.442765
41	6	Otros	26.85	Nueva Esparta	2026-04-29T14:07	TRIP-26041	Jesús Alberto Hernández	L23MN3O	Transito	1	2026-05-20 22:41:49.443447
42	7	Otros	13.23	Portuguesa	2026-05-13T16:21	TRIP-26042	Juan Carlos Pérez	J01KL1M	Despachado	1	2026-05-20 22:41:49.444236
43	8	Otros	28.91	Sucre	2026-05-16T14:56	TRIP-26043	Daniel Eduardo Morales	J01KL1M	Entregado	1	2026-05-20 22:41:49.445075
44	9	Tripolifosfato	18.23	Táchira	2026-04-22T09:44	TRIP-26044	Jorge Luis Rivas	K12LM2N	Transito	1	2026-05-20 22:41:49.446193
45	10	Otros	32.65	Trujillo	2026-04-28T12:31	TRIP-26045	Jorge Luis Rivas	A10BC2D	Despachado	1	2026-05-20 22:41:49.447189
46	11	Otros	33.51	Vargas	2026-04-25T09:12	TRIP-26046	Ramón Antonio Castillo	J01KL1M	Entregado	1	2026-05-20 22:41:49.448816
47	12	Pirofosfato	18.66	Yaracuy	2026-04-23T08:02	TRIP-26047	Francisco Javier Silva	E50FG6H	Transito	1	2026-05-20 22:41:49.449865
48	13	Ácido Fosfórico	25.36	Zulia	2026-05-06T16:13	TRIP-26048	Daniel Eduardo Morales	L23MN3O	Despachado	1	2026-05-20 22:41:49.450667
49	14	Otros	14.79	Amazonas	2026-05-02T10:20	TRIP-26049	Jesús Alberto Hernández	L23MN3O	Entregado	1	2026-05-20 22:41:49.451464
50	15	Ácido Fosfórico	45.6	Anzoátegui	2026-05-01T08:55	TRIP-26050	Manuel Vicente Díaz	I90JK0L	Transito	1	2026-05-20 22:41:49.452229
51	21	Sulfato de Sodio	7.46	Miranda	2026-04-30 00:53:57	ORD-2026-99636-1	Chofer 1	ABC-922	En Tránsito	1	2026-05-21 00:53:57.532668
52	51	Carbonato de Sodio	9.73	Zulia	2025-11-27 00:53:57	ORD-2026-74308-2	Chofer 2	ABC-647	En Tránsito	1	2026-05-21 00:53:57.540338
53	4	Sulfato de Sodio	16.64	Lara	2026-03-03 00:53:57	ORD-2026-61090-3	Chofer 3	ABC-213	Despachado	1	2026-05-21 00:53:57.541775
54	55	Tripolifosfato	28.96	Zulia	2026-01-06 00:53:57	ORD-2026-58007-4	Chofer 4	ABC-315	Entregado	1	2026-05-21 00:53:57.542876
55	51	Otros	16.74	Lara	2026-03-17 00:53:57	ORD-2026-78653-5	Chofer 5	ABC-461	En Tránsito	1	2026-05-21 00:53:57.545652
56	7	Ácido Fosfórico	21.35	Lara	2026-01-02 00:53:57	ORD-2026-92575-6	Chofer 6	ABC-691	Despachado	1	2026-05-21 00:53:57.547011
57	24	Hidróxido de Sodio	34.89	Zulia	2026-01-27 00:53:57	ORD-2026-33183-7	Chofer 7	ABC-273	Despachado	1	2026-05-21 00:53:57.54872
58	53	Pirofosfato	28.23	Carabobo	2026-02-08 00:53:57	ORD-2026-29880-8	Chofer 8	ABC-169	Entregado	1	2026-05-21 00:53:57.54968
59	32	Hidróxido de Sodio	6.24	Carabobo	2026-03-26 00:53:57	ORD-2026-40234-9	Chofer 9	ABC-146	Despachado	1	2026-05-21 00:53:57.5506
60	18	Pirofosfato	33.39	Zulia	2025-12-15 00:53:57	ORD-2026-85959-10	Chofer 10	ABC-291	En Tránsito	1	2026-05-21 00:53:57.551612
61	28	Ácido Sulfúrico	33.72	Aragua	2026-04-11 00:53:57	ORD-2026-93000-11	Chofer 11	ABC-220	Entregado	1	2026-05-21 00:53:57.552507
62	32	Ácido Fosfórico	12.33	Lara	2026-01-13 00:53:57	ORD-2026-40181-12	Chofer 12	ABC-879	Entregado	1	2026-05-21 00:53:57.553355
63	5	Tripolifosfato	14.33	Aragua	2026-05-04 00:53:57	ORD-2026-79800-13	Chofer 13	ABC-746	Entregado	1	2026-05-21 00:53:57.554176
64	4	Carbonato de Sodio	18.2	Zulia	2026-04-09 00:53:57	ORD-2026-31853-14	Chofer 14	ABC-318	En Tránsito	1	2026-05-21 00:53:57.554886
65	7	Ácido Fosfórico	5.61	Lara	2026-01-22 00:53:57	ORD-2026-76375-15	Chofer 15	ABC-959	Despachado	1	2026-05-21 00:53:57.555706
66	48	Bicarbonato de Sodio	17.65	Lara	2026-04-03 00:53:57	ORD-2026-85559-16	Chofer 16	ABC-912	Entregado	1	2026-05-21 00:53:57.556788
67	41	Cloruro de Sodio	14.12	Lara	2026-04-16 00:53:57	ORD-2026-64319-17	Chofer 17	ABC-757	Entregado	1	2026-05-21 00:53:57.557836
68	12	Sulfato de Sodio	28.58	Lara	2026-03-08 00:53:57	ORD-2026-31199-18	Chofer 18	ABC-295	En Tránsito	1	2026-05-21 00:53:57.558861
69	5	Cloruro de Sodio	25.75	Aragua	2026-05-13 00:53:57	ORD-2026-33498-19	Chofer 19	ABC-489	Entregado	1	2026-05-21 00:53:57.560014
70	18	Cloruro de Sodio	33.32	Zulia	2026-02-10 00:53:57	ORD-2026-47209-20	Chofer 20	ABC-189	Entregado	1	2026-05-21 00:53:57.561111
71	54	Cloruro de Sodio	13.06	Aragua	2026-03-27 00:53:57	ORD-2026-69654-21	Chofer 21	ABC-933	En Tránsito	1	2026-05-21 00:53:57.562268
72	26	Silicato de Sodio	17.73	Distrito Capital	2026-03-27 00:53:57	ORD-2026-50513-22	Chofer 22	ABC-884	En Tránsito	1	2026-05-21 00:53:57.563123
73	54	Silicato de Sodio	20.15	Aragua	2026-03-14 00:53:57	ORD-2026-38375-23	Chofer 23	ABC-676	Entregado	1	2026-05-21 00:53:57.564116
74	37	Pirofosfato	23.38	Aragua	2026-02-05 00:53:57	ORD-2026-20850-24	Chofer 24	ABC-149	En Tránsito	1	2026-05-21 00:53:57.565087
75	23	Carbonato de Sodio	18.14	Lara	2026-02-15 00:53:57	ORD-2026-89724-25	Chofer 25	ABC-349	Despachado	1	2026-05-21 00:53:57.565918
76	11	Ácido Fosfórico	19.23	Lara	2026-05-16 00:53:57	ORD-2026-20486-26	Chofer 26	ABC-541	Despachado	1	2026-05-21 00:53:57.566638
77	50	Pirofosfato	23.89	Distrito Capital	2025-12-16 00:53:57	ORD-2026-46414-27	Chofer 27	ABC-621	Despachado	1	2026-05-21 00:53:57.567284
78	24	Sulfato de Sodio	16.72	Carabobo	2025-12-02 00:53:57	ORD-2026-31844-28	Chofer 28	ABC-953	Despachado	1	2026-05-21 00:53:57.567971
79	26	Otros	20.84	Zulia	2026-02-15 00:53:57	ORD-2026-47637-29	Chofer 29	ABC-979	Despachado	1	2026-05-21 00:53:57.568673
80	16	Bicarbonato de Sodio	7.02	Distrito Capital	2025-12-27 00:53:57	ORD-2026-68730-30	Chofer 30	ABC-546	En Tránsito	1	2026-05-21 00:53:57.569395
81	51	Hidróxido de Sodio	33.85	Distrito Capital	2026-04-01 00:53:57	ORD-2026-41271-31	Chofer 31	ABC-516	Despachado	1	2026-05-21 00:53:57.570101
82	54	Ácido Sulfúrico	16.56	Aragua	2026-01-30 00:53:57	ORD-2026-20292-32	Chofer 32	ABC-197	Entregado	1	2026-05-21 00:53:57.570848
83	51	Sulfato de Sodio	31.22	Miranda	2026-03-28 00:53:57	ORD-2026-33470-33	Chofer 33	ABC-350	Despachado	1	2026-05-21 00:53:57.571566
84	37	Ácido Fosfórico	20.97	Zulia	2026-05-16 00:53:57	ORD-2026-80569-34	Chofer 34	ABC-433	Entregado	1	2026-05-21 00:53:57.572454
85	15	Cloruro de Sodio	20.85	Miranda	2026-03-07 00:53:57	ORD-2026-95333-35	Chofer 35	ABC-875	Entregado	1	2026-05-21 00:53:57.573711
86	29	Pirofosfato	17.17	Carabobo	2026-03-31 00:53:57	ORD-2026-26302-36	Chofer 36	ABC-149	Entregado	1	2026-05-21 00:53:57.574727
87	26	Cloruro de Sodio	8.92	Aragua	2026-03-23 00:53:57	ORD-2026-65242-37	Chofer 37	ABC-496	Entregado	1	2026-05-21 00:53:57.576157
88	22	Bicarbonato de Sodio	18.63	Carabobo	2026-04-02 00:53:57	ORD-2026-64283-38	Chofer 38	ABC-996	En Tránsito	1	2026-05-21 00:53:57.577459
89	33	Sulfato de Sodio	12.24	Zulia	2025-12-17 00:53:57	ORD-2026-34206-39	Chofer 39	ABC-465	Despachado	1	2026-05-21 00:53:57.578249
90	49	Ácido Sulfúrico	22.77	Distrito Capital	2026-04-04 00:53:57	ORD-2026-15625-40	Chofer 40	ABC-860	Despachado	1	2026-05-21 00:53:57.578918
91	42	Cloruro de Sodio	20.41	Miranda	2026-05-10 00:53:57	ORD-2026-52562-41	Chofer 41	ABC-202	Despachado	1	2026-05-21 00:53:57.579606
92	46	Cloruro de Sodio	11.65	Lara	2026-01-11 00:53:57	ORD-2026-47046-42	Chofer 42	ABC-458	En Tránsito	1	2026-05-21 00:53:57.580248
93	13	Bicarbonato de Sodio	13.3	Carabobo	2026-05-06 00:53:57	ORD-2026-19044-43	Chofer 43	ABC-133	Despachado	1	2026-05-21 00:53:57.58095
94	4	Sulfato de Sodio	9.26	Zulia	2026-05-01 00:53:57	ORD-2026-99634-44	Chofer 44	ABC-514	Entregado	1	2026-05-21 00:53:57.581836
95	10	Otros	5.95	Distrito Capital	2025-12-17 00:53:57	ORD-2026-27315-45	Chofer 45	ABC-519	Despachado	1	2026-05-21 00:53:57.582594
96	45	Cloruro de Sodio	19.49	Zulia	2026-01-06 00:53:57	ORD-2026-83971-46	Chofer 46	ABC-393	Entregado	1	2026-05-21 00:53:57.583356
97	47	Pirofosfato	15.96	Distrito Capital	2026-01-10 00:53:57	ORD-2026-33388-47	Chofer 47	ABC-143	Entregado	1	2026-05-21 00:53:57.583992
98	2	Bicarbonato de Sodio	30.96	Zulia	2026-04-26 00:53:57	ORD-2026-22683-48	Chofer 48	ABC-877	En Tránsito	1	2026-05-21 00:53:57.584678
99	38	Silicato de Sodio	20.92	Zulia	2026-04-23 00:53:57	ORD-2026-77975-49	Chofer 49	ABC-944	Despachado	1	2026-05-21 00:53:57.585307
100	32	Carbonato de Sodio	29.97	Carabobo	2026-05-04 00:53:57	ORD-2026-23736-50	Chofer 50	ABC-139	Entregado	1	2026-05-21 00:53:57.585931
\.


--
-- Data for Name: positions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.positions (id, name, department_id, description, createdat) FROM stdin;
1	Jefe de Sistemas	1	Líder de TI y Administrador del Sistema	2026-05-20 22:35:14.405134
\.


--
-- Data for Name: product_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_types (id, name, description, status, createdat) FROM stdin;
1	Tripolifosfato	Fosfatos de sodio para la industria de detergentes y alimentos	Activo	2026-05-20 22:35:14.570504
2	Ácido Fosfórico	Ácidos concentrados de uso técnico y alimenticio	Activo	2026-05-20 22:35:14.57233
3	Pirofosfato	Sales de pirofosfato tetrasódico para emulsionantes y estabilizantes	Activo	2026-05-20 22:35:14.573479
4	Otros	Otros productos y subproductos industriales	Activo	2026-05-20 22:35:14.574205
5	Sulfato de Sodio	Uso industrial y detergentes	Activo	2026-05-21 00:53:57.456936
6	Carbonato de Sodio	Ceniza de sosa para vidrio y detergentes	Activo	2026-05-21 00:53:57.488985
7	Bicarbonato de Sodio	Uso alimentario e industrial	Activo	2026-05-21 00:53:57.490472
8	Cloruro de Sodio	Sal industrial	Activo	2026-05-21 00:53:57.491646
9	Ácido Sulfúrico	Reactivo químico industrial	Activo	2026-05-21 00:53:57.493586
10	Hidróxido de Sodio	Soda cáustica	Activo	2026-05-21 00:53:57.494456
11	Silicato de Sodio	Fabricación de detergentes	Activo	2026-05-21 00:53:57.495147
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, username, password, system_role, status, position_id, department_id, createdat) FROM stdin;
1	Admin TripoliERP	admin@tripolierp.com	admin	$2b$10$.5javZJhelH0H5zlwpYWiuBln/0UO1LEC/V3z.BuwWRlksBJgYZeO	Administrador	Activo	1	1	2026-05-20 22:35:14.552746
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 4, true);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clients_id_seq', 55, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 1, true);


--
-- Name: dispatches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dispatches_id_seq', 100, true);


--
-- Name: positions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.positions_id_seq', 1, true);


--
-- Name: product_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_types_id_seq', 11, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: clients clients_rif_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_rif_key UNIQUE (rif);


--
-- Name: departments departments_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_name_key UNIQUE (name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: dispatches dispatches_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatches
    ADD CONSTRAINT dispatches_order_number_key UNIQUE (order_number);


--
-- Name: dispatches dispatches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatches
    ADD CONSTRAINT dispatches_pkey PRIMARY KEY (id);


--
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);


--
-- Name: product_types product_types_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_types
    ADD CONSTRAINT product_types_name_key UNIQUE (name);


--
-- Name: product_types product_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_types
    ADD CONSTRAINT product_types_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (createdat);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_dispatches_client_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dispatches_client_id ON public.dispatches USING btree (client_id);


--
-- Name: idx_dispatches_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dispatches_created_by ON public.dispatches USING btree (created_by);


--
-- Name: idx_dispatches_dispatch_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dispatches_dispatch_date ON public.dispatches USING btree (dispatch_datetime);


--
-- Name: idx_dispatches_product_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dispatches_product_type ON public.dispatches USING btree (product_type);


--
-- Name: idx_positions_department_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_positions_department_id ON public.positions USING btree (department_id);


--
-- Name: idx_users_department_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_department_id ON public.users USING btree (department_id);


--
-- Name: idx_users_position_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_position_id ON public.users USING btree (position_id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: dispatches dispatches_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatches
    ADD CONSTRAINT dispatches_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: dispatches dispatches_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatches
    ADD CONSTRAINT dispatches_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: positions positions_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: users users_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(id);


--
-- PostgreSQL database dump complete
--

\unrestrict gpFlWDYpeF1cDYQeblCfcv6FDSLM4Z9FgjsiQksnGJnMcf3MkXftzhcobh7JubC

