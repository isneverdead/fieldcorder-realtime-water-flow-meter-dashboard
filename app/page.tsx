'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplet, Activity, Wifi, ShieldAlert } from 'lucide-react';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface TelemetryData {
  device_id: string;
  flow_rate: number;
  total_liters: number;
  wifi_rssi: number;
  created_at: string;
}

export default function Dashboard() {
  const [currentData, setCurrentData] = useState<TelemetryData>({
    device_id: '-',
    flow_rate: 0,
    total_liters: 0,
    wifi_rssi: 0,
    created_at: new Date().toISOString(),
  });

  const [chartData, setChartData] = useState<{ x: string; y: number }[]>([]);

  useEffect(() => {
    const fetchLatestData = async () => {
      const { data, error } = await supabase
        .from('water_flow_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('Gagal mengambil data awal:', error);
        return;
      }

      if (data && data.length > 0) {
        setCurrentData(data[0]);

        const formattedChartData = data
          .reverse()
          .map((item: TelemetryData) => ({
            x: new Date(item.created_at).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            y: item.flow_rate,
          }));
        setChartData(formattedChartData);
      }
    };

    fetchLatestData();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'water_flow_logs' },
        (payload) => {
          const newData = payload.new as TelemetryData;
          setCurrentData(newData);

          const timeString = new Date(newData.created_at).toLocaleTimeString(
            'id-ID',
            {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            },
          );

          setChartData((prevData) => {
            const updated = [
              ...prevData,
              { x: timeString, y: newData.flow_rate },
            ];
            if (updated.length > 20) updated.shift();
            return updated;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      id: 'realtime-flowrate',
      fontFamily: 'Inter, system-ui, sans-serif',
      animations: {
        enabled: true,

        dynamicAnimation: { speed: 1000 },
      },
      toolbar: { show: false },
      sparkline: { enabled: false },
    },
    stroke: { curve: 'smooth', width: 3.5 },
    colors: ['#0B3C5D'], // Navy Blue dari Guideline Proyek
    xaxis: {
      type: 'category',
      labels: {
        style: { colors: '#4F5D73', fontSize: '11px', fontWeight: 500 },
      },
      axisBorder: { show: true, color: '#CBD5E1' },
      axisTicks: { show: true, color: '#CBD5E1' },
    },
    yaxis: {
      min: 0,
      labels: {
        formatter: (val) => `${val.toFixed(1)} L/m`,
        style: { colors: '#4F5D73', fontSize: '11px', fontWeight: 500 },
      },
    },
    grid: {
      borderColor: '#F1F5F9',
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
    },
    markers: {
      size: 0,
      colors: ['#0B3C5D'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: { size: 5 },
    },
    dataLabels: { enabled: false },
    tooltip: {
      theme: 'light',
      x: { show: true },
      marker: { show: true },
    },
  };

  return (
    <div className='min-h-screen bg-[#F8FAFC] p-4 md:p-8 text-[#4F5D73] font-sans antialiased selection:bg-[#0B3C5D]/10'>
      <div className='mx-auto max-w-6xl space-y-6'>
        {/* Top Branding Bar */}
        <div className='flex items-center justify-between bg-white px-6 py-3 rounded-lg border border-slate-200/80 shadow-sm'>
          <div className='flex items-center space-x-3'>
            <div className='h-3 w-3 rounded-full bg-[#0B3C5D]' />
            <span className='text-xs font-bold uppercase tracking-wider text-[#0B3C5D]'>
              KSCS PACKAGE 2 — PP-KR JOINT VENTURE
            </span>
          </div>
          <div className='flex items-center space-x-2 text-xs font-semibold text-[#4F5D73]'>
            <span className='relative flex h-2 w-2'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
              <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500'></span>
            </span>
            <span className='hidden sm:inline'>REALTIME TELEMETRY SYSTEM</span>
          </div>
        </div>

        {/* Header Title Section */}
        <div className='bg-gradient-to-r from-[#0B3C5D] to-[#1E4E70] rounded-xl p-6 md:p-8 text-white shadow-md relative overflow-hidden'>
          <div className='absolute right-0 top-0 translate-x-10 -translate-y-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none' />
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10'>
            <div>
              <div className='inline-flex items-center space-x-2 bg-[#F2C94C] text-[#0B3C5D] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded mb-3 shadow-sm'>
                <ShieldAlert className='h-3 w-3' />
                <span>SAFETY FIRST — TELEMETRY CONTROL</span>
              </div>
              <h1 className='text-2xl md:text-3xl font-extrabold tracking-tight text-white'>
                Smart Water Flowmeter
              </h1>
              <p className='text-slate-200/90 text-sm mt-1 max-w-xl font-medium'>
                Karian Dam - Serpong Water Conveyance System Package II. Monitor
                status debit pipa secara berkala dan dinamis.
              </p>
            </div>
            <div className='bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-4 min-w-[200px]'>
              <span className='text-[10px] text-slate-300 font-bold block uppercase tracking-wider'>
                IDENTIFIKASI PERANGKAT
              </span>
              <span className='text-base font-bold text-[#F2C94C] block mt-0.5 tracking-wide'>
                {currentData.device_id}
              </span>
            </div>
          </div>
        </div>

        {/* KPI Grid Panel */}
        <div className='grid gap-5 sm:grid-cols-2 md:grid-cols-3'>
          {/* Card 1: Debit Aliran */}
          <Card className='border-slate-200 shadow-sm bg-white hover:border-[#0B3C5D]/40 transition-all duration-300 group'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
              <CardTitle className='text-xs font-bold tracking-wider uppercase text-[#4F5D73]'>
                DEBIT ALIRAN AKTUAL
              </CardTitle>
              <div className='p-2 rounded bg-[#0B3C5D]/5 text-[#0B3C5D] group-hover:bg-[#0B3C5D] group-hover:text-white transition-colors duration-300'>
                <Activity className='h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-black text-[#0B3C5D] tracking-tight'>
                {currentData.flow_rate.toFixed(2)}
                <span className='text-sm font-bold text-[#4F5D73] ml-1.5 uppercase tracking-wide'>
                  L/min
                </span>
              </div>
              <div className='w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden'>
                <div
                  className='bg-[#0B3C5D] h-full transition-all duration-500'
                  style={{
                    width: `${Math.min((currentData.flow_rate / 50) * 100, 100)}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Total Volume Akumulasi */}
          <Card className='border-slate-200 shadow-sm bg-white hover:border-[#0B3C5D]/40 transition-all duration-300 group'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
              <CardTitle className='text-xs font-bold tracking-wider uppercase text-[#4F5D73]'>
                AKUMULASI VOLUME
              </CardTitle>
              <div className='p-2 rounded bg-[#0B3C5D]/5 text-[#0B3C5D] group-hover:bg-[#0B3C5D] group-hover:text-white transition-colors duration-300'>
                <Droplet className='h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-black text-[#0B3C5D] tracking-tight'>
                {currentData.total_liters.toFixed(1)}
                <span className='text-sm font-bold text-[#4F5D73] ml-1.5 uppercase tracking-wide'>
                  Liter
                </span>
              </div>
              <p className='text-[11px] text-[#4F5D73]/70 font-semibold mt-4 flex items-center space-x-1'>
                <span>Log Total Volume Penyaluran Air</span>
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Sinyal WiFi */}
          <Card className='border-slate-200 shadow-sm bg-white hover:border-[#0B3C5D]/40 transition-all duration-300 group sm:col-span-2 md:col-span-1'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
              <CardTitle className='text-xs font-bold tracking-wider uppercase text-[#4F5D73]'>
                KEKUATAN SINYAL RADIO
              </CardTitle>
              <div className='p-2 rounded bg-[#0B3C5D]/5 text-[#0B3C5D] group-hover:bg-[#0B3C5D] group-hover:text-white transition-colors duration-300'>
                <Wifi className='h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-black text-[#0B3C5D] tracking-tight'>
                {currentData.wifi_rssi}
                <span className='text-sm font-bold text-[#4F5D73] ml-1.5 uppercase tracking-wide'>
                  dBm
                </span>
              </div>
              <p className='text-[11px] font-bold mt-4 text-emerald-600 flex items-center space-x-1'>
                <span>Koneksi Transmisi NodeMCU Stabil</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Real-Time Line Chart Section */}
        <Card className='border-slate-200 shadow-sm p-5 md:p-6 bg-white'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-5 gap-2'>
            <div>
              <h3 className='text-base font-extrabold text-[#0B3C5D] uppercase tracking-wider'>
                Grafik Aliran Air Terkini
              </h3>
              <p className='text-xs text-[#4F5D73]/80 font-medium mt-0.5'>
                Pembaruan otomatis langsung terikat via replikasi PostgreSQL
                Supabase.
              </p>
            </div>
            <div className='flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-xs font-bold text-[#0B3C5D] self-start sm:self-center'>
              <div className='h-2 w-2 rounded-full bg-[#0B3C5D] animate-pulse' />
              <span>LIVE FEED RATE</span>
            </div>
          </div>
          <div className='w-full min-h-[350px]'>
            <Chart
              options={chartOptions}
              series={[{ name: 'Flow Rate', data: chartData }]}
              type='line'
              height={350}
            />
          </div>
        </Card>

        {/* Footer Company Identity */}
        <div className='text-center text-[10px] font-bold text-[#4F5D73]/60 tracking-widest uppercase pt-4 border-t border-slate-200'>
          © {new Date().getFullYear()} Karian Dam-Serpong Water Conveyance
          System Project Package II. All Rights Reserved.
        </div>
      </div>
    </div>
  );
}
