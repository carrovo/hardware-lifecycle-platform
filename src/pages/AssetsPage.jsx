import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import Materials from './Materials';
import DeviceTypes from './DeviceTypes';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import SecondaryTabs from '../components/SecondaryTabs';
import TertiaryTabs from '../components/TertiaryTabs';
import { Link, useNavigate } from 'react-router-dom';

const TABS = [
  { key: 'materials', label: '来料管理' },
  { key: 'devices',   label: '设备列表' },
  { key: 'types',     label: '设备类型' },
];

/* ─────────── Devices tab sub-components ─────────── */

const STATUS_CHIPS = [
  { key: '全部' }, { key: '装配中' }, { key: '整机装配' }, { key: '功能测试中' }, { key: '老化测试中' },
  { key: '终测中' }, { key: '待分配项目' }, { key: '已分配项目' }, { key: '在线运营' }, { key: '退役' }, { key: '返修中' },
  { key: '半成品检验中' }, { key: '初测中' }, { key: '中测中' }, { key: 'OQT终测中' }, { key: '生产返修中' },
  { key: '待入库' }, { key: '已入库' }, { key: '出厂检验中' }, { key: '现场安装调试中' }, { key: '客户验收中' },
];

const NOW_DATE = new Date('2026-06-26');
function daysSince(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr.replace(' ', 'T'));
  return Math.floor((NOW_DATE - d) / 86400000);
}

const DEVICE_SUB_TABS = [
  { key: 'all', label: '全部设备' },
  { key: 'alerts', label: '健康告警' },
];

/* Alert detail panel with 4 fixed sections */
function AlertDetail({ alert, state, dispatch, currentRole, currentUser }) {
  const navigate = useNavigate();
  const { devices, projects, workOrders } = state;
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [notes, setNotes] = useState('');

  const device = devices.find(d => d.id === alert.deviceId);
  const project = projects.find(p => p.id === alert.projectId);
  const linkedWO = alert.workOrderId ? workOrders.find(w => w.id === alert.workOrderId) : null;

  const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
  const canUpdate = ['运维工程师', '维修工程师', '厂长', '管理员'].includes(currentRole) && alert.severity === '轻微' && ['待处理', '处理中'].includes(alert.status);
  const canGenerateWO = ['运维工程师', '维修工程师', '厂长', '管理员'].includes(currentRole) && alert.severity === '严重' && alert.status === '待处理' && !alert.workOrderId;
  const nextStatus = alert.status === '待处理' ? '处理中' : alert.status === '处理中' ? '已解决' : null;

  const handleUpdateStatus = () => {
    if (!notes.trim() || !nextStatus) return;
    const t = now();
    const newLog = { operator: currentUser, time: t, fromStatus: alert.status, toStatus: nextStatus, notes };
    dispatch({ type: 'UPDATE_ALERT', payload: { id: alert.id, status: nextStatus, processLogs: [...(alert.processLogs || []), newLog] } });
    setNotes('');
    setShowUpdateModal(false);
  };

  const handleGenerateWorkOrder = () => {
    const t = now();
    const woId = `WO-${Date.now()}`;
    dispatch({ type: 'ADD_WORK_ORDER', payload: { id: woId, deviceId: alert.deviceId, deviceSN: alert.deviceSN, projectId: alert.projectId, description: alert.description, severity: '高', status: '待处理', assignedTo: currentUser, createdAt: t, updatedAt: t, closedAt: null, repairActions: '', replacedModules: [], recheckResult: null, notes: `来自告警 #${alert.id}`, sourceAlertId: alert.id } });
    const newLog = { operator: currentUser, time: t, fromStatus: alert.status, toStatus: '已生成工单', notes: `严重告警，已生成维修工单 ${woId}` };
    dispatch({ type: 'UPDATE_ALERT', payload: { id: alert.id, status: '已生成工单', workOrderId: woId, processLogs: [...(alert.processLogs || []), newLog] } });
  };

  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';

  return (
    <div className="px-6 py-5 space-y-5 bg-slate-50 border-b border-slate-200">
      {/* Section 1: 告警摘要 */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">告警摘要</div>
        <div className="flex items-start gap-3">
          <span className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${alert.severity === '严重' ? 'bg-red-500' : 'bg-amber-400'}`} />
          <div>
            <div className="text-sm font-semibold text-gray-800 mb-1">{alert.description}</div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
              <span>告警时间：{alert.alertTime}</span>
              <span>来源：{alert.source}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <StatusBadge status={alert.severity} />
              <StatusBadge status={alert.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: 关联设备 */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">关联设备</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {device && <span>设备：<Link to={`/devices/${device.id}`} className="text-blue-600 hover:underline">{device.sn}</Link></span>}
          {project && <span>项目：<Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline">{project.name}</Link></span>}
          {!device && !project && <span className="text-gray-400">—</span>}
        </div>
        {alert.workOrderId && (
          <div className="flex items-center gap-2 text-sm mt-2">
            <span className="text-gray-500">关联工单：</span>
            <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 border border-orange-200 text-xs px-2 py-0.5 rounded-full font-medium">
              {alert.workOrderId}
              {linkedWO && <span className="ml-1 text-gray-400">({linkedWO.status})</span>}
            </span>
          </div>
        )}
      </div>

      {/* Section 3: 飞书通知 */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">飞书通知</div>
        {alert.notifiedUsers && alert.notifiedUsers.length > 0 ? (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            <div className="text-xs font-medium text-blue-700 mb-2">飞书通知已发送</div>
            <div className="flex flex-wrap gap-2">
              {alert.notifiedUsers.map((u, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white border border-blue-200 rounded-full px-2 py-0.5">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">{u.name[0]}</div>
                  <span className="text-xs text-gray-700 font-medium">{u.name}</span>
                  <span className="text-xs text-gray-400">（{u.role}）</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </div>

      {/* Section 4: 处理记录 */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">处理记录</div>
        {alert.processLogs && alert.processLogs.length > 0 ? (
          <div className="space-y-2">
            {alert.processLogs.map((log, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-0.5 flex-shrink-0" />
                  {i < alert.processLogs.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="pb-2">
                  <div className="flex items-center gap-2 text-gray-500 mb-0.5">
                    <span>{log.time}</span>
                    <span className="font-medium text-gray-700">{log.operator}</span>
                    <span>·</span>
                    <StatusBadge status={log.fromStatus} />
                    <span className="text-gray-400">→</span>
                    <StatusBadge status={log.toStatus} />
                  </div>
                  <div className="text-gray-700">{log.notes}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-sm text-gray-400">暂无处理记录</span>
        )}

        {/* Action buttons */}
        {(canUpdate || canGenerateWO) && (
          <div className="flex gap-2 mt-3">
            {canUpdate && !showUpdateModal && (
              <button onClick={() => setShowUpdateModal(true)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                更新状态 → {nextStatus}
              </button>
            )}
            {canGenerateWO && (
              <button onClick={handleGenerateWorkOrder} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                生成维修工单
              </button>
            )}
          </div>
        )}
        {showUpdateModal && canUpdate && (
          <div className="mt-3 space-y-2">
            <textarea rows={2} className={inp} value={notes} onChange={e => setNotes(e.target.value)} placeholder="请填写处理备注 *" />
            <div className="flex gap-2">
              <button onClick={handleUpdateStatus} disabled={!notes.trim()} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40">确认更新</button>
              <button onClick={() => setShowUpdateModal(false)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddAlertModal({ isOpen, onClose, onSave, devices }) {
  const [form, setForm] = useState({ deviceId: '', severity: '轻微', description: '', source: '人工上报' });
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  const handleSubmit = (e) => {
    e.preventDefault();
    const device = devices.find(d => d.id === form.deviceId);
    onSave({ ...form, deviceSN: device?.sn || '' });
    onClose();
    setForm({ deviceId: '', severity: '轻微', description: '', source: '人工上报' });
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增告警">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">设备 *</label>
          <select className={inp} required value={form.deviceId} onChange={e => setForm({ ...form, deviceId: e.target.value })}>
            <option value="">-- 选择设备 --</option>
            {devices.map(d => <option key={d.id} value={d.id}>{d.sn}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">严重程度</label>
            <select className={inp} value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
              <option>轻微</option><option>严重</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">来源</label>
            <select className={inp} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
              <option>人工上报</option><option>系统自动</option>
            </select>
          </div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">告警描述 *</label>
          <textarea rows={3} className={inp} required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存</button>
        </div>
      </form>
    </Modal>
  );
}

function AlertsSubTab({ state, dispatch, currentRole }) {
  const [filterSeverity, setFilterSeverity] = useState('全部');
  const [filterStatus, setFilterStatus] = useState('全部');
  const [expandedId, setExpandedId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { alerts, devices, projects } = state;
  const currentUser = state.currentUser;
  const onlineDevices = devices.filter(d => d.status === '在线运营');
  const canAdd = ['运维工程师', '维修工程师', '厂长', '管理员'].includes(currentRole);
  const getProjectName = id => projects.find(p => p.id === id)?.name || '—';

  const filtered = [...alerts]
    .filter(a => {
      const matchSev = filterSeverity === '全部' || a.severity === filterSeverity;
      const matchSt = filterStatus === '全部' || a.status === filterStatus;
      return matchSev && matchSt;
    })
    .sort((a, b) => b.alertTime.localeCompare(a.alertTime));

  const pendingCount = alerts.filter(a => a.status === '待处理').length;
  const severeCount = alerts.filter(a => a.severity === '严重' && a.status === '待处理').length;

  const handleSave = (form) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const device = devices.find(d => d.id === form.deviceId);
    const notifiedUsers = [{ name: '赵六', role: '运维工程师' }, { name: form.severity === '严重' ? '李七' : '蔡八', role: form.severity === '严重' ? '厂长' : '项目负责人' }];
    dispatch({ type: 'ADD_ALERT', payload: { id: `ALERT-${Date.now()}`, deviceId: form.deviceId, projectId: device?.projectId || null, deviceSN: form.deviceSN, alertTime: now, source: form.source, severity: form.severity, description: form.description, status: '待处理', workOrderId: null, notifiedUsers, processLogs: [] } });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-3 text-sm">
          {severeCount > 0 && <span className="text-red-600 font-medium">{severeCount} 条严重告警待处理</span>}
          {pendingCount > 0 && <span className="text-amber-600">{pendingCount} 条告警待处理</span>}
        </div>
        {canAdd && (
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">+ 新增告警</button>
        )}
      </div>

      <div className="bg-white rounded shadow-sm px-4 py-3 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">严重程度：</span>
          {['全部', '轻微', '严重'].map(opt => (
            <button key={opt} onClick={() => setFilterSeverity(opt)}
              className={`px-3 py-1 text-xs rounded-full border font-medium ${filterSeverity === opt ? 'bg-slate-700 text-white border-slate-700' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>{opt}</button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-500">状态：</span>
          {['全部', '待处理', '处理中', '已解决', '已生成工单'].map(opt => (
            <button key={opt} onClick={() => setFilterStatus(opt)}
              className={`px-2.5 py-0.5 text-xs rounded-full border font-medium ${filterStatus === opt ? 'bg-slate-700 text-white border-slate-700' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>{opt}</button>
          ))}
        </div>
        <span className="ml-auto text-sm text-gray-400">共 {filtered.length} 条</span>
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['告警时间', '设备SN', '项目', '严重程度', '描述', '状态', ''].map((h, i) => (
                <th key={i} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => {
              const isExpanded = expandedId === a.id;
              const isUrgent = a.severity === '严重' && a.status === '待处理';
              const cellCls = `px-4 py-2.5 border-t border-gray-100 cursor-pointer ${isUrgent ? 'bg-red-50' : 'hover:bg-gray-50'} transition-colors`;
              return (
                <tr key={a.id} onClick={() => setExpandedId(isExpanded ? null : a.id)}>
                  {isExpanded ? (
                    <td colSpan={7} className="p-0">
                      <div className={`border-t border-gray-100 cursor-pointer ${isUrgent ? 'bg-red-50' : 'bg-white'} px-4 py-2.5 flex items-center gap-3`} onClick={() => setExpandedId(null)}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.severity === '严重' ? 'bg-red-500' : 'bg-amber-400'}`} />
                        <span className="text-xs text-gray-400">{a.alertTime}</span>
                        <span className="font-mono text-xs font-medium text-gray-800">{a.deviceSN}</span>
                        <span className="flex-1 text-gray-600 text-xs truncate">{a.description}</span>
                        <StatusBadge status={a.severity} />
                        <StatusBadge status={a.status} />
                        <span className="text-gray-400 text-xs">▲ 收起</span>
                      </div>
                      <AlertDetail alert={a} state={state} dispatch={dispatch} currentRole={currentRole} currentUser={currentUser} />
                    </td>
                  ) : (
                    <>
                      <td className={`${cellCls} text-gray-400 text-xs`}>{a.alertTime}</td>
                      <td className={cellCls}>
                        <Link to={`/devices/${a.deviceId}`} className="font-mono text-xs text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>{a.deviceSN}</Link>
                      </td>
                      <td className={`${cellCls} text-xs`}>
                        {a.projectId ? <Link to={`/projects/${a.projectId}`} className="text-slate-700 hover:underline" onClick={e => e.stopPropagation()}>{getProjectName(a.projectId)}</Link> : <span className="text-gray-400">—</span>}
                      </td>
                      <td className={cellCls}><StatusBadge status={a.severity} /></td>
                      <td className={`${cellCls} text-gray-700 max-w-xs`}>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.severity === '严重' ? 'bg-red-500' : 'bg-amber-400'}`} />
                          <span className="truncate text-xs">{a.description}</span>
                        </div>
                      </td>
                      <td className={cellCls}><StatusBadge status={a.status} /></td>
                      <td className={`${cellCls} text-gray-400 text-xs`}>▼ 展开</td>
                    </>
                  )}
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无告警记录</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && <AddAlertModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={handleSave} devices={onlineDevices} />}
    </div>
  );
}

function AllDevicesSubTab({ state }) {
  const [filterStatus, setFilterStatus] = useState('全部');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { devices, deviceTypes, projects } = state;
  const getTypeName = id => deviceTypes.find(dt => dt.id === id)?.name || id;

  const total = devices.length;
  const inProgress = devices.filter(d => ['装配中', '整机装配', '半成品检验中', '初测中', '中测中', 'OQT终测中', '功能测试中', '老化测试中', '终测中', '生产返修中'].includes(d.status)).length;
  const online = devices.filter(d => d.status === '在线运营').length;
  const readyToAssign = devices.filter(d => d.status === '待分配项目').length;

  const statusCounts = {};
  devices.forEach(d => { statusCounts[d.status] = (statusCounts[d.status] || 0) + 1; });

  const filtered = devices.filter(d => {
    const matchStatus = filterStatus === '全部' || d.status === filterStatus;
    const matchSearch = !search || d.sn.toLowerCase().includes(search.toLowerCase()) || getTypeName(d.deviceTypeId).toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[{ label: '设备总数', value: total, color: 'border-slate-500' }, { label: '在制/进行中', value: inProgress, color: 'border-blue-500' }, { label: '在线运营', value: online, color: 'border-emerald-500' }, { label: '待分配项目', value: readyToAssign, color: 'border-amber-500' }].map(({ label, value, color }) => (
          <div key={label} className={`bg-white rounded-xl border border-gray-100 shadow-sm border-l-4 ${color} p-4`}>
            <div className="text-3xl font-semibold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded shadow-sm px-4 py-3 mb-4 flex flex-wrap gap-2 items-center">
        <button onClick={() => setFilterStatus('全部')} className={`px-3 py-1 text-xs rounded-full border font-medium ${filterStatus === '全部' ? 'bg-slate-700 text-white border-slate-700' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>全部 {total}</button>
        {STATUS_CHIPS.slice(1).map(c => (statusCounts[c.key] > 0) && (
          <button key={c.key} onClick={() => setFilterStatus(c.key)} className={`px-3 py-1 text-xs rounded-full border font-medium ${filterStatus === c.key ? 'bg-slate-700 text-white border-slate-700' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
            {c.key} {statusCounts[c.key]}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <input type="text" placeholder="搜索SN / 类型..." value={search} onChange={e => setSearch(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none w-44" />
          <span className="text-sm text-gray-400">共 {filtered.length} 台</span>
        </div>
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['设备SN', '整机类型', '所属项目', '当前状态', '装配人', '最近更新', '在此状态天数', '操作'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(d => {
              const days = daysSince(d.updatedAt || d.assemblyTime);
              const isStuck = days > 2 && ['功能测试中', '老化测试中', '终测中', '装配中'].includes(d.status);
              const project = d.projectId ? projects.find(p => p.id === d.projectId) : null;
              return (
                <tr key={d.id} className={`hover:bg-blue-50 cursor-pointer transition-colors ${isStuck ? 'bg-amber-50' : ''}`}
                  onClick={() => navigate(`/devices/${d.id}`)}>
                  <td className="px-4 py-2 font-medium text-gray-800 font-mono text-xs">{d.sn}</td>
                  <td className="px-4 py-2 text-gray-600">{getTypeName(d.deviceTypeId)}</td>
                  <td className="px-4 py-2 text-gray-600 text-xs">
                    {project ? <Link to={`/projects/${project.id}`} className="text-slate-700 hover:underline" onClick={e => e.stopPropagation()}>{project.name}</Link> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-2"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-2 text-gray-600">{d.assembler}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{d.updatedAt}</td>
                  <td className="px-4 py-2">
                    {days > 0 ? <span className={`text-xs font-medium ${isStuck ? 'text-amber-600' : 'text-gray-500'}`}>{isStuck && '⚠ '}{days}天</span> : <span className="text-xs text-gray-400">今天</span>}
                  </td>
                  <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                    <Link to={`/devices/${d.id}`} className="text-slate-600 hover:underline text-xs">查看详情</Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DevicesTab() {
  const { state, dispatch } = useApp();
  const { currentRole } = useRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const subtab = searchParams.get('subtab') || 'all';
  const activeSubTab = DEVICE_SUB_TABS.some(t => t.key === subtab) ? subtab : 'all';

  const pendingAlerts = (state.alerts || []).filter(a => a.status === '待处理').length;

  const setSubTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set('subtab', key);
    setSearchParams(next);
  };

  return (
    <div>
      <TertiaryTabs
        tabs={DEVICE_SUB_TABS.map(t => ({ ...t, badge: t.key === 'alerts' ? pendingAlerts : 0 }))}
        activeTab={activeSubTab}
        onChange={setSubTab}
        className="-mx-6 -mt-6 mb-6 px-6"
      />
      {activeSubTab === 'all' && <AllDevicesSubTab state={state} />}
      {activeSubTab === 'alerts' && <AlertsSubTab state={state} dispatch={dispatch} currentRole={currentRole} />}
    </div>
  );
}

/* ─────────── Main ─────────── */
export default function AssetsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'materials';
  const activeTab = TABS.some(t => t.key === tab) ? tab : 'materials';

  const setTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    next.delete('subtab');
    setSearchParams(next);
  };

  return (
    <div>
      <div className="px-6 pt-5 pb-4 bg-white border-b border-gray-100">
        <SecondaryTabs tabs={TABS} activeTab={activeTab} onChange={setTab} />
      </div>
      <div className="p-6">
        {activeTab === 'materials' && <Materials />}
        {activeTab === 'devices' && <DevicesTab />}
        {activeTab === 'types' && <DeviceTypes />}
      </div>
    </div>
  );
}
