import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Pagination, usePaged } from '../components/Pagination';
import {
  isPass, deliveryPlanStatus, resultLabel,
  bindingDeviceStatus, factoryStageStatus, siteStageStatus, acceptStageStatus,
} from '../utils/status';

const NODES = [
  { key: 'binding', label: '绑定设备' },
  { key: 'factoryInspection', label: '出厂检验' },
  { key: 'siteInstall', label: '现场安装调试' },
  { key: 'customerAccept', label: '客户验收' },
];

const INPUT = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500 bg-white';
const BTN_PRIMARY = 'px-3 py-1.5 text-sm bg-slate-700 text-white rounded hover:bg-slate-800';
const BTN_GHOST = 'px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50';

function nowText() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function Section({ title, action, children }) {
  return (
    <section className="bg-white rounded shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function MetricCards({ items }) {
  return (
    <div className="grid grid-cols-5 gap-4 mb-5">
      {items.map((item) => (
        <div key={item.label} className={`bg-white rounded shadow-sm border-l-4 ${item.color} p-4`}>
          <div className="text-2xl font-semibold text-gray-900">{item.value}</div>
          <div className="text-xs text-gray-500 mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function FlowStepper({ activeNode, onChange, counts }) {
  return (
    <div className="bg-white rounded shadow-sm p-5 mb-6">
      <div className="flex items-center">
        {NODES.map((node, index) => (
          <div key={node.key} className="flex items-center flex-1">
            <button onClick={() => onChange(node.key)} className="flex-1 flex flex-col items-center gap-1">
              <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${activeNode === node.key ? 'bg-blue-600 text-white ring-2 ring-blue-200' : 'bg-gray-100 text-gray-500'}`}>{index + 1}</span>
              <span className={`text-xs ${activeNode === node.key ? 'text-slate-800 font-medium' : 'text-gray-500'}`}>{node.label}</span>
              <span className="text-xs text-gray-400">{counts[node.key] || 0}</span>
            </button>
            {index < NODES.length - 1 && <div className="w-10 h-0.5 bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// 交付计划详情核心动作的业务弹窗（调整点位 / 解绑设备 / 确认出厂 / 生成交付工单 /
// 生成质量问题 / 暂存绑定结果 / 确认绑定完成），不再展示原型占位。
const QI_ISSUE_TYPES = ['现场质量问题', '功能异常', '外观缺陷', '性能不达标', '通信异常', '其他'];

function DField({ label, value, full }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
      <div className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded px-3 py-2 min-h-[38px] break-all">{value === undefined || value === null || value === '' ? '—' : value}</div>
    </div>
  );
}

function DeliveryActionModal({ isOpen, onClose, action, plan, boundDevices, records, locations, state, dispatch }) {
  const name = action?.name || '';
  const device = action?.device || null;
  const locNameOf = (id) => locations.find((l) => l.id === id)?.name || '—';
  const [newLoc, setNewLoc] = useState('');
  const [reason, setReason] = useState('');
  const [confirmChk, setConfirmChk] = useState(false);
  const [operator, setOperator] = useState(state.currentUser);
  const [notes, setNotes] = useState('');
  const [severity, setSeverity] = useState('中');
  const [desc, setDesc] = useState('');
  const [owner, setOwner] = useState('');
  const [issueType, setIssueType] = useState('现场质量问题');
  const [genWO, setGenWO] = useState(false);
  const [linkPlan, setLinkPlan] = useState(true);
  const sourceNode = plan.currentNode || '出厂检验';

  const close = () => { setNewLoc(''); setReason(''); setConfirmChk(false); setNotes(''); setDesc(''); setOwner(''); setGenWO(false); onClose(); };

  const target = plan.targetCount || 0;
  const bound = boundDevices.length;
  const gap = Math.max(target - bound, 0);
  const factoryPass = boundDevices.filter((d) => (records.factoryInspection || []).some((r) => r.deviceId === d.id && ['Pass', '通过'].includes(r.result))).length;
  const curLoc = device ? locNameOf(device.locationId || device.preAssignedLocationId) : '—';

  const submitAdjust = () => {
    if (!device || !newLoc) return;
    dispatch({ type: 'UPDATE_DEVICE', payload: { id: device.id, preAssignedLocationId: newLoc, updatedAt: nowText() } });
    dispatch({ type: 'ADD_OPERATION_LOG', payload: { id: `LOG-${Date.now()}-${plan.id}`, deliveryPlanId: plan.id, projectId: plan.projectId, deviceId: device.id, operator, timestamp: nowText(), actionType: '调整点位', fromStatus: plan.status, toStatus: plan.status, notes: `${device.sn} 点位调整为 ${locNameOf(newLoc)}：${reason || '—'}` } });
    close();
  };
  const submitUnbind = () => {
    if (!device || !reason.trim() || !confirmChk) return;
    const nextBinding = (plan.records?.binding || []).filter((b) => b.deviceId !== device.id);
    const nextBound = (plan.boundDeviceIds || []).filter((x) => x !== device.id);
    dispatch({ type: 'UPDATE_DELIVERY_PLAN', payload: { ...plan, boundDeviceIds: nextBound, records: { ...plan.records, binding: nextBinding } } });
    dispatch({ type: 'UPDATE_DEVICE', payload: { id: device.id, deliveryPlanId: null, preAssignedLocationId: null, updatedAt: nowText() } });
    dispatch({ type: 'ADD_OPERATION_LOG', payload: { id: `LOG-${Date.now()}-${plan.id}`, deliveryPlanId: plan.id, projectId: plan.projectId, deviceId: device.id, operator: state.currentUser, timestamp: nowText(), actionType: '解绑设备', fromStatus: plan.status, toStatus: plan.status, notes: `解绑 ${device.sn}：${reason}` } });
    close();
  };
  const submitConfirmFactory = () => {
    dispatch({ type: 'ADD_OPERATION_LOG', payload: { id: `LOG-${Date.now()}-${plan.id}`, deliveryPlanId: plan.id, projectId: plan.projectId, operator, timestamp: nowText(), actionType: '确认出厂', fromStatus: plan.status, toStatus: plan.status, notes: `确认出厂：已绑定 ${bound} 台，出厂检验 Pass ${factoryPass} 台。${notes || ''}` } });
    close();
  };
  const submitGenWO = () => {
    if (!device || !desc.trim()) return;
    dispatch({ type: 'ADD_DELIVERY_WORK_ORDER', payload: { id: `DWO-${plan.id}-${device.id}-${Date.now().toString().slice(-4)}`, type: 'delivery', deliveryPlanId: linkPlan ? plan.id : undefined, deviceId: device.id, deviceSN: device.sn, sourceNode, stage: sourceNode, description: desc, severity, status: '待处理', assignedTo: owner, createdAt: nowText(), updatedAt: nowText(), processLogs: [] } });
    close();
  };
  const submitGenQI = () => {
    if (!device || !desc.trim()) return;
    dispatch({ type: 'ADD_QUALITY_ISSUE', payload: { id: `QI-${Date.now().toString().slice(-6)}`, deviceId: device.id, deviceSN: device.sn, projectId: plan.projectId, sourceStage: sourceNode, issueType, severity, issueDesc: desc, description: desc, owner, reporterName: state.currentUser, reportTime: nowText(), status: '待处理', source: '手动录入', linkedWorkOrder: genWO, processLogs: [] } });
    close();
  };

  let body = null; let footer = null;
  if (name === '调整点位') {
    body = (
      <div className="grid grid-cols-2 gap-3">
        <DField label="设备SN" value={device?.sn} />
        <DField label="当前点位" value={curLoc} />
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">新点位 *</label>
          <select className={INPUT} value={newLoc} onChange={(e) => setNewLoc(e.target.value)}><option value="">-- 选择点位 --</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
        </div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">操作人</label><input className={INPUT} value={operator} onChange={(e) => setOperator(e.target.value)} /></div>
        <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">调整原因</label><textarea className={INPUT} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
        <DField label="操作时间" value={nowText()} />
      </div>
    );
    footer = <button onClick={submitAdjust} disabled={!device || !newLoc} className={`${BTN_PRIMARY} disabled:opacity-40`}>确认调整</button>;
  } else if (name === '解绑设备') {
    body = (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <DField label="设备SN" value={device?.sn} />
          <DField label="所属交付计划" value={plan.name || plan.id} />
          <DField label="当前点位" value={curLoc} />
        </div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">解绑原因 *</label><textarea className={INPUT} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="请填写解绑原因（必填）" /></div>
        <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={confirmChk} onChange={(e) => setConfirmChk(e.target.checked)} />我确认将该设备从本交付计划解绑</label>
        <div className="bg-amber-50 border border-amber-100 rounded p-3 text-xs text-amber-700">解绑后该设备回到可交付设备池，可重新绑定到其他交付计划。</div>
      </div>
    );
    footer = <button onClick={submitUnbind} disabled={!device || !reason.trim() || !confirmChk} className={`${BTN_PRIMARY} disabled:opacity-40`}>确认解绑</button>;
  } else if (name === '确认出厂') {
    body = (
      <div className="grid grid-cols-2 gap-3">
        <DField label="交付计划" value={plan.name || plan.id} />
        <DField label="已绑定设备数" value={`${bound} 台`} />
        <DField label="出厂检验Pass设备数" value={`${factoryPass} 台`} />
        <div><label className="block text-xs font-medium text-gray-600 mb-1">确认人</label><input className={INPUT} value={operator} onChange={(e) => setOperator(e.target.value)} /></div>
        <DField label="确认时间" value={nowText()} />
        <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">备注</label><textarea className={INPUT} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      </div>
    );
    footer = <button onClick={submitConfirmFactory} className={BTN_PRIMARY}>确认出厂</button>;
  } else if (name === '生成交付工单') {
    body = (
      <div className="grid grid-cols-2 gap-3">
        <DField label="设备SN" value={device?.sn} />
        <DField label="来源节点" value={sourceNode} />
        <div><label className="block text-xs font-medium text-gray-600 mb-1">严重程度</label><select className={INPUT} value={severity} onChange={(e) => setSeverity(e.target.value)}>{['高', '中', '低'].map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">负责人</label><input className={INPUT} value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="待指派" /></div>
        <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">问题描述 *</label><textarea className={INPUT} rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <label className="col-span-2 flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={linkPlan} onChange={(e) => setLinkPlan(e.target.checked)} />关联当前交付计划</label>
      </div>
    );
    footer = <button onClick={submitGenWO} disabled={!device || !desc.trim()} className={`${BTN_PRIMARY} disabled:opacity-40`}>生成交付工单</button>;
  } else if (name === '生成质量问题') {
    body = (
      <div className="grid grid-cols-2 gap-3">
        <DField label="设备SN" value={device?.sn} />
        <DField label="来源节点" value={sourceNode} />
        <div><label className="block text-xs font-medium text-gray-600 mb-1">问题类型</label><select className={INPUT} value={issueType} onChange={(e) => setIssueType(e.target.value)}>{QI_ISSUE_TYPES.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">严重程度</label><select className={INPUT} value={severity} onChange={(e) => setSeverity(e.target.value)}>{['高', '中', '低'].map((s) => <option key={s}>{s}</option>)}</select></div>
        <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">问题描述 *</label><textarea className={INPUT} rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">负责人</label><input className={INPUT} value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="待指派" /></div>
        <label className="flex items-center gap-2 text-sm text-gray-700 pt-6"><input type="checkbox" checked={genWO} onChange={(e) => setGenWO(e.target.checked)} />是否已生成工单</label>
      </div>
    );
    footer = <button onClick={submitGenQI} disabled={!device || !desc.trim()} className={`${BTN_PRIMARY} disabled:opacity-40`}>生成质量问题</button>;
  } else if (name === '暂存绑定结果' || name === '确认绑定完成') {
    body = (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <DField label="交付计划" value={plan.name || plan.id} />
          <DField label="已选择设备数" value={`${bound} 台`} />
          <DField label="缺口数量" value={`${gap} 台`} />
          <div><label className="block text-xs font-medium text-gray-600 mb-1">操作人</label><input className={INPUT} value={operator} onChange={(e) => setOperator(e.target.value)} /></div>
          <DField label="操作时间" value={nowText()} />
          <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">备注</label><textarea className={INPUT} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <div className={`rounded p-3 text-xs border ${name === '确认绑定完成' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
          {name === '确认绑定完成' ? '已确认绑定完成，交付计划进入出厂检验节点。' : `已暂存当前绑定结果，仍有 ${gap} 台未绑定，需绑定完成后才能推进到出厂检验。`}
        </div>
      </div>
    );
    footer = <button onClick={close} className={BTN_PRIMARY}>知道了</button>;
  }

  return (
    <Modal isOpen={isOpen} onClose={close} title={name || '交付动作'} size="lg">
      <div className="space-y-4">
        {body}
        <div className="flex justify-end gap-2">
          {name !== '暂存绑定结果' && name !== '确认绑定完成' && <button onClick={close} className={BTN_GHOST}>取消</button>}
          {footer}
        </div>
      </div>
    </Modal>
  );
}

function DeviceSelectModal({ isOpen, onClose, eligibleDevices, locations, deviceTypes, onConfirm }) {
  const [selected, setSelected] = useState(new Set());
  const [locationId, setLocationId] = useState('');
  const getTypeName = (id) => deviceTypes.find((item) => item.id === id)?.name || id;
  const toggle = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="选择可交付设备" size="lg">
      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-600">
          可选规则：属于当前项目、已入库或待分配、待交付/可交付、未被其他未完成交付计划绑定、未作废冻结。
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">预分配点位</label>
          <select className={INPUT} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
            <option value="">暂不预分配</option>
            {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
        </div>
        <div className="border border-gray-200 rounded overflow-hidden max-h-80 overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0"><tr><th className="px-3 py-2 w-10" />{['设备SN', '设备类型', '来源生产计划', '入库时间', '当前状态', '当前点位', '预分配点位', '是否被其他交付计划占用'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {eligibleDevices.map((device) => (
                  <tr key={device.id} onClick={() => toggle(device.id)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-3 py-2"><input type="checkbox" checked={selected.has(device.id)} onChange={() => toggle(device.id)} onClick={(e) => e.stopPropagation()} /></td>
                    <td className="px-3 py-2 font-mono text-xs font-medium whitespace-nowrap">{device.sn}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{getTypeName(device.deviceTypeId)}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500 whitespace-nowrap">{device.productionPlanId || '—'}</td>
                    <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{device.inboundTime || device.updatedAt || '—'}</td>
                    <td className="px-3 py-2"><StatusBadge status={device.status} /></td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{locations.find((location) => location.id === device.locationId)?.name || '—'}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{locationId ? (locations.find((l) => l.id === locationId)?.name || '—') : '待分配'}</td>
                    <td className="px-3 py-2 text-xs text-emerald-600 whitespace-nowrap">否</td>
                  </tr>
                ))}
                {eligibleDevices.length === 0 && <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400">暂无可交付设备</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={BTN_GHOST}>取消</button>
          <button disabled={selected.size === 0} className={`${BTN_PRIMARY} disabled:opacity-40`} onClick={() => { onConfirm([...selected], locationId); setSelected(new Set()); onClose(); }}>确认绑定（{selected.size}）</button>
        </div>
      </div>
    </Modal>
  );
}

// variant: 'factory' | 'site' | 'accept'，按交付节点渲染差异化字段与校验。
function ResultModal({ isOpen, onClose, title, variant, devices, locations, deviceTypes = [], onSave }) {
  const [form, setForm] = useState({ deviceId: '', result: 'Pass', operator: '', locationId: '', changeReason: '', ngReason: '', notes: '', customerRep: '', genWorkOrder: true, genQualityIssue: false });
  const device = devices.find((d) => d.id === form.deviceId);
  const preLocation = device?.preAssignedLocationId || device?.locationId || '';
  const preLocationName = locations.find((l) => l.id === preLocation)?.name || '—';
  const siteLocationName = locations.find((l) => l.id === (device?.locationId || preLocation))?.name || '—';
  const typeName = deviceTypes.find((t) => t.id === device?.deviceTypeId)?.name || device?.deviceTypeId || '—';
  const requireLocation = variant === 'site';
  const locationChanged = requireLocation && form.locationId && preLocation && form.locationId !== preLocation;
  const isNG = form.result === 'NG';
  const operatorLabel = variant === 'factory' ? '检验人' : variant === 'site' ? '安装调试人' : '验收人';
  const timeLabel = variant === 'factory' ? '检验时间' : variant === 'site' ? '安装调试时间' : '验收时间';

  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, deviceSN: device?.sn || '', preLocationId: preLocation });
    setForm({ deviceId: '', result: 'Pass', operator: '', locationId: '', changeReason: '', ngReason: '', notes: '', customerRep: '', genWorkOrder: true, genQualityIssue: false });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">设备SN</label><select className={INPUT} required value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })}><option value="">-- 选择设备 --</option>{devices.map((d) => <option key={d.id} value={d.id}>{d.sn}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">设备类型</label><input className={`${INPUT} bg-gray-50`} readOnly value={typeName} /></div>
          {variant === 'site' && <div><label className="block text-sm font-medium text-gray-700 mb-1">预分配点位</label><input className={`${INPUT} bg-gray-50`} readOnly value={preLocationName} /></div>}
          {variant === 'accept' && <div><label className="block text-sm font-medium text-gray-700 mb-1">现场确认点位</label><input className={`${INPUT} bg-gray-50`} readOnly value={siteLocationName} /></div>}
          {requireLocation && <div><label className="block text-sm font-medium text-gray-700 mb-1">现场确认点位 *</label><select className={INPUT} required value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}><option value="">-- 选择点位 --</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></div>}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{variant === 'factory' ? '检验结果' : variant === 'site' ? '安装调试结果' : '验收结果'}</label><select className={INPUT} value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })}><option>Pass</option><option>NG</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{operatorLabel}</label><input className={INPUT} value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{timeLabel}</label><input className={`${INPUT} bg-gray-50`} readOnly value={nowText()} /></div>
          {variant === 'accept' && <div><label className="block text-sm font-medium text-gray-700 mb-1">客户代表</label><input className={INPUT} value={form.customerRep} onChange={(e) => setForm({ ...form, customerRep: e.target.value })} placeholder="客户签收代表" /></div>}
          {locationChanged && <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">点位变更原因 *</label><textarea className={INPUT} required rows={2} value={form.changeReason} onChange={(e) => setForm({ ...form, changeReason: e.target.value })} placeholder="现场确认点位与预分配点位不一致，请说明原因" /></div>}
          {isNG && <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">NG原因 *</label><input className={INPUT} required value={form.ngReason} onChange={(e) => setForm({ ...form, ngReason: e.target.value })} /></div>}
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">{variant === 'accept' ? '验收备注' : '异常说明 / 备注'}</label><textarea className={INPUT} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">{variant === 'accept' ? '附件 / 验收单' : '附件 / 报告'}</label><input className={`${INPUT} bg-gray-50 text-gray-400`} disabled placeholder="（原型占位）上传附件" /></div>
        </div>
        {isNG && (
          <div className="bg-red-50 border border-red-100 rounded p-3 space-y-2">
            <div className="text-xs text-red-600">NG 时不允许进入下一节点，需先处理工单 / 质量问题。</div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.genWorkOrder} onChange={(e) => setForm({ ...form, genWorkOrder: e.target.checked })} />是否生成交付工单</label>
              {variant === 'accept' && <label className="flex items-center gap-2"><input type="checkbox" checked={form.genQualityIssue} onChange={(e) => setForm({ ...form, genQualityIssue: e.target.checked })} />是否生成质量问题</label>}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={BTN_GHOST}>取消</button>
          <button type="submit" className={BTN_PRIMARY}>保存结果</button>
        </div>
      </form>
    </Modal>
  );
}

function getBoundDeviceIds(plan) {
  const explicit = plan.boundDeviceIds || [];
  const bindingRecords = (plan.records?.binding || []).map((record) => record.deviceId);
  const stageRecords = ['factoryInspection', 'siteInstall', 'customerAccept'].flatMap((key) => (plan.records?.[key] || []).map((record) => record.deviceId));
  return [...new Set([...explicit, ...bindingRecords, ...stageRecords].filter(Boolean))];
}

function BindingNode({ plan, boundDevices, eligibleDevices, locations, deviceTypes, openSelector, confirmBinding, onStash, openAction }) {
  const target = plan.targetCount || 0;
  const remaining = Math.max(target - boundDevices.length, 0);
  const isFull = target > 0 && remaining === 0;
  const paged = usePaged(boundDevices, 10);
  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700">
        本节点用于为交付计划绑定具体设备 SN，并可预分配点位。全部绑定完成后进入出厂检验。
      </div>
      <MetricCards items={[
        { label: '计划交付', value: target, color: 'border-slate-500' },
        { label: '已绑定', value: boundDevices.length, color: 'border-blue-500' },
        { label: '未绑定', value: remaining, color: 'border-amber-500' },
        { label: '可选设备', value: eligibleDevices.length, color: 'border-emerald-500' },
        { label: '点位数', value: locations.length, color: 'border-indigo-500' },
      ]} />
      <Section title="绑定概览" action={
        <div className="flex gap-2">
          <button className={BTN_GHOST} onClick={openSelector}>选择可交付设备</button>
          {isFull
            ? <button className={BTN_PRIMARY} onClick={confirmBinding}>确认绑定完成</button>
            : <button className={BTN_GHOST} onClick={onStash}>暂存绑定结果</button>}
        </div>
      }>
        <div className="text-sm text-gray-600">只有属于当前项目、已入库/待分配项目、未被其他未完成交付计划绑定、未作废冻结的设备可选。预分配点位是计划安装位置，现场安装调试时需要再次确认现场实际点位。</div>
        {isFull
          ? <div className="mt-2 text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 rounded px-3 py-2">已绑定设备数已达计划交付数量。确认后将锁定本交付计划的设备 SN，并将当前节点推进至出厂检验。</div>
          : <div className="mt-2 text-xs bg-amber-50 border border-amber-100 text-amber-700 rounded px-3 py-2">当前仍有 {remaining} 台设备未绑定，需绑定完成后才能进入出厂检验。</div>}
      </Section>
      <Section title="已绑定设备列表">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['设备SN', '设备类型', '来源生产计划', '当前状态', '入库时间', '预分配点位', '绑定状态', '操作'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {paged.pageItems.map((device) => {
                const type = deviceTypes.find((item) => item.id === device.deviceTypeId);
                const location = locations.find((item) => item.id === device.preAssignedLocationId || item.id === device.locationId);
                return (
                  <tr key={device.id}>
                    <td className="px-3 py-2 font-mono text-xs whitespace-nowrap"><Link to={`/devices/${device.id}`} className="text-blue-600 hover:underline">{device.sn}</Link></td>
                    <td className="px-3 py-2 whitespace-nowrap">{type?.name || device.deviceTypeId}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500 whitespace-nowrap">{device.productionPlanId || '—'}</td>
                    <td className="px-3 py-2"><StatusBadge status={bindingDeviceStatus(device, true)} /></td>
                    <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{device.inboundTime || device.updatedAt || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{location?.name || '—'}</td>
                    <td className="px-3 py-2"><StatusBadge status="已绑定" /></td>
                    <td className="px-3 py-2 text-xs">
                      <div className="flex gap-x-3 whitespace-nowrap">
                        <button className="text-slate-600 hover:underline" onClick={() => openAction('调整点位', device)}>调整点位</button>
                        <button className="text-red-400 hover:text-red-600 hover:underline" onClick={() => openAction('解绑设备', device)}>解绑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {boundDevices.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">暂无已绑定设备</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={paged.page} total={paged.total} totalPages={paged.totalPages} onChange={paged.setPage} />
      </Section>
    </div>
  );
}

function StageMetrics({ label0, devices, records }) {
  const passIds = new Set(records.filter(isPass).map((r) => r.deviceId));
  const ngCount = records.filter((r) => !isPass(r) && ['NG', '不通过', '未通过'].includes(r.result)).length;
  return (
    <MetricCards items={[
      { label: label0, value: devices.length, color: 'border-slate-500' },
      { label: 'Pass', value: passIds.size, color: 'border-green-500' },
      { label: 'NG', value: ngCount, color: 'border-red-500' },
      { label: '待处理', value: Math.max(devices.length - passIds.size, 0), color: 'border-amber-500' },
      { label: '进度', value: `${passIds.size}/${devices.length}`, color: 'border-blue-500' },
    ]} />
  );
}

const latestFor = (records, deviceId) => records.filter((item) => item.deviceId === deviceId).at(-1);
const locName = (locations, ...ids) => {
  const found = locations.find((item) => ids.filter(Boolean).includes(item.id));
  return found?.name || '—';
};

function FactoryNode({ devices, records, locations, deviceTypes, onAction, onConfirmOut, onAdvance, openAction }) {
  const paged = usePaged(devices, 10);
  return (
    <div className="space-y-5">
      <StageMetrics label0="待检设备" devices={devices} records={records} />
      <Section title="出厂检验概览" action={<div className="flex gap-2"><button className={BTN_GHOST} onClick={onAction}>录入出厂检验结果</button><button className={BTN_GHOST} onClick={onConfirmOut}>确认出厂</button><button className={BTN_PRIMARY} onClick={onAdvance}>推进到现场安装调试</button></div>}>
        <div className="text-sm text-gray-600">Pass 后才允许确认出厂；NG 时生成交付工单。所有设备出厂检验 Pass 且确认出厂后，才允许推进到现场安装调试。</div>
      </Section>
      <Section title="出厂检验设备列表">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['设备SN', '设备类型', '预分配点位', '检验结果', '出厂状态', '操作'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {paged.pageItems.map((device) => {
                const record = latestFor(records, device.id);
                const type = deviceTypes.find((item) => item.id === device.deviceTypeId);
                return (
                  <tr key={device.id}>
                    <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{device.sn}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{type?.name || device.deviceTypeId}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{locName(locations, device.preAssignedLocationId, device.locationId)}</td>
                    <td className="px-3 py-2"><StatusBadge status={resultLabel(record, '待检验')} /></td>
                    <td className="px-3 py-2"><StatusBadge status={factoryStageStatus(record)} /></td>
                    <td className="px-3 py-2 text-xs">
                      <div className="flex gap-x-3 whitespace-nowrap">
                        <button className="text-blue-600 hover:underline" onClick={onAction}>录入结果</button>
                        <button className="text-slate-600 hover:underline" onClick={onConfirmOut}>确认出厂</button>
                        <button className="text-emerald-600 hover:underline" onClick={() => openAction('生成交付工单', device)}>生成工单</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {devices.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">暂无设备</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={paged.page} total={paged.total} totalPages={paged.totalPages} onChange={paged.setPage} />
      </Section>
    </div>
  );
}

function SiteNode({ devices, records, locations, onAction, onAdvance, openAction }) {
  const paged = usePaged(devices, 10);
  return (
    <div className="space-y-5">
      <StageMetrics label0="待安装调试设备" devices={devices} records={records} />
      <Section title="现场安装调试概览" action={<div className="flex gap-2"><button className={BTN_GHOST} onClick={onAction}>录入安装调试结果</button><button className={BTN_PRIMARY} onClick={onAdvance}>推进到客户验收</button></div>}>
        <div className="text-sm text-gray-600">现场确认点位必填；若现场确认点位与预分配点位不一致，需要填写点位变更原因；NG 时生成交付工单。</div>
      </Section>
      <Section title="现场安装调试设备列表">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['设备SN', '预分配点位', '现场确认点位', '安装调试结果', '当前状态', '操作'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {paged.pageItems.map((device) => {
                const record = latestFor(records, device.id);
                return (
                  <tr key={device.id}>
                    <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{device.sn}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{locName(locations, device.preAssignedLocationId)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{locName(locations, record?.locationId, device.locationId)}</td>
                    <td className="px-3 py-2"><StatusBadge status={resultLabel(record, '待录入')} /></td>
                    <td className="px-3 py-2"><StatusBadge status={siteStageStatus(record)} /></td>
                    <td className="px-3 py-2 text-xs">
                      <div className="flex gap-x-3 whitespace-nowrap">
                        <button className="text-blue-600 hover:underline" onClick={onAction}>录入结果</button>
                        <button className="text-slate-600 hover:underline" onClick={() => openAction('调整点位', device)}>调整现场点位</button>
                        <button className="text-emerald-600 hover:underline" onClick={() => openAction('生成交付工单', device)}>生成工单</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {devices.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">暂无设备</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={paged.page} total={paged.total} totalPages={paged.totalPages} onChange={paged.setPage} />
      </Section>
    </div>
  );
}

function AcceptNode({ devices, records, locations, onAction, onAdvance, openAction }) {
  const paged = usePaged(devices, 10);
  return (
    <div className="space-y-5">
      <StageMetrics label0="待验收设备" devices={devices} records={records} />
      <Section title="客户验收概览" action={<div className="flex gap-2"><button className={BTN_GHOST} onClick={onAction}>录入客户验收结果</button><button className={BTN_PRIMARY} onClick={onAdvance}>完成交付计划</button></div>}>
        <div className="text-sm text-gray-600">Pass 后设备状态变为在线运营；NG 时生成交付工单，必要时生成质量问题记录。全部设备验收 Pass 后，交付计划状态变为已验收。</div>
      </Section>
      <Section title="客户验收设备列表">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['设备SN', '现场确认点位', '验收结果', '验收时间', '当前状态', '操作'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {paged.pageItems.map((device) => {
                const record = latestFor(records, device.id);
                return (
                  <tr key={device.id}>
                    <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{device.sn}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{locName(locations, record?.locationId, device.locationId, device.preAssignedLocationId)}</td>
                    <td className="px-3 py-2"><StatusBadge status={resultLabel(record, '待验收')} /></td>
                    <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{record?.time || '—'}</td>
                    <td className="px-3 py-2"><StatusBadge status={acceptStageStatus(record)} /></td>
                    <td className="px-3 py-2 text-xs">
                      <div className="flex gap-x-3 whitespace-nowrap">
                        <button className="text-blue-600 hover:underline" onClick={onAction}>录入结果</button>
                        <button className="text-emerald-600 hover:underline" onClick={() => openAction('生成交付工单', device)}>生成工单</button>
                        <button className="text-slate-600 hover:underline" onClick={() => openAction('生成质量问题', device)}>生成质量问题</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {devices.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">暂无设备</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={paged.page} total={paged.total} totalPages={paged.totalPages} onChange={paged.setPage} />
      </Section>
    </div>
  );
}

export default function DeliveryPlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modal, setModal] = useState(null);
  const [action, setAction] = useState(null);
  const nodeParam = searchParams.get('node');
  const activeNode = NODES.some((node) => node.key === nodeParam) ? nodeParam : 'binding';
  const setActiveNode = (key) => setSearchParams({ node: key }, { replace: true });
  const plan = state.deliveryPlans?.find((item) => item.id === id);

  if (!plan) {
    return <div className="p-8 text-center text-gray-400">未找到交付计划 {id}</div>;
  }

  const project = state.projects.find((item) => item.id === plan.projectId);
  const projectLocations = state.locations.filter((location) => location.projectId === plan.projectId);
  const otherActiveBound = new Set((state.deliveryPlans || [])
    .filter((item) => item.id !== plan.id && !['已验收', '已作废'].includes(item.status))
    .flatMap(getBoundDeviceIds));
  const boundIds = getBoundDeviceIds(plan);
  // 从绑定记录取预分配点位，补到设备对象上，保证出厂检验 / 现场安装调试节点都能显示预分配点位。
  const preLocMap = Object.fromEntries((plan.records?.binding || []).map((b) => [b.deviceId, b.preAssignedLocationId]));
  const boundDevices = boundIds
    .map((deviceId) => state.devices.find((device) => device.id === deviceId))
    .filter(Boolean)
    .map((device) => ({ ...device, preAssignedLocationId: device.preAssignedLocationId || preLocMap[device.id] || null }));
  const eligibleDevices = state.devices.filter((device) =>
    device.projectId === plan.projectId
    && ['已入库', '待分配项目', '已分配项目'].includes(device.status)
    && !otherActiveBound.has(device.id)
    && !device.frozen
  );
  const records = {
    binding: plan.records?.binding || [],
    factoryInspection: plan.records?.factoryInspection || [],
    siteInstall: plan.records?.siteInstall || [],
    customerAccept: plan.records?.customerAccept || [],
  };
  const factoryPassDevices = boundDevices.filter((device) => records.factoryInspection.some((record) => record.deviceId === device.id && ['Pass', '通过'].includes(record.result)));
  const sitePassDevices = boundDevices.filter((device) => records.siteInstall.some((record) => record.deviceId === device.id && ['Pass', '通过'].includes(record.result)));
  const counts = { binding: boundDevices.length, factoryInspection: records.factoryInspection.length, siteInstall: records.siteInstall.length, customerAccept: records.customerAccept.length };

  const updatePlanRecords = (key, nextRecords, extra = {}) => {
    dispatch({ type: 'UPDATE_DELIVERY_PLAN', payload: { ...plan, ...extra, records: { ...plan.records, [key]: nextRecords } } });
  };

  const bindDevices = (ids, locationId) => {
    const newRecords = ids.map((deviceId) => ({ id: `BIND-${Date.now()}-${deviceId}`, deviceId, preAssignedLocationId: locationId, operator: state.currentUser, time: nowText() }));
    ids.forEach((deviceId) => dispatch({ type: 'UPDATE_DEVICE', payload: { id: deviceId, deliveryPlanId: plan.id, preAssignedLocationId: locationId || null, updatedAt: nowText() } }));
    updatePlanRecords('binding', [...records.binding, ...newRecords], { boundDeviceIds: [...new Set([...boundIds, ...ids])], currentNode: '绑定设备', status: '交付中' });
    dispatch({ type: 'ADD_OPERATION_LOG', payload: { id: `LOG-${Date.now()}-${plan.id}`, deliveryPlanId: plan.id, projectId: plan.projectId, operator: state.currentUser, timestamp: nowText(), actionType: '绑定设备', fromStatus: plan.status, toStatus: '交付中', notes: `绑定 ${ids.length} 台设备` } });
  };

  const saveStageResult = (key, resultForm) => {
    const nextIndex = records[key].length + 1;
    const record = { id: `${key}-${resultForm.deviceId}-${nextIndex}`, deviceId: resultForm.deviceId, deviceSN: resultForm.deviceSN, result: resultForm.result, operator: resultForm.operator || state.currentUser, time: nowText(), notes: resultForm.notes, locationId: resultForm.locationId || null, changeReason: resultForm.changeReason || '' };
    updatePlanRecords(key, [...records[key], record]);
    // 客户验收 Pass -> 设备在线运营。出厂检验 / 现场安装调试的阶段状态由本节点记录派生，
    // 不再写入设备的中间状态，避免与设备生命周期词表产生新的不一致。
    if (key === 'customerAccept' && resultForm.result === 'Pass') {
      dispatch({ type: 'UPDATE_DEVICE', payload: { id: resultForm.deviceId, status: '在线运营', locationId: resultForm.locationId || undefined, updatedAt: nowText() } });
    }
    if (key === 'siteInstall' && resultForm.locationId) {
      dispatch({ type: 'UPDATE_DEVICE', payload: { id: resultForm.deviceId, locationId: resultForm.locationId, updatedAt: nowText() } });
    }
    const ngText = resultForm.ngReason || resultForm.notes || `${key}节点NG`;
    if (resultForm.result === 'NG' && resultForm.genWorkOrder !== false) {
      dispatch({ type: 'ADD_DELIVERY_WORK_ORDER', payload: { id: `DWO-${plan.id}-${resultForm.deviceId}-${nextIndex}`, type: 'delivery', deliveryPlanId: plan.id, deviceId: resultForm.deviceId, deviceSN: resultForm.deviceSN, description: ngText, severity: '中', status: '待处理', assignedTo: '', createdAt: nowText(), updatedAt: nowText(), processLogs: [] } });
    }
    if (resultForm.result === 'NG' && resultForm.genQualityIssue) {
      dispatch({ type: 'ADD_QUALITY_ISSUE', payload: { id: `QI-${plan.id}-${resultForm.deviceId}-${nextIndex}`, deviceId: resultForm.deviceId, deviceSN: resultForm.deviceSN, projectId: plan.projectId, sourceStage: '客户验收', issueType: '现场质量问题', severity: '中', description: ngText, status: '待处理', createdAt: nowText(), updatedAt: nowText() } });
    }
    dispatch({ type: 'ADD_OPERATION_LOG', payload: { id: `LOG-${Date.now()}-${plan.id}-${key}`, deliveryPlanId: plan.id, projectId: plan.projectId, deviceId: resultForm.deviceId, operator: state.currentUser, timestamp: nowText(), actionType: `录入${key}结果`, fromStatus: plan.status, toStatus: plan.status, notes: `${resultForm.deviceSN} ${resultForm.result}` } });
  };

  const advance = (nodeLabel, status) => {
    const allPassed = (devices, stageRecords) => devices.length > 0 && devices.every((device) => stageRecords.some((record) => record.deviceId === device.id && ['Pass', '通过'].includes(record.result)));
    if (nodeLabel === '出厂检验' && boundDevices.length === 0) {
      window.alert('请先绑定至少一台设备');
      return;
    }
    if (nodeLabel === '现场安装调试' && !allPassed(boundDevices, records.factoryInspection)) {
      window.alert('所有已绑定设备出厂检验 Pass 后，才能推进到现场安装调试');
      return;
    }
    if (nodeLabel === '客户验收' && status !== '已验收' && !allPassed(factoryPassDevices.length ? factoryPassDevices : boundDevices, records.siteInstall)) {
      window.alert('所有设备安装调试 Pass 后，才能推进到客户验收');
      return;
    }
    if (status === '已验收' && !allPassed(sitePassDevices.length ? sitePassDevices : boundDevices, records.customerAccept)) {
      window.alert('所有设备客户验收 Pass 后，才能完成交付计划');
      return;
    }
    dispatch({ type: 'UPDATE_DELIVERY_PLAN', payload: { id: plan.id, currentNode: nodeLabel, status: status || plan.status, updatedAt: nowText() } });
    dispatch({ type: 'ADD_OPERATION_LOG', payload: { id: `LOG-${Date.now()}-${plan.id}`, deliveryPlanId: plan.id, projectId: plan.projectId, operator: state.currentUser, timestamp: nowText(), actionType: '推进交付节点', fromStatus: plan.status, toStatus: status || plan.status, notes: `推进到${nodeLabel}` } });
  };

  const planStatus = deliveryPlanStatus(plan);

  return (
    <div className="p-6">
      <div className="flex items-start gap-4 mb-6">
        <button onClick={() => navigate('/projects?tab=delivery')} className="text-gray-400 hover:text-gray-600 mt-1 text-sm">← 返回</button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-900">{plan.name}</h1>
            <StatusBadge status={planStatus} />
            <StatusBadge status={plan.currentNode || NODES.find((node) => node.key === activeNode)?.label} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
            <span>交付计划ID：<span className="font-mono">{plan.id}</span></span>
            <span>交付批次：{plan.batchNo || plan.name}</span>
            {project && <span>所属项目：<Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline">{project.name}</Link></span>}
            <span>负责人：{plan.owner || project?.manager || '—'}</span>
            <span>计划交付：{plan.targetCount || 0} 台</span>
            <span>已绑定：{boundDevices.length} 台</span>
            <span>计划出厂：{plan.factoryDate || plan.dueDate || '—'}</span>
            <span>计划现场安装调试：{plan.siteInstallDate || '—'}</span>
            <span>计划验收：{plan.acceptanceDate || plan.dueDate || '—'}</span>
            <span>ERP销售出库单号：{plan.erpOutboundNo || '—'}</span>
            <span>ERP验收单号：{plan.erpAcceptanceNo || '—'}</span>
          </div>
        </div>
      </div>

      <FlowStepper activeNode={activeNode} onChange={setActiveNode} counts={counts} />

      {activeNode === 'binding' && (
        <BindingNode
          plan={plan}
          boundDevices={boundDevices}
          eligibleDevices={eligibleDevices}
          locations={projectLocations}
          deviceTypes={state.deviceTypes}
          openSelector={() => setModal('selectDevices')}
          confirmBinding={() => { advance('出厂检验', '交付中'); setAction({ name: '确认绑定完成' }); }}
          onStash={() => setAction({ name: '暂存绑定结果' })}
          openAction={(name, device) => setAction({ name, device })}
        />
      )}
      {activeNode === 'factoryInspection' && (
        <FactoryNode
          devices={boundDevices}
          records={records.factoryInspection}
          locations={projectLocations}
          deviceTypes={state.deviceTypes}
          onAction={() => setModal('factoryResult')}
          onConfirmOut={() => setAction({ name: '确认出厂' })}
          onAdvance={() => advance('现场安装调试', '交付中')}
          openAction={(name, device) => setAction({ name, device })}
        />
      )}
      {activeNode === 'siteInstall' && (
        <SiteNode
          devices={factoryPassDevices.length ? factoryPassDevices : boundDevices}
          records={records.siteInstall}
          locations={projectLocations}
          onAction={() => setModal('siteResult')}
          onAdvance={() => advance('客户验收', '交付中')}
          openAction={(name, device) => setAction({ name, device })}
        />
      )}
      {activeNode === 'customerAccept' && (
        <AcceptNode
          devices={sitePassDevices.length ? sitePassDevices : boundDevices}
          records={records.customerAccept}
          locations={projectLocations}
          onAction={() => setModal('acceptResult')}
          onAdvance={() => advance('客户验收', '已验收')}
          openAction={(name, device) => setAction({ name, device })}
        />
      )}

      <DeviceSelectModal
        isOpen={modal === 'selectDevices'}
        onClose={() => setModal(null)}
        eligibleDevices={eligibleDevices}
        locations={projectLocations}
        deviceTypes={state.deviceTypes}
        onConfirm={bindDevices}
      />
      <ResultModal
        isOpen={modal === 'factoryResult'}
        onClose={() => setModal(null)}
        title="录入出厂检验结果"
        variant="factory"
        devices={boundDevices}
        locations={projectLocations}
        deviceTypes={state.deviceTypes}
        onSave={(form) => saveStageResult('factoryInspection', form)}
      />
      <ResultModal
        isOpen={modal === 'siteResult'}
        onClose={() => setModal(null)}
        title="录入安装调试结果"
        variant="site"
        devices={factoryPassDevices.length ? factoryPassDevices : boundDevices}
        locations={projectLocations}
        deviceTypes={state.deviceTypes}
        onSave={(form) => saveStageResult('siteInstall', form)}
      />
      <ResultModal
        isOpen={modal === 'acceptResult'}
        onClose={() => setModal(null)}
        title="录入客户验收结果"
        variant="accept"
        devices={sitePassDevices.length ? sitePassDevices : boundDevices}
        locations={projectLocations}
        deviceTypes={state.deviceTypes}
        onSave={(form) => saveStageResult('customerAccept', form)}
      />
      <DeliveryActionModal
        isOpen={!!action}
        onClose={() => setAction(null)}
        action={action}
        plan={plan}
        boundDevices={boundDevices}
        records={records}
        locations={projectLocations}
        state={state}
        dispatch={dispatch}
      />
    </div>
  );
}
