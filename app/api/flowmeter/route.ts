// app/api/flowmeter/route.ts
import { NextResponse } from 'next/server';
// Ubah impor ini untuk mengambil fungsi admin
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const { device_id, flow_rate, total_liters, wifi_rssi } = payload;

        // Inisialisasi instance admin khusus untuk kebutuhan backend server
        const supabaseAdmin = getSupabaseAdmin();

        // Gunakan supabaseAdmin untuk memasukkan data telemetri ke tabel Supabase
        const { error } = await supabaseAdmin
            .from('water_flow_logs')
            .insert([{ device_id, flow_rate, total_liters, wifi_rssi }]);

        if (error) throw error;

        // Integrasi Google Sheets bisa Anda letakkan langsung di bawah sini nanti jika sudah siap

        return NextResponse.json({ status: "SUCCESS", message: "Logged to Supabase" }, { status: 200 });
    } catch (error: any) {
        console.error("[API WEBHOOK ERROR]:", error);
        return NextResponse.json({ status: "ERROR", message: error.message }, { status: 500 });
    }
}