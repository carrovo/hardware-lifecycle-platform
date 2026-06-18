import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

const CATEGORIES = ['底盘', '机械臂', '电机', '末端', '全身相机', '预控'];

function AddModuleTypeModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', category: '底盘', urdf: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
    setForm({ name: '', category: '底盘', urdf: '' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增模组类型">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">模组名称</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">物料类别</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URDF文件名</label>
          <input type="text" value={form.urdf} onChange={(e) => setForm({ ...form, urdf: e.target.value })}
            placeholder="e.g. module_v1.urdf"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存</button>
        </div>
      </form>
    </Modal>
  );
}

function AddDeviceTypeModal({ isOpen, onClose, onSave, moduleTypes }) {
  const [form, setForm] = useState({ name: '', urdf: '', modules: [] });

  const addModule = () => {
    if (moduleTypes.length > 0) {
      setForm((prev) => ({
        ...prev,
        modules: [...prev.modules, { moduleTypeId: moduleTypes[0].id, quantity: 1 }],
      }));
    }
  };

  const removeModule = (idx) => setForm((prev) => ({ ...prev, modules: prev.modules.filter((_, i) => i !== idx) }));
  const updateModule = (idx, key, value) => setForm((prev) => ({
    ...prev,
    modules: prev.modules.map((m, i) => i === idx ? { ...m, [key]: value } : m),
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, requiredModules: form.modules });
    onClose();
    setForm({ name: '', urdf: '', modules: [] });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增整机类型" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">整机名称 *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URDF文件名</label>
            <input type="text" value={form.urdf} onChange={(e) => setForm({ ...form, urdf: e.target.value })}
              placeholder="e.g. device_v1.urdf"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">所需模组配置</label>
            <button type="button" onClick={addModule}
              className="text-xs text-slate-600 hover:text-slate-800 border border-slate-300 rounded px-2 py-1">
              + 添加模组
            </button>
          </div>
          {form.modules.length === 0 && (
            <div className="text-sm text-gray-400 py-2 border border-dashed border-gray-200 rounded text-center">
              尚未添加模组，点击上方按钮添加
            </div>
          )}
          <div className="space-y-2">
            {form.modules.map((mod, idx) => (
              <div key={idx} className="flex gap-2 items-center bg-gray-50 rounded p-2">
                <select value={mod.moduleTypeId} onChange={(e) => updateModule(idx, 'moduleTypeId', e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none bg-white">
                  {moduleTypes.map((mt) => (
                    <option key={mt.id} value={mt.id}>{mt.name} ({mt.category})</option>
                  ))}
                </select>
                <input type="number" min="1" value={mod.quantity}
                  onChange={(e) => updateModule(idx, 'quantity', Number(e.target.value))}
                  className="w-16 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none bg-white" />
                <span className="text-sm text-gray-500">件</span>
                <button type="button" onClick={() => removeModule(idx)}
                  className="text-red-400 hover:text-red-600 text-lg leading-none w-6 text-center">×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存</button>
        </div>
      </form>
    </Modal>
  );
}

export default function DeviceTypes() {
  const { state, dispatch } = useApp();
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showDeviceTypeModal, setShowDeviceTypeModal] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const getModuleName = (id) => state.moduleTypes.find((m) => m.id === id)?.name || id;
  const getModuleCategory = (id) => state.moduleTypes.find((m) => m.id === id)?.category || '';

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddModuleType = (form) => {
    dispatch({ type: 'ADD_MODULE_TYPE', payload: { id: `MT-${Date.now()}`, ...form } });
  };

  const handleAddDeviceType = (form) => {
    dispatch({ type: 'ADD_DEVICE_TYPE', payload: { id: `DT-${Date.now()}`, name: form.name, urdf: form.urdf, requiredModules: form.requiredModules } });
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-xl font-bold text-gray-800">设备类型管理</h1>

      {/* 整机类型 */}
      <div className="bg-white rounded shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-700">整机类型</h2>
          <button onClick={() => setShowDeviceTypeModal(true)}
            className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
            + 新增整机类型
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['', 'ID', '整机名称', 'URDF文件', '模组数', '操作'].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.deviceTypes.map((dt) => {
              const isExpanded = expandedIds.has(dt.id);
              const totalModules = dt.requiredModules.reduce((s, r) => s + r.quantity, 0);
              return (
                <>
                  <tr key={dt.id}
                    onClick={() => toggleExpand(dt.id)}
                    className={`cursor-pointer border-t border-gray-100 transition-colors ${isExpanded ? 'bg-slate-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3 text-gray-400 text-sm w-8">
                      <span>{isExpanded ? '▼' : '▶'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{dt.id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{dt.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{dt.urdf || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs px-2 py-0.5">
                        {dt.requiredModules.length} 种 · {totalModules} 件
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500 hover:underline" onClick={(e) => { e.stopPropagation(); toggleExpand(dt.id); }}>
                        {isExpanded ? '收起' : '展开'}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${dt.id}-expand`}>
                      <td colSpan={6} className="px-0 py-0 bg-slate-50 border-b border-slate-200">
                        <div className="px-12 py-4">
                          <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">所需模组配置</div>
                          <div className="grid grid-cols-3 gap-2">
                            {dt.requiredModules.map((rm, i) => (
                              <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-800">{getModuleName(rm.moduleTypeId)}</div>
                                  <div className="text-xs text-gray-400 mt-0.5">{getModuleCategory(rm.moduleTypeId)}</div>
                                </div>
                                <span className="text-sm font-bold text-slate-700">×{rm.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {state.deviceTypes.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无整机类型</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 模组类型 */}
      <div className="bg-white rounded shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-700">模组类型</h2>
          <button onClick={() => setShowModuleModal(true)}
            className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
            + 新增模组类型
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['ID', '模组名称', '物料类别', 'URDF文件'].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {state.moduleTypes.map((mt) => (
              <tr key={mt.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{mt.id}</td>
                <td className="px-4 py-2.5 font-medium text-gray-800">{mt.name}</td>
                <td className="px-4 py-2.5">
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{mt.category}</span>
                </td>
                <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{mt.urdf || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddModuleTypeModal isOpen={showModuleModal} onClose={() => setShowModuleModal(false)} onSave={handleAddModuleType} />
      <AddDeviceTypeModal isOpen={showDeviceTypeModal} onClose={() => setShowDeviceTypeModal(false)} onSave={handleAddDeviceType} moduleTypes={state.moduleTypes} />
    </div>
  );
}
