import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

function AddModuleTypeModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', category: '底盘', urdf: '' });
  const categories = ['底盘', '机械臂', '电机', '末端', '全身相机', '预控'];

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
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">物料类别</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URDF文件名</label>
          <input
            type="text"
            value={form.urdf}
            onChange={(e) => setForm({ ...form, urdf: e.target.value })}
            placeholder="e.g. module_v1.urdf"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
          />
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

  const removeModule = (idx) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== idx),
    }));
  };

  const updateModule = (idx, key, value) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) => i === idx ? { ...m, [key]: value } : m),
    }));
  };

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
            <label className="block text-sm font-medium text-gray-700 mb-1">整机名称</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URDF文件名</label>
            <input
              type="text"
              value={form.urdf}
              onChange={(e) => setForm({ ...form, urdf: e.target.value })}
              placeholder="e.g. device_v1.urdf"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">所需模组配置</label>
            <button
              type="button"
              onClick={addModule}
              className="text-xs text-slate-600 hover:text-slate-800 border border-slate-300 rounded px-2 py-1"
            >
              + 添加模组
            </button>
          </div>
          {form.modules.length === 0 && (
            <div className="text-sm text-gray-400 py-2">尚未添加模组</div>
          )}
          <div className="space-y-2">
            {form.modules.map((mod, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <select
                  value={mod.moduleTypeId}
                  onChange={(e) => updateModule(idx, 'moduleTypeId', e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none"
                >
                  {moduleTypes.map((mt) => (
                    <option key={mt.id} value={mt.id}>{mt.name} ({mt.category})</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={mod.quantity}
                  onChange={(e) => updateModule(idx, 'quantity', Number(e.target.value))}
                  className="w-16 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none"
                />
                <span className="text-sm text-gray-500">件</span>
                <button
                  type="button"
                  onClick={() => removeModule(idx)}
                  className="text-red-400 hover:text-red-600 text-lg leading-none"
                >
                  ×
                </button>
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

  const getModuleName = (id) => state.moduleTypes.find((m) => m.id === id)?.name || id;

  const handleAddModuleType = (form) => {
    dispatch({
      type: 'ADD_MODULE_TYPE',
      payload: {
        id: `MT-${Date.now()}`,
        name: form.name,
        category: form.category,
        urdf: form.urdf,
      },
    });
  };

  const handleAddDeviceType = (form) => {
    dispatch({
      type: 'ADD_DEVICE_TYPE',
      payload: {
        id: `DT-${Date.now()}`,
        name: form.name,
        urdf: form.urdf,
        requiredModules: form.requiredModules,
      },
    });
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-xl font-bold text-gray-800">设备类型管理</h1>

      {/* 整机类型 */}
      <div className="bg-white rounded shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-700">整机类型</h2>
          <button
            onClick={() => setShowDeviceTypeModal(true)}
            className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-800"
          >
            + 新增整机类型
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['ID', '整机名称', 'URDF文件', '所需模组配置'].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {state.deviceTypes.map((dt) => (
              <tr key={dt.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-500 font-mono text-xs">{dt.id}</td>
                <td className="px-4 py-2 font-medium text-gray-800">{dt.name}</td>
                <td className="px-4 py-2 text-gray-500 font-mono text-xs">{dt.urdf || '—'}</td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {dt.requiredModules.map((rm, i) => (
                      <span
                        key={i}
                        className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
                      >
                        {getModuleName(rm.moduleTypeId)} × {rm.quantity}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 模组类型 */}
      <div className="bg-white rounded shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-700">模组类型</h2>
          <button
            onClick={() => setShowModuleModal(true)}
            className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-800"
          >
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
              <tr key={mt.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-500 font-mono text-xs">{mt.id}</td>
                <td className="px-4 py-2 font-medium text-gray-800">{mt.name}</td>
                <td className="px-4 py-2 text-gray-600">{mt.category}</td>
                <td className="px-4 py-2 text-gray-500 font-mono text-xs">{mt.urdf || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddModuleTypeModal
        isOpen={showModuleModal}
        onClose={() => setShowModuleModal(false)}
        onSave={handleAddModuleType}
      />
      <AddDeviceTypeModal
        isOpen={showDeviceTypeModal}
        onClose={() => setShowDeviceTypeModal(false)}
        onSave={handleAddDeviceType}
        moduleTypes={state.moduleTypes}
      />
    </div>
  );
}
