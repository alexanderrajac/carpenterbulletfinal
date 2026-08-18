export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_image_url: string | null;
          product_name: string;
          quantity: number;
          unit_price_cents: number;
          customizations: Json | null;
          vendor_id: string | null;
          fulfillment_status: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          product_image_url?: string | null;
          product_name: string;
          quantity: number;
          unit_price_cents: number;
          customizations?: Json | null;
          vendor_id?: string | null;
          fulfillment_status?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          product_image_url?: string | null;
          product_name?: string;
          quantity?: number;
          unit_price_cents?: number;
          customizations?: Json | null;
          vendor_id?: string | null;
          fulfillment_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendor_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          created_at: string;
          id: string;
          shipping_address: Json;
          status: string;
          total_cents: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          shipping_address?: Json;
          status?: string;
          total_cents: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          shipping_address?: Json;
          status?: string;
          total_cents?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          category_id: string | null;
          created_at: string;
          description: string;
          featured: boolean;
          id: string;
          image_url: string | null;
          name: string;
          price_cents: number | null;
          slug: string;
          stock: number | null;
          updated_at: string;
          customizations: Json | null;
          seo_keywords: string | null;
          vendor_id: string | null;
          is_approved: boolean;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          description?: string;
          featured?: boolean;
          id?: string;
          image_url?: string | null;
          name: string;
          price_cents?: number | null;
          slug: string;
          stock?: number | null;
          updated_at?: string;
          customizations?: Json | null;
          seo_keywords?: string | null;
          vendor_id?: string | null;
          is_approved?: boolean;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          description?: string;
          featured?: boolean;
          id?: string;
          image_url?: string | null;
          name?: string;
          price_cents?: number | null;
          slug?: string;
          stock?: number | null;
          updated_at?: string;
          customizations?: Json | null;
          seo_keywords?: string | null;
          vendor_id?: string | null;
          is_approved?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendor_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      vendor_profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          business_name: string;
          city: string;
          created_at: string;
          id: string;
          is_approved: boolean;
          owner_name: string;
          phone_number: string;
          state: string;
          upi_payout_id: string;
          updated_at: string;
          workshop_address: string;
          portfolio_images: string[] | null;
          availability_status?: string;
          verification_badge?: string;
          response_rate_pct?: number;
          response_time_minutes?: number;
          completed_jobs_count?: number;
          carpenter_score?: number;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          business_name: string;
          city: string;
          created_at?: string;
          id: string;
          is_approved?: boolean;
          owner_name: string;
          phone_number: string;
          state: string;
          upi_payout_id: string;
          updated_at?: string;
          workshop_address: string;
          portfolio_images?: string[] | null;
          availability_status?: string;
          verification_badge?: string;
          response_rate_pct?: number;
          response_time_minutes?: number;
          completed_jobs_count?: number;
          carpenter_score?: number;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          business_name?: string;
          city?: string;
          created_at?: string;
          id?: string;
          is_approved?: boolean;
          owner_name?: string;
          phone_number?: string;
          state?: string;
          upi_payout_id?: string;
          updated_at?: string;
          workshop_address?: string;
          portfolio_images?: string[] | null;
          availability_status?: string;
          verification_badge?: string;
          response_rate_pct?: number;
          response_time_minutes?: number;
          completed_jobs_count?: number;
          carpenter_score?: number;
        };
        Relationships: [];
      };
      job_requirements: {
        Row: {
          id: string;
          requirement_number: string;
          customer_id: string | null;
          customer_name: string;
          customer_phone: string;
          whatsapp_number: string | null;
          service_category: string;
          title: string;
          description: string;
          city: string;
          area: string;
          budget_min_cents: number;
          budget_max_cents: number;
          urgency: string;
          preferred_date: string | null;
          photos: string[] | null;
          measurements: string | null;
          status: string;
          matched_vendor_ids: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requirement_number: string;
          customer_id?: string | null;
          customer_name: string;
          customer_phone: string;
          whatsapp_number?: string | null;
          service_category: string;
          title: string;
          description: string;
          city: string;
          area: string;
          budget_min_cents?: number;
          budget_max_cents?: number;
          urgency?: string;
          preferred_date?: string | null;
          photos?: string[] | null;
          measurements?: string | null;
          status?: string;
          matched_vendor_ids?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requirement_number?: string;
          customer_id?: string | null;
          customer_name?: string;
          customer_phone?: string;
          whatsapp_number?: string | null;
          service_category?: string;
          title?: string;
          description?: string;
          city?: string;
          area?: string;
          budget_min_cents?: number;
          budget_max_cents?: number;
          urgency?: string;
          preferred_date?: string | null;
          photos?: string[] | null;
          measurements?: string | null;
          status?: string;
          matched_vendor_ids?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      quotes: {
        Row: {
          id: string;
          requirement_id: string;
          vendor_id: string;
          price_cents: number;
          labor_cents: number;
          materials_cents: number;
          estimated_days: number;
          materials_description: string | null;
          warranty_months: number | null;
          notes: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requirement_id: string;
          vendor_id: string;
          price_cents: number;
          labor_cents?: number;
          materials_cents?: number;
          estimated_days?: number;
          materials_description?: string | null;
          warranty_months?: number | null;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requirement_id?: string;
          vendor_id?: string;
          price_cents?: number;
          labor_cents?: number;
          materials_cents?: number;
          estimated_days?: number;
          materials_description?: string | null;
          warranty_months?: number | null;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          vendor_id: string;
          slug: string;
          title: string;
          description: string;
          category: string;
          city: string;
          area: string;
          before_image_url: string | null;
          after_image_url: string;
          gallery_images: string[] | null;
          duration_days: number | null;
          price_range_text: string | null;
          materials_used: string[] | null;
          customer_review_rating: number | null;
          customer_review_text: string | null;
          featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          slug: string;
          title: string;
          description: string;
          category: string;
          city: string;
          area: string;
          before_image_url?: string | null;
          after_image_url: string;
          gallery_images?: string[] | null;
          duration_days?: number | null;
          price_range_text?: string | null;
          materials_used?: string[] | null;
          customer_review_rating?: number | null;
          customer_review_text?: string | null;
          featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          slug?: string;
          title?: string;
          description?: string;
          category?: string;
          city?: string;
          area?: string;
          before_image_url?: string | null;
          after_image_url?: string;
          gallery_images?: string[] | null;
          duration_days?: number | null;
          price_range_text?: string | null;
          materials_used?: string[] | null;
          customer_review_rating?: number | null;
          customer_review_text?: string | null;
          featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lead_events: {
        Row: {
          id: string;
          event_type: string;
          vendor_id: string | null;
          requirement_id: string | null;
          customer_phone: string | null;
          city: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          vendor_id?: string | null;
          requirement_id?: string | null;
          customer_phone?: string | null;
          city?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          vendor_id?: string | null;
          requirement_id?: string | null;
          customer_phone?: string | null;
          city?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      seo_locations: {
        Row: {
          id: string;
          city: string;
          area: string;
          district: string;
          pincode: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          city: string;
          area: string;
          district: string;
          pincode?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          city?: string;
          area?: string;
          district?: string;
          pincode?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      seo_pages: {
        Row: {
          id: string;
          url_path: string;
          city: string;
          area: string;
          service_category: string;
          title_tag: string;
          meta_description: string;
          h1_heading: string;
          intro_content: string;
          faqs: Json | null;
          is_indexed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          url_path: string;
          city: string;
          area: string;
          service_category: string;
          title_tag: string;
          meta_description: string;
          h1_heading: string;
          intro_content: string;
          faqs?: Json | null;
          is_indexed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          url_path?: string;
          city?: string;
          area?: string;
          service_category?: string;
          title_tag?: string;
          meta_description?: string;
          h1_heading?: string;
          intro_content?: string;
          faqs?: Json | null;
          is_indexed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vendor_offers: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          price_cents: number;
          product_id: string;
          stock: number;
          updated_at: string;
          vendor_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          price_cents: number;
          product_id: string;
          stock?: number;
          updated_at?: string;
          vendor_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          price_cents?: number;
          product_id?: string;
          stock?: number;
          updated_at?: string;
          vendor_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "vendor_offers_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vendor_offers_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendor_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "user" | "vendor";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "vendor"],
    },
  },
} as const;
