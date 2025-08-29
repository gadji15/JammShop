export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: "customer" | "admin" | "super_admin" | "vendor"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "customer" | "admin" | "super_admin" | "vendor"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "customer" | "admin" | "super_admin" | "vendor"
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          parent_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          short_description: string | null
          sku: string | null
          category_id: string | null
          supplier_id: string | null
          price: number
          compare_price: number | null
          cost_price: number | null
          stock_quantity: number
          low_stock_threshold: number
          weight: number | null
          dimensions: any | null
          images: string[]
          variants: any[]
          seo_title: string | null
          seo_description: string | null
          is_active: boolean
          is_featured: boolean
          external_id: string | null
          external_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          sku?: string | null
          category_id?: string | null
          supplier_id?: string | null
          price: number
          compare_price?: number | null
          cost_price?: number | null
          stock_quantity?: number
          low_stock_threshold?: number
          weight?: number | null
          dimensions?: any | null
          images?: string[]
          variants?: any[]
          seo_title?: string | null
          seo_description?: string | null
          is_active?: boolean
          is_featured?: boolean
          external_id?: string | null
          external_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          sku?: string | null
          category_id?: string | null
          supplier_id?: string | null
          price?: number
          compare_price?: number | null
          cost_price?: number | null
          stock_quantity?: number
          low_stock_threshold?: number
          weight?: number | null
          dimensions?: any | null
          images?: string[]
          variants?: any[]
          seo_title?: string | null
          seo_description?: string | null
          is_active?: boolean
          is_featured?: boolean
          external_id?: string | null
          external_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          type: "internal" | "alibaba" | "jumia" | "other"
          api_endpoint: string | null
          api_key: string | null
          contact_email: string | null
          contact_phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: "internal" | "alibaba" | "jumia" | "other"
          api_endpoint?: string | null
          api_key?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: "internal" | "alibaba" | "jumia" | "other"
          api_endpoint?: string | null
          api_key?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Product = Database["public"]["Tables"]["products"]["Row"]
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"]
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"]

export type Category = Database["public"]["Tables"]["categories"]["Row"]
export type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"]
export type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"]

export type Supplier = Database["public"]["Tables"]["suppliers"]["Row"]
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export interface ProductWithCategory extends Product {
  categories: Category | null
}

export interface ProductWithDetails extends Product {
  categories: Category | null
  suppliers: Supplier | null
}
