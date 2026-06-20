// app/api/flowmeter/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const { device_id, flow_rate, total_liters, wifi_rssi } = payload;

        // Memasukkan data telemetri ke tabel Supabase
        const { error } = await supabase
            .from('water_flow_logs')
            .insert([{ device_id, flow_rate, total_liters, wifi_rssi }]);

        if (error) throw error;

        return NextResponse.json({ status: "SUCCESS", message: "Logged to Supabase" }, { status: 200 });
    } catch (error: any) {
        console.error("[API WEBHOOK ERROR]:", error);
        return NextResponse.json({ status: "ERROR", message: error.message }, { status: 500 });
    }
}