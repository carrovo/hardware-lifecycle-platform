import { useState } from 'react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

const STAGES = ['出厂检验', '现场安装调试', '客户验收'];

function AddDeliveryModal({ isOpen, onClose, onSave, stage, devices, projects }) {
  const [form, setForm] = useState({
    deviceId: '', projectId: '', result: stage === '出厂检验' ? '合格' : '通过',
    operator: '', recordTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
    notes: '', address: '',
  });

  const resultOptions = stage === '出厂检验' ? ['合格', '不合格'] : ['通过', '未通过'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, stage });
    onClose();
    setForm({ deviceId: '', projectId: '', result: resultOptions[0], operator: '', recordTime: new Date().toISOString().slice(0, 16).replace('T', ' '), notes: '', address: '' });
  };

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });
  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`新增${stage}记录`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">设备 *</label>
          <select className={inputClass} required {...f('deviceId')}>
            <option value="">-- 选择设备 --</option>
            {devices.map((d) => <option key={d.id} value={d.id}>{d.sn}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">所属项目</label>
          <select className={inputClass} {...f('projectId')}>
            <option value="">-- 选择项目 --</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结果 *</label>
            <select className={inputClass} required {...f('result')}>
              {resultOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">操作人</label>
            <input type="text" className={inputClass} {...f('operator')} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">记录时间</label>
          <input type="text" className={inputClass} {...f('recordTime')} />
        </div>
        {(stage === '现场安装调试' || stage === '客户验收') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">安装地址</label>
            <input type="text" className={inputClass} {...f('address')} />
          </div>
        )}
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

export default function Delivery() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('出厂检验');
  const [showModal, setShowModal] = useState(false);

  const { deliveryRecords, devices, projects } = state;

  const allocatedDevices = devices.filter((d) =>
    ['已分配项目', '在线运营'].includes(d.status)
  );

  const filteredRecords = [...deliveryRecords]
    .filter((r) => r.stage === activeTab)
    .sort((a, b) => b.recordTime.localeCompare(a.recordTime));

  const getDeviceSN = (id) => devices.find((d) => d.id === id)?.sn || id;
  const getProjectName = (id) => projects.find((p) => p.id === id)?.name || id;

  const stageResultMap = {
    '出厂检验': ['合格', '不合格'],
    '现场安装调试': ['通过', '未通过'],
    '客户验收': ['通过', '未通过'],
  };

  const handleSave = (form) => {
    dispatch({
      type: 'ADD_DELIVERY_RECORD',
      payload: {
        id: `DELIV-${Date.now()}`,
        ...form,
      },
    });
  };

  const passResult = stageResultMap[activeTab]?.[0];
  const failResult = stageResultMap[activeTab]?.[1];
  const passCount = filteredRecords.filter((r) => r.result === passResult).length;
  const failCount = filteredRecords.filter((r) => r.result === failResult).length;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">交付流程</h1>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-4">
        {STAGES.map((stage) => {
          const count = deliveryRecords.filter((r) => r.stage === stage).length;
          return (
            <button key={stage} onClick={() => setActiveTab(stage)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === stage ? 'border-slate-700 text-slate-800' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {stage}
              <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Stats + action */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4 text-sm">
          <span className="text-green-600 font-medium">{passResult}: {passCount}</span>
          <span className="text-red-500 font-medium">{failResult}: {failCount}</span>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
          + 新增记录
        </button>
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['记录时间', '设备SN', '所属项目', '结果', '操作人', activeTab !== '出厂检验' ? '地址' : '', '备注'].filter(Boolean).map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRecords.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-400 text-xs">{r.recordTime}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-800 font-medium">{getDeviceSN(r.deviceId)}</td>
                <td className="px-4 py-2.5 text-gray-600">{r.projectId ? getProjectName(r.projectId) : '—'}</td>
                <td className="px-4 py-2.5"><StatusBadge status={r.result} /></td>
                <td className="px-4 py-2.5 text-gray-600">{r.operator || '—'}</td>
                {activeTab !== '出厂检验' && <td className="px-4 py-2.5 text-gray-500 text-xs">{r.address || '—'}</td>}
                <td className="px-4 py-2.5 text-gray-500 text-xs max-w-xs truncate">{r.notes || '—'}</td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无{activeTab}记录</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AddDeliveryModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          stage={activeTab}
          devices={allocatedDevices}
          projects={projects}
        />
      )}
    </div>
  );
}
