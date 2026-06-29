import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import SecondaryTabs from '../components/SecondaryTabs';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

const TABS = [
  { key: 'list', label: '项目列表' },
  { key: 'production', label: '生产计划' },
  { key: 'delivery', label: '交付计划' },
  { key: 'quality', label: '质量看板' },
];

/* ─────────── 项目列表 Tab ─────────── */
function AddProjectModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', client: '', manager: '', targetCount: 1, contactPerson: '', contactPhone: '', background: '', notes: '' });
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  const f = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });
  const handleSubmit = (e) => {
    e.preventDefault();
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    onSave({ ...form, targetCount: Number(form.targetCount), id: `PROJ-${Date.now()}`, createdAt: now, updatedAt: now });
    onClose();
    setForm({ name: '', client: '', manager: '', targetCount: 1, contactPerson: '', contactPhone: '', background: '', notes: '' });
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增项目" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">项目名称 *</label><input type="text" className={inp} required {...f('name')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">目标需求量 *</label><input type="number" min="1" className={inp} required {...f('targetCount')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">客户名称</label><input type="text" className={inp} {...f('client')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">项目负责人</label>
            <select className={inp} {...f('manager')}>
              <option value="">-- 选择负责人 --</option>
              {['张三', '李四', '王五', '赵六', '蔡八'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">联系人</label><input type="text" className={inp} {...f('contactPerson')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label><input type="text" className={inp} {...f('contactPhone')} /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">项目背景</label><textarea rows={2} className={inp} {...f('background')} /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">备注</label><textarea rows={2} className={inp} {...f('notes')} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存</button>
        </div>
      </form>
    </Modal>
  );
}

function ProjectListTab() {
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('全部');

  const { projects, deliveryPlans = [] } = state;

  const getAccepted = (pid) => {
    const projPlans = deliveryPlans.filter(dp => dp.projectId === pid);
    return projPlans.reduce((sum, dp) => sum + (dp.records?.customerAccept || []).filter(r => r.result === '通过').length, 0);
  };

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.name.includes(search) || (p.client || '').includes(search);
    const matchStatus = filterStatus === '全部' || (filterStatus === '有效' && !p.voided) || (filterStatus === '已作废' && p.voided);
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 items-center">
          <input type="text" placeholder="搜索项目名称或客户…" value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none w-52" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none">
            <option value="全部">全部</option>
            <option value="有效">有效</option>
            <option value="已作废">已作废</option>
          </select>
          <span className="text-sm text-gray-400">共 {filtered.length} 个</span>
        </div>
        {canDo('add_project') && (
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
            + 新增项目
          </button>
        )}
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['项目名称', '客户', '目标量', '已验收/目标', '负责人', '创建时间'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(p => {
              const accepted = getAccepted(p.id);
              const pct = Math.min(Math.round((accepted / p.targetCount) * 100), 100);
              return (
                <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                  className={`hover:bg-blue-50 cursor-pointer transition-colors ${p.voided ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    <span className={p.voided ? 'line-through text-gray-400' : ''}>{p.name}</span>
                    {p.voided && <span className="ml-2 text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">已作废</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.client || '—'}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{p.targetCount} 台</td>
                  <td className="px-4 py-3 min-w-[160px]">
                    {p.voided ? <span className="text-gray-400">—</span> : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${pct >= 100 ? 'bg-green-500' : pct > 50 ? 'bg-blue-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-600">{accepted}/{p.targetCount}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.manager || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.createdAt}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无项目</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AddProjectModal isOpen={showModal} onClose={() => setShowModal(false)}
        onSave={form => dispatch({ type: 'ADD_PROJECT', payload: form })} />
    </div>
  );
}

/* ─────────── 生产计划 Tab ─────────── */
function AddProductionPlanModal({ isOpen, onClose, onSave }) {
  const { state } = useApp();
  const [form, setForm] = useState({ name: '', projectId: '', targetCount: 1, startDate: '', endDate: '', notes: '' });
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  const handleSubmit = (e) => {
    e.preventDefault();
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    onSave({ ...form, targetCount: Number(form.targetCount), id: `PP-${Date.now()}`, status: '进行中', createdAt: now, updatedAt: now, nodes: { materialPrep: [], assembly: [], quality: [], warehouse: [] } });
    onClose();
    setForm({ name: '', projectId: '', targetCount: 1, startDate: '', endDate: '', notes: '' });
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新建生产计划">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">计划名称 *</label>
          <input type="text" className={inp} required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">关联项目</label>
          <select className={inp} value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
            <option value="">-- 选择项目 --</option>
            {state.projects.filter(p => !p.voided).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">目标数量 *</label>
            <input type="number" min="1" className={inp} required value={form.targetCount} onChange={e => setForm({ ...form, targetCount: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">计划完成日期</label>
            <input type="date" className={inp} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea rows={2} className={inp} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存</button>
        </div>
      </form>
    </Modal>
  );
}

function ProductionPlanTab() {
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const { projects } = state;
  const getProjectName = (id) => projects.find(p => p.id === id)?.name || '—';

  const plans = state.workflowProductionPlans || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">共 {plans.length} 个生产计划</span>
        {canDo('add_production_plan') && (
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
            + 新建生产计划
          </button>
        )}
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['计划名称', '关联项目', '目标量', '状态', '计划完成日期', '创建时间', ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {plans.map(plan => (
              <tr key={plan.id} className="hover:bg-blue-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/production-plans/${plan.id}`)}>
                <td className="px-4 py-3 font-semibold text-slate-800">{plan.name || plan.id}</td>
                <td className="px-4 py-3 text-gray-600">{getProjectName(plan.projectId)}</td>
                <td className="px-4 py-3 text-gray-700">{plan.targetCount ?? '—'} 台</td>
                <td className="px-4 py-3"><StatusBadge status={plan.status || '进行中'} /></td>
                <td className="px-4 py-3 text-gray-500 text-xs">{plan.endDate || plan.date || '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{plan.createdAt || plan.date || '—'}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">查看详情 →</td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无生产计划</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AddProductionPlanModal isOpen={showModal} onClose={() => setShowModal(false)}
        onSave={plan => dispatch({ type: 'ADD_PRODUCTION_PLAN', payload: plan })} />
    </div>
  );
}

/* ─────────── 交付计划 Tab ─────────── */
function AddDeliveryPlanModal({ isOpen, onClose, onSave }) {
  const { state } = useApp();
  const [form, setForm] = useState({ name: '', projectId: '', targetCount: 1, dueDate: '', notes: '' });
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, targetCount: Number(form.targetCount), id: `DP-${Date.now()}`, status: '进行中', records: { factoryInspection: [], siteInstall: [], customerAccept: [] } });
    onClose();
    setForm({ name: '', projectId: '', targetCount: 1, dueDate: '', notes: '' });
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新建交付计划">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">计划名称 *</label>
          <input type="text" className={inp} required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">关联项目</label>
          <select className={inp} value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
            <option value="">-- 选择项目 --</option>
            {state.projects.filter(p => !p.voided).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">目标交付量 *</label>
            <input type="number" min="1" className={inp} required value={form.targetCount} onChange={e => setForm({ ...form, targetCount: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">计划交付日期</label>
            <input type="date" className={inp} value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存</button>
        </div>
      </form>
    </Modal>
  );
}

function DeliveryPlanTab() {
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const { deliveryPlans = [], projects } = state;
  const getProjectName = (id) => projects.find(p => p.id === id)?.name || '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">共 {deliveryPlans.length} 个交付计划</span>
        {canDo('add_delivery') && (
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
            + 新建交付计划
          </button>
        )}
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['计划名称', '关联项目', '目标量', '状态', '计划交付日期', '出厂检验', '现场安装', '客户验收', ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {deliveryPlans.map(plan => {
              const fi = (plan.records?.factoryInspection || []).length;
              const si = (plan.records?.siteInstall || []).length;
              const ca = (plan.records?.customerAccept || []).length;
              return (
                <tr key={plan.id} className="hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/delivery-plans/${plan.id}`)}>
                  <td className="px-4 py-3 font-semibold text-slate-800">{plan.name}</td>
                  <td className="px-4 py-3 text-gray-600">{getProjectName(plan.projectId)}</td>
                  <td className="px-4 py-3 text-gray-700">{plan.targetCount} 台</td>
                  <td className="px-4 py-3"><StatusBadge status={plan.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{plan.dueDate || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{fi} 台</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{si} 台</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{ca} 台</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">查看详情 →</td>
                </tr>
              );
            })}
            {deliveryPlans.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">暂无交付计划</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AddDeliveryPlanModal isOpen={showModal} onClose={() => setShowModal(false)}
        onSave={plan => dispatch({ type: 'ADD_DELIVERY_PLAN', payload: plan })} />
    </div>
  );
}

const NOW_DATE_Q = new Date('2026-06-26');
function buildSparklineDataQ(testRecords, stationKey) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(NOW_DATE_Q);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const dayRecs = testRecords.filter(r => r.stationKey === stationKey && (r.testTime || '').slice(0, 10) === ds);
    const total = dayRecs.length;
    const pass = dayRecs.filter(r => r.stationResult === 'Pass').length;
    days.push({ date: ds.slice(5), rate: total > 0 ? Math.round((pass / total) * 100) : null });
  }
  return days;
}

function QSparkline({ data }) {
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={1.5} dot={false} connectNulls />
        <Tooltip formatter={v => v != null ? `${v}%` : '—'} contentStyle={{ fontSize: 10 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ─────────── 质量看板 Tab ─────────── */
function QualityDashboard() {
  const { state } = useApp();
  const { testRecords, deliveryRecords = [], productionWorkOrders = [], deliveryWorkOrders = [], materials = [] } = state;

  // 来料质量：按单个 SN 计算
  const qualifiedMaterials = materials.filter(m => m.inspectionResult === '合格' || m.inspectionResult === '特批使用');
  const incomingPassRate = materials.length > 0 ? Math.round((qualifiedMaterials.length / materials.length) * 100) : 0;

  const allTests = testRecords || [];
  const passTests = allTests.filter(t => t.stationResult === 'Pass').length;
  const productionPassRate = allTests.length > 0 ? Math.round((passTests / allTests.length) * 100) : 0;

  // 交付质量：按 deliveryRecords stage 计算
  const fiRecords = deliveryRecords.filter(r => r.stage === '出厂检验');
  const fiPass = fiRecords.filter(r => r.result === '合格' || r.result === '通过').length;
  const siRecords = deliveryRecords.filter(r => r.stage === '现场安装调试');
  const siPass = siRecords.filter(r => r.result === '通过').length;
  const caRecords = deliveryRecords.filter(r => r.stage === '客户验收');
  const caPass = caRecords.filter(r => r.result === '通过').length;
  const allDeliveryCount = fiRecords.length + siRecords.length + caRecords.length;
  const allDeliveryPass = fiPass + siPass + caPass;
  const deliveryPassRate = allDeliveryCount > 0 ? Math.round((allDeliveryPass / allDeliveryCount) * 100) : 0;

  // 售后质量：合并生产工单 + 交付工单
  const allWOs = [...productionWorkOrders, ...deliveryWorkOrders];
  const pendingWO = allWOs.filter(w => ['待处理', '处理中'].includes(w.status)).length;
  const closedWO = allWOs.filter(w => w.status === '已关闭').length;
  const afterSalesScore = allWOs.length > 0 ? Math.round((closedWO / allWOs.length) * 100) : 100;
  // 重复故障设备（同一 deviceSN 出现在 ≥2 个工单）
  const snCounts = {};
  allWOs.forEach(w => { if (w.deviceSN) snCounts[w.deviceSN] = (snCounts[w.deviceSN] || 0) + 1; });
  const repeatFaultCount = Object.values(snCounts).filter(c => c >= 2).length;

  const cards = [
    { title: '来料质量', metric: `${incomingPassRate}%`, desc: `${qualifiedMaterials.length}/${materials.length} 件合格`, color: 'border-blue-500', badge: incomingPassRate >= 90 ? '良好' : '需关注' },
    { title: '生产质量', metric: `${productionPassRate}%`, desc: `直通率 Pass ${passTests}/${allTests.length}`, color: 'border-emerald-500', badge: productionPassRate >= 90 ? '良好' : '需关注' },
    { title: '交付质量', metric: `${deliveryPassRate}%`, desc: `出厂/安装/验收 通过 ${allDeliveryPass}/${allDeliveryCount}`, color: 'border-amber-500', badge: deliveryPassRate >= 90 ? '良好' : '需关注' },
    { title: '售后质量', metric: `${afterSalesScore}%`, desc: `${pendingWO} 个待处理 · ${repeatFaultCount} 台重复故障`, color: 'border-red-500', badge: pendingWO === 0 ? '良好' : '需关注' },
  ];

  const STATION_KEYS = ['semi', 'init', 'mid', 'oqt'];
  const STATION_LABELS_Q = ['半成品检验', '初测', '中测', 'OQT终测'];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map(c => (
          <div key={c.title} className={`bg-white rounded-xl shadow-sm border-l-4 ${c.color} p-5`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">{c.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge === '良好' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{c.badge}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{c.metric}</div>
            <div className="text-xs text-gray-500">{c.desc}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded shadow-sm p-5">
        <div className="text-sm font-semibold text-gray-700 mb-4">质检工站直通率（近7天趋势）</div>
        <div className="grid grid-cols-2 gap-6">
          {STATION_KEYS.map((key, i) => {
            const recs = allTests.filter(r => r.stationKey === key);
            const pass = recs.filter(r => r.stationResult === 'Pass').length;
            const rate = recs.length > 0 ? Math.round((pass / recs.length) * 100) : 0;
            const sparkData = buildSparklineDataQ(allTests, key);
            return (
              <div key={key}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm text-gray-600 w-20">{STATION_LABELS_Q[i]}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${rate >= 90 ? 'bg-green-500' : rate >= 70 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${rate}%` }} />
                  </div>
                  <span className={`text-xs font-medium w-10 text-right ${rate >= 90 ? 'text-green-600' : rate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{rate}%</span>
                  <span className="text-xs text-gray-400 w-16">{pass}/{recs.length}</span>
                </div>
                <QSparkline data={sparkData} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────── Main ─────────── */
export default function ProjectsCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'list';
  const activeTab = TABS.some(t => t.key === tab) ? tab : 'list';

  const setTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    setSearchParams(next);
  };

  return (
    <div>
      <div className="px-6 pt-5 pb-4 bg-white border-b border-gray-100">
        <SecondaryTabs tabs={TABS} activeTab={activeTab} onChange={setTab} />
      </div>
      <div className="p-6">
        {activeTab === 'list' && <ProjectListTab />}
        {activeTab === 'production' && <ProductionPlanTab />}
        {activeTab === 'delivery' && <DeliveryPlanTab />}
        {activeTab === 'quality' && <QualityDashboard />}
      </div>
    </div>
  );
}
