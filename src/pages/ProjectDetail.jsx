import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import Modal from '../components/Modal';
import OperationLog from '../components/OperationLog';
import StatusBadge from '../components/StatusBadge';
import { Pagination, usePaged } from '../components/Pagination';
import {
  Page, PageHeader, Section, Btn, LinkAction, Chip,
  StatCard, StatGrid, DescList, Table,
} from '../components/ui';
import { isPass, projectStatus, productionPlanStatus, deliveryPlanStatus, deviceLifecycleStatus } from '../utils/status';

// 项目详情：项目概览 / 基本信息 / 点位管理 / 设备列表 / 当前项目生产计划 /
// 当前项目交付计划 / 关联问题·售后记录 / 操作日志。分区卡片分层，复用 ../components/ui。

const PROJECT_TYPES = ['智魔方', '机场', '工业场景', '遥操数采'];
const LOC_OWNERS = ['张三', '李四', '王五', '赵六', '蔡八'];

// 弹窗内沿用的紧凑表单样式（Modal 内部，不影响主页面视觉）。
const INPUT = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500 bg-white';
const BTN_PRIMARY = 'px-3 py-1.5 text-sm bg-slate-700 text-white rounded hover:bg-slate-800';
const BTN_GHOST = 'px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50';

function nowText() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

/* ── 点位关联设备（平台补充记录） ───────────────────────────
 * 按项目点位聚合的现场设备清单，仅项目详情页使用的确定性 mock，
 * 不扩展全局设备台账、不改设备详情、不改售后 mock。
 * 使用通用字段：设备 SN/编号、设备名称、型号/规格；不引入设备类型枚举，不写死具体设备品类。 */
const LOC_DEV_STATUSES = ['在线运营', '现场安装调试中', '维修中', '待交付'];
const LOC_DEV_MODELS = ['M-100', 'M-200', 'S-300', 'S-320'];
const LOC_DEV_ISSUES = ['传感器读数异常', '网络连接不稳定', '现场校准待复核', '电机异响待排查'];

// 稳定哈希：同一点位 id 每次生成相同结果（纯函数，渲染期可安全调用）。
function hashId(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// 依据点位 id 确定性生成 1-3 台关联设备。
function buildLocationDevices(loc) {
  const seed = hashId(loc.id);
  const count = 1 + (seed % 3); // 1..3
  const suffix = ((loc.id.match(/\d+/g) || ['00']).join('').slice(-4) || '0000').padStart(4, '0');
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const s = hashId(`${loc.id}#${i}`);
    const status = LOC_DEV_STATUSES[s % LOC_DEV_STATUSES.length];
    const online = status === '在线运营';
    const openIssues = (s >>> 4) % 3 === 0 ? (s >>> 6) % 2 : 0; // 多数为 0，部分点位设备存在未关闭问题
    const day = 10 + ((s >>> 8) % 18);
    list.push({
      sn: `SN-${suffix}-${String(i + 1).padStart(2, '0')}`,
      name: `${loc.name}-现场设备${i + 1}`,
      model: LOC_DEV_MODELS[s % LOC_DEV_MODELS.length],
      status,
      online,
      lastIssue: openIssues > 0 ? LOC_DEV_ISSUES[s % LOC_DEV_ISSUES.length] : '—',
      openIssues,
      updatedAt: `2026-06-${String(day).padStart(2, '0')} 10:${String(s % 60).padStart(2, '0')}`,
    });
  }
  return list;
}

// 为一组点位构建「点位 -> 关联设备」映射，并确定性兜底保证至少一个点位存在未关闭问题。
function buildLocDeviceMap(locList) {
  const map = {};
  locList.forEach((loc) => { map[loc.id] = buildLocationDevices(loc); });
  const anyOpen = locList.some((loc) => map[loc.id].some((d) => d.openIssues > 0));
  if (!anyOpen && locList.length) {
    const first = map[locList[0].id];
    if (first.length) first[0] = { ...first[0], openIssues: 1, lastIssue: LOC_DEV_ISSUES[0] };
  }
  return map;
}

function erpChip(linked) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${linked ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
      {linked ? '已关联 ERP' : '未关联 ERP'}
    </span>
  );
}

/* ── 弹窗（保留既有交互与数据接线） ─────────────────── */
function ProjectFormModal({ isOpen, onClose, project, onSave }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    projectType: project?.projectType || '',
    client: project?.client || '',
    manager: project?.manager || '',
    contactPerson: project?.contactPerson || '',
    contactPhone: project?.contactPhone || '',
    targetCount: project?.targetCount || 1,
    erpProjectNo: project?.erpProjectNo || project?.erpPurchaseOrderNo || '',
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
          <div><label className="block text-sm font-medium text-gray-700 mb-1">项目类型 / 业务场景</label>
            <select className={INPUT} value={form.projectType} onChange={(e) => update('projectType', e.target.value)}>
              <option value="">-- 请选择 --</option>{PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">目标设备数 *</label><input className={INPUT} type="number" min="1" required value={form.targetCount} onChange={(e) => update('targetCount', e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">客户</label><input className={INPUT} value={form.client} onChange={(e) => update('client', e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">负责人</label><input className={INPUT} value={form.manager} onChange={(e) => update('manager', e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">ERP 项目号</label><input className={INPUT} value={form.erpProjectNo} onChange={(e) => update('erpProjectNo', e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">联系人</label><input className={INPUT} value={form.contactPerson} onChange={(e) => update('contactPerson', e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label><input className={INPUT} value={form.contactPhone} onChange={(e) => update('contactPhone', e.target.value)} /></div>
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

// 点位新增 / 编辑弹窗（点位管理归属项目详情，projectId 固定为当前项目）。
function LocationFormModal({ isOpen, onClose, initial, projectName, onSave }) {
  const [form, setForm] = useState(initial || { name: '', address: '', plannedCount: 1, owner: '', notes: '' });
  const submit = (e) => { e.preventDefault(); onSave({ ...form, plannedCount: Number(form.plannedCount || 0) }); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? '编辑点位' : '新增点位'} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">所属项目</label><input className={`${INPUT} bg-gray-50 text-gray-500`} value={projectName} readOnly /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">点位名称 *</label><input className={INPUT} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">地址 / 描述</label><input className={INPUT} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">计划设备数</label><input type="number" min="0" className={INPUT} value={form.plannedCount} onChange={(e) => setForm({ ...form, plannedCount: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">负责人</label>
            <select className={INPUT} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}>
              <option value="">-- 选择负责人 --</option>{LOC_OWNERS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">备注</label><textarea rows={2} className={INPUT} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={BTN_GHOST}>取消</button>
          <button type="submit" className={BTN_PRIMARY}>保存</button>
        </div>
      </form>
    </Modal>
  );
}

// 点位关联设备清单弹窗（复用现有 Modal + Table，无新路由、不跳转资产管理）。
function LocationDevicesModal({ isOpen, onClose, location, devices }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="点位关联设备" size="xl">
      <div className="space-y-3">
        <p className="text-xs text-gray-500 leading-relaxed">
          {location ? <>点位「<span className="text-gray-700">{location.name}</span>」共 {devices.length} 台关联设备。</> : null}
          {' '}点位关联设备为平台补充记录，用于按现场点位聚合设备，便于售后维护、设备流转与问题追溯。
        </p>
        <Table
          head={['设备 SN / 编号', '设备名称', '型号 / 规格', '当前状态', '在线状态', '最近问题', '未关闭问题数', '最近更新时间', '操作']}
          empty="该点位暂无关联设备"
        >
          {devices.map((d) => (
            <tr key={d.sn} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{d.sn}</td>
              <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{d.name}</td>
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{d.model}</td>
              <td className="px-3 py-2"><StatusBadge status={d.status} /></td>
              <td className="px-3 py-2">{d.online ? <StatusBadge status="在线" /> : <span className="text-gray-300 text-xs">—</span>}</td>
              <td className="px-3 py-2 text-gray-600 text-xs max-w-[200px]"><div className="truncate">{d.lastIssue}</div></td>
              <td className="px-3 py-2">{d.openIssues > 0 ? <span className="text-amber-600 font-medium">{d.openIssues}</span> : <span className="text-gray-400">0</span>}</td>
              <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">{d.updatedAt}</td>
              <td className="px-3 py-2 text-xs whitespace-nowrap">
                {d.openIssues > 0
                  ? <LinkAction to="/after-sales?tab=quality">查看问题</LinkAction>
                  : <span className="text-gray-300">查看问题</span>}
              </td>
            </tr>
          ))}
        </Table>
      </div>
    </Modal>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const [modal, setModal] = useState(null);
  const [locTarget, setLocTarget] = useState(null);

  const {
    projects, workflowProductionPlans = [], deliveryPlans = [],
    devices = [], deviceTypes = [], locations = [], qualityIssues = [],
    productionWorkOrders = [], deliveryWorkOrders = [], operationLogs = [],
  } = state;

  // 生产计划只取流程型计划 (WPP-*)；PLAN-* 为日产能数据，不在项目详情的生产计划列表里展示。
  const allProductionPlans = workflowProductionPlans;
  const project = projects.find((p) => p.id === id);

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

  // 关联问题与工单归一：区分质量问题 / 交付工单 / 生产返修记录。
  const relatedRows = [
    ...projIssues.map((q) => ({ id: q.id, kind: '质量问题', deviceSN: q.deviceSN, stage: q.sourceStage || '在线运营', desc: q.issueDesc, severity: q.severity || '中', status: q.status, target: 'quality' })),
    ...projWorkOrders.map((w) => ({ id: w.id, kind: w.type === 'production' ? '生产返修记录' : w.type === 'delivery' ? '交付工单' : '售后工单', deviceSN: w.deviceSN, stage: w.stage || w.sourceNode || w.ngStation || '—', desc: w.description, severity: w.severity || '中', status: w.status, target: w.type === 'production' ? 'none' : 'orders' })),
  ];

  const prodPaged = usePaged(projProductionPlans, 8);
  const delivPaged = usePaged(projDeliveryPlans, 8);
  const devPaged = usePaged(projDevices, 8);
  const locPaged = usePaged(projLocations, 8);
  const relatedPaged = usePaged(relatedRows, 8);
  const logPaged = usePaged(projLogs, 8);

  if (!project) {
    return <div className="p-6 text-gray-400">项目不存在</div>;
  }

  // 点位关联设备映射（点位维度聚合，表格计数与「查看设备」弹窗共用同一份数据，保证一致）。
  const locDeviceMap = buildLocDeviceMap(projLocations);

  const status = projectStatus(project, allProductionPlans, deliveryPlans);
  const erpLinked = Boolean(project.erpProjectNo || project.erpPurchaseOrderNo);
  const producedCount = devices.filter((device) => {
    const plan = projProductionPlans.find((p) => p.id === device.productionPlanId);
    return plan && ['已入库', '待分配项目', '已分配项目', '在线运营', '出厂检验中', '现场安装调试中', '客户验收中'].includes(device.status);
  }).length;
  const producedDone = project.targetCount ? Math.min(producedCount, project.targetCount) : producedCount;
  const acceptedCount = projDeliveryPlans.reduce((sum, plan) => sum + (plan.records?.customerAccept || []).filter(isPass).length, 0);
  const onlineCount = projDevices.filter((d) => d.status === '在线运营').length;
  const pendingIssues = projIssues.filter((q) => q.status !== '已关闭').length + projWorkOrders.filter((w) => !['已关闭', '已作废'].includes(w.status)).length;

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

  const saveLocation = (form) => {
    const base = { name: form.name, address: form.address, owner: form.owner, notes: form.notes, plannedCount: Number(form.plannedCount || 0), updatedAt: nowText() };
    if (locTarget && locTarget !== 'new') {
      dispatch({ type: 'UPDATE_LOCATION', payload: { id: locTarget.id, ...base } });
      writeLog('编辑点位', `更新点位 ${form.name}`);
    } else {
      dispatch({ type: 'ADD_LOCATION', payload: { id: `LOC-${Date.now().toString().slice(-6)}`, projectId: id, deviceIds: [], deliveryPlanIds: [], ...base } });
      writeLog('新增点位', `新增点位 ${form.name}`);
    }
    setModal(null);
    setLocTarget(null);
  };
  const deleteLocation = (loc) => {
    dispatch({ type: 'DELETE_LOCATION', payload: loc.id });
    writeLog('删除点位', `删除点位 ${loc.name}`);
  };

  const canManageLoc = canDo('manage_locations');

  return (
    <Page>
      <PageHeader
        breadcrumb={<Link to="/projects" className="ui-link text-[13px]">‹ 返回项目列表</Link>}
        title={project.name}
        description={(
          <span className="inline-flex flex-wrap items-center gap-2">
            {project.projectType ? <Chip>{project.projectType}</Chip> : null}
            <StatusBadge status={status} />
            {erpChip(erpLinked)}
          </span>
        )}
        actions={(
          <>
            <Btn variant="secondary" onClick={() => setModal('edit')}>编辑平台补充信息</Btn>
            <Btn variant="secondary" as="link" to="/erp-center?tab=overview">查看关联 ERP 单据</Btn>
            <Btn variant="secondary" onClick={() => setModal('logs')}>查看日志</Btn>
          </>
        )}
      />

      {/* 项目概览 */}
      <StatGrid cols={6}>
        <StatCard label="目标设备数" value={project.targetCount ?? '—'} />
        <StatCard label="已生产入库" value={producedDone} />
        <StatCard label="已交付验收" value={acceptedCount} tone="success" />
        <StatCard label="在线运营" value={onlineCount} tone={onlineCount ? 'success' : 'default'} />
        <StatCard label="生产计划数" value={projProductionPlans.length} />
        <StatCard label="未关闭问题 / 工单" value={pendingIssues} tone={pendingIssues ? 'warning' : 'default'} />
      </StatGrid>

      {/* 基本信息 */}
      <Section title="基本信息">
        <DescList
          cols={3}
          items={[
            ['项目ID', <span className="font-mono">{project.id}</span>],
            ['项目类型 / 业务场景', project.projectType],
            ['客户', project.client],
            ['负责人', project.manager],
            ['联系人', project.contactPerson],
            ['联系电话', project.contactPhone],
            ['ERP 项目号', <span className="font-mono">{project.erpProjectNo ?? project.erpPurchaseOrderNo ?? '—'}</span>],
            ['创建时间', project.createdAt],
            ['更新时间', project.updatedAt],
            ['项目背景', project.background],
            ['备注', project.notes],
          ]}
        />
      </Section>

      {/* 点位管理 */}
      <Section
        title={`点位管理（${projLocations.length}）`}
        subtitle="该项目下点位主数据，支撑交付预分配、现场安装与在线运营点位归属。"
        right={canManageLoc && <Btn variant="primary" size="sm" onClick={() => { setLocTarget('new'); setModal('locationForm'); }}>新增点位</Btn>}
        bodyClassName="p-0"
      >
        <p className="px-4 pt-3 text-xs text-gray-500 leading-relaxed">
          点位关联设备用于按项目点位聚合现场设备，方便后续售后维护、设备流转和问题追溯。
        </p>
        <Table
          head={['点位名称', '地址', '计划数', '负责人', '关联交付计划', '关联设备数', '在线设备数', '未关闭问题数', '更新时间', '操作']}
          empty="暂无点位"
          footer={<Pagination page={locPaged.page} total={locPaged.total} totalPages={locPaged.totalPages} onChange={locPaged.setPage} />}
        >
          {locPaged.pageItems.map((loc) => {
            const locDevs = locDeviceMap[loc.id] || [];
            const linkedCount = locDevs.length;
            const onlineCount = locDevs.filter((d) => d.online).length;
            const openIssueCount = locDevs.reduce((sum, d) => sum + d.openIssues, 0);
            const planned = loc.plannedCount ?? (loc.deviceIds || []).length ?? 0;
            const planLinks = (loc.deliveryPlanIds || []).map((pid) => deliveryPlans.find((dp) => dp.id === pid)).filter(Boolean);
            return (
              <tr key={loc.id} className={`hover:bg-[#fafafa] ${loc.disabled ? 'opacity-60' : ''}`}>
                <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{loc.name}{loc.disabled && <span className="ml-2 text-xs text-gray-400">已停用</span>}</td>
                <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{loc.address || '—'}</td>
                <td className="px-3 py-2 text-gray-600">{planned}</td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{loc.owner || '—'}</td>
                <td className="px-3 py-2 text-xs whitespace-nowrap">
                  {planLinks.length
                    ? <div className="flex flex-wrap gap-x-3 gap-y-1">{planLinks.map((dp) => <Link key={dp.id} to={`/delivery-plans/${dp.id}`} className="ui-link">{dp.batchNo || dp.name}</Link>)}</div>
                    : '—'}
                </td>
                <td className="px-3 py-2 text-gray-600">{linkedCount}</td>
                <td className="px-3 py-2 text-gray-600">{onlineCount}</td>
                <td className="px-3 py-2">{openIssueCount > 0 ? <span className="text-amber-600 font-medium">{openIssueCount}</span> : <span className="text-gray-400">0</span>}</td>
                <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">{loc.updatedAt || '—'}</td>
                <td className="px-3 py-2 text-xs whitespace-nowrap">
                  <div className="flex items-center gap-x-3">
                    <LinkAction onClick={() => { setLocTarget(loc); setModal('locDevices'); }}>查看设备</LinkAction>
                    {canManageLoc && <>
                      <LinkAction onClick={() => { setLocTarget(loc); setModal('locationForm'); }}>编辑</LinkAction>
                      <LinkAction onClick={() => { setLocTarget(loc); setModal('deleteLoc'); }}>删除</LinkAction>
                    </>}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Section>

      {/* 设备列表 */}
      <Section title={`设备列表（${projDevices.length}）`} subtitle="该项目关联设备，覆盖生产、交付与在线运营各阶段。" bodyClassName="p-0">
        <Table
          head={['设备SN', '机器人型号', '当前状态', '在线状态', '所属点位', '最近更新', '操作']}
          empty="暂无项目设备"
          footer={<Pagination page={devPaged.page} total={devPaged.total} totalPages={devPaged.totalPages} onChange={devPaged.setPage} />}
        >
          {devPaged.pageItems.map((device) => {
            const typeName = deviceTypes.find((t) => t.id === device.deviceTypeId)?.name || device.deviceTypeId || '—';
            const loc = locations.find((l) => l.id === (device.locationId || device.preAssignedLocationId));
            const online = device.status === '在线运营';
            const dp = deliveryPlans.find((p) => (p.boundDeviceIds || []).includes(device.id) || (p.records?.binding || []).some((b) => b.deviceId === device.id));
            return (
              <tr key={device.id} className="hover:bg-[#fafafa]">
                <td className="px-3 py-2 font-mono text-xs whitespace-nowrap"><Link to={`/devices/${device.id}`} className="ui-link">{device.sn}</Link></td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{typeName}</td>
                <td className="px-3 py-2"><StatusBadge status={deviceLifecycleStatus(device)} /></td>
                <td className="px-3 py-2">{online ? <StatusBadge status="在线" /> : <span className="text-gray-300 text-xs">—</span>}</td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{loc?.name || '—'}</td>
                <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">{device.updatedAt || '—'}</td>
                <td className="px-3 py-2 text-xs whitespace-nowrap">
                  <div className="flex items-center gap-x-3">
                    <LinkAction to={`/devices/${device.id}`}>设备详情</LinkAction>
                    {dp ? <LinkAction to={`/delivery-plans/${dp.id}`}>交付记录</LinkAction> : <span className="text-gray-300">交付记录</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Section>

      {/* 当前项目生产计划 */}
      <Section title={`当前项目生产计划（${projProductionPlans.length}）`} bodyClassName="p-0">
        <Table
          head={['计划ID', '计划名称', '状态', '当前节点', '完成进度', 'ERP 生产订单号', '操作']}
          empty="暂无生产计划"
          footer={<Pagination page={prodPaged.page} total={prodPaged.total} totalPages={prodPaged.totalPages} onChange={prodPaged.setPage} />}
        >
          {prodPaged.pageItems.map((plan) => {
            const planDevices = devices.filter((d) => d.productionPlanId === plan.id);
            const done = planDevices.filter((d) => ['已入库', '待分配项目', '已分配项目', '在线运营'].includes(d.status)).length;
            return (
              <tr key={plan.id} className="hover:bg-[#fafafa]">
                <td className="px-3 py-2 font-mono text-xs whitespace-nowrap"><Link to={`/production-plans/${plan.id}`} className="ui-link">{plan.id}</Link></td>
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{plan.name}</td>
                <td className="px-3 py-2"><StatusBadge status={productionPlanStatus(plan)} /></td>
                <td className="px-3 py-2"><StatusBadge status={plan.currentNode || '来料准备'} /></td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{done}/{plan.targetCount || 0}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-500 whitespace-nowrap">{plan.erpProductionOrderNo || '—'}</td>
                <td className="px-3 py-2 text-xs whitespace-nowrap">
                  <div className="flex items-center gap-x-3">
                    <LinkAction to={`/production-plans/${plan.id}`}>查看详情</LinkAction>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Section>

      {/* 当前项目交付计划 */}
      <Section title={`当前项目交付计划（${projDeliveryPlans.length}）`} bodyClassName="p-0">
        <Table
          head={['计划ID', '交付批次', '状态', '当前阶段', '验收进度', '计划验收', '操作']}
          empty="暂无交付计划"
          footer={<Pagination page={delivPaged.page} total={delivPaged.total} totalPages={delivPaged.totalPages} onChange={delivPaged.setPage} />}
        >
          {delivPaged.pageItems.map((plan) => {
            const accepted = (plan.records?.customerAccept || []).filter(isPass).length;
            return (
              <tr key={plan.id} className="hover:bg-[#fafafa]">
                <td className="px-3 py-2 font-mono text-xs whitespace-nowrap"><Link to={`/delivery-plans/${plan.id}`} className="ui-link">{plan.id}</Link></td>
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{plan.batchNo || plan.name}</td>
                <td className="px-3 py-2"><StatusBadge status={deliveryPlanStatus(plan)} /></td>
                <td className="px-3 py-2"><StatusBadge status={plan.currentNode || '绑定设备'} /></td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{accepted}/{plan.targetCount || 0}</td>
                <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{plan.acceptanceDate || plan.dueDate || '—'}</td>
                <td className="px-3 py-2 text-xs whitespace-nowrap">
                  <div className="flex items-center gap-x-3">
                    <LinkAction to={`/delivery-plans/${plan.id}`}>查看详情</LinkAction>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Section>

      {/* 关联问题 / 售后记录 */}
      <Section title={`关联问题 / 售后记录（${relatedRows.length}）`} bodyClassName="p-0">
        <Table
          head={['编号', '类型', '关联设备SN', '来源阶段', '描述', '严重程度', '状态', '操作']}
          empty="暂无关联问题或售后记录"
          footer={<Pagination page={relatedPaged.page} total={relatedPaged.total} totalPages={relatedPaged.totalPages} onChange={relatedPaged.setPage} />}
        >
          {relatedPaged.pageItems.map((item) => (
            <tr key={item.id} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{item.id}</td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{item.kind}</td>
              <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{item.deviceSN || '—'}</td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{item.stage}</td>
              <td className="px-3 py-2 text-gray-700 text-xs max-w-[220px]"><div className="truncate">{item.desc}</div></td>
              <td className="px-3 py-2"><StatusBadge status={item.severity} /></td>
              <td className="px-3 py-2"><StatusBadge status={item.status} /></td>
              <td className="px-3 py-2 text-xs whitespace-nowrap">
                {item.target === 'quality'
                  ? <LinkAction to="/after-sales?tab=quality">查看详情</LinkAction>
                  : item.target === 'orders'
                    ? <LinkAction to="/after-sales?tab=orders">查看详情</LinkAction>
                    : <span className="text-gray-300">查看详情</span>}
              </td>
            </tr>
          ))}
        </Table>
      </Section>

      {/* 操作日志 */}
      <Section title="操作日志" right={<Btn variant="ghost" size="sm" onClick={() => setModal('logs')}>查看全部</Btn>} bodyClassName="p-0">
        <Table
          head={['操作类型', '操作时间', '操作人', '操作内容']}
          empty="暂无操作日志"
          footer={<Pagination page={logPaged.page} total={logPaged.total} totalPages={logPaged.totalPages} onChange={logPaged.setPage} />}
        >
          {logPaged.pageItems.map((log) => (
            <tr key={log.id} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{log.actionType || '—'}</td>
              <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">{log.timestamp || '—'}</td>
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{log.operator || '—'}</td>
              <td className="px-3 py-2 text-gray-600 text-xs">{log.notes || '—'}</td>
            </tr>
          ))}
        </Table>
      </Section>

      {/* 弹窗 */}
      <ProjectFormModal
        isOpen={modal === 'edit'}
        onClose={() => setModal(null)}
        project={project}
        onSave={(form) => {
          updateProject(form);
          writeLog('编辑项目', '更新项目基础信息');
        }}
      />

      {modal === 'locationForm' && (
        <LocationFormModal
          key={locTarget === 'new' ? 'loc-new' : locTarget?.id}
          isOpen
          onClose={() => { setModal(null); setLocTarget(null); }}
          projectName={project.name}
          initial={locTarget && locTarget !== 'new'
            ? { name: locTarget.name || '', address: locTarget.address || '', plannedCount: locTarget.plannedCount ?? 1, owner: locTarget.owner || '', notes: locTarget.notes || '' }
            : null}
          onSave={saveLocation}
        />
      )}

      <ConfirmModal
        isOpen={modal === 'deleteLoc'}
        onClose={() => { setModal(null); setLocTarget(null); }}
        title="删除点位"
        danger
        text={`确认删除点位「${locTarget && locTarget !== 'new' ? locTarget.name : ''}」？删除后该点位主数据将不再可用。`}
        onConfirm={() => { if (locTarget && locTarget !== 'new') deleteLocation(locTarget); }}
      />

      <LocationDevicesModal
        isOpen={modal === 'locDevices'}
        onClose={() => { setModal(null); setLocTarget(null); }}
        location={locTarget && locTarget !== 'new' ? locTarget : null}
        devices={locTarget && locTarget !== 'new' ? (locDeviceMap[locTarget.id] || []) : []}
      />

      <Modal isOpen={modal === 'logs'} onClose={() => setModal(null)} title="操作日志" size="lg">
        <OperationLog logs={projLogs} />
      </Modal>
    </Page>
  );
}
