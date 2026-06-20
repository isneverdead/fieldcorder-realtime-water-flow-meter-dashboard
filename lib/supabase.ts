// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 1. Ini client utama untuk UI Dashboard (Aman di-import di 'use client')
// Kunci anonim terikat dengan RLS PostgreSQL Anda
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 2. Ini client khusus untuk API Route/Server Backend (Untuk ESP8266)
// Hanya buat instance ini jika dipanggil di server
export const getSupabaseAdmin = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment backend!")
    }
    return createClient(supabaseUrl, serviceRoleKey)
}