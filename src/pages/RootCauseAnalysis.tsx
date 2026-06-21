import React, { useMemo, useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#eab308', '#facc15', '#10b981', '#ef4444'];

export default function RootCauseAnalysis() {
  const { interventions } = useDataStore();
  const [filterPbdType, setFilterPbdType] = useState<string>('');

  const filteredInterventions = useMemo(() => {
    if (!filterPbdType) return interventions;
    return interventions.filter(i => i.pbdType === filterPbdType);
  }, [interventions, filterPbdType]);

  const causesData = useMemo(() => {
    const causes: Record<string, number> = {};
    let total = 0;

    filteredInterventions.forEach(inv => {
      inv.punca.forEach(p => {
        causes[p] = (causes[p] || 0) + 1;
        total++;
      });
      if (inv.puncaLain) {
        causes[inv.puncaLain] = (causes[inv.puncaLain] || 0) + 1;
        total++;
      }
    });

    return Object.entries(causes)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
  }, [filteredInterventions]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Analisis Punca & Isu</h2>
        <p className="text-slate-500">Menganalisis punca utama kelemahan murid.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 max-w-sm">
        <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Sesi PBD:</label>
        <select 
          value={filterPbdType}
          onChange={e => setFilterPbdType(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-gold-500 transition-all font-medium text-slate-800"
        >
          <option value="">Semua Sesi</option>
          <option value="PBD1">PBD Pertengahan</option>
          <option value="PBD2">PBD Akhir</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Causes Pie Chart */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-lg">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Top 10 Punca (Pecahan peratusan)</h3>
          {causesData.length > 0 ? (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={causesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={130}
                    innerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {causesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              Tiada rekod punca dijumpai.
            </div>
          )}
        </div>

        {/* Issues List */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-lg">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Isu Utama yang Direkodkan</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
            {filteredInterventions.filter(i => i.isu).length > 0 ? (
              filteredInterventions.filter(i => i.isu).map((inv) => (
                <div key={inv.id} className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold px-3 py-1.5 bg-gold-400/20 text-yellow-800 rounded-full border border-gold-400/30">
                      {inv.kelas} {inv.mataPelajaran}
                    </span>
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{inv.date}</span>
                  </div>
                  <p className="text-slate-700 font-medium leading-relaxed">"{inv.isu}"</p>
                </div>
              ))
            ) : (
              <div className="h-32 flex items-center justify-center text-slate-500 italic">
                Tiada isu dicatatkan.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
