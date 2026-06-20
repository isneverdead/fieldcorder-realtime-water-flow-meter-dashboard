// app/api/cron/sync-sheets/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
    try {
        // Validasi otentikasi header bearer token Cron Vercel
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response('Unauthorized', { status: 401 });
        }

        // Kalkulasi timestamp 24 jam ke belakang
        const batasWaktu24Jam = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // 1. Tarik log kolektif dari database Supabase
        const { data: logs, error } = await supabase
            .from('water_flow_logs')
            .select('*')
            .gte('created_at', batasWaktu24Jam);

        if (error) throw error;

        if (!logs || logs.length === 0) {
            return NextResponse.json({ message: "Tidak ada data baru dalam 24 jam terakhir." });
        }

        // 2. Kirim paket array data secara serentak (Batch POST) ke Google Sheets
        const response = await fetch(process.env.GOOGLE_APPS_SCRIPT_URL!, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logs),
        });

        const hasilGoogle = await response.json();
        return NextResponse.json({ message: "Sinkronisasi harian ke Google Sheets berhasil!", detail: hasilGoogle });

    } catch (error: any) {
        console.error("[CRON ERROR]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}