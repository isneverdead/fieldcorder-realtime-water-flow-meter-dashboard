'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplet, Activity, Wifi } from 'lucide-react'; // Menggunakan lucide-react untuk ikon KPI
import dynamic from 'next/dynamic';

// Mematikan SSR (Server-Side Rendering) khusus untuk ApexCharts karena butuh objek 'window' di browser
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
    // Berlangganan ke perubahan database tabel Supabase secara Real-Time via Postgres Changes
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
            if (updated.length > 20) updated.shift(); // Maksimal 20 titik data agar chart bergeser smooth
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
      animations: {
        enabled: true,

        dynamicAnimation: { speed: 1000 },
      },
      toolbar: { show: false },
    },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#2563eb'],
    xaxis: {
      type: 'category',
      labels: { style: { colors: '#64748b' } },
    },
    yaxis: {
      min: 0,
      labels: {
        formatter: (val) => val.toFixed(2),
        style: { colors: '#64748b' },
      },
    },
    grid: { borderColor: '#f1f5f9' },
    dataLabels: { enabled: false },
  };

  return (
    <div className='min-h-screen bg-slate-50 p-6 md:p-12 text-slate-900'>
      <div className='mx-auto max-w-6xl space-y-8'>
        {/* Bagian Header Dashboard */}
        <div className='flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight text-slate-950'>
              Smart Water Flowmeter
            </h1>
            <p className='text-slate-500 mt-1'>
              Sumber Data Utama: Supabase Realtime Database Replication.
            </p>
          </div>
          <div className='mt-4 md:mt-0 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2'>
            <span className='text-sm text-blue-700 font-medium'>
              Device ID: {currentData.device_id}
            </span>
          </div>
        </div>

        {/* Bagian KPI Grid (Shadcn/ui Cards) */}
        <div className='grid gap-6 md:grid-cols-3'>
          {/* Card 1: Debit Aliran */}
          <Card className='border-slate-200 shadow-sm bg-white'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium text-slate-500'>
                Debit Aliran
              </CardTitle>
              <Activity className='h-4 w-4 text-blue-600' />
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-slate-950'>
                {currentData.flow_rate.toFixed(2)}
                <span className='text-base font-normal text-slate-500 ml-1'>
                  L/min
                </span>
              </div>
              <p className='text-xs text-slate-400 mt-1'>
                Kecepatan aliran air aktual
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Total Volume Akumulasi */}
          <Card className='border-slate-200 shadow-sm bg-white'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium text-slate-500'>
                Total Volume
              </CardTitle>
              <Droplet className='h-4 w-4 text-blue-600' />
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-slate-950'>
                {currentData.total_liters.toFixed(2)}
                <span className='text-base font-normal text-slate-500 ml-1'>
                  Liter
                </span>
              </div>
              <p className='text-xs text-slate-400 mt-1'>
                Akumulasi air terpakai
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Sinyal WiFi */}
          <Card className='border-slate-200 shadow-sm bg-white'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium text-slate-500'>
                Sinyal WiFi
              </CardTitle>
              <Wifi className='h-4 w-4 text-blue-600' />
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-slate-950'>
                {currentData.wifi_rssi}
                <span className='text-base font-normal text-slate-500 ml-1'>
                  dBm
                </span>
              </div>
              <p className='text-xs text-slate-400 mt-1'>
                Kekuatan sinyal radio NodeMCU
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bagian Grafik Garis Real-Time */}
        <Card className='border-slate-200 shadow-sm p-4 md:p-6 bg-white'>
          <div className='mb-4'>
            <h3 className='text-lg font-semibold text-slate-950'>
              Grafik Aliran Air Terkini
            </h3>
            <p className='text-xs text-slate-400'>
              Diperbarui otomatis setiap telemetri masuk dari ESP8266
            </p>
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
      </div>
    </div>
  );
}
