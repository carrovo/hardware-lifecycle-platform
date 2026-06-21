import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

function AddAlertModal({ isOpen, onClose, onSave, devices }) {
  const [form, setForm] = useState({
    deviceId: '', severity: '轻微', description: '', source: '人工上报',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const device = devices.find((d) => d.id === form.deviceId);
    onSave({ ...form, deviceSN: device?.sn || '' });
    onClose();
    setForm({ deviceId: '', severity: '轻微', description: '', source: '人工上报' });
  };

  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增告警">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">设备 *</label>
          <select className={inputClass} required value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })}>
            <option value="">-- 选择设备 --</option>
            {devices.map((d) => <option key={d.id} value={d.id}>{d.sn}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">严重程度</label>
            <select className={inputClass} value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              <option>轻微</option>
              <option>严重</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">来源</label>
            <select className={inputClass} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              <option>人工上报</option>
              <option>系统自动</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">告警描述 *</label>
          <textarea rows={3} className={inputClass} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Alerts() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [filterSeverity, setFilterSeverity] = useState('全部');
  const [filterStatus, setFilterStatus] = useState('全部');
  const [showModal, setShowModal] = useState(false);

  const { alerts, devices, projects } = state;

  const onlineDevices = devices.filter((d) => d.status === '在线运营');
  const getProjectName = (id) => projects.find((p) => p.id === id)?.name || '—';

  const filtered = [...alerts]
    .filter((a) => {
      const matchSev = filterSeverity === '全部' || a.severity === filterSeverity;
      const matchSt = filterStatus === '全部' || a.status === filterStatus;
      return matchSev && matchSt;
    })
    .sort((a, b) => b.alertTime.localeCompare(a.alertTime));

  const handleSave = (form) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const device = devices.find((d) => d.id === form.deviceId);
    dispatch({
      type: 'ADD_ALERT',
      payload: {
        id: `ALERT-${Date.now()}`,
        deviceId: form.deviceId,
        projectId: device?.projectId || null,
        deviceSN: form.deviceSN,
        alertTime: now,
        source: form.source,
        severity: form.severity,
        description: form.description,
        status: '待处理',
        resolvedBy: null,
        resolvedAt: null,
        workOrderId: null,
      },
    });
  };

  const pendingCount = alerts.filter((a) => a.status === '待处理').length;
  const severeCount = alerts.filter((a) => a.severity === '严重' && a.status === '待处理').length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">告警中心</h1>
          {(pendingCount > 0 || severeCount > 0) && (
            <div className="flex gap-3 mt-1 text-sm">
              {severeCount > 0 && <span className="text-red-600 font-medium">{severeCount} 条严重告警待处理</span>}
              {pendingCount > 0 && <span className="text-amber-600">{pendingCount} 条告警待处理</span>}
            </div>
          )}
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
          + 新增告警
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">严重程度：</span>
          {['全部', '轻微', '严重'].map((opt) => (
            <button key={opt} onClick={() => setFilterSeverity(opt)}
              className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${
                filterSeverity === opt ? 'bg-slate-700 text-white border-slate-700' : 'bg-gray-100 text-gray-600 border-gray-300'
              }`}>{opt}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">状态：</span>
          {['全部', '待处理', '已处理'].map((opt) => (
            <button key={opt} onClick={() => setFilterStatus(opt)}
              className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${
                filterStatus === opt ? 'bg-slate-700 text-white border-slate-700' : 'bg-gray-100 text-gray-600 border-gray-300'
              }`}>{opt}</button>
          ))}
        </div>
        <span className="ml-auto text-sm text-gray-400">共 {filtered.length} 条</span>
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['告警时间', '设备SN', '严重程度', '来源', '描述', '状态', '关联'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((a) => (
              <tr key={a.id} className={`hover:bg-gray-50 transition-colors ${a.severity === '严重' && a.status === '待处理' ? 'bg-red-50' : ''}`}>
                <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">{a.alertTime}</td>
                <td className="px-4 py-2.5">
                  <Link to={`/devices/${a.deviceId}`} className="font-mono text-xs text-blue-600 hover:underline font-medium">
                    {a.deviceSN}
                  </Link>
                </td>
                <td className="px-4 py-2.5"><StatusBadge status={a.severity} /></td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{a.source}</td>
                <td className="px-4 py-2.5 text-gray-700 max-w-xs">
                  <div className="truncate">{a.description}</div>
                  {a.resolvedBy && (
                    <div className="text-xs text-gray-400 mt-0.5">处理人: {a.resolvedBy} @ {a.resolvedAt}</div>
                  )}
                </td>
                <td className="px-4 py-2.5"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-2.5 text-xs">
                  {a.severity === '轻微' && (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-200 text-xs px-2 py-0.5 rounded-full">
                      已飞书通知
                    </span>
                  )}
                  {a.severity === '严重' && a.workOrderId && (
                    <button
                      onClick={() => navigate(`/work-orders?highlight=${a.workOrderId}`)}
                      className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 border border-orange-200 text-xs px-2 py-0.5 rounded-full hover:bg-orange-100">
                      工单#{a.workOrderId}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无告警记录</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AddAlertModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          devices={onlineDevices}
        />
      )}
    </div>
  );
}
