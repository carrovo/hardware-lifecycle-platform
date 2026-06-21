import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

function AddProjectModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', client: '', contactPerson: '', contactPhone: '',
    background: '', notes: '', targetCount: 1, manager: '',
  });
  const { state } = useApp();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, targetCount: Number(form.targetCount) });
    onClose();
    setForm({ name: '', client: '', contactPerson: '', contactPhone: '', background: '', notes: '', targetCount: 1, manager: '' });
  };

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });
  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增项目" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目名称 *</label>
            <input type="text" className={inputClass} required {...f('name')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">目标需求量 *</label>
            <input type="number" min="1" className={inputClass} required {...f('targetCount')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">客户名称</label>
            <input type="text" className={inputClass} {...f('client')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目负责人</label>
            <select className={inputClass} {...f('manager')}>
              <option value="">-- 选择负责人 --</option>
              {state ? ['张三', '李四', '王五', '赵六'].map(u => <option key={u} value={u}>{u}</option>) : null}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
            <input type="text" className={inputClass} {...f('contactPerson')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
            <input type="text" className={inputClass} {...f('contactPhone')} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">项目背景</label>
          <textarea rows={3} className={inputClass} {...f('background')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea rows={2} className={inputClass} {...f('notes')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Projects() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const { projects, deviceAllocations, devices } = state;

  const getAllocatedCount = (projectId) => {
    const allocated = deviceAllocations
      .filter((a) => a.projectId === projectId)
      .map((a) => a.deviceId);
    return new Set(allocated).size;
  };

  const handleSave = (form) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    dispatch({
      type: 'ADD_PROJECT',
      payload: {
        id: `PROJ-${Date.now()}`,
        ...form,
        createdAt: now,
        updatedAt: now,
      },
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">项目列表</h1>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
          + 新增项目
        </button>
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['项目名称', '客户', '目标需求量', '已分配/目标', '项目负责人', '创建时间'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map((p) => {
              const allocated = getAllocatedCount(p.id);
              const pct = Math.min(Math.round((allocated / p.targetCount) * 100), 100);
              return (
                <tr key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="hover:bg-blue-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.client || '—'}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{p.targetCount} 台</td>
                  <td className="px-4 py-3 min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : pct > 50 ? 'bg-blue-500' : 'bg-amber-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 whitespace-nowrap">{allocated}/{p.targetCount}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.manager || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.createdAt}</td>
                </tr>
              );
            })}
            {projects.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无项目</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AddProjectModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={handleSave} />
    </div>
  );
}
