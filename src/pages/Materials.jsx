import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import Modal from '../components/Modal';
import { Pagination, usePaged } from '../components/Pagination';
import { MATERIAL_CATEGORIES, moduleInstances as MODULE_INSTANCES } from '../data/mockData';

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

// 模块库存汇总：纯统计视图，全部数量从 moduleInstances 按 moduleTypeId 聚合，不做新增/编辑/作废。
function ModuleInventoryTab({ moduleInstances = [], moduleTypes, deviceTypes = [], batches = [], onViewInstances, onViewBatches }) {
  const modelSupplierOf = (mtId) => {
    const inst = moduleInstances.find((m) => m.moduleTypeId === mtId);
    const batch = inst ? batches.find((b) => b.id === inst.sourceBatchId) : null;
    return { model: batch?.model || '—', supplier: batch?.supplier || '—' };
  };
  const inventory = moduleTypes.map((mt) => {
    const insts = moduleInstances.filter((m) => m.moduleTypeId === mt.id);
    const count = (s) => insts.filter((m) => m.status === s).length;
    const available = count('在库可用');
    const relatedTypes = deviceTypes.filter((dt) => (dt.slots || []).some((s) => s.moduleTypeId === mt.id)).map((dt) => dt.name);
    const safeStock = mt.safeStock ?? 3;
    const risk = available === 0 ? '缺货' : available < safeStock ? '偏低' : '正常';
    const { model, supplier } = modelSupplierOf(mt.id);
    return { ...mt, model, supplier, total: insts.length, available, locked: count('已锁定生产计划'), assembled: count('已装配'), repairing: count('维修中'), scrapped: count('已报废'), relatedTypes, risk, safeStock };
  }).filter((r) => r.total > 0 || r.relatedTypes.length > 0); // 只展示 BOM 引用或有实例的模块类型

  const riskBadge = (risk) => risk === '缺货'
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
              <td className="px-4 py-3"><span className={`font-semibold ${mt.available > 0 ? 'text-blue-700' : 'text-gray-400'}`} title={`安全库存 ${mt.safeStock}`}>{mt.available}</span></td>
              <td className="px-4 py-3 text-indigo-600">{mt.locked}</td>
              <td className="px-4 py-3 text-gray-600">{mt.assembled}</td>
              <td className="px-4 py-3 text-amber-600">{mt.repairing || 0}</td>
              <td className="px-4 py-3">{mt.scrapped > 0 ? <span className="text-red-600 font-medium">{mt.scrapped}</span> : <span className="text-gray-400">0</span>}</td>
              <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{mt.relatedTypes.join('、') || '—'}</td>
              <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full border ${riskBadge(mt.risk)}`}>{mt.risk}</span></td>
              <td className="px-4 py-3 text-xs whitespace-nowrap">
                <div className="flex items-center gap-x-3">
                  <button className="text-blue-600 hover:underline" onClick={() => onViewInstances(mt.id)}>查看实例</button>
                  <button className="text-slate-600 hover:underline" onClick={() => onViewBatches(mt.category)}>查看批次</button>
                </div>
              </td>
            </tr>
          ))}
          {inventory.length === 0 && <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-400">暂无库存数据</td></tr>}
        </tbody>
      </table>
      </div>
      <Pagination page={paged.page} total={paged.total} totalPages={paged.totalPages} onChange={paged.setPage} />
    </div>
  );
}

/* ─────── 模块实例 ─────── */
// 数据源为 moduleInstances：状态、boundDeviceId、lockedPlanId 显式，避免“已装配但无设备”“未绑定却可查看设备”。
function ModuleInstanceTab({ moduleInstances = [], devices, moduleTypes, batches = [], batchIdFilter = '', moduleTypeFilter = '', onClearBatch, onClearModuleType, onViewBatch, onMark }) {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const typeName = (mtId) => moduleTypes.find((m) => m.id === mtId)?.name || mtId;
  const batchOf = (id) => batches.find((b) => b.id === id);
  const deviceById = (id) => devices.find((d) => d.id === id);
  const batchNoLabel = batchIdFilter ? (batchOf(batchIdFilter)?.batchNo || batchIdFilter) : '';
  const mtLabel = moduleTypeFilter ? typeName(moduleTypeFilter) : '';
  const gray = 'text-gray-300 cursor-not-allowed';

  const rows = moduleInstances.map((mi) => {
    const batch = batchOf(mi.sourceBatchId);
    const owner = mi.status === '已装配' && mi.boundDeviceId ? deviceById(mi.boundDeviceId) : null;
    return { ...mi, catName: typeName(mi.moduleTypeId), model: batch?.model || '—', supplier: batch?.supplier || '—', batchNo: batch?.batchNo || '—', erp: batch?.erpPurchaseOrderNo || '—', owner, updatedAt: mi.updatedAt || batch?.inspectionTime || '—' };
  });
  const filtered = rows.filter((m) => {
    const okStatus = statusFilter === '全部' || m.status === statusFilter;
    const okBatch = !batchIdFilter || m.sourceBatchId === batchIdFilter;
    const okMt = !moduleTypeFilter || m.moduleTypeId === moduleTypeFilter;
    const okQ = !q || m.sn.toLowerCase().includes(q.toLowerCase()) || (m.model || '').toLowerCase().includes(q.toLowerCase());
    return okStatus && okBatch && okMt && okQ;
  });
  const paged = usePaged(filtered, 10);

  return (
    <div>
      <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700 mb-4">
        模块实例追踪用于追踪每个模块 SN 的当前状态、装配设备与批次来源。模块 SN 如不进入 ERP，由平台维护，用于装配、测试、返修、换件追溯。
        <span className="block mt-1 text-blue-500">状态口径：在库可用 / 已锁定生产计划 / 已装配 / 维修中 / 已报废 / 退货换货。已装配必有当前设备；在库可用 / 已锁定无绑定设备。</span>
      </div>
      {(batchIdFilter || moduleTypeFilter) && (
        <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded px-4 py-2 text-sm text-blue-800">
          <span>当前仅展示{batchIdFilter ? '批次 ' : '模块类型 '}<span className="font-mono font-medium">{batchIdFilter ? batchNoLabel : mtLabel}</span> 下的模块实例（共 {filtered.length} 个）</span>
          <button onClick={() => { onClearBatch && onClearBatch(); onClearModuleType && onClearModuleType(); }} className="ml-auto px-2 py-0.5 text-xs border border-blue-300 text-blue-700 rounded hover:bg-blue-100">清除筛选</button>
        </div>
      )}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-4 flex flex-wrap gap-2 items-center">
        <label className="text-xs text-gray-500">实例状态</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none">
          {['全部', '在库可用', '已锁定生产计划', '已装配', '维修中', '已报废', '退货换货'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索模块SN / 型号..." className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none w-52" />
        {batchIdFilter && (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs px-2.5 py-1">
            来源批次：{batchNoLabel}
            <button className="text-slate-400 hover:text-slate-700" onClick={onClearBatch}>✕</button>
          </span>
        )}
        {moduleTypeFilter && (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs px-2.5 py-1">
            模块类型：{mtLabel}
            <button className="text-slate-400 hover:text-slate-700" onClick={onClearModuleType}>✕</button>
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
              const assembled = m.status === '已装配';
              const canViewDevice = assembled && m.owner;
              const canRepair = ['在库可用', '已装配'].includes(m.status);
              const canScrap = ['维修中', '退货换货', '在库可用'].includes(m.status);
              return (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-800 font-medium whitespace-nowrap">{m.sn}</td>
                <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{m.catName}<span className="ml-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded-full">{m.category}</span></td>
                <td className="px-4 py-2.5 text-gray-600 text-xs whitespace-nowrap">{m.model}</td>
                <td className="px-4 py-2.5 text-gray-600 text-xs whitespace-nowrap">{m.supplier}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-500 whitespace-nowrap">{m.batchNo}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-500 whitespace-nowrap">{m.erp}</td>
                <td className="px-4 py-2.5"><Badge map={STATUS_BADGE} value={m.status} /></td>
                <td className="px-4 py-2.5 text-xs whitespace-nowrap">{m.lockedPlanId ? <Link to={`/production-plans/${m.lockedPlanId}`} className="text-indigo-600 hover:underline font-mono">{m.lockedPlanId}</Link> : <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap">{canViewDevice ? m.owner.sn : <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap">{canViewDevice ? <Link to={`/devices/${m.owner.id}`} className="text-blue-600 hover:underline">{m.owner.sn}</Link> : <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">{m.updatedAt}</td>
                <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                  <div className="flex items-center gap-x-3">
                    {canViewDevice ? <Link to={`/devices/${m.owner.id}`} className="text-slate-600 hover:underline">查看设备</Link> : <span className={gray} title="仅已装配（或曾装配）模块可查看设备">查看设备</span>}
                    <button className="text-blue-600 hover:underline" onClick={() => onViewBatch(m.batchNo)}>查看批次</button>
                    {canRepair ? <button className="text-amber-600 hover:underline" onClick={() => onMark(m.id, '维修中')}>标记维修</button> : <span className={gray}>标记维修</span>}
                    {assembled ? <span className={gray} title="已装配模块请先走换件/拆卸流程">报废</span> : canScrap ? <button className="text-red-400 hover:text-red-600 hover:underline" onClick={() => onMark(m.id, '已报废')}>报废</button> : <span className={gray} title="当前状态不可直接报废">报废</span>}
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

const M_INP = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
function batchStats(b) {
  const pass = (b.items || []).filter((it) => ['合格', '特批使用'].includes(it.result)).length;
  const fail = (b.items || []).filter((it) => it.result === '不合格').length;
  const used = (b.items || []).filter((it) => it.status === '已占用').length;
  const avail = (b.items || []).filter((it) => it.status === '待装配').length;
  return { pass, fail, used, avail, total: (b.items || []).length };
}

function batchStatusLabel(b) {
  if (b.voided) return '已作废';
  const items = b.items || [];
  if (items.length && items.every((it) => ['已报废', '退货换货'].includes(it.status))) return '已停用';
  const fail = items.some((it) => it.result === '不合格');
  const pass = items.some((it) => ['合格', '特批使用'].includes(it.result));
  if (fail && pass) return '部分合格';
  if (fail) return '不合格';
  return '合格';
}

function BatchDetailModal({ isOpen, batch, plan, onClose, onViewInstances }) {
  if (!batch) return null;
  const s = batchStats(batch);
  const linked = !!plan;
  const assembled = s.used;                 // 已装配（已占用）
  const locked = linked ? s.avail : 0;      // 已关联生产计划 → 可用件被锁定到该计划
  const available = linked ? 0 : s.avail;   // 未关联 → 自由可用
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`批次详情 · ${batch.batchNo}`} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm bg-gray-50 border border-gray-200 rounded p-3">
          <div><span className="text-gray-400 text-xs">批次号：</span><span className="font-mono text-gray-700">{batch.batchNo}</span></div>
          <div><span className="text-gray-400 text-xs">模块类型：</span><span className="text-gray-700">{batch.category}</span></div>
          <div><span className="text-gray-400 text-xs">型号：</span><span className="text-gray-700">{batch.model || '—'}</span></div>
          <div><span className="text-gray-400 text-xs">供应商：</span><span className="text-gray-700">{batch.supplier || '—'}</span></div>
          <div><span className="text-gray-400 text-xs">ERP采购单号：</span><span className="font-mono text-gray-700">{batch.erpPurchaseOrderNo || '—'}</span></div>
          <div><span className="text-gray-400 text-xs">ERP到货通知单号：</span><span className="font-mono text-gray-700">{batch.erpArrivalNo || '—'}</span></div>
          <div><span className="text-gray-400 text-xs">到货数量：</span><span className="text-gray-700">{s.total}</span></div>
          <div><span className="text-gray-400 text-xs">合格数量：</span><span className="text-green-700">{s.pass}</span></div>
          <div><span className="text-gray-400 text-xs">不合格数量：</span><span className={s.fail > 0 ? 'text-red-600' : 'text-gray-700'}>{s.fail}</span></div>
          <div><span className="text-gray-400 text-xs">可用数量：</span><span className="text-gray-700">{available}</span></div>
          <div><span className="text-gray-400 text-xs">已锁定数量：</span><span className="text-gray-700">{locked}</span></div>
          <div><span className="text-gray-400 text-xs">已装配数量：</span><span className="text-gray-700">{assembled}</span></div>
          <div className="col-span-2"><span className="text-gray-400 text-xs">关联生产计划：</span><span className="text-gray-700">{plan ? (plan.name || plan.id) : '—'}</span></div>
          <div><span className="text-gray-400 text-xs">当前状态：</span><span className="text-gray-700">{batchStatusLabel(batch)}</span></div>
          <div className="col-span-3"><span className="text-gray-400 text-xs">备注：</span><span className="text-gray-700">{batch.notes || '—'}</span></div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700">ERP 批次 / 出库 / 库存以 ERP 为准，此处为平台关联展示；模块 SN 明细请查看模块实例追踪。</div>
        <div className="flex justify-between">
          <button onClick={() => { onViewInstances(batch.id); onClose(); }} className="px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50">查看模块实例</button>
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">关闭</button>
        </div>
      </div>
    </Modal>
  );
}

function BatchInspectModal({ isOpen, batch, onClose, onSave }) {
  const s = batchStats(batch || {});
  const [form, setForm] = useState({ pass: s.pass, fail: s.fail, result: s.fail > 0 && s.pass > 0 ? '部分合格' : s.fail > 0 ? '不合格' : '合格', inspector: batch?.inspector || '', notes: batch?.notes || '' });
  if (!batch) return null;
  const submit = (e) => { e.preventDefault(); onSave({ inspector: form.inspector, inspectionTime: new Date().toISOString().slice(0, 16).replace('T', ' '), inspectResult: form.result, inspectPass: Number(form.pass), inspectFail: Number(form.fail), notes: form.notes }); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="录入检验结果" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-gray-600 mb-1">批次号</label><input className={`${M_INP} bg-gray-50`} readOnly value={batch.batchNo} /></div>
          <div><label className="block text-xs text-gray-600 mb-1">模块类型</label><input className={`${M_INP} bg-gray-50`} readOnly value={batch.category} /></div>
          <div><label className="block text-xs text-gray-600 mb-1">型号</label><input className={`${M_INP} bg-gray-50`} readOnly value={batch.model || '—'} /></div>
          <div><label className="block text-xs text-gray-600 mb-1">供应商</label><input className={`${M_INP} bg-gray-50`} readOnly value={batch.supplier || '—'} /></div>
          <div><label className="block text-xs text-gray-600 mb-1">到货数量</label><input className={`${M_INP} bg-gray-50`} readOnly value={s.total} /></div>
          <div><label className="block text-xs text-gray-600 mb-1">检验结果</label><select className={M_INP} value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })}>{['合格', '部分合格', '不合格', '特批使用'].map((r) => <option key={r}>{r}</option>)}</select></div>
          <div><label className="block text-xs text-gray-600 mb-1">合格数量 *</label><input type="number" min="0" required className={M_INP} value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-600 mb-1">不合格数量 *</label><input type="number" min="0" required className={M_INP} value={form.fail} onChange={(e) => setForm({ ...form, fail: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-600 mb-1">检验人</label><input className={M_INP} value={form.inspector} onChange={(e) => setForm({ ...form, inspector: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-600 mb-1">检验时间</label><input className={`${M_INP} bg-gray-50`} readOnly value={new Date().toISOString().slice(0, 16).replace('T', ' ')} /></div>
          <div className="col-span-2"><label className="block text-xs text-gray-600 mb-1">附件 / 检验报告</label><input className={`${M_INP} bg-gray-50 text-gray-400`} disabled placeholder="（原型占位）上传检验报告" /></div>
          <div className="col-span-2"><label className="block text-xs text-gray-600 mb-1">备注</label><textarea rows={2} className={M_INP} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button><button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存</button></div>
      </form>
    </Modal>
  );
}

function BatchLinkPlanModal({ isOpen, batch, plans, currentPlan, onClose, onSave }) {
  const s = batchStats(batch || {});
  const [form, setForm] = useState({ planId: '', qty: s.avail, note: '', trackOnly: true });
  if (!batch) return null;
  const submit = (e) => { e.preventDefault(); if (!form.planId) return; onSave(form.planId, { qty: Number(form.qty), note: form.note, trackOnly: form.trackOnly }); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="关联生产计划" size="lg">
      <form onSubmit={submit} className="space-y-4">
        {currentPlan && (
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
            该批次已关联生产计划「{currentPlan.name || currentPlan.id}」，此处可调整或追加关联。
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-gray-600 mb-1">批次号</label><input className={`${M_INP} bg-gray-50`} readOnly value={batch.batchNo} /></div>
          <div><label className="block text-xs text-gray-600 mb-1">模块类型</label><input className={`${M_INP} bg-gray-50`} readOnly value={batch.category} /></div>
          <div><label className="block text-xs text-gray-600 mb-1">可用数量</label><input className={`${M_INP} bg-gray-50`} readOnly value={s.avail} /></div>
          <div><label className="block text-xs text-gray-600 mb-1">当前关联生产计划</label><input className={`${M_INP} bg-gray-50`} readOnly value={currentPlan ? (currentPlan.name || currentPlan.id) : '未关联'} /></div>
          <div><label className="block text-xs text-gray-600 mb-1">目标生产计划 *</label><select className={M_INP} required value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}><option value="">-- 选择生产计划 --</option>{plans.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}</select></div>
          <div><label className="block text-xs text-gray-600 mb-1">关联数量</label><input type="number" min="0" max={s.avail} className={M_INP} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></div>
          <div className="flex items-center gap-2 pt-6"><input id="trackOnly" type="checkbox" checked={form.trackOnly} onChange={(e) => setForm({ ...form, trackOnly: e.target.checked })} /><label htmlFor="trackOnly" className="text-sm text-gray-700">仅作为平台追踪，不写回 ERP</label></div>
          <div className="col-span-2"><label className="block text-xs text-gray-600 mb-1">关联说明</label><textarea rows={2} className={M_INP} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700">领料 / 出库以 ERP 为准；此关联仅用于平台侧生产计划齐套追踪。</div>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button><button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存关联</button></div>
      </form>
    </Modal>
  );
}

function BatchEditModal({ isOpen, batch, onClose, onSave }) {
  const s = batchStats(batch || {});
  const [form, setForm] = useState({ supplierNote: batch?.supplierNote || '', notes: batch?.notes || '' });
  if (!batch) return null;
  const submit = (e) => { e.preventDefault(); onSave(form); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`编辑批次 · ${batch.batchNo}`} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700">仅可编辑非关键字段（供应商补充说明 / 备注 / 附件）；批次号、模块类型、到货数量、合格数量为关键字段，不可修改。</div>
        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 border border-gray-200 rounded p-3">
          <div><span className="text-gray-400 text-xs">批次号：</span><span className="font-mono text-gray-700">{batch.batchNo}</span></div>
          <div><span className="text-gray-400 text-xs">模块类型：</span><span className="text-gray-700">{batch.category}</span></div>
          <div><span className="text-gray-400 text-xs">到货数量：</span><span className="text-gray-700">{s.total}</span></div>
          <div><span className="text-gray-400 text-xs">合格数量：</span><span className="text-gray-700">{s.pass}</span></div>
        </div>
        <div><label className="block text-xs text-gray-600 mb-1">供应商补充说明</label><input className={M_INP} value={form.supplierNote} onChange={(e) => setForm({ ...form, supplierNote: e.target.value })} placeholder="供应商联系方式 / 补充信息等（非关键字段）" /></div>
        <div><label className="block text-xs text-gray-600 mb-1">备注</label><textarea rows={2} className={M_INP} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <div><label className="block text-xs text-gray-600 mb-1">附件 / 检验报告</label><input className={`${M_INP} bg-gray-50 text-gray-400`} disabled placeholder="（原型占位）支持上传附件" /></div>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button><button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存</button></div>
      </form>
    </Modal>
  );
}

function BatchVoidModal({ batch, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  if (!batch) return null;
  return (
    <Modal isOpen onClose={onClose} title="停用 / 作废批次" size="lg">
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
          作废后批次不再参与齐套统计与生产计划关联，记录保留可查；ERP 批次库存以 ERP 为准。请确认该批次未有模块装配到整机。
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-400 text-xs">批次号：</span><span className="font-mono text-gray-700">{batch.batchNo}</span></div>
          <div><span className="text-gray-400 text-xs">当前状态：</span><span className="text-gray-700">{batchStatusLabel(batch)}</span></div>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">作废原因 *</label>
          <textarea rows={3} className={M_INP} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="请填写停用 / 作废原因（必填）" />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
          我已确认该批次可停用 / 作废，且不影响已装配整机（二次确认）。
        </label>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button onClick={() => { if (reason.trim() && confirmed) onConfirm(reason.trim()); }} disabled={!reason.trim() || !confirmed} className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-40">确认作废</button>
        </div>
      </div>
    </Modal>
  );
}

export default function Materials() {
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const workflowProductionPlans = state.workflowProductionPlans || [];
  const deviceTypeNameOf = (id) => (state.deviceTypes || []).find((t) => t.id === id)?.name || '';
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('模块批次管理');
  const [showIntro, setShowIntro] = useState(false); // 顶部说明默认收起，点击「查看模块来料说明」展开
  const [showModal, setShowModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('全部');
  const [filterSupplier, setFilterSupplier] = useState('全部');
  const [filterResult, setFilterResult] = useState('全部');
  const [filterItemStatus, setFilterItemStatus] = useState('全部');
  const [search, setSearch] = useState('');
  const [instanceBatchId, setInstanceBatchId] = useState('');
  const [instanceModuleTypeId, setInstanceModuleTypeId] = useState('');
  const [instOverrides, setInstOverrides] = useState({}); // 模块实例会话内状态覆盖（标记维修 / 报废）
  const markInstance = (id, status) => setInstOverrides((prev) => ({ ...prev, [id]: status }));
  const moduleInstances = (MODULE_INSTANCES || []).map((mi) => (instOverrides[mi.id] ? { ...mi, status: instOverrides[mi.id], boundDeviceId: instOverrides[mi.id] === '已装配' ? mi.boundDeviceId : (mi.status === '已装配' ? mi.boundDeviceId : null) } : mi));
  const [batchModal, setBatchModal] = useState(null); // { type, batch }
  const openBatch = (type, batch) => setBatchModal({ type, batch });
  const closeBatch = () => setBatchModal(null);
  const saveBatch = (patch) => { if (batchModal) dispatch({ type: 'UPDATE_MATERIAL_BATCH', payload: { id: batchModal.batch.id, ...patch } }); closeBatch(); };
  const linkBatchPlan = (planId) => {
    if (!batchModal) return;
    dispatch({ type: 'UPDATE_MATERIAL_BATCH', payload: { id: batchModal.batch.id, planId } });
    const plan = (state.workflowProductionPlans || []).find((p) => p.id === planId);
    if (plan) dispatch({ type: 'UPDATE_PRODUCTION_PLAN', payload: { id: planId, materialBatchIds: [...new Set([...(plan.materialBatchIds || []), batchModal.batch.id])] } });
    closeBatch();
  };

  useEffect(() => {
    const r = searchParams.get('result');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (r) setFilterResult(r);
  }, [searchParams]);

  const batches = state.materialBatches || [];
  const suppliers = ['全部', ...new Set(batches.map((b) => b.supplier).filter(Boolean))];

  // 跨 Tab 跳转：批次 → 实例（按来源批次筛选）、库存汇总 → 实例/批次（按模块类型筛选）。
  const viewInstancesByBatchId = (batchId) => { setInstanceBatchId(batchId); setInstanceModuleTypeId(''); setActiveTab('模块实例追踪'); };
  const viewInstancesByModuleType = (moduleTypeId) => { setInstanceModuleTypeId(moduleTypeId); setInstanceBatchId(''); setActiveTab('模块实例追踪'); };
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
      <div className="mb-4">
        <button type="button" onClick={() => setShowIntro((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 border border-slate-200 rounded px-2.5 py-1 hover:bg-slate-50">
          <span>💡</span>查看模块来料说明
          <span className={`text-slate-400 transition-transform ${showIntro ? 'rotate-90' : ''}`}>›</span>
        </button>
        {showIntro && (
          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600 mt-2 space-y-1">
            <div>模块来料用于管理供应商到货批次、具体模块 SN 实例和模块库存水位：</div>
            <div className="text-slate-500">· <span className="font-medium">模块批次管理</span>：这一批货到了多少、检验结果怎样、是否可用于生产计划。</div>
            <div className="text-slate-500">· <span className="font-medium">模块实例追踪</span>：每个模块 SN 当前在哪里（在库 / 锁定 / 装配 / 维修 / 报废）。</div>
            <div className="text-slate-500">· <span className="font-medium">模块库存汇总</span>：某类模块现在可用多少、已锁定多少、已装配多少、维修 / 报废多少。</div>
            <div className="text-slate-400 pt-0.5">ERP 批次 / 出库 / 库存是 ERP 主账；平台只做 ERP 记录关联展示和模块 SN 追踪，不替代 ERP 库存主账。</div>
          </div>
        )}
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
          <ModuleInventoryTab moduleInstances={moduleInstances} moduleTypes={state.moduleTypes} deviceTypes={state.deviceTypes} batches={state.materialBatches} onViewInstances={viewInstancesByModuleType} onViewBatches={viewBatchByCategory} />
        </>
      )}

      {activeTab === '模块实例追踪' && (
        <ModuleInstanceTab
          moduleInstances={moduleInstances}
          devices={state.devices}
          moduleTypes={state.moduleTypes}
          batches={state.materialBatches}
          batchIdFilter={instanceBatchId}
          moduleTypeFilter={instanceModuleTypeId}
          onClearBatch={() => setInstanceBatchId('')}
          onClearModuleType={() => setInstanceModuleTypeId('')}
          onViewBatch={viewBatchByNo}
          onMark={markInstance}
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
                  {['批次号', '模块类型', '型号', '供应商', 'ERP采购单号', 'ERP到货通知单号', '到货数量', '合格数量', '不合格数量', '检验结果', '可用数量', '已锁定数量', '已装配数量', '关联生产计划', '检验时间', '操作'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.pageItems.map((b) => {
                  const passCount = b.items.filter((it) => it.result === '合格' || it.result === '特批使用').length;
                  const failCount = b.items.filter((it) => it.result === '不合格').length;
                  const plan = workflowProductionPlans.find(p => p.id === b.planId || (p.materialBatchIds || []).includes(b.id));
                  const availItems = b.items.filter((it) => it.status === '待装配').length;
                  const usedItems = b.items.filter((it) => it.status === '已占用').length;
                  const planDtName = plan ? (deviceTypeNameOf(plan.deviceTypeId) || plan.deviceType || '') : '';
                  const planLabel = plan ? `${plan.id}｜${plan.name || plan.id}${planDtName ? '｜' + planDtName : ''}` : '';
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
                      <td className="px-3 py-2.5 text-gray-700">{plan ? 0 : availItems}</td>
                      <td className="px-3 py-2.5 text-indigo-600">{plan ? availItems : 0}</td>
                      <td className="px-3 py-2.5 text-gray-600">{usedItems}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap max-w-[220px]">
                        {plan ? (
                          <Link to={`/production-plans/${plan.id}`} className="text-blue-600 hover:underline truncate inline-block max-w-[220px] align-bottom" title={planLabel}>
                            {planLabel}
                          </Link>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">{b.inspectionTime}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                        {(() => {
                          // 批次操作状态机（任务三 5 条规则）：
                          //  1 未关联/未装配/未停用 → 全部可用
                          //  2 已关联未装配        → 编辑(非关键)/录入/关联可用；停用作废置灰
                          //  3 已装配使用          → 仅查看详情/查看实例；编辑/作废/录入/关联置灰
                          //  4 检验不合格          → 不可关联(除非特批)；录入/停用作废/查看实例可用
                          //  5 已停用/作废         → 仅查看详情/查看实例
                          const items = b.items || [];
                          const used = items.some((it) => it.status === '已占用');       // 已被装配使用
                          const linked = !!plan;                                          // 已关联生产计划
                          const retired = !!b.voided || (items.length > 0 && items.every((it) => ['已报废', '退货换货'].includes(it.status)));
                          const hasFail = items.some((it) => it.result === '不合格');
                          const hasSpecial = items.some((it) => it.result === '特批使用'); // 特批可用
                          const inspectDisabled = retired || used;
                          const linkDisabled = retired || used || (hasFail && !hasSpecial);
                          const editDisabled = retired || used;
                          const voidDisabled = retired || used || linked;
                          const inspectTitle = retired ? '批次已停用/作废，不可录入检验' : used ? '该批次已装配使用，不可再录入检验' : '';
                          const linkTitle = retired ? '批次已停用/作废，不可关联' : used ? '该批次已装配使用，不可再关联' : (hasFail && !hasSpecial) ? '批次存在不合格且无特批可用，不允许关联生产计划' : '';
                          const editTitle = retired ? '批次已停用/作废，仅可查看详情' : used ? '该批次已有模块装配到整机，不允许修改关键字段' : '';
                          const voidTitle = retired ? '批次已停用/作废' : used ? '该批次已有模块装配到整机，不允许作废' : linked ? '该批次已关联生产计划，请先解除关联或确认未使用' : '';
                          const op = (label, cls, onClick, dis, title) => dis
                            ? <span className="text-gray-300 cursor-not-allowed" title={title}>{label}</span>
                            : <button className={cls} onClick={onClick}>{label}</button>;
                          return (
                            <div className="flex items-center gap-x-3">
                              <button className="text-slate-600 hover:underline" onClick={() => openBatch('detail', b)}>查看详情</button>
                              {op('录入检验结果', 'text-slate-600 hover:underline', () => openBatch('inspect', b), inspectDisabled, inspectTitle)}
                              {op('关联生产计划', 'text-emerald-600 hover:underline', () => openBatch('link', b), linkDisabled, linkTitle)}
                              <button className="text-blue-600 hover:underline" onClick={() => viewInstancesByBatchId(b.id)}>查看模块实例</button>
                              {op('编辑', 'text-slate-600 hover:underline', () => openBatch('edit', b), editDisabled, editTitle)}
                              {op('停用/作废', 'text-red-400 hover:text-red-600 hover:underline', () => openBatch('void', b), voidDisabled, voidTitle)}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={16} className="px-4 py-8 text-center text-gray-400">暂无来料批次</td></tr>
                )}
              </tbody>
            </table>
            </div>
            <Pagination page={paged.page} total={paged.total} totalPages={paged.totalPages} onChange={paged.setPage} />
          </div>
        </>
      )}

      <AddBatchModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={handleAdd} />
      {batchModal?.type === 'detail' && <BatchDetailModal isOpen batch={batchModal.batch} plan={workflowProductionPlans.find((p) => p.id === batchModal.batch.planId || (p.materialBatchIds || []).includes(batchModal.batch.id))} onClose={closeBatch} onViewInstances={viewInstancesByBatchId} />}
      {batchModal?.type === 'inspect' && <BatchInspectModal isOpen batch={batchModal.batch} onClose={closeBatch} onSave={saveBatch} />}
      {batchModal?.type === 'link' && <BatchLinkPlanModal isOpen batch={batchModal.batch} plans={workflowProductionPlans} currentPlan={workflowProductionPlans.find((p) => p.id === batchModal.batch.planId || (p.materialBatchIds || []).includes(batchModal.batch.id))} onClose={closeBatch} onSave={linkBatchPlan} />}
      {batchModal?.type === 'edit' && <BatchEditModal isOpen batch={batchModal.batch} onClose={closeBatch} onSave={saveBatch} />}
      {batchModal?.type === 'void' && (
        <BatchVoidModal batch={batchModal.batch} onClose={closeBatch} onConfirm={(reason) => saveBatch({ voided: true, voidReason: reason })} />
      )}
    </div>
  );
}
