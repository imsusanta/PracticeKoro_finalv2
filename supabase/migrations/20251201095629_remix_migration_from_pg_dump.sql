CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'student'
);


--
-- Name: approval_status_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.approval_status_type AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: test_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.test_type AS ENUM (
    'full_mock',
    'topic_wise'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Create student role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  -- Create approval status entry
  INSERT INTO public.approval_status (user_id, status)
  VALUES (NEW.id, 'pending');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: approval_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_status (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status public.approval_status_type DEFAULT 'pending'::public.approval_status_type NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: exams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    created_by uuid NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: mock_tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mock_tests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    exam_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    test_type public.test_type NOT NULL,
    duration_minutes integer NOT NULL,
    passing_marks integer NOT NULL,
    total_marks integer NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    shuffle_questions boolean DEFAULT false,
    shuffle_options boolean DEFAULT false,
    allow_retake boolean DEFAULT true,
    retake_limit integer DEFAULT 0
);


--
-- Name: pdfs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pdfs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    exam_id uuid NOT NULL,
    title text NOT NULL,
    file_path text NOT NULL,
    file_size bigint,
    uploaded_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    exam_id uuid NOT NULL,
    question_text text NOT NULL,
    option_a text NOT NULL,
    option_b text NOT NULL,
    option_c text NOT NULL,
    option_d text NOT NULL,
    correct_answer text NOT NULL,
    subject text,
    topic text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    explanation text,
    CONSTRAINT questions_correct_answer_check CHECK ((correct_answer = ANY (ARRAY['A'::text, 'B'::text, 'C'::text, 'D'::text])))
);


--
-- Name: test_answer_drafts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_answer_drafts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    test_id uuid NOT NULL,
    user_id uuid NOT NULL,
    question_id uuid NOT NULL,
    selected_answer text,
    marked_for_review boolean DEFAULT false,
    last_saved_at timestamp with time zone DEFAULT now()
);


--
-- Name: test_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_answers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    attempt_id uuid NOT NULL,
    question_id uuid NOT NULL,
    selected_answer text,
    is_correct boolean NOT NULL,
    marks_obtained integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT test_answers_selected_answer_check CHECK ((selected_answer = ANY (ARRAY['A'::text, 'B'::text, 'C'::text, 'D'::text])))
);


--
-- Name: test_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    test_id uuid NOT NULL,
    user_id uuid NOT NULL,
    score integer NOT NULL,
    total_marks integer NOT NULL,
    percentage numeric(5,2) NOT NULL,
    passed boolean NOT NULL,
    started_at timestamp with time zone NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT false,
    time_taken_seconds integer,
    unanswered_count integer DEFAULT 0,
    correct_count integer DEFAULT 0,
    wrong_count integer DEFAULT 0
);


--
-- Name: test_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    test_id uuid NOT NULL,
    question_id uuid NOT NULL,
    question_order integer NOT NULL,
    marks integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: test_timers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_timers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    test_id uuid NOT NULL,
    user_id uuid NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    duration_minutes integer NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: approval_status approval_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_status
    ADD CONSTRAINT approval_status_pkey PRIMARY KEY (id);


--
-- Name: approval_status approval_status_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_status
    ADD CONSTRAINT approval_status_user_id_key UNIQUE (user_id);


--
-- Name: exams exams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_pkey PRIMARY KEY (id);


--
-- Name: mock_tests mock_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mock_tests
    ADD CONSTRAINT mock_tests_pkey PRIMARY KEY (id);


--
-- Name: pdfs pdfs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdfs
    ADD CONSTRAINT pdfs_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: test_answer_drafts test_answer_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_answer_drafts
    ADD CONSTRAINT test_answer_drafts_pkey PRIMARY KEY (id);


--
-- Name: test_answer_drafts test_answer_drafts_test_id_user_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_answer_drafts
    ADD CONSTRAINT test_answer_drafts_test_id_user_id_question_id_key UNIQUE (test_id, user_id, question_id);


--
-- Name: test_answers test_answers_attempt_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_answers
    ADD CONSTRAINT test_answers_attempt_id_question_id_key UNIQUE (attempt_id, question_id);


--
-- Name: test_answers test_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_answers
    ADD CONSTRAINT test_answers_pkey PRIMARY KEY (id);


--
-- Name: test_attempts test_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_attempts
    ADD CONSTRAINT test_attempts_pkey PRIMARY KEY (id);


--
-- Name: test_questions test_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT test_questions_pkey PRIMARY KEY (id);


--
-- Name: test_questions test_questions_test_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT test_questions_test_id_question_id_key UNIQUE (test_id, question_id);


--
-- Name: test_timers test_timers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_timers
    ADD CONSTRAINT test_timers_pkey PRIMARY KEY (id);


--
-- Name: test_timers test_timers_test_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_timers
    ADD CONSTRAINT test_timers_test_id_user_id_key UNIQUE (test_id, user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: approval_status update_approval_status_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_approval_status_updated_at BEFORE UPDATE ON public.approval_status FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: exams update_exams_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: mock_tests update_mock_tests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_mock_tests_updated_at BEFORE UPDATE ON public.mock_tests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: questions update_questions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: approval_status approval_status_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_status
    ADD CONSTRAINT approval_status_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: approval_status approval_status_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_status
    ADD CONSTRAINT approval_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: exams exams_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: approval_status fk_approval_status_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_status
    ADD CONSTRAINT fk_approval_status_user_id FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_roles fk_user_roles_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: mock_tests mock_tests_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mock_tests
    ADD CONSTRAINT mock_tests_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: mock_tests mock_tests_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mock_tests
    ADD CONSTRAINT mock_tests_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- Name: pdfs pdfs_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdfs
    ADD CONSTRAINT pdfs_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- Name: pdfs pdfs_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdfs
    ADD CONSTRAINT pdfs_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: questions questions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: questions questions_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- Name: test_answer_drafts test_answer_drafts_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_answer_drafts
    ADD CONSTRAINT test_answer_drafts_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: test_answer_drafts test_answer_drafts_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_answer_drafts
    ADD CONSTRAINT test_answer_drafts_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.mock_tests(id) ON DELETE CASCADE;


--
-- Name: test_answer_drafts test_answer_drafts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_answer_drafts
    ADD CONSTRAINT test_answer_drafts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: test_answers test_answers_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_answers
    ADD CONSTRAINT test_answers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.test_attempts(id) ON DELETE CASCADE;


--
-- Name: test_answers test_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_answers
    ADD CONSTRAINT test_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: test_attempts test_attempts_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_attempts
    ADD CONSTRAINT test_attempts_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.mock_tests(id) ON DELETE CASCADE;


--
-- Name: test_attempts test_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_attempts
    ADD CONSTRAINT test_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: test_questions test_questions_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT test_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: test_questions test_questions_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT test_questions_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.mock_tests(id) ON DELETE CASCADE;


--
-- Name: test_timers test_timers_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_timers
    ADD CONSTRAINT test_timers_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.mock_tests(id) ON DELETE CASCADE;


--
-- Name: test_timers test_timers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_timers
    ADD CONSTRAINT test_timers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: pdfs Admins can delete PDFs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete PDFs" ON public.pdfs FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: exams Admins can delete exams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete exams" ON public.exams FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: questions Admins can delete questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete questions" ON public.questions FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: test_questions Admins can delete test questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete test questions" ON public.test_questions FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: mock_tests Admins can delete tests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete tests" ON public.mock_tests FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: pdfs Admins can insert PDFs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert PDFs" ON public.pdfs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: exams Admins can insert exams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert exams" ON public.exams FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: questions Admins can insert questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert questions" ON public.questions FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: test_questions Admins can insert test questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert test questions" ON public.test_questions FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: mock_tests Admins can insert tests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert tests" ON public.mock_tests FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: approval_status Admins can update approval statuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update approval statuses" ON public.approval_status FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: exams Admins can update exams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update exams" ON public.exams FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: questions Admins can update questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update questions" ON public.questions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: mock_tests Admins can update tests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update tests" ON public.mock_tests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: test_answer_drafts Admins can view all answer drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all answer drafts" ON public.test_answer_drafts FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: test_answers Admins can view all answers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all answers" ON public.test_answers FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: approval_status Admins can view all approval statuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all approval statuses" ON public.approval_status FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: test_attempts Admins can view all attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all attempts" ON public.test_attempts FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: questions Admins can view all questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all questions" ON public.questions FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: test_timers Admins can view all test timers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all test timers" ON public.test_timers FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: mock_tests Admins can view all tests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all tests" ON public.mock_tests FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: test_attempts Approved students can insert their own attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Approved students can insert their own attempts" ON public.test_attempts FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.approval_status
  WHERE ((approval_status.user_id = auth.uid()) AND (approval_status.status = 'approved'::public.approval_status_type))))));


--
-- Name: pdfs Approved students can view PDFs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Approved students can view PDFs" ON public.pdfs FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (public.has_role(auth.uid(), 'student'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.approval_status
  WHERE ((approval_status.user_id = auth.uid()) AND (approval_status.status = 'approved'::public.approval_status_type)))))));


--
-- Name: exams Approved students can view active exams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Approved students can view active exams" ON public.exams FOR SELECT USING (((is_active = true) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR (public.has_role(auth.uid(), 'student'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.approval_status
  WHERE ((approval_status.user_id = auth.uid()) AND (approval_status.status = 'approved'::public.approval_status_type))))))));


--
-- Name: mock_tests Approved students can view published tests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Approved students can view published tests" ON public.mock_tests FOR SELECT USING (((is_published = true) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR (public.has_role(auth.uid(), 'student'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.approval_status
  WHERE ((approval_status.user_id = auth.uid()) AND (approval_status.status = 'approved'::public.approval_status_type))))))));


--
-- Name: test_questions Approved students can view test questions for published tests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Approved students can view test questions for published tests" ON public.test_questions FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.mock_tests
  WHERE ((mock_tests.id = test_questions.test_id) AND (mock_tests.is_published = true)))) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR (public.has_role(auth.uid(), 'student'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.approval_status
  WHERE ((approval_status.user_id = auth.uid()) AND (approval_status.status = 'approved'::public.approval_status_type))))))));


--
-- Name: test_answer_drafts Students can delete their own answer drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can delete their own answer drafts" ON public.test_answer_drafts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: test_timers Students can delete their own test timers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can delete their own test timers" ON public.test_timers FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: test_answer_drafts Students can insert their own answer drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can insert their own answer drafts" ON public.test_answer_drafts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: test_answers Students can insert their own answers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can insert their own answers" ON public.test_answers FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.test_attempts
  WHERE ((test_attempts.id = test_answers.attempt_id) AND (test_attempts.user_id = auth.uid())))));


--
-- Name: test_timers Students can insert their own test timers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can insert their own test timers" ON public.test_timers FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: test_answer_drafts Students can update their own answer drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can update their own answer drafts" ON public.test_answer_drafts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: test_answer_drafts Students can view their own answer drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own answer drafts" ON public.test_answer_drafts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: test_answers Students can view their own answers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own answers" ON public.test_answers FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.test_attempts
  WHERE ((test_attempts.id = test_answers.attempt_id) AND (test_attempts.user_id = auth.uid())))));


--
-- Name: approval_status Students can view their own approval status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own approval status" ON public.approval_status FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: test_attempts Students can view their own attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own attempts" ON public.test_attempts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: test_timers Students can view their own test timers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own test timers" ON public.test_timers FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: approval_status; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.approval_status ENABLE ROW LEVEL SECURITY;

--
-- Name: exams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

--
-- Name: mock_tests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;

--
-- Name: pdfs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pdfs ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

--
-- Name: test_answer_drafts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_answer_drafts ENABLE ROW LEVEL SECURITY;

--
-- Name: test_answers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;

--
-- Name: test_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: test_questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;

--
-- Name: test_timers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_timers ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


