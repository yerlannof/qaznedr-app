export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      kazakhstan_deposits: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          type: 'MINING_LICENSE' | 'EXPLORATION_LICENSE' | 'MINERAL_OCCURRENCE';
          mineral: string;
          region: string;
          city: string | null;
          area: number | null;
          price: number | null;
          coordinates: Json | null;
          images: string[] | null;
          documents: string[] | null;
          verified: boolean;
          featured: boolean;
          status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'SOLD';
          user_id: string | null;
          license_subtype: string | null;
          license_number: string | null;
          license_expiry: string | null;
          annual_production_limit: number | null;
          exploration_stage: string | null;
          exploration_start: string | null;
          exploration_end: string | null;
          exploration_budget: number | null;
          discovery_date: string | null;
          geological_confidence: string | null;
          estimated_reserves: number | null;
          accessibility_rating: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          type: 'MINING_LICENSE' | 'EXPLORATION_LICENSE' | 'MINERAL_OCCURRENCE';
          mineral: string;
          region: string;
          city?: string | null;
          area?: number | null;
          price?: number | null;
          coordinates?: Json | null;
          images?: string[] | null;
          documents?: string[] | null;
          verified?: boolean;
          featured?: boolean;
          status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'SOLD';
          user_id?: string | null;
          license_subtype?: string | null;
          license_number?: string | null;
          license_expiry?: string | null;
          annual_production_limit?: number | null;
          exploration_stage?: string | null;
          exploration_start?: string | null;
          exploration_end?: string | null;
          exploration_budget?: number | null;
          discovery_date?: string | null;
          geological_confidence?: string | null;
          estimated_reserves?: number | null;
          accessibility_rating?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          type?:
            | 'MINING_LICENSE'
            | 'EXPLORATION_LICENSE'
            | 'MINERAL_OCCURRENCE';
          mineral?: string;
          region?: string;
          city?: string | null;
          area?: number | null;
          price?: number | null;
          coordinates?: Json | null;
          images?: string[] | null;
          documents?: string[] | null;
          verified?: boolean;
          featured?: boolean;
          status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'SOLD';
          user_id?: string | null;
          license_subtype?: string | null;
          license_number?: string | null;
          license_expiry?: string | null;
          annual_production_limit?: number | null;
          exploration_stage?: string | null;
          exploration_start?: string | null;
          exploration_end?: string | null;
          exploration_budget?: number | null;
          discovery_date?: string | null;
          geological_confidence?: string | null;
          estimated_reserves?: number | null;
          accessibility_rating?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          deposit_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          deposit_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          deposit_id?: string;
          created_at?: string;
        };
      };
      views: {
        Row: {
          id: string;
          deposit_id: string;
          user_id: string | null;
          ip_address: string;
          user_agent: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          deposit_id: string;
          user_id?: string | null;
          ip_address: string;
          user_agent: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          deposit_id?: string;
          user_id?: string | null;
          ip_address?: string;
          user_agent?: string;
          created_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          deposit_id: string;
          name: string;
          type:
            | 'LICENSE'
            | 'GEOLOGICAL_SURVEY'
            | 'ENVIRONMENTAL'
            | 'FINANCIAL'
            | 'LEGAL'
            | 'OTHER';
          url: string;
          size: number;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          deposit_id: string;
          name: string;
          type:
            | 'LICENSE'
            | 'GEOLOGICAL_SURVEY'
            | 'ENVIRONMENTAL'
            | 'FINANCIAL'
            | 'LEGAL'
            | 'OTHER';
          url: string;
          size: number;
          uploaded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          deposit_id?: string;
          name?: string;
          type?:
            | 'LICENSE'
            | 'GEOLOGICAL_SURVEY'
            | 'ENVIRONMENTAL'
            | 'FINANCIAL'
            | 'LEGAL'
            | 'OTHER';
          url?: string;
          size?: number;
          uploaded_by?: string;
          created_at?: string;
        };
      };
      contact_requests: {
        Row: {
          id: string;
          deposit_id: string;
          from_user_id: string;
          to_user_id: string;
          message: string;
          phone: string | null;
          email: string | null;
          status: 'PENDING' | 'RESPONDED' | 'CLOSED';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deposit_id: string;
          from_user_id: string;
          to_user_id: string;
          message: string;
          phone?: string | null;
          email?: string | null;
          status?: 'PENDING' | 'RESPONDED' | 'CLOSED';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          deposit_id?: string;
          from_user_id?: string;
          to_user_id?: string;
          message?: string;
          phone?: string | null;
          email?: string | null;
          status?: 'PENDING' | 'RESPONDED' | 'CLOSED';
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type:
            | 'NEW_DEPOSIT'
            | 'PRICE_CHANGE'
            | 'AUCTION_START'
            | 'AUCTION_END'
            | 'MESSAGE'
            | 'SYSTEM';
          title: string;
          message: string;
          data: Json | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type:
            | 'NEW_DEPOSIT'
            | 'PRICE_CHANGE'
            | 'AUCTION_START'
            | 'AUCTION_END'
            | 'MESSAGE'
            | 'SYSTEM';
          title: string;
          message: string;
          data?: Json | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?:
            | 'NEW_DEPOSIT'
            | 'PRICE_CHANGE'
            | 'AUCTION_START'
            | 'AUCTION_END'
            | 'MESSAGE'
            | 'SYSTEM';
          title?: string;
          message?: string;
          data?: Json | null;
          read?: boolean;
          created_at?: string;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          name: string;
          properties: Json | null;
          user_id: string | null;
          session_id: string | null;
          timestamp: string;
          client_ip: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          properties?: Json | null;
          user_id?: string | null;
          session_id?: string | null;
          timestamp: string;
          client_ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          properties?: Json | null;
          user_id?: string | null;
          session_id?: string | null;
          timestamp?: string;
          client_ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      error_logs: {
        Row: {
          id: string;
          message: string;
          stack: string | null;
          severity: 'low' | 'medium' | 'high' | 'critical';
          fingerprint: string;
          count: number;
          context: Json | null;
          timestamp: string;
          client_ip: string | null;
          user_agent: string | null;
          user_id: string | null;
          session_id: string | null;
          url: string | null;
          component: string | null;
          action: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          message: string;
          stack?: string | null;
          severity: 'low' | 'medium' | 'high' | 'critical';
          fingerprint: string;
          count?: number;
          context?: Json | null;
          timestamp: string;
          client_ip?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
          session_id?: string | null;
          url?: string | null;
          component?: string | null;
          action?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          message?: string;
          stack?: string | null;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          fingerprint?: string;
          count?: number;
          context?: Json | null;
          timestamp?: string;
          client_ip?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
          session_id?: string | null;
          url?: string | null;
          component?: string | null;
          action?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
