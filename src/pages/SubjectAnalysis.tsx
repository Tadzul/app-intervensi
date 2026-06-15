import React, { useState, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SubjectAnalysis() {
  const { interventions } = useDataStore();
  const [filterTahap, setFilterTahap] = useState('Semua');

  const subjectsData = useMemo(() => {
    const data: Record<string, { subject: string; tp12: number; tp36: number; total: number }> = {};
    
    interventions.forEach(inv => {
      if (filterTahap !== 'Semua' && inv.tahap !== filterTahap) return;
      
      const sub = inv.mataPelajaran;
      if (!data[sub]) {
        data[sub] = { subject: sub, tp12: 0, tp36: 0, total: 0 };
      }
      
      const t12 = Number(inv.tp1) + Number(inv.tp2);
      const t36 = Number(inv.tp3) + Number(inv.tp4) + Number(inv.tp5) + Number(inv.tp6);
      
      data[sub].tp12 += t12;
      data[sub].tp36 += t36;
      data[sub].total += t12 + t36;
    });

    return Object.values(data).sort((a,b) => b.total - a.total);
  }, [interventions, filterTahap]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Analisis Mata Pelajaran</h2>
        <p className="text-slate-500">Perbandingan prestasi murid bagi setiap mata pelajaran.</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h3 className="text-lg font-bold text-slate-800">Prestasi Keseluruhan Mata Pelajaran</h3>
          
          <select 
            value={filterTahap}
            onChange={e => setFilterTahap(e.target.value)}
            className="px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all shadow-sm cursor-pointer"
          >
            <option value="Semua">Semua Tahap</option>
            <option value="Tahap 1">Tahap 1 Sahaja</option>
            <option value="Tahap 2">Tahap 2 Sahaja</option>
          </select>
        </div>

        {subjectsData.length > 0 ? (
          <div className="h-[500px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={subjectsData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                 <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                 <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} width={130} tick={{ fontSize: 13, fill: '#334155', fontWeight: 600 }} />
                 <Tooltip 
                   cursor={{ fill: '#f8fafc' }}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                 />
                 <Legend wrapperStyle={{ paddingTop: '20px' }} />
                 <Bar dataKey="tp36" name="Menguasai (TP3-6)" stackId="a" fill="#10b981" radius={[0, 6, 6, 0]} />
                 <Bar dataKey="tp12" name="Belum Menguasai (TP1-2)" stackId="a" fill="#ef4444" radius={[0, 6, 6, 0]} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500 italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            Tiada data untuk dipaparkan.
          </div>
        )}
      </div>
    </div>
  );
}
