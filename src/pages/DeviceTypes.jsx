import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import Modal from '../components/Modal';

const CATEGORIES = ['底盘', '机械臂', '电机', '末端', '全身相机', '预控'];

function ModuleTypeModal({ isOpen, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || { name: '', category: '底盘', specs: '', urdf: '', active: true });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
    if (!initial) setForm({ name: '', category: '底盘', specs: '', urdf: '', active: true });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? '编辑模块类型' : '新增模块类型'}>
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

function DeviceTypeModal({ isOpen, onClose, onSave, moduleTypes, initial }) {
  const [form, setForm] = useState(initial || { name: '', urdf: '', slots: [] });

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
    if (!initial) setForm({ name: '', urdf: '', slots: [] });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? '编辑整机类型' : '新增整机类型'} size="lg">
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
  const { canDo } = useRole();
  const [activeTab, setActiveTab] = useState('整机类型');
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showDeviceTypeModal, setShowDeviceTypeModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [editingDeviceType, setEditingDeviceType] = useState(null);
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

  const handleEditModuleType = (form) => {
    dispatch({ type: 'UPDATE_MODULE_TYPE', payload: { id: editingModule.id, ...form } });
    setEditingModule(null);
  };

  const handleToggleActive = (mt) => {
    dispatch({ type: 'UPDATE_MODULE_TYPE', payload: { id: mt.id, active: !mt.active } });
  };

  const handleAddDeviceType = (form) => {
    dispatch({ type: 'ADD_DEVICE_TYPE', payload: { id: `DT-${Date.now()}`, name: form.name, urdf: form.urdf, slots: form.slots } });
  };

  const handleEditDeviceType = (form) => {
    dispatch({ type: 'UPDATE_DEVICE_TYPE', payload: { id: editingDeviceType.id, ...form } });
    setEditingDeviceType(null);
  };

  const getReferencingDeviceTypes = (moduleTypeId) => {
    return state.deviceTypes.filter((dt) =>
      (dt.slots || []).some((s) => s.moduleTypeId === moduleTypeId)
    );
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
            {canDo('add_device_type') && (
              <button onClick={() => setShowDeviceTypeModal(true)}
                className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
                + 新增整机类型
              </button>
            )}
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
                        {canDo('edit_device_type') && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingDeviceType(dt); }}
                            className="text-xs text-slate-600 hover:underline mr-3"
                          >编辑</button>
                        )}
                        <span className="text-xs text-slate-500 hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleExpand(dt.id); }}>
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
            {canDo('add_module_type') && (
              <button onClick={() => setShowModuleModal(true)}
                className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
                + 新增模块类型
              </button>
            )}
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['', 'ID', '模块名称', '物料大类', '规格参数', 'URDF文件', '状态', '操作'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.moduleTypes.map((mt) => {
                const isExpanded = expandedIds.has(mt.id);
                const referencedBy = getReferencingDeviceTypes(mt.id);
                return (
                  <>
                    <tr key={mt.id}
                      onClick={() => toggleExpand(mt.id)}
                      className={`cursor-pointer border-t border-gray-100 transition-colors ${!mt.active ? 'opacity-60' : ''} ${isExpanded ? 'bg-slate-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-2.5 text-gray-400 w-8">{isExpanded ? '▼' : '▶'}</td>
                      <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{mt.id}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{mt.name}</td>
                      <td className="px-4 py-2.5">
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{mt.category}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs max-w-48 truncate">{mt.specs || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{mt.urdf || '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${mt.active !== false ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>
                          {mt.active !== false ? '启用' : '已停用'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                          {canDo('edit_module_type') && (
                            <button onClick={() => setEditingModule(mt)} className="text-xs text-slate-600 hover:underline">编辑</button>
                          )}
                          {canDo('edit_module_type') && (
                            <button
                              onClick={() => handleToggleActive(mt)}
                              className={`text-xs hover:underline ${mt.active !== false ? 'text-red-500' : 'text-green-600'}`}
                            >
                              {mt.active !== false ? '停用' : '启用'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${mt.id}-expand`}>
                        <td colSpan={8} className="px-0 py-0 bg-slate-50 border-b border-slate-200">
                          <div className="px-12 py-4 grid grid-cols-2 gap-6">
                            <div>
                              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">规格详情</div>
                              <div className="space-y-1 text-sm">
                                <div className="flex gap-2">
                                  <span className="text-gray-400 min-w-16 text-xs">规格参数</span>
                                  <span className="text-gray-700">{mt.specs || '—'}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-gray-400 min-w-16 text-xs">URDF文件</span>
                                  <span className="text-gray-700 font-mono text-xs">{mt.urdf || '—'}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                                被引用的整机类型 ({referencedBy.length})
                              </div>
                              {referencedBy.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {referencedBy.map((dt) => (
                                    <span key={dt.id} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded-full">
                                      {dt.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">暂未被任何整机类型引用</span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {state.moduleTypes.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">暂无模块类型</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModuleModal && (
        <ModuleTypeModal isOpen={showModuleModal} onClose={() => setShowModuleModal(false)} onSave={handleAddModuleType} />
      )}
      {editingModule && (
        <ModuleTypeModal isOpen={!!editingModule} onClose={() => setEditingModule(null)} onSave={handleEditModuleType} initial={editingModule} />
      )}
      {showDeviceTypeModal && (
        <DeviceTypeModal isOpen={showDeviceTypeModal} onClose={() => setShowDeviceTypeModal(false)} onSave={handleAddDeviceType} moduleTypes={state.moduleTypes} />
      )}
      {editingDeviceType && (
        <DeviceTypeModal isOpen={!!editingDeviceType} onClose={() => setEditingDeviceType(null)} onSave={handleEditDeviceType} moduleTypes={state.moduleTypes} initial={editingDeviceType} />
      )}
    </div>
  );
}
