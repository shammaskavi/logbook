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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      business_settings: {
        Row: {
          account_name: string | null
          account_number: string | null
          bank_branch: string | null
          bank_name: string | null
          business_address: string | null
          business_name: string
          created_at: string
          dc_prefix: string
          email: string | null
          gstin: string | null
          ifsc_code: string | null
          invoice_prefix: string
          logo_url: string | null
          organization_id: string
          pan: string | null
          phone: string | null
          updated_at: string
          work_order_prefix: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          business_address?: string | null
          business_name: string
          created_at?: string
          dc_prefix?: string
          email?: string | null
          gstin?: string | null
          ifsc_code?: string | null
          invoice_prefix?: string
          logo_url?: string | null
          organization_id: string
          pan?: string | null
          phone?: string | null
          updated_at?: string
          work_order_prefix?: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          business_address?: string | null
          business_name?: string
          created_at?: string
          dc_prefix?: string
          email?: string | null
          gstin?: string | null
          ifsc_code?: string | null
          invoice_prefix?: string
          logo_url?: string | null
          organization_id?: string
          pan?: string | null
          phone?: string | null
          updated_at?: string
          work_order_prefix?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dc_items: {
        Row: {
          delivery_challan_id: string | null
          id: string
          invoiced_quantity: number | null
          job_work_type_name: string
          organization_id: string
          quantity: number
          work_order_item_id: string | null
        }
        Insert: {
          delivery_challan_id?: string | null
          id?: string
          invoiced_quantity?: number | null
          job_work_type_name: string
          organization_id: string
          quantity: number
          work_order_item_id?: string | null
        }
        Update: {
          delivery_challan_id?: string | null
          id?: string
          invoiced_quantity?: number | null
          job_work_type_name?: string
          organization_id?: string
          quantity?: number
          work_order_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dc_items_delivery_challan_id_fkey"
            columns: ["delivery_challan_id"]
            isOneToOne: false
            referencedRelation: "delivery_challans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dc_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dc_items_work_order_item_fk"
            columns: ["work_order_item_id"]
            isOneToOne: false
            referencedRelation: "work_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_challans: {
        Row: {
          created_at: string | null
          dc_number: string
          generated_date: string
          id: string
          linked_work_order_ids: string[] | null
          organization_id: string
          party_gstin: string | null
          party_id: string | null
          party_name: string
          transporter_name: string | null
        }
        Insert: {
          created_at?: string | null
          dc_number: string
          generated_date: string
          id?: string
          linked_work_order_ids?: string[] | null
          organization_id: string
          party_gstin?: string | null
          party_id?: string | null
          party_name: string
          transporter_name?: string | null
        }
        Update: {
          created_at?: string | null
          dc_number?: string
          generated_date?: string
          id?: string
          linked_work_order_ids?: string[] | null
          organization_id?: string
          party_gstin?: string | null
          party_id?: string | null
          party_name?: string
          transporter_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_challans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_challans_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          dc_item_id: string | null
          dc_number: string | null
          id: string
          invoice_id: string | null
          organization_id: string
          particulars: string | null
          quantity: number
          rate: number
          wo_number: string | null
          work_order_id: string | null
        }
        Insert: {
          amount: number
          dc_item_id?: string | null
          dc_number?: string | null
          id?: string
          invoice_id?: string | null
          organization_id: string
          particulars?: string | null
          quantity: number
          rate: number
          wo_number?: string | null
          work_order_id?: string | null
        }
        Update: {
          amount?: number
          dc_item_id?: string | null
          dc_number?: string | null
          id?: string
          invoice_id?: string | null
          organization_id?: string
          particulars?: string | null
          quantity?: number
          rate?: number
          wo_number?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_dc_item_id_fkey"
            columns: ["dc_item_id"]
            isOneToOne: false
            referencedRelation: "dc_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          cgst_percent: number | null
          created_at: string | null
          grand_total: number | null
          gst_type: string | null
          id: string
          igst_percent: number | null
          invoice_date: string
          invoice_number: string
          organization_id: string
          party_gstin: string | null
          party_id: string | null
          party_name: string
          sgst_percent: number | null
          subtotal: number | null
          tax_amount: number | null
        }
        Insert: {
          cgst_percent?: number | null
          created_at?: string | null
          grand_total?: number | null
          gst_type?: string | null
          id?: string
          igst_percent?: number | null
          invoice_date?: string
          invoice_number: string
          organization_id: string
          party_gstin?: string | null
          party_id?: string | null
          party_name: string
          sgst_percent?: number | null
          subtotal?: number | null
          tax_amount?: number | null
        }
        Update: {
          cgst_percent?: number | null
          created_at?: string | null
          grand_total?: number | null
          gst_type?: string | null
          id?: string
          igst_percent?: number | null
          invoice_date?: string
          invoice_number?: string
          organization_id?: string
          party_gstin?: string | null
          party_id?: string | null
          party_name?: string
          sgst_percent?: number | null
          subtotal?: number | null
          tax_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      job_work_types: {
        Row: {
          active: boolean | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          active?: boolean | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          active?: boolean | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_work_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      parties: {
        Row: {
          created_at: string | null
          gstin: string | null
          id: string
          name: string
          organization_id: string
          phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          gstin?: string | null
          id?: string
          name: string
          organization_id: string
          phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          gstin?: string | null
          id?: string
          name?: string
          organization_id?: string
          phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_items: {
        Row: {
          id: string
          job_work_type_id: string | null
          job_work_type_name: string
          organization_id: string
          pending_quantity: number
          quantity: number
          work_order_id: string | null
        }
        Insert: {
          id?: string
          job_work_type_id?: string | null
          job_work_type_name: string
          organization_id: string
          pending_quantity: number
          quantity: number
          work_order_id?: string | null
        }
        Update: {
          id?: string
          job_work_type_id?: string | null
          job_work_type_name?: string
          organization_id?: string
          pending_quantity?: number
          quantity?: number
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_order_items_job_work_type_id_fkey"
            columns: ["job_work_type_id"]
            isOneToOne: false
            referencedRelation: "job_work_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_items_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          party_id: string | null
          party_name: string
          received_date: string
          updated_at: string | null
          work_order_number: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          party_id?: string | null
          party_name: string
          received_date: string
          updated_at?: string | null
          work_order_number: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          party_id?: string | null
          party_name?: string
          received_date?: string
          updated_at?: string | null
          work_order_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_delivery_challan_with_effects:
        | {
            Args: {
              p_dc_number: string
              p_generated_date: string
              p_items: Json
              p_party_id: string
              p_party_name: string
              p_transporter_name: string
            }
            Returns: string
          }
        | {
            Args: {
              p_dc_number: string
              p_generated_date: string
              p_items: Json
              p_organization_id: string
              p_party_id: string
              p_party_name: string
              p_transporter_name: string
            }
            Returns: string
          }
      create_invoice_with_effects: {
        Args: {
          p_cgst_percent: number
          p_gst_type: string
          p_igst_percent: number
          p_invoice_date: string
          p_invoice_number: string
          p_items: Json
          p_organization_id: string
          p_party_gstin: string
          p_party_id: string
          p_party_name: string
          p_sgst_percent: number
        }
        Returns: string
      }
      create_work_order_with_items:
        | {
            Args: {
              p_items: Json
              p_organization_id: string
              p_party_id: string
              p_party_name: string
              p_received_date: string
              p_work_order_number: string
            }
            Returns: string
          }
        | {
            Args: {
              p_items: Json
              p_party_id: string
              p_party_name: string
              p_received_date: string
              p_work_order_number: string
            }
            Returns: string
          }
      delete_delivery_challan_with_effects: {
        Args: { p_dc_id: string }
        Returns: string
      }
      delete_work_order_with_effects: {
        Args: { p_work_order_id: string }
        Returns: undefined
      }
      get_billable_dc_items:
        | {
            Args: { p_organization_id: string; p_party_id: string }
            Returns: {
              dc_id: string
              dc_item_id: string
              dc_number: string
              delivered_qty: number
              invoiced_qty: number
              job_work_type_name: string
              remaining_qty: number
              wo_number: string
              work_order_id: string
            }[]
          }
        | {
            Args: { p_party_id: string }
            Returns: {
              dc_id: string
              dc_item_id: string
              dc_number: string
              delivered_qty: number
              invoiced_qty: number
              job_work_type_name: string
              remaining_qty: number
              wo_number: string
              work_order_id: string
            }[]
          }
      get_dashboard_summary: {
        Args: { p_organization_id: string }
        Returns: {
          active_customers: number
          invoice_count: number
          pending_quantity: number
          revenue_this_month: number
          unbilled_amount: number
          work_order_count: number
        }[]
      }
      get_job_work_type_breakdown: {
        Args: { p_organization_id: string }
        Returns: {
          job_work_type_name: string
          total_quantity: number
        }[]
      }
      get_monthly_quantity_trend: {
        Args: { p_organization_id: string }
        Returns: {
          month: string
          total_quantity: number
        }[]
      }
      get_party_ledger_summary: {
        Args: { p_organization_id: string; p_party_id: string }
        Returns: {
          outstanding_amount: number
          total_invoiced: number
          total_quantity: number
          total_work_orders: number
        }[]
      }
      get_pending_work_by_party: {
        Args: { p_organization_id: string }
        Returns: {
          party_id: string
          party_name: string
          pending_quantity: number
        }[]
      }
      get_top_parties_by_quantity: {
        Args: { p_organization_id: string }
        Returns: {
          party_name: string
          total_quantity: number
        }[]
      }
      update_work_order_with_items: {
        Args: {
          p_items: Json
          p_party_id: string
          p_party_name: string
          p_received_date: string
          p_work_order_id: string
          p_work_order_number: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
