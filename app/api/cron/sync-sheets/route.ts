// app/api/cron/daily-sheet/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Definisikan interface sesuai dengan skema tabel water_flow_logs di Supabase Anda
interface WaterFlowLog {
    id: number;
    device_id: string;
    flow_rate: number;
    total_liters: number;
    wifi_rssi: number;
    created_at: string;
}

// Interface untuk payload yang dikirim ke Google Apps Script
interface GoogleSheetPayload {
    tanggal: string;
    device_id: string;
    avg_flow_rate: number;
    total_liters: number;
    wifi_rssi: number;
}

export async function GET(request: Request) {
    // Proteksi API sederhana menggunakan token di query parameter
    const { searchParams } = new URL(request.url);
    const cronToken = searchParams.get('token');

    if (cronToken !== process.env.CRON_SECRET_TOKEN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const supabaseAdmin = getSupabaseAdmin();

        // 1. Ambil jangkauan waktu hari ini (00:00:00.000 sampai 23:59:59.999)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // 2. Tarik data log hari ini dari Supabase dengan tipe data <WaterFlowLog[]>
        const { data: logs, error } = await supabaseAdmin
            .from('water_flow_logs')
            .select('*')
            .gte('created_at', startOfDay.toISOString())
            .lte('created_at', endOfDay.toISOString())
            .order('created_at', { ascending: false }) as { data: WaterFlowLog[] | null; error: any };

        if (error) throw error;

        // Antisipasi jika tidak ada aktivitas sensor sama sekali sepanjang hari ini
        if (!logs || logs.length === 0) {
            return NextResponse.json({ message: "No data logs found for today" }, { status: 200 });
        }

        // 3. Ekstrak data & Kalkulasi Rangkuman Harian
        const latestLog = logs[0]; // Log terakhir menyimpan akumulasi volume (total_liters) tertinggi hari ini
        const deviceId = latestLog.device_id;
        const totalLitersToday = latestLog.total_liters;
        const wifiRssi = latestLog.wifi_rssi;

        // Hitung nilai rata-rata flow rate hari ini
        const totalFlowRate = logs.reduce((sum, item) => sum + (item.flow_rate || 0), 0);
        const avgFlowRate = totalFlowRate / logs.length;

        // Format tanggal lokal Indonesia untuk kolom pertama di Spreadsheet
        const tanggalIndo = new Date().toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Buat objek payload yang valid sesuai dengan interface GoogleSheetPayload
        const sheetPayload: GoogleSheetPayload = {
            tanggal: tanggalIndo,
            device_id: deviceId,
            avg_flow_rate: Number(avgFlowRate.toFixed(2)),
            total_liters: Number(totalLitersToday.toFixed(2)),
            wifi_rssi: wifiRssi
        };

        // 4. Lemparkan ke Google Spreadsheet Webhook URL
        const googleSheetsUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
        if (!googleSheetsUrl) {
            throw new Error("GOOGLE_SHEETS_WEBHOOK_URL belum didefinisikan di environment!");
        }

        const response = await fetch(googleSheetsUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sheetPayload)
        });

        if (!response.ok) {
            throw new Error(`Google Apps Script merespon dengan status: ${response.status}`);
        }

        const result = await response.json();

        return NextResponse.json({ status: "SUCCESS", result }, { status: 200 });

    } catch (error: any) {
        console.error("[CRON TYPE SCRIPT ERROR]:", error);
        return NextResponse.json({ status: "ERROR", message: error.message || "Internal Server Error" }, { status: 500 });
    }
}