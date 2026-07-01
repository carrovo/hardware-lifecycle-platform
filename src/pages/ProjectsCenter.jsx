import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import SecondaryTabs from '../components/SecondaryTabs';
import {
  isPass, projectStatus as deriveProjectStatus,
  productionPlanStatus, deliveryPlanStatus,
} from '../utils/status';

const TABS = [
  { key: 'list', label: '项目列表' },
  { key: 'production', label: '生产计划' },
  { key: 'delivery', label: '交付计划' },
];

const PROJECT_STATUSES = ['未开始', '进行中', '已交付', '已关闭', '已作废'];
const PRODUCTION_STATUSES = ['未开始', '生产中', '已完成', '已延期', '已作废'];
const PRODUCTION_NODES = ['来料准备', '整机装配', '质量测试', '整机入库'];
const DELIVERY_NODES = ['绑定设备', '出厂检验', '现场安装调试', '客户验收'];
const DELIVERY_STATUSES = ['未开始', '交付中', '已验收', '已延期', '已作废'];

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
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 whitespace-nowrap">{done}/{total || 0}</span>
    </div>
  );
}

function SimpleFormModal({ isOpen, onClose, title, fields, onSubmit, submitText = '保存', size = 'lg' }) {
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
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className={`${INPUT} w-full`}
                />
              )}
            </div>
          ))}
        </div>
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

function ProjectListTab() {
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [target, setTarget] = useState(null);
  const [filters, setFilters] = useState({
    keyword: '', status: '', owner: '', customer: '', erpLinked: '', createdFrom: '', createdTo: '',
  });

  const productionPlans = [...(state.workflowProductionPlans || []), ...(state.productionPlans || [])];
  const deliveryPlans = state.deliveryPlans || [];
  const owners = [...new Set(state.projects.map((p) => p.manager).filter(Boolean))];
  const customers = [...new Set(state.projects.map((p) => p.client).filter(Boolean))];

  const rows = state.projects.map((project) => {
    const status = normalizeProjectStatus(project, productionPlans, deliveryPlans);
    const projectDevices = state.devices.filter((d) => d.projectId === project.id);
    const produced = state.devices.filter((d) => {
      const plan = productionPlans.find((p) => p.id === d.productionPlanId);
      return plan?.projectId === project.id && ['已入库', '待分配项目', '已分配项目', '在线运营', '出厂检验中', '现场安装调试中', '客户验收中'].includes(d.status);
    }).length;
    const accepted = deliveryPlans
      .filter((plan) => plan.projectId === project.id)
      .reduce((sum, plan) => sum + (plan.records?.customerAccept || []).filter(isPass).length, 0);
    return {
      ...project,
      status,
      deviceDone: Math.max(produced, projectDevices.length),
      deliveryDone: accepted,
      erpLinked: Boolean(project.erpPurchaseOrderNo || project.erpProjectNo),
    };
  });

  const filtered = rows.filter((p) => {
    const keyword = filters.keyword.trim().toLowerCase();
    const created = (p.createdAt || '').slice(0, 10);
    return (!keyword || p.name.toLowerCase().includes(keyword) || p.id.toLowerCase().includes(keyword))
      && (!filters.status || p.status === filters.status)
      && (!filters.owner || p.manager === filters.owner)
      && (!filters.customer || p.client === filters.customer)
      && (!filters.erpLinked || (filters.erpLinked === 'yes' ? p.erpLinked : !p.erpLinked))
      && (!filters.createdFrom || created >= filters.createdFrom)
      && (!filters.createdTo || created <= filters.createdTo);
  });

  const openModal = (name, project = null) => {
    setTarget(project);
    setModal(name);
  };

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
    const commonView = <button className="text-slate-600 hover:underline text-xs" onClick={() => navigate(`/projects/${project.id}`)}>查看</button>;
    const edit = <button className="text-blue-600 hover:underline text-xs" onClick={() => openModal('editProject', project)}>编辑</button>;
    const createProduction = <button className="text-emerald-600 hover:underline text-xs" onClick={() => openModal('createProduction', project)}>创建生产计划</button>;
    const createPlan = <button className="text-emerald-600 hover:underline text-xs" onClick={() => openModal('createProduction', project)}>新建计划</button>;
    const more = <button className="text-gray-500 hover:underline text-xs" onClick={() => openModal('log', project)}>更多</button>;
    const voidBtn = <button className="text-red-500 hover:underline text-xs" onClick={() => openModal('void', project)}>作废</button>;
    const closeBtn = <button className="text-gray-700 hover:underline text-xs" onClick={() => openModal('close', project)}>关闭</button>;

    const map = {
      未开始: [commonView, edit, createProduction, voidBtn],
      进行中: [commonView, edit, createPlan, more],
      已交付: [commonView, closeBtn, more],
      已关闭: [commonView],
      已作废: [commonView],
    };
    return <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>{(map[project.status] || [commonView]).map((node, i) => <span key={i}>{node}</span>)}</div>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">项目列表</h1>
          <p className="text-sm text-gray-500 mt-1">围绕项目、生产计划与交付计划追踪设备全生命周期质量进度。</p>
        </div>
        {canDo('add_project') && <button onClick={() => openModal('newProject')} className={BTN_PRIMARY}>新建项目</button>}
      </div>

      <div className="bg-white rounded shadow-sm p-4">
        <div className="grid grid-cols-6 gap-3">
          <input className={`${INPUT} col-span-2`} placeholder="项目名称 / 项目ID" value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} />
          <select className={INPUT} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">全部状态</option>
            {PROJECT_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className={INPUT} value={filters.owner} onChange={(e) => setFilters({ ...filters, owner: e.target.value })}>
            <option value="">全部负责人</option>
            {owners.map((o) => <option key={o}>{o}</option>)}
          </select>
          <select className={INPUT} value={filters.customer} onChange={(e) => setFilters({ ...filters, customer: e.target.value })}>
            <option value="">全部客户</option>
            {customers.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className={INPUT} value={filters.erpLinked} onChange={(e) => setFilters({ ...filters, erpLinked: e.target.value })}>
            <option value="">ERP不限</option>
            <option value="yes">已关联ERP</option>
            <option value="no">未关联ERP</option>
          </select>
          <input className={INPUT} type="date" value={filters.createdFrom} onChange={(e) => setFilters({ ...filters, createdFrom: e.target.value })} />
          <input className={INPUT} type="date" value={filters.createdTo} onChange={(e) => setFilters({ ...filters, createdTo: e.target.value })} />
          <button className={BTN_GHOST} onClick={() => setFilters({ keyword: '', status: '', owner: '', customer: '', erpLinked: '', createdFrom: '', createdTo: '' })}>重置</button>
          <span className="self-center text-sm text-gray-400 col-span-3">共 {filtered.length} 个项目</span>
        </div>
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['项目ID', '项目名称', '客户', '负责人', '状态', '设备进度', '交付进度', 'ERP状态', '操作'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((project) => (
              <tr key={project.id} onClick={() => navigate(`/projects/${project.id}`)} className="hover:bg-blue-50 cursor-pointer">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{project.id}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{project.name}</td>
                <td className="px-4 py-3 text-gray-600">{project.client || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{project.manager || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={project.status} /></td>
                <td className="px-4 py-3">{progressBar(project.deviceDone, project.targetCount, 'bg-blue-500')}</td>
                <td className="px-4 py-3">{progressBar(project.deliveryDone, project.targetCount, 'bg-emerald-500')}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded border ${project.erpLinked ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                    {project.erpLinked ? '已关联' : '未关联'}
                  </span>
                </td>
                <td className="px-4 py-3">{actionButtons(project)}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">暂无匹配项目</td></tr>}
          </tbody>
        </table>
      </div>

      <SimpleFormModal
        key="new-project"
        isOpen={modal === 'newProject'}
        onClose={() => setModal(null)}
        title="新建项目"
        fields={[
          { key: 'name', label: '项目名称 *', required: true },
          { key: 'client', label: '客户' },
          { key: 'manager', label: '负责人', options: ['张三', '李四', '王五', '赵六', '蔡八'] },
          { key: 'targetCount', label: '目标设备数 *', type: 'number', min: 1, defaultValue: 1, required: true },
          { key: 'erpPurchaseOrderNo', label: 'ERP项目/订单号' },
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
          { key: 'client', label: '客户', defaultValue: target?.client || '' },
          { key: 'manager', label: '负责人', defaultValue: target?.manager || '', options: ['张三', '李四', '王五', '赵六', '蔡八'] },
          { key: 'targetCount', label: '目标设备数 *', type: 'number', min: 1, defaultValue: target?.targetCount || 1, required: true },
          { key: 'erpPurchaseOrderNo', label: 'ERP项目/订单号', defaultValue: target?.erpPurchaseOrderNo || '' },
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
        title="创建生产计划"
        fields={[
          { key: 'name', label: '生产计划名称 *', defaultValue: target ? `${target.name}生产计划` : '', required: true },
          { key: 'deviceType', label: '设备类型', defaultValue: 'AlphaBot 1' },
          { key: 'targetCount', label: '计划数量 *', type: 'number', min: 1, defaultValue: target?.targetCount || 1, required: true },
          { key: 'owner', label: '负责人', options: ['张三', '李四', '王五', '赵六'] },
          { key: 'endDate', label: '计划完成日期', type: 'date' },
          { key: 'erpProductionOrderNo', label: 'ERP生产订单号' },
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
        title="创建交付计划"
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

      <Modal isOpen={modal === 'log'} onClose={() => setModal(null)} title="项目操作" size="lg">
        <div className="grid grid-cols-2 gap-3">
          <button className={BTN_GHOST} onClick={() => setModal('createDelivery')}>创建交付计划</button>
          <button className={BTN_GHOST} onClick={() => navigate(`/projects/${target?.id}`)}>绑定设备</button>
          <button className={BTN_GHOST} onClick={() => navigate(`/projects/${target?.id}`)}>操作日志</button>
          <button className={BTN_GHOST} onClick={() => setModal('close')}>关闭项目</button>
        </div>
      </Modal>
    </div>
  );
}

function MetricCards({ items, cols = 4 }) {
  const colClass = { 4: 'grid-cols-4', 5: 'grid-cols-5' }[cols] || 'grid-cols-4';
  return (
    <div className={`grid ${colClass} gap-4 mb-5`}>
      {items.map((item) => (
        <div key={item.label} className={`bg-white rounded shadow-sm border-l-4 ${item.color} p-4`}>
          <div className="text-2xl font-semibold text-gray-900">{item.value}</div>
          <div className="text-sm text-gray-500 mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function ProductionPlanTab() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ keyword: '', projectId: '', deviceType: '', status: '', owner: '', delayed: '' });
  const [placeholder, setPlaceholder] = useState(null);
  // 生产计划列表只展示流程型生产计划 (WPP-*)。PLAN-* 属于日产能数据，不混入此列表。
  const plans = state.workflowProductionPlans || [];
  const projects = state.projects || [];

  const enriched = plans.map((plan) => {
    const devices = state.devices.filter((d) => d.productionPlanId === plan.id);
    const completed = devices.filter((d) => ['待入库', '已入库', '待分配项目', '已分配项目', '在线运营'].includes(d.status)).length;
    const status = productionPlanStatus(plan);
    const currentNode = plan.currentNode || (status === '已完成' ? '整机入库' : PRODUCTION_NODES[Math.min(Math.floor(completed / Math.max(plan.targetCount || 1, 1) * 4), 3)]);
    const project = projects.find((p) => p.id === plan.projectId);
    return {
      ...plan,
      status,
      projectName: project?.name || '—',
      deviceType: plan.deviceType || 'AlphaBot',
      owner: plan.owner || project?.manager || '—',
      completed,
      currentNode,
      delayed: status === '已延期',
    };
  });

  const owners = [...new Set(enriched.map((p) => p.owner).filter((o) => o && o !== '—'))];

  const filtered = enriched.filter((plan) => {
    const kw = filters.keyword.trim().toLowerCase();
    return (!kw || plan.id.toLowerCase().includes(kw) || plan.projectName.toLowerCase().includes(kw))
      && (!filters.projectId || plan.projectId === filters.projectId)
      && (!filters.deviceType || plan.deviceType.includes(filters.deviceType))
      && (!filters.status || plan.status === filters.status)
      && (!filters.owner || plan.owner === filters.owner)
      && (!filters.delayed || (filters.delayed === 'yes' ? plan.delayed : !plan.delayed));
  });

  const stop = (e) => e.stopPropagation();
  const NODE_KEY = { 来料准备: 'materialPrep', 整机装配: 'assembly', 质量测试: 'quality', 整机入库: 'warehouse' };
  const enterFlow = (plan) => navigate(`/production-plans/${plan.id}?node=${NODE_KEY[plan.currentNode] || 'materialPrep'}`);

  return (
    <div>
      <MetricCards items={[
        { label: '计划总数', value: enriched.length, color: 'border-slate-500' },
        { label: '生产中', value: enriched.filter((p) => p.status === '生产中').length, color: 'border-blue-500' },
        { label: '已完成', value: enriched.filter((p) => p.status === '已完成').length, color: 'border-green-500' },
        { label: '延期计划', value: enriched.filter((p) => p.delayed).length, color: 'border-red-500' },
      ]} />
      <div className="bg-white rounded shadow-sm p-4 mb-4 grid grid-cols-6 gap-3">
        <input className={`${INPUT} col-span-2`} placeholder="计划ID / 项目名称" value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} />
        <select className={INPUT} value={filters.projectId} onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}>
          <option value="">所属项目</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className={INPUT} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">全部状态</option>
          {PRODUCTION_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={INPUT} value={filters.owner} onChange={(e) => setFilters({ ...filters, owner: e.target.value })}>
          <option value="">全部负责人</option>
          {owners.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select className={INPUT} value={filters.delayed} onChange={(e) => setFilters({ ...filters, delayed: e.target.value })}>
          <option value="">是否延期</option>
          <option value="yes">已延期</option>
          <option value="no">未延期</option>
        </select>
      </div>
      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['生产计划ID', '所属项目', '设备类型', '计划数量', '已完成', '计划周期', '当前节点', '状态', '负责人', '操作'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((plan) => (
              <tr key={plan.id} onClick={() => navigate(`/production-plans/${plan.id}`)} className="hover:bg-blue-50 cursor-pointer">
                <td className="px-4 py-3 font-mono text-xs">{plan.id}</td>
                <td className="px-4 py-3 text-gray-700">{plan.projectName}</td>
                <td className="px-4 py-3 text-gray-600">{plan.deviceType}</td>
                <td className="px-4 py-3">{plan.targetCount || 0}</td>
                <td className="px-4 py-3">{plan.completed}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{(plan.createdAt || '').slice(0, 10)} ~ {plan.endDate || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={plan.currentNode} /></td>
                <td className="px-4 py-3"><StatusBadge status={plan.status} /></td>
                <td className="px-4 py-3 text-gray-600">{plan.owner}</td>
                <td className="px-4 py-3" onClick={stop}>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button className="text-slate-600 hover:underline" onClick={() => navigate(`/production-plans/${plan.id}`)}>查看</button>
                    <button className="text-emerald-600 hover:underline" onClick={() => enterFlow(plan)}>进入流程</button>
                    <button className="text-blue-600 hover:underline" onClick={() => setPlaceholder({ title: '编辑生产计划', text: `编辑「${plan.name || plan.id}」的入口已保留，后续接入表单与校验。` })}>编辑</button>
                    {!['已完成', '已作废'].includes(plan.status) && (
                      <button className="text-red-500 hover:underline" onClick={() => setPlaceholder({ title: '作废生产计划', text: `作废「${plan.name || plan.id}」的入口已保留，后续接入审批流程。` })}>作废</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">暂无匹配生产计划</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!placeholder} onClose={() => setPlaceholder(null)} title={placeholder?.title || ''}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{placeholder?.text}</p>
          <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700">本阶段以可演示的流程结构为主，动作入口先占位。</div>
          <div className="flex justify-end"><button onClick={() => setPlaceholder(null)} className={BTN_PRIMARY}>知道了</button></div>
        </div>
      </Modal>
    </div>
  );
}

function DeliveryPlanTab() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ keyword: '', projectId: '', status: '', node: '', owner: '', bound: '' });
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
      && (!filters.bound || (filters.bound === 'yes' ? plan.bindingCount > 0 : plan.bindingCount === 0));
  });

  const stop = (e) => e.stopPropagation();
  const NODE_KEY = { 绑定设备: 'binding', 出厂检验: 'factoryInspection', 现场安装调试: 'siteInstall', 客户验收: 'customerAccept' };

  return (
    <div>
      <MetricCards cols={5} items={[
        { label: '交付计划总数', value: enriched.length, color: 'border-slate-500' },
        { label: '交付中计划数', value: enriched.filter((p) => p.status === '交付中').length, color: 'border-blue-500' },
        { label: '已验收计划数', value: enriched.filter((p) => p.status === '已验收').length, color: 'border-green-500' },
        { label: '未绑定设备计划数', value: enriched.filter((p) => p.bindingCount === 0).length, color: 'border-amber-500' },
        { label: '已延期计划数', value: enriched.filter((p) => p.status === '已延期').length, color: 'border-red-500' },
      ]} />
      <div className="bg-white rounded shadow-sm p-4 mb-4 grid grid-cols-6 gap-3">
        <input className={`${INPUT} col-span-2`} placeholder="交付计划ID / 项目名称" value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} />
        <select className={INPUT} value={filters.projectId} onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}>
          <option value="">所属项目</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className={INPUT} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">全部状态</option>
          {DELIVERY_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={INPUT} value={filters.node} onChange={(e) => setFilters({ ...filters, node: e.target.value })}>
          <option value="">当前节点</option>
          {DELIVERY_NODES.map((n) => <option key={n}>{n}</option>)}
        </select>
        <select className={INPUT} value={filters.owner} onChange={(e) => setFilters({ ...filters, owner: e.target.value })}>
          <option value="">全部负责人</option>
          {owners.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>
      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['交付计划ID', '所属项目', '交付批次', '计划交付数量', '已绑定设备数', '计划出厂时间', '计划现场安装调试时间', '计划客户验收时间', '当前节点', '状态', '负责人', '操作'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((plan) => (
              <tr key={plan.id} onClick={() => navigate(`/delivery-plans/${plan.id}`)} className="hover:bg-blue-50 cursor-pointer">
                <td className="px-4 py-3 font-mono text-xs">{plan.id}</td>
                <td className="px-4 py-3">{plan.projectName}</td>
                <td className="px-4 py-3 text-gray-600">{plan.batchNo || plan.name}</td>
                <td className="px-4 py-3">{plan.targetCount}</td>
                <td className="px-4 py-3">{plan.bindingCount}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{plan.factoryDate || plan.dueDate || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{plan.siteInstallDate || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{plan.acceptanceDate || plan.dueDate || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={plan.currentNode} /></td>
                <td className="px-4 py-3"><StatusBadge status={plan.status} /></td>
                <td className="px-4 py-3 text-gray-600">{plan.owner}</td>
                <td className="px-4 py-3" onClick={stop}>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button className="text-slate-600 hover:underline" onClick={() => navigate(`/delivery-plans/${plan.id}`)}>查看</button>
                    <button className="text-emerald-600 hover:underline" onClick={() => navigate(`/delivery-plans/${plan.id}?node=${NODE_KEY[plan.currentNode] || 'binding'}`)}>进入流程</button>
                    <button className="text-indigo-600 hover:underline" onClick={() => navigate(`/delivery-plans/${plan.id}?node=binding`)}>绑定设备</button>
                    <button className="text-blue-600 hover:underline" onClick={() => setPlaceholder({ title: '编辑交付计划', text: `编辑「${plan.name || plan.id}」的入口已保留，后续接入表单与校验。` })}>编辑</button>
                    {!['已验收', '已作废'].includes(plan.status) && (
                      <button className="text-red-500 hover:underline" onClick={() => setPlaceholder({ title: '作废交付计划', text: `作废「${plan.name || plan.id}」的入口已保留，后续接入审批流程。` })}>作废</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-400">暂无匹配交付计划</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!placeholder} onClose={() => setPlaceholder(null)} title={placeholder?.title || ''}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{placeholder?.text}</p>
          <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700">本阶段以可演示的流程结构为主，动作入口先占位。</div>
          <div className="flex justify-end"><button onClick={() => setPlaceholder(null)} className={BTN_PRIMARY}>知道了</button></div>
        </div>
      </Modal>
    </div>
  );
}

export default function ProjectsCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'list';
  const activeTab = TABS.some((t) => t.key === tab) ? tab : 'list';

  const setTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    setSearchParams(next);
  };

  return (
    <div>
      <div className="px-6 pt-5 pb-4 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <SecondaryTabs tabs={TABS} activeTab={activeTab} onChange={setTab} />
          <div className="text-xs text-gray-400">设备全生命周期质量管理平台 / 项目中心</div>
        </div>
      </div>
      <div className="p-6">
        {activeTab === 'list' && <ProjectListTab />}
        {activeTab === 'production' && <ProductionPlanTab />}
        {activeTab === 'delivery' && <DeliveryPlanTab />}
      </div>
    </div>
  );
}
