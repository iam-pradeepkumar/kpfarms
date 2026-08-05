export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      app_user_connections: {
        Row: {
          account_email: string | null;
          connection_key_ciphertext: string;
          connector_id: string;
          created_at: string;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_email?: string | null;
          connection_key_ciphertext: string;
          connector_id: string;
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_email?: string | null;
          connection_key_ciphertext?: string;
          connector_id?: string;
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          category: string | null;
          content: string | null;
          cover_url: string | null;
          created_at: string;
          excerpt: string | null;
          id: string;
          published: boolean;
          published_at: string;
          slug: string | null;
          title: string;
          updated_at: string;
          video_url: string | null;
        };
        Insert: {
          category?: string | null;
          content?: string | null;
          cover_url?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          published?: boolean;
          published_at?: string;
          slug?: string | null;
          title: string;
          updated_at?: string;
          video_url?: string | null;
        };
        Update: {
          category?: string | null;
          content?: string | null;
          cover_url?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          published?: boolean;
          published_at?: string;
          slug?: string | null;
          title?: string;
          updated_at?: string;
          video_url?: string | null;
        };
        Relationships: [];
      };
      consultation_bookings: {
        Row: {
          booking_step: string;
          confirmed_at: string | null;
          created_at: string;
          email: string | null;
          id: string;
          meeting_link: string | null;
          name: string;
          notes: string | null;
          paid_at: string | null;
          payment_amount: number | null;
          payment_reference: string | null;
          payment_screenshot_path: string | null;
          preferred_date: string | null;
          preferred_time: string | null;
          slot_confirmed_at: string | null;
          status: string;
          topic: string | null;
          whatsapp: string;
        };
        Insert: {
          booking_step?: string;
          confirmed_at?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          meeting_link?: string | null;
          name: string;
          notes?: string | null;
          paid_at?: string | null;
          payment_amount?: number | null;
          payment_reference?: string | null;
          payment_screenshot_path?: string | null;
          preferred_date?: string | null;
          preferred_time?: string | null;
          slot_confirmed_at?: string | null;
          status?: string;
          topic?: string | null;
          whatsapp: string;
        };
        Update: {
          booking_step?: string;
          confirmed_at?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          meeting_link?: string | null;
          name?: string;
          notes?: string | null;
          paid_at?: string | null;
          payment_amount?: number | null;
          payment_reference?: string | null;
          payment_screenshot_path?: string | null;
          preferred_date?: string | null;
          preferred_time?: string | null;
          slot_confirmed_at?: string | null;
          status?: string;
          topic?: string | null;
          whatsapp?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          message: string;
          name: string;
          phone: string | null;
          status: string;
          subject: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          message: string;
          name: string;
          phone?: string | null;
          status?: string;
          subject?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          message?: string;
          name?: string;
          phone?: string | null;
          status?: string;
          subject?: string | null;
        };
        Relationships: [];
      };
      farm_visit_bookings: {
        Row: {
          booking_step: string;
          confirmed_at: string | null;
          created_at: string;
          email: string | null;
          group_size: number | null;
          id: string;
          meeting_link: string | null;
          name: string;
          notes: string | null;
          paid_at: string | null;
          payment_amount: number | null;
          payment_reference: string | null;
          payment_screenshot_path: string | null;
          slot_confirmed_at: string | null;
          status: string;
          visit_date: string | null;
          whatsapp: string;
        };
        Insert: {
          booking_step?: string;
          confirmed_at?: string | null;
          created_at?: string;
          email?: string | null;
          group_size?: number | null;
          id?: string;
          meeting_link?: string | null;
          name: string;
          notes?: string | null;
          paid_at?: string | null;
          payment_amount?: number | null;
          payment_reference?: string | null;
          payment_screenshot_path?: string | null;
          slot_confirmed_at?: string | null;
          status?: string;
          visit_date?: string | null;
          whatsapp: string;
        };
        Update: {
          booking_step?: string;
          confirmed_at?: string | null;
          created_at?: string;
          email?: string | null;
          group_size?: number | null;
          id?: string;
          meeting_link?: string | null;
          name?: string;
          notes?: string | null;
          paid_at?: string | null;
          payment_amount?: number | null;
          payment_reference?: string | null;
          payment_screenshot_path?: string | null;
          slot_confirmed_at?: string | null;
          status?: string;
          visit_date?: string | null;
          whatsapp?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          address: string | null;
          created_at: string;
          customer_name: string;
          email: string | null;
          id: string;
          notes: string | null;
          product_id: string | null;
          product_name: string;
          product_type: string | null;
          quantity: number;
          status: string;
          total: number | null;
          unit_price: number | null;
          whatsapp: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          customer_name: string;
          email?: string | null;
          id?: string;
          notes?: string | null;
          product_id?: string | null;
          product_name: string;
          product_type?: string | null;
          quantity?: number;
          status?: string;
          total?: number | null;
          unit_price?: number | null;
          whatsapp: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          customer_name?: string;
          email?: string | null;
          id?: string;
          notes?: string | null;
          product_id?: string | null;
          product_name?: string;
          product_type?: string | null;
          quantity?: number;
          status?: string;
          total?: number | null;
          unit_price?: number | null;
          whatsapp?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          active: boolean;
          category: string | null;
          created_at: string;
          description: string | null;
          external_url: string | null;
          id: string;
          image_url: string | null;
          meta: Json;
          name: string;
          offer_price: number | null;
          price: number | null;
          type: Database["public"]["Enums"]["product_type"];
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          external_url?: string | null;
          id?: string;
          image_url?: string | null;
          meta?: Json;
          name: string;
          offer_price?: number | null;
          price?: number | null;
          type: Database["public"]["Enums"]["product_type"];
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          external_url?: string | null;
          id?: string;
          image_url?: string | null;
          meta?: Json;
          name?: string;
          offer_price?: number | null;
          price?: number | null;
          type?: Database["public"]["Enums"]["product_type"];
          updated_at?: string;
        };
        Relationships: [];
      };
      push_sent_log: {
        Row: {
          key: string;
          sent_at: string;
        };
        Insert: {
          key: string;
          sent_at?: string;
        };
        Update: {
          key?: string;
          sent_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          audience: string;
          auth: string;
          created_at: string;
          endpoint: string;
          id: string;
          p256dh: string;
          user_id: string | null;
        };
        Insert: {
          audience?: string;
          auth: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          p256dh: string;
          user_id?: string | null;
        };
        Update: {
          audience?: string;
          auth?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          p256dh?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          created_at: string;
          key: string;
          updated_at: string;
          value: string | null;
        };
        Insert: {
          created_at?: string;
          key: string;
          updated_at?: string;
          value?: string | null;
        };
        Update: {
          created_at?: string;
          key?: string;
          updated_at?: string;
          value?: string | null;
        };
        Relationships: [];
      };
      testimonials: {
        Row: {
          created_at: string;
          featured: boolean;
          id: string;
          media_type: string;
          media_url: string | null;
          name: string;
          place: string | null;
          rating: number;
          status: string;
          text: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          featured?: boolean;
          id?: string;
          media_type?: string;
          media_url?: string | null;
          name: string;
          place?: string | null;
          rating?: number;
          status?: string;
          text?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          featured?: boolean;
          id?: string;
          media_type?: string;
          media_url?: string | null;
          name?: string;
          place?: string | null;
          rating?: number;
          status?: string;
          text?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      training_bookings: {
        Row: {
          booking_step: string;
          cohort_date: string | null;
          confirmed_at: string | null;
          created_at: string;
          email: string | null;
          id: string;
          meeting_link: string | null;
          name: string;
          notes: string | null;
          paid_at: string | null;
          payment_amount: number | null;
          payment_reference: string | null;
          payment_screenshot_path: string | null;
          program: string | null;
          slot_confirmed_at: string | null;
          status: string;
          whatsapp: string;
        };
        Insert: {
          booking_step?: string;
          cohort_date?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          meeting_link?: string | null;
          name: string;
          notes?: string | null;
          paid_at?: string | null;
          payment_amount?: number | null;
          payment_reference?: string | null;
          payment_screenshot_path?: string | null;
          program?: string | null;
          slot_confirmed_at?: string | null;
          status?: string;
          whatsapp: string;
        };
        Update: {
          booking_step?: string;
          cohort_date?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          meeting_link?: string | null;
          name?: string;
          notes?: string | null;
          paid_at?: string | null;
          payment_amount?: number | null;
          payment_reference?: string | null;
          payment_screenshot_path?: string | null;
          program?: string | null;
          slot_confirmed_at?: string | null;
          status?: string;
          whatsapp?: string;
        };
        Relationships: [];
      };
      training_programs: {
        Row: {
          active: boolean;
          cohort_date: string | null;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          name: string;
          price: number | null;
          seats: number | null;
          session_time: string | null;
          updated_at: string;
          venue: string | null;
        };
        Insert: {
          active?: boolean;
          cohort_date?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          price?: number | null;
          seats?: number | null;
          session_time?: string | null;
          updated_at?: string;
          venue?: string | null;
        };
        Update: {
          active?: boolean;
          cohort_date?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          price?: number | null;
          seats?: number | null;
          session_time?: string | null;
          updated_at?: string;
          venue?: string | null;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      booking_status: {
        Args: { _kind: string; _whatsapp: string };
        Returns: Json;
      };
      claim_admin_if_first: { Args: never; Returns: boolean };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      mark_booking_paid: {
        Args: {
          _id: string;
          _kind: string;
          _payment_reference: string;
          _whatsapp: string;
        };
        Returns: boolean;
      };
      payment_proof_path_valid: { Args: { _name: string }; Returns: boolean };
      proof_upload_token: {
        Args: { _id: string; _kind: string; _whatsapp: string };
        Returns: string;
      };
      register_consultation: {
        Args: {
          _email?: string;
          _name: string;
          _topic?: string;
          _whatsapp: string;
        };
        Returns: string;
      };
      register_farm_visit: {
        Args: { _email?: string; _name: string; _whatsapp: string };
        Returns: string;
      };
      register_training: {
        Args: {
          _cohort_date?: string;
          _email?: string;
          _name: string;
          _program?: string;
          _whatsapp: string;
        };
        Returns: string;
      };
      resume_booking: {
        Args: { _kind: string; _whatsapp: string };
        Returns: Json;
      };
      submit_order: {
        Args: {
          _address: string;
          _customer_name: string;
          _email: string;
          _notes: string;
          _product_id: string;
          _quantity: number;
          _whatsapp: string;
        };
        Returns: string;
      };
      submit_payment_proof: {
        Args: {
          _id: string;
          _kind: string;
          _screenshot_path: string;
          _whatsapp: string;
        };
        Returns: boolean;
      };
      trained_farmers_count: { Args: never; Returns: number };
      update_consultation_slot: {
        Args: {
          _id: string;
          _notes: string;
          _preferred_date: string;
          _preferred_time: string;
          _whatsapp: string;
        };
        Returns: boolean;
      };
      update_farm_visit_slot: {
        Args: {
          _group_size: number;
          _id: string;
          _notes: string;
          _visit_date: string;
          _whatsapp: string;
        };
        Returns: boolean;
      };
      update_training_slot: {
        Args: {
          _cohort_date: string;
          _id: string;
          _notes: string;
          _whatsapp: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "user";
      product_type: "digital" | "poultry" | "affiliate" | "training";
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
      product_type: ["digital", "poultry", "affiliate", "training"],
    },
  },
} as const;
