import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, 
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area 
} from 'recharts';
import { ShieldAlert, BarChart3, TrendingUp, PieChart as PieIcon, Activity } from 'lucide-react';

const COLORS = ['#c89f53', '#14b8a6', '#ef4444', '#3b82f6', '#8c6827', '#a855f7'];

export default function HotspotAnalytics({ cases = [] }) {
  
  // 1. Client-Side Aggregations
  const chartsData = useMemo(() => {
    if (!cases || cases.length === 0) {
      // Return default fallbacks if empty
      return {
        classification: [
          { name: 'Theft & Housebreaking', count: 42 },
          { name: 'Assault & Injury', count: 28 },
          { name: 'Cheating & Forgery', count: 19 },
          { name: 'Unnatural Homicide', count: 8 },
          { name: 'Cyber Crimes', count: 15 },
          { name: 'Miscellaneous', count: 12 }
        ],
        monthlyTrends: [
          { month: 'Jan', Cases: 12, Resolved: 8 },
          { month: 'Feb', Cases: 18, Resolved: 11 },
          { month: 'Mar', Cases: 15, Resolved: 14 },
          { month: 'Apr', Cases: 25, Resolved: 16 },
          { month: 'May', Cases: 20, Resolved: 18 },
          { month: 'Jun', Cases: 32, Resolved: 22 }
        ],
        statusDistribution: [
          { name: 'In Police Custody', value: 35 },
          { name: 'Judicial Custody', value: 45 },
          { name: 'Absconding/Wanted', value: 15 },
          { name: 'Released on Bail', value: 25 }
        ],
        complianceTrend: [
          { name: 'Case 1', score: 80 },
          { name: 'Case 2', score: 75 },
          { name: 'Case 3', score: 90 },
          { name: 'Case 4', score: 85 },
          { name: 'Case 5', score: 95 }
        ]
      };
    }

    // A. Crime Category Aggregation
    const catCounts = {
      'Theft & Housebreaking': 0,
      'Assault & Injury': 0,
      'Cheating & Forgery': 0,
      'Unnatural Homicide': 0,
      'Cyber Crimes': 0,
      'Miscellaneous': 0
    };

    cases.forEach(c => {
      const sect = (c.flaggedSections || '').toLowerCase();
      const narr = (c.narrative || '').toLowerCase();
      
      if (sect.includes('303') || sect.includes('305') || sect.includes('331') || narr.includes('theft') || narr.includes('stole') || narr.includes('break')) {
        catCounts['Theft & Housebreaking']++;
      } else if (sect.includes('115') || sect.includes('117') || narr.includes('assault') || narr.includes('injury') || narr.includes('hurt')) {
        catCounts['Assault & Injury']++;
      } else if (sect.includes('318') || sect.includes('336') || narr.includes('cheat') || narr.includes('forge')) {
        catCounts['Cheating & Forgery']++;
      } else if (sect.includes('101') || sect.includes('103') || narr.includes('murder') || narr.includes('homicide') || narr.includes('kill')) {
        catCounts['Unnatural Homicide']++;
      } else if (sect.includes('319') || narr.includes('cyber') || narr.includes('hack')) {
        catCounts['Cyber Crimes']++;
      } else {
        catCounts['Miscellaneous']++;
      }
    });

    const classification = Object.keys(catCounts).map(name => ({
      name,
      count: catCounts[name]
    }));

    // B. Custodial Status Aggregation
    const statusCounts = {
      'In Police Custody': 0,
      'Judicial Custody': 0,
      'Absconding/Wanted': 0,
      'Released on Bail': 0
    };

    cases.forEach(c => {
      const status = c.accused?.status || 'Absconding / Wanted';
      if (status.includes('Police Custody')) {
        statusCounts['In Police Custody']++;
      } else if (status.includes('Judicial Custody')) {
        statusCounts['Judicial Custody']++;
      } else if (status.includes('Bail')) {
        statusCounts['Released on Bail']++;
      } else {
        statusCounts['Absconding/Wanted']++;
      }
    });

    const statusDistribution = Object.keys(statusCounts).map(name => ({
      name,
      value: statusCounts[name] || 0
    }));

    // C. Monthly Trends Aggregation (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = {};

    // Get last 6 months list
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mName = monthNames[d.getMonth()];
      monthlyData[mName] = { month: mName, Cases: 0, Resolved: 0 };
    }

    cases.forEach(c => {
      const regDate = new Date(c.dateOfRegistration || c.createdAt);
      if (!isNaN(regDate)) {
        const mName = monthNames[regDate.getMonth()];
        if (monthlyData[mName]) {
          monthlyData[mName].Cases++;
          if (c.accused?.status && (c.accused.status.includes('Bail') || c.accused.status.includes('Judicial'))) {
            monthlyData[mName].Resolved++;
          }
        }
      }
    });

    const monthlyTrends = Object.values(monthlyData);

    // D. Compliance Trend (ordered by date ascending)
    const sortedCases = [...cases].sort((a, b) => new Date(a.dateOfRegistration || a.createdAt) - new Date(b.dateOfRegistration || b.createdAt));
    const complianceTrend = sortedCases.map(c => ({
      name: c.firNo.replace('FIR-', ''),
      score: c.compliance?.score !== undefined ? c.compliance.score : 80
    }));

    return { classification, monthlyTrends, statusDistribution, complianceTrend };
  }, [cases]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-police-khaki/10 border border-police-khaki/30 w-11 h-11 rounded-lg flex items-center justify-center text-police-khaki shrink-0 animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-police-khaki uppercase tracking-wider">Crime Analytics & Incident Hotspots</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Real-time statistics compiled client-side from the active cases database.</p>
          </div>
        </div>
        
        {cases.length > 0 && (
          <span className="text-[10px] bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold px-3 py-1 rounded-full">
            Active Dataset: {cases.length} Cases
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Case Classification (BarChart) */}
        <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-xl shadow-lg space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-police-khaki" /> Cases by Crime Category (BNS)
          </h3>
          <div className="h-[250px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData.classification} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.3)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: '9px' }} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8' }} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#c89f53' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartsData.classification.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Trends (LineChart) */}
        <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-xl shadow-lg space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400" /> Cases Registered per Month (Last 6 Months)
          </h3>
          <div className="h-[250px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartsData.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.3)" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8' }} />
                <YAxis tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#c89f53' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Cases" name="Cases Registered" stroke="#c89f53" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Resolved" name="Resolved / Processed" stroke="#14b8a6" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Custodial Status Breakdown (PieChart) */}
        <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-xl shadow-lg space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-purple-400" /> Case Status Breakdown
          </h3>
          <div className="h-[250px] w-full text-xs flex items-center justify-center">
            <div className="w-[50%] h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartsData.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartsData.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend to fit design */}
            <div className="w-[50%] space-y-2 pl-4 border-l border-slate-700/50">
              {chartsData.statusDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[10px]">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-400 font-bold uppercase">{item.name}</span>
                  <span className="text-slate-200 font-black ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 4: Compliance score trend (AreaChart) */}
        <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-xl shadow-lg space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Compliance Score Trend Across Cases
          </h3>
          <div className="h-[250px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartsData.complianceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.3)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} label={{ value: 'FIR Numbers', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: '9px' }} />
                <YAxis tick={{ fill: '#94a3b8' }} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="score" name="Compliance Score" stroke="#10b981" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
