import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import { MATERIAL_CATEGORIES } from '../data/mockData';

const CATEGORY_ICONS = {
  '底盘':   '🚗',
  '机械臂': '🦾',
  '电机':   '⚡',
  '末端':   '🔩',
  '全身相机': '📷',
  '预控':   '💻',
};

const STATUS_BADGES = {
  '合格':   { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300',  icon: '✓' },
  '不合格': { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300',    icon: '✗' },
  '特批使用':{ bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', icon: '!' },
  '待装配': { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   icon: '○' },
  '已占用': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', icon: '●' },
  '退货换货':{ bg: 'bg-red-100',   text: 'text-red-700',    border: 'border-red-300',    icon: '↩' },
};

function InlineBadge({ status }) {
  const s = STATUS_BADGES[status] || { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', icon: '·' };
  return (
    <span className={`inline-flex items-center gap-1 border rounded-full text-xs px-2 py-0.5 font-medium ${s.bg} ${s.text} ${s.border}`}>
      <span>{s.icon}</span>
      <span>{status}</span>
    </span>
  );
}

function AddMaterialModal({ isOpen, onClose, onSave, existingSNs }) {
  const [form, setForm] = useState({
    sn: '', category: '底盘', model: '', batchNo: '', supplier: '',
    quantity: 1, inspectionResult: '合格', inspector: '',
    inspectionTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
    notes: '',
  });
  const [snError, setSnError] = useState('');

  const handleSnChange = (value) => {
    setForm({ ...form, sn: value });
    setSnError(existingSNs.includes(value) ? '该SN已存在，请检查' : '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (existingSNs.includes(form.sn)) { setSnError('该SN已存在'); return; }
    onSave({ ...form, status: form.inspectionResult === '不合格' ? '退货换货' : '待装配' });
    onClose();
    setForm({ sn: '', category: '底盘', model: '', batchNo: '', supplier: '',
      quantity: 1, inspectionResult: '合格', inspector: '',
      inspectionTime: new Date().toISOString().slice(0, 16).replace('T', ' '), notes: '' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增来料" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">序列号 (SN) *</label>
            <input type="text" value={form.sn} onChange={(e) => handleSnChange(e.target.value)}
              className={`w-full border rounded px-3 py-2 text-sm focus:outline-none ${snError ? 'border-red-400' : 'border-gray-300 focus:border-slate-500'}`}
              required />
            {snError && <p className="text-red-500 text-xs mt-1">{snError}</p>}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">批次号</label>
            <input type="text" value={form.batchNo} onChange={(e) => setForm({ ...form, batchNo: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">供应商</label>
            <input type="text" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
            <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">检验结果 *</label>
            <select value={form.inspectionResult} onChange={(e) => setForm({ ...form, inspectionResult: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500">
              <option value="合格">合格</option>
              <option value="不合格">不合格</option>
              <option value="特批使用">特批使用</option>
            </select>
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
        {form.inspectionResult === '不合格' && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
            检验不合格 — 物料状态将自动设为「退货换货」
          </div>
        )}
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

export default function Materials() {
  const { state, dispatch } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('全部');
  const [filterResult, setFilterResult] = useState('全部');
  const [search, setSearch] = useState('');

  const existingSNs = state.materials.map((m) => m.sn);

  const filtered = state.materials.filter((m) => {
    const matchCat = filterCategory === '全部' || m.category === filterCategory;
    const matchResult = filterResult === '全部' || m.inspectionResult === filterResult;
    const matchSearch = !search ||
      m.sn.toLowerCase().includes(search.toLowerCase()) ||
      m.batchNo.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchResult && matchSearch;
  });

  const handleAdd = (form) => {
    dispatch({ type: 'ADD_MATERIAL', payload: { id: `MAT-${Date.now()}`, ...form } });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">来料检验</h1>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
          + 新增来料
        </button>
      </div>

      <div className="bg-white rounded shadow-sm px-4 py-3 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">物料类别</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none">
            <option value="全部">全部</option>
            {MATERIAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">检验结果</label>
          <select value={filterResult} onChange={(e) => setFilterResult(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none">
            {['全部', '合格', '不合格', '特批使用'].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <input type="text" placeholder="搜索 SN / 批次号..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none w-48" />
        <div className="text-sm text-gray-400 ml-auto">共 {filtered.length} 条</div>
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['ID', 'SN', '类别', '型号', '批次号', '供应商', '检验结果', '物料状态', '检验员', '检验时间', '备注'].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((m) => (
              <tr key={m.id}
                className={`transition-colors hover:bg-blue-50 ${m.inspectionResult === '不合格' ? 'border-l-2 border-red-400' : ''}`}>
                <td className="px-3 py-2 text-gray-400 font-mono text-xs">{m.id}</td>
                <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap font-mono text-xs">{m.sn}</td>
                <td className="px-3 py-2 text-gray-700">
                  <span className="flex items-center gap-1">
                    <span>{CATEGORY_ICONS[m.category] || ''}</span>
                    <span>{m.category}</span>
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-600">{m.model}</td>
                <td className="px-3 py-2 text-gray-500 text-xs">{m.batchNo}</td>
                <td className="px-3 py-2 text-gray-500">{m.supplier}</td>
                <td className="px-3 py-2"><InlineBadge status={m.inspectionResult} /></td>
                <td className="px-3 py-2"><InlineBadge status={m.status} /></td>
                <td className="px-3 py-2 text-gray-600">{m.inspector}</td>
                <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{m.inspectionTime}</td>
                <td className="px-3 py-2 text-gray-400 text-xs max-w-32 truncate">{m.notes}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AddMaterialModal
        isOpen={showModal} onClose={() => setShowModal(false)}
        onSave={handleAdd} existingSNs={existingSNs}
      />
    </div>
  );
}
