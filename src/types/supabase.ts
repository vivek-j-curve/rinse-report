export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line: string | null
          address_type: Database["public"]["Enums"]["address_type"] | null
          city: string | null
          comments: string | null
          country_code: string | null
          entity_id: string | null
          id: string
          person_id: string | null
          postcode: string | null
          state: string | null
        }
        Insert: {
          address_line?: string | null
          address_type?: Database["public"]["Enums"]["address_type"] | null
          city?: string | null
          comments?: string | null
          country_code?: string | null
          entity_id?: string | null
          id?: string
          person_id?: string | null
          postcode?: string | null
          state?: string | null
        }
        Update: {
          address_line?: string | null
          address_type?: Database["public"]["Enums"]["address_type"] | null
          city?: string | null
          comments?: string | null
          country_code?: string | null
          entity_id?: string | null
          id?: string
          person_id?: string | null
          postcode?: string | null
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_entity_fk"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "report_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "report_persons"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          case_id: string
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          organisation_id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          case_id: string
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          organisation_id: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          organisation_id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          organisation_id: string
          resource_id: string | null
          resource_type: Database["public"]["Enums"]["audit_resource"] | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          organisation_id: string
          resource_id?: string | null
          resource_type?: Database["public"]["Enums"]["audit_resource"] | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          organisation_id?: string
          resource_id?: string | null
          resource_type?: Database["public"]["Enums"]["audit_resource"] | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          assigned_to: string | null
          case_number: string
          created_at: string
          created_by: string
          filed_at: string | null
          filed_by: string | null
          id: string
          organisation_id: string
          priority: Database["public"]["Enums"]["case_priority"]
          reporting_entity_id: string
          resolution_notes: string | null
          resolved_at: string | null
          sla_deadline: string
          status: Database["public"]["Enums"]["suspicion_status"]
          suspicion_formed_at: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          case_number: string
          created_at?: string
          created_by: string
          filed_at?: string | null
          filed_by?: string | null
          id?: string
          organisation_id: string
          priority?: Database["public"]["Enums"]["case_priority"]
          reporting_entity_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          sla_deadline: string
          status?: Database["public"]["Enums"]["suspicion_status"]
          suspicion_formed_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          case_number?: string
          created_at?: string
          created_by?: string
          filed_at?: string | null
          filed_by?: string | null
          id?: string
          organisation_id?: string
          priority?: Database["public"]["Enums"]["case_priority"]
          reporting_entity_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          sla_deadline?: string
          status?: Database["public"]["Enums"]["suspicion_status"]
          suspicion_formed_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_filed_by_fkey"
            columns: ["filed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_reporting_entity_id_fkey"
            columns: ["reporting_entity_id"]
            isOneToOne: false
            referencedRelation: "reporting_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organisation_id: string
          role: Database["public"]["Enums"]["user_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organisation_id: string
          role?: Database["public"]["Enums"]["user_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organisation_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          emailed: boolean
          id: string
          is_read: boolean
          organisation_id: string
          resource_id: string | null
          resource_type: Database["public"]["Enums"]["audit_resource"] | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          emailed?: boolean
          id?: string
          is_read?: boolean
          organisation_id: string
          resource_id?: string | null
          resource_type?: Database["public"]["Enums"]["audit_resource"] | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          emailed?: boolean
          id?: string
          is_read?: boolean
          organisation_id?: string
          resource_id?: string | null
          resource_type?: Database["public"]["Enums"]["audit_resource"] | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nz_public_holidays: {
        Row: {
          date: string
          id: string
          name: string
          region: string | null
          year: number
        }
        Insert: {
          date: string
          id?: string
          name: string
          region?: string | null
          year: number
        }
        Update: {
          date?: string
          id?: string
          name?: string
          region?: string | null
          year?: number
        }
        Relationships: []
      }
      organisations: {
        Row: {
          address_city: string | null
          address_country: string | null
          address_line_1: string | null
          address_postcode: string | null
          address_region: string | null
          created_at: string
          id: string
          name: string
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_country?: string | null
          address_line_1?: string | null
          address_postcode?: string | null
          address_region?: string | null
          created_at?: string
          id?: string
          name: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_country?: string | null
          address_line_1?: string | null
          address_postcode?: string | null
          address_region?: string | null
          created_at?: string
          id?: string
          name?: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      person_identifications: {
        Row: {
          comments: string | null
          expiry_date: string | null
          id: string
          issue_country: string | null
          issue_date: string | null
          issued_by: string | null
          number: string
          person_id: string
          type: Database["public"]["Enums"]["id_type"]
        }
        Insert: {
          comments?: string | null
          expiry_date?: string | null
          id?: string
          issue_country?: string | null
          issue_date?: string | null
          issued_by?: string | null
          number: string
          person_id: string
          type: Database["public"]["Enums"]["id_type"]
        }
        Update: {
          comments?: string | null
          expiry_date?: string | null
          id?: string
          issue_country?: string | null
          issue_date?: string | null
          issued_by?: string | null
          number?: string
          person_id?: string
          type?: Database["public"]["Enums"]["id_type"]
        }
        Relationships: [
          {
            foreignKeyName: "person_identifications_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "report_persons"
            referencedColumns: ["id"]
          },
        ]
      }
      phones: {
        Row: {
          comments: string | null
          country_prefix: string | null
          entity_id: string | null
          extension: string | null
          id: string
          number: string
          person_id: string | null
          phone_type: Database["public"]["Enums"]["phone_type"] | null
        }
        Insert: {
          comments?: string | null
          country_prefix?: string | null
          entity_id?: string | null
          extension?: string | null
          id?: string
          number: string
          person_id?: string | null
          phone_type?: Database["public"]["Enums"]["phone_type"] | null
        }
        Update: {
          comments?: string | null
          country_prefix?: string | null
          entity_id?: string | null
          extension?: string | null
          id?: string
          number?: string
          person_id?: string | null
          phone_type?: Database["public"]["Enums"]["phone_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "phones_entity_fk"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "report_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phones_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "report_persons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          last_sign_in_at: string | null
          organisation_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean
          last_sign_in_at?: string | null
          organisation_id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          last_sign_in_at?: string | null
          organisation_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_responses: {
        Row: {
          case_id: string
          completed_at: string | null
          created_at: string
          current_step: number
          id: string
          last_saved_at: string
          organisation_id: string
          report_type: Database["public"]["Enums"]["report_type"]
          responses: Json
          status: Database["public"]["Enums"]["questionnaire_status"]
          template_id: string | null
          total_steps: number
          updated_at: string
        }
        Insert: {
          case_id: string
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          last_saved_at?: string
          organisation_id: string
          report_type: Database["public"]["Enums"]["report_type"]
          responses?: Json
          status?: Database["public"]["Enums"]["questionnaire_status"]
          template_id?: string | null
          total_steps?: number
          updated_at?: string
        }
        Update: {
          case_id?: string
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          last_saved_at?: string
          organisation_id?: string
          report_type?: Database["public"]["Enums"]["report_type"]
          responses?: Json
          status?: Database["public"]["Enums"]["questionnaire_status"]
          template_id?: string | null
          total_steps?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_responses_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questionnaire_responses_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questionnaire_responses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      report_accounts: {
        Row: {
          account_number: string
          account_type: string | null
          balance: number | null
          balance_date: string | null
          branch: string | null
          closed_date: string | null
          comments: string | null
          created_at: string
          currency_code: string | null
          entity_id: string | null
          funds_code: string | null
          id: string
          institution_code: string | null
          institution_code_type:
            | Database["public"]["Enums"]["institution_code_type"]
            | null
          institution_name: string
          is_my_client: boolean
          opened_date: string | null
          organisation_id: string
          person_id: string | null
          report_id: string
          status: Database["public"]["Enums"]["account_status"] | null
        }
        Insert: {
          account_number: string
          account_type?: string | null
          balance?: number | null
          balance_date?: string | null
          branch?: string | null
          closed_date?: string | null
          comments?: string | null
          created_at?: string
          currency_code?: string | null
          entity_id?: string | null
          funds_code?: string | null
          id?: string
          institution_code?: string | null
          institution_code_type?:
            | Database["public"]["Enums"]["institution_code_type"]
            | null
          institution_name: string
          is_my_client?: boolean
          opened_date?: string | null
          organisation_id: string
          person_id?: string | null
          report_id: string
          status?: Database["public"]["Enums"]["account_status"] | null
        }
        Update: {
          account_number?: string
          account_type?: string | null
          balance?: number | null
          balance_date?: string | null
          branch?: string | null
          closed_date?: string | null
          comments?: string | null
          created_at?: string
          currency_code?: string | null
          entity_id?: string | null
          funds_code?: string | null
          id?: string
          institution_code?: string | null
          institution_code_type?:
            | Database["public"]["Enums"]["institution_code_type"]
            | null
          institution_name?: string
          is_my_client?: boolean
          opened_date?: string | null
          organisation_id?: string
          person_id?: string | null
          report_id?: string
          status?: Database["public"]["Enums"]["account_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "report_accounts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "report_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_accounts_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_accounts_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "report_persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_accounts_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_entities: {
        Row: {
          business_type: string | null
          comments: string | null
          commercial_name: string | null
          created_at: string
          id: string
          incorporation_country: string | null
          incorporation_date: string | null
          incorporation_legal_form:
            | Database["public"]["Enums"]["legal_form"]
            | null
          incorporation_number: string | null
          is_my_client: boolean
          name: string
          organisation_id: string
          report_id: string
          role: Database["public"]["Enums"]["party_role"]
        }
        Insert: {
          business_type?: string | null
          comments?: string | null
          commercial_name?: string | null
          created_at?: string
          id?: string
          incorporation_country?: string | null
          incorporation_date?: string | null
          incorporation_legal_form?:
            | Database["public"]["Enums"]["legal_form"]
            | null
          incorporation_number?: string | null
          is_my_client?: boolean
          name: string
          organisation_id: string
          report_id: string
          role: Database["public"]["Enums"]["party_role"]
        }
        Update: {
          business_type?: string | null
          comments?: string | null
          commercial_name?: string | null
          created_at?: string
          id?: string
          incorporation_country?: string | null
          incorporation_date?: string | null
          incorporation_legal_form?:
            | Database["public"]["Enums"]["legal_form"]
            | null
          incorporation_number?: string | null
          is_my_client?: boolean
          name?: string
          organisation_id?: string
          report_id?: string
          role?: Database["public"]["Enums"]["party_role"]
        }
        Relationships: [
          {
            foreignKeyName: "report_entities_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_entities_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_indicators: {
        Row: {
          description: string | null
          id: string
          indicator_code: string
          report_id: string
        }
        Insert: {
          description?: string | null
          id?: string
          indicator_code: string
          report_id: string
        }
        Update: {
          description?: string | null
          id?: string
          indicator_code?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_indicators_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_persons: {
        Row: {
          birth_place: string | null
          birthdate: string | null
          comments: string | null
          created_at: string
          first_name: string
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          is_my_client: boolean
          last_name: string
          middle_name: string | null
          mothers_name: string | null
          nationality: string | null
          occupation: string | null
          organisation_id: string
          report_id: string
          residence: string | null
          role: Database["public"]["Enums"]["party_role"]
          source_of_wealth: string | null
          title: string | null
        }
        Insert: {
          birth_place?: string | null
          birthdate?: string | null
          comments?: string | null
          created_at?: string
          first_name: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          is_my_client?: boolean
          last_name: string
          middle_name?: string | null
          mothers_name?: string | null
          nationality?: string | null
          occupation?: string | null
          organisation_id: string
          report_id: string
          residence?: string | null
          role: Database["public"]["Enums"]["party_role"]
          source_of_wealth?: string | null
          title?: string | null
        }
        Update: {
          birth_place?: string | null
          birthdate?: string | null
          comments?: string | null
          created_at?: string
          first_name?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          is_my_client?: boolean
          last_name?: string
          middle_name?: string | null
          mothers_name?: string | null
          nationality?: string | null
          occupation?: string | null
          organisation_id?: string
          report_id?: string
          residence?: string | null
          role?: Database["public"]["Enums"]["party_role"]
          source_of_wealth?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_persons_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_persons_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          industry_types: Database["public"]["Enums"]["industry_type"][] | null
          is_active: boolean
          is_platform: boolean
          name: string
          organisation_id: string | null
          report_type: Database["public"]["Enums"]["report_type"]
          reporting_entity_id: string | null
          template_data: Json
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          industry_types?: Database["public"]["Enums"]["industry_type"][] | null
          is_active?: boolean
          is_platform?: boolean
          name: string
          organisation_id?: string | null
          report_type: Database["public"]["Enums"]["report_type"]
          reporting_entity_id?: string | null
          template_data?: Json
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          industry_types?: Database["public"]["Enums"]["industry_type"][] | null
          is_active?: boolean
          is_platform?: boolean
          name?: string
          organisation_id?: string | null
          report_type?: Database["public"]["Enums"]["report_type"]
          reporting_entity_id?: string | null
          template_data?: Json
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_templates_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_templates_reporting_entity_id_fkey"
            columns: ["reporting_entity_id"]
            isOneToOne: false
            referencedRelation: "reporting_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      report_transactions: {
        Row: {
          amount_foreign: number | null
          amount_local: number
          comments: string | null
          created_at: string
          currency_code_foreign: string | null
          currency_code_local: string
          date_transaction: string
          goods_description: string | null
          id: string
          late_deposit: boolean
          organisation_id: string
          report_id: string
          transaction_description: string | null
          transaction_location: string
          transaction_number: string
          transmode_code: string
          transmode_comment: string | null
        }
        Insert: {
          amount_foreign?: number | null
          amount_local: number
          comments?: string | null
          created_at?: string
          currency_code_foreign?: string | null
          currency_code_local?: string
          date_transaction: string
          goods_description?: string | null
          id?: string
          late_deposit?: boolean
          organisation_id: string
          report_id: string
          transaction_description?: string | null
          transaction_location: string
          transaction_number: string
          transmode_code: string
          transmode_comment?: string | null
        }
        Update: {
          amount_foreign?: number | null
          amount_local?: number
          comments?: string | null
          created_at?: string
          currency_code_foreign?: string | null
          currency_code_local?: string
          date_transaction?: string
          goods_description?: string | null
          id?: string
          late_deposit?: boolean
          organisation_id?: string
          report_id?: string
          transaction_description?: string | null
          transaction_location?: string
          transaction_number?: string
          transmode_code?: string
          transmode_comment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_transactions_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_transactions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reporting_entities: {
        Row: {
          compliance_officer_email: string | null
          compliance_officer_name: string
          created_at: string
          data_retention_years: number
          holiday_region: string | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"]
          is_active: boolean
          local_currency: string
          name: string
          organisation_id: string
          rentity_branch: string | null
          rentity_id: string
          stripe_subscription_id: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          compliance_officer_email?: string | null
          compliance_officer_name: string
          created_at?: string
          data_retention_years?: number
          holiday_region?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          is_active?: boolean
          local_currency?: string
          name: string
          organisation_id: string
          rentity_branch?: string | null
          rentity_id: string
          stripe_subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          compliance_officer_email?: string | null
          compliance_officer_name?: string
          created_at?: string
          data_retention_years?: number
          holiday_region?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          is_active?: boolean
          local_currency?: string
          name?: string
          organisation_id?: string
          rentity_branch?: string | null
          rentity_id?: string
          stripe_subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reporting_entities_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          amends_report_id: string | null
          case_id: string
          created_at: string
          entity_reference: string
          goaml_confirmation_id: string | null
          id: string
          organisation_id: string
          pdf_storage_path: string | null
          questionnaire_response_id: string
          report_code: string
          report_type: Database["public"]["Enums"]["report_type"]
          status: Database["public"]["Enums"]["report_status"]
          submission_code: string
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
          version: number
          xml_storage_path: string | null
          xml_validation_errors: Json | null
        }
        Insert: {
          amends_report_id?: string | null
          case_id: string
          created_at?: string
          entity_reference: string
          goaml_confirmation_id?: string | null
          id?: string
          organisation_id: string
          pdf_storage_path?: string | null
          questionnaire_response_id: string
          report_code: string
          report_type: Database["public"]["Enums"]["report_type"]
          status?: Database["public"]["Enums"]["report_status"]
          submission_code?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
          version?: number
          xml_storage_path?: string | null
          xml_validation_errors?: Json | null
        }
        Update: {
          amends_report_id?: string | null
          case_id?: string
          created_at?: string
          entity_reference?: string
          goaml_confirmation_id?: string | null
          id?: string
          organisation_id?: string
          pdf_storage_path?: string | null
          questionnaire_response_id?: string
          report_code?: string
          report_type?: Database["public"]["Enums"]["report_type"]
          status?: Database["public"]["Enums"]["report_status"]
          submission_code?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
          version?: number
          xml_storage_path?: string | null
          xml_validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_amends_report_id_fkey"
            columns: ["amends_report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_questionnaire_response_id_fkey"
            columns: ["questionnaire_response_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suspicions: {
        Row: {
          case_id: string
          created_at: string
          description: string
          id: string
          organisation_id: string
          raised_by: string | null
          source: Database["public"]["Enums"]["suspicion_source"] | null
        }
        Insert: {
          case_id: string
          created_at?: string
          description: string
          id?: string
          organisation_id: string
          raised_by?: string | null
          source?: Database["public"]["Enums"]["suspicion_source"] | null
        }
        Update: {
          case_id?: string
          created_at?: string
          description?: string
          id?: string
          organisation_id?: string
          raised_by?: string | null
          source?: Database["public"]["Enums"]["suspicion_source"] | null
        }
        Relationships: [
          {
            foreignKeyName: "suspicions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspicions_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspicions_raised_by_fkey"
            columns: ["raised_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_parties: {
        Row: {
          account_id: string | null
          direction: Database["public"]["Enums"]["transaction_direction"]
          entity_id: string | null
          id: string
          party_type: Database["public"]["Enums"]["transaction_party_type"]
          person_id: string | null
          transaction_id: string
        }
        Insert: {
          account_id?: string | null
          direction: Database["public"]["Enums"]["transaction_direction"]
          entity_id?: string | null
          id?: string
          party_type: Database["public"]["Enums"]["transaction_party_type"]
          person_id?: string | null
          transaction_id: string
        }
        Update: {
          account_id?: string | null
          direction?: Database["public"]["Enums"]["transaction_direction"]
          entity_id?: string | null
          id?: string
          party_type?: Database["public"]["Enums"]["transaction_party_type"]
          person_id?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_parties_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "report_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_parties_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "report_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_parties_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "report_persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_parties_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "report_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_org_id: { Args: never; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      account_status: "active" | "closed" | "dormant" | "frozen"
      address_type: "residential" | "business" | "registered" | "mailing"
      audit_action:
        | "case_created"
        | "case_updated"
        | "status_changed"
        | "report_generated"
        | "report_submitted"
        | "questionnaire_saved"
        | "attachment_uploaded"
        | "user_invited"
        | "user_deactivated"
        | "data_exported"
        | "login_success"
        | "login_failed"
        | "mfa_enrolled"
        | "settings_changed"
      audit_resource:
        | "case"
        | "report"
        | "questionnaire"
        | "attachment"
        | "user"
        | "organisation"
        | "reporting_entity"
      case_priority: "low" | "medium" | "high" | "critical"
      gender: "M" | "F" | "U"
      id_type:
        | "drivers_licence"
        | "passport"
        | "national_id"
        | "birth_certificate"
        | "other"
      industry_type:
        | "law_firm"
        | "accountant"
        | "real_estate"
        | "tcsp"
        | "money_remitter"
        | "currency_exchanger"
        | "non_bank_deposit_taker"
        | "lender"
        | "payment_service_provider"
        | "wealth_provider"
        | "casino"
        | "other"
      institution_code_type: "swift" | "nz_bank_prefix"
      legal_form: "limited" | "partnership" | "sole_trader" | "trust" | "other"
      notification_type:
        | "sla_warning"
        | "sla_breach"
        | "case_assigned"
        | "report_ready"
        | "comment_added"
        | "new_suspicion"
        | "status_update"
        | "report_filed"
      party_role:
        | "my_client"
        | "counterparty"
        | "conductor"
        | "signatory"
        | "director"
        | "beneficiary"
      phone_type: "mobile" | "landline" | "fax"
      questionnaire_status: "draft" | "complete" | "submitted"
      report_status:
        | "draft"
        | "validated"
        | "submitted"
        | "accepted"
        | "rejected"
      report_type: "STR" | "SAR" | "LCT" | "IFT"
      subscription_status: "trialing" | "active" | "past_due" | "cancelled"
      suspicion_source:
        | "internal_monitoring"
        | "staff_report"
        | "customer_due_diligence"
        | "third_party_tip"
        | "law_enforcement"
        | "other"
      suspicion_status:
        | "draft"
        | "raised"
        | "investigating"
        | "to_file"
        | "filed"
        | "resolved"
      transaction_direction: "from" | "to"
      transaction_party_type: "person" | "entity" | "account"
      user_role: "owner" | "admin" | "analyst" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_status: ["active", "closed", "dormant", "frozen"],
      address_type: ["residential", "business", "registered", "mailing"],
      audit_action: [
        "case_created",
        "case_updated",
        "status_changed",
        "report_generated",
        "report_submitted",
        "questionnaire_saved",
        "attachment_uploaded",
        "user_invited",
        "user_deactivated",
        "data_exported",
        "login_success",
        "login_failed",
        "mfa_enrolled",
        "settings_changed",
      ],
      audit_resource: [
        "case",
        "report",
        "questionnaire",
        "attachment",
        "user",
        "organisation",
        "reporting_entity",
      ],
      case_priority: ["low", "medium", "high", "critical"],
      gender: ["M", "F", "U"],
      id_type: [
        "drivers_licence",
        "passport",
        "national_id",
        "birth_certificate",
        "other",
      ],
      industry_type: [
        "law_firm",
        "accountant",
        "real_estate",
        "tcsp",
        "money_remitter",
        "currency_exchanger",
        "non_bank_deposit_taker",
        "lender",
        "payment_service_provider",
        "wealth_provider",
        "casino",
        "other",
      ],
      institution_code_type: ["swift", "nz_bank_prefix"],
      legal_form: ["limited", "partnership", "sole_trader", "trust", "other"],
      notification_type: [
        "sla_warning",
        "sla_breach",
        "case_assigned",
        "report_ready",
        "comment_added",
        "new_suspicion",
        "status_update",
        "report_filed",
      ],
      party_role: [
        "my_client",
        "counterparty",
        "conductor",
        "signatory",
        "director",
        "beneficiary",
      ],
      phone_type: ["mobile", "landline", "fax"],
      questionnaire_status: ["draft", "complete", "submitted"],
      report_status: [
        "draft",
        "validated",
        "submitted",
        "accepted",
        "rejected",
      ],
      report_type: ["STR", "SAR", "LCT", "IFT"],
      subscription_status: ["trialing", "active", "past_due", "cancelled"],
      suspicion_source: [
        "internal_monitoring",
        "staff_report",
        "customer_due_diligence",
        "third_party_tip",
        "law_enforcement",
        "other",
      ],
      suspicion_status: [
        "draft",
        "raised",
        "investigating",
        "to_file",
        "filed",
        "resolved",
      ],
      transaction_direction: ["from", "to"],
      transaction_party_type: ["person", "entity", "account"],
      user_role: ["owner", "admin", "analyst", "viewer"],
    },
  },
} as const
