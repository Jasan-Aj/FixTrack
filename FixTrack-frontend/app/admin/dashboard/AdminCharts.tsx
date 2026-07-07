"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#004ac6", "#565e74", "#943700", "#ba1a1a"];

interface CategoryData {
  name: string;
  value: number;
}

export function BarChartCard({ data }: { data: CategoryData[] }) {
  return (
    <div className="col-span-12 lg:col-span-8 bg-white p-6 rounded-2xl soft-shadow border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Resolution Trends</h3>
          <p className="text-sm text-outline">
            Complaint distribution across categories.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-outline">
            <span className="w-3 h-3 rounded-full bg-primary" /> Submissions
          </span>
        </div>
      </div>
      {data.length > 0 ? (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fontFamily: "Inter" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fontFamily: "Inter" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
              />
              <Bar
                dataKey="value"
                fill="#004ac6"
                radius={[6, 6, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-sm text-outline">
          No data yet
        </div>
      )}
    </div>
  );
}

export function PieChartCard({ data, total }: { data: CategoryData[]; total: number }) {
  return (
    <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-2xl soft-shadow border border-slate-100">
      <h3 className="text-lg font-bold text-on-surface mb-1">Issue Categories</h3>
      <p className="text-sm text-outline mb-6">Top reported departments.</p>
      {data.length > 0 ? (
        <>
          <div className="h-[200px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  strokeWidth={0}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[10px] text-outline uppercase tracking-widest font-semibold">
                Total
              </p>
              <p className="text-2xl font-bold text-on-surface">{total}</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {data.map((item, index) => (
              <div key={item.name} className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  {item.name}
                </span>
                <span className="text-xs font-bold text-on-surface">
                  {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-sm text-outline">
          No data yet
        </div>
      )}
    </div>
  );
}
