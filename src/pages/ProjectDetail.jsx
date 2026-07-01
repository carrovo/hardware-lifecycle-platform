import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import Modal from '../components/Modal';
import OperationLog from '../components/OperationLog';
import StatusBadge from '../components/StatusBadge';
import { isPass, projectStatus, productionPlanStatus, deliveryPlanStatus } from '../utils/status';

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

function ProgressCard({ title, done, total, color }) {
  const pct = total > 0 ? Math.min(Math.round((done / total) * 100), 100) : 0;
  return (
    <div className="bg-white rounded shadow-sm p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{title}</span>
        <span className="text-sm font-semibold text-gray-800">{done}/{total || 0}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-gray-400 mt-2">{pct}%</div>
    </div>
  );
}

function ProjectFormModal({ isOpen, onClose, project, onSave }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    client: project?.client || '',
    manager: project?.manager || '',
    contactPerson: project?.contactPerson || '',
    contactPhone: project?.contactPhone || '',
    targetCount: project?.targetCount || 1,
    erpPurchaseOrderNo: project?.erpPurchaseOrderNo || '',
    background: project?.background || '',
    notes: project?.notes || '',
  });

  if (!project) return null;

  const update = (key, value) => setForm({ ...form, [key]: value });
  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, targetCount: Number(form.targetCount || 1) });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="编辑项目" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">项目名称 *</label><input className={INPUT} required value={form.name} onChange={(e) => update('name', e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">目标设备数 *</label><input className={INPUT} type="number" min="1" required value={form.targetCount} onChange={(e) => update('targetCount', e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">客户</label><input className={INPUT} value={form.client} onChange={(e) => update('client', e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">负责人</label><input className={INPUT} value={form.manager} onChange={(e) => update('manager', e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">联系人</label><input className={INPUT} value={form.contactPerson} onChange={(e) => update('contactPerson', e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label><input className={INPUT} value={form.contactPhone} onChange={(e) => update('contactPhone', e.target.value)} /></div>
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">ERP项目/订单号</label><input className={INPUT} value={form.erpPurchaseOrderNo} onChange={(e) => update('erpPurchaseOrderNo', e.target.value)} /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">项目背景</label><textarea className={INPUT} rows={3} value={form.background} onChange={(e) => update('background', e.target.value)} /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">备注</label><textarea className={INPUT} rows={2} value={form.notes} onChange={(e) => update('notes', e.target.value)} /></div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={BTN_GHOST}>取消</button>
          <button type="submit" className={BTN_PRIMARY}>保存</button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmModal({ isOpen, onClose, title, text, onConfirm, danger = false }) {
  const [reason, setReason] = useState('');
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-gray-700">{text}</p>
        <textarea className={INPUT} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="填写原因或备注" />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={BTN_GHOST}>取消</button>
          <button
            onClick={() => { onConfirm(reason); setReason(''); onClose(); }}
            className={`px-3 py-1.5 text-sm text-white rounded ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-800'}`}
          >
            确认
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CreatePlanModal({ isOpen, onClose, type, project, onSave }) {
  const [form, setForm] = useState({
    name: project ? `${project.name}${type === 'production' ? '生产计划' : '交付计划'}` : '',
    targetCount: project?.targetCount || 1,
    owner: project?.manager || '',
    date: '',
    erpNo: '',
  });
  if (!project) return null;
  const label = type === 'production' ? '生产计划' : '交付计划';
  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, targetCount: Number(form.targetCount || 1) });
    onClose();
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`创建${label}`} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{label}名称 *</label><input className={INPUT} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">计划数量 *</label><input className={INPUT} type="number" min="1" required value={form.targetCount} onChange={(e) => setForm({ ...form, targetCount: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">负责人</label><input className={INPUT} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{type === 'production' ? '计划完成日期' : '计划客户验收时间'}</label><input className={INPUT} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">ERP单号</label><input className={INPUT} value={form.erpNo} onChange={(e) => setForm({ ...form, erpNo: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={BTN_GHOST}>取消</button>
          <button type="submit" className={BTN_PRIMARY}>保存</button>
        </div>
      </form>
    </Modal>
  );
}

function BindDevicesModal({ isOpen, onClose, devices, deviceTypes, onConfirm }) {
  const [selected, setSelected] = useState(new Set());
  const getTypeName = (id) => deviceTypes.find((d) => d.id === id)?.name || id;
  const toggle = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="绑定设备" size="lg">
      <div className="space-y-4">
        <div className="text-sm text-gray-500">当前仅展示已入库、待分配项目且未冻结的可绑定设备。</div>
        <div className="border border-gray-200 rounded overflow-hidden max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 w-10" />
                {['设备SN', '整机类型', '当前状态', '装配时间'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {devices.map((device) => (
                <tr key={device.id} onClick={() => toggle(device.id)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-3 py-2"><input type="checkbox" checked={selected.has(device.id)} onChange={() => toggle(device.id)} onClick={(e) => e.stopPropagation()} /></td>
                  <td className="px-3 py-2 font-mono text-xs font-medium">{device.sn}</td>
                  <td className="px-3 py-2 text-gray-600">{getTypeName(device.deviceTypeId)}</td>
                  <td className="px-3 py-2"><StatusBadge status={device.status} /></td>
                  <td className="px-3 py-2 text-xs text-gray-400">{device.assemblyTime || device.updatedAt}</td>
                </tr>
              ))}
              {devices.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">暂无可绑定设备</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={BTN_GHOST}>取消</button>
          <button onClick={() => { onConfirm([...selected]); setSelected(new Set()); onClose(); }} disabled={selected.size === 0} className={`${BTN_PRIMARY} disabled:opacity-40`}>确认绑定（{selected.size}）</button>
        </div>
      </div>
    </Modal>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const [modal, setModal] = useState(null);

  const {
    projects, workflowProductionPlans = [], deliveryPlans = [],
    devices = [], deviceTypes = [], locations = [], qualityIssues = [],
    productionWorkOrders = [], deliveryWorkOrders = [], operationLogs = [],
  } = state;

  // 生产计划只取流程型计划 (WPP-*)；PLAN-* 为日产能数据，不在项目详情的生产计划列表里展示。
  const allProductionPlans = workflowProductionPlans;
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return <div className="p-6 text-gray-400">项目不存在</div>;
  }

  const status = projectStatus(project, allProductionPlans, deliveryPlans);
  const projProductionPlans = allProductionPlans.filter((p) => p.projectId === id);
  const projDeliveryPlans = deliveryPlans.filter((p) => p.projectId === id);
  const projDevices = devices.filter((d) => d.projectId === id);
  const projLocations = locations.filter((l) => l.projectId === id);
  const projIssues = qualityIssues.filter((q) => q.projectId === id);
  const projWorkOrders = [...productionWorkOrders, ...deliveryWorkOrders].filter((w) => {
    if (w.projectId === id) return true;
    return projDevices.some((d) => d.id === w.deviceId);
  });
  const projLogs = operationLogs.filter((log) => log.projectId === id || projDevices.some((d) => d.id === log.deviceId));

  const producedCount = devices.filter((device) => {
    const plan = projProductionPlans.find((p) => p.id === device.productionPlanId);
    return plan && ['已入库', '待分配项目', '已分配项目', '在线运营', '出厂检验中', '现场安装调试中', '客户验收中'].includes(device.status);
  }).length;
  const acceptedCount = projDeliveryPlans.reduce((sum, plan) => sum + (plan.records?.customerAccept || []).filter(isPass).length, 0);
  const pendingIssues = projIssues.filter((q) => q.status !== '已关闭').length + projWorkOrders.filter((w) => !['已关闭', '已作废'].includes(w.status)).length;

  const availableDevices = devices.filter((d) =>
    ['已入库', '待分配项目'].includes(d.status)
    && !d.projectId
    && !d.frozen
  );

  const writeLog = (actionType, notes, fromStatus = '', toStatus = '') => {
    dispatch({
      type: 'ADD_OPERATION_LOG',
      payload: {
        id: `LOG-${Date.now()}-${id}`,
        projectId: id,
        operator: state.currentUser,
        timestamp: nowText(),
        actionType,
        fromStatus,
        toStatus,
        notes,
      },
    });
  };

  const updateProject = (payload) => dispatch({ type: 'UPDATE_PROJECT', payload: { id, ...payload, updatedAt: nowText() } });

  let topActions = [
    { label: '编辑', modal: 'edit', cls: BTN_GHOST },
    { label: '创建生产计划', modal: 'production', cls: BTN_GHOST },
    { label: '创建交付计划', modal: 'delivery', cls: BTN_GHOST },
    { label: '绑定设备', modal: 'bind', cls: BTN_PRIMARY },
    { label: '查看日志', modal: 'logs', cls: BTN_GHOST },
  ];
  if (status === '已作废' || status === '已关闭') {
    topActions = [{ label: '查看日志', modal: 'logs', cls: BTN_GHOST }];
  } else if (status === '未开始') {
    topActions = [
      { label: '编辑', modal: 'edit', cls: BTN_GHOST },
      { label: '创建生产计划', modal: 'production', cls: BTN_PRIMARY },
      { label: '作废', modal: 'void', cls: 'px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50' },
    ];
  } else if (status === '已交付') {
    topActions = [
      { label: '创建交付计划', modal: 'delivery', cls: BTN_GHOST },
      { label: '关闭项目', modal: 'close', cls: BTN_PRIMARY },
      { label: '查看日志', modal: 'logs', cls: BTN_GHOST },
    ];
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/projects" className="hover:text-slate-700 hover:underline">项目中心</Link>
            <span>›</span>
            <span className="text-gray-800 font-medium">{project.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            <StatusBadge status={status} />
            <span className={`text-xs px-2 py-0.5 rounded border ${project.erpPurchaseOrderNo ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
              {project.erpPurchaseOrderNo ? '已关联ERP' : '未关联ERP'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {topActions.map((action) => (
            <button key={action.label} onClick={() => setModal(action.modal)} className={action.cls}>{action.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <ProgressCard title="设备进度" done={Math.max(producedCount, projDevices.length)} total={project.targetCount} color="bg-blue-500" />
        <ProgressCard title="交付进度" done={acceptedCount} total={project.targetCount} color="bg-emerald-500" />
        <ProgressCard title="生产计划" done={projProductionPlans.length} total={Math.max(projProductionPlans.length, 1)} color="bg-indigo-500" />
        <ProgressCard title="待处理问题/工单" done={pendingIssues} total={Math.max(pendingIssues, 1)} color={pendingIssues > 0 ? 'bg-red-500' : 'bg-green-500'} />
      </div>

      <Section title="项目基础信息">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-500">项目ID：</span><span className="font-mono text-gray-700">{project.id}</span></div>
          <div><span className="text-gray-500">客户：</span><span className="text-gray-800">{project.client || '—'}</span></div>
          <div><span className="text-gray-500">负责人：</span><span className="text-gray-800">{project.manager || '—'}</span></div>
          <div><span className="text-gray-500">联系人：</span><span className="text-gray-800">{project.contactPerson || '—'}</span></div>
          <div><span className="text-gray-500">联系电话：</span><span className="text-gray-800">{project.contactPhone || '—'}</span></div>
          <div><span className="text-gray-500">创建时间：</span><span className="text-gray-500">{project.createdAt || '—'}</span></div>
          <div className="col-span-3"><span className="text-gray-500">ERP项目/订单号：</span><span className="font-mono text-gray-700">{project.erpPurchaseOrderNo || '—'}</span></div>
          <div className="col-span-3"><span className="text-gray-500">项目背景：</span><span className="text-gray-700">{project.background || '—'}</span></div>
          <div className="col-span-3"><span className="text-gray-500">备注：</span><span className="text-gray-700">{project.notes || '—'}</span></div>
        </div>
      </Section>

      <div className="grid grid-cols-2 gap-6">
        <Section title="生产计划列表摘要" action={<Link to="/projects?tab=production" className="text-xs text-blue-600 hover:underline">查看全部</Link>}>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500">{['计划ID', '计划名称', '状态', '当前节点', '完成'].map((h) => <th key={h} className="py-2">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {projProductionPlans.slice(0, 5).map((plan) => {
                const planDevices = devices.filter((d) => d.productionPlanId === plan.id);
                const done = planDevices.filter((d) => ['已入库', '待分配项目', '已分配项目', '在线运营'].includes(d.status)).length;
                return (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="py-2 font-mono text-xs"><Link to={`/production-plans/${plan.id}`} className="text-blue-600 hover:underline">{plan.id}</Link></td>
                    <td className="py-2 text-gray-700">{plan.name}</td>
                    <td className="py-2"><StatusBadge status={productionPlanStatus(plan)} /></td>
                    <td className="py-2"><StatusBadge status={plan.currentNode || '来料准备'} /></td>
                    <td className="py-2 text-gray-600">{done}/{plan.targetCount || 0}</td>
                  </tr>
                );
              })}
              {projProductionPlans.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">暂无生产计划</td></tr>}
            </tbody>
          </table>
        </Section>

        <Section title="交付计划列表摘要" action={<Link to="/projects?tab=delivery" className="text-xs text-blue-600 hover:underline">查看全部</Link>}>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500">{['计划ID', '计划名称', '状态', '当前节点', '验收'].map((h) => <th key={h} className="py-2">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {projDeliveryPlans.slice(0, 5).map((plan) => {
                const accepted = (plan.records?.customerAccept || []).filter(isPass).length;
                return (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="py-2 font-mono text-xs"><Link to={`/delivery-plans/${plan.id}`} className="text-blue-600 hover:underline">{plan.id}</Link></td>
                    <td className="py-2 text-gray-700">{plan.name}</td>
                    <td className="py-2"><StatusBadge status={deliveryPlanStatus(plan)} /></td>
                    <td className="py-2"><StatusBadge status={plan.currentNode || '绑定设备'} /></td>
                    <td className="py-2 text-gray-600">{accepted}/{plan.targetCount || 0}</td>
                  </tr>
                );
              })}
              {projDeliveryPlans.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">暂无交付计划</td></tr>}
            </tbody>
          </table>
        </Section>
      </div>

      <Section title={`项目设备（${projDevices.length}台）`} action={status !== '已作废' && canDo('add_device_allocation') ? <button onClick={() => setModal('bind')} className={BTN_GHOST}>绑定设备</button> : null}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{['设备SN', '整机类型', '当前状态', '所属点位', '最近更新'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {projDevices.map((device) => {
              const typeName = deviceTypes.find((t) => t.id === device.deviceTypeId)?.name || device.deviceTypeId;
              const location = locations.find((l) => l.id === device.locationId);
              return (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs"><Link to={`/devices/${device.id}`} className="text-blue-600 hover:underline">{device.sn}</Link></td>
                  <td className="px-3 py-2 text-gray-600">{typeName}</td>
                  <td className="px-3 py-2"><StatusBadge status={device.status} /></td>
                  <td className="px-3 py-2 text-gray-600">{location?.name || '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-400">{device.updatedAt || '—'}</td>
                </tr>
              );
            })}
            {projDevices.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">暂无绑定设备</td></tr>}
          </tbody>
        </table>
      </Section>

      <div className="grid grid-cols-2 gap-6">
        <Section title={`项目点位（${projLocations.length}个）`}>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500">{['点位名称', '地址', '设备数'].map((h) => <th key={h} className="py-2">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {projLocations.map((loc) => <tr key={loc.id}><td className="py-2 text-gray-800">{loc.name}</td><td className="py-2 text-gray-500">{loc.address || '—'}</td><td className="py-2 text-gray-600">{loc.deviceIds?.length || 0}</td></tr>)}
              {projLocations.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-gray-400">暂无点位</td></tr>}
            </tbody>
          </table>
        </Section>

        <Section title="关联问题与工单">
          <div className="space-y-3">
            {[...projIssues.slice(0, 3), ...projWorkOrders.slice(0, 3)].slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-center gap-3 text-sm border-b border-gray-100 pb-2 last:border-0">
                <span className="font-mono text-xs text-gray-500 w-24">{item.id}</span>
                <span className="text-gray-700 flex-1 truncate">{item.issueDesc || item.description}</span>
                <StatusBadge status={item.status} />
              </div>
            ))}
            {projIssues.length + projWorkOrders.length === 0 && <div className="py-8 text-center text-gray-400 text-sm">暂无关联问题或工单</div>}
          </div>
        </Section>
      </div>

      <Section title="操作日志摘要" action={<button onClick={() => setModal('logs')} className={BTN_GHOST}>查看全部</button>}>
        <OperationLog logs={projLogs.slice(0, 5)} />
      </Section>

      <ProjectFormModal
        isOpen={modal === 'edit'}
        onClose={() => setModal(null)}
        project={project}
        onSave={(form) => {
          updateProject(form);
          writeLog('编辑项目', '更新项目基础信息');
        }}
      />

      <CreatePlanModal
        isOpen={modal === 'production'}
        onClose={() => setModal(null)}
        type="production"
        project={project}
        onSave={(form) => {
          const plan = { id: `PP-${Date.now().toString().slice(-6)}`, projectId: id, name: form.name, targetCount: form.targetCount, owner: form.owner, endDate: form.date, erpProductionOrderNo: form.erpNo, status: '生产中', currentNode: '来料准备', createdAt: nowText() };
          dispatch({ type: 'ADD_PRODUCTION_PLAN', payload: plan });
          updateProject({ status: '进行中' });
          writeLog('创建生产计划', `创建 ${plan.name}`, status, '进行中');
        }}
      />

      <CreatePlanModal
        isOpen={modal === 'delivery'}
        onClose={() => setModal(null)}
        type="delivery"
        project={project}
        onSave={(form) => {
          const plan = { id: `DP-${Date.now().toString().slice(-6)}`, projectId: id, name: form.name, targetCount: form.targetCount, owner: form.owner, dueDate: form.date, acceptanceDate: form.date, status: '交付中', currentNode: '绑定设备', records: { binding: [], factoryInspection: [], siteInstall: [], customerAccept: [] } };
          dispatch({ type: 'ADD_DELIVERY_PLAN', payload: plan });
          writeLog('创建交付计划', `创建 ${plan.name}`);
        }}
      />

      <BindDevicesModal
        isOpen={modal === 'bind'}
        onClose={() => setModal(null)}
        devices={availableDevices}
        deviceTypes={deviceTypes}
        onConfirm={(ids) => {
          const t = nowText();
          ids.forEach((deviceId) => {
            dispatch({ type: 'UPDATE_DEVICE', payload: { id: deviceId, projectId: id, status: '已分配项目', updatedAt: t } });
            dispatch({ type: 'ADD_DEVICE_ALLOCATION', payload: { id: `ALLOC-${Date.now()}-${deviceId}`, deviceId, projectId: id, allocatedBy: state.currentUser, allocatedAt: t, type: '分配', notes: '项目详情绑定设备' } });
          });
          writeLog('绑定设备', `绑定 ${ids.length} 台设备`);
        }}
      />

      <ConfirmModal
        isOpen={modal === 'void'}
        onClose={() => setModal(null)}
        title="作废项目"
        danger
        text={`确认作废项目「${project.name}」？`}
        onConfirm={(reason) => {
          updateProject({ status: '已作废', voided: true, voidReason: reason });
          writeLog('作废项目', reason || '项目作废', status, '已作废');
        }}
      />

      <ConfirmModal
        isOpen={modal === 'close'}
        onClose={() => setModal(null)}
        title="关闭项目"
        text={`确认关闭项目「${project.name}」？`}
        onConfirm={(reason) => {
          updateProject({ status: '已关闭', closeReason: reason, closedAt: nowText() });
          writeLog('关闭项目', reason || '项目关闭', status, '已关闭');
        }}
      />

      <Modal isOpen={modal === 'logs'} onClose={() => setModal(null)} title="操作日志" size="lg">
        <OperationLog logs={projLogs} />
      </Modal>
    </div>
  );
}
