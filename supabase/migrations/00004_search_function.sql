-- Full-text search across cases, subjects, and creators
CREATE OR REPLACE FUNCTION search_cases(
  p_query text,
  p_limit int DEFAULT 12
)
RETURNS TABLE (
  case_id        uuid,
  case_number    text,
  title          text,
  status         suspicion_status,
  priority       case_priority,
  match_type     text,
  match_value    text,
  creator_name   text,
  created_at     timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id uuid;
  v_query  text := '%' || lower(p_query) || '%';
BEGIN
  SELECT organisation_id INTO v_org_id
  FROM public.profiles WHERE id = auth.uid();

  IF v_org_id IS NULL OR length(trim(p_query)) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
    -- Case number or title
    SELECT DISTINCT ON (c.id)
      c.id, c.case_number, c.title, c.status, c.priority,
      CASE WHEN lower(c.case_number) LIKE v_query THEN 'case_number' ELSE 'title' END,
      CASE WHEN lower(c.case_number) LIKE v_query THEN c.case_number ELSE c.title END,
      p.full_name, c.created_at
    FROM public.cases c
    JOIN public.profiles p ON c.created_by = p.id
    WHERE c.organisation_id = v_org_id
      AND (lower(c.case_number) LIKE v_query OR lower(c.title) LIKE v_query)

    UNION ALL

    -- Creator name
    SELECT DISTINCT ON (c.id)
      c.id, c.case_number, c.title, c.status, c.priority,
      'creator', p.full_name, p.full_name, c.created_at
    FROM public.cases c
    JOIN public.profiles p ON c.created_by = p.id
    WHERE c.organisation_id = v_org_id
      AND lower(p.full_name) LIKE v_query

    UNION ALL

    -- Subject details in questionnaire responses (name, DOB, ID, address)
    SELECT DISTINCT ON (c.id)
      c.id, c.case_number, c.title, c.status, c.priority,
      CASE
        WHEN lower(coalesce(qr.responses->>'first_names','') || ' ' || coalesce(qr.responses->>'last_name','')) LIKE v_query
          OR lower(coalesce(qr.responses->>'first_names','')) LIKE v_query
          OR lower(coalesce(qr.responses->>'last_name',''))   LIKE v_query
        THEN 'subject_name'
        WHEN lower(coalesce(qr.responses->>'date_of_birth','')) LIKE v_query THEN 'date_of_birth'
        WHEN lower(coalesce(qr.responses->>'id_number',''))     LIKE v_query THEN 'id_number'
        ELSE 'address'
      END,
      CASE
        WHEN lower(coalesce(qr.responses->>'first_names','') || ' ' || coalesce(qr.responses->>'last_name','')) LIKE v_query
          OR lower(coalesce(qr.responses->>'first_names','')) LIKE v_query
          OR lower(coalesce(qr.responses->>'last_name',''))   LIKE v_query
        THEN trim(coalesce(qr.responses->>'first_names','') || ' ' || coalesce(qr.responses->>'last_name',''))
        WHEN lower(coalesce(qr.responses->>'date_of_birth','')) LIKE v_query
        THEN qr.responses->>'date_of_birth'
        WHEN lower(coalesce(qr.responses->>'id_number','')) LIKE v_query
        THEN qr.responses->>'id_number'
        ELSE coalesce(qr.responses->>'address', '') || ' ' || coalesce(qr.responses->>'city', '')
      END,
      p.full_name, c.created_at
    FROM public.questionnaire_responses qr
    JOIN public.cases c ON qr.case_id = c.id
    JOIN public.profiles p ON c.created_by = p.id
    WHERE c.organisation_id = v_org_id
      AND (
        lower(coalesce(qr.responses->>'first_names',''))  LIKE v_query
        OR lower(coalesce(qr.responses->>'last_name','')) LIKE v_query
        OR lower(coalesce(qr.responses->>'date_of_birth','')) LIKE v_query
        OR lower(coalesce(qr.responses->>'id_number',''))     LIKE v_query
        OR lower(coalesce(qr.responses->>'address',''))       LIKE v_query
        OR lower(coalesce(qr.responses->>'city',''))          LIKE v_query
      )

  LIMIT p_limit;
END;
$$;
