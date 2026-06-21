import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import { MATERIAL_CATEGORIES } from '../data/mockData';

const CATEGORY_ICONS = {
  '底盘':    '🚗',
  '机械臂':  '🦾',
  '电机':    '⚡',
  '末端':    '🔩',
  '全身相机': '📷',
  '预控':    '💻',
};

const RESULT_BADGE = {
  '合格':   { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300',  icon: '✓' },
  '不合格': { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300',    icon: '✗' },
  '特批使用':{ bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', icon: '!' },
};

const STATUS_BADGE = {
  '待装配': { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   icon: '○' },
  '已占用': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', icon: '●' },
  '退货换货':{ bg: 'bg-red-100',   text: 'text-red-700',    border: 'border-red-300',    icon: '↩' },
};

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
    notes: '',
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
      inspector: '', inspectionTime: new Date().toISOString().slice(0, 16).replace('T', ' '), notes: '' });
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
            <label className="block text-sm font-medium text-gray-700 mb-1">供应商</label>
            <input type="text" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" />
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

export default function Materials() {
  const { state, dispatch } = useApp();
  const [searchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('全部');
  const [filterSupplier, setFilterSupplier] = useState('全部');
  const [filterResult, setFilterResult] = useState('全部');
  const [filterItemStatus, setFilterItemStatus] = useState('全部');
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());

  useEffect(() => {
    const r = searchParams.get('result');
    if (r) setFilterResult(r);
  }, [searchParams]);

  const batches = state.materialBatches || [];
  const suppliers = ['全部', ...new Set(batches.map((b) => b.supplier).filter(Boolean))];

  const hasFilters = filterCategory !== '全部' || filterSupplier !== '全部' || filterResult !== '全部' || filterItemStatus !== '全部' || search;
  const clearFilters = () => {
    setFilterCategory('全部'); setFilterSupplier('全部');
    setFilterResult('全部'); setFilterItemStatus('全部'); setSearch('');
  };

  const filtered = batches.filter((b) => {
    const matchCat = filterCategory === '全部' || b.category === filterCategory;
    const matchSupplier = filterSupplier === '全部' || b.supplier === filterSupplier;
    const matchResult = filterResult === '全部' || b.items.some((it) => it.result === filterResult);
    const matchItemStatus = filterItemStatus === '全部' || b.items.some((it) => it.status === filterItemStatus);
    const matchSearch = !search ||
      b.batchNo.toLowerCase().includes(search.toLowerCase()) ||
      b.supplier.toLowerCase().includes(search.toLowerCase()) ||
      b.items.some((it) => it.sn.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSupplier && matchResult && matchItemStatus && matchSearch;
  });

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAdd = (form) => {
    dispatch({ type: 'ADD_MATERIAL_BATCH', payload: { id: `BATCH-${Date.now()}`, ...form } });
  };

  const totalItems = filtered.reduce((s, b) => s + b.items.length, 0);
  const failItems = filtered.reduce((s, b) => s + b.items.filter((it) => it.result === '不合格').length, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">来料检验</h1>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
          + 新增来料批次
        </button>
      </div>

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
            <label className="text-xs text-gray-500 whitespace-nowrap">物料状态</label>
            <select value={filterItemStatus} onChange={(e) => setFilterItemStatus(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none">
              <option value="全部">全部</option>
              <option value="待装配">待装配</option>
              <option value="已占用">已占用</option>
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
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['', '批次号', '类别', '型号', '供应商', '数量', '合格/不合格', '检验员', '检验时间', '备注'].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => {
              const passCount = b.items.filter((it) => it.result === '合格' || it.result === '特批使用').length;
              const failCount = b.items.filter((it) => it.result === '不合格').length;
              const isExpanded = expandedIds.has(b.id);
              return (
                <>
                  <tr key={b.id}
                    onClick={() => toggleExpand(b.id)}
                    className={`cursor-pointer transition-colors border-t border-gray-100 ${
                      failCount > 0 ? 'hover:bg-red-50' : 'hover:bg-blue-50'
                    } ${isExpanded ? 'bg-slate-50' : ''}`}>
                    <td className="px-3 py-2.5 text-gray-400 text-sm w-8">
                      <span className="transition-transform inline-block">{isExpanded ? '▼' : '▶'}</span>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-gray-800 font-mono text-xs">{b.batchNo}</td>
                    <td className="px-3 py-2.5 text-gray-700">
                      <span className="flex items-center gap-1">
                        <span>{CATEGORY_ICONS[b.category] || ''}</span>
                        <span>{b.category}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{b.model || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-500">{b.supplier}</td>
                    <td className="px-3 py-2.5 text-gray-700 font-medium">{b.items.length} 件</td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-2 text-xs">
                        <span className="text-green-600 font-medium">✓ {passCount}</span>
                        {failCount > 0 && <span className="text-red-600 font-medium">✗ {failCount}</span>}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{b.inspector}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">{b.inspectionTime}</td>
                    <td className="px-3 py-2.5 text-gray-400 text-xs max-w-xs truncate">{b.notes || '—'}</td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${b.id}-expand`}>
                      <td colSpan={10} className="px-0 py-0 bg-slate-50 border-b border-slate-200">
                        <div className="px-10 py-3">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-500 border-b border-gray-200">
                                <th className="text-left py-1.5 pr-4 font-medium">SN</th>
                                <th className="text-left py-1.5 pr-4 font-medium">检验结果</th>
                                <th className="text-left py-1.5 pr-4 font-medium">物料状态</th>
                                <th className="text-left py-1.5 font-medium">备注</th>
                              </tr>
                            </thead>
                            <tbody>
                              {b.items.map((it) => (
                                <tr key={it.id} className={`border-b border-gray-100 last:border-0 ${it.result === '不合格' ? 'bg-red-50' : ''}`}>
                                  <td className="py-1.5 pr-4 font-mono text-gray-700">{it.sn}</td>
                                  <td className="py-1.5 pr-4"><Badge map={RESULT_BADGE} value={it.result} /></td>
                                  <td className="py-1.5 pr-4"><Badge map={STATUS_BADGE} value={it.status} /></td>
                                  <td className="py-1.5 text-gray-400">{it.notes || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">暂无来料批次</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AddBatchModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={handleAdd} />
    </div>
  );
}
