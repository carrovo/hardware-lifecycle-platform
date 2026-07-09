import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Pagination, usePaged } from '../components/Pagination';
import {
  Page, PageHeader, Section, Card, Toolbar, Input, Select, SearchInput,
  Btn, LinkAction, Chip, StatCard, StatGrid, DescList, EmptyState, Table,
} from '../components/ui';
import { FEISHU_USERS } from '../data/mockData';

/* ═══════════════════════════════════════════════════════════════════
   售后管理：问题池（issues） / 售后工单（orders） / 换件记录（replacements）
   平台只读同步 ERP，围绕设备 SN 记录售后过程、形成问题闭环与操作日志。
   ─ 状态词在页面做「展示态映射」，不改动 mockData 里的原始状态值。
   ═══════════════════════════════════════════════════════════════════ */

const ISSUE_TYPES = ['使用问题', '设备质量问题'];
const WO_STATUS_LIST = ['待分派', '待接单', '待上门', '现场处理中', '已关单', '已取消'];
const QI_STATUS_LIST = ['待处理', '处理中', '已关闭'];
const QI_SOURCES = ['扫码上报', '手动录入', '工单转入'];
const SEVERITIES = ['高', '中', '低'];

const nowText = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
const genId = (prefix) => `${prefix}-${Date.now().toString().slice(-6)}`;
const TA = 'w-full border border-[#e0e0e0] rounded-md px-2.5 py-1.5 text-[13px] text-gray-800 focus:outline-none focus:border-[#a3a3a3] focus:ring-2 focus:ring-gray-100';

// 问题类型展示映射：把原始细分类型归并为「使用问题 / 设备质量问题」两类。
function displayIssueType(qi) {
  const t = (qi && qi.issueType) || '';
  if (t === '使用问题' || t === '设备质量问题') return t;
  if (['外观缺陷', '性能不达标'].includes(t)) return '使用问题';
  if (/使用|体验|操作|外观|性能/.test(t)) return '使用问题';
  return '设备质量问题'; // 功能异常 / 通信异常 / 工单转质量问题 / 其他 → 设备质量问题
}

// 售后工单状态展示映射：把旧状态映射为统一的 6 个新状态词。
function displayWoStatus(wo) {
  const s = wo && wo.status;
  if (s === '待处理') return wo.assignedTo ? '待接单' : '待分派';
  if (s === '处理中' || s === '复检中') return '现场处理中';
  if (s === '已关闭') return '已关单';
  if (s === '已作废') return '已取消';
  return s || '—';
}

/* ── 关联数据解析（只读，缺字段回退 '—'）───────────────────────── */
const findProject = (state, id) => (state.projects || []).find((p) => p.id === id) || null;
const findDeviceOf = (state, ref) => (state.devices || []).find((d) => d.id === ref.deviceId || d.sn === ref.deviceSN) || null;
function locationOfDevice(state, device) {
  if (!device) return null;
  const locs = state.locations || [];
  const id = device.locationId || device.preAssignedLocationId;
  return (id && locs.find((l) => l.id === id)) || locs.find((l) => (l.deviceIds || []).includes(device.id)) || null;
}
const locLabel = (loc) => (loc ? [loc.name, loc.address].filter(Boolean).join(' · ') : '—');
const materialOf = (state, id) => (state.materials || []).find((m) => m.id === id) || null;
// 来源问题编号：优先工单自带，其次从质量问题反查 linkedWorkOrderId。
const sourceIssueIdOf = (state, wo) =>
  wo.sourceQualityIssueId || wo.linkedQualityIssueId ||
  ((state.qualityIssues || []).find((q) => q.linkedWorkOrderId === wo.id) || {}).id || null;
const allWorkOrders = (state) => [
  ...(state.deliveryWorkOrders || []).map((w) => ({ ...w, _kind: 'delivery' })),
  ...(state.workOrders || []).map((w) => ({ ...w, _kind: 'aftersales' })),
];
const engineerOptions = () => FEISHU_USERS.map((u) => (
  <option key={u.id} value={u.name}>{u.name}（{u.dept}）</option>
));

/* ── 通用小部件 ─────────────────────────────────────────────── */
function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-500 mb-1">{label}{required && <span className="text-red-500"> *</span>}</span>
      {children}
    </label>
  );
}

function ModalActions({ onClose, onConfirm, disabled, confirmLabel = '确认', variant = 'primary' }) {
  return (
    <div className="flex justify-end gap-2 pt-3">
      <Btn variant="secondary" onClick={onClose}>取消</Btn>
      <Btn variant={variant} onClick={onConfirm} disabled={disabled}>{confirmLabel}</Btn>
    </div>
  );
}

// 右侧抽屉：详情 = 只读信息 + 可执行操作台 + 操作日志。
function Drawer({ open, onClose, title, subtitle, chips, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl border-l border-[#ececec] flex flex-col">
        <div className="px-5 py-4 border-b border-[#f0f0f0] flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-gray-900 font-mono truncate">{title}</div>
            {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
            {chips && <div className="mt-2 flex flex-wrap items-center gap-2">{chips}</div>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md w-7 h-7 flex items-center justify-center text-xl leading-none flex-shrink-0 transition-colors">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">{children}</div>
      </div>
    </div>
  );
}

function DrawerSection({ title, children }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-500 mb-2">{title}</div>
      {children}
    </div>
  );
}

function TextBlock({ children }) {
  return <div className="text-[13px] text-gray-800 leading-relaxed bg-[#fafafa] border border-[#f0f0f0] rounded-md p-3">{children || '—'}</div>;
}

function LogTimeline({ logs }) {
  if (!logs || logs.length === 0) return <EmptyState>暂无操作日志</EmptyState>;
  return (
    <ol className="space-y-3">
      {logs.map((log, i) => (
        <li key={i} className="flex gap-3">
          <div className="flex flex-col items-center pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
            {i < logs.length - 1 && <span className="w-px flex-1 bg-[#ececec] mt-1" />}
          </div>
          <div className="pb-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
              <span>{log.time}</span>
              <span className="font-medium text-gray-600">{log.operator}</span>
              {log.fromStatus && <><StatusBadge status={log.fromStatus} /><span className="text-gray-300">→</span><StatusBadge status={log.toStatus} /></>}
            </div>
            {log.notes && <div className="text-[13px] text-gray-700 mt-1">{log.notes}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* 通用「填写原因」弹窗（作废 / 打回 / 重新打开等） */
function ReasonModal({ title, label = '原因', placeholder, confirmLabel = '确认', variant = 'primary', requireConfirm = false, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [ok, setOk] = useState(!requireConfirm);
  return (
    <Modal isOpen onClose={onClose} title={title}>
      <div className="space-y-3">
        <Field label={label} required>
          <textarea rows={3} className={TA} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={placeholder} />
        </Field>
        {requireConfirm && (
          <label className="flex items-center gap-2 text-[13px] text-gray-600">
            <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> 我已确认此操作（二次确认）
          </label>
        )}
        <ModalActions onClose={onClose} onConfirm={() => onConfirm(reason.trim())} disabled={!reason.trim() || !ok} confirmLabel={confirmLabel} variant={variant} />
      </div>
    </Modal>
  );
}

/* ═════════════════════════ 售后工单：动作弹窗 ═════════════════════════ */
function NewOrderModal({ state, onClose, onSave }) {
  const { projects = [], devices = [] } = state;
  const [form, setForm] = useState({ projectId: '', deviceId: '', description: '', severity: '中', engineer: '' });
  const projDevices = form.projectId ? devices.filter((d) => d.projectId === form.projectId) : devices;
  const device = devices.find((d) => d.id === form.deviceId);
  const submit = () => {
    const t = nowText();
    onSave({
      id: genId('WO'), type: 'aftersales', woClass: '其他问题工单', involvesReplacement: false,
      projectId: form.projectId || null, deviceId: form.deviceId, deviceSN: device?.sn || '', stage: '在线运营',
      description: form.description, severity: form.severity, status: '待处理', assignedTo: form.engineer,
      createdAt: t, updatedAt: t, closedAt: null, processLogs: [],
    });
    onClose();
  };
  return (
    <Modal isOpen onClose={onClose} title="新增售后工单" size="lg">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="关联项目" required>
            <Select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value, deviceId: '' })} className="w-full">
              <option value="">-- 选择项目 --</option>
              {projects.filter((p) => !p.voided).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="设备 SN" required>
            <Select value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })} className="w-full">
              <option value="">-- 选择设备 --</option>
              {projDevices.map((d) => <option key={d.id} value={d.id}>{d.sn}</option>)}
            </Select>
          </Field>
          <Field label="严重程度">
            <Select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="w-full">
              {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="工程师">
            <Select value={form.engineer} onChange={(e) => setForm({ ...form, engineer: e.target.value })} className="w-full">
              <option value="">-- 待分派 --</option>
              {engineerOptions()}
            </Select>
          </Field>
        </div>
        <Field label="故障描述" required>
          <textarea rows={3} className={TA} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="描述设备故障现象" />
        </Field>
        <Card className="bg-[#fafafa] text-xs text-gray-500">新建工单默认状态为「待分派」。分派工程师后进入「待接单」，开始现场处理后为「现场处理中」，处理完成后关单。</Card>
        <ModalActions onClose={onClose} onConfirm={submit} disabled={!form.projectId || !form.deviceId || !form.description.trim()} confirmLabel="创建工单" />
      </div>
    </Modal>
  );
}

function AssignEngineerModal({ wo, onClose, onConfirm }) {
  const [engineer, setEngineer] = useState(wo.assignedTo || '');
  return (
    <Modal isOpen onClose={onClose} title="分配工程师">
      <div className="space-y-3">
        <div className="text-[13px] text-gray-500">工单号：<span className="font-mono text-gray-700">{wo.id}</span></div>
        <Field label="工程师" required>
          <Select value={engineer} onChange={(e) => setEngineer(e.target.value)} className="w-full">
            <option value="">-- 选择工程师 --</option>
            {engineerOptions()}
          </Select>
        </Field>
        <ModalActions onClose={onClose} onConfirm={() => onConfirm(engineer)} disabled={!engineer} confirmLabel="确认分配" />
      </div>
    </Modal>
  );
}

function StartProcessModal({ wo, currentUser, onClose, onConfirm }) {
  const [engineer, setEngineer] = useState(wo.assignedTo || currentUser);
  const [method, setMethod] = useState('');
  const [note, setNote] = useState('');
  return (
    <Modal isOpen onClose={onClose} title="开始现场处理">
      <div className="space-y-3">
        <Field label="工程师" required>
          <Select value={engineer} onChange={(e) => setEngineer(e.target.value)} className="w-full">{engineerOptions()}</Select>
        </Field>
        <Field label="处理方式"><Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="如：现场检修 / 更换部件 / 远程处理" className="w-full" /></Field>
        <Field label="备注"><textarea rows={2} className={TA} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <ModalActions onClose={onClose} onConfirm={() => onConfirm({ engineer, method, note })} disabled={!engineer} confirmLabel="开始处理" />
      </div>
    </Modal>
  );
}

function RecordRepairModal({ wo, onClose, onConfirm }) {
  const [action, setAction] = useState(wo.repairActions || '');
  const [note, setNote] = useState('');
  return (
    <Modal isOpen onClose={onClose} title="记录处理措施">
      <div className="space-y-3">
        <Field label="处理方案 / 现场措施" required>
          <textarea rows={3} className={TA} value={action} onChange={(e) => setAction(e.target.value)} placeholder="记录本次现场处理 / 维修措施" />
        </Field>
        <Field label="附件 / 图片 / 日志"><Input disabled placeholder="（原型占位）支持上传现场照片、日志" className="w-full bg-gray-50 text-gray-400" /></Field>
        <Field label="备注"><textarea rows={2} className={TA} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <ModalActions onClose={onClose} onConfirm={() => onConfirm({ action: action.trim(), note })} disabled={!action.trim()} confirmLabel="保存措施" />
      </div>
    </Modal>
  );
}

function CloseOrderModal({ wo, onClose, onConfirm }) {
  const [finalResult, setFinalResult] = useState('');
  const [closeNote, setCloseNote] = useState('');
  const [ok, setOk] = useState(false);
  return (
    <Modal isOpen onClose={onClose} title="关单">
      <div className="space-y-3">
        <div className="text-[13px] text-gray-500">工单号：<span className="font-mono text-gray-700">{wo.id}</span></div>
        <Field label="最终处理结果" required>
          <Input value={finalResult} onChange={(e) => setFinalResult(e.target.value)} placeholder="如：故障已排除 / 已更换部件 / 远程修复" className="w-full" />
        </Field>
        <Field label="关单说明"><textarea rows={3} className={TA} value={closeNote} onChange={(e) => setCloseNote(e.target.value)} placeholder="补充关单说明（选填）" /></Field>
        <label className="flex items-center gap-2 text-[13px] text-gray-600"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> 确认问题已闭环，可以关单。</label>
        <ModalActions onClose={onClose} onConfirm={() => onConfirm({ finalResult: finalResult.trim(), closeNote: closeNote.trim() })} disabled={!finalResult.trim() || !ok} confirmLabel="确认关单" />
      </div>
    </Modal>
  );
}

// 工单详情抽屉：字段严格覆盖需求清单，缺失回退 '—'。
function OrderDetailDrawer({ entry, state, dispatch, currentUser, canDo, onClose }) {
  const [modal, setModal] = useState(null);
  if (!entry) return null;
  const source = entry.kind === 'delivery' ? (state.deliveryWorkOrders || []) : (state.workOrders || []);
  const fresh = source.find((w) => w.id === entry.id);
  if (!fresh) return null;
  const wo = { ...fresh, _kind: entry.kind };
  const updType = entry.kind === 'delivery' ? 'UPDATE_DELIVERY_WORK_ORDER' : 'UPDATE_WORK_ORDER';
  const project = findProject(state, wo.projectId);
  const device = findDeviceOf(state, wo);
  const loc = locationOfDevice(state, device);
  const srcQI = sourceIssueIdOf(state, wo);
  const isDelivery = wo._kind === 'delivery';
  const dStatus = displayWoStatus(wo);
  const closed = ['已关闭', '已作废'].includes(wo.status);
  const editable = canDo('update_work_order');
  const close = () => setModal(null);

  const patch = (p, note, forceTo) => {
    const t = nowText();
    const toD = forceTo ?? displayWoStatus({ ...wo, ...p });
    dispatch({ type: updType, payload: { id: wo.id, updatedAt: t, ...p, processLogs: [...(wo.processLogs || []), { time: t, operator: currentUser, fromStatus: dStatus, toStatus: toD, notes: note }] } });
    close();
  };
  const doAssign = (engineer) => patch({ assignedTo: engineer }, `分配工程师：${engineer}`);
  const doStart = ({ engineer, method, note }) => patch({ status: '处理中', assignedTo: engineer }, `工程师 ${engineer} 开始现场处理${method ? `，方式：${method}` : ''}${note ? `（${note}）` : ''}`);
  const doRepair = ({ action, note }) => patch({ repairActions: action }, `记录处理措施：${action}${note ? `（${note}）` : ''}`);
  const doClose = ({ finalResult, closeNote }) => patch({ status: '已关闭', closedAt: nowText(), closeNote, finalResult }, `关单：${finalResult || '处理完成'}${closeNote ? `（${closeNote}）` : ''}`);
  const doReject = (reason) => patch({ status: '处理中' }, `复检打回，重新处理：${reason}`);
  const doVoid = (reason) => patch({ status: '已作废', closedAt: nowText(), voidReason: reason }, `工单取消：${reason}`);

  return (
    <Drawer open onClose={onClose} title={wo.id}
      subtitle={isDelivery ? `来源：交付子工单 · 交付计划 ${wo.deliveryPlanId || '—'}` : (srcQI ? `来源：问题池 ${srcQI}` : '来源：售后直接创建')}
      chips={<>
        <StatusBadge status={dStatus} />
        <StatusBadge status={wo.severity || '中'} />
        <Chip>{isDelivery ? '交付子工单' : '售后工单'}</Chip>
        <span className="text-xs text-gray-500">工程师：{wo.assignedTo || '待分派'}</span>
      </>}>
      <Section title="当前可执行操作" bodyClassName="p-3">
        {!editable ? (
          <div className="text-[13px] text-gray-400">当前角色无工单处理权限，仅可查看。</div>
        ) : closed ? (
          <div className="text-[13px] text-gray-400">{wo.status === '已作废' ? '工单已取消，仅可查看详情与操作日志。' : '工单已关单，仅可查看详情与操作日志。'}</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {wo.status === '待处理' && <>
              {!wo.assignedTo && <Btn variant="primary" size="sm" onClick={() => setModal('assign')}>分配工程师</Btn>}
              {wo.assignedTo && <Btn variant="primary" size="sm" onClick={() => setModal('start')}>开始处理</Btn>}
              {wo.assignedTo && <Btn size="sm" onClick={() => setModal('assign')}>重新分配</Btn>}
              <Btn variant="danger" size="sm" onClick={() => setModal('void')}>作废</Btn>
            </>}
            {wo.status === '处理中' && <>
              <Btn size="sm" onClick={() => setModal('repair')}>记录处理措施</Btn>
              <Btn variant="primary" size="sm" onClick={() => setModal('close')}>关单</Btn>
              <Btn variant="danger" size="sm" onClick={() => setModal('void')}>作废</Btn>
            </>}
            {wo.status === '复检中' && <>
              <Btn variant="primary" size="sm" onClick={() => setModal('close')}>关单</Btn>
              <Btn size="sm" onClick={() => setModal('reject')}>打回处理</Btn>
              <Btn variant="danger" size="sm" onClick={() => setModal('void')}>作废</Btn>
            </>}
          </div>
        )}
      </Section>

      <DrawerSection title="基础信息">
        <DescList items={[
          ['售后工单号', <span className="font-mono">{wo.id}</span>],
          ['来源问题编号', srcQI ? <LinkAction to="/after-sales?tab=issues">{srcQI}</LinkAction> : '—'],
          ['客户名称', project?.client],
          ['项目名称', project?.name],
          ['设备 SN', wo.deviceSN],
          ['点位 / 地址', locLabel(loc)],
          ['当前状态', <StatusBadge status={dStatus} />],
          ['严重程度', <StatusBadge status={wo.severity || '中'} />],
        ]} />
      </DrawerSection>

      <DrawerSection title="故障与方案">
        <div className="space-y-3">
          <TextBlock>{wo.description}</TextBlock>
          <DescList items={[
            ['一级故障原因', wo.faultCause1],
            ['二级故障原因', wo.faultCause2],
            ['三级故障原因', wo.faultCause3],
            ['处理方案', wo.repairActions],
          ]} />
        </div>
      </DrawerSection>

      <DrawerSection title="调度与上门">
        <DescList items={[
          ['leader 分配时间', wo.assignTime],
          ['工程师', wo.assignedTo],
          ['预计上门时间', wo.expectVisitTime],
          ['工程师接单时间', wo.acceptTime],
          ['工程师上门时间', wo.arriveTime],
        ]} />
      </DrawerSection>

      <DrawerSection title="换件信息">
        <DescList items={[
          ['是否需要换件', wo.involvesReplacement ? '是' : '否'],
          ['核心零部件类型', wo.needReplaceModuleType || wo.needModuleType],
          ['旧件 SN', wo.oldModuleSN],
          ['新件 SN', wo.newModuleSN],
          ['换件原因', wo.replaceReason],
          ['换件说明', wo.replaceNote],
          ['ERP 领料单号', wo.erpPickingNo],
          ['消耗物料', wo.consumedMaterials],
        ]} />
      </DrawerSection>

      <DrawerSection title="现场记录与关单">
        <DescList items={[
          ['现场维护记录', wo.fieldRecord],
          ['正常工作视频', wo.workVideo],
          ['现场照片', wo.imageFile || wo.sitePhoto],
          ['log', wo.logFile],
          ['关单说明', wo.closeNote || wo.voidReason],
          ['最终处理结果', wo.finalResult || wo.recheckResult],
          ['工程师关单时间', wo.closedAt],
        ]} />
      </DrawerSection>

      <DrawerSection title="操作日志"><LogTimeline logs={wo.processLogs} /></DrawerSection>

      {modal === 'assign' && <AssignEngineerModal wo={wo} onClose={close} onConfirm={doAssign} />}
      {modal === 'start' && <StartProcessModal wo={wo} currentUser={currentUser} onClose={close} onConfirm={doStart} />}
      {modal === 'repair' && <RecordRepairModal wo={wo} onClose={close} onConfirm={doRepair} />}
      {modal === 'close' && <CloseOrderModal wo={wo} onClose={close} onConfirm={doClose} />}
      {modal === 'reject' && <ReasonModal title="打回处理" label="打回原因" placeholder="说明复检 / 验收未通过的原因" confirmLabel="打回处理" variant="secondary" onClose={close} onConfirm={doReject} />}
      {modal === 'void' && <ReasonModal title="作废工单" label="作废原因" placeholder="请填写作废原因（必填）" confirmLabel="确认作废" variant="danger" requireConfirm onClose={close} onConfirm={doVoid} />}
    </Drawer>
  );
}

/* ═════════════════════════ 售后工单 Tab ═════════════════════════ */
function OrdersTab({ state, dispatch, currentUser, canDo }) {
  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fProject, setFProject] = useState('');
  const [fEngineer, setFEngineer] = useState('');
  const [fSwap, setFSwap] = useState('');
  const [fSource, setFSource] = useState('');
  const [detail, setDetail] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const orders = allWorkOrders(state);
  const engineers = [...new Set(orders.map((w) => w.assignedTo).filter(Boolean))];

  const total = orders.length;
  const nWaitAssign = orders.filter((w) => displayWoStatus(w) === '待分派').length;
  const nOnSite = orders.filter((w) => displayWoStatus(w) === '现场处理中').length;
  const nClosed = orders.filter((w) => displayWoStatus(w) === '已关单').length;

  const filtered = orders.filter((w) => {
    const q = search.trim().toLowerCase();
    return (!q || (w.id || '').toLowerCase().includes(q) || (w.deviceSN || '').toLowerCase().includes(q) || (w.description || '').toLowerCase().includes(q))
      && (!fStatus || displayWoStatus(w) === fStatus)
      && (!fProject || w.projectId === fProject)
      && (!fEngineer || w.assignedTo === fEngineer)
      && (!fSwap || (fSwap === '是' ? w.involvesReplacement : !w.involvesReplacement))
      && (!fSource || w._kind === fSource);
  }).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  const pager = usePaged(filtered, 10);

  const handleAdd = (wo) => dispatch({ type: 'ADD_WORK_ORDER', payload: wo });

  return (
    <Page>
      <PageHeader
        breadcrumb={<div className="text-xs text-gray-400">售后管理 / 售后工单</div>}
        title="售后工单"
        description="围绕设备 SN 记录售后处理全过程：分派、上门、现场处理到关单，形成闭环与操作日志。"
        actions={canDo('update_work_order') && <Btn variant="primary" onClick={() => setShowNew(true)}>新增工单</Btn>}
      />
      <StatGrid cols={4}>
        <StatCard label="工单总数" value={total} />
        <StatCard label="待分派" value={nWaitAssign} tone={nWaitAssign ? 'warning' : 'default'} />
        <StatCard label="现场处理中" value={nOnSite} tone={nOnSite ? 'warning' : 'default'} />
        <StatCard label="已关单" value={nClosed} tone="success" />
      </StatGrid>

      <Section title="售后闭环边界" bodyClassName="p-3">
        <p className="text-xs text-gray-500 leading-relaxed">
          售后工单处理在线运营 / 交付后设备的现场问题；生产测试 NG 属于生产返修，不在此处。交付异常转售后是流程分支，工单顶部会标注「来源：交付子工单」。
        </p>
      </Section>

      <Toolbar right={<span className="text-xs text-gray-400">共 {filtered.length} 条</span>}>
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索工单号 / 设备 SN / 描述" className="w-60" />
        <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)}><option value="">全部状态</option>{WO_STATUS_LIST.map((s) => <option key={s}>{s}</option>)}</Select>
        <Select value={fProject} onChange={(e) => setFProject(e.target.value)}><option value="">全部项目</option>{(state.projects || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
        <Select value={fEngineer} onChange={(e) => setFEngineer(e.target.value)}><option value="">全部工程师</option>{engineers.map((o) => <option key={o}>{o}</option>)}</Select>
        <Select value={fSwap} onChange={(e) => setFSwap(e.target.value)}><option value="">是否换件</option><option value="是">需换件</option><option value="否">不换件</option></Select>
        <Select value={fSource} onChange={(e) => setFSource(e.target.value)}><option value="">全部来源</option><option value="aftersales">售后创建</option><option value="delivery">交付子工单</option></Select>
      </Toolbar>

      <Table
        className="text-[12px]"
        head={['售后工单号', '来源问题编号', '客户名称', '项目名称', '设备 SN', '点位 / 地址', '故障描述', '当前状态', '工程师', '预计上门时间', '最近更新时间', '操作']}
        empty="暂无售后工单"
        footer={<Pagination page={pager.page} total={pager.total} totalPages={pager.totalPages} onChange={pager.setPage} />}
      >
        {pager.pageItems.map((w) => {
          const project = findProject(state, w.projectId);
          const device = findDeviceOf(state, w);
          const srcQI = sourceIssueIdOf(state, w);
          return (
            <tr key={`${w._kind}-${w.id}`} className="hover:bg-[#fafafa] transition-colors">
              <td className="px-3 py-2 font-mono text-gray-700 whitespace-nowrap">{w.id}</td>
              <td className="px-3 py-2 font-mono text-gray-500 whitespace-nowrap">{srcQI || '—'}</td>
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{project?.client || '—'}</td>
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{project?.name || '—'}</td>
              <td className="px-3 py-2 font-mono text-gray-800 whitespace-nowrap">{w.deviceSN || '—'}</td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{locLabel(locationOfDevice(state, device))}</td>
              <td className="px-3 py-2 text-gray-600 max-w-[200px]"><div className="truncate" title={w.description}>{w.description || '—'}</div></td>
              <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={displayWoStatus(w)} /></td>
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{w.assignedTo || '—'}</td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{w.expectVisitTime || '—'}</td>
              <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{w.updatedAt || '—'}</td>
              <td className="px-3 py-2 whitespace-nowrap"><LinkAction onClick={() => setDetail({ id: w.id, kind: w._kind })}>查看详情</LinkAction></td>
            </tr>
          );
        })}
      </Table>

      {detail && <OrderDetailDrawer entry={detail} state={state} dispatch={dispatch} currentUser={currentUser} canDo={canDo} onClose={() => setDetail(null)} />}
      {showNew && <NewOrderModal state={state} onClose={() => setShowNew(false)} onSave={handleAdd} />}
    </Page>
  );
}

/* ═════════════════════════ 问题池：动作弹窗 ═════════════════════════ */
function ManualEntryModal({ state, currentUser, onClose, onSave }) {
  const { projects = [], devices = [], locations = [] } = state;
  const [form, setForm] = useState({ projectId: '', deviceId: '', locationId: '', issueType: '设备质量问题', severity: '中', sourceStage: '在线运营', issueDesc: '' });
  const projDevices = form.projectId ? devices.filter((d) => d.projectId === form.projectId) : [];
  const projLocations = form.projectId ? locations.filter((l) => l.projectId === form.projectId) : [];
  const submit = () => {
    const device = devices.find((d) => d.id === form.deviceId);
    onSave({
      id: genId('QI'), deviceId: form.deviceId, deviceSN: device?.sn || '',
      locationId: form.locationId || null, projectId: form.projectId, sourceStage: form.sourceStage,
      issueType: form.issueType, severity: form.severity, issueDesc: form.issueDesc,
      reporterName: currentUser, owner: currentUser, reportTime: nowText(),
      status: '待处理', source: '手动录入', linkedWorkOrder: false, processLogs: [],
    });
    onClose();
  };
  return (
    <Modal isOpen onClose={onClose} title="手动录入问题" size="lg">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="所属项目" required>
            <Select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value, deviceId: '', locationId: '' })} className="w-full">
              <option value="">-- 选择项目 --</option>
              {projects.filter((p) => !p.voided).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="设备 SN" required>
            <Select value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })} className="w-full" disabled={!form.projectId}>
              <option value="">-- 选择设备 --</option>
              {projDevices.map((d) => <option key={d.id} value={d.id}>{d.sn}</option>)}
            </Select>
          </Field>
          <Field label="点位 / 地址">
            <Select value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })} className="w-full" disabled={!form.projectId}>
              <option value="">— 不选择点位 —</option>
              {projLocations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
          </Field>
          <Field label="问题类型">
            <Select value={form.issueType} onChange={(e) => setForm({ ...form, issueType: e.target.value })} className="w-full">
              {ISSUE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="问题来源阶段">
            <Select value={form.sourceStage} onChange={(e) => setForm({ ...form, sourceStage: e.target.value })} className="w-full">
              {['在线运营', '出厂检验', '现场安装调试', '客户验收'].map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="严重程度">
            <Select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="w-full">
              {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="故障描述" required>
          <textarea rows={3} className={TA} value={form.issueDesc} onChange={(e) => setForm({ ...form, issueDesc: e.target.value })} placeholder="请描述发现的问题" />
        </Field>
        <ModalActions onClose={onClose} onConfirm={submit} disabled={!form.projectId || !form.deviceId || !form.issueDesc.trim()} confirmLabel="提交" />
      </div>
    </Modal>
  );
}

function ScanReportModal({ onClose }) {
  return (
    <Modal isOpen onClose={onClose} title="扫码上报问题">
      <div className="space-y-4 text-center">
        <p className="text-[13px] text-gray-600 text-left">使用飞书扫一扫扫描下方二维码，自动识别设备 SN 后填写上报。</p>
        <div className="flex justify-center">
          <svg width="150" height="150" viewBox="0 0 160 160" className="border border-[#ececec] rounded-lg p-2">
            <rect x="10" y="10" width="50" height="50" rx="3" fill="none" stroke="#171717" strokeWidth="5" />
            <rect x="20" y="20" width="30" height="30" rx="1" fill="#171717" />
            <rect x="100" y="10" width="50" height="50" rx="3" fill="none" stroke="#171717" strokeWidth="5" />
            <rect x="110" y="20" width="30" height="30" rx="1" fill="#171717" />
            <rect x="10" y="100" width="50" height="50" rx="3" fill="none" stroke="#171717" strokeWidth="5" />
            <rect x="20" y="110" width="30" height="30" rx="1" fill="#171717" />
            <rect x="75" y="75" width="12" height="12" fill="#171717" /><rect x="99" y="75" width="12" height="12" fill="#171717" /><rect x="123" y="75" width="12" height="12" fill="#171717" />
            <rect x="75" y="99" width="12" height="12" fill="#171717" /><rect x="111" y="99" width="12" height="12" fill="#171717" />
            <rect x="87" y="111" width="12" height="12" fill="#171717" /><rect x="123" y="123" width="12" height="12" fill="#171717" />
          </svg>
        </div>
        <p className="text-xs text-gray-400">扫码后将在飞书内打开填报页面，设备信息自动带入。</p>
        <div className="flex justify-end"><Btn variant="secondary" onClick={onClose}>关闭</Btn></div>
      </div>
    </Modal>
  );
}

function AssignQIModal({ qi, onClose, onConfirm }) {
  const [owner, setOwner] = useState(qi.owner || '');
  const [toProcessing, setToProcessing] = useState(qi.status === '待处理');
  return (
    <Modal isOpen onClose={onClose} title="指派预处理人">
      <div className="space-y-3">
        <Field label="预处理人" required>
          <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="w-full">
            <option value="">-- 选择处理人 --</option>{engineerOptions()}
          </Select>
        </Field>
        {qi.status === '待处理' && (
          <label className="flex items-center gap-2 text-[13px] text-gray-600"><input type="checkbox" checked={toProcessing} onChange={(e) => setToProcessing(e.target.checked)} /> 指派后同时转入「处理中」</label>
        )}
        <ModalActions onClose={onClose} onConfirm={() => onConfirm({ owner, toProcessing })} disabled={!owner} confirmLabel="确认指派" />
      </div>
    </Modal>
  );
}

function ProgressQIModal({ qi, currentUser, onClose, onConfirm }) {
  const pending = qi.status === '待处理';
  const [content, setContent] = useState('');
  const [person, setPerson] = useState(qi.owner || currentUser);
  return (
    <Modal isOpen onClose={onClose} title={pending ? '更新处理建议' : '更新处理进展'}>
      <div className="space-y-3">
        <Field label={pending ? '处理建议' : '处理进展'} required>
          <textarea rows={3} className={TA} value={content} onChange={(e) => setContent(e.target.value)} placeholder={pending ? '填写初步判断 / 处理建议' : '填写本次处理进展'} />
        </Field>
        <Field label="处理人"><Select value={person} onChange={(e) => setPerson(e.target.value)} className="w-full">{engineerOptions()}</Select></Field>
        {pending && <Card className="bg-[#fafafa] text-xs text-gray-500">提交后问题将转入「处理中」。</Card>}
        <ModalActions onClose={onClose} onConfirm={() => onConfirm({ content: content.trim(), person })} disabled={!content.trim()} confirmLabel="保存" />
      </div>
    </Modal>
  );
}

function GenOrderModal({ qi, onClose, onConfirm }) {
  const [engineer, setEngineer] = useState('');
  const [note, setNote] = useState('');
  return (
    <Modal isOpen onClose={onClose} title="转售后工单">
      <div className="space-y-3">
        <Card className="bg-[#fafafa] text-xs text-gray-500">将根据本问题生成一条售后工单（默认「待分派」），并回填到问题的「是否转售后工单」。</Card>
        <div className="grid grid-cols-2 gap-3 text-[13px]">
          <div><span className="text-gray-400 text-xs">设备 SN：</span><span className="text-gray-700">{qi.deviceSN}</span></div>
          <div><span className="text-gray-400 text-xs">问题类型：</span><span className="text-gray-700">{displayIssueType(qi)}</span></div>
        </div>
        <Field label="工程师">
          <Select value={engineer} onChange={(e) => setEngineer(e.target.value)} className="w-full"><option value="">-- 待分派 --</option>{engineerOptions()}</Select>
        </Field>
        <Field label="生成说明"><textarea rows={2} className={TA} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <ModalActions onClose={onClose} onConfirm={() => onConfirm({ engineer, note })} confirmLabel="生成工单" />
      </div>
    </Modal>
  );
}

function CloseQIModal({ onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [ok, setOk] = useState(false);
  return (
    <Modal isOpen onClose={onClose} title="关闭问题">
      <div className="space-y-3">
        <Field label="关闭原因" required><textarea rows={2} className={TA} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <Field label="处理结论"><textarea rows={2} className={TA} value={conclusion} onChange={(e) => setConclusion(e.target.value)} /></Field>
        <label className="flex items-center gap-2 text-[13px] text-gray-600"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> 我已确认问题可关闭。</label>
        <ModalActions onClose={onClose} onConfirm={() => onConfirm({ reason: reason.trim(), conclusion: conclusion.trim() })} disabled={!reason.trim() || !ok} confirmLabel="确认关闭" variant="primary" />
      </div>
    </Modal>
  );
}

// 问题详情抽屉：完整字段 + 处理日志 + 处理台。
function IssueDetailDrawer({ id, state, dispatch, currentUser, canDo, onClose }) {
  const [modal, setModal] = useState(null);
  const qi = (state.qualityIssues || []).find((q) => q.id === id);
  if (!qi) return null;
  const project = findProject(state, qi.projectId);
  const location = (state.locations || []).find((l) => l.id === qi.locationId);
  const linked = !!(qi.linkedWorkOrder || qi.linkedWorkOrderId);
  const closed = qi.status === '已关闭';
  const editable = canDo('update_quality_issue');
  const lastUpdate = qi.processLogs && qi.processLogs.length ? qi.processLogs[qi.processLogs.length - 1].time : qi.reportTime;
  const close = () => setModal(null);

  const patchQI = (p, note, forceTo) => {
    const t = nowText();
    dispatch({ type: 'UPDATE_QUALITY_ISSUE', payload: { id: qi.id, ...p, processLogs: [...(qi.processLogs || []), { time: t, operator: currentUser, fromStatus: qi.status, toStatus: forceTo ?? p.status ?? qi.status, notes: note }] } });
    close();
  };
  const doAssign = ({ owner, toProcessing }) => patchQI({ owner, status: toProcessing ? '处理中' : qi.status }, `指派预处理人：${owner}`, toProcessing ? '处理中' : qi.status);
  const doProgress = ({ content, person }) => { const to = qi.status === '待处理' ? '处理中' : qi.status; patchQI({ status: to, owner: qi.owner || person, handleNote: content }, `更新处理${qi.status === '待处理' ? '（转处理中）' : '进展'}：${content}`, to); };
  const doClose = ({ reason, conclusion }) => patchQI({ status: '已关闭', closeReason: reason, closeConclusion: conclusion }, `关闭问题：${reason}${conclusion ? `；结论：${conclusion}` : ''}`, '已关闭');
  const doReopen = (reason) => patchQI({ status: '处理中' }, `重新打开：${reason}`, '处理中');
  const genOrder = ({ engineer, note }) => {
    if (linked) return;
    const t = nowText();
    const woId = genId('WO');
    const needSwap = displayIssueType(qi) === '设备质量问题';
    dispatch({ type: 'ADD_WORK_ORDER', payload: { id: woId, type: 'aftersales', woClass: needSwap ? '换件工单' : '其他问题工单', involvesReplacement: needSwap, stage: qi.sourceStage || '在线运营', projectId: qi.projectId, deviceId: qi.deviceId, deviceSN: qi.deviceSN, description: qi.issueDesc, severity: qi.severity || '中', status: '待处理', assignedTo: engineer || '', sourceQualityIssueId: qi.id, createdAt: t, updatedAt: t, closedAt: null, processLogs: [] } });
    patchQI({ linkedWorkOrder: true, linkedWorkOrderId: woId }, `转售后工单 ${woId}${note ? `（${note}）` : ''}`);
  };

  return (
    <Drawer open onClose={onClose} title={qi.id} subtitle={`来源：${qi.source || '—'} · 上报 ${qi.reportTime || '—'}`}
      chips={<>
        <StatusBadge status={qi.status} />
        <StatusBadge status={qi.severity || '中'} />
        <Chip>{displayIssueType(qi)}</Chip>
        <span className="text-xs text-gray-500">预处理人：{qi.owner || '—'}</span>
      </>}>
      <Section title="当前可执行操作" bodyClassName="p-3">
        {!editable ? (
          <div className="text-[13px] text-gray-400">当前角色无问题处理权限，仅可查看。</div>
        ) : closed ? (
          <div className="flex flex-wrap gap-2 items-center">
            <Btn size="sm" onClick={() => setModal('reopen')}>重新打开</Btn>
            <span className="text-[13px] text-gray-400">问题已关闭，其余动作不可用。</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Btn size="sm" onClick={() => setModal('assign')}>指派预处理人</Btn>
            <Btn size="sm" onClick={() => setModal('progress')}>{qi.status === '待处理' ? '更新处理建议' : '更新处理进展'}</Btn>
            <Btn variant="primary" size="sm" disabled={linked} title={linked ? `已转工单 ${qi.linkedWorkOrderId || ''}` : ''} onClick={() => setModal('genOrder')}>转售后工单</Btn>
            <Btn size="sm" onClick={() => setModal('close')}>关闭问题</Btn>
          </div>
        )}
      </Section>

      <DrawerSection title="基础信息">
        <DescList items={[
          ['问题编号', <span className="font-mono">{qi.id}</span>],
          ['问题来源', qi.source],
          ['问题类型', displayIssueType(qi)],
          ['当前状态', <StatusBadge status={qi.status} />],
          ['严重程度', <StatusBadge status={qi.severity || '中'} />],
          ['问题来源阶段', qi.sourceStage || '在线运营'],
          ['问题发生时间', qi.reportTime],
          ['最近更新时间', lastUpdate],
        ]} />
      </DrawerSection>

      <DrawerSection title="关联对象">
        <DescList items={[
          ['客户名称', project?.client],
          ['项目名称', project?.name],
          ['设备 SN', qi.deviceSN],
          ['点位 / 地址', locLabel(location)],
        ]} />
      </DrawerSection>

      <DrawerSection title="故障描述"><TextBlock>{qi.issueDesc}</TextBlock></DrawerSection>

      <DrawerSection title="故障归因与处理">
        <DescList items={[
          ['一级故障原因', qi.faultCause1],
          ['二级故障原因', qi.faultCause2],
          ['预处理人', qi.owner],
          ['是否可远程关闭', qi.remoteClosable == null ? '—' : (qi.remoteClosable ? '是' : '否')],
          ['是否转售后工单', linked ? '是' : '否'],
          ['关联售后工单', qi.linkedWorkOrderId ? <LinkAction to="/after-sales?tab=orders">{qi.linkedWorkOrderId}</LinkAction> : '—'],
          ['当前处理进展', qi.handleNote],
          ...(closed ? [['关闭原因', qi.closeReason], ['处理结论', qi.closeConclusion]] : []),
        ]} />
      </DrawerSection>

      <DrawerSection title="操作日志"><LogTimeline logs={qi.processLogs} /></DrawerSection>

      {modal === 'assign' && <AssignQIModal qi={qi} onClose={close} onConfirm={doAssign} />}
      {modal === 'progress' && <ProgressQIModal qi={qi} currentUser={currentUser} onClose={close} onConfirm={doProgress} />}
      {modal === 'genOrder' && <GenOrderModal qi={qi} onClose={close} onConfirm={genOrder} />}
      {modal === 'close' && <CloseQIModal onClose={close} onConfirm={doClose} />}
      {modal === 'reopen' && <ReasonModal title="重新打开问题" label="重新打开原因" confirmLabel="重新打开" variant="secondary" onClose={close} onConfirm={doReopen} />}
    </Drawer>
  );
}

/* ═════════════════════════ 问题池 Tab ═════════════════════════ */
function IssuesTab({ state, dispatch, currentUser, canDo }) {
  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fType, setFType] = useState('');
  const [fProject, setFProject] = useState('');
  const [fSource, setFSource] = useState('');
  const [fToWO, setFToWO] = useState('');
  const [detail, setDetail] = useState(null);
  const [showScan, setShowScan] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const issues = state.qualityIssues || [];
  const hasWO = (qi) => !!(qi.linkedWorkOrder || qi.linkedWorkOrderId);
  const qiUpdatedAt = (qi) => (qi.processLogs && qi.processLogs.length ? qi.processLogs[qi.processLogs.length - 1].time : qi.reportTime);

  const total = issues.length;
  const nPending = issues.filter((q) => q.status === '待处理').length;
  const nToWO = issues.filter(hasWO).length;
  const nClosed = issues.filter((q) => q.status === '已关闭').length;

  const filtered = issues.filter((qi) => {
    const q = search.trim().toLowerCase();
    return (!q || (qi.id || '').toLowerCase().includes(q) || (qi.deviceSN || '').toLowerCase().includes(q) || (qi.issueDesc || '').toLowerCase().includes(q))
      && (!fStatus || qi.status === fStatus)
      && (!fType || displayIssueType(qi) === fType)
      && (!fProject || qi.projectId === fProject)
      && (!fSource || qi.source === fSource)
      && (!fToWO || (fToWO === '是' ? hasWO(qi) : !hasWO(qi)));
  }).sort((a, b) => (b.reportTime || '').localeCompare(a.reportTime || ''));
  const pager = usePaged(filtered, 10);

  const handleSave = (qi) => dispatch({ type: 'ADD_QUALITY_ISSUE', payload: qi });

  return (
    <Page>
      <PageHeader
        breadcrumb={<div className="text-xs text-gray-400">售后管理 / 问题池</div>}
        title="问题池"
        description="设备售后问题的统一台账：沉淀、追溯与闭环。扫码上报 / 手动录入进入问题池，可转售后工单。"
        actions={<div className="flex items-center gap-2">
          <Btn variant="secondary" onClick={() => setShowScan(true)}>扫码上报</Btn>
          {canDo('add_quality_issue') && <Btn variant="primary" onClick={() => setShowManual(true)}>手动录入</Btn>}
        </div>}
      />
      <StatGrid cols={4}>
        <StatCard label="问题总数" value={total} />
        <StatCard label="待处理" value={nPending} tone={nPending ? 'warning' : 'default'} />
        <StatCard label="已转售后工单" value={nToWO} />
        <StatCard label="已关闭" value={nClosed} tone="success" />
      </StatGrid>

      <Card className="bg-[#fafafa] text-xs text-gray-500 leading-relaxed">
        问题池用于问题沉淀、追溯与统计，不替代售后工单。「问题类型」统一归并为「使用问题 / 设备质量问题」两类；需要现场处理的问题可转为售后工单。
      </Card>

      <Toolbar right={<span className="text-xs text-gray-400">共 {filtered.length} 条</span>}>
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索问题编号 / 设备 SN / 描述" className="w-60" />
        <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)}><option value="">全部状态</option>{QI_STATUS_LIST.map((s) => <option key={s}>{s}</option>)}</Select>
        <Select value={fType} onChange={(e) => setFType(e.target.value)}><option value="">全部问题类型</option>{ISSUE_TYPES.map((t) => <option key={t}>{t}</option>)}</Select>
        <Select value={fProject} onChange={(e) => setFProject(e.target.value)}><option value="">全部项目</option>{(state.projects || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
        <Select value={fSource} onChange={(e) => setFSource(e.target.value)}><option value="">全部来源</option>{QI_SOURCES.map((s) => <option key={s}>{s}</option>)}</Select>
        <Select value={fToWO} onChange={(e) => setFToWO(e.target.value)}><option value="">是否转工单</option><option value="是">已转工单</option><option value="否">未转工单</option></Select>
      </Toolbar>

      <Table
        className="text-[12px]"
        head={['问题编号', '问题来源', '问题类型', '客户名称', '项目名称', '设备 SN', '点位 / 地址', '问题发生时间', '故障描述', '当前状态', '一级故障原因', '二级故障原因', '预处理人', '是否可远程关闭', '是否转售后工单', '最近更新时间', '操作']}
        empty="暂无问题记录"
        footer={<Pagination page={pager.page} total={pager.total} totalPages={pager.totalPages} onChange={pager.setPage} />}
      >
        {pager.pageItems.map((qi) => {
          const project = findProject(state, qi.projectId);
          const location = (state.locations || []).find((l) => l.id === qi.locationId);
          return (
            <tr key={qi.id} className="hover:bg-[#fafafa] transition-colors">
              <td className="px-3 py-2 font-mono text-gray-700 whitespace-nowrap">{qi.id}</td>
              <td className="px-3 py-2 whitespace-nowrap"><Chip>{qi.source || '—'}</Chip></td>
              <td className="px-3 py-2 whitespace-nowrap text-gray-600">{displayIssueType(qi)}</td>
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{project?.client || '—'}</td>
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{project?.name || '—'}</td>
              <td className="px-3 py-2 font-mono text-gray-800 whitespace-nowrap">{qi.deviceSN || '—'}</td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{locLabel(location)}</td>
              <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{qi.reportTime || '—'}</td>
              <td className="px-3 py-2 text-gray-600 max-w-[200px]"><div className="truncate" title={qi.issueDesc}>{qi.issueDesc || '—'}</div></td>
              <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={qi.status} /></td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{qi.faultCause1 || '—'}</td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{qi.faultCause2 || '—'}</td>
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{qi.owner || '—'}</td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{qi.remoteClosable == null ? '—' : (qi.remoteClosable ? '是' : '否')}</td>
              <td className="px-3 py-2 whitespace-nowrap">{hasWO(qi) ? <span className="text-gray-700">是</span> : <span className="text-gray-400">否</span>}</td>
              <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{qiUpdatedAt(qi)}</td>
              <td className="px-3 py-2 whitespace-nowrap"><LinkAction onClick={() => setDetail(qi.id)}>查看详情</LinkAction></td>
            </tr>
          );
        })}
      </Table>

      {detail && <IssueDetailDrawer id={detail} state={state} dispatch={dispatch} currentUser={currentUser} canDo={canDo} onClose={() => setDetail(null)} />}
      {showScan && <ScanReportModal onClose={() => setShowScan(false)} />}
      {showManual && <ManualEntryModal state={state} currentUser={currentUser} onClose={() => setShowManual(false)} onSave={handleSave} />}
    </Page>
  );
}

/* ═════════════════════════ 换件记录 Tab ═════════════════════════ */
// 换件记录只读：源自售后工单的换件动作 + ERP 领料 / 出库申请，不做独立库存流程。
function replacementView(state, mr) {
  const wo = allWorkOrders(state).find((w) => w.id === mr.workOrderId) || null;
  const device = (state.devices || []).find((d) => d.id === mr.deviceId) || null;
  const project = findProject(state, device?.projectId || wo?.projectId);
  const removed = materialOf(state, mr.removedMaterialId);
  const added = materialOf(state, mr.addedMaterialId);
  return {
    mr, wo, device, project, removed, added,
    sourceQI: wo ? sourceIssueIdOf(state, wo) : null,
    location: locationOfDevice(state, device),
    coreType: removed?.category || added?.category || '—',
    oldSN: removed?.sn || '—',
    oldStatus: mr.removedDisposition || removed?.status || '—',
    newSN: added?.sn || '—',
    newSource: added?.supplier || '—',
  };
}

function ReplacementDetailDrawer({ id, state, onClose }) {
  const mr = (state.moduleReplacements || []).find((r) => r.id === id);
  if (!mr) return null;
  const v = replacementView(state, mr);
  const logs = [{ time: mr.timestamp, operator: mr.operator, notes: mr.notes || '完成换件' }];
  return (
    <Drawer open onClose={onClose} title={mr.id} subtitle="换件记录（只读）"
      chips={<>
        <Chip>{v.coreType}</Chip>
        {mr.workOrderId && <LinkAction to="/after-sales?tab=orders">售后工单 {mr.workOrderId}</LinkAction>}
        {v.sourceQI && <span className="text-xs text-gray-500">来源问题 {v.sourceQI}</span>}
      </>}>
      <Card className="bg-[#fafafa] text-xs text-gray-500 leading-relaxed">
        换件记录为只读，源于售后工单的换件动作与 ERP 领料 / 出库申请。此处不新增或扣减库存，如需处理请前往关联售后工单。
      </Card>
      <DrawerSection title="关联对象">
        <DescList items={[
          ['换件记录编号', <span className="font-mono">{mr.id}</span>],
          ['售后工单号', mr.workOrderId ? <LinkAction to="/after-sales?tab=orders">{mr.workOrderId}</LinkAction> : '—'],
          ['来源问题编号', v.sourceQI || '—'],
          ['项目名称', v.project?.name],
          ['客户名称', v.project?.client],
          ['设备 SN', v.device?.sn || mr.deviceId],
          ['点位 / 地址', locLabel(v.location)],
        ]} />
      </DrawerSection>
      <DrawerSection title="部件与 ERP 领料">
        <DescList items={[
          ['核心部件类型', v.coreType],
          ['旧件 SN', v.oldSN],
          ['旧件状态', v.oldStatus],
          ['新件 SN', v.newSN],
          ['新件来源', v.newSource],
          ['ERP 领料单号 / 出库申请单号', mr.erpPickingNo],
          ['ERP 领料状态', mr.erpPickingStatus],
        ]} />
      </DrawerSection>
      <DrawerSection title="换件说明">
        <DescList items={[
          ['换件原因', mr.reason],
          ['换件说明', mr.notes],
          ['换件时间', mr.timestamp],
          ['操作人', mr.operator],
          ['现场照片 / log', mr.photo || mr.logFile],
        ]} />
      </DrawerSection>
      <DrawerSection title="操作日志"><LogTimeline logs={logs} /></DrawerSection>
    </Drawer>
  );
}

function ReplacementsTab({ state }) {
  const [search, setSearch] = useState('');
  const [fProject, setFProject] = useState('');
  const [fCore, setFCore] = useState('');
  const [fOperator, setFOperator] = useState('');
  const [detail, setDetail] = useState(null);

  const rows = (state.moduleReplacements || []).map((mr) => replacementView(state, mr));
  const operators = [...new Set(rows.map((r) => r.mr.operator).filter(Boolean))];
  const coreTypes = [...new Set(rows.map((r) => r.coreType).filter((c) => c && c !== '—'))];

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    return (!q || (r.mr.id || '').toLowerCase().includes(q) || (r.device?.sn || '').toLowerCase().includes(q) || (r.mr.workOrderId || '').toLowerCase().includes(q))
      && (!fProject || r.project?.id === fProject)
      && (!fCore || r.coreType === fCore)
      && (!fOperator || r.mr.operator === fOperator);
  }).sort((a, b) => (b.mr.timestamp || '').localeCompare(a.mr.timestamp || ''));
  const pager = usePaged(filtered, 10);

  return (
    <Page>
      <PageHeader
        breadcrumb={<div className="text-xs text-gray-400">售后管理 / 换件记录</div>}
        title="换件记录"
        description="售后工单产生的核心部件更换记录（只读），关联售后工单与 ERP 领料 / 出库申请，用于追溯，不承载库存流程。"
      />
      <StatGrid cols={3}>
        <StatCard label="换件记录数" value={rows.length} />
        <StatCard label="涉及设备" value={new Set(rows.map((r) => r.mr.deviceId)).size} />
        <StatCard label="关联售后工单" value={new Set(rows.map((r) => r.mr.workOrderId).filter(Boolean)).size} />
      </StatGrid>

      <Card className="bg-[#fafafa] text-xs text-gray-500 leading-relaxed">
        换件记录只做只读留痕与跳转到售后工单，不提供新增 / 扣减库存等动作。ERP 领料单号 / 出库申请单号与领料状态由 ERP 同步，缺失显示「—」。
      </Card>

      <Toolbar right={<span className="text-xs text-gray-400">共 {filtered.length} 条</span>}>
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索记录编号 / 设备 SN / 工单号" className="w-60" />
        <Select value={fProject} onChange={(e) => setFProject(e.target.value)}><option value="">全部项目</option>{(state.projects || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
        <Select value={fCore} onChange={(e) => setFCore(e.target.value)}><option value="">全部核心部件类型</option>{coreTypes.map((c) => <option key={c}>{c}</option>)}</Select>
        <Select value={fOperator} onChange={(e) => setFOperator(e.target.value)}><option value="">全部操作人</option>{operators.map((o) => <option key={o}>{o}</option>)}</Select>
      </Toolbar>

      <Table
        className="text-[12px]"
        head={['换件记录编号', '售后工单号', '来源问题编号', '项目名称', '客户名称', '设备 SN', '点位 / 地址', '核心部件类型', '旧件 SN', '旧件状态', '新件 SN', '新件来源', 'ERP 领料单号 / 出库申请单号', 'ERP 领料状态', '换件原因', '换件说明', '换件时间', '操作人', '现场照片 / log', '操作日志']}
        empty="暂无换件记录"
        footer={<Pagination page={pager.page} total={pager.total} totalPages={pager.totalPages} onChange={pager.setPage} />}
      >
        {pager.pageItems.map((r) => {
          const { mr } = r;
          return (
            <tr key={mr.id} className="hover:bg-[#fafafa] transition-colors">
              <td className="px-3 py-2 font-mono whitespace-nowrap"><LinkAction onClick={() => setDetail(mr.id)}>{mr.id}</LinkAction></td>
              <td className="px-3 py-2 whitespace-nowrap">{mr.workOrderId ? <LinkAction to="/after-sales?tab=orders">{mr.workOrderId}</LinkAction> : '—'}</td>
              <td className="px-3 py-2 font-mono text-gray-500 whitespace-nowrap">{r.sourceQI || '—'}</td>
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.project?.name || '—'}</td>
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.project?.client || '—'}</td>
              <td className="px-3 py-2 font-mono text-gray-800 whitespace-nowrap">{r.device?.sn || mr.deviceId || '—'}</td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{locLabel(r.location)}</td>
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.coreType}</td>
              <td className="px-3 py-2 font-mono text-gray-500 whitespace-nowrap">{r.oldSN}</td>
              <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={r.oldStatus} /></td>
              <td className="px-3 py-2 font-mono text-gray-500 whitespace-nowrap">{r.newSN}</td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{r.newSource}</td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{mr.erpPickingNo || '—'}</td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{mr.erpPickingStatus || '—'}</td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{mr.reason || '—'}</td>
              <td className="px-3 py-2 text-gray-600 max-w-[200px]"><div className="truncate" title={mr.notes}>{mr.notes || '—'}</div></td>
              <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{mr.timestamp || '—'}</td>
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{mr.operator || '—'}</td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{mr.photo || mr.logFile || '—'}</td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{mr.operator ? `${mr.operator} · ${mr.timestamp}` : '—'}</td>
            </tr>
          );
        })}
      </Table>

      {detail && <ReplacementDetailDrawer id={detail} state={state} onClose={() => setDetail(null)} />}
    </Page>
  );
}

/* ═════════════════════════ Main ═════════════════════════ */
export default function AfterSalesPage() {
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const [searchParams] = useSearchParams();
  const raw = searchParams.get('tab');
  const tab = raw === 'quality' ? 'issues' : (raw || 'issues'); // 旧 key 兼容：quality → issues
  const activeTab = ['issues', 'orders', 'replacements'].includes(tab) ? tab : 'issues';
  const shared = { state, dispatch, canDo, currentUser: state.currentUser };

  if (activeTab === 'orders') return <OrdersTab {...shared} />;
  if (activeTab === 'replacements') return <ReplacementsTab {...shared} />;
  return <IssuesTab {...shared} />;
}
