-- Rinse Report — Initial Database Schema
-- Multi-tenant AML/CFT compliance filing platform
-- Aligned with PRD v1.1 and goAML XML Schema v5.0.2

-- Required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================
-- 1. CUSTOM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('owner', 'admin', 'analyst', 'viewer');

CREATE TYPE report_type AS ENUM ('STR', 'SAR', 'LCT', 'IFT');

CREATE TYPE suspicion_status AS ENUM (
  'raised', 'investigating', 'to_file', 'filed', 'resolved'
);

CREATE TYPE case_priority AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE subscription_status AS ENUM (
  'trialing', 'active', 'past_due', 'cancelled'
);

CREATE TYPE report_status AS ENUM (
  'draft', 'validated', 'submitted', 'accepted', 'rejected'
);

CREATE TYPE questionnaire_status AS ENUM ('draft', 'complete', 'submitted');

CREATE TYPE suspicion_source AS ENUM (
  'internal_monitoring', 'staff_report', 'customer_due_diligence',
  'third_party_tip', 'law_enforcement', 'other'
);

CREATE TYPE industry_type AS ENUM (
  'law_firm', 'accountant', 'real_estate', 'tcsp',
  'money_remitter', 'currency_exchanger', 'non_bank_deposit_taker',
  'lender', 'payment_service_provider', 'wealth_provider',
  'casino', 'other'
);

CREATE TYPE party_role AS ENUM (
  'my_client', 'counterparty', 'conductor', 'signatory',
  'director', 'beneficiary'
);

CREATE TYPE gender AS ENUM ('M', 'F', 'U');

CREATE TYPE id_type AS ENUM (
  'drivers_licence', 'passport', 'national_id',
  'birth_certificate', 'other'
);

CREATE TYPE address_type AS ENUM (
  'residential', 'business', 'registered', 'mailing'
);

CREATE TYPE phone_type AS ENUM ('mobile', 'landline', 'fax');

CREATE TYPE legal_form AS ENUM (
  'limited', 'partnership', 'sole_trader', 'trust', 'other'
);

CREATE TYPE account_status AS ENUM ('active', 'closed', 'dormant', 'frozen');

CREATE TYPE institution_code_type AS ENUM ('swift', 'nz_bank_prefix');

CREATE TYPE transaction_direction AS ENUM ('from', 'to');

CREATE TYPE transaction_party_type AS ENUM ('person', 'entity', 'account');

CREATE TYPE audit_action AS ENUM (
  'case_created', 'case_updated', 'status_changed',
  'report_generated', 'report_submitted', 'questionnaire_saved',
  'attachment_uploaded', 'user_invited', 'user_deactivated',
  'data_exported', 'login_success', 'login_failed',
  'mfa_enrolled', 'settings_changed'
);

CREATE TYPE audit_resource AS ENUM (
  'case', 'report', 'questionnaire', 'attachment',
  'user', 'organisation', 'reporting_entity'
);

CREATE TYPE notification_type AS ENUM (
  'sla_warning', 'sla_breach', 'case_assigned',
  'report_ready', 'comment_added', 'new_suspicion',
  'status_update', 'report_filed'
);

-- ============================================================
-- 2. TENANT & AUTH TABLES
-- ============================================================

CREATE TABLE organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address_line_1 text,
  address_city text,
  address_region text,
  address_postcode text,
  address_country text DEFAULT 'NZ',
  stripe_customer_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reporting_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name text NOT NULL,
  industry industry_type NOT NULL DEFAULT 'other',
  rentity_id text NOT NULL,
  rentity_branch text,
  compliance_officer_name text NOT NULL,
  compliance_officer_email text,
  local_currency text NOT NULL DEFAULT 'NZD',
  data_retention_years int NOT NULL DEFAULT 7 CHECK (data_retention_years IN (5, 7)),
  holiday_region text DEFAULT 'Auckland',
  stripe_subscription_id text UNIQUE,
  subscription_status subscription_status NOT NULL DEFAULT 'trialing',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, rentity_id)
);

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES organisations(id),
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'analyst',
  is_active boolean NOT NULL DEFAULT true,
  last_sign_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role user_role NOT NULL DEFAULT 'analyst',
  invited_by uuid NOT NULL REFERENCES profiles(id),
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '72 hours',
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. CASES & SUSPICIONS
-- ============================================================

CREATE TABLE cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id),
  reporting_entity_id uuid NOT NULL REFERENCES reporting_entities(id),
  case_number text NOT NULL,
  title text NOT NULL,
  status suspicion_status NOT NULL DEFAULT 'raised',
  assigned_to uuid REFERENCES profiles(id),
  priority case_priority NOT NULL DEFAULT 'medium',
  suspicion_formed_at timestamptz NOT NULL DEFAULT now(),
  sla_deadline timestamptz NOT NULL,
  filed_at timestamptz,
  filed_by uuid REFERENCES profiles(id),
  resolved_at timestamptz,
  resolution_notes text,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, case_number)
);

CREATE TABLE suspicions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES organisations(id),
  description text NOT NULL,
  source suspicion_source,
  raised_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. QUESTIONNAIRE ENGINE
-- ============================================================

CREATE TABLE report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  reporting_entity_id uuid REFERENCES reporting_entities(id) ON DELETE CASCADE,
  name text NOT NULL,
  report_type report_type NOT NULL,
  description text,
  industry_types industry_type[],
  version int NOT NULL DEFAULT 1,
  is_platform boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  template_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN report_templates.is_platform IS
  'Platform templates (true) are read-only for all tenants. Entity templates (false) are scoped to reporting_entity_id.';

CREATE TABLE questionnaire_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES organisations(id),
  template_id uuid REFERENCES report_templates(id),
  report_type report_type NOT NULL,
  current_step int NOT NULL DEFAULT 1,
  total_steps int NOT NULL DEFAULT 1,
  status questionnaire_status NOT NULL DEFAULT 'draft',
  responses jsonb NOT NULL DEFAULT '{}',
  last_saved_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. REPORTS (GENERATED)
-- ============================================================

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES organisations(id),
  questionnaire_response_id uuid NOT NULL REFERENCES questionnaire_responses(id),
  report_type report_type NOT NULL,
  report_code text NOT NULL,
  submission_code text NOT NULL DEFAULT 'E',
  entity_reference text NOT NULL,
  amends_report_id uuid REFERENCES reports(id),
  version int NOT NULL DEFAULT 1,
  status report_status NOT NULL DEFAULT 'draft',
  xml_storage_path text,
  pdf_storage_path text,
  xml_validation_errors jsonb,
  submitted_at timestamptz,
  submitted_by uuid REFERENCES profiles(id),
  goaml_confirmation_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN reports.amends_report_id IS
  'Links amendment reports to the original. Amendments have submission_code = R.';

-- ============================================================
-- 6. goAML ENTITY TABLES
-- ============================================================

CREATE TABLE report_persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES organisations(id),
  role party_role NOT NULL,
  is_my_client boolean NOT NULL DEFAULT false,
  gender gender,
  title text,
  first_name text NOT NULL,
  middle_name text,
  last_name text NOT NULL,
  birthdate date,
  birth_place text,
  mothers_name text,
  nationality text,
  residence text,
  occupation text,
  source_of_wealth text,
  comments text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE person_identifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES report_persons(id) ON DELETE CASCADE,
  type id_type NOT NULL,
  number text NOT NULL,
  issue_country text,
  issue_date date,
  expiry_date date,
  issued_by text,
  comments text
);

CREATE TABLE addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid REFERENCES report_persons(id) ON DELETE CASCADE,
  entity_id uuid,
  address_type address_type,
  address_line text,
  city text,
  state text,
  postcode text,
  country_code text DEFAULT 'NZ',
  comments text,
  CONSTRAINT addresses_owner_check CHECK (
    (person_id IS NOT NULL AND entity_id IS NULL) OR
    (person_id IS NULL AND entity_id IS NOT NULL)
  )
);

CREATE TABLE phones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid REFERENCES report_persons(id) ON DELETE CASCADE,
  entity_id uuid,
  phone_type phone_type,
  country_prefix text,
  number text NOT NULL,
  extension text,
  comments text,
  CONSTRAINT phones_owner_check CHECK (
    (person_id IS NOT NULL AND entity_id IS NULL) OR
    (person_id IS NULL AND entity_id IS NOT NULL)
  )
);

CREATE TABLE report_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES organisations(id),
  role party_role NOT NULL,
  is_my_client boolean NOT NULL DEFAULT false,
  name text NOT NULL,
  commercial_name text,
  incorporation_legal_form legal_form,
  incorporation_number text,
  incorporation_country text,
  incorporation_date date,
  business_type text,
  comments text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add FK for addresses.entity_id and phones.entity_id now that report_entities exists
ALTER TABLE addresses
  ADD CONSTRAINT addresses_entity_fk
  FOREIGN KEY (entity_id) REFERENCES report_entities(id) ON DELETE CASCADE;

ALTER TABLE phones
  ADD CONSTRAINT phones_entity_fk
  FOREIGN KEY (entity_id) REFERENCES report_entities(id) ON DELETE CASCADE;

CREATE TABLE report_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES organisations(id),
  is_my_client boolean NOT NULL DEFAULT false,
  institution_name text NOT NULL,
  institution_code text,
  institution_code_type institution_code_type,
  branch text,
  account_number text NOT NULL,
  account_type text,
  currency_code text DEFAULT 'NZD',
  balance decimal(15,2),
  balance_date date,
  opened_date date,
  closed_date date,
  status account_status,
  comments text,
  person_id uuid REFERENCES report_persons(id) ON DELETE SET NULL,
  entity_id uuid REFERENCES report_entities(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE report_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES organisations(id),
  transaction_number text NOT NULL,
  transaction_location text NOT NULL,
  transaction_description text,
  date_transaction timestamptz NOT NULL,
  transmode_code text NOT NULL,
  transmode_comment text,
  amount_local decimal(15,2) NOT NULL,
  currency_code_local text NOT NULL DEFAULT 'NZD',
  amount_foreign decimal(15,2),
  currency_code_foreign text,
  late_deposit boolean NOT NULL DEFAULT false,
  goods_description text,
  comments text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE transaction_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES report_transactions(id) ON DELETE CASCADE,
  direction transaction_direction NOT NULL,
  party_type transaction_party_type NOT NULL,
  person_id uuid REFERENCES report_persons(id) ON DELETE SET NULL,
  entity_id uuid REFERENCES report_entities(id) ON DELETE SET NULL,
  account_id uuid REFERENCES report_accounts(id) ON DELETE SET NULL
);

CREATE TABLE report_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  indicator_code text NOT NULL,
  description text
);

-- ============================================================
-- 7. ATTACHMENTS
-- ============================================================

CREATE TABLE attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES organisations(id),
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size int NOT NULL,
  storage_path text NOT NULL,
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. AUDIT LOG (IMMUTABLE)
-- ============================================================

CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id),
  user_id uuid REFERENCES profiles(id),
  action audit_action NOT NULL,
  resource_type audit_resource,
  resource_id uuid,
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  type notification_type NOT NULL,
  title text NOT NULL,
  body text,
  resource_type audit_resource,
  resource_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  emailed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. NZ PUBLIC HOLIDAYS (CACHED)
-- ============================================================

CREATE TABLE nz_public_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  name text NOT NULL,
  region text,
  year int NOT NULL,
  UNIQUE (date, region)
);

-- ============================================================
-- 11. INDEXES
-- ============================================================

CREATE INDEX idx_reporting_entities_org ON reporting_entities(organisation_id);
CREATE INDEX idx_profiles_org ON profiles(organisation_id);
CREATE INDEX idx_cases_org ON cases(organisation_id);
CREATE INDEX idx_cases_entity ON cases(reporting_entity_id);
CREATE INDEX idx_cases_status ON cases(organisation_id, status);
CREATE INDEX idx_cases_sla ON cases(sla_deadline) WHERE status NOT IN ('filed', 'resolved');
CREATE INDEX idx_cases_assigned ON cases(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_suspicions_case ON suspicions(case_id);
CREATE INDEX idx_questionnaire_case ON questionnaire_responses(case_id);
CREATE INDEX idx_reports_case ON reports(case_id);
CREATE INDEX idx_reports_org ON reports(organisation_id);
CREATE INDEX idx_report_persons_report ON report_persons(report_id);
CREATE INDEX idx_report_entities_report ON report_entities(report_id);
CREATE INDEX idx_report_accounts_report ON report_accounts(report_id);
CREATE INDEX idx_report_transactions_report ON report_transactions(report_id);
CREATE INDEX idx_transaction_parties_txn ON transaction_parties(transaction_id);
CREATE INDEX idx_report_indicators_report ON report_indicators(report_id);
CREATE INDEX idx_attachments_case ON attachments(case_id);
CREATE INDEX idx_audit_log_org ON audit_log(organisation_id);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_created ON audit_log(organisation_id, created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_holidays_year ON nz_public_holidays(year, region);

-- ============================================================
-- 12. ROW-LEVEL SECURITY
-- ============================================================

-- Helper: get the current user's organisation_id
CREATE OR REPLACE FUNCTION public.get_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organisation_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Helper: get the current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- organisations
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own org"
  ON organisations FOR SELECT
  USING (id = public.get_org_id());

CREATE POLICY "Owner/admin update org"
  ON organisations FOR UPDATE
  USING (id = public.get_org_id() AND public.get_user_role() IN ('owner', 'admin'));

-- reporting_entities
ALTER TABLE reporting_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own org entities"
  ON reporting_entities FOR SELECT
  USING (organisation_id = public.get_org_id());

CREATE POLICY "Owner/admin manage entities"
  ON reporting_entities FOR ALL
  USING (organisation_id = public.get_org_id() AND public.get_user_role() IN ('owner', 'admin'));

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see org members"
  ON profiles FOR SELECT
  USING (organisation_id = public.get_org_id());

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Owner/admin manage profiles"
  ON profiles FOR UPDATE
  USING (organisation_id = public.get_org_id() AND public.get_user_role() IN ('owner', 'admin'));

-- invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner/admin manage invitations"
  ON invitations FOR ALL
  USING (organisation_id = public.get_org_id() AND public.get_user_role() IN ('owner', 'admin'));

-- cases
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members see cases"
  ON cases FOR SELECT
  USING (organisation_id = public.get_org_id());

CREATE POLICY "Non-viewers manage cases"
  ON cases FOR INSERT
  WITH CHECK (organisation_id = public.get_org_id() AND public.get_user_role() != 'viewer');

CREATE POLICY "Non-viewers update cases"
  ON cases FOR UPDATE
  USING (organisation_id = public.get_org_id() AND public.get_user_role() != 'viewer');

CREATE POLICY "Owner/admin delete cases"
  ON cases FOR DELETE
  USING (organisation_id = public.get_org_id() AND public.get_user_role() IN ('owner', 'admin'));

-- suspicions
ALTER TABLE suspicions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members see suspicions"
  ON suspicions FOR SELECT
  USING (organisation_id = public.get_org_id());

CREATE POLICY "Non-viewers create suspicions"
  ON suspicions FOR INSERT
  WITH CHECK (organisation_id = public.get_org_id() AND public.get_user_role() != 'viewer');

-- questionnaire_responses
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members see responses"
  ON questionnaire_responses FOR SELECT
  USING (organisation_id = public.get_org_id());

CREATE POLICY "Non-viewers manage responses"
  ON questionnaire_responses FOR ALL
  USING (organisation_id = public.get_org_id() AND public.get_user_role() != 'viewer');

-- report_templates
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users see platform templates"
  ON report_templates FOR SELECT
  USING (is_platform = true);

CREATE POLICY "Org members see own templates"
  ON report_templates FOR SELECT
  USING (organisation_id = public.get_org_id());

CREATE POLICY "Owner/admin manage templates"
  ON report_templates FOR ALL
  USING (
    is_platform = false
    AND organisation_id = public.get_org_id()
    AND public.get_user_role() IN ('owner', 'admin')
  );

-- reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members see reports"
  ON reports FOR SELECT
  USING (organisation_id = public.get_org_id());

CREATE POLICY "Non-viewers manage reports"
  ON reports FOR ALL
  USING (organisation_id = public.get_org_id() AND public.get_user_role() != 'viewer');

-- goAML entity tables: all scoped via report_id → reports → organisation_id
-- Using a simpler pattern: check organisation_id directly on tables that have it

ALTER TABLE report_persons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation" ON report_persons FOR ALL
  USING (organisation_id = public.get_org_id());

ALTER TABLE report_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation" ON report_entities FOR ALL
  USING (organisation_id = public.get_org_id());

ALTER TABLE report_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation" ON report_accounts FOR ALL
  USING (organisation_id = public.get_org_id());

ALTER TABLE report_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation" ON report_transactions FOR ALL
  USING (organisation_id = public.get_org_id());

-- Sub-tables without organisation_id use parent join
ALTER TABLE person_identifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Via person" ON person_identifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM report_persons
      WHERE report_persons.id = person_id
        AND report_persons.organisation_id = public.get_org_id()
    )
  );

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Via person or entity" ON addresses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM report_persons
      WHERE report_persons.id = person_id
        AND report_persons.organisation_id = public.get_org_id()
    )
    OR EXISTS (
      SELECT 1 FROM report_entities
      WHERE report_entities.id = entity_id
        AND report_entities.organisation_id = public.get_org_id()
    )
  );

ALTER TABLE phones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Via person or entity" ON phones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM report_persons
      WHERE report_persons.id = person_id
        AND report_persons.organisation_id = public.get_org_id()
    )
    OR EXISTS (
      SELECT 1 FROM report_entities
      WHERE report_entities.id = entity_id
        AND report_entities.organisation_id = public.get_org_id()
    )
  );

ALTER TABLE transaction_parties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Via transaction" ON transaction_parties FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM report_transactions
      WHERE report_transactions.id = transaction_id
        AND report_transactions.organisation_id = public.get_org_id()
    )
  );

ALTER TABLE report_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Via report" ON report_indicators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reports
      WHERE reports.id = report_id
        AND reports.organisation_id = public.get_org_id()
    )
  );

-- attachments
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members see attachments"
  ON attachments FOR SELECT
  USING (organisation_id = public.get_org_id());

CREATE POLICY "Non-viewers manage attachments"
  ON attachments FOR ALL
  USING (organisation_id = public.get_org_id() AND public.get_user_role() != 'viewer');

-- audit_log (SELECT only — inserts via service role)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner/admin read audit log"
  ON audit_log FOR SELECT
  USING (organisation_id = public.get_org_id() AND public.get_user_role() IN ('owner', 'admin'));

-- notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- nz_public_holidays (public read)
ALTER TABLE nz_public_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated read holidays"
  ON nz_public_holidays FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 13. FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at on modification
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_organisations_updated_at
  BEFORE UPDATE ON organisations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_reporting_entities_updated_at
  BEFORE UPDATE ON reporting_entities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_questionnaire_responses_updated_at
  BEFORE UPDATE ON questionnaire_responses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Generate case number on insert
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  seq int;
BEGIN
  SELECT COUNT(*) + 1 INTO seq
  FROM cases
  WHERE organisation_id = NEW.organisation_id
    AND date_trunc('day', created_at) = date_trunc('day', now());

  NEW.case_number := 'RR-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(seq::text, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_case_number_trigger
  BEFORE INSERT ON cases
  FOR EACH ROW
  WHEN (NEW.case_number IS NULL OR NEW.case_number = '')
  EXECUTE FUNCTION generate_case_number();

-- Create profile on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, organisation_id, full_name, role)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'organisation_id')::uuid,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'analyst')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Record filed_at and filed_by when case moves to 'filed'
CREATE OR REPLACE FUNCTION handle_case_filed()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'filed' AND OLD.status != 'filed' THEN
    NEW.filed_at = now();
  END IF;
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER case_status_timestamps
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION handle_case_filed();

-- ============================================================
-- 14. STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('attachments', 'attachments', false),
  ('reports', 'reports', false),
  ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users access files in their org's folder
CREATE POLICY "Org members access attachments"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = public.get_org_id()::text
  );

CREATE POLICY "Org members access reports"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] = public.get_org_id()::text
  );

CREATE POLICY "Owner/admin access exports"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'exports'
    AND (storage.foldername(name))[1] = public.get_org_id()::text
    AND public.get_user_role() IN ('owner', 'admin')
  );

-- ============================================================
-- 15. ENABLE REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE cases;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
