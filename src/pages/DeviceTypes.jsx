import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

const CATEGORIES = ['底盘', '机械臂', '电机', '末端', '全身相机', '预控'];

function AddModuleTypeModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', category: '底盘', specs: '', urdf: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
    setForm({ name: '', category: '底盘', specs: '', urdf: '' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增模块类型">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">模块名称 *</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">物料大类</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">规格参数</label>
          <input type="text" value={form.specs} onChange={(e) => setForm({ ...form, specs: e.target.value })}
            placeholder="e.g. 承重≥80kg"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500" />
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
  const [form, setForm] = useState({ name: '', urdf: '', slots: [] });

  const addSlot = () => {
    if (moduleTypes.length > 0) {
      setForm((prev) => ({
        ...prev,
        slots: [...prev.slots, { id: `slot-${Date.now()}-${prev.slots.length}`, slotName: '', moduleTypeId: moduleTypes[0].id, quantity: 1 }],
      }));
    }
  };

  const removeSlot = (idx) => setForm((prev) => ({ ...prev, slots: prev.slots.filter((_, i) => i !== idx) }));
  const updateSlot = (idx, key, value) => setForm((prev) => ({
    ...prev,
    slots: prev.slots.map((s, i) => i === idx ? { ...s, [key]: value } : s),
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name: form.name, urdf: form.urdf, slots: form.slots });
    onClose();
    setForm({ name: '', urdf: '', slots: [] });
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
            <label className="text-sm font-medium text-gray-700">槁位配置</label>
            <button type="button" onClick={addSlot}
              className="text-xs text-slate-600 hover:text-slate-800 border border-slate-300 rounded px-2 py-1">
              + 添加槁位
            </button>
          </div>
          {form.slots.length === 0 && (
            <div className="text-sm text-gray-400 py-2 border border-dashed border-gray-200 rounded text-center">
              尚未添加槁位，点击上方按钮添加
            </div>
          )}
          <div className="space-y-2">
            {form.slots.map((slot, idx) => (
              <div key={idx} className="flex gap-2 items-center bg-gray-50 rounded p-2">
                <input type="text" value={slot.slotName} onChange={(e) => updateSlot(idx, 'slotName', e.target.value)}
                  placeholder="槁位名称（如：左臂槁位）"
                  className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none bg-white" />
                <select value={slot.moduleTypeId} onChange={(e) => updateSlot(idx, 'moduleTypeId', e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none bg-white">
                  {moduleTypes.map((mt) => (
                    <option key={mt.id} value={mt.id}>{mt.name} ({mt.category})</option>
                  ))}
                </select>
                <input type="number" min="1" value={slot.quantity}
                  onChange={(e) => updateSlot(idx, 'quantity', Number(e.target.value))}
                  className="w-14 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none bg-white" />
                <span className="text-xs text-gray-400">件</span>
                <button type="button" onClick={() => removeSlot(idx)}
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
  const [activeTab, setActiveTab] = useState('整机类型');
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
    dispatch({ type: 'ADD_MODULE_TYPE', payload: { id: `MT-${Date.now()}`, ...form, active: true } });
  };

  const handleAddDeviceType = (form) => {
    dispatch({ type: 'ADD_DEVICE_TYPE', payload: { id: `DT-${Date.now()}`, name: form.name, urdf: form.urdf, slots: form.slots } });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">设备类型管理</h1>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200">
        {['整机类型', '模块类型库'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-slate-700 text-slate-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 整机类型 tab */}
      {activeTab === '整机类型' && (
        <div className="bg-white rounded shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-700">整机类型列表</h2>
            <button onClick={() => setShowDeviceTypeModal(true)}
              className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
              + 新增整机类型
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['', 'ID', '整机名称', 'URDF文件', '槁位数', '操作'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.deviceTypes.map((dt) => {
                const isExpanded = expandedIds.has(dt.id);
                const slots = dt.slots || [];
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
                          {slots.length} 个槁位
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
                            <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">槁位配置表</div>
                            {slots.length > 0 ? (
                              <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">槁位名称</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">引用模块类型</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">大类</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">数量</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {slots.map((slot, i) => (
                                    <tr key={i} className="bg-white">
                                      <td className="px-3 py-2 text-gray-800 font-medium">{slot.slotName}</td>
                                      <td className="px-3 py-2 text-gray-700">{getModuleName(slot.moduleTypeId)}</td>
                                      <td className="px-3 py-2">
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{getModuleCategory(slot.moduleTypeId)}</span>
                                      </td>
                                      <td className="px-3 py-2 font-bold text-slate-700">×{slot.quantity}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="text-sm text-gray-400">暂无槁位配置</div>
                            )}
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
      )}

      {/* 模块类型库 tab */}
      {activeTab === '模块类型库' && (
        <div className="bg-white rounded shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-700">模块类型库</h2>
            <button onClick={() => setShowModuleModal(true)}
              className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
              + 新增模块类型
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['ID', '模块名称', '物料大类', '规格参数', 'URDF文件', '状态'].map((h) => (
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
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{mt.specs || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{mt.urdf || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${mt.active !== false ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>
                      {mt.active !== false ? '启用' : '停用'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddModuleTypeModal isOpen={showModuleModal} onClose={() => setShowModuleModal(false)} onSave={handleAddModuleType} />
      <AddDeviceTypeModal isOpen={showDeviceTypeModal} onClose={() => setShowDeviceTypeModal(false)} onSave={handleAddDeviceType} moduleTypes={state.moduleTypes} />
    </div>
  );
}
