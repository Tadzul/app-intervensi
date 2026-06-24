import React, { useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { Users, BookOpen, FileText, CheckSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { teachers, subjects, interventions } = useDataStore();
  const [filterPbdType, setFilterPbdType] = useState('PBD Pertengahan');

  const filteredSubjects = subjects.filter(s => filterPbdType ? s.pbdType === filterPbdType : true);
  const filteredInterventions = interventions.filter(inv => filterPbdType ? inv.pbdType === filterPbdType : true);

  const totalTeachers = teachers.length;
  const totalSubjects = new Set(filteredSubjects.map(s => s.mataPelajaran)).size;
  const totalInterventions = filteredInterventions.length;
  const totalClasses = new Set(filteredSubjects.map(s => s.kelas)).size;

  const stats = [
    { label: 'Jumlah Guru', value: totalTeachers, icon: Users, color: 'from-blue-600 to-blue-400', shadow: 'shadow-blue-500/30' },
    { label: 'Mata Pelajaran', value: totalSubjects, icon: BookOpen, color: 'from-emerald-600 to-emerald-400', shadow: 'shadow-emerald-500/30' },
    { label: 'Borang Intervensi', value: totalInterventions, icon: FileText, color: 'from-purple-600 to-purple-400', shadow: 'shadow-purple-500/30' },
    { label: 'Kelas Terlibat', value: totalClasses, icon: CheckSquare, color: 'from-amber-500 to-yellow-400', shadow: 'shadow-amber-500/30' },
  ];

  // Prepare chart data
  const tpData = [1, 2, 3, 4, 5, 6].map(tp => {
    let total = 0;
    filteredInterventions.forEach(inv => {
      total += Number(inv[`tp${tp}` as keyof typeof inv] || 0);
    });
    return { name: `TP${tp}`, jumlah: total };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h2>
          <p className="text-slate-500">Ringkasan analisis intervensi akademik secara keseluruhan.</p>
        </div>
        
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-3">
          <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Sesi PBD:</label>
          <select 
            value={filterPbdType}
            onChange={e => setFilterPbdType(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-gold-500 transition-all font-medium text-slate-800"
          >
            <option value="">Semua Sesi</option>
            <option value="PBD Pertengahan">PBD Pertengahan</option>
            <option value="PBD Akhir">PBD Akhir</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            className={`rounded-2xl p-6 flex flex-col justify-center transform transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] shadow-lg hover:shadow-2xl ${stat.shadow} bg-gradient-to-br ${stat.color} text-white cursor-default border border-white/10 relative overflow-hidden`}
          >
            {/* Glossy overlay effect for premium look */}
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 bg-black opacity-10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center relative z-10 w-full mb-2">
              <div className="p-3.5 rounded-xl bg-white/20 backdrop-blur-md text-white mr-4 shadow-inner border border-white/30">
                <stat.icon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white/90 uppercase tracking-wider mb-0.5 drop-shadow-sm">{stat.label}</p>
                <h3 className="text-4xl font-black text-white leading-none tracking-tight drop-shadow-md">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-lg">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Pencapaian Tahap Penguasaan (TP) Keseluruhan</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tpData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              <Bar dataKey="jumlah" name="Jumlah Murid" fill="#1e293b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
