import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import OperationLog from '../components/OperationLog';
import { Pagination, usePaged } from '../components/Pagination';
import {
  Page, PageHeader, Section, Card, Toolbar, Input, Select, SearchInput,
  Btn, LinkAction, Chip, StatCard, StatGrid, DescList, Table, EmptyState,
} from '../components/ui';
import {
  isPass, projectStatus as deriveProjectStatus,
  productionPlanStatus, deliveryPlanStatus, TODAY,
} from '../utils/status';
import { erpSyncMeta, erpSyncLogs } from '../data/mockData';

// 生产计划「当前卡点」派生阈值：创建早于 TODAY-45 天且未完成 → 长期未结。
const LONG_UNSETTLED_BEFORE = (() => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - 45);
  return d.toISOString().slice(0, 10);
})();

// 生产计划「当前卡点」（平台派生，非计划唯一节点）：未结返修单 / NG → 质量测试；创建久未完成 → 长期未结；否则无明显卡点。
function planBottleneck(plan, status, devices, openRepairs) {
  if (['已完成', '已作废'].includes(status)) return '无明显卡点';
  const anyNG = devices.some((d) => ['生产返修中', '返修中', '测试NG', 'NG待返修'].includes(d.status));
  if (openRepairs > 0 || anyNG) return '质量测试';
  const longUnsettled = !!plan.createdAt && String(plan.createdAt).slice(0, 10) < LONG_UNSETTLED_BEFORE;
  return longUnsettled ? '长期未结' : '无明显卡点';
}

// 项目中心容器：项目列表 / 生产计划 / 交付计划 / ERP 表单 四个 tab。
// tab 由 ?tab= 决定，默认 list。视觉统一复用 ../components/ui 设计系统。

const TABS = [
  { key: 'list', label: '项目列表' },
  { key: 'production', label: '生产计划' },
  { key: 'delivery', label: '交付计划' },
  { key: 'erp', label: 'ERP 表单' },
];

const PROJECT_STATUSES = ['未开始', '进行中', '已交付', '已关闭', '已作废'];
const PRODUCTION_STATUSES = ['未开始', '生产中', '已完成', '已延期', '已作废'];
const PRODUCTION_NODES = ['来料准备', '整机装配', '质量测试', '整机入库'];
const DELIVERY_NODES = ['绑定设备', '出厂检验', '现场安装调试', '客户验收'];
const DELIVERY_STATUSES = ['未开始', '交付中', '已验收', '已延期', '已作废'];
const PROJECT_TYPES = ['智魔方', '机场', '工业场景', '遥操数采'];

// 项目成员角色 + 可选成员（评审版 mock：仅前端展示与弹窗配置，不做全平台数据权限拦截）。
const MEMBER_ROLES = ['项目负责人', '生产协同', '质量协同', '交付协同', '售后协同', 'ERP 协同', '只读成员'];
const MEMBER_CANDIDATES = ['张三', '李四', '王五', '赵六', '蔡八'];

// 弹窗内沿用的紧凑表单样式（Modal 内部，不影响主页面视觉）。
const INPUT = 'border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500 bg-white';
const BTN_GHOST = 'px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50';
const BTN_PRIMARY = 'px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800';

function nowText() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

const normalizeProjectStatus = deriveProjectStatus;

function progressBar(done, total, color = 'bg-blue-500') {
  const pct = total > 0 ? Math.min(Math.round((done / total) * 100), 100) : 0;
  return (
    <div className="flex items-center gap-2 min-w-[130px]">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{done}/{total || 0}</span>
    </div>
  );
}

function erpChip(linked) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${linked ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
      {linked ? '已关联' : '未关联'}
    </span>
  );
}

/* ── 弹窗（保留既有交互与数据接线） ─────────────────── */
function SimpleFormModal({ isOpen, onClose, title, fields, onSubmit, submitText = '保存', size = 'lg', note }) {
  const initial = Object.fromEntries(fields.map((f) => [f.key, f.defaultValue ?? '']));
  const [form, setForm] = useState(initial);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    setForm(initial);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.key} className={field.full ? 'col-span-2' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  rows={field.rows || 3}
                  required={field.required}
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className={`${INPUT} w-full`}
                />
              ) : field.options ? (
                <select
                  required={field.required}
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className={`${INPUT} w-full`}
                >
                  <option value="">-- 请选择 --</option>
                  {field.options.map((opt) => (
                    <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type || 'text'}
                  min={field.min}
                  required={field.required}
                  readOnly={field.readOnly}
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className={`${INPUT} w-full ${field.readOnly ? 'bg-gray-50 text-gray-500' : ''}`}
                />
              )}
            </div>
          ))}
        </div>
        {note && <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700">{note}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">{submitText}</button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmModal({ isOpen, onClose, title, text, onConfirm, danger = false }) {
  const [reason, setReason] = useState('');
  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
    onClose();
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-gray-700">{text}</p>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="填写原因或备注"
          className={`${INPUT} w-full`}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button onClick={handleConfirm} className={`px-4 py-2 text-sm text-white rounded ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-800'}`}>确认</button>
        </div>
      </div>
    </Modal>
  );
}

// 项目成员配置弹窗：展示/编辑项目成员与成员角色，说明「项目成员决定项目数据操作范围」。
function MemberConfigModal({ isOpen, onClose, project, onSave }) {
  const [members, setMembers] = useState(() => (project?.members || []).map((m) => ({ ...m })));
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('生产协同');
  if (!project) return null;

  const owner = project.manager || members.find((m) => m.role === '项目负责人')?.name || '—';
  const addMember = () => {
    if (!newName || members.some((m) => m.name === newName)) return;
    setMembers([...members, { name: newName, role: newRole }]);
    setNewName('');
  };
  const removeMember = (name) => setMembers(members.filter((m) => m.name !== name));
  const changeRole = (name, role) => setMembers(members.map((m) => (m.name === name ? { ...m, role } : m)));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="配置项目成员" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><div className="text-xs text-gray-400 mb-1">项目名称</div><div className="text-gray-800 font-medium">{project.name}</div></div>
          <div><div className="text-xs text-gray-400 mb-1">当前项目负责人</div><div className="text-gray-800 font-medium">{owner}</div></div>
        </div>

        <div>
          <div className="text-xs font-medium text-gray-500 mb-2">项目成员列表（{members.length} 人）</div>
          <div className="border border-gray-200 rounded divide-y divide-gray-100">
            {members.length === 0 && <div className="px-3 py-4 text-center text-sm text-gray-400">暂无项目成员，请在下方添加</div>}
            {members.map((mem) => (
              <div key={mem.name} className="flex items-center gap-3 px-3 py-2">
                <span className="w-7 h-7 rounded-full bg-slate-600 text-white text-xs flex items-center justify-center flex-shrink-0">{mem.name.slice(-2)}</span>
                <span className="text-sm text-gray-800 w-14">{mem.name}</span>
                <select className={`${INPUT} text-xs flex-1`} value={mem.role} onChange={(e) => changeRole(mem.name, e.target.value)}>
                  {MEMBER_ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
                <button type="button" onClick={() => removeMember(mem.name)} className="text-red-400 hover:text-red-600 text-xs">移除</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-gray-500 mb-2">添加成员</div>
          <div className="flex items-center gap-2">
            <select className={`${INPUT} flex-1`} value={newName} onChange={(e) => setNewName(e.target.value)}>
              <option value="">-- 选择成员 --</option>
              {MEMBER_CANDIDATES.filter((n) => !members.some((m) => m.name === n)).map((n) => <option key={n}>{n}</option>)}
            </select>
            <select className={`${INPUT} flex-1`} value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              {MEMBER_ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
            <button type="button" onClick={addMember} className={BTN_GHOST}>添加</button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700">
          只有项目成员可以查看或操作该项目下的生产计划、交付计划、设备、点位、质量问题和工单。管理员不受此限制。
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="button" onClick={() => { onSave(members); onClose(); }} className={BTN_PRIMARY}>保存成员配置</button>
        </div>
      </div>
    </Modal>
  );
}

/* ═════════ 项目列表 ═════════ */
function ProjectListTab() {
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [target, setTarget] = useState(null);
  const [filters, setFilters] = useState({
    keyword: '', status: '', projectType: '', owner: '', customer: '', erpLinked: '', createdFrom: '', createdTo: '',
  });

  const productionPlans = [...(state.workflowProductionPlans || []), ...(state.productionPlans || [])];
  const deliveryPlans = state.deliveryPlans || [];
  const owners = [...new Set(state.projects.map((p) => p.manager).filter(Boolean))];
  const customers = [...new Set(state.projects.map((p) => p.client).filter(Boolean))];

  const rows = state.projects.map((project) => {
    const status = normalizeProjectStatus(project, productionPlans, deliveryPlans);
    // 生产进度口径：已入库及其下游状态设备数（封顶目标数），最能反映“已生产入库”的可信口径。
    const stored = state.devices.filter((d) => {
      const plan = productionPlans.find((p) => p.id === d.productionPlanId);
      return plan?.projectId === project.id && ['已入库', '待分配项目', '已分配项目', '在线运营'].includes(d.status);
    }).length;
    const accepted = deliveryPlans
      .filter((plan) => plan.projectId === project.id)
      .reduce((sum, plan) => sum + (plan.records?.customerAccept || []).filter(isPass).length, 0);
    return {
      ...project,
      status,
      producedDone: Math.min(stored, project.targetCount || 0),
      deliveryDone: Math.min(accepted, project.targetCount || 0),
      erpLinked: Boolean(project.erpPurchaseOrderNo || project.erpProjectNo),
    };
  });

  const filtered = rows.filter((p) => {
    const keyword = filters.keyword.trim().toLowerCase();
    const created = (p.createdAt || '').slice(0, 10);
    return (!keyword || p.name.toLowerCase().includes(keyword) || p.id.toLowerCase().includes(keyword))
      && (!filters.status || p.status === filters.status)
      && (!filters.projectType || p.projectType === filters.projectType)
      && (!filters.owner || p.manager === filters.owner)
      && (!filters.customer || p.client === filters.customer)
      && (!filters.erpLinked || (filters.erpLinked === 'yes' ? p.erpLinked : !p.erpLinked))
      && (!filters.createdFrom || created >= filters.createdFrom)
      && (!filters.createdTo || created <= filters.createdTo);
  });
  const paged = usePaged(filtered, 10);

  const openModal = (name, project = null) => {
    setTarget(project);
    setModal(name);
  };
  const resetFilters = () => setFilters({ keyword: '', status: '', projectType: '', owner: '', customer: '', erpLinked: '', createdFrom: '', createdTo: '' });

  const writeProjectLog = (projectId, actionType, notes, fromStatus = '', toStatus = '') => {
    dispatch({
      type: 'ADD_OPERATION_LOG',
      payload: {
        id: `LOG-${Date.now()}-${projectId}`,
        projectId,
        operator: state.currentUser,
        timestamp: nowText(),
        actionType,
        fromStatus,
        toStatus,
        notes,
      },
    });
  };

  const actionButtons = (project) => {
    const view = <LinkAction onClick={() => navigate(`/projects/${project.id}`)}>查看</LinkAction>;
    const edit = <LinkAction onClick={() => openModal('editProject', project)}>编辑</LinkAction>;
    const membersBtn = <LinkAction onClick={() => openModal('members', project)}>配置成员</LinkAction>;
    const newProduction = <LinkAction onClick={() => openModal('createProduction', project)}>新建生产计划</LinkAction>;
    const newDelivery = <LinkAction onClick={() => openModal('createDelivery', project)}>新建交付计划</LinkAction>;
    const voidBtn = <LinkAction onClick={() => openModal('void', project)}>作废</LinkAction>;
    const closeBtn = <LinkAction onClick={() => openModal('close', project)}>关闭</LinkAction>;
    const logsBtn = <LinkAction onClick={() => navigate(`/projects/${project.id}`)}>查看日志</LinkAction>;

    const map = {
      未开始: [view, edit, membersBtn, newProduction, voidBtn],
      进行中: [view, edit, membersBtn, newProduction, newDelivery, voidBtn, logsBtn],
      已交付: [view, membersBtn, closeBtn, logsBtn],
      已关闭: [view, logsBtn],
      已作废: [view, logsBtn],
    };
    return <div className="flex items-center gap-x-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>{(map[project.status] || [view]).map((node, i) => <span key={i}>{node}</span>)}</div>;
  };

  return (
    <Page>
      <PageHeader
        title="项目列表"
        description="围绕项目、生产计划与交付计划追踪设备全生命周期质量进度。"
        actions={canDo('add_project') && <Btn variant="primary" onClick={() => openModal('newProject')}>新建项目</Btn>}
      />

      <Toolbar right={<><span className="text-xs text-gray-400">共 {filtered.length} 个项目</span><Btn variant="ghost" size="sm" onClick={resetFilters}>重置</Btn></>}>
        <SearchInput className="w-60" placeholder="项目名称 / 项目ID" value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} />
        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">全部状态</option>{PROJECT_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Select value={filters.projectType} onChange={(e) => setFilters({ ...filters, projectType: e.target.value })}>
          <option value="">全部项目类型</option>{PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
        </Select>
        <Select value={filters.owner} onChange={(e) => setFilters({ ...filters, owner: e.target.value })}>
          <option value="">全部负责人</option>{owners.map((o) => <option key={o}>{o}</option>)}
        </Select>
        <Select value={filters.customer} onChange={(e) => setFilters({ ...filters, customer: e.target.value })}>
          <option value="">全部客户</option>{customers.map((c) => <option key={c}>{c}</option>)}
        </Select>
        <Select value={filters.erpLinked} onChange={(e) => setFilters({ ...filters, erpLinked: e.target.value })}>
          <option value="">ERP 不限</option>
          <option value="yes">已关联 ERP</option>
          <option value="no">未关联 ERP</option>
        </Select>
        <Input type="date" value={filters.createdFrom} onChange={(e) => setFilters({ ...filters, createdFrom: e.target.value })} />
        <Input type="date" value={filters.createdTo} onChange={(e) => setFilters({ ...filters, createdTo: e.target.value })} />
      </Toolbar>

      <Table
        head={['项目ID', '项目名称', '项目类型 / 业务场景', '客户', '负责人', '项目成员', '状态', '生产进度', '交付进度', 'ERP 状态', '操作']}
        empty="暂无匹配项目"
        footer={<Pagination page={paged.page} total={paged.total} totalPages={paged.totalPages} onChange={paged.setPage} />}
      >
        {paged.pageItems.map((project) => (
          <tr key={project.id} onClick={() => navigate(`/projects/${project.id}`)} className="hover:bg-[#fafafa] cursor-pointer">
            <td className="px-3 py-2 font-mono text-xs text-gray-500 whitespace-nowrap">{project.id}</td>
            <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{project.name}</td>
            <td className="px-3 py-2 whitespace-nowrap">{project.projectType ? <Chip>{project.projectType}</Chip> : '—'}</td>
            <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{project.client || '—'}</td>
            <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{project.manager || '—'}</td>
            <td className="px-3 py-2 whitespace-nowrap">
              {(() => {
                const mems = project.members || [];
                if (mems.length === 0) return <span className="text-gray-400 text-xs">未配置</span>;
                return (
                  <div className="flex items-center gap-1">
                    {mems.slice(0, 3).map((mem) => <span key={mem.name} className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{mem.name}</span>)}
                    {mems.length > 3 && <span className="text-xs text-gray-400">+{mems.length - 3}</span>}
                  </div>
                );
              })()}
            </td>
            <td className="px-3 py-2"><StatusBadge status={project.status} /></td>
            <td className="px-3 py-2">{progressBar(project.producedDone, project.targetCount, 'bg-blue-500')}</td>
            <td className="px-3 py-2">{progressBar(project.deliveryDone, project.targetCount, 'bg-emerald-500')}</td>
            <td className="px-3 py-2">{erpChip(project.erpLinked)}</td>
            <td className="px-3 py-2">{actionButtons(project)}</td>
          </tr>
        ))}
      </Table>

      <SimpleFormModal
        key="new-project"
        isOpen={modal === 'newProject'}
        onClose={() => setModal(null)}
        title="新建项目"
        fields={[
          { key: 'name', label: '项目名称 *', required: true },
          { key: 'projectType', label: '项目类型 / 业务场景', options: PROJECT_TYPES },
          { key: 'client', label: '客户' },
          { key: 'manager', label: '负责人', options: ['张三', '李四', '王五', '赵六', '蔡八'] },
          { key: 'targetCount', label: '目标设备数 *', type: 'number', min: 1, defaultValue: 1, required: true },
          { key: 'erpProjectNo', label: 'ERP 项目号' },
          { key: 'background', label: '项目背景', type: 'textarea', full: true },
        ]}
        onSubmit={(form) => {
          const project = {
            id: `PROJ-${Date.now().toString().slice(-6)}`,
            ...form,
            targetCount: Number(form.targetCount || 1),
            status: '未开始',
            createdAt: nowText(),
            updatedAt: nowText(),
          };
          dispatch({ type: 'ADD_PROJECT', payload: project });
          writeProjectLog(project.id, '新建项目', '项目初始化', '', '未开始');
        }}
      />

      <SimpleFormModal
        key={`edit-${target?.id || 'none'}`}
        isOpen={modal === 'editProject'}
        onClose={() => setModal(null)}
        title="编辑项目"
        fields={[
          { key: 'name', label: '项目名称 *', defaultValue: target?.name || '', required: true },
          { key: 'projectType', label: '项目类型 / 业务场景', options: PROJECT_TYPES, defaultValue: target?.projectType || '' },
          { key: 'client', label: '客户', defaultValue: target?.client || '' },
          { key: 'manager', label: '负责人', defaultValue: target?.manager || '', options: ['张三', '李四', '王五', '赵六', '蔡八'] },
          { key: 'targetCount', label: '目标设备数 *', type: 'number', min: 1, defaultValue: target?.targetCount || 1, required: true },
          { key: 'erpProjectNo', label: 'ERP 项目号', defaultValue: target?.erpProjectNo || '' },
          { key: 'notes', label: '备注', type: 'textarea', full: true, defaultValue: target?.notes || '' },
        ]}
        onSubmit={(form) => {
          dispatch({ type: 'UPDATE_PROJECT', payload: { id: target.id, ...form, targetCount: Number(form.targetCount || 1), updatedAt: nowText() } });
          writeProjectLog(target.id, '编辑项目', '更新项目基础信息');
        }}
      />

      <SimpleFormModal
        key={`production-${target?.id || 'none'}`}
        isOpen={modal === 'createProduction'}
        onClose={() => setModal(null)}
        title="新建生产计划"
        fields={[
          { key: 'projectName', label: '所属项目', defaultValue: target?.name || '', readOnly: true },
          { key: 'name', label: '生产计划名称 *', defaultValue: target ? `${target.name}Q2批次生产` : '', required: true },
          { key: 'batchNo', label: '生产批次 / 计划批次', defaultValue: 'Q2' },
          { key: 'deviceType', label: '设备类型 *', required: true, options: ['AlphaBot 1', 'AlphaBot 2', 'AlphaBot 1S'], defaultValue: 'AlphaBot 1' },
          { key: 'targetCount', label: '计划数量 *', type: 'number', min: 1, defaultValue: target?.targetCount || 1, required: true },
          { key: 'owner', label: '负责人 *', required: true, options: ['张三', '李四', '王五', '赵六'], defaultValue: target?.manager || '张三' },
          { key: 'creator', label: '创建人', defaultValue: state.currentUser, readOnly: true },
          { key: 'startDate', label: '计划开始时间', type: 'date' },
          { key: 'endDate', label: '计划结束时间', type: 'date' },
          { key: 'erpProductionOrderNo', label: '关联 ERP 生产订单号' },
          { key: 'notes', label: '备注', type: 'textarea', full: true },
        ]}
        onSubmit={(form) => {
          const plan = {
            id: `PP-${Date.now().toString().slice(-6)}`,
            projectId: target.id,
            status: '生产中',
            currentNode: '来料准备',
            createdAt: nowText(),
            ...form,
            targetCount: Number(form.targetCount || 1),
          };
          dispatch({ type: 'ADD_PRODUCTION_PLAN', payload: plan });
          dispatch({ type: 'UPDATE_PROJECT', payload: { id: target.id, status: '进行中', updatedAt: nowText() } });
          writeProjectLog(target.id, '创建生产计划', `创建 ${plan.name}`, target.status, '进行中');
        }}
      />

      <SimpleFormModal
        key={`delivery-${target?.id || 'none'}`}
        isOpen={modal === 'createDelivery'}
        onClose={() => setModal(null)}
        title="新建交付计划"
        fields={[
          { key: 'name', label: '交付计划名称 *', defaultValue: target ? `${target.name}交付计划` : '', required: true },
          { key: 'batchNo', label: '交付批次', defaultValue: target ? `BATCH-${target.id}` : 'BATCH-NEW' },
          { key: 'targetCount', label: '计划交付数量 *', type: 'number', min: 1, defaultValue: target?.targetCount || 1, required: true },
          { key: 'owner', label: '负责人', options: ['张三', '李四', '王五', '赵六'] },
          { key: 'factoryDate', label: '计划出厂时间', type: 'date' },
          { key: 'acceptanceDate', label: '计划客户验收时间', type: 'date' },
        ]}
        onSubmit={(form) => {
          const plan = {
            id: `DP-${Date.now().toString().slice(-6)}`,
            projectId: target.id,
            status: '交付中',
            currentNode: '绑定设备',
            dueDate: form.acceptanceDate,
            records: { binding: [], factoryInspection: [], siteInstall: [], customerAccept: [] },
            ...form,
            targetCount: Number(form.targetCount || 1),
          };
          dispatch({ type: 'ADD_DELIVERY_PLAN', payload: plan });
          writeProjectLog(target.id, '创建交付计划', `创建 ${plan.name}`);
        }}
      />

      <ConfirmModal
        isOpen={modal === 'void'}
        onClose={() => setModal(null)}
        title="作废项目"
        danger
        text={`确认作废项目「${target?.name || ''}」？作废后仍保留历史记录。`}
        onConfirm={(reason) => {
          dispatch({ type: 'UPDATE_PROJECT', payload: { id: target.id, status: '已作废', voided: true, voidReason: reason, updatedAt: nowText() } });
          writeProjectLog(target.id, '作废项目', reason || '项目作废', target.status, '已作废');
        }}
      />

      <ConfirmModal
        isOpen={modal === 'close'}
        onClose={() => setModal(null)}
        title="关闭项目"
        text={`确认关闭项目「${target?.name || ''}」？`}
        onConfirm={(reason) => {
          dispatch({ type: 'UPDATE_PROJECT', payload: { id: target.id, status: '已关闭', closeReason: reason, closedAt: nowText(), updatedAt: nowText() } });
          writeProjectLog(target.id, '关闭项目', reason || '项目关闭', target.status, '已关闭');
        }}
      />

      {modal === 'members' && (
        <MemberConfigModal
          key={`members-${target?.id || 'none'}`}
          isOpen
          onClose={() => setModal(null)}
          project={target}
          onSave={(members) => {
            dispatch({ type: 'UPDATE_PROJECT', payload: { id: target.id, members, updatedAt: nowText() } });
            writeProjectLog(target.id, '配置项目成员', `更新项目成员（${members.length} 人）`);
          }}
        />
      )}
    </Page>
  );
}

/* ═════════ 生产计划 ═════════ */
function ProductionPlanTab() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ keyword: '', projectId: '', deviceType: '', status: '', owner: '', delayed: '' });
  const [placeholder, setPlaceholder] = useState(null);
  const [editPlan, setEditPlan] = useState(null);
  // 生产计划列表只展示流程型生产计划 (WPP-*)。PLAN-* 属于日产能数据，不混入此列表。
  const plans = state.workflowProductionPlans || [];
  const projects = state.projects || [];

  const typeName = (plan) => state.deviceTypes.find((t) => t.id === plan.deviceTypeId)?.name || plan.deviceType || 'AlphaBot 1';

  const enriched = plans.map((plan) => {
    const devices = state.devices.filter((d) => d.productionPlanId === plan.id);
    const stored = devices.filter((d) => ['已入库', '待分配项目', '已分配项目', '在线运营'].includes(d.status)).length;
    const status = productionPlanStatus(plan);
    const currentNode = plan.currentNode || (status === '已完成' ? '整机入库' : PRODUCTION_NODES[Math.min(Math.floor(stored / Math.max(plan.targetCount || 1, 1) * 4), 3)]);
    const openRepairs = (state.productionWorkOrders || []).filter((w) => w.productionPlanId === plan.id && !['已关闭', '已作废', '已完成'].includes(w.status)).length;
    const project = projects.find((p) => p.id === plan.projectId);
    return {
      ...plan,
      status,
      projectName: project?.name || '—',
      deviceType: typeName(plan),
      owner: plan.owner || project?.manager || '—',
      stored: Math.min(stored, plan.targetCount || 0),
      currentNode,
      bottleneck: planBottleneck(plan, status, devices, openRepairs),
      delayed: status === '已延期',
    };
  });

  const owners = [...new Set(enriched.map((p) => p.owner).filter((o) => o && o !== '—'))];
  const deviceTypeNames = [...new Set(enriched.map((p) => p.deviceType))];
  const erpOrderNos = [...new Set(plans.map((p) => p.erpProductionOrderNo).filter(Boolean))];

  const filtered = enriched.filter((plan) => {
    const kw = filters.keyword.trim().toLowerCase();
    return (!kw || plan.id.toLowerCase().includes(kw) || plan.projectName.toLowerCase().includes(kw) || (plan.name || '').toLowerCase().includes(kw))
      && (!filters.projectId || plan.projectId === filters.projectId)
      && (!filters.deviceType || plan.deviceType === filters.deviceType)
      && (!filters.status || plan.status === filters.status)
      && (!filters.owner || plan.owner === filters.owner)
      && (!filters.delayed || (filters.delayed === 'yes' ? plan.delayed : !plan.delayed));
  });
  const paged = usePaged(filtered, 10);

  const stop = (e) => e.stopPropagation();
  // 生产计划已取消唯一当前节点，列表不再提供"进入当前节点"操作。
  const delayedCount = enriched.filter((p) => p.delayed).length;

  return (
    <Page>
      <PageHeader title="生产计划" description="流程型生产计划（WPP）列表，跟踪来料、装配、测试与入库四节点。" />

      <StatGrid cols={4}>
        <StatCard label="计划总数" value={enriched.length} />
        <StatCard label="生产中" value={enriched.filter((p) => p.status === '生产中').length} />
        <StatCard label="已完成" value={enriched.filter((p) => p.status === '已完成').length} tone="success" />
        <StatCard label="延期计划" value={delayedCount} tone={delayedCount ? 'danger' : 'default'} />
      </StatGrid>

      <Toolbar>
        <SearchInput className="w-56" placeholder="计划ID / 名称 / 项目" value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} />
        <Select value={filters.projectId} onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}>
          <option value="">所属项目</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select value={filters.deviceType} onChange={(e) => setFilters({ ...filters, deviceType: e.target.value })}>
          <option value="">全部设备类型</option>{deviceTypeNames.map((t) => <option key={t}>{t}</option>)}
        </Select>
        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">全部状态</option>{PRODUCTION_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Select value={filters.owner} onChange={(e) => setFilters({ ...filters, owner: e.target.value })}>
          <option value="">全部负责人</option>{owners.map((o) => <option key={o}>{o}</option>)}
        </Select>
        <Select value={filters.delayed} onChange={(e) => setFilters({ ...filters, delayed: e.target.value })}>
          <option value="">是否延期</option>
          <option value="yes">已延期</option>
          <option value="no">未延期</option>
        </Select>
      </Toolbar>

      <Table
        head={['生产计划ID', '计划名称', '所属项目', '设备类型', '计划数量', '已入库', '计划周期', '当前卡点', '状态', '负责人', 'ERP 生产订单号', '操作']}
        empty="暂无匹配生产计划"
        footer={<Pagination page={paged.page} total={paged.total} totalPages={paged.totalPages} onChange={paged.setPage} />}
      >
        {paged.pageItems.map((plan) => (
          <tr key={plan.id} onClick={() => navigate(`/production-plans/${plan.id}`)} className="hover:bg-[#fafafa] cursor-pointer">
            <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{plan.id}</td>
            <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{plan.name || '—'}</td>
            <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{plan.projectName}</td>
            <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{plan.deviceType}</td>
            <td className="px-3 py-2 text-gray-600">{plan.targetCount || 0}</td>
            <td className="px-3 py-2 text-gray-600">{plan.stored}</td>
            <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{(plan.createdAt || '').slice(0, 10)} ~ {plan.endDate || '—'}</td>
            <td className="px-3 py-2"><StatusBadge status={plan.bottleneck} /></td>
            <td className="px-3 py-2"><StatusBadge status={plan.status} /></td>
            <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{plan.owner}</td>
            <td className="px-3 py-2 font-mono text-xs text-gray-500 whitespace-nowrap">{plan.erpProductionOrderNo || '—'}</td>
            <td className="px-3 py-2 text-xs whitespace-nowrap" onClick={stop}>
              <div className="flex items-center gap-x-3">
                <LinkAction onClick={() => navigate(`/production-plans/${plan.id}`)}>查看</LinkAction>
                <LinkAction onClick={() => setEditPlan(plan)}>编辑</LinkAction>
                {!['已完成', '已作废'].includes(plan.status) && (
                  <LinkAction onClick={() => setPlaceholder({ title: '作废生产计划', text: `作废「${plan.name || plan.id}」的入口已保留，后续接入审批流程。` })}>作废</LinkAction>
                )}
                <LinkAction onClick={() => navigate(`/projects/${plan.projectId}`)}>查看日志</LinkAction>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <Modal isOpen={!!placeholder} onClose={() => setPlaceholder(null)} title={placeholder?.title || ''}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{placeholder?.text}</p>
          <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700">本阶段以可演示的流程结构为主，动作入口先占位。</div>
          <div className="flex justify-end"><button onClick={() => setPlaceholder(null)} className={BTN_PRIMARY}>知道了</button></div>
        </div>
      </Modal>

      {editPlan && (
        <SimpleFormModal
          key={`edit-plan-${editPlan.id}`}
          isOpen
          onClose={() => setEditPlan(null)}
          title="编辑生产计划"
          note="ERP 生产订单、工单、产品入库、产品检验状态来自 ERP，只读同步，不能在平台编辑。"
          fields={[
            { key: 'name', label: '生产计划名称 *', required: true, defaultValue: editPlan.name || '' },
            { key: 'projectId', label: '所属项目', options: projects.map((p) => ({ value: p.id, label: p.name })), defaultValue: editPlan.projectId || '' },
            { key: 'owner', label: '负责人', options: ['张三', '李四', '王五', '赵六'], defaultValue: editPlan.owner || '' },
            { key: 'targetCount', label: '计划数量 *', type: 'number', min: 1, required: true, defaultValue: editPlan.targetCount || 1 },
            { key: 'startDate', label: '计划开始时间', type: 'date', defaultValue: editPlan.startDate || '' },
            { key: 'endDate', label: '计划完成时间', type: 'date', defaultValue: editPlan.endDate || '' },
            { key: 'enabled', label: '是否启用', options: ['启用', '停用'], defaultValue: editPlan.enabled === false ? '停用' : '启用' },
            { key: 'erpProductionOrderNo', label: '绑定 / 更换 ERP 工单（选择绑定，只读引用）', options: erpOrderNos, defaultValue: editPlan.erpProductionOrderNo || '' },
            { key: 'notes', label: '备注', type: 'textarea', full: true, defaultValue: editPlan.notes || '' },
          ]}
          onSubmit={(form) => {
            dispatch({
              type: 'UPDATE_PRODUCTION_PLAN',
              payload: {
                id: editPlan.id,
                name: form.name,
                projectId: form.projectId,
                owner: form.owner,
                targetCount: Number(form.targetCount || 0),
                startDate: form.startDate,
                endDate: form.endDate,
                notes: form.notes,
                enabled: form.enabled !== '停用',
                erpProductionOrderNo: form.erpProductionOrderNo,
                updatedAt: nowText(),
              },
            });
            dispatch({
              type: 'ADD_OPERATION_LOG',
              payload: {
                id: `LOG-${Date.now()}-${editPlan.id}`,
                productionPlanId: editPlan.id,
                projectId: form.projectId || editPlan.projectId,
                operator: state.currentUser,
                timestamp: nowText(),
                actionType: '编辑生产计划',
                fromStatus: '',
                toStatus: '',
                notes: `更新生产计划平台字段：${form.name}`,
              },
            });
          }}
        />
      )}
    </Page>
  );
}

/* ═════════ 交付计划：操作弹窗（仅交付 tab 使用） ═════════ */
const DELIVERY_BINDABLE_STATUSES = ['已入库', '待分配项目', '已分配项目'];
const DELIVERY_VOID_REASONS = ['客户取消', '项目变更', '重复创建', '计划信息错误', '设备无法交付', '其他'];
const DELIVERY_OWNERS = ['张三', '李四', '王五', '赵六'];

// 交付子工单状态归一：把合成状态映射到统一处理阶段（决定右侧任务区提供哪些操作）。
function normalizeSubOrderStatus(status) {
  const map = {
    未开始: '待分派',
    待分派: '待分派',
    待出厂检验: '待分派',
    待接单: '待接单',
    待上门: '待上门',
    已出厂: '待上门',
    进行中: '现场执行中',
    现场执行中: '现场执行中',
    现场处理中: '现场执行中',
    待客户验收: '现场执行中',
    存在异常: '存在异常',
    安装异常: '存在异常',
    验收异常: '存在异常',
    不可出厂: '存在异常',
    已完成: '已完成',
    已验收: '已完成',
  };
  return map[status] || '现场执行中';
}

// 各处理阶段：当前待处理动作 / 下一步建议 / 状态化操作按钮（原型占位）。
// op.to → 页面跳转；op.toast → 自定义提示；否则默认「原型环境：{label} · {子工单号}」提示。
const SUBORDER_PHASE_OPS = {
  待分派: {
    action: '待分派现场工程师',
    next: '为该子工单分派现场工程师，分派后进入接单环节',
    ops: [{ label: '分派工程师' }],
  },
  待接单: {
    action: '等待工程师接单',
    next: '工程师接单后进入上门排期；如需可改派其他工程师',
    ops: [{ label: '工程师接单' }, { label: '改派工程师' }],
  },
  待上门: {
    action: '等待工程师上门 / 到场',
    next: '工程师到场后记录上门时间，进入现场执行',
    ops: [{ label: '记录上门 / 到场' }],
  },
  现场执行中: {
    action: '现场执行中',
    next: '更新进度、上传交付资料，完成后提交完成',
    ops: [{ label: '更新进度' }, { label: '上传资料' }, { label: '记录异常' }, { label: '提交完成' }],
  },
  存在异常: {
    action: '存在交付异常，待处理',
    next: '记录异常进展，或提交技术客服预处理生成问题池记录',
    ops: [
      { label: '记录异常进展' },
      { label: '提交技术客服预处理', toast: '原型环境：提交技术客服预处理，将生成问题池记录（在交付计划详情页执行完整流程）' },
      { label: '查看关联问题', to: '/after-sales?tab=issues' },
    ],
  },
  已完成: {
    action: '子工单已完成',
    next: '可查看交付资料与操作日志',
    ops: [{ label: '查看资料' }, { label: '查看日志' }],
  },
};

// 绑定设备集合：boundDeviceIds ∪ records.binding。
function deliveryBoundIds(plan) {
  const explicit = plan.boundDeviceIds || [];
  const binding = (plan.records?.binding || []).map((r) => r.deviceId);
  return [...new Set([...explicit, ...binding].filter(Boolean))];
}

// 设备部署子工单当前状态（与交付计划详情口径一致）。
function deliveryDeployStatus(recs, deviceId) {
  const ca = (recs.customerAccept || []).find((r) => r.deviceId === deviceId);
  const si = (recs.siteInstall || []).find((r) => r.deviceId === deviceId);
  const fi = (recs.factoryInspection || []).find((r) => r.deviceId === deviceId);
  if (ca) return isPass(ca) ? '已验收' : '验收异常';
  if (si) return isPass(si) ? '待客户验收' : '安装异常';
  if (fi) return isPass(fi) ? '已出厂' : '不可出厂';
  return '待出厂检验';
}

function deviceTypeName(state, id) {
  return (state.deviceTypes || []).find((t) => t.id === id)?.name || '—';
}
function prodPlanName(state, id) {
  const plans = [...(state.workflowProductionPlans || []), ...(state.productionPlans || [])];
  return plans.find((p) => p.id === id)?.name || id || '—';
}
function inspectBadge(v) {
  return v ? <StatusBadge status={v} /> : <span className="text-gray-400">—</span>;
}

// 管理交付设备：已绑定 / 可绑定两张表，绑定/解绑更新本地集合并 dispatch UPDATE_DELIVERY_PLAN(boundDeviceIds)。
function ManageDeliveryDevicesModal({ planId, state, dispatch, onClose, onToast }) {
  const devices = state.devices || [];
  const plan = (state.deliveryPlans || []).find((p) => p.id === planId);
  const project = (state.projects || []).find((p) => p.id === plan?.projectId);
  const [boundIds, setBoundIds] = useState(() => (plan ? deliveryBoundIds(plan) : []));

  const boundDevices = boundIds.map((id) => devices.find((d) => d.id === id)).filter(Boolean);
  const otherBound = new Set();
  (state.deliveryPlans || []).forEach((p) => {
    if (p.id !== planId) deliveryBoundIds(p).forEach((id) => otherBound.add(id));
  });
  const bindable = devices.filter((d) => DELIVERY_BINDABLE_STATUSES.includes(d.status) && !boundIds.includes(d.id));

  const boundPaged = usePaged(boundDevices, 6);
  const bindablePaged = usePaged(bindable, 6);

  if (!plan) return null;

  const persist = (next, msg) => {
    setBoundIds(next);
    dispatch({ type: 'UPDATE_DELIVERY_PLAN', payload: { id: plan.id, boundDeviceIds: next, updatedAt: nowText() } });
    onToast(msg);
  };
  const bindDev = (d) => { if (!boundIds.includes(d.id)) persist([...boundIds, d.id], `已绑定设备 ${d.sn}`); };
  const unbindDev = (d) => persist(boundIds.filter((x) => x !== d.id), `已解绑设备 ${d.sn}`);

  return (
    <Modal isOpen onClose={onClose} title="管理交付设备" size="xl">
      <div className="space-y-5">
        <DescList
          cols={4}
          items={[
            ['交付计划编号', <span className="font-mono text-xs">{plan.id}</span>],
            ['所属项目', project?.name || '—'],
            ['当前已绑定设备数', `${boundDevices.length} 台`],
            ['计划交付数量', plan.targetCount != null ? `${plan.targetCount} 台` : '—'],
          ]}
        />

        <div>
          <div className="text-[13px] font-semibold text-gray-800 mb-2">已绑定设备（{boundDevices.length}）</div>
          <Table
            head={['设备SN', '机器人型号', '当前状态', '所属生产计划', '出厂检验状态', '操作']}
            empty="暂无已绑定设备"
            footer={<Pagination page={boundPaged.page} total={boundPaged.total} totalPages={boundPaged.totalPages} pageSize={6} onChange={boundPaged.setPage} />}
          >
            {boundPaged.pageItems.map((d) => (
              <tr key={d.id} className="hover:bg-[#fafafa]">
                <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-gray-700">{d.sn}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{deviceTypeName(state, d.deviceTypeId)}</td>
                <td className="px-3 py-2"><StatusBadge status={d.status} /></td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-600">{prodPlanName(state, d.productionPlanId)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{inspectBadge(d.erpInspectionStatus)}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-x-3">
                    <LinkAction onClick={() => unbindDev(d)}>解绑</LinkAction>
                    <LinkAction to={`/devices/${d.id}`}>查看设备详情</LinkAction>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </div>

        <div>
          <div className="text-[13px] font-semibold text-gray-800 mb-1">可绑定设备（{bindable.length}）</div>
          <div className="text-xs text-gray-400 mb-2">已入库 / 待分配项目 / 已分配项目 且未绑定本计划的设备。</div>
          <Table
            head={['设备SN', '机器人型号', '当前状态', '所属生产计划', '出厂检验状态', '是否已绑定其他交付计划', '操作']}
            empty="暂无可绑定设备"
            footer={<Pagination page={bindablePaged.page} total={bindablePaged.total} totalPages={bindablePaged.totalPages} pageSize={6} onChange={bindablePaged.setPage} />}
          >
            {bindablePaged.pageItems.map((d) => {
              const elsewhere = otherBound.has(d.id) || (d.deliveryPlanId && d.deliveryPlanId !== plan.id);
              return (
                <tr key={d.id} className="hover:bg-[#fafafa]">
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-gray-700">{d.sn}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-700">{deviceTypeName(state, d.deviceTypeId)}</td>
                  <td className="px-3 py-2"><StatusBadge status={d.status} /></td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-600">{prodPlanName(state, d.productionPlanId)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{inspectBadge(d.erpInspectionStatus)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{elsewhere ? <Chip tone="outline">是</Chip> : <span className="text-gray-400">否</span>}</td>
                  <td className="px-3 py-2 whitespace-nowrap"><LinkAction onClick={() => bindDev(d)}>绑定</LinkAction></td>
                </tr>
              );
            })}
          </Table>
        </div>

        <div className="flex justify-end"><button onClick={onClose} className={BTN_PRIMARY}>完成</button></div>
      </div>
    </Modal>
  );
}

// 管理交付子工单：由计划记录合成子工单（智魔方含前置准备，均按设备生成部署子工单），操作为原型占位轻提示。
function ManageDeliverySubOrdersModal({ planId, state, onClose, onToast }) {
  const plan = (state.deliveryPlans || []).find((p) => p.id === planId);
  const project = (state.projects || []).find((p) => p.id === plan?.projectId);
  const devices = state.devices || [];
  const recs = plan?.records || {};
  const boundDevices = (plan ? deliveryBoundIds(plan) : []).map((id) => devices.find((d) => d.id === id)).filter(Boolean);
  const isZhimofang = project?.projectType === '智魔方';
  const templateName = plan?.templateName || (isZhimofang ? '智魔方交付流程模板' : '通用部署流程模板');

  const preAdvanced = (recs.factoryInspection || []).length > 0 || ['出厂检验', '现场安装调试', '客户验收'].includes(plan?.currentNode);
  const preStarted = (recs.binding || []).length > 0;
  const preOrders = isZhimofang ? [{
    id: `PRE-${plan.id}`,
    type: '前置准备子工单',
    deviceSN: '—',
    status: preAdvanced ? '已完成' : preStarted ? '进行中' : '未开始',
    owner: plan.owner || '—',
    eta: plan.factoryDate || plan.siteInstallDate || '—',
    actual: preAdvanced ? (plan.siteInstallDate || '—') : '—',
    updated: plan.updatedAt || '—',
  }] : [];
  const deployOrders = boundDevices.map((d) => {
    const si = (recs.siteInstall || []).find((r) => r.deviceId === d.id);
    return {
      id: `DEP-${plan.id}-${d.id}`,
      type: '机器人 / 设备部署子工单',
      deviceSN: d.sn,
      status: deliveryDeployStatus(recs, d.id),
      owner: si?.operator || plan.owner || '—',
      eta: plan.siteInstallDate || '—',
      actual: si?.time || '—',
      updated: d.updatedAt || '—',
    };
  });
  const orders = [...preOrders, ...deployOrders];

  const [selectedId, setSelectedId] = useState(orders[0]?.id);

  if (!plan) return null;

  const selectedOrder = orders.find((o) => o.id === selectedId) || orders[0];
  const phase = selectedOrder ? normalizeSubOrderStatus(selectedOrder.status) : null;
  const phaseInfo = phase ? SUBORDER_PHASE_OPS[phase] : null;

  const runOp = (op) => onToast(op.toast || `原型环境：${op.label} · ${selectedOrder.id}`);

  return (
    <Modal isOpen onClose={onClose} title="管理交付子工单" size="xl">
      <div className="space-y-4">
        <DescList
          cols={4}
          items={[
            ['交付计划编号', <span className="font-mono text-xs">{plan.id}</span>],
            ['所属项目', project?.name || '—'],
            ['项目类型 · 业务场景', project?.projectType ? <Chip>{project.projectType}</Chip> : '—'],
            ['使用流程模板', templateName],
            ['当前阶段', plan.currentNode || '—'],
          ]}
        />

        {orders.length === 0 ? (
          <EmptyState>暂无交付子工单（请先在「管理设备」中绑定设备）</EmptyState>
        ) : (
          <div className="flex gap-4">
            {/* 左侧：子工单卡片列表（仅用于选择，不承载操作） */}
            <div className="w-64 flex-shrink-0 space-y-2 max-h-[52vh] overflow-y-auto pr-1">
              {orders.map((o) => {
                const active = selectedOrder && o.id === selectedOrder.id;
                const hasException = normalizeSubOrderStatus(o.status) === '存在异常';
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSelectedId(o.id)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${active ? 'border-gray-900 bg-gray-50' : 'border-[#ececec] hover:bg-[#fafafa]'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-gray-500 truncate">{o.id}</span>
                      {hasException && <span className="text-[11px] font-medium text-red-600 flex-shrink-0">异常</span>}
                    </div>
                    <div className="mt-1.5"><Chip tone="outline">{o.type}</Chip></div>
                    <div className="mt-1.5 font-mono text-[11px] text-gray-500 truncate">SN：{o.deviceSN}</div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <StatusBadge status={o.status} />
                      <span className="text-[11px] text-gray-400 truncate">{o.owner}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 右侧：选中子工单任务详情 + 状态化操作区 */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* 当前任务卡片 */}
              <div className="rounded-lg border border-[#e0e0e0] bg-[#fafafa] p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={selectedOrder.status} />
                  <span className="text-xs text-gray-500">当前责任人：{selectedOrder.owner}</span>
                </div>
                <div className="text-[13px] text-gray-800">当前待处理动作：{phaseInfo?.action || '—'}</div>
                <div className="text-xs text-gray-500">下一步建议：{phaseInfo?.next || '—'}</div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {(phaseInfo?.ops || []).map((op) => (
                    op.to
                      ? <Btn key={op.label} as="link" to={op.to} size="sm">{op.label}</Btn>
                      : <Btn key={op.label} size="sm" onClick={() => runOp(op)}>{op.label}</Btn>
                  ))}
                </div>
              </div>

              {/* 子工单基础信息 */}
              <div>
                <div className="text-[13px] font-semibold text-gray-800 mb-2">子工单基础信息</div>
                <DescList
                  cols={2}
                  items={[
                    ['子工单编号', <span className="font-mono text-xs">{selectedOrder.id}</span>],
                    ['子工单类型', <Chip tone="outline">{selectedOrder.type}</Chip>],
                    ['关联设备 SN', <span className="font-mono text-xs">{selectedOrder.deviceSN}</span>],
                    ['所属交付计划', <span className="font-mono text-xs">{plan.id}</span>],
                    ['负责人 / 工程师', selectedOrder.owner],
                    ['预计上门时间', selectedOrder.eta],
                    ['实际上门时间', selectedOrder.actual],
                    ['最近更新时间', selectedOrder.updated],
                  ]}
                />
              </div>

              {/* 时间节点 */}
              <div>
                <div className="text-[13px] font-semibold text-gray-800 mb-2">时间节点</div>
                <DescList
                  cols={2}
                  items={[
                    ['预计上门时间', selectedOrder.eta],
                    ['实际上门时间', selectedOrder.actual],
                    ['最近更新时间', selectedOrder.updated],
                  ]}
                />
              </div>

              {/* 执行记录 / 交付资料 / 异常记录 / 关联问题（合成子工单无明细，给出清晰空态 + 跳转） */}
              <div className="space-y-3">
                <div>
                  <div className="text-[13px] font-semibold text-gray-800 mb-1">执行记录</div>
                  <div className="text-xs text-gray-400">暂无执行记录（详情见交付计划详情页对应子工单）</div>
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-gray-800 mb-1">交付资料</div>
                  <div className="text-xs text-gray-400">暂无交付资料</div>
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-gray-800 mb-1">异常记录</div>
                  <div className="text-xs text-gray-400">暂无交付异常</div>
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-gray-800 mb-1">关联问题 · 售后工单</div>
                  <div className="text-xs text-gray-400">暂无关联问题池记录 / 售后工单</div>
                </div>
                <div className="pt-1">
                  <LinkAction to={`/delivery-plans/${plan.id}?node=subOrders`}>在交付计划详情中查看完整子工单 →</LinkAction>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700">
          子工单由交付计划记录合成：{isZhimofang ? '智魔方含前置准备子工单，' : ''}按已绑定设备各生成一条机器人 / 设备部署子工单。左侧选择子工单，右侧按当前状态提供分派 / 接单 / 上门 / 现场执行 / 异常处理等操作，均为原型占位，完整流程请在交付计划详情页执行。
        </div>
        <div className="flex justify-end"><button onClick={onClose} className={BTN_PRIMARY}>完成</button></div>
      </div>
    </Modal>
  );
}

// 编辑交付计划：完整表单 + 只读已绑定设备列表，保存 dispatch UPDATE_DELIVERY_PLAN。
function EditDeliveryModal({ planId, state, dispatch, onClose, onToast }) {
  const plan = (state.deliveryPlans || []).find((p) => p.id === planId);
  const projects = state.projects || [];
  const devices = state.devices || [];
  const [form, setForm] = useState(() => ({
    projectId: plan?.projectId || '',
    templateName: plan?.templateName || '',
    batchNo: plan?.batchNo || '',
    owner: plan?.owner || '',
    targetCount: plan?.targetCount ?? 1,
    startDate: plan?.startDate || '',
    siteInstallDate: plan?.siteInstallDate || '',
    acceptanceDate: plan?.acceptanceDate || '',
    notes: plan?.notes || '',
  }));
  if (!plan) return null;

  const selProject = projects.find((p) => p.id === form.projectId);
  const boundDevices = deliveryBoundIds(plan).map((id) => devices.find((d) => d.id === id)).filter(Boolean);
  const set = (k, v) => setForm({ ...form, [k]: v });
  const ownerOpts = [...new Set([...DELIVERY_OWNERS, plan.owner].filter(Boolean))];
  const ro = 'ui-input w-full bg-gray-50 text-gray-500';
  const lbl = 'block text-xs text-gray-500 mb-1';

  const submit = (e) => {
    e.preventDefault();
    dispatch({
      type: 'UPDATE_DELIVERY_PLAN',
      payload: {
        id: plan.id,
        projectId: form.projectId,
        templateName: form.templateName,
        batchNo: form.batchNo,
        owner: form.owner,
        targetCount: Number(form.targetCount || 0),
        startDate: form.startDate,
        siteInstallDate: form.siteInstallDate,
        acceptanceDate: form.acceptanceDate,
        dueDate: form.acceptanceDate || plan.dueDate,
        notes: form.notes,
        updatedAt: nowText(),
      },
    });
    onToast(`交付计划 ${plan.id} 已保存`);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="编辑交付计划" size="xl">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className={lbl}>交付计划编号</label><input readOnly value={plan.id} className={ro} /></div>
          <div><label className={lbl}>当前状态</label><input readOnly value={deliveryPlanStatus(plan)} className={ro} /></div>
          <div>
            <label className={lbl}>所属项目</label>
            <select value={form.projectId} onChange={(e) => set('projectId', e.target.value)} className="ui-input w-full">
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div><label className={lbl}>客户名称</label><input readOnly value={selProject?.client || '—'} className={ro} /></div>
          <div><label className={lbl}>项目类型 · 业务场景</label><input readOnly value={selProject?.projectType || '—'} className={ro} /></div>
          <div>
            <label className={lbl}>使用流程模板</label>
            <select value={form.templateName} onChange={(e) => set('templateName', e.target.value)} className="ui-input w-full">
              <option value="">-- 请选择 --</option>
              <option>智魔方交付流程模板</option>
              <option>通用部署流程模板</option>
            </select>
          </div>
          <div><label className={lbl}>交付批次</label><input value={form.batchNo} onChange={(e) => set('batchNo', e.target.value)} className="ui-input w-full" /></div>
          <div>
            <label className={lbl}>负责人</label>
            <select value={form.owner} onChange={(e) => set('owner', e.target.value)} className="ui-input w-full">
              <option value="">-- 请选择 --</option>
              {ownerOpts.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div><label className={lbl}>计划交付数量</label><input type="number" min={0} value={form.targetCount} onChange={(e) => set('targetCount', e.target.value)} className="ui-input w-full" /></div>
          <div><label className={lbl}>计划开始时间</label><input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className="ui-input w-full" /></div>
          <div><label className={lbl}>计划现场安装调试时间</label><input type="date" value={form.siteInstallDate} onChange={(e) => set('siteInstallDate', e.target.value)} className="ui-input w-full" /></div>
          <div><label className={lbl}>计划客户验收时间</label><input type="date" value={form.acceptanceDate} onChange={(e) => set('acceptanceDate', e.target.value)} className="ui-input w-full" /></div>
          <div className="col-span-2"><label className={lbl}>备注</label><textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} className="ui-input w-full" /></div>
        </div>

        <div>
          <div className="text-[13px] font-semibold text-gray-800 mb-2">已绑定设备（只读，{boundDevices.length}）</div>
          <Table head={['设备SN', '机器人型号', '当前状态', '所属生产计划', '出厂检验状态']} empty="暂无已绑定设备">
            {boundDevices.map((d) => (
              <tr key={d.id} className="hover:bg-[#fafafa]">
                <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-gray-700">{d.sn}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{deviceTypeName(state, d.deviceTypeId)}</td>
                <td className="px-3 py-2"><StatusBadge status={d.status} /></td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-600">{prodPlanName(state, d.productionPlanId)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{inspectBadge(d.erpInspectionStatus)}</td>
              </tr>
            ))}
          </Table>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className={BTN_PRIMARY}>保存</button>
        </div>
      </form>
    </Modal>
  );
}

// 作废交付计划：确认弹窗，dispatch UPDATE_DELIVERY_PLAN(status:'已作废')。
function VoidDeliveryModal({ planId, state, dispatch, onClose, onToast }) {
  const plan = (state.deliveryPlans || []).find((p) => p.id === planId);
  const project = (state.projects || []).find((p) => p.id === plan?.projectId);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  if (!plan) return null;

  const submit = (e) => {
    e.preventDefault();
    dispatch({
      type: 'UPDATE_DELIVERY_PLAN',
      payload: {
        id: plan.id,
        status: '已作废',
        voided: true,
        voidReason: reason,
        voidNote: note,
        voidedBy: state.currentUser,
        voidedAt: nowText(),
        updatedAt: nowText(),
      },
    });
    onToast(`交付计划 ${plan.id} 已作废`);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="作废交付计划">
      <form onSubmit={submit} className="space-y-4">
        <DescList
          cols={2}
          items={[
            ['交付计划编号', <span className="font-mono text-xs">{plan.id}</span>],
            ['所属项目', project?.name || '—'],
            ['当前状态', <StatusBadge status={deliveryPlanStatus(plan)} />],
            ['操作人', state.currentUser],
            ['操作时间', nowText()],
          ]}
        />
        <div>
          <label className="block text-xs text-gray-500 mb-1">作废原因 *</label>
          <select required value={reason} onChange={(e) => setReason(e.target.value)} className="ui-input w-full">
            <option value="">-- 请选择 --</option>
            {DELIVERY_VOID_REASONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">作废说明</label>
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="补充作废说明（可选）" className="ui-input w-full" />
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded p-3 text-xs text-amber-700">作废后交付计划状态变为「已作废」，操作时间将在提交时生成，历史记录仍保留。</div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700">确认作废</button>
        </div>
      </form>
    </Modal>
  );
}

// 操作日志：由计划记录合成时间线 + 关联 operationLogs，复用 OperationLog 组件。
function DeliveryLogsModal({ planId, state, onClose }) {
  const plan = (state.deliveryPlans || []).find((p) => p.id === planId);
  const devices = state.devices || [];
  if (!plan) return null;

  const snOf = (id) => devices.find((d) => d.id === id)?.sn || id;
  const recs = plan.records || {};
  const boundIds = deliveryBoundIds(plan);
  const synth = [{
    id: `L-${plan.id}-create`,
    timestamp: recs.binding?.[0]?.time || plan.factoryDate || plan.updatedAt || nowText(),
    actionType: '创建交付计划',
    operator: plan.owner || '系统',
    notes: `交付计划 ${plan.name || plan.id} 创建，计划交付 ${plan.targetCount || 0} 台`,
  }];
  (recs.binding || []).forEach((r) => synth.push({ id: `L-b-${r.id}`, timestamp: r.time, actionType: '绑定设备', operator: r.operator, notes: `绑定设备 ${snOf(r.deviceId)}` }));
  (recs.factoryInspection || []).forEach((r) => synth.push({ id: `L-f-${r.id}`, timestamp: r.time, actionType: '出厂检验', operator: r.operator, notes: `${r.deviceSN || snOf(r.deviceId)} 出厂检验 ${r.result}${r.notes ? ` · ${r.notes}` : ''}` }));
  (recs.siteInstall || []).forEach((r) => synth.push({ id: `L-s-${r.id}`, timestamp: r.time, actionType: '现场安装调试', operator: r.operator, notes: `${r.deviceSN || snOf(r.deviceId)} 现场安装调试 ${r.result}${r.notes ? ` · ${r.notes}` : ''}` }));
  (recs.customerAccept || []).forEach((r) => synth.push({ id: `L-c-${r.id}`, timestamp: r.time, actionType: '客户验收', operator: r.operator, notes: `${r.deviceSN || snOf(r.deviceId)} 客户验收 ${r.result}` }));
  if (plan.voided) synth.push({ id: `L-v-${plan.id}`, timestamp: plan.voidedAt || nowText(), actionType: '作废交付计划', operator: plan.voidedBy || state.currentUser, fromStatus: '交付中', toStatus: '已作废', notes: plan.voidReason || '—' });
  const real = (state.operationLogs || []).filter((l) => l.deliveryPlanId === plan.id || boundIds.includes(l.deviceId));
  const logs = [...synth, ...real];

  return (
    <Modal isOpen onClose={onClose} title="交付计划操作日志" size="lg">
      <div className="space-y-3">
        <DescList
          cols={2}
          items={[
            ['交付计划编号', <span className="font-mono text-xs">{plan.id}</span>],
            ['日志条数', `${logs.length} 条`],
          ]}
        />
        <OperationLog logs={logs} />
      </div>
    </Modal>
  );
}

/* ═════════ 交付计划 ═════════ */
function DeliveryPlanTab() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ keyword: '', projectId: '', status: '', node: '', owner: '', delayed: '' });
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2600); };
  const openModal = (type, planId) => setModal({ type, planId });
  const projects = state.projects || [];

  const enriched = (state.deliveryPlans || []).map((plan) => {
    const project = projects.find((p) => p.id === plan.projectId);
    const bindingCount = plan.boundDeviceIds?.length || plan.records?.binding?.length || 0;
    const accepted = (plan.records?.customerAccept || []).filter(isPass).length;
    return {
      ...plan,
      status: deliveryPlanStatus(plan),
      projectName: project?.name || '—',
      owner: plan.owner || project?.manager || '—',
      currentNode: plan.currentNode || (accepted > 0 ? '客户验收' : (plan.records?.siteInstall || []).length > 0 ? '现场安装调试' : (plan.records?.factoryInspection || []).length > 0 ? '出厂检验' : '绑定设备'),
      bindingCount,
      accepted,
    };
  });

  const owners = [...new Set(enriched.map((p) => p.owner).filter((o) => o && o !== '—'))];

  const filtered = enriched.filter((plan) => {
    const kw = filters.keyword.trim().toLowerCase();
    return (!kw || plan.id.toLowerCase().includes(kw) || plan.projectName.toLowerCase().includes(kw))
      && (!filters.projectId || plan.projectId === filters.projectId)
      && (!filters.status || plan.status === filters.status)
      && (!filters.node || plan.currentNode === filters.node)
      && (!filters.owner || plan.owner === filters.owner)
      && (!filters.delayed || (filters.delayed === 'yes' ? plan.status === '已延期' : plan.status !== '已延期'));
  });
  const paged = usePaged(filtered, 10);

  const stop = (e) => e.stopPropagation();
  const delayedCount = enriched.filter((p) => p.status === '已延期').length;

  return (
    <Page>
      <PageHeader title="交付计划" description="按交付计划跟踪绑定设备、出厂检验、现场安装调试与客户验收进度。" />

      <StatGrid cols={4}>
        <StatCard label="计划总数" value={enriched.length} />
        <StatCard label="交付中" value={enriched.filter((p) => p.status === '交付中').length} />
        <StatCard label="已验收" value={enriched.filter((p) => p.status === '已验收').length} tone="success" />
        <StatCard label="延期计划" value={delayedCount} tone={delayedCount ? 'danger' : 'default'} />
      </StatGrid>

      <Toolbar>
        <SearchInput className="w-56" placeholder="交付计划ID / 项目名称" value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} />
        <Select value={filters.projectId} onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}>
          <option value="">所属项目</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">全部状态</option>{DELIVERY_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Select value={filters.node} onChange={(e) => setFilters({ ...filters, node: e.target.value })}>
          <option value="">当前阶段</option>{DELIVERY_NODES.map((n) => <option key={n}>{n}</option>)}
        </Select>
        <Select value={filters.owner} onChange={(e) => setFilters({ ...filters, owner: e.target.value })}>
          <option value="">全部负责人</option>{owners.map((o) => <option key={o}>{o}</option>)}
        </Select>
        <Select value={filters.delayed} onChange={(e) => setFilters({ ...filters, delayed: e.target.value })}>
          <option value="">是否延期</option>
          <option value="yes">已延期</option>
          <option value="no">未延期</option>
        </Select>
      </Toolbar>

      <Table
        head={['交付计划ID', '所属项目', '交付批次', '计划交付数量', '已绑定设备数', '计划出厂时间', '计划现场安装调试时间', '计划客户验收时间', '主要阶段', '状态', '负责人', '操作']}
        empty="暂无匹配交付计划"
        footer={<Pagination page={paged.page} total={paged.total} totalPages={paged.totalPages} onChange={paged.setPage} />}
      >
        {paged.pageItems.map((plan) => (
          <tr key={plan.id} onClick={() => navigate(`/delivery-plans/${plan.id}`)} className="hover:bg-[#fafafa] cursor-pointer">
            <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{plan.id}</td>
            <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{plan.projectName}</td>
            <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{plan.batchNo || plan.name}</td>
            <td className="px-3 py-2 text-gray-600">{plan.targetCount}</td>
            <td className="px-3 py-2 text-gray-600">{plan.bindingCount}</td>
            <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{plan.factoryDate || plan.dueDate || '—'}</td>
            <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{plan.siteInstallDate || '—'}</td>
            <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{plan.acceptanceDate || plan.dueDate || '—'}</td>
            <td className="px-3 py-2"><StatusBadge status={plan.currentNode} /></td>
            <td className="px-3 py-2"><StatusBadge status={plan.status} /></td>
            <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{plan.owner}</td>
            <td className="px-3 py-2 text-xs whitespace-nowrap" onClick={stop}>
              <div className="flex items-center gap-x-3">
                <LinkAction onClick={() => navigate(`/delivery-plans/${plan.id}`)}>查看详情</LinkAction>
                <LinkAction onClick={() => openModal('devices', plan.id)}>管理设备</LinkAction>
                <LinkAction onClick={() => openModal('subOrders', plan.id)}>管理子工单</LinkAction>
                <LinkAction onClick={() => openModal('edit', plan.id)}>编辑</LinkAction>
                {!['已验收', '已作废'].includes(plan.status) && (
                  <LinkAction onClick={() => openModal('void', plan.id)}>作废</LinkAction>
                )}
                <LinkAction onClick={() => openModal('logs', plan.id)}>查看日志</LinkAction>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {modal?.type === 'devices' && <ManageDeliveryDevicesModal planId={modal.planId} state={state} dispatch={dispatch} onClose={() => setModal(null)} onToast={showToast} />}
      {modal?.type === 'subOrders' && <ManageDeliverySubOrdersModal planId={modal.planId} state={state} onClose={() => setModal(null)} onToast={showToast} />}
      {modal?.type === 'edit' && <EditDeliveryModal planId={modal.planId} state={state} dispatch={dispatch} onClose={() => setModal(null)} onToast={showToast} />}
      {modal?.type === 'void' && <VoidDeliveryModal planId={modal.planId} state={state} dispatch={dispatch} onClose={() => setModal(null)} onToast={showToast} />}
      {modal?.type === 'logs' && <DeliveryLogsModal planId={modal.planId} state={state} onClose={() => setModal(null)} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-slate-800 text-white text-[13px] px-4 py-2 rounded-md shadow-lg">
          {toast}
        </div>
      )}
    </Page>
  );
}

/* ═════════ ERP 表单（只读同步数据池） ═════════ */
// 单个只读单据池：筛选 + 搜索 + 分页；所有行只读，操作列仅“查看详情 / 查看关联对象”只读动作。
function ErpPool({ title, subtitle, columns, rows, typeOptions, onView, onRelated }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const filtered = rows.filter((r) =>
    (!type || r.type === type)
    && (!q || (r.search || '').toLowerCase().includes(q.trim().toLowerCase())));
  const pager = usePaged(filtered, 6);

  return (
    <Section
      title={title}
      subtitle={subtitle}
      bodyClassName="p-0"
      right={
        <div className="flex items-center gap-2">
          {typeOptions && (
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">全部单据类型</option>{typeOptions.map((t) => <option key={t}>{t}</option>)}
            </Select>
          )}
          <SearchInput className="w-52" placeholder="搜索单号 / 关联对象" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      }
    >
      <Table
        head={[...columns, '操作']}
        empty="暂无同步单据"
        footer={<Pagination page={pager.page} total={pager.total} totalPages={pager.totalPages} onChange={pager.setPage} />}
      >
        {pager.pageItems.map((r) => (
          <tr key={r.id} className="hover:bg-[#fafafa]">
            {r.cells.map((c, i) => <td key={i} className="px-3 py-2 text-gray-700 align-middle whitespace-nowrap">{c}</td>)}
            <td className="px-3 py-2 text-xs whitespace-nowrap">
              <div className="flex items-center gap-x-3">
                <LinkAction onClick={() => onView(r)}>查看详情</LinkAction>
                <LinkAction onClick={() => onRelated(r)}>查看关联对象</LinkAction>
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </Section>
  );
}

// ERP 数据刷新 / 只读提示文案（原型仅模拟，不写回 ERP）。
const ERP_REFRESH_MSG = '本原型仅模拟 ERP 数据刷新，真实刷新依赖 ERP API。';
const ERP_READONLY_NOTE = 'ERP 数据只读展示，平台仅建立关联关系，不修改 ERP 单据和库存主账。';

// 同步结果彩色标签：成功=绿 / 部分成功=橙 / 失败=红（只读展示，保持紧凑风格）。
function SyncResultBadge({ result }) {
  const tone = result === '成功'
    ? 'bg-green-50 text-green-700 border-green-200'
    : result === '部分成功'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-red-50 text-red-700 border-red-200';
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${tone}`}>{result}</span>;
}

// ERP 单据详情抽屉：五段式（基础信息 / 单据明细 / 关联平台对象 / 同步信息 / 只读说明），全只读。
function ErpDetailSections({ row }) {
  const dash = (v) => (v == null || v === '' ? '—' : v);
  const mono = (v) => <span className="font-mono text-xs text-gray-600">{dash(v)}</span>;
  const b = row.base || {};
  const sync = row.sync || {};
  const refs = row.refs || [];
  const heading = (t) => <div className="text-[13px] font-semibold text-gray-800 mb-2">{t}</div>;
  const refLinks = (type) => {
    const list = refs.filter((r) => r.type === type);
    if (list.length === 0) return '—';
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {list.map((r) => (r.to
          ? <LinkAction key={r.id} to={r.to}>{r.label}</LinkAction>
          : <span key={r.id} className="text-[13px] text-gray-700">{r.label}</span>))}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div>
        {heading('基础信息')}
        <DescList
          cols={3}
          items={[
            ['ERP 单据号', mono(b.docNo)],
            ['ERP 单据类型', b.docType ? <StatusBadge status={b.docType} /> : '—'],
            ['单据状态', dash(b.docStatus)],
            ['业务日期', dash(b.bizDate)],
            ['单据日期', dash(b.docDate)],
            ['创建人', dash(b.creator)],
            ['审核人', dash(b.auditor)],
            ['审核时间', dash(b.auditTime)],
            ['来源组织', dash(b.sourceOrg)],
            ['仓库', dash(b.warehouse)],
            ['部门', dash(b.dept)],
            ['供应商·客户', dash(b.partner)],
          ]}
        />
      </div>
      <div>
        {heading('单据明细')}
        <DescList cols={2} items={row.lines || []} />
      </div>
      <div>
        {heading('关联平台对象')}
        <DescList
          cols={3}
          items={[
            ['关联项目', refLinks('项目')],
            ['关联生产计划', refLinks('生产计划')],
            ['关联设备 SN', refLinks('设备')],
            ['关联交付计划', refLinks('交付计划')],
            ['关联售后工单', refLinks('售后工单')],
            ['关联换件记录', refLinks('换件记录')],
          ]}
        />
      </div>
      <div>
        {heading('同步信息')}
        <DescList
          cols={3}
          items={[
            ['同步状态', sync.status ? <StatusBadge status={sync.status} /> : '—'],
            ['最近同步时间', dash(sync.lastSyncTime)],
            ['同步批次号', mono(sync.syncBatchNo)],
            ['同步来源', dash(sync.source)],
            ['同步结果', sync.result ? <SyncResultBadge result={sync.result} /> : '—'],
            ['异常说明', dash(sync.exception)],
          ]}
        />
      </div>
      <div>
        {heading('只读说明')}
        <div className="bg-gray-50 border border-[#ececec] rounded-md p-3 text-xs text-gray-500">{ERP_READONLY_NOTE}</div>
      </div>
    </div>
  );
}

function ErpFormsTab() {
  const { state } = useApp();
  const [detail, setDetail] = useState(null);
  const [related, setRelated] = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [toast, setToast] = useState('');
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2600); };

  const projects = state.projects || [];
  const wpp = state.workflowProductionPlans || [];
  const batches = state.materialBatches || [];
  const devices = state.devices || [];
  const deliveryPlans = state.deliveryPlans || [];
  const dash = (v) => (v == null || v === '' ? '—' : v);
  const projName = (pid) => projects.find((p) => p.id === pid)?.name ?? '—';

  const mono = (v) => <span className="font-mono text-xs text-gray-600">{dash(v)}</span>;
  const typeBadge = (t) => <StatusBadge status={t} />;
  // 平台关联对象引用（可点击跳转到对应业务对象详情）。
  const devRef = (d) => ({ type: '设备', id: d.id, label: d.sn, to: `/devices/${d.id}` });
  const projRef = (p) => ({ type: '项目', id: p.id, label: p.name, to: `/projects/${p.id}` });
  const planRef = (p) => ({ type: '生产计划', id: p.id, label: p.name || p.id, to: `/production-plans/${p.id}` });
  const dpRef = (dp) => ({ type: '交付计划', id: dp.id, label: dp.batchNo || dp.name || dp.id, to: `/delivery-plans/${dp.id}` });

  // 同步信息：来自 erpSyncMeta（全池只读共享）。
  const syncBase = {
    status: erpSyncMeta.status,
    lastSyncTime: erpSyncMeta.lastSyncTime,
    syncBatchNo: erpSyncMeta.syncBatchNo,
    source: erpSyncMeta.source,
    result: erpSyncMeta.status === '已同步' ? '成功' : erpSyncMeta.status === '同步异常' ? '失败' : '同步中',
    exception: '',
  };
  const storedCount = (planId) => devices.filter((d) => d.productionPlanId === planId && ['已入库', '待分配项目', '已分配项目', '在线运营'].includes(d.status)).length;
  const batchDate = (b) => (b.inspectionTime || '').slice(0, 10);
  const batchInspectStatus = (b) => {
    const items = b.items || [];
    if (items.some((i) => i.result === '不合格')) return '不合格';
    if (items.some((i) => i.result === '特批使用')) return '特批使用';
    return items.length ? '合格' : '—';
  };
  const materialLines = (b) => [
    ['物料编码', dash(b.model)],
    ['物料名称', dash(b.category)],
    ['规格型号', dash(b.model)],
    ['批次号', dash(b.batchNo)],
    ['数量', dash(b.quantity)],
    ['单位', '件'],
    ['单据行状态', batchInspectStatus(b)],
    ['备注', dash(b.notes)],
  ];

  // 池一：ERP 项目单
  const projectRows = projects.map((p) => ({
    id: `erp-proj-${p.id}`,
    docType: 'ERP 项目单',
    type: 'ERP 项目单',
    search: `${p.erpProjectNo ?? ''} ${p.name} ${p.client ?? ''}`,
    cells: [mono(p.erpProjectNo), <span className="text-gray-800">{p.name}</span>, dash(p.client), p.projectType ? <Chip>{p.projectType}</Chip> : '—'],
    base: {
      docNo: p.erpProjectNo, docType: 'ERP 项目单', docStatus: '有效',
      bizDate: (p.createdAt || '').slice(0, 10), docDate: (p.createdAt || '').slice(0, 10),
      creator: p.manager, auditor: '—', auditTime: '—',
      sourceOrg: 'ERP 项目管理', warehouse: '—', dept: '项目部', partner: p.client,
    },
    lines: [
      ['项目', p.name],
      ['客户', dash(p.client)],
      ['项目类型', dash(p.projectType)],
      ['负责人', dash(p.manager)],
      ['目标设备数', dash(p.targetCount)],
    ],
    refs: [
      projRef(p),
      ...wpp.filter((w) => w.projectId === p.id).map(planRef),
      ...deliveryPlans.filter((dp) => dp.projectId === p.id).map(dpRef),
    ],
    sync: syncBase,
  }));

  // 池二：ERP 生产订单 / 工单（每个生产计划各派生一条生产订单 + 一条 ERP 工单，均只读）
  const productionRows = [];
  wpp.forEach((p) => {
    const proj = projects.find((x) => x.id === p.projectId);
    const status = productionPlanStatus(p);
    const woNo = p.erpWorkOrderNo || ('MO-WO-' + (p.erpProductionOrderNo || p.id));
    const startPlan = p.startDate || (p.createdAt || '').slice(0, 10);
    const done = storedCount(p.id);
    const refs = [
      ...(proj ? [projRef(proj)] : []),
      planRef(p),
      ...devices.filter((d) => d.productionPlanId === p.id).map(devRef),
    ];
    const prodLines = [
      ['生产订单号', dash(p.erpProductionOrderNo)],
      ['工单号', woNo],
      ['计划数量', dash(p.targetCount)],
      ['完工数量', done],
      ['工单状态', status],
      ['计划开工时间', dash(startPlan)],
      ['计划完工时间', dash(p.endDate)],
    ];
    const baseCommon = {
      docStatus: status,
      bizDate: (p.createdAt || '').slice(0, 10),
      docDate: (p.createdAt || '').slice(0, 10),
      creator: p.owner, auditor: '—', auditTime: '—',
      sourceOrg: 'ERP 生产制造', warehouse: p.warehouse, dept: '生产部', partner: '—',
    };
    productionRows.push({
      id: `erp-mo-${p.id}`, docType: '生产订单', type: '生产订单',
      search: `${p.erpProductionOrderNo ?? ''} ${p.name} ${projName(p.projectId)} 生产订单`,
      cells: [typeBadge('生产订单'), mono(p.erpProductionOrderNo), <span className="text-gray-800">{p.name}</span>, projName(p.projectId), <StatusBadge status={status} />],
      base: { ...baseCommon, docNo: p.erpProductionOrderNo, docType: '生产订单' },
      lines: prodLines, refs, sync: syncBase,
    });
    productionRows.push({
      id: `erp-wo-${p.id}`, docType: 'ERP 工单', type: 'ERP 工单',
      search: `${woNo} ${p.name} ${projName(p.projectId)} ERP 工单`,
      cells: [typeBadge('ERP 工单'), mono(woNo), <span className="text-gray-800">{p.name}</span>, projName(p.projectId), <StatusBadge status={status} />],
      base: { ...baseCommon, docNo: woNo, docType: 'ERP 工单' },
      lines: prodLines, refs, sync: syncBase,
    });
  });

  // 池三：ERP 采购 / 到货 / 入库 / 检验单（聚合 materialBatches + devices + plans）
  const piiRows = [];
  let piiIdx = 0;
  const pushPii = (row) => piiRows.push({ id: `erp-pii-${piiIdx++}`, sync: syncBase, ...row });
  const deviceLines = (d) => [
    ['物料编码', dash(d.sn)],
    ['物料名称', dash(deviceTypeName(state, d.deviceTypeId))],
    ['规格型号', dash(deviceTypeName(state, d.deviceTypeId))],
    ['批次号', '—'],
    ['数量', 1],
    ['单位', '台'],
    ['单据行状态', dash(d.erpStockStatus)],
    ['备注', dash(d.exceptionNote)],
  ];
  batches.forEach((b) => {
    const bPlan = wpp.find((p) => p.id === b.planId);
    const bRefs = bPlan ? [planRef(bPlan)] : [];
    const arrived = b.erpArrivalNo ? (b.quantity || 0) : 0;
    if (b.erpPurchaseOrderNo) {
      pushPii({
        docType: '采购单', type: '采购单',
        search: `${b.erpPurchaseOrderNo} ${b.batchNo} ${dash(b.supplier)} 采购单`,
        cells: [typeBadge('采购单'), mono(b.erpPurchaseOrderNo), `${b.batchNo} · ${dash(b.supplier)}`, dash(b.model)],
        base: { docNo: b.erpPurchaseOrderNo, docType: '采购单', docStatus: b.erpArrivalNo ? '已到货' : '采购中', bizDate: batchDate(b), docDate: batchDate(b), creator: dash(b.inspector), auditor: dash(b.inspector), auditTime: dash(b.inspectionTime), sourceOrg: 'ERP 采购', warehouse: dash(b.warehouse), dept: '采购部', partner: dash(b.supplier) },
        lines: [
          ['供应商', dash(b.supplier)],
          ['采购数量', dash(b.quantity)],
          ['已到货数量', b.erpArrivalNo ? arrived : '—'],
          ['未到货数量', b.erpArrivalNo ? (b.quantity || 0) - arrived : '—'],
          ...materialLines(b),
        ],
        refs: bRefs,
      });
    }
    if (b.erpArrivalNo) {
      pushPii({
        docType: '到货单', type: '到货单',
        search: `${b.erpArrivalNo} ${b.batchNo} ${dash(b.supplier)} 到货单`,
        cells: [typeBadge('到货单'), mono(b.erpArrivalNo), `${b.batchNo} · ${dash(b.supplier)}`, dash(b.warehouse)],
        base: { docNo: b.erpArrivalNo, docType: '到货单', docStatus: batchInspectStatus(b), bizDate: batchDate(b), docDate: batchDate(b), creator: dash(b.inspector), auditor: dash(b.inspector), auditTime: dash(b.inspectionTime), sourceOrg: 'ERP 采购', warehouse: dash(b.warehouse), dept: '仓储部', partner: dash(b.supplier) },
        lines: [
          ['到货数量', dash(b.quantity)],
          ['到货日期', dash(batchDate(b))],
          ['到货检验状态', batchInspectStatus(b)],
          ...materialLines(b),
        ],
        refs: bRefs,
      });
    }
  });
  devices.forEach((d) => {
    if (d.erpInboundNo) {
      pushPii({
        docType: '入库单', type: '入库单',
        search: `${d.erpInboundNo} ${d.sn} 入库单`,
        cells: [typeBadge('入库单'), mono(d.erpInboundNo), d.sn, dash(d.erpStockStatus)],
        base: { docNo: d.erpInboundNo, docType: '入库单', docStatus: dash(d.erpStockStatus), bizDate: (d.inboundTime || '').slice(0, 10), docDate: (d.inboundTime || '').slice(0, 10), creator: dash(d.assembler), auditor: '—', auditTime: '—', sourceOrg: 'ERP 生产制造', warehouse: dash(d.warehouse), dept: '仓储部', partner: '—' },
        lines: [
          ['入库仓库', dash(d.warehouse)],
          ['入库数量', 1],
          ['入库时间', dash(d.inboundTime)],
          ['入库状态', dash(d.erpStockStatus)],
          ...deviceLines(d),
        ],
        refs: [devRef(d)],
      });
    }
    if (d.erpInspectionNo) {
      const insp = dash(d.erpInspectionStatus);
      pushPii({
        docType: '检验单', type: '检验单',
        search: `${d.erpInspectionNo} ${d.sn} 检验单`,
        cells: [typeBadge('检验单'), mono(d.erpInspectionNo), d.sn, dash(d.erpInspectionStatus)],
        base: { docNo: d.erpInspectionNo, docType: '检验单', docStatus: insp, bizDate: (d.inboundTime || '').slice(0, 10), docDate: (d.inboundTime || '').slice(0, 10), creator: '—', auditor: '—', auditTime: '—', sourceOrg: 'ERP 质量管理', warehouse: dash(d.warehouse), dept: '质检部', partner: '—' },
        lines: [
          ['检验结果', insp],
          ['检验人', '—'],
          ['检验时间', '—'],
          ['不合格数量', d.erpInspectionStatus === '合格' ? 0 : '—'],
          ['不合格原因', dash(d.exceptionNote)],
          ...deviceLines(d),
        ],
        refs: [devRef(d)],
      });
    }
  });
  wpp.forEach((p) => {
    const pRefs = [planRef(p), ...devices.filter((d) => d.productionPlanId === p.id).map(devRef)];
    if (p.erpInboundNo) {
      pushPii({
        docType: '入库单', type: '入库单',
        search: `${p.erpInboundNo} ${p.name} 入库单`,
        cells: [typeBadge('入库单'), mono(p.erpInboundNo), p.name, dash(p.erpStockStatus)],
        base: { docNo: p.erpInboundNo, docType: '入库单', docStatus: dash(p.erpStockStatus), bizDate: (p.updatedAt || '').slice(0, 10), docDate: (p.updatedAt || '').slice(0, 10), creator: dash(p.owner), auditor: '—', auditTime: '—', sourceOrg: 'ERP 生产制造', warehouse: dash(p.warehouse), dept: '仓储部', partner: '—' },
        lines: [
          ['入库仓库', dash(p.warehouse)],
          ['入库数量', dash(p.targetCount)],
          ['入库时间', dash((p.updatedAt || '').slice(0, 16))],
          ['入库状态', dash(p.erpStockStatus)],
          ['物料名称', dash(p.name)],
          ['数量', dash(p.targetCount)],
          ['单位', '台'],
          ['备注', dash(p.notes)],
        ],
        refs: pRefs,
      });
    }
    if (p.erpInspectionNo) {
      const insp = dash(p.erpInspectionStatus ?? p.erpStockStatus);
      pushPii({
        docType: '检验单', type: '检验单',
        search: `${p.erpInspectionNo} ${p.name} 检验单`,
        cells: [typeBadge('检验单'), mono(p.erpInspectionNo), p.name, insp],
        base: { docNo: p.erpInspectionNo, docType: '检验单', docStatus: insp, bizDate: (p.updatedAt || '').slice(0, 10), docDate: (p.updatedAt || '').slice(0, 10), creator: '—', auditor: dash(p.owner), auditTime: dash(p.updatedAt), sourceOrg: 'ERP 质量管理', warehouse: dash(p.warehouse), dept: '质检部', partner: '—' },
        lines: [
          ['检验结果', insp],
          ['检验人', dash(p.owner)],
          ['检验时间', dash(p.updatedAt)],
          ['不合格数量', '—'],
          ['不合格原因', '—'],
          ['物料名称', dash(p.name)],
          ['数量', dash(p.targetCount)],
          ['单位', '台'],
        ],
        refs: pRefs,
      });
    }
  });

  // 池四：ERP 出库 / 领料单（生产领料单 / 销售出库单 / 出库申请单，均只读）
  const outRows = [];
  let outIdx = 0;
  const pushOut = (row) => outRows.push({ id: `erp-out-${outIdx++}`, sync: syncBase, ...row });
  batches.forEach((b) => {
    if (b.erpDeliveryNo) {
      const bPlan = wpp.find((p) => p.id === b.planId);
      pushOut({
        docType: '生产领料单', type: '生产领料单',
        search: `${b.erpDeliveryNo} ${b.batchNo} ${b.planId ?? ''} 生产领料单`,
        cells: [typeBadge('生产领料单'), mono(b.erpDeliveryNo), `${b.batchNo}${b.planId ? ` · ${b.planId}` : ''}`, b.overIssued ? '超额领料' : dash(b.warehouse)],
        base: { docNo: b.erpDeliveryNo, docType: '生产领料单', docStatus: b.overIssued ? '超额领料' : '已领料', bizDate: batchDate(b), docDate: batchDate(b), creator: dash(b.inspector), auditor: '—', auditTime: '—', sourceOrg: 'ERP 生产制造', warehouse: dash(b.warehouse), dept: '生产部', partner: dash(b.supplier) },
        lines: [
          ['领料部门', '生产部'],
          ['领料数量', dash(b.quantity)],
          ['领料状态', b.overIssued ? '超额领料' : '已领料'],
          ['关联生产订单·工单', dash(bPlan?.erpProductionOrderNo || b.planId)],
          ...materialLines(b),
        ],
        refs: bPlan ? [planRef(bPlan)] : [],
      });
    }
  });
  deliveryPlans.forEach((dp) => {
    const dpProj = projects.find((x) => x.id === dp.projectId);
    const dpStatus = deliveryPlanStatus(dp);
    const boundCount = dp.boundDeviceIds?.length || dp.records?.binding?.length || 0;
    const outLines = [
      ['客户名称', dash(dpProj?.client)],
      ['出库仓库', '成品库'],
      ['出库数量', dash(dp.targetCount)],
      ['出库状态', dpStatus],
      ['关联项目·交付计划', `${projName(dp.projectId)} · ${dp.id}`],
    ];
    const outRefs = [dpRef(dp), ...(dpProj ? [projRef(dpProj)] : [])];
    const outBaseCommon = { docStatus: dpStatus, bizDate: dash(dp.factoryDate), docDate: dash(dp.factoryDate), creator: dash(dp.owner), auditor: '—', auditTime: '—', sourceOrg: 'ERP 销售', warehouse: '成品库', dept: '交付部', partner: dash(dpProj?.client) };
    if (dp.erpOutboundNo) {
      pushOut({
        docType: '销售出库单', type: '销售出库单',
        search: `${dp.erpOutboundNo} ${dp.batchNo || dp.name} ${projName(dp.projectId)} 销售出库单`,
        cells: [typeBadge('销售出库单'), mono(dp.erpOutboundNo), `${dp.batchNo || dp.name} · ${projName(dp.projectId)}`, dpStatus],
        base: { ...outBaseCommon, docNo: dp.erpOutboundNo, docType: '销售出库单' },
        lines: [...outLines, ['已绑定设备数', boundCount]],
        refs: outRefs,
      });
    }
    const reqNo = dp.erpOutboundRequestNo || ('OA-' + (dp.erpOutboundNo || dp.id));
    pushOut({
      docType: '出库申请单', type: '出库申请单',
      search: `${reqNo} ${dp.batchNo || dp.name} ${projName(dp.projectId)} 出库申请单`,
      cells: [typeBadge('出库申请单'), mono(reqNo), `${dp.batchNo || dp.name} · ${projName(dp.projectId)}`, dpStatus],
      base: { ...outBaseCommon, docNo: reqNo, docType: '出库申请单', dept: '销售部' },
      lines: [...outLines, ['申请数量', dash(dp.targetCount)]],
      refs: outRefs,
    });
  });

  const openDetail = (poolTitle, r) => setDetail({ title: `${poolTitle} · 详情`, row: r });
  const openRelated = (poolTitle, r) => setRelated({ title: `${poolTitle} · 关联的平台对象`, items: r.refs || [] });

  return (
    <Page>
      <PageHeader
        title="ERP 表单"
        description="ERP 只读数据池：汇总项目、生产、采购入库检验、出库领料等 ERP 单据，供平台各业务模块建立关联关系。"
        actions={
          <>
            <Btn variant="secondary" onClick={() => showToast(ERP_REFRESH_MSG)}>手动刷新</Btn>
            <Btn variant="secondary" onClick={() => showToast(ERP_REFRESH_MSG)}>刷新全部</Btn>
            <Btn variant="primary" onClick={() => setLogOpen(true)}>查看同步日志</Btn>
          </>
        }
      />

      <Card>
        <DescList
          cols={4}
          items={[
            ['最近同步时间', erpSyncMeta.lastSyncTime],
            ['同步状态', <StatusBadge status={erpSyncMeta.status} />],
            ['同步来源', erpSyncMeta.source],
            ['同步批次号', <span className="font-mono text-xs text-gray-600">{erpSyncMeta.syncBatchNo}</span>],
          ]}
        />
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <div className="flex items-start gap-2.5">
          <svg className="mt-0.5 text-amber-600 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          <div className="text-[13px]">
            <div className="font-medium text-amber-800">只读同步自 ERP，平台不新增 / 编辑 / 删除 ERP 单据</div>
            <div className="text-amber-700 mt-0.5">本页汇总项目、生产、采购入库检验、出库领料等 ERP 单据，仅作为各业务模块选择与绑定的数据来源；所有单据均为只读。</div>
          </div>
        </div>
      </Card>

      <ErpPool
        title="ERP 项目单"
        subtitle="来源：ERP 项目主数据"
        columns={['ERP 项目号', '项目名称', '客户', '项目类型']}
        rows={projectRows}
        onView={(r) => openDetail('ERP 项目单', r)}
        onRelated={(r) => openRelated('ERP 项目单', r)}
      />
      <ErpPool
        title="ERP 生产订单 / 工单"
        subtitle="来源：ERP 生产制造订单与工单"
        columns={['单据类型', 'ERP 单号', '生产计划名称', '关联项目', '状态（只读）']}
        rows={productionRows}
        typeOptions={['生产订单', 'ERP 工单']}
        onView={(r) => openDetail('ERP 生产订单 / 工单', r)}
        onRelated={(r) => openRelated('ERP 生产订单 / 工单', r)}
      />
      <ErpPool
        title="ERP 采购 / 入库 / 检验单"
        subtitle="来源：ERP 采购、到货、入库与质量检验单据"
        columns={['单据类型', 'ERP 单号', '关联对象', '状态 / 备注']}
        rows={piiRows}
        typeOptions={['采购单', '到货单', '入库单', '检验单']}
        onView={(r) => openDetail('ERP 采购 / 入库 / 检验单', r)}
        onRelated={(r) => openRelated('ERP 采购 / 入库 / 检验单', r)}
      />
      <ErpPool
        title="ERP 出库 / 领料单"
        subtitle="来源：ERP 生产领料、销售出库与出库申请单据"
        columns={['单据类型', 'ERP 单号', '关联对象', '状态 / 仓库']}
        rows={outRows}
        typeOptions={['生产领料单', '销售出库单', '出库申请单']}
        onView={(r) => openDetail('ERP 出库 / 领料单', r)}
        onRelated={(r) => openRelated('ERP 出库 / 领料单', r)}
      />

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={detail?.title || 'ERP 单据详情'} size="xl">
        {detail && <ErpDetailSections row={detail.row} />}
      </Modal>

      <Modal isOpen={!!related} onClose={() => setRelated(null)} title={related?.title || '关联的平台对象'}>
        {related && (
          <div className="space-y-3">
            {related.items.length === 0 ? (
              <div className="bg-gray-50 border border-[#ececec] rounded-md p-4 text-sm text-gray-500 text-center">暂无平台关联</div>
            ) : (
              <div className="border border-[#ececec] rounded-md divide-y divide-[#f2f2f2]">
                {related.items.map((it) => (
                  <div key={`${it.type}-${it.id}`} className="flex items-center gap-3 px-3 py-2">
                    <Chip>{it.type}</Chip>
                    <span className="text-[13px] text-gray-800 flex-1 min-w-0 truncate">{it.label}</span>
                    <span className="font-mono text-xs text-gray-400">{it.id}</span>
                    {it.to && <LinkAction to={it.to}>查看</LinkAction>}
                  </div>
                ))}
              </div>
            )}
            <div className="bg-gray-50 border border-[#ececec] rounded-md p-3 text-xs text-gray-500">此处仅展示平台内与该 ERP 单据建立关联的业务对象；ERP 单据本身只读，不受平台影响。</div>
          </div>
        )}
      </Modal>

      <Modal isOpen={logOpen} onClose={() => setLogOpen(false)} title="ERP 同步日志" size="xl">
        <div className="space-y-3">
          <div className="text-xs text-gray-500">ERP 同步日志为只读记录，展示定时任务与手动刷新的同步结果，平台不写回 ERP。</div>
          <Table
            head={['同步时间', '同步对象', '同步类型', '同步结果', '成功条数', '失败条数', '异常说明', '操作人·系统任务']}
            empty="暂无同步日志"
          >
            {erpSyncLogs.map((log) => (
              <tr key={log.id} className="hover:bg-[#fafafa]">
                <td className="px-3 py-2 whitespace-nowrap text-gray-600">{log.time}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{log.object}</td>
                <td className="px-3 py-2 whitespace-nowrap"><Chip tone="outline">{log.syncType}</Chip></td>
                <td className="px-3 py-2 whitespace-nowrap"><SyncResultBadge result={log.result} /></td>
                <td className="px-3 py-2 text-gray-600">{log.successCount}</td>
                <td className="px-3 py-2 text-gray-600">{log.failCount}</td>
                <td className="px-3 py-2 text-gray-600 min-w-[200px] whitespace-normal">{log.exception || '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-600">{log.operator}</td>
              </tr>
            ))}
          </Table>
          <div className="bg-gray-50 border border-[#ececec] rounded-md p-3 text-xs text-gray-500">手动刷新 / 刷新全部在本原型中仅为模拟；真实刷新依赖 ERP API。</div>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-slate-800 text-white text-[13px] px-4 py-2 rounded-md shadow-lg">
          {toast}
        </div>
      )}
    </Page>
  );
}

export default function ProjectsCenter() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'list';
  const activeTab = TABS.some((t) => t.key === tab) ? tab : 'list';

  return (
    <>
      {activeTab === 'list' && <ProjectListTab />}
      {activeTab === 'production' && <ProductionPlanTab />}
      {activeTab === 'delivery' && <DeliveryPlanTab />}
      {activeTab === 'erp' && <ErpFormsTab />}
    </>
  );
}
