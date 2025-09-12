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
          accessibility_rating: number | null;
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
          accessibility_rating?: number | null;
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
          accessibility_rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          logo_url: string | null;
          website: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          established_year: number | null;
          employee_count: number | null;
          specializations: string[] | null;
          certifications: string[] | null;
          rating: number;
          verified: boolean;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          logo_url?: string | null;
          website?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          established_year?: number | null;
          employee_count?: number | null;
          specializations?: string[] | null;
          certifications?: string[] | null;
          rating?: number;
          verified?: boolean;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          logo_url?: string | null;
          website?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          established_year?: number | null;
          employee_count?: number | null;
          specializations?: string[] | null;
          certifications?: string[] | null;
          rating?: number;
          verified?: boolean;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      auctions: {
        Row: {
          id: string;
          deposit_id: string | null;
          title: string;
          description: string | null;
          starting_price: number;
          current_bid: number | null;
          bid_increment: number;
          reserve_price: number | null;
          start_date: string;
          end_date: string;
          status: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
          winner_id: string | null;
          total_bids: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deposit_id?: string | null;
          title: string;
          description?: string | null;
          starting_price: number;
          current_bid?: number | null;
          bid_increment?: number;
          reserve_price?: number | null;
          start_date: string;
          end_date: string;
          status?: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
          winner_id?: string | null;
          total_bids?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          deposit_id?: string | null;
          title?: string;
          description?: string | null;
          starting_price?: number;
          current_bid?: number | null;
          bid_increment?: number;
          reserve_price?: number | null;
          start_date?: string;
          end_date?: string;
          status?: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
          winner_id?: string | null;
          total_bids?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      auction_bids: {
        Row: {
          id: string;
          auction_id: string | null;
          bidder_id: string | null;
          amount: number;
          is_winning: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          auction_id?: string | null;
          bidder_id?: string | null;
          amount: number;
          is_winning?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          auction_id?: string | null;
          bidder_id?: string | null;
          amount?: number;
          is_winning?: boolean;
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          type: 'direct' | 'group' | 'support';
          title: string | null;
          description: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          last_message_at: string | null;
          last_message_text: string | null;
          deposit_id: string | null;
          is_archived: boolean;
        };
        Insert: {
          id?: string;
          type?: 'direct' | 'group' | 'support';
          title?: string | null;
          description?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string | null;
          last_message_text?: string | null;
          deposit_id?: string | null;
          is_archived?: boolean;
        };
        Update: {
          id?: string;
          type?: 'direct' | 'group' | 'support';
          title?: string | null;
          description?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string | null;
          last_message_text?: string | null;
          deposit_id?: string | null;
          is_archived?: boolean;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          type: 'text' | 'image' | 'file' | 'system' | 'offer';
          attachments: Json | null;
          created_at: string;
          updated_at: string;
          is_edited: boolean;
          is_deleted: boolean;
          reply_to_id: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          type?: 'text' | 'image' | 'file' | 'system' | 'offer';
          attachments?: Json | null;
          created_at?: string;
          updated_at?: string;
          is_edited?: boolean;
          is_deleted?: boolean;
          reply_to_id?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          type?: 'text' | 'image' | 'file' | 'system' | 'offer';
          attachments?: Json | null;
          created_at?: string;
          updated_at?: string;
          is_edited?: boolean;
          is_deleted?: boolean;
          reply_to_id?: string | null;
        };
      };
      conversation_participants: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: string;
          joined_at: string;
          last_read_at: string | null;
          is_muted: boolean;
          is_pinned: boolean;
          unread_count: number;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
          last_read_at?: string | null;
          is_muted?: boolean;
          is_pinned?: boolean;
          unread_count?: number;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
          last_read_at?: string | null;
          is_muted?: boolean;
          is_pinned?: boolean;
          unread_count?: number;
        };
      };
      message_read_receipts: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          read_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          read_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          read_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string | null;
          deposit_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          deposit_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          deposit_id?: string | null;
          created_at?: string;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          event_type: string;
          event_data: Json | null;
          user_id: string | null;
          session_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          event_data?: Json | null;
          user_id?: string | null;
          session_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          event_data?: Json | null;
          user_id?: string | null;
          session_id?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_direct_conversation: {
        Args: {
          p_user1_id: string;
          p_user2_id: string;
          p_deposit_id?: string;
        };
        Returns: string;
      };
      mark_messages_as_read: {
        Args: {
          p_conversation_id: string;
          p_user_id: string;
        };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
