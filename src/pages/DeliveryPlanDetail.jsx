import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
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
              <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${activeNode === node.key ? 'bg-slate-700 text-white' : 'bg-gray-200 text-gray-600'}`}>{index + 1}</span>
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

const DELIVERY_ACTION_FIELDS = {
  确认出厂: ['实际出厂时间', '出厂确认人', 'ERP销售出库单号', '物流方式', '物流单号', '备注'],
  调整点位: ['设备SN', '原预分配点位', '新预分配点位', '调整原因'],
  解绑设备: ['设备SN', '当前状态', '解绑原因', '二次确认'],
};

function ActionPlaceholderModal({ isOpen, onClose, title }) {
  const fields = DELIVERY_ACTION_FIELDS[title];
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || '交付动作'} size="lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">已保留「{title || '交付动作'}」动作入口，后续可接入真实审批、工单和状态流转。</p>
        {fields && (
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f} className={f.length > 4 ? 'col-span-2' : ''}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f}</label>
                <input disabled className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-400" placeholder={`（原型占位）${f}`} />
              </div>
            ))}
          </div>
        )}
        <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700">本阶段重点是可演示的原型结构与规则表达。</div>
        <div className="flex justify-end"><button onClick={onClose} className={BTN_PRIMARY}>知道了</button></div>
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
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0"><tr><th className="px-3 py-2 w-10" />{['设备SN', '整机类型', '状态', '当前点位'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {eligibleDevices.map((device) => (
                <tr key={device.id} onClick={() => toggle(device.id)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-3 py-2"><input type="checkbox" checked={selected.has(device.id)} onChange={() => toggle(device.id)} onClick={(e) => e.stopPropagation()} /></td>
                  <td className="px-3 py-2 font-mono text-xs font-medium">{device.sn}</td>
                  <td className="px-3 py-2">{getTypeName(device.deviceTypeId)}</td>
                  <td className="px-3 py-2"><StatusBadge status={device.status} /></td>
                  <td className="px-3 py-2 text-gray-500">{locations.find((location) => location.id === device.locationId)?.name || '—'}</td>
                </tr>
              ))}
              {eligibleDevices.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">暂无可交付设备</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={BTN_GHOST}>取消</button>
          <button disabled={selected.size === 0} className={`${BTN_PRIMARY} disabled:opacity-40`} onClick={() => { onConfirm([...selected], locationId); setSelected(new Set()); onClose(); }}>确认绑定（{selected.size}）</button>
        </div>
      </div>
    </Modal>
  );
}

function ResultModal({ isOpen, onClose, title, devices, defaultResult = 'Pass', requireLocation = false, locations, onSave }) {
  const [form, setForm] = useState({ deviceId: '', result: defaultResult, operator: '', locationId: '', changeReason: '', notes: '' });
  const selectedDevice = devices.find((device) => device.id === form.deviceId);
  const preLocation = selectedDevice?.preAssignedLocationId || selectedDevice?.locationId || '';
  const locationChanged = requireLocation && form.locationId && preLocation && form.locationId !== preLocation;

  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, deviceSN: selectedDevice?.sn || '', preLocationId: preLocation });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">设备</label><select className={INPUT} required value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })}><option value="">-- 选择设备 --</option>{devices.map((device) => <option key={device.id} value={device.id}>{device.sn}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">结果</label><select className={INPUT} value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })}><option>Pass</option><option>NG</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">操作人</label><input className={INPUT} value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} /></div>
          {requireLocation && <div><label className="block text-sm font-medium text-gray-700 mb-1">现场确认点位 *</label><select className={INPUT} required value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}><option value="">-- 选择点位 --</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></div>}
          {locationChanged && <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">点位变更原因 *</label><textarea className={INPUT} required rows={2} value={form.changeReason} onChange={(e) => setForm({ ...form, changeReason: e.target.value })} /></div>}
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">备注 / NG原因</label><textarea className={INPUT} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
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

function BindingNode({ plan, boundDevices, eligibleDevices, locations, deviceTypes, openSelector, confirmBinding, openAction }) {
  return (
    <div className="space-y-5">
      <MetricCards items={[
        { label: '计划交付', value: plan.targetCount || 0, color: 'border-slate-500' },
        { label: '已绑定', value: boundDevices.length, color: 'border-blue-500' },
        { label: '未绑定', value: Math.max((plan.targetCount || 0) - boundDevices.length, 0), color: 'border-amber-500' },
        { label: '可选设备', value: eligibleDevices.length, color: 'border-emerald-500' },
        { label: '点位数', value: locations.length, color: 'border-indigo-500' },
      ]} />
      <Section title="绑定概览" action={<div className="flex gap-2"><button className={BTN_GHOST} onClick={openSelector}>选择可交付设备</button><button className={BTN_PRIMARY} onClick={confirmBinding}>确认绑定完成</button></div>}>
        <div className="text-sm text-gray-600">只有属于当前项目、已入库/待分配项目、未被其他未完成交付计划绑定、未作废冻结的设备可选。预分配点位是计划安装位置，现场安装调试时需要再次确认现场实际点位。</div>
      </Section>
      <Section title="已绑定设备列表">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{['设备SN', '设备类型', '来源生产计划', '当前状态', '预分配点位', '绑定状态', '操作'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {boundDevices.map((device) => {
              const type = deviceTypes.find((item) => item.id === device.deviceTypeId);
              const location = locations.find((item) => item.id === device.preAssignedLocationId || item.id === device.locationId);
              return (
                <tr key={device.id}>
                  <td className="px-3 py-2 font-mono text-xs"><Link to={`/devices/${device.id}`} className="text-blue-600 hover:underline">{device.sn}</Link></td>
                  <td className="px-3 py-2">{type?.name || device.deviceTypeId}</td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-500">{device.productionPlanId || '—'}</td>
                  <td className="px-3 py-2"><StatusBadge status={bindingDeviceStatus(device, true)} /></td>
                  <td className="px-3 py-2">{location?.name || '—'}</td>
                  <td className="px-3 py-2"><StatusBadge status="已绑定" /></td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button className="text-xs text-slate-600 hover:underline" onClick={() => openAction('调整点位')}>调整点位</button>
                      <button className="text-xs text-red-500 hover:underline" onClick={() => openAction('解绑设备')}>解绑</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {boundDevices.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">暂无已绑定设备</td></tr>}
          </tbody>
        </table>
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

function FactoryNode({ devices, records, locations, deviceTypes, onAction, onConfirmOut, onAdvance }) {
  return (
    <div className="space-y-5">
      <StageMetrics label0="待检设备" devices={devices} records={records} />
      <Section title="出厂检验概览" action={<div className="flex gap-2"><button className={BTN_GHOST} onClick={onAction}>录入出厂检验结果</button><button className={BTN_GHOST} onClick={onConfirmOut}>确认出厂</button><button className={BTN_PRIMARY} onClick={onAdvance}>推进到现场安装调试</button></div>}>
        <div className="text-sm text-gray-600">Pass 后才允许确认出厂；NG 时生成交付工单。所有设备出厂检验 Pass 且确认出厂后，才允许推进到现场安装调试。</div>
      </Section>
      <Section title="出厂检验设备列表">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{['设备SN', '设备类型', '预分配点位', '检验结果', '出厂状态', '操作'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {devices.map((device) => {
              const record = latestFor(records, device.id);
              const type = deviceTypes.find((item) => item.id === device.deviceTypeId);
              return (
                <tr key={device.id}>
                  <td className="px-3 py-2 font-mono text-xs">{device.sn}</td>
                  <td className="px-3 py-2">{type?.name || device.deviceTypeId}</td>
                  <td className="px-3 py-2">{locName(locations, device.preAssignedLocationId, device.locationId)}</td>
                  <td className="px-3 py-2"><StatusBadge status={resultLabel(record, '待检验')} /></td>
                  <td className="px-3 py-2"><StatusBadge status={factoryStageStatus(record)} /></td>
                  <td className="px-3 py-2"><button className="text-xs text-slate-600 hover:underline" onClick={onAction}>录入结果</button></td>
                </tr>
              );
            })}
            {devices.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">暂无设备</td></tr>}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function SiteNode({ devices, records, locations, onAction, onAdvance }) {
  return (
    <div className="space-y-5">
      <StageMetrics label0="待安装调试设备" devices={devices} records={records} />
      <Section title="现场安装调试概览" action={<div className="flex gap-2"><button className={BTN_GHOST} onClick={onAction}>录入安装调试结果</button><button className={BTN_PRIMARY} onClick={onAdvance}>推进到客户验收</button></div>}>
        <div className="text-sm text-gray-600">现场确认点位必填；若现场确认点位与预分配点位不一致，需要填写点位变更原因；NG 时生成交付工单。</div>
      </Section>
      <Section title="现场安装调试设备列表">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{['设备SN', '预分配点位', '现场确认点位', '安装调试结果', '当前状态', '操作'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {devices.map((device) => {
              const record = latestFor(records, device.id);
              return (
                <tr key={device.id}>
                  <td className="px-3 py-2 font-mono text-xs">{device.sn}</td>
                  <td className="px-3 py-2">{locName(locations, device.preAssignedLocationId)}</td>
                  <td className="px-3 py-2">{locName(locations, record?.locationId, device.locationId)}</td>
                  <td className="px-3 py-2"><StatusBadge status={resultLabel(record, '待录入')} /></td>
                  <td className="px-3 py-2"><StatusBadge status={siteStageStatus(record)} /></td>
                  <td className="px-3 py-2"><button className="text-xs text-slate-600 hover:underline" onClick={onAction}>录入结果</button></td>
                </tr>
              );
            })}
            {devices.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">暂无设备</td></tr>}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function AcceptNode({ devices, records, locations, onAction, onAdvance }) {
  return (
    <div className="space-y-5">
      <StageMetrics label0="待验收设备" devices={devices} records={records} />
      <Section title="客户验收概览" action={<div className="flex gap-2"><button className={BTN_GHOST} onClick={onAction}>录入客户验收结果</button><button className={BTN_PRIMARY} onClick={onAdvance}>完成交付计划</button></div>}>
        <div className="text-sm text-gray-600">Pass 后设备状态变为在线运营；NG 时生成交付工单，必要时生成质量问题记录。全部设备验收 Pass 后，交付计划状态变为已验收。</div>
      </Section>
      <Section title="客户验收设备列表">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{['设备SN', '现场确认点位', '验收结果', '验收时间', '当前状态', '操作'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {devices.map((device) => {
              const record = latestFor(records, device.id);
              return (
                <tr key={device.id}>
                  <td className="px-3 py-2 font-mono text-xs">{device.sn}</td>
                  <td className="px-3 py-2">{locName(locations, record?.locationId, device.locationId, device.preAssignedLocationId)}</td>
                  <td className="px-3 py-2"><StatusBadge status={resultLabel(record, '待验收')} /></td>
                  <td className="px-3 py-2 text-xs text-gray-500">{record?.time || '—'}</td>
                  <td className="px-3 py-2"><StatusBadge status={acceptStageStatus(record)} /></td>
                  <td className="px-3 py-2"><button className="text-xs text-slate-600 hover:underline" onClick={onAction}>录入结果</button></td>
                </tr>
              );
            })}
            {devices.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">暂无设备</td></tr>}
          </tbody>
        </table>
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
  const [actionName, setActionName] = useState(null);
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
    if (resultForm.result === 'NG') {
      dispatch({ type: 'ADD_DELIVERY_WORK_ORDER', payload: { id: `DWO-${plan.id}-${resultForm.deviceId}-${nextIndex}`, type: 'delivery', deliveryPlanId: plan.id, deviceId: resultForm.deviceId, deviceSN: resultForm.deviceSN, description: resultForm.notes || `${key}节点NG`, severity: '中', status: '待处理', assignedTo: '', createdAt: nowText(), updatedAt: nowText(), processLogs: [] } });
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
          confirmBinding={() => advance('出厂检验', '交付中')}
          openAction={(name) => setActionName(name)}
        />
      )}
      {activeNode === 'factoryInspection' && (
        <FactoryNode
          devices={boundDevices}
          records={records.factoryInspection}
          locations={projectLocations}
          deviceTypes={state.deviceTypes}
          onAction={() => setModal('factoryResult')}
          onConfirmOut={() => setActionName('确认出厂')}
          onAdvance={() => advance('现场安装调试', '交付中')}
        />
      )}
      {activeNode === 'siteInstall' && (
        <SiteNode
          devices={factoryPassDevices.length ? factoryPassDevices : boundDevices}
          records={records.siteInstall}
          locations={projectLocations}
          onAction={() => setModal('siteResult')}
          onAdvance={() => advance('客户验收', '交付中')}
        />
      )}
      {activeNode === 'customerAccept' && (
        <AcceptNode
          devices={sitePassDevices.length ? sitePassDevices : boundDevices}
          records={records.customerAccept}
          locations={projectLocations}
          onAction={() => setModal('acceptResult')}
          onAdvance={() => advance('客户验收', '已验收')}
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
        devices={boundDevices}
        locations={projectLocations}
        onSave={(form) => saveStageResult('factoryInspection', form)}
      />
      <ResultModal
        isOpen={modal === 'siteResult'}
        onClose={() => setModal(null)}
        title="录入安装调试结果"
        devices={factoryPassDevices.length ? factoryPassDevices : boundDevices}
        locations={projectLocations}
        requireLocation
        onSave={(form) => saveStageResult('siteInstall', form)}
      />
      <ResultModal
        isOpen={modal === 'acceptResult'}
        onClose={() => setModal(null)}
        title="录入客户验收结果"
        devices={sitePassDevices.length ? sitePassDevices : boundDevices}
        locations={projectLocations}
        onSave={(form) => saveStageResult('customerAccept', form)}
      />
      <ActionPlaceholderModal isOpen={!!actionName} onClose={() => setActionName(null)} title={actionName} />
    </div>
  );
}
