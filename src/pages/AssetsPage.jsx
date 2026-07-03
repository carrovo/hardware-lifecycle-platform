import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import Materials from './Materials';
import DeviceTypes from './DeviceTypes';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import TertiaryTabs from '../components/TertiaryTabs';
import { Pagination, usePaged } from '../components/Pagination';
import { Link, useNavigate } from 'react-router-dom';
import { deviceLifecycleStatus, deviceBusinessNode } from '../utils/status';

const TABS = [
  { key: 'devices',   label: '设备列表' },
  { key: 'types',     label: '设备类型' },
  { key: 'materials', label: '模块来料' },
  { key: 'locations', label: '点位管理' },
];

/* ─────────── Devices tab sub-components ─────────── */

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

/* 健康告警详情：右侧抽屉（与工单中心 / 质量问题台账体验一致，避免行内展开撑高列表） */
function DrawerSection({ title, children }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</div>
      {children}
    </div>
  );
}
function AlertDrawer({ alert, state, dispatch, currentRole, currentUser, onClose }) {
  const { devices, projects, workOrders, deviceTypes = [], locations = [] } = state;
  const [showUpdate, setShowUpdate] = useState(false);
  const [notes, setNotes] = useState('');

  const device = devices.find(d => d.id === alert.deviceId);
  const deviceType = device ? deviceTypes.find(t => t.id === device.deviceTypeId) : null;
  const project = projects.find(p => p.id === alert.projectId);
  const location = device?.locationId ? locations.find(l => l.id === device.locationId) : null;
  const linkedWO = alert.workOrderId ? workOrders.find(w => w.id === alert.workOrderId) : null;
  const online = device ? (device.online === true || device.status === '在线运营') : false;

  const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
  const roleOK = ['运维工程师', '维修工程师', '厂长', '管理员'].includes(currentRole);
  const closed = ['已解决', '已关闭'].includes(alert.status);
  const canUpdate = roleOK && alert.severity === '轻微' && ['待处理', '处理中'].includes(alert.status);
  const canGenerateWO = roleOK && alert.severity === '严重' && !alert.workOrderId && !closed;
  const canGenerateQI = roleOK && !closed && device?.status === '在线运营';
  const canClose = roleOK && !closed;
  const nextStatus = alert.status === '待处理' ? '处理中' : alert.status === '处理中' ? '已解决' : null;

  const handleUpdateStatus = () => {
    if (!notes.trim() || !nextStatus) return;
    const t = now();
    const newLog = { operator: currentUser, time: t, fromStatus: alert.status, toStatus: nextStatus, notes };
    dispatch({ type: 'UPDATE_ALERT', payload: { id: alert.id, status: nextStatus, processLogs: [...(alert.processLogs || []), newLog] } });
    setNotes(''); setShowUpdate(false);
  };
  const handleGenerateWorkOrder = () => {
    const t = now();
    const woId = `WO-${Date.now()}`;
    dispatch({ type: 'ADD_WORK_ORDER', payload: { id: woId, woClass: '其他问题工单', involvesReplacement: false, deviceId: alert.deviceId, deviceSN: alert.deviceSN, projectId: alert.projectId, description: alert.description, severity: '高', status: '待处理', assignedTo: currentUser, createdAt: t, updatedAt: t, closedAt: null, repairActions: '', replacedModules: [], recheckResult: null, notes: `来自告警 ${alert.id}`, sourceAlertId: alert.id } });
    const newLog = { operator: currentUser, time: t, fromStatus: alert.status, toStatus: '已生成工单', notes: `严重告警，已生成维修工单 ${woId}` };
    dispatch({ type: 'UPDATE_ALERT', payload: { id: alert.id, status: '已生成工单', workOrderId: woId, processLogs: [...(alert.processLogs || []), newLog] } });
    onClose();
  };
  const handleGenerateQualityIssue = () => {
    const t = now();
    const qiId = `QI-${Date.now()}`;
    dispatch({ type: 'ADD_QUALITY_ISSUE', payload: { id: qiId, deviceId: alert.deviceId, deviceSN: alert.deviceSN, deviceName: deviceType?.name || '', locationId: device?.locationId || null, projectId: alert.projectId, issueDesc: alert.description, reporterId: state.currentUserId, reporterName: currentUser, reportTime: t, status: '待处理', source: '手动录入', sourceStage: '在线运营', issueType: '功能异常', severity: alert.severity === '严重' ? '高' : '中', owner: currentUser, linkedWorkOrder: false, sourceAlertId: alert.id, processLogs: [] } });
    dispatch({ type: 'UPDATE_ALERT', payload: { id: alert.id, processLogs: [...(alert.processLogs || []), { operator: currentUser, time: t, fromStatus: alert.status, toStatus: alert.status, notes: `已生成质量问题 ${qiId}` }] } });
    onClose();
  };
  const handleCloseAlert = () => {
    const t = now();
    dispatch({ type: 'UPDATE_ALERT', payload: { id: alert.id, status: '已关闭', processLogs: [...(alert.processLogs || []), { operator: currentUser, time: t, fromStatus: alert.status, toStatus: '已关闭', notes: '手动关闭告警' }] } });
    onClose();
  };

  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  const field = (label, val) => (
    <div><span className="text-gray-400 text-xs">{label}：</span><span className="text-gray-700">{val ?? '—'}</span></div>
  );

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-800">健康告警详情 · {alert.id}</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* 告警摘要 */}
          <DrawerSection title="告警摘要">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {field('告警ID', alert.id)}
              {field('告警时间', alert.alertTime)}
              {field('告警类型', alert.alertType)}
              {field('来源', alert.source)}
              <div><span className="text-gray-400 text-xs">严重程度：</span><StatusBadge status={alert.severity} /></div>
              <div><span className="text-gray-400 text-xs">当前状态：</span><StatusBadge status={alert.status} /></div>
            </div>
            <div className="mt-2 text-sm text-gray-800">{alert.description}</div>
          </DrawerSection>

          {/* 关联设备 */}
          <DrawerSection title="关联设备">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-400 text-xs">设备SN：</span>{device ? <Link to={`/devices/${device.id}`} className="text-blue-600 hover:underline">{device.sn}</Link> : (alert.deviceSN || '—')}</div>
              {field('设备类型', deviceType?.name)}
              <div><span className="text-gray-400 text-xs">所属项目：</span>{project ? <Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline">{project.name}</Link> : '—'}</div>
              {field('所属点位', location?.name)}
              <div><span className="text-gray-400 text-xs">是否在线：</span>{online ? <span className="text-emerald-600 font-medium">在线</span> : <span className="text-gray-400">离线</span>}</div>
            </div>
            {alert.workOrderId && (
              <div className="flex items-center gap-2 text-sm mt-2">
                <span className="text-gray-500">关联工单：</span>
                <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 border border-orange-200 text-xs px-2 py-0.5 rounded-full font-medium">
                  {alert.workOrderId}{linkedWO && <span className="ml-1 text-gray-400">({linkedWO.status})</span>}
                </span>
              </div>
            )}
          </DrawerSection>

          {/* 飞书通知 */}
          <DrawerSection title="飞书通知记录">
            {alert.notifiedUsers && alert.notifiedUsers.length > 0 ? (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between text-xs text-blue-700 mb-2">
                  <span className="font-medium">飞书通知{alert.notifyStatus || '已送达'}</span>
                  <span className="text-blue-400">{alert.notifiedAt || alert.alertTime}</span>
                </div>
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
            ) : <span className="text-sm text-gray-400">—</span>}
          </DrawerSection>

          {/* 处理记录 */}
          <DrawerSection title="处理记录">
            {alert.processLogs && alert.processLogs.length > 0 ? (
              <div className="space-y-2">
                {alert.processLogs.map((log, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-0.5 flex-shrink-0" />
                      {i < alert.processLogs.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                    </div>
                    <div className="pb-2">
                      <div className="flex items-center gap-2 text-gray-500 mb-0.5 flex-wrap">
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
            ) : <span className="text-sm text-gray-400">暂无处理记录</span>}
          </DrawerSection>
        </div>

        {/* 操作区 */}
        <div className="border-t border-gray-200 px-5 py-3 space-y-2 bg-gray-50">
          {showUpdate && canUpdate && (
            <div className="space-y-2">
              <textarea rows={2} className={inp} value={notes} onChange={e => setNotes(e.target.value)} placeholder="请填写处理备注 *" />
              <div className="flex gap-2">
                <button onClick={handleUpdateStatus} disabled={!notes.trim()} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40">确认更新 → {nextStatus}</button>
                <button onClick={() => setShowUpdate(false)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {canUpdate && !showUpdate
              ? <button onClick={() => setShowUpdate(true)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">更新状态</button>
              : !showUpdate && <span className="px-3 py-1.5 text-sm text-gray-300 border border-gray-200 rounded cursor-not-allowed" title={closed ? '告警已关闭' : '仅轻微告警可更新状态'}>更新状态</span>}
            {canGenerateWO
              ? <button onClick={handleGenerateWorkOrder} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700">生成工单</button>
              : <span className="px-3 py-1.5 text-sm text-gray-300 border border-gray-200 rounded cursor-not-allowed" title={alert.workOrderId ? `已生成工单 ${alert.workOrderId}` : closed ? '告警已关闭' : '仅严重告警可生成工单'}>生成工单</span>}
            {canGenerateQI
              ? <button onClick={handleGenerateQualityIssue} className="px-3 py-1.5 text-sm border border-slate-300 text-slate-700 rounded hover:bg-slate-100">生成质量问题</button>
              : <span className="px-3 py-1.5 text-sm text-gray-300 border border-gray-200 rounded cursor-not-allowed" title={closed ? '告警已关闭' : '仅在线运营设备可生成质量问题'}>生成质量问题</span>}
            {canClose
              ? <button onClick={handleCloseAlert} className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-100">关闭告警</button>
              : <span className="px-3 py-1.5 text-sm text-gray-300 border border-gray-200 rounded cursor-not-allowed" title="告警已关闭">关闭告警</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

const ALERT_TYPES = ['电池异常', '温度异常', '通信中断', '传感器异常', '导航异常', '机械结构', '其他'];
const ALERT_OWNERS = ['张三', '李四', '王五', '赵六'];
function AddAlertModal({ isOpen, onClose, onSave, devices, projects = [], locations = [] }) {
  const [form, setForm] = useState({ deviceId: '', alertType: '电池异常', severity: '轻微', description: '', source: '人工上报', owner: '', notes: '' });
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  const device = devices.find(d => d.id === form.deviceId);
  const projName = device ? (projects.find(p => p.id === device.projectId)?.name || '—') : '';
  const locName = device ? (locations.find(l => l.id === device.locationId)?.name || '—') : '';
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, deviceSN: device?.sn || '', projectId: device?.projectId || null, locationId: device?.locationId || null });
    onClose();
    setForm({ deviceId: '', alertType: '电池异常', severity: '轻微', description: '', source: '人工上报', owner: '', notes: '' });
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增健康告警" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">设备SN *</label>
            <select className={inp} required value={form.deviceId} onChange={e => setForm({ ...form, deviceId: e.target.value })}>
              <option value="">-- 选择设备 --</option>
              {devices.map(d => <option key={d.id} value={d.id}>{d.sn}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">告警类型 *</label>
            <select className={inp} value={form.alertType} onChange={e => setForm({ ...form, alertType: e.target.value })}>
              {ALERT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">所属项目</label><input className={`${inp} bg-gray-50`} readOnly value={projName} placeholder="选择设备后自动带出" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">所属点位</label><input className={`${inp} bg-gray-50`} readOnly value={locName} placeholder="选择设备后自动带出" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">严重程度</label>
            <select className={inp} value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
              <option>轻微</option><option>严重</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">来源</label>
            <select className={inp} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
              <option>人工上报</option><option>系统监测</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">负责人</label>
            <select className={inp} value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>
              <option value="">-- 待指派 --</option>
              {ALERT_OWNERS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">附件</label><input className={`${inp} bg-gray-50 text-gray-400`} disabled placeholder="（原型占位）支持上传日志 / 图片" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">告警描述 *</label>
          <textarea rows={3} className={inp} required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea rows={2} className={inp} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存</button>
        </div>
      </form>
    </Modal>
  );
}

function AlertsSubTab({ state, dispatch, currentRole, initialSN = '', onClearSN }) {
  const [filterSeverity, setFilterSeverity] = useState('全部');
  const [filterStatus, setFilterStatus] = useState('全部');
  const [snQuery, setSnQuery] = useState(initialSN);
  const [drawerAlertId, setDrawerAlertId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  // 从设备台账「查看告警」跳转时带入设备 SN，自动过滤到该设备的告警。
  useEffect(() => { setSnQuery(initialSN); }, [initialSN]);

  const { alerts, devices, projects, locations = [] } = state;
  const currentUser = state.currentUser;
  const onlineDevices = devices.filter(d => d.status === '在线运营');
  const canAdd = ['运维工程师', '维修工程师', '厂长', '管理员'].includes(currentRole);
  const getProjectName = id => projects.find(p => p.id === id)?.name || '—';

  const snq = snQuery.trim().toLowerCase();
  const filtered = [...alerts]
    .filter(a => {
      const matchSev = filterSeverity === '全部' || a.severity === filterSeverity;
      const matchSt = filterStatus === '全部' || a.status === filterStatus;
      const matchSN = !snq || (a.deviceSN || '').toLowerCase().includes(snq);
      return matchSev && matchSt && matchSN;
    })
    .sort((a, b) => b.alertTime.localeCompare(a.alertTime));
  const clearSN = () => { setSnQuery(''); onClearSN && onClearSN(); };

  const paged = usePaged(filtered, 10);
  // 未关闭口径：与设备台账「健康告警数」及 Tab 徽标统一（!已解决/已关闭）。
  const isOpenAlert = (a) => !['已解决', '已关闭'].includes(a.status);
  const unclosedCount = alerts.filter(isOpenAlert).length;
  const severeCount = alerts.filter(a => a.severity === '严重' && isOpenAlert(a)).length;

  const handleSave = (form) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const device = devices.find(d => d.id === form.deviceId);
    const notifiedUsers = [{ name: '赵六', role: '运维工程师' }, { name: form.severity === '严重' ? '李七' : '蔡八', role: form.severity === '严重' ? '厂长' : '项目负责人' }];
    dispatch({ type: 'ADD_ALERT', payload: { id: `ALERT-${Date.now()}`, deviceId: form.deviceId, projectId: form.projectId ?? device?.projectId ?? null, locationId: form.locationId ?? device?.locationId ?? null, deviceSN: form.deviceSN, alertType: form.alertType, owner: form.owner, notes: form.notes, alertTime: now, source: form.source, severity: form.severity, description: form.description, status: '待处理', workOrderId: null, notifiedUsers, processLogs: [] } });
  };

  return (
    <div>
      <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700 mb-4">
        健康告警用于记录设备在线运营 / 运行过程中的健康异常监控，不等同于质量问题台账或工单中心。需要处理的告警可生成工单；需要质量沉淀的可生成质量问题。
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-3 text-sm">
          {severeCount > 0 && <span className="text-red-600 font-medium">{severeCount} 条严重告警未关闭</span>}
          <span className="text-amber-600">共 {unclosedCount} 条未关闭告警</span>
        </div>
        {canAdd && (
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">+ 新增告警</button>
        )}
      </div>

      {snq && (
        <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded px-4 py-2 text-sm text-blue-800">
          <span>当前仅展示设备 <span className="font-mono font-medium">{snQuery}</span> 的健康告警（共 {filtered.length} 条）</span>
          <button onClick={clearSN} className="ml-auto px-2 py-0.5 text-xs border border-blue-300 text-blue-700 rounded hover:bg-blue-100">清除筛选</button>
        </div>
      )}

      <div className="bg-white rounded shadow-sm px-4 py-3 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">设备SN：</span>
          <input value={snQuery} onChange={e => setSnQuery(e.target.value)} placeholder="按设备SN筛选" className="border border-gray-300 rounded px-3 py-1 text-xs focus:outline-none w-40" />
          {snQuery && <button onClick={clearSN} className="text-xs text-gray-400 hover:text-gray-600">清除</button>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">严重程度：</span>
          {['全部', '轻微', '严重'].map(opt => (
            <button key={opt} onClick={() => setFilterSeverity(opt)}
              className={`px-3 py-1 text-xs rounded-full border font-medium ${filterSeverity === opt ? 'bg-slate-700 text-white border-slate-700' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>{opt}</button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-500">状态：</span>
          {['全部', '待处理', '处理中', '工单处理中', '已生成工单', '已解决', '已关闭'].map(opt => (
            <button key={opt} onClick={() => setFilterStatus(opt)}
              className={`px-2.5 py-0.5 text-xs rounded-full border font-medium ${filterStatus === opt ? 'bg-slate-700 text-white border-slate-700' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>{opt}</button>
          ))}
        </div>
        <span className="ml-auto text-sm text-gray-400">共 {filtered.length} 条</span>
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['告警时间', '设备SN', '项目', '严重程度', '描述', '状态', ''].map((h, i) => (
                <th key={i} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.pageItems.map(a => {
              const isUrgent = a.severity === '严重' && isOpenAlert(a);
              return (
                <tr key={a.id} className={`cursor-pointer ${isUrgent ? 'bg-red-50' : 'hover:bg-gray-50'} transition-colors`} onClick={() => setDrawerAlertId(a.id)}>
                  <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">{a.alertTime}</td>
                  <td className="px-4 py-2.5">
                    <Link to={`/devices/${a.deviceId}`} className="font-mono text-xs text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>{a.deviceSN}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {a.projectId ? <Link to={`/projects/${a.projectId}`} className="text-slate-700 hover:underline" onClick={e => e.stopPropagation()}>{getProjectName(a.projectId)}</Link> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-2.5"><StatusBadge status={a.severity} /></td>
                  <td className="px-4 py-2.5 text-gray-700 max-w-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.severity === '严重' ? 'bg-red-500' : 'bg-amber-400'}`} />
                      <span className="truncate text-xs">{a.description}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-2.5 text-blue-600 text-xs whitespace-nowrap">查看详情 →</td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无告警记录</td></tr>}
          </tbody>
        </table>
        </div>
        <Pagination page={paged.page} total={paged.total} totalPages={paged.totalPages} onChange={paged.setPage} />
      </div>

      {showModal && <AddAlertModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={handleSave} devices={onlineDevices} projects={projects} locations={locations} />}
      {drawerAlertId && (() => {
        const a = alerts.find(x => x.id === drawerAlertId);
        return a ? <AlertDrawer alert={a} state={state} dispatch={dispatch} currentRole={currentRole} currentUser={currentUser} onClose={() => setDrawerAlertId(null)} /> : null;
      })()}
    </div>
  );
}

const LIFECYCLE_STATUSES = ['生产中', '待入库', '待交付', '交付中', '在线运营', '维修中', '已作废'];

function AllDevicesSubTab({ state, goAlerts }) {
  const [f, setF] = useState({ q: '', project: '', deviceType: '', lifecycle: '', node: '', location: '', online: '', hasAlert: '', prodPlan: '', delivPlan: '', from: '', to: '' });
  const navigate = useNavigate();
  const upd = (k, v) => setF({ ...f, [k]: v });

  const { devices, deviceTypes, projects, locations = [], workflowProductionPlans = [], deliveryPlans = [], alerts = [] } = state;
  const getTypeName = id => deviceTypes.find(dt => dt.id === id)?.name || id;
  const getLocationName = id => id ? (locations.find(l => l.id === id)?.name || '—') : '—';
  const getPlanName = id => id ? (workflowProductionPlans.find(p => p.id === id)?.name || id) : '—';
  const deliveryPlanOf = (deviceId) => deliveryPlans.find(dp => (dp.boundDeviceIds || []).includes(deviceId) || (dp.records?.binding || []).some(b => b.deviceId === deviceId));
  const alertCountOf = (deviceId) => alerts.filter(a => a.deviceId === deviceId && !['已解决', '已关闭'].includes(a.status)).length;
  const isOnline = (d) => d.online === true || d.status === '在线运营';

  const rows = devices.map(d => ({ ...d, lifecycle: deviceLifecycleStatus(d), node: deviceBusinessNode(d), dp: deliveryPlanOf(d.id), alertCount: alertCountOf(d.id), online: isOnline(d) }));
  const total = rows.length;
  const producing = rows.filter(d => d.lifecycle === '生产中').length;
  const online = rows.filter(d => d.lifecycle === '在线运营').length;
  const readyToDeliver = rows.filter(d => d.lifecycle === '待交付').length;
  const nodeOptions = [...new Set(rows.map(d => d.node).filter(Boolean))];

  const filtered = rows.filter(d => {
    const q = f.q.trim().toLowerCase();
    return (!q || d.sn.toLowerCase().includes(q) || getTypeName(d.deviceTypeId).toLowerCase().includes(q))
      && (!f.project || d.projectId === f.project)
      && (!f.deviceType || d.deviceTypeId === f.deviceType)
      && (!f.lifecycle || d.lifecycle === f.lifecycle)
      && (!f.node || d.node === f.node)
      && (!f.location || d.locationId === f.location)
      && (!f.online || (f.online === '在线' ? d.online : !d.online))
      && (!f.hasAlert || (f.hasAlert === '有' ? d.alertCount > 0 : d.alertCount === 0))
      && (!f.prodPlan || d.productionPlanId === f.prodPlan)
      && (!f.delivPlan || d.dp?.id === f.delivPlan)
      && (!f.from || (d.updatedAt || '') >= f.from)
      && (!f.to || (d.updatedAt || '') <= `${f.to} 23:59`);
  }).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')); // 最近更新在前：首页即可看到在线/交付/生产多种状态设备
  const paged = usePaged(filtered, 10);
  const sel = 'border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-600 focus:outline-none';

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[{ label: '设备总数', value: total, color: 'border-slate-500' }, { label: '生产中', value: producing, color: 'border-blue-500' }, { label: '在线运营', value: online, color: 'border-emerald-500' }, { label: '待交付', value: readyToDeliver, color: 'border-amber-500' }].map(({ label, value, color }) => (
          <div key={label} className={`bg-white rounded-xl border border-gray-100 shadow-sm border-l-4 ${color} p-4`}>
            <div className="text-3xl font-semibold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded shadow-sm px-4 py-3 mb-4 space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <input placeholder="搜索设备SN / 设备类型" value={f.q} onChange={e => upd('q', e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none w-52" />
          <select className={sel} value={f.project} onChange={e => upd('project', e.target.value)}><option value="">全部项目</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select className={sel} value={f.deviceType} onChange={e => upd('deviceType', e.target.value)}><option value="">全部设备类型</option>{deviceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          <select className={sel} value={f.lifecycle} onChange={e => upd('lifecycle', e.target.value)}><option value="">全部生命周期</option>{LIFECYCLE_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
          <select className={sel} value={f.node} onChange={e => upd('node', e.target.value)}><option value="">全部业务节点</option>{nodeOptions.map(s => <option key={s}>{s}</option>)}</select>
          <select className={sel} value={f.location} onChange={e => upd('location', e.target.value)}><option value="">全部点位</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select className={sel} value={f.online} onChange={e => upd('online', e.target.value)}><option value="">是否在线</option><option value="在线">在线</option><option value="离线">离线</option></select>
          <select className={sel} value={f.hasAlert} onChange={e => upd('hasAlert', e.target.value)}><option value="">是否有健康告警</option><option value="有">有告警</option><option value="无">无告警</option></select>
          <select className={sel} value={f.prodPlan} onChange={e => upd('prodPlan', e.target.value)}><option value="">全部生产计划</option>{workflowProductionPlans.map(p => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}</select>
          <select className={sel} value={f.delivPlan} onChange={e => upd('delivPlan', e.target.value)}><option value="">全部交付计划</option>{deliveryPlans.map(p => <option key={p.id} value={p.id}>{p.batchNo || p.name}</option>)}</select>
          <label className="text-xs text-gray-500">时间</label>
          <input type="date" className={sel} value={f.from} onChange={e => upd('from', e.target.value)} />
          <span className="text-xs text-gray-400">~</span>
          <input type="date" className={sel} value={f.to} onChange={e => upd('to', e.target.value)} />
          <span className="ml-auto text-sm text-gray-400">共 {filtered.length} 台</span>
        </div>
      </div>

      <div className="bg-white rounded shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['设备SN', '设备类型', '所属项目', '生命周期状态', '当前业务节点', '所属点位', '是否在线', '健康告警数', '关联生产计划', '关联交付计划', '最近更新', '操作'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.pageItems.map(d => {
              const project = d.projectId ? projects.find(p => p.id === d.projectId) : null;
              return (
                <tr key={d.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-3 py-2 font-medium text-gray-800 font-mono text-xs whitespace-nowrap"><Link to={`/devices/${d.id}`} className="text-blue-600 hover:underline">{d.sn}</Link></td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{getTypeName(d.deviceTypeId)}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{project ? project.name : '—'}</td>
                  <td className="px-3 py-2"><StatusBadge status={d.lifecycle} /></td>
                  <td className="px-3 py-2"><StatusBadge status={d.node} /></td>
                  <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{d.locationId ? getLocationName(d.locationId) : '—'}</td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">{d.online ? <span className="text-emerald-600 font-medium">在线</span> : <span className="text-gray-400">离线</span>}</td>
                  <td className="px-3 py-2 text-xs">{d.alertCount > 0 ? <span className="text-red-600 font-medium">{d.alertCount}</span> : <span className="text-gray-400">0</span>}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{d.productionPlanId ? getPlanName(d.productionPlanId) : '—'}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{d.dp ? (d.dp.batchNo || d.dp.name) : '—'}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{d.updatedAt}</td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">
                    <div className="flex items-center gap-x-3">
                      <Link to={`/devices/${d.id}`} className="text-slate-600 hover:underline">查看详情</Link>
                      {d.alertCount > 0
                        ? <button className="text-blue-600 hover:underline" onClick={() => goAlerts && goAlerts(d.sn)}>查看告警</button>
                        : <span className="text-gray-300" title="该设备暂无未关闭健康告警">无告警</span>}
                      {project && <Link to={`/projects/${project.id}`} className="text-slate-600 hover:underline">查看项目</Link>}
                      {d.dp && <Link to={`/delivery-plans/${d.dp.id}`} className="text-emerald-600 hover:underline">查看交付</Link>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>}
          </tbody>
        </table>
        </div>
        <Pagination page={paged.page} total={paged.total} totalPages={paged.totalPages} onChange={paged.setPage} />
      </div>
    </div>
  );
}

/* ─────────── Locations tab ─────────── */
const LOC_OWNERS = ['张三', '李四', '王五', '赵六', '蔡八'];
const LOC_STATUS_STYLE = {
  待部署: 'bg-gray-100 text-gray-600 border-gray-300',
  部署中: 'bg-blue-100 text-blue-700 border-blue-300',
  已部署: 'bg-teal-100 text-teal-700 border-teal-300',
  在线运营: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  已停用: 'bg-gray-100 text-gray-400 border-gray-200',
};
function locStatusOf(loc, boundCount, onlineCount, planned) {
  if (loc.disabled) return '已停用';
  if (onlineCount > 0) return '在线运营';
  if (boundCount === 0) return '待部署';
  if (planned && boundCount < planned) return '部署中';
  return '已部署';
}

function LocationFormModal({ isOpen, onClose, initial, projects, onSave }) {
  const [form, setForm] = useState(initial || { projectId: projects[0]?.id || '', name: '', address: '', plannedCount: 1, owner: '', notes: '' });
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  const submit = (e) => { e.preventDefault(); onSave({ ...form, plannedCount: Number(form.plannedCount || 0) }); onClose(); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? '编辑点位' : '新增点位'} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">所属项目 *</label>
            <select className={inp} required value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
              <option value="">-- 选择项目 --</option>
              {projects.filter(p => !p.voided).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">点位名称 *</label><input className={inp} required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">地址 / 描述</label><input className={inp} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">计划设备数</label><input type="number" min="0" className={inp} value={form.plannedCount} onChange={e => setForm({ ...form, plannedCount: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">负责人</label>
            <select className={inp} value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>
              <option value="">-- 选择负责人 --</option>
              {LOC_OWNERS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">备注</label><textarea rows={2} className={inp} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存</button>
        </div>
      </form>
    </Modal>
  );
}

function LocationDetailModal({ isOpen, onClose, loc, projects, devices, deviceTypes = [], deliveryPlans, getProjectName }) {
  if (!loc) return null;
  const boundDevices = devices.filter(d => d.locationId === loc.id || (loc.deviceIds || []).includes(d.id));
  const plans = deliveryPlans.filter(dp => dp.projectId === loc.projectId);
  const typeName = id => deviceTypes.find(t => t.id === id)?.name || id;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`点位详情 · ${loc.name}`} size="lg">
      <div className="space-y-5">
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">基础信息</div>
          <div className="grid grid-cols-3 gap-3 text-sm bg-gray-50 border border-gray-200 rounded p-3">
            <div><span className="text-gray-400 text-xs">点位ID：</span><span className="font-mono text-gray-700">{loc.id}</span></div>
            <div><span className="text-gray-400 text-xs">所属项目：</span><span className="text-gray-700">{getProjectName(loc.projectId)}</span></div>
            <div><span className="text-gray-400 text-xs">负责人：</span><span className="text-gray-700">{loc.owner || '—'}</span></div>
            <div className="col-span-2"><span className="text-gray-400 text-xs">地址/描述：</span><span className="text-gray-700">{loc.address || '—'}</span></div>
            <div><span className="text-gray-400 text-xs">计划设备数：</span><span className="text-gray-700">{loc.plannedCount || (loc.deviceIds || []).length || 0}</span></div>
            <div className="col-span-3"><span className="text-gray-400 text-xs">备注：</span><span className="text-gray-700">{loc.notes || '—'}</span></div>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">该点位设备（{boundDevices.length}）</div>
          <div className="border border-gray-200 rounded overflow-hidden max-h-56 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0"><tr>{['设备SN', '设备类型', '当前状态', '操作'].map(h => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {boundDevices.map(d => (
                  <tr key={d.id}>
                    <td className="px-3 py-2 font-mono text-xs">{d.sn}</td>
                    <td className="px-3 py-2 text-gray-600">{typeName(d.deviceTypeId)}</td>
                    <td className="px-3 py-2"><StatusBadge status={d.status} /></td>
                    <td className="px-3 py-2 text-xs"><Link to={`/devices/${d.id}`} className="text-slate-600 hover:underline" onClick={onClose}>查看详情</Link></td>
                  </tr>
                ))}
                {boundDevices.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">该点位暂无绑定设备</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">关联交付计划（{plans.length}）</div>
          <div className="flex flex-wrap gap-2">
            {plans.map(dp => <Link key={dp.id} to={`/delivery-plans/${dp.id}`} onClick={onClose} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1 hover:bg-blue-100">{dp.batchNo || dp.name}</Link>)}
            {plans.length === 0 && <span className="text-sm text-gray-400">暂无关联交付计划</span>}
          </div>
        </div>
        <div className="flex justify-end"><button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">关闭</button></div>
      </div>
    </Modal>
  );
}

function LocationsTab() {
  const { state, dispatch } = useApp();
  const { locations = [], projects, devices, deviceTypes = [], deliveryPlans = [] } = state;
  const getProjectName = id => projects.find(p => p.id === id)?.name || '—';
  const deliveryPlanNames = (projectId) => deliveryPlans.filter(dp => dp.projectId === projectId).map(dp => dp.batchNo || dp.name);
  const [formTarget, setFormTarget] = useState(null); // 'new' | loc | null
  const [detailTarget, setDetailTarget] = useState(null);
  const [lf, setLf] = useState({ project: '', status: '', q: '', hasDeliv: '' });
  const lupd = (k, v) => setLf({ ...lf, [k]: v });
  const nowText = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
  const boundOf = (loc) => devices.filter(d => d.locationId === loc.id || (loc.deviceIds || []).includes(d.id));
  const statusOf = (loc) => { const b = boundOf(loc); return locStatusOf(loc, b.length, b.filter(d => d.status === '在线运营').length, loc.plannedCount || (loc.deviceIds || []).length || 0); };
  const filteredLocs = locations.filter(loc => {
    const q = lf.q.trim().toLowerCase();
    return (!lf.project || loc.projectId === lf.project)
      && (!lf.status || statusOf(loc) === lf.status)
      && (!q || (loc.name || '').toLowerCase().includes(q) || (loc.address || '').toLowerCase().includes(q))
      && (!lf.hasDeliv || (lf.hasDeliv === '有' ? deliveryPlanNames(loc.projectId).length > 0 : deliveryPlanNames(loc.projectId).length === 0));
  });
  const paged = usePaged(filteredLocs, 10);
  const lsel = 'border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-600 focus:outline-none';

  const saveLocation = (form) => {
    if (formTarget && formTarget !== 'new') {
      dispatch({ type: 'UPDATE_LOCATION', payload: { id: formTarget.id, ...form, updatedAt: nowText() } });
    } else {
      dispatch({ type: 'ADD_LOCATION', payload: { id: `LOC-${Date.now().toString().slice(-6)}`, ...form, deviceIds: [], createdAt: nowText(), updatedAt: nowText() } });
    }
    setFormTarget(null);
  };
  const toggleDisabled = (loc) => dispatch({ type: 'UPDATE_LOCATION', payload: { id: loc.id, disabled: !loc.disabled, updatedAt: nowText() } });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-gray-500">点位管理是资产管理中的点位主数据，用于支撑交付计划的预分配点位、现场安装调试的现场确认点位，以及设备在线运营后的点位归属。</div>
        <button onClick={() => setFormTarget('new')} className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800 flex-shrink-0">+ 新增点位</button>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '点位总数', value: locations.length, color: 'border-slate-500' },
          { label: '覆盖项目', value: new Set(locations.map(l => l.projectId)).size, color: 'border-indigo-500' },
          { label: '已部署设备', value: devices.filter(d => d.locationId).length, color: 'border-emerald-500' },
          { label: '在线设备', value: devices.filter(d => d.locationId && d.status === '在线运营').length, color: 'border-teal-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-white rounded-xl border border-gray-100 shadow-sm border-l-4 ${color} p-4`}>
            <div className="text-3xl font-semibold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-4 flex flex-wrap gap-2 items-center">
        <select className={lsel} value={lf.project} onChange={e => lupd('project', e.target.value)}><option value="">全部项目</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select className={lsel} value={lf.status} onChange={e => lupd('status', e.target.value)}><option value="">全部点位状态</option>{['待部署', '部署中', '已部署', '在线运营', '已停用'].map(s => <option key={s}>{s}</option>)}</select>
        <input className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none w-52" placeholder="搜索点位名称 / 地址" value={lf.q} onChange={e => lupd('q', e.target.value)} />
        <select className={lsel} value={lf.hasDeliv} onChange={e => lupd('hasDeliv', e.target.value)}><option value="">是否有关联交付计划</option><option value="有">有关联</option><option value="无">无关联</option></select>
        <span className="ml-auto text-sm text-gray-400">共 {filteredLocs.length} 个</span>
      </div>
      <div className="bg-white rounded shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['点位ID', '所属项目', '点位名称', '地址/描述', '计划设备数', '已绑定设备数', '在线设备数', '关联交付计划', '点位状态', '负责人', '最近更新', '操作'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.pageItems.map(loc => {
              const boundDevices = devices.filter(d => d.locationId === loc.id || (loc.deviceIds || []).includes(d.id));
              const onlineCount = boundDevices.filter(d => d.status === '在线运营').length;
              const planned = loc.plannedCount || (loc.deviceIds || []).length || 0;
              const st = locStatusOf(loc, boundDevices.length, onlineCount, planned);
              return (
                <tr key={loc.id} className={`hover:bg-gray-50 ${loc.disabled ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500 whitespace-nowrap">{loc.id}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs whitespace-nowrap">
                    <Link to={`/projects/${loc.projectId}`} className="text-slate-700 hover:underline">{getProjectName(loc.projectId)}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-800 font-medium whitespace-nowrap">{loc.name}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{loc.address || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{planned}</td>
                  <td className="px-4 py-2.5 text-gray-600">{boundDevices.length}</td>
                  <td className="px-4 py-2.5 text-gray-600">{onlineCount}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{deliveryPlanNames(loc.projectId).join('、') || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap"><span className={`text-xs px-2 py-0.5 rounded-full border ${LOC_STATUS_STYLE[st]}`}>{st}</span></td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs whitespace-nowrap">{loc.owner || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">{loc.updatedAt || '—'}</td>
                  <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                    <div className="flex items-center gap-x-3">
                      <button className="text-slate-600 hover:underline" onClick={() => setDetailTarget(loc)}>查看详情</button>
                      <button className="text-blue-600 hover:underline" onClick={() => setFormTarget(loc)}>编辑</button>
                      <button className="text-slate-600 hover:underline" onClick={() => setDetailTarget(loc)}>查看设备</button>
                      <button className="text-emerald-600 hover:underline" onClick={() => setDetailTarget(loc)}>查看交付计划</button>
                      <button className={`hover:underline ${loc.disabled ? 'text-green-600' : 'text-red-400 hover:text-red-600'}`} onClick={() => toggleDisabled(loc)}>{loc.disabled ? '启用' : '停用'}</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredLocs.length === 0 && <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-400">暂无匹配点位</td></tr>}
          </tbody>
        </table>
        </div>
        <Pagination page={paged.page} total={paged.total} totalPages={paged.totalPages} onChange={paged.setPage} />
      </div>

      {formTarget && <LocationFormModal isOpen={!!formTarget} onClose={() => setFormTarget(null)} initial={formTarget === 'new' ? null : formTarget} projects={projects} onSave={saveLocation} />}
      {detailTarget && <LocationDetailModal isOpen={!!detailTarget} onClose={() => setDetailTarget(null)} loc={detailTarget} projects={projects} devices={devices} deviceTypes={deviceTypes} deliveryPlans={deliveryPlans} getProjectName={getProjectName} />}
    </div>
  );
}

function DevicesTab() {
  const { state, dispatch } = useApp();
  const { currentRole } = useRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const subtab = searchParams.get('subtab') || 'all';
  const activeSubTab = DEVICE_SUB_TABS.some(t => t.key === subtab) ? subtab : 'all';

  const pendingAlerts = (state.alerts || []).filter(a => !['已解决', '已关闭'].includes(a.status)).length;

  const setSubTab = (key, sn) => {
    const next = new URLSearchParams(searchParams);
    next.set('subtab', key);
    if (sn) next.set('alertSN', sn); else next.delete('alertSN');
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
      {activeSubTab === 'all' && <AllDevicesSubTab state={state} goAlerts={(sn) => setSubTab('alerts', sn)} />}
      {activeSubTab === 'alerts' && <AlertsSubTab state={state} dispatch={dispatch} currentRole={currentRole} initialSN={searchParams.get('alertSN') || ''} onClearSN={() => setSubTab('alerts')} />}
    </div>
  );
}

/* ─────────── Main ─────────── */
export default function AssetsPage() {
  const { state } = useApp();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'devices';
  const activeTab = TABS.some(t => t.key === tab) ? tab : 'devices';
  const activeLabel = TABS.find(t => t.key === activeTab)?.label || '';

  return (
    <div>
      <div className="px-6 pt-5 pb-4 bg-white border-b border-gray-100">
        <div className="text-xs text-gray-400">资产管理 / {activeLabel}</div>
      </div>
      <div className="p-6">
        {activeTab === 'devices' && <DevicesTab />}
        {activeTab === 'materials' && <Materials />}
        {activeTab === 'types' && <DeviceTypes />}
        {activeTab === 'locations' && <LocationsTab />}
      </div>
    </div>
  );
}
