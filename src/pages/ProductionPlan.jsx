import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

const TODAY = '2024-01-22';

function SVGSparkline({ data }) {
  if (!data || data.length === 0) return null;
  const W = 500, H = 100, PAD = 10;
  const maxVal = Math.max(...data.flatMap((d) => [d.target, d.actual]), 1);
  const xs = data.map((_, i) => PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2));

  const pts = (key) =>
    data.map((d, i) => `${xs[i]},${PAD + (1 - d[key] / maxVal) * (H - PAD * 2)}`).join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-24">
      <polyline
        points={pts('target')}
        fill="none"
        stroke="#94a3b8"
        strokeWidth="2"
        strokeDasharray="4 2"
      />
      <polyline
        points={pts('actual')}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
      />
    </svg>
  );
}

function AddPlanModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    date: TODAY,
    target: '',
    actual: '',
    project: '',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
    setForm({ date: TODAY, target: '', actual: '', project: '', notes: '' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增生产计划">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">目标数量</label>
            <input
              type="number"
              min="0"
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">实际完成</label>
            <input
              type="number"
              min="0"
              value={form.actual}
              onChange={(e) => setForm({ ...form, actual: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">关联项目/订单</label>
          <input
            type="text"
            value={form.project}
            onChange={(e) => setForm({ ...form, project: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
            placeholder="项目名称"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800"
          >
            保存
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProductionPlan() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const plans = [...state.productionPlans].sort((a, b) => a.date.localeCompare(b.date));

  const handleAddPlan = (form) => {
    const newPlan = {
      id: `PLAN-${Date.now()}`,
      date: form.date,
      target: Number(form.target),
      actual: Number(form.actual),
      project: form.project,
      notes: form.notes,
    };
    dispatch({ type: 'ADD_PRODUCTION_PLAN', payload: newPlan });
  };

  const handleEditSave = (plan) => {
    dispatch({
      type: 'UPDATE_PRODUCTION_PLAN',
      payload: { id: plan.id, ...editValues },
    });
    setEditId(null);
  };

  // By project
  const byProject = {};
  plans.forEach((p) => {
    const proj = p.project || '未指定';
    if (!byProject[proj]) byProject[proj] = { target: 0, actual: 0 };
    byProject[proj].target += p.target;
    byProject[proj].actual += p.actual;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">生产计划</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800"
        >
          + 新增计划
        </button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {['工厂总览', '按项目/订单'].map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === i
                ? 'border-slate-700 text-slate-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="space-y-6">
          {/* Chart */}
          <div className="bg-white rounded shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">目标 vs 实际 趋势</h3>
              <div className="flex gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-6 h-0.5 bg-slate-400 inline-block border-dashed border-t-2 border-slate-400" />
                  目标
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-6 h-0.5 bg-blue-500 inline-block" />
                  实际
                </span>
              </div>
            </div>
            <SVGSparkline data={plans} />
            <div className="flex justify-between text-xs text-gray-400 mt-1 px-2">
              {plans.map((p) => (
                <span key={p.id} className="transform -rotate-45 text-xs">
                  {p.date.slice(5)}
                </span>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['日期', '目标数量', '实际完成', '达成率', '关联项目', '备注', '操作'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plans.map((plan) => {
                  const isPast = plan.date < TODAY;
                  const isToday = plan.date === TODAY;
                  const rate = plan.target > 0 ? Math.round((plan.actual / plan.target) * 100) : 0;
                  const isEditing = editId === plan.id;

                  return (
                    <tr
                      key={plan.id}
                      className={`hover:bg-gray-50 ${isPast ? 'text-gray-400' : ''}`}
                    >
                      <td className="px-4 py-2 font-medium">
                        {plan.date}
                        {isToday && (
                          <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1 rounded">今天</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.target}
                            onChange={(e) => setEditValues({ ...editValues, target: Number(e.target.value) })}
                            className="w-16 border border-gray-300 rounded px-1 text-sm"
                          />
                        ) : plan.target}
                      </td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.actual}
                            onChange={(e) => setEditValues({ ...editValues, actual: Number(e.target.value) })}
                            className="w-16 border border-gray-300 rounded px-1 text-sm"
                          />
                        ) : plan.actual}
                      </td>
                      <td className="px-4 py-2">
                        <span className={rate < 90 ? 'text-red-600 font-medium' : 'text-green-600'}>
                          {rate}%
                        </span>
                        {rate < 90 && <span className="ml-1 text-xs text-red-400">⚠ 未达标</span>}
                      </td>
                      <td className="px-4 py-2">{plan.project || '—'}</td>
                      <td className="px-4 py-2 text-xs text-gray-400">{plan.notes}</td>
                      <td className="px-4 py-2">
                        {isPast ? (
                          <span className="text-xs text-gray-300">已锁定</span>
                        ) : isEditing ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditSave(plan)}
                              className="text-xs text-green-600 hover:underline"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              className="text-xs text-gray-400 hover:underline"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditId(plan.id);
                              setEditValues({ target: plan.target, actual: plan.actual });
                            }}
                            className="text-xs text-slate-600 hover:underline"
                          >
                            编辑
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="bg-white rounded shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['项目/订单', '目标总量', '实际完成', '完成率'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(byProject).map(([proj, data]) => {
                const rate = data.target > 0 ? Math.round((data.actual / data.target) * 100) : 0;
                return (
                  <tr key={proj} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{proj}</td>
                    <td className="px-4 py-2 text-gray-600">{data.target}</td>
                    <td className="px-4 py-2 text-gray-600">{data.actual}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded h-4 overflow-hidden max-w-32">
                          <div
                            className={`h-full rounded transition-all ${rate >= 90 ? 'bg-green-500' : 'bg-orange-400'}`}
                            style={{ width: `${Math.min(rate, 100)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${rate < 90 ? 'text-orange-600' : 'text-green-600'}`}>
                          {rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AddPlanModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleAddPlan}
      />
    </div>
  );
}
