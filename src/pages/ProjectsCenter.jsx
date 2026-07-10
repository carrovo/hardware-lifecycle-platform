import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Pagination, usePaged } from '../components/Pagination';
import {
  Page, PageHeader, Section, Card, Toolbar, Input, Select, SearchInput,
  Btn, LinkAction, Chip, StatCard, StatGrid, DescList, Table,
} from '../components/ui';
import {
  isPass, projectStatus as deriveProjectStatus,
  productionPlanStatus, deliveryPlanStatus, TODAY,
} from '../utils/status';

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
  const NODE_KEY = { 来料准备: 'materialPrep', 整机装配: 'assembly', 质量测试: 'quality', 整机入库: 'warehouse' };
  const enterCurrentNode = (plan) => navigate(`/production-plans/${plan.id}?node=${NODE_KEY[plan.currentNode] || 'materialPrep'}`);
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
                <LinkAction onClick={() => enterCurrentNode(plan)}>进入当前节点</LinkAction>
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

/* ═════════ 交付计划 ═════════ */
function DeliveryPlanTab() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ keyword: '', projectId: '', status: '', node: '', owner: '', delayed: '' });
  const [placeholder, setPlaceholder] = useState(null);
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
  const NODE_KEY = { 绑定设备: 'binding', 出厂检验: 'factoryInspection', 现场安装调试: 'siteInstall', 客户验收: 'customerAccept' };
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
          <option value="">当前节点</option>{DELIVERY_NODES.map((n) => <option key={n}>{n}</option>)}
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
                <LinkAction onClick={() => navigate(`/delivery-plans/${plan.id}`)}>查看</LinkAction>
                <LinkAction onClick={() => navigate(`/delivery-plans/${plan.id}?node=${NODE_KEY[plan.currentNode] || 'binding'}`)}>进入当前节点</LinkAction>
                <LinkAction onClick={() => navigate(`/delivery-plans/${plan.id}?node=binding`)}>选择设备</LinkAction>
                <LinkAction onClick={() => setPlaceholder({ title: '编辑交付计划', text: `编辑「${plan.name || plan.id}」的入口已保留，后续接入表单与校验。` })}>编辑</LinkAction>
                {!['已验收', '已作废'].includes(plan.status) && (
                  <LinkAction onClick={() => setPlaceholder({ title: '作废交付计划', text: `作废「${plan.name || plan.id}」的入口已保留，后续接入审批流程。` })}>作废</LinkAction>
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

function ErpFormsTab() {
  const { state } = useApp();
  const [detail, setDetail] = useState(null);
  const [related, setRelated] = useState(null);
  const [bindOpen, setBindOpen] = useState(false);
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
  // 平台关联对象引用（可点击跳转到对应业务对象详情）。
  const devRef = (d) => ({ type: '设备', id: d.id, label: d.sn, to: `/devices/${d.id}` });
  const projRef = (p) => ({ type: '项目', id: p.id, label: p.name, to: `/projects/${p.id}` });
  const planRef = (p) => ({ type: '生产计划', id: p.id, label: p.name || p.id, to: `/production-plans/${p.id}` });
  const dpRef = (dp) => ({ type: '交付计划', id: dp.id, label: dp.batchNo || dp.name || dp.id, to: `/delivery-plans/${dp.id}` });

  // 池一：ERP 项目单
  const projectRows = projects.map((p) => ({
    id: `erp-proj-${p.id}`,
    search: `${p.erpProjectNo ?? ''} ${p.name} ${p.client ?? ''}`,
    cells: [mono(p.erpProjectNo), <span className="text-gray-800">{p.name}</span>, dash(p.client), p.projectType ? <Chip>{p.projectType}</Chip> : '—'],
    detail: [['ERP 项目号', dash(p.erpProjectNo)], ['项目名称', p.name], ['客户', dash(p.client)], ['项目类型', dash(p.projectType)], ['负责人', dash(p.manager)]],
    refs: [
      projRef(p),
      ...wpp.filter((w) => w.projectId === p.id).map(planRef),
      ...deliveryPlans.filter((dp) => dp.projectId === p.id).map(dpRef),
    ],
  }));

  // 池二：ERP 生产工单（MO）
  const moRows = wpp.map((p) => {
    const proj = projects.find((x) => x.id === p.projectId);
    return {
      id: `erp-mo-${p.id}`,
      search: `${p.erpProductionOrderNo ?? ''} ${p.name} ${projName(p.projectId)}`,
      cells: [mono(p.erpProductionOrderNo), <span className="text-gray-800">{p.name}</span>, projName(p.projectId), <StatusBadge status={productionPlanStatus(p)} />],
      detail: [['ERP 生产工单号', dash(p.erpProductionOrderNo)], ['生产计划名称', p.name], ['关联项目', projName(p.projectId)], ['计划数量', dash(p.targetCount)], ['状态（只读）', productionPlanStatus(p)]],
      refs: [
        ...(proj ? [projRef(proj)] : []),
        planRef(p),
        ...devices.filter((d) => d.productionPlanId === p.id).map(devRef),
      ],
    };
  });

  // 池三：ERP 采购 / 入库 / 检验单（聚合 materialBatches + devices + plans）
  const piiSrc = [];
  batches.forEach((b) => {
    const bPlan = wpp.find((p) => p.id === b.planId);
    const bRefs = bPlan ? [planRef(bPlan)] : [];
    if (b.erpPurchaseOrderNo) piiSrc.push({ type: '采购单', no: b.erpPurchaseOrderNo, related: `${b.batchNo} · ${dash(b.supplier)}`, extra: dash(b.model), refs: bRefs });
    if (b.erpArrivalNo) piiSrc.push({ type: '到货单', no: b.erpArrivalNo, related: `${b.batchNo} · ${dash(b.supplier)}`, extra: dash(b.warehouse), refs: bRefs });
  });
  devices.forEach((d) => {
    if (d.erpInboundNo) piiSrc.push({ type: '入库单', no: d.erpInboundNo, related: d.sn, extra: dash(d.erpStockStatus), refs: [devRef(d)] });
    if (d.erpInspectionNo) piiSrc.push({ type: '检验单', no: d.erpInspectionNo, related: d.sn, extra: dash(d.erpInspectionStatus), refs: [devRef(d)] });
  });
  wpp.forEach((p) => {
    const pRefs = [planRef(p), ...devices.filter((d) => d.productionPlanId === p.id).map(devRef)];
    if (p.erpInboundNo) piiSrc.push({ type: '入库单', no: p.erpInboundNo, related: p.name, extra: dash(p.erpStockStatus), refs: pRefs });
    if (p.erpInspectionNo) piiSrc.push({ type: '检验单', no: p.erpInspectionNo, related: p.name, extra: dash(p.erpInspectionStatus ?? p.erpStockStatus), refs: pRefs });
  });
  const purchaseRows = piiSrc.map((r, i) => ({
    id: `erp-pii-${i}`,
    type: r.type,
    search: `${r.no} ${r.related} ${r.type}`,
    cells: [<Chip>{r.type}</Chip>, mono(r.no), r.related, dash(r.extra)],
    detail: [['单据类型', r.type], ['ERP 单号', r.no], ['关联对象', r.related], ['状态 / 备注', dash(r.extra)]],
    refs: r.refs || [],
  }));

  // 池四：ERP 出库 / 领料单（materialBatches.erpDeliveryNo + deliveryPlans.erpOutboundNo）
  const outSrc = [];
  batches.forEach((b) => {
    if (b.erpDeliveryNo) {
      const bPlan = wpp.find((p) => p.id === b.planId);
      outSrc.push({ type: '生产领料单', no: b.erpDeliveryNo, related: `${b.batchNo}${b.planId ? ` · ${b.planId}` : ''}`, extra: b.overIssued ? '超额领料' : dash(b.warehouse), refs: bPlan ? [planRef(bPlan)] : [] });
    }
  });
  deliveryPlans.forEach((dp) => {
    if (dp.erpOutboundNo) {
      const dpProj = projects.find((x) => x.id === dp.projectId);
      outSrc.push({ type: '销售出库单', no: dp.erpOutboundNo, related: `${dp.batchNo || dp.name} · ${projName(dp.projectId)}`, extra: deliveryPlanStatus(dp), refs: [dpRef(dp), ...(dpProj ? [projRef(dpProj)] : [])] });
    }
  });
  const outboundRows = outSrc.map((r, i) => ({
    id: `erp-out-${i}`,
    type: r.type,
    search: `${r.no} ${r.related} ${r.type}`,
    cells: [<Chip>{r.type}</Chip>, mono(r.no), r.related, dash(r.extra)],
    detail: [['单据类型', r.type], ['ERP 单号', r.no], ['关联对象', r.related], ['状态 / 仓库', dash(r.extra)]],
    refs: r.refs || [],
  }));

  const openDetail = (poolTitle, r) => setDetail({ title: `${poolTitle} · 详情`, items: r.detail });
  const openRelated = (poolTitle, r) => setRelated({ title: `${poolTitle} · 关联的平台对象`, items: r.refs || [] });

  return (
    <Page>
      <PageHeader
        title="ERP 表单"
        description="ERP 只读数据池：汇总项目、生产、采购入库检验、出库领料等 ERP 单据，供平台各业务模块建立关联关系。"
        actions={<Btn variant="primary" onClick={() => setBindOpen(true)}>绑定到业务对象</Btn>}
      />

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
        title="ERP 生产工单（MO）"
        subtitle="来源：ERP 生产制造订单"
        columns={['ERP 生产工单号', '生产计划名称', '关联项目', '状态（只读）']}
        rows={moRows}
        onView={(r) => openDetail('ERP 生产工单', r)}
        onRelated={(r) => openRelated('ERP 生产工单', r)}
      />
      <ErpPool
        title="ERP 采购 / 入库 / 检验单"
        subtitle="来源：ERP 采购、到货、入库与质量检验单据"
        columns={['单据类型', 'ERP 单号', '关联对象', '状态 / 备注']}
        rows={purchaseRows}
        typeOptions={['采购单', '到货单', '入库单', '检验单']}
        onView={(r) => openDetail('ERP 采购 / 入库 / 检验单', r)}
        onRelated={(r) => openRelated('ERP 采购 / 入库 / 检验单', r)}
      />
      <ErpPool
        title="ERP 出库 / 领料单"
        subtitle="来源：ERP 生产领料与销售出库单据"
        columns={['单据类型', 'ERP 单号', '关联对象', '状态 / 仓库']}
        rows={outboundRows}
        typeOptions={['生产领料单', '销售出库单']}
        onView={(r) => openDetail('ERP 出库 / 领料单', r)}
        onRelated={(r) => openRelated('ERP 出库 / 领料单', r)}
      />

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={detail?.title || 'ERP 单据详情'}>
        {detail && (
          <div className="space-y-4">
            <DescList items={detail.items} cols={2} />
            <div className="bg-gray-50 border border-[#ececec] rounded-md p-3 text-xs text-gray-500">ERP 数据只读；平台只建立关联关系，不修改 ERP 单据本身。此处数据同步自 ERP，仅供查看。</div>
          </div>
        )}
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

      <SimpleFormModal
        key="erp-bind"
        isOpen={bindOpen}
        onClose={() => setBindOpen(false)}
        title="绑定到业务对象"
        submitText="提交绑定"
        note="原型占位：平台仅建立 ERP 单据与业务对象的关联关系，不会新增或修改 ERP 单据本身。提交后仅作演示提示。"
        fields={[
          { key: 'targetType', label: '绑定对象类型 *', required: true, options: ['项目', '生产计划', '设备', '售后工单', '换件记录'] },
          { key: 'targetNo', label: '绑定对象编号 *', required: true, full: true },
          { key: 'erpNo', label: '关联 ERP 单号', full: true },
          { key: 'remark', label: '绑定说明', type: 'textarea', full: true },
        ]}
        onSubmit={(form) => showToast(`已提交绑定：${form.targetType} ${form.targetNo}${form.erpNo ? ` ↔ ERP ${form.erpNo}` : ''}（原型占位）`)}
      />

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
