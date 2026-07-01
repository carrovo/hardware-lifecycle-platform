import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import Modal from '../components/Modal';
import { Pagination, usePaged } from '../components/Pagination';
import { MATERIAL_CATEGORIES } from '../data/mockData';

const RESULT_BADGE = {
  '合格':    { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300',  icon: '✓' },
  '不合格':  { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300',    icon: '✗' },
  '特批使用': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', icon: '!' },
  '部分合格': { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300',  icon: '◐' },
  '待检验':  { bg: 'bg-gray-100',   text: 'text-gray-500',   border: 'border-gray-300',   icon: '○' },
};

// 模块实例状态：在库可用 / 已锁定生产计划 / 已装配 / 维修中 / 已报废
const STATUS_BADGE = {
  '在库可用':      { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   icon: '○' },
  '已锁定生产计划': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', icon: '🔒' },
  '已装配':        { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', icon: '●' },
  '维修中':        { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300',  icon: '🛠' },
  '已报废':        { bg: 'bg-gray-200',   text: 'text-gray-500',   border: 'border-gray-300',   icon: '✕' },
  '退货换货':      { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300',    icon: '↩' },
};

// 将底层物料状态映射到模块实例状态词表
function instanceStatus(status) {
  switch (status) {
    case '待装配': return '在库可用';
    case '已占用': return '已装配';
    case '维修中': return '维修中';
    case '已报废': return '已报废';
    case '退货换货': return '退货换货';
    default: return status || '在库可用';
  }
}

function Badge({ map, value }) {
  const s = map[value] || { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', icon: '·' };
  return (
    <span className={`inline-flex items-center gap-1 border rounded-full text-xs px-2 py-0.5 font-medium ${s.bg} ${s.text} ${s.border}`}>
      <span>{s.icon}</span><span>{value}</span>
    </span>
  );
}

function AddBatchModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    batchNo: '', category: '底盘', model: '', supplier: '',
    inspector: '', inspectionTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
    erpPurchaseOrderNo: '', notes: '',
  });
  const [items, setItems] = useState([{ sn: '', result: '合格', notes: '' }]);

  const addItem = () => setItems((prev) => [...prev, { sn: '', result: '合格', notes: '' }]);
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, key, val) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [key]: val } : it));

  const handleSubmit = (e) => {
    e.preventDefault();
    const savedItems = items.map((it, i) => ({
      id: `MAT-${Date.now()}-${i}`,
      sn: it.sn,
      result: it.result,
      status: it.result === '不合格' ? '退货换货' : '待装配',
      notes: it.notes,
    }));
    onSave({ ...form, quantity: savedItems.length, items: savedItems });
    onClose();
    setForm({ batchNo: '', category: '底盘', model: '', supplier: '',
      inspector: '', inspectionTime: new Date().toISOString().slice(0, 16).replace('T', ' '), erpPurchaseOrderNo: '', notes: '' });
    setItems([{ sn: '', result: '合格', notes: '' }]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增来料批次" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">批次号 *</label>
            <input type="text" value={form.batchNo} onChange={(e) => setForm({ ...form, batchNo: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">物料类别 *</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500">
              {MATERIAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">型号</label>
            <input type="text" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">供应商 *</label>
            <input type="text" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">检验员</label>
            <input type="text" value={form.inspector} onChange={(e) => setForm({ ...form, inspector: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">检验时间</label>
            <input type="text" value={form.inspectionTime} onChange={(e) => setForm({ ...form, inspectionTime: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">采购到货通知单号</label>
            <input type="text" value={form.erpPurchaseOrderNo} onChange={(e) => setForm({ ...form, erpPurchaseOrderNo: e.target.value })}
              placeholder="ERP 采购到货通知单号（选填）"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">SN 明细 ({items.length} 件)</label>
            <button type="button" onClick={addItem}
              className="text-xs text-slate-600 hover:text-slate-800 border border-slate-300 rounded px-2 py-1">
              + 添加SN
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {items.map((it, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" placeholder="SN编号" value={it.sn} onChange={(e) => updateItem(i, 'sn', e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none" required />
                <select value={it.result} onChange={(e) => updateItem(i, 'result', e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none">
                  <option value="合格">合格</option>
                  <option value="不合格">不合格</option>
                  <option value="特批使用">特批使用</option>
                </select>
                <input type="text" placeholder="备注" value={it.notes} onChange={(e) => updateItem(i, 'notes', e.target.value)}
                  className="w-28 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none" />
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存批次</button>
        </div>
      </form>
    </Modal>
  );
}

function ModuleInventoryTab({ materials, moduleTypes, deviceTypes = [], onViewInstances, onViewBatches }) {
  const inventory = moduleTypes.map((mt) => {
    const mats = materials.filter((m) => m.category === mt.category);
    const total = mats.length;
    const available = mats.filter((m) => m.status === '待装配').length;
    const assembled = mats.filter((m) => m.status === '已占用').length;
    const repairing = mats.filter((m) => m.status === '维修中').length;
    const scrapped = mats.filter((m) => ['退货换货', '已报废'].includes(m.status)).length;
    const relatedTypes = deviceTypes.filter((dt) => (dt.slots || []).some((s) => s.moduleTypeId === mt.id)).map((dt) => dt.name);
    const risk = available === 0 ? '缺料' : available < 2 ? '偏低' : '正常';
    const sample = mats[0] || {};
    return { ...mt, model: sample.model || '—', supplier: sample.supplier || '—', total, available, assembled, locked: 0, repairing, scrapped, relatedTypes, risk };
  });

  const riskBadge = (risk) => risk === '缺料'
    ? 'bg-red-100 text-red-700 border-red-300'
    : risk === '偏低' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-green-100 text-green-700 border-green-300';
  const paged = usePaged(inventory, 10);

  return (
    <div className="bg-white rounded shadow-sm">
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['模块类型', '型号', '供应商', '库存总数', '可用库存', '已锁定', '已装配', '维修中', '已报废', '关联设备类型', '库存风险', '操作'].map((h) => (
              <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {paged.pageItems.map((mt) => (
            <tr key={mt.id} className={`hover:bg-gray-50 ${!mt.active ? 'opacity-50' : ''}`}>
              <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{mt.name}<span className="ml-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded-full">{mt.category}</span></td>
              <td className="px-4 py-3 text-gray-600 text-xs">{mt.model}</td>
              <td className="px-4 py-3 text-gray-600 text-xs">{mt.supplier}</td>
              <td className="px-4 py-3 text-gray-700 font-medium">{mt.total}</td>
              <td className="px-4 py-3"><span className={`font-semibold ${mt.available > 0 ? 'text-blue-700' : 'text-gray-400'}`}>{mt.available}</span></td>
              <td className="px-4 py-3 text-gray-500">{mt.locked}</td>
              <td className="px-4 py-3 text-gray-600">{mt.assembled}</td>
              <td className="px-4 py-3 text-amber-600">{mt.repairing || 0}</td>
              <td className="px-4 py-3">{mt.scrapped > 0 ? <span className="text-red-600 font-medium">{mt.scrapped}</span> : <span className="text-gray-400">0</span>}</td>
              <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{mt.relatedTypes.join('、') || '—'}</td>
              <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full border ${riskBadge(mt.risk)}`}>{mt.risk}</span></td>
              <td className="px-4 py-3 text-xs whitespace-nowrap">
                <div className="flex items-center gap-x-3">
                  <button className="text-blue-600 hover:underline" onClick={() => onViewInstances(mt.category)}>查看实例</button>
                  <button className="text-slate-600 hover:underline" onClick={() => onViewBatches(mt.category)}>查看批次</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <Pagination page={paged.page} total={paged.total} totalPages={paged.totalPages} onChange={paged.setPage} />
    </div>
  );
}

/* ─────── 模块实例 ─────── */
function ModuleInstanceTab({ materials, devices, moduleTypes, batches = [], batchFilter = '', categoryFilter = '', onClearBatch, onClearCategory, onViewBatch }) {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const typeName = (category) => moduleTypes.find((m) => m.category === category)?.name || category;
  const ownerOf = (matId) => devices.find((d) => (d.usedMaterials || []).some((um) => um.materialId === matId));
  const erpOf = (batchNo) => batches.find((b) => b.batchNo === batchNo)?.erpPurchaseOrderNo || '—';
  const lockedPlanOf = (m) => (m.status === '已占用' ? '—' : (m.lockedPlanId || (m.status === '已锁定生产计划' ? m.planId : '') || ''));

  const rows = (materials || []).map((m) => ({ ...m, instState: instanceStatus(m.status), owner: ownerOf(m.id) }));
  const filtered = rows.filter((m) => {
    const okStatus = statusFilter === '全部' || m.instState === statusFilter;
    const okBatch = !batchFilter || m.batchNo === batchFilter;
    const okCat = !categoryFilter || m.category === categoryFilter;
    const okQ = !q || m.sn.toLowerCase().includes(q.toLowerCase()) || (m.model || '').toLowerCase().includes(q.toLowerCase());
    return okStatus && okBatch && okCat && okQ;
  });
  const paged = usePaged(filtered, 10);
  const dangerBtn = 'text-red-400 hover:text-red-600 hover:underline';

  return (
    <div>
      <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700 mb-4">
        模块实例追踪用于追踪每个模块 SN 的当前状态。录入待测试设备时，需要从这里选择「在库可用」或已锁定当前生产计划的模块 SN 绑定到设备。
      </div>
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-4 flex flex-wrap gap-2 items-center">
        <label className="text-xs text-gray-500">实例状态</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none">
          {['全部', '在库可用', '已锁定生产计划', '已装配', '维修中', '已报废', '退货换货'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索模块SN / 型号..." className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none w-52" />
        {batchFilter && (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs px-2.5 py-1">
            来源批次：{batchFilter}
            <button className="text-slate-400 hover:text-slate-700" onClick={onClearBatch}>✕</button>
          </span>
        )}
        {categoryFilter && (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs px-2.5 py-1">
            模块类型：{categoryFilter}
            <button className="text-slate-400 hover:text-slate-700" onClick={onClearCategory}>✕</button>
          </span>
        )}
        <span className="ml-auto text-sm text-gray-400">共 {filtered.length} 个实例</span>
      </div>
      <div className="bg-white rounded shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{['模块SN', '模块类型', '型号', '供应商', '来源批次', 'ERP采购单号', '当前状态', '锁定生产计划', '已装配设备SN', '当前所在设备', '最近更新', '操作'].map((h) => (
              <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.pageItems.map((m) => {
              const assembled = m.instState === '已装配';
              const lockedPlan = lockedPlanOf(m);
              return (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-800 font-medium whitespace-nowrap">{m.sn}</td>
                <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{typeName(m.category)}<span className="ml-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded-full">{m.category}</span></td>
                <td className="px-4 py-2.5 text-gray-600 text-xs whitespace-nowrap">{m.model || '—'}</td>
                <td className="px-4 py-2.5 text-gray-600 text-xs whitespace-nowrap">{m.supplier || '—'}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-500 whitespace-nowrap">{m.batchNo || '—'}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-500 whitespace-nowrap">{erpOf(m.batchNo)}</td>
                <td className="px-4 py-2.5"><Badge map={STATUS_BADGE} value={m.instState} /></td>
                <td className="px-4 py-2.5 text-xs whitespace-nowrap">{lockedPlan ? <Link to={`/production-plans/${lockedPlan}`} className="text-indigo-600 hover:underline font-mono" onClick={(e) => e.stopPropagation()}>{lockedPlan}</Link> : <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap">{assembled && m.owner ? <Link to={`/devices/${m.owner.id}`} className="text-blue-600 hover:underline">{m.owner.sn}</Link> : <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{assembled && m.owner ? m.owner.sn : '—'}</td>
                <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">{m.inspectionTime || '—'}</td>
                <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                  <div className="flex items-center gap-x-3">
                    {m.owner ? <Link to={`/devices/${m.owner.id}`} className="text-slate-600 hover:underline">查看设备</Link> : <span className="text-gray-300">查看设备</span>}
                    {m.batchNo ? <button className="text-blue-600 hover:underline" onClick={() => onViewBatch(m.batchNo)}>查看批次</button> : <span className="text-gray-300">查看批次</span>}
                    <button className="text-indigo-600 hover:underline">锁定生产计划</button>
                    <button className="text-amber-600 hover:underline">标记维修</button>
                    <button className={dangerBtn}>报废</button>
                  </div>
                </td>
              </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-400">暂无模块实例</td></tr>}
          </tbody>
        </table>
        </div>
        <Pagination page={paged.page} total={paged.total} totalPages={paged.totalPages} onChange={paged.setPage} />
      </div>
    </div>
  );
}

export default function Materials() {
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const workflowProductionPlans = state.workflowProductionPlans || [];
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('模块批次管理');
  const [showModal, setShowModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('全部');
  const [filterSupplier, setFilterSupplier] = useState('全部');
  const [filterResult, setFilterResult] = useState('全部');
  const [filterItemStatus, setFilterItemStatus] = useState('全部');
  const [search, setSearch] = useState('');
  const [instanceBatchFilter, setInstanceBatchFilter] = useState('');
  const [instanceCategoryFilter, setInstanceCategoryFilter] = useState('');

  useEffect(() => {
    const r = searchParams.get('result');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (r) setFilterResult(r);
  }, [searchParams]);

  const batches = state.materialBatches || [];
  const suppliers = ['全部', ...new Set(batches.map((b) => b.supplier).filter(Boolean))];

  // 跨 Tab 跳转：批次 → 实例（按来源批次筛选）、库存汇总 → 实例/批次（按模块类型筛选）。
  const viewInstancesByBatch = (batchNo) => { setInstanceBatchFilter(batchNo); setInstanceCategoryFilter(''); setActiveTab('模块实例追踪'); };
  const viewInstancesByCategory = (category) => { setInstanceCategoryFilter(category); setInstanceBatchFilter(''); setActiveTab('模块实例追踪'); };
  const viewBatchByNo = (batchNo) => { setSearch(batchNo); setFilterCategory('全部'); setActiveTab('模块批次管理'); };
  const viewBatchByCategory = (category) => { setSearch(''); setFilterCategory(category); setActiveTab('模块批次管理'); };

  const hasFilters = filterCategory !== '全部' || filterSupplier !== '全部' || filterResult !== '全部' || filterItemStatus !== '全部' || search;
  const clearFilters = () => {
    setFilterCategory('全部'); setFilterSupplier('全部');
    setFilterResult('全部'); setFilterItemStatus('全部'); setSearch('');
  };

  const filtered = batches
    .filter((b) => {
      const matchCat = filterCategory === '全部' || b.category === filterCategory;
      const matchSupplier = filterSupplier === '全部' || b.supplier === filterSupplier;
      const matchResult = filterResult === '全部' || b.items.some((it) => it.result === filterResult);
      const matchItemStatus = filterItemStatus === '全部' || b.items.some((it) => instanceStatus(it.status) === filterItemStatus);
      const matchSearch = !search ||
        b.batchNo.toLowerCase().includes(search.toLowerCase()) ||
        b.supplier.toLowerCase().includes(search.toLowerCase()) ||
        b.items.some((it) => it.sn.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSupplier && matchResult && matchItemStatus && matchSearch;
    })
    .sort((a, b) => b.inspectionTime.localeCompare(a.inspectionTime));
  const paged = usePaged(filtered, 10);

  const handleAdd = (form) => {
    dispatch({ type: 'ADD_MATERIAL_BATCH', payload: { id: `BATCH-${Date.now()}`, ...form } });
  };

  const totalItems = filtered.reduce((s, b) => s + b.items.length, 0);
  const failItems = filtered.reduce((s, b) => s + b.items.filter((it) => it.result === '不合格').length, 0);

  return (
    <div className="p-6">
      <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600 mb-4">
        模块与来料用于管理供应商到货批次、具体模块 SN 实例和库存水位，供生产计划来料准备和录入待测试设备时关联使用。
        <span className="text-slate-400">（设备类型定义整机需要哪些模块，模块类型库定义模块主数据，此处管理实际到货批次与模块 SN；生产计划在来料准备中关联批次、在录入待测试设备时绑定具体模块 SN。）</span>
      </div>
      {/* Tabs + Button in one row */}
      <div className="flex items-center border-b border-gray-200 mb-4">
        {['模块批次管理', '模块实例追踪', '模块库存汇总'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-slate-700 text-slate-800' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab}
          </button>
        ))}
        {activeTab === '模块批次管理' && canDo('add_material_batch') && (
          <button onClick={() => setShowModal(true)}
            className="ml-auto mb-1 px-4 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
            + 新增来料批次
          </button>
        )}
      </div>

      {activeTab === '模块库存汇总' && (
        <>
          <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700 mb-4">模块库存汇总按模块类型统计库存水位，用于判断生产齐套风险和模块库存不足风险。（这里只做库存聚合，不新增批次或实例；新增来料请在「模块批次管理」完成。）</div>
          <ModuleInventoryTab materials={state.materials} moduleTypes={state.moduleTypes} deviceTypes={state.deviceTypes} onViewInstances={viewInstancesByCategory} onViewBatches={viewBatchByCategory} />
        </>
      )}

      {activeTab === '模块实例追踪' && (
        <ModuleInstanceTab
          materials={state.materials}
          devices={state.devices}
          moduleTypes={state.moduleTypes}
          batches={state.materialBatches}
          batchFilter={instanceBatchFilter}
          categoryFilter={instanceCategoryFilter}
          onClearBatch={() => setInstanceBatchFilter('')}
          onClearCategory={() => setInstanceCategoryFilter('')}
          onViewBatch={viewBatchByNo}
        />
      )}

      {activeTab === '模块批次管理' && (
        <>
          <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700 mb-4">模块批次管理只展示批次级信息（到货、检验、可用/已锁定数量）。查看某批次下的具体模块 SN，请点操作列「查看模块实例」跳转到模块实例追踪并按来源批次筛选。</div>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <div className="text-2xl font-semibold text-gray-900">{filtered.length}</div>
              <div className="text-sm text-gray-500 mt-1">批次总数</div>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <div className="text-2xl font-semibold text-gray-900">{totalItems}</div>
              <div className="text-sm text-gray-500 mt-1">物料件数</div>
            </div>
            <div className={`border rounded-xl p-4 ${failItems > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className={`text-2xl font-semibold ${failItems > 0 ? 'text-red-700' : 'text-green-700'}`}>{failItems}</div>
              <div className={`text-sm mt-1 ${failItems > 0 ? 'text-red-600' : 'text-green-600'}`}>不合格件</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded shadow-sm px-4 py-3 mb-4 space-y-3">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-500 whitespace-nowrap">类别</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none">
                  <option value="全部">全部</option>
                  {MATERIAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-500 whitespace-nowrap">供应商</label>
                <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none">
                  {suppliers.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-500 whitespace-nowrap">检验结果</label>
                <select value={filterResult} onChange={(e) => setFilterResult(e.target.value)}
                  className={`border rounded px-2 py-1.5 text-sm focus:outline-none ${
                    filterResult === '不合格' ? 'border-red-300 text-red-700 bg-red-50'
                    : filterResult === '合格' ? 'border-green-300 text-green-700 bg-green-50'
                    : 'border-gray-300'
                  }`}>
                  <option value="全部">全部</option>
                  <option value="合格">合格</option>
                  <option value="不合格">不合格</option>
                  <option value="特批使用">特批使用</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-500 whitespace-nowrap">模块实例状态</label>
                <select value={filterItemStatus} onChange={(e) => setFilterItemStatus(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none">
                  <option value="全部">全部</option>
                  <option value="在库可用">在库可用</option>
                  <option value="已装配">已装配</option>
                  <option value="维修中">维修中</option>
                  <option value="已报废">已报废</option>
                  <option value="退货换货">退货换货</option>
                </select>
              </div>
              <input type="text" placeholder="搜索批次号 / 供应商 / SN..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none w-52" />
              {hasFilters && (
                <button onClick={clearFilters}
                  className="text-xs text-slate-600 border border-slate-300 rounded px-2.5 py-1.5 hover:bg-slate-50 whitespace-nowrap">
                  清除筛选
                </button>
              )}
              <div className="text-sm text-gray-400 ml-auto">共 {filtered.length} 批次 · {totalItems} 件</div>
            </div>
          </div>

          {/* Batch table */}
          <div className="bg-white rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['批次号', '模块类型', '型号', '供应商', 'ERP采购单号', 'ERP到货通知单号', '到货数量', '合格数量', '不合格数量', '检验结果', '可用数量', '已锁定数量', '关联生产计划', '检验时间', '操作'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.pageItems.map((b) => {
                  const passCount = b.items.filter((it) => it.result === '合格' || it.result === '特批使用').length;
                  const failCount = b.items.filter((it) => it.result === '不合格').length;
                  const plan = workflowProductionPlans.find(p => p.id === b.planId || (p.materialBatchIds || []).includes(b.id));
                  return (
                    <tr key={b.id} className={`transition-colors ${failCount > 0 ? 'hover:bg-red-50' : 'hover:bg-blue-50'}`}>
                      <td className="px-3 py-2.5 font-medium text-gray-800 font-mono text-xs whitespace-nowrap">{b.batchNo}</td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{b.category}</td>
                      <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{b.model || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{b.supplier}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-500 whitespace-nowrap">
                        {b.erpPurchaseOrderNo || <span className="text-gray-300">待录入</span>}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-500 whitespace-nowrap">
                        {b.erpArrivalNo || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700 font-medium">{b.items.length}</td>
                      <td className="px-3 py-2.5 text-green-600 font-medium">{passCount}</td>
                      <td className="px-3 py-2.5">{failCount > 0 ? <span className="text-red-600 font-medium">{failCount}</span> : <span className="text-gray-400">0</span>}</td>
                      <td className="px-3 py-2.5">
                        <Badge map={RESULT_BADGE} value={failCount > 0 && passCount > 0 ? '部分合格' : failCount > 0 ? '不合格' : passCount > 0 ? '合格' : '待检验'} />
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">{b.items.filter((it) => it.status === '待装配').length}</td>
                      <td className="px-3 py-2.5 text-gray-500">{b.items.filter((it) => it.status === '已占用').length}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                        {plan ? (
                          <Link to={`/production-plans/${plan.id}`} className="text-blue-600 hover:underline font-mono">
                            {plan.planNo || plan.id}
                          </Link>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">{b.inspectionTime}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-x-3">
                          <button className="text-slate-600 hover:underline">录入检验结果</button>
                          <button className="text-emerald-600 hover:underline">关联生产计划</button>
                          <button className="text-blue-600 hover:underline" onClick={() => viewInstancesByBatch(b.batchNo)}>查看模块实例</button>
                          <button className="text-indigo-600 hover:underline">锁定</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={15} className="px-4 py-8 text-center text-gray-400">暂无来料批次</td></tr>
                )}
              </tbody>
            </table>
            </div>
            <Pagination page={paged.page} total={paged.total} totalPages={paged.totalPages} onChange={paged.setPage} />
          </div>
        </>
      )}

      <AddBatchModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={handleAdd} />
    </div>
  );
}
