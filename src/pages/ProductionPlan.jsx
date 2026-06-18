import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

function DonutChart({ rate }) {
  const r = 18, cx = 22, cy = 22;
  const circ = 2 * Math.PI * r;
  const filled = (Math.min(rate, 100) / 100) * circ;
  const color = rate >= 90 ? '#16a34a' : rate >= 70 ? '#d97706' : '#dc2626';
  return (
    <svg width={44} height={44} viewBox="0 0 44 44">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={4} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={10} fontWeight="600" fill={color}>{rate}%</text>
    </svg>
  );
}

function AddPlanModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({ date: '2024-01-22', target: '', actual: '', project: '', notes: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
    setForm({ date: '2024-01-22', target: '', actual: '', project: '', notes: '' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增生产计划">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">目标数量</label>
            <input type="number" min="0" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">实际完成</label>
            <input type="number" min="0" value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">关联项目/订单</label>
          <input type="text" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}
            placeholder="项目名称（选填）"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存</button>
        </div>
      </form>
    </Modal>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm">
      <div className="font-medium text-gray-700 mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name === 'target' ? '目标' : '实际'}：</span>
          <span className="font-semibold text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ProductionPlan() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const plans = [...state.productionPlans].sort((a, b) =>
    a.date.localeCompare(b.date) || (a.project || '').localeCompare(b.project || '')
  );

  // Aggregate by date for chart
  const chartData = Object.values(
    plans.reduce((acc, p) => {
      const key = p.date.slice(5);
      if (!acc[key]) acc[key] = { date: key, target: 0, actual: 0 };
      acc[key].target += p.target;
      acc[key].actual += p.actual;
      return acc;
    }, {})
  );

  const handleAddPlan = (form) => {
    dispatch({ type: 'ADD_PRODUCTION_PLAN', payload: {
      id: `PLAN-${Date.now()}`, date: form.date,
      target: Number(form.target), actual: Number(form.actual),
      project: form.project, notes: form.notes,
    }});
  };

  const handleEditSave = (plan) => {
    dispatch({ type: 'UPDATE_PRODUCTION_PLAN', payload: { id: plan.id, ...editValues } });
    setEditId(null);
  };

  const handleDelete = (id) => {
    dispatch({ type: 'DELETE_PRODUCTION_PLAN', payload: id });
  };

  // By-project aggregation
  const byProject = {};
  plans.forEach((p) => {
    const proj = p.project || '未指定';
    if (!byProject[proj]) byProject[proj] = { target: 0, actual: 0 };
    byProject[proj].target += p.target;
    byProject[proj].actual += p.actual;
  });

  const totalTarget = plans.reduce((s, p) => s + p.target, 0);
  const totalActual = plans.reduce((s, p) => s + p.actual, 0);
  const overallRate = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

  // Group by date for visual grouping in table
  const dateGroups = plans.reduce((acc, p) => {
    if (!acc[p.date]) acc[p.date] = [];
    acc[p.date].push(p);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">生产计划</h1>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
          + 新增计划
        </button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {['工厂总览', '按项目/订单'].map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === i ? 'border-slate-700 text-slate-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 flex items-center gap-4">
              <DonutChart rate={overallRate} />
              <div>
                <div className="text-sm text-gray-500">整体达成率</div>
                <div className="text-xs text-gray-400 mt-0.5">{totalActual} / {totalTarget} 台</div>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
              <div className="text-3xl font-semibold text-gray-900">{totalTarget}</div>
              <div className="text-sm text-gray-500 mt-1">累计目标产量</div>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
              <div className="text-3xl font-semibold text-gray-900">{totalActual}</div>
              <div className="text-sm text-gray-500 mt-1">累计实际完成</div>
            </div>
          </div>

          {/* Line Chart */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">产能趋势（目标 vs 实际，按日汇总）</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} width={28} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => v === 'target' ? '目标' : '实际'} iconType="line" wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2}
                  strokeDasharray="5 3" dot={false} name="target" />
                <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2}
                  dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} name="actual" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Table grouped by date */}
          <div className="bg-white rounded shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['日期', '目标', '实际', '达成率', '关联项目', '备注', '操作'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(dateGroups).map(([date, group]) => {
                  const dayTarget = group.reduce((s, p) => s + p.target, 0);
                  const dayActual = group.reduce((s, p) => s + p.actual, 0);
                  const dayRate = dayTarget > 0 ? Math.round((dayActual / dayTarget) * 100) : 0;
                  return (
                    <>
                      {group.length > 1 && (
                        <tr key={`${date}-summary`} className="bg-slate-50 border-t-2 border-slate-200">
                          <td className="px-4 py-1.5 text-xs font-semibold text-slate-600">{date}</td>
                          <td className="px-4 py-1.5 text-xs font-semibold text-slate-600">{dayTarget}</td>
                          <td className="px-4 py-1.5 text-xs font-semibold text-slate-600">{dayActual}</td>
                          <td className="px-4 py-1.5">
                            <div className="flex items-center gap-2">
                              <DonutChart rate={dayRate} />
                              <span className="text-xs text-gray-500">当日合计</span>
                            </div>
                          </td>
                          <td className="px-4 py-1.5 text-xs text-gray-400" colSpan={3}>{group.length} 个项目</td>
                        </tr>
                      )}
                      {group.map((plan) => {
                        const rate = plan.target > 0 ? Math.round((plan.actual / plan.target) * 100) : 0;
                        const isEditing = editId === plan.id;
                        return (
                          <tr key={plan.id}
                            className={`transition-colors hover:bg-blue-50 border-t border-gray-100 ${group.length > 1 ? 'bg-white' : 'border-t-2 border-slate-200'}`}>
                            <td className="px-4 py-2 font-medium text-gray-700 text-sm">
                              {group.length > 1 ? (
                                <span className="text-gray-400 pl-2 text-xs">└</span>
                              ) : date}
                            </td>
                            <td className="px-4 py-2">
                              {isEditing ? (
                                <input type="number" value={editValues.target}
                                  onChange={(e) => setEditValues({ ...editValues, target: Number(e.target.value) })}
                                  className="w-16 border border-gray-300 rounded px-1 text-sm" />
                              ) : plan.target}
                            </td>
                            <td className="px-4 py-2">
                              {isEditing ? (
                                <input type="number" value={editValues.actual}
                                  onChange={(e) => setEditValues({ ...editValues, actual: Number(e.target.value) })}
                                  className="w-16 border border-gray-300 rounded px-1 text-sm" />
                              ) : plan.actual}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <DonutChart rate={rate} />
                                {rate < 90 && plan.actual > 0 && <span className="text-xs text-amber-600">⚠ 未达标</span>}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-gray-600 text-sm">{plan.project || '—'}</td>
                            <td className="px-4 py-2 text-xs text-gray-400">{plan.notes}</td>
                            <td className="px-4 py-2">
                              {isEditing ? (
                                <div className="flex gap-2">
                                  <button onClick={() => handleEditSave(plan)} className="text-xs text-green-600 hover:underline">保存</button>
                                  <button onClick={() => setEditId(null)} className="text-xs text-gray-400 hover:underline">取消</button>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <button onClick={() => { setEditId(plan.id); setEditValues({ target: plan.target, actual: plan.actual }); }}
                                    className="text-xs text-slate-600 hover:underline">编辑</button>
                                  <button onClick={() => handleDelete(plan.id)}
                                    className="text-xs text-red-400 hover:underline">删除</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="space-y-4">
          <div className="bg-white rounded shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['项目/订单', '目标总量', '实际完成', '完成率'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(byProject).map(([proj, data]) => {
                  const rate = data.target > 0 ? Math.round((data.actual / data.target) * 100) : 0;
                  return (
                    <tr key={proj} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{proj}</td>
                      <td className="px-4 py-3 text-gray-600">{data.target}</td>
                      <td className="px-4 py-3 text-gray-600">{data.actual}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <DonutChart rate={rate} />
                          <div>
                            <div className={`text-sm font-semibold ${rate >= 90 ? 'text-green-600' : rate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                              {rate}%
                            </div>
                            <div className="text-xs text-gray-400">
                              {data.target - data.actual > 0 ? `差 ${data.target - data.actual} 台` : '已完成'}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddPlanModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={handleAddPlan} />
    </div>
  );
}
