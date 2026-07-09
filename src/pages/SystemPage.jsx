import { useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import {
  Page, PageHeader, Section, Table, Btn, LinkAction, Chip,
  Input, Select, SearchInput, StatCard, StatGrid,
} from '../components/ui';
import {
  ROLES_LIST, ROLE_ACTION_PERMISSIONS, FEISHU_USERS,
  ROBOT_MODELS, PROJECT_TYPES, CORE_PART_TYPES,
} from '../data/mockData';

// 系统管理：9 个二级 tab（角色权限 / 流程模板 / 节点字段 / 故障原因 / 机器人型号 /
// 项目类型 / 模块部件 / 通知规则 / 状态字典）。页面自带横向 tab 条，读 ?tab= 深链；
// 兼容旧 key（permissions/logs → roles，已下线的 labels/stations 回退默认）。
const TODAY = new Date().toISOString().slice(0, 10);

const TABS = [
  { key: 'roles', label: '角色权限' },
  { key: 'workflow', label: '流程模板' },
  { key: 'fields', label: '节点字段配置' },
  { key: 'faults', label: '故障原因字典' },
  { key: 'models', label: '机器人型号字典' },
  { key: 'projectTypes', label: '项目类型 / 业务场景字典' },
  { key: 'modules', label: '模块 / 核心部件字典' },
  { key: 'notifications', label: '通知规则' },
  { key: 'statuses', label: '状态字典' },
];

const TAB_DESC = {
  roles: '维护用户、角色，以及各角色的导航可见性与操作权限。',
  workflow: '维护生产、交付、售后等业务流程模板，供各业务模块引用。',
  fields: '按业务节点配置采集字段、字段类型与必填规则。',
  faults: '维护三级故障原因树，供售后工单与质量问题选择。',
  models: '维护机器人型号字典，供设备类型与生产计划引用。',
  projectTypes: '维护项目类型 / 业务场景字典，供项目与看板筛选引用。',
  modules: '维护模块 / 核心部件字典，供来料、装配与换件引用。',
  notifications: '维护触发事件对应的通知对象、渠道与开关。',
  statuses: '集中查看各业务对象的状态枚举与语义色，统一状态口径。',
};

const LEGACY_TAB = { permissions: 'roles', logs: 'roles' };
const resolveTab = (raw) => {
  if (!raw) return 'roles';
  const mapped = LEGACY_TAB[raw] || raw;
  return TABS.some((t) => t.key === mapped) ? mapped : 'roles';
};

// 内部角色值 → 展示名（与右上角用户菜单一致）。
const roleDisplay = (r) => ({ 厂长: '工厂负责人', ERP协同角色: 'ERP 协同角色' }[r] || r);

/* ─────── 角色权限矩阵字典 ─────── */
const NAV_LABELS = {
  '/home': '首页',
  '/dashboard': '看板中心',
  '/projects': '项目中心',
  '/assets': '资产管理',
  '/after-sales': '售后管理',
  '/system': '系统管理',
};
const NAV_ROWS = Object.entries(NAV_LABELS);

const ACTION_LABELS = {
  add_material_batch: '新增来料批次',
  void_test_record: '作废测试记录',
  recheck_work_order: '工单复检',
  add_assembly: '整机装配',
  add_test_record: '新增测试记录',
  add_work_order: '新增维修工单',
  update_alert: '更新告警状态',
  add_delivery: '新增交付记录',
  update_work_order: '更新工单状态',
  add_quality_issue: '新增质量问题',
  update_quality_issue: '更新质量问题',
  add_project: '新增项目',
  add_device_allocation: '设备分配',
  void_project: '作废项目',
  manage_locations: '点位管理',
  add_production_plan: '新增生产计划',
  add_retirement: '设备退役',
  add_device_type: '新增整机类型',
  add_module_type: '新增模块类型',
  edit_device_type: '编辑整机类型',
  edit_module_type: '编辑模块类型',
  manage_users: '用户管理',
  manage_roles: '角色管理',
};
const ALL_ACTIONS = [...new Set(Object.values(ROLE_ACTION_PERMISSIONS).flat())];
const ACTION_ROWS = ALL_ACTIONS.map((a) => [a, ACTION_LABELS[a] || a]);

/* ─────── 字典数据（原型示例，本地维护，不改 mockData） ─────── */
const WORKFLOW_ROWS = [
  { id: 'WF-1', name: '标准生产流程', scope: '通用', nodeCount: 6, enabled: true, updatedAt: '2026-06-20' },
  { id: 'WF-2', name: '智魔方交付流程', scope: '智魔方', nodeCount: 4, enabled: true, updatedAt: '2026-06-18' },
  { id: 'WF-3', name: '机场交付流程', scope: '机场', nodeCount: 5, enabled: true, updatedAt: '2026-06-15' },
  { id: 'WF-4', name: '售后维修流程', scope: '售后', nodeCount: 5, enabled: true, updatedAt: '2026-06-12' },
  { id: 'WF-5', name: '遥操数采交付流程', scope: '遥操数采', nodeCount: 4, enabled: false, updatedAt: '2026-05-30' },
];

const NODE_OPTIONS = ['整机装配', '初测', '中测', 'OQT终测', '出厂检验', '现场安装调试', '客户验收'];
const FIELD_TYPES = ['文本', '数字', '单选', '多选', '日期', '附件'];
const FIELD_ROWS = [
  { id: 'FLD-1', node: '整机装配', field: '装配批次号', type: '单选', required: true, enabled: true },
  { id: 'FLD-2', node: '初测', field: '初测结论', type: '单选', required: true, enabled: true },
  { id: 'FLD-3', node: 'OQT终测', field: '终测报告', type: '附件', required: true, enabled: true },
  { id: 'FLD-4', node: '出厂检验', field: '检验结论', type: '单选', required: true, enabled: true },
  { id: 'FLD-5', node: '现场安装调试', field: '点位编号', type: '文本', required: false, enabled: true },
  { id: 'FLD-6', node: '客户验收', field: '验收签字', type: '附件', required: true, enabled: true },
  { id: 'FLD-7', node: '客户验收', field: '验收备注', type: '文本', required: false, enabled: false },
];

const L1_OPTIONS = ['硬件故障', '软件故障', '外部因素', '人为操作'];
const SCOPE_OPTIONS = ['全部', ...PROJECT_TYPES];
const FAULT_ROWS = [
  { id: 'FA-1', l1: '硬件故障', l2: '机械臂', l3: '关节电机异常', scope: '全部', enabled: true },
  { id: 'FA-2', l1: '硬件故障', l2: '夹爪', l3: '夹持力不足', scope: '全部', enabled: true },
  { id: 'FA-3', l1: '硬件故障', l2: '控制器', l3: '主板通信中断', scope: '全部', enabled: true },
  { id: 'FA-4', l1: '软件故障', l2: '导航系统', l3: '定位漂移', scope: '智魔方', enabled: true },
  { id: 'FA-5', l1: '软件故障', l2: '感知系统', l3: '点云数据丢失', scope: '机场', enabled: true },
  { id: 'FA-6', l1: '外部因素', l2: '环境干扰', l3: '地面湿滑打滑', scope: '机场', enabled: false },
  { id: 'FA-7', l1: '人为操作', l2: '现场操作', l3: '误触急停', scope: '全部', enabled: true },
];

const MODEL_DESC = {
  AlphaBot1: '第一代服务机器人，适用于商场 / 展厅导览与巡检',
  AlphaBot2: '第二代服务机器人，增强导航与感知，适用于机场 / 工业等复杂场景',
};
const MODEL_ROWS = ROBOT_MODELS.map((m, i) => ({ id: `RM-${i + 1}`, name: m, desc: MODEL_DESC[m] || '', enabled: true }));

const PROJECT_TYPE_DESC = {
  智魔方: '商场 / 零售场景的智能服务机器人项目',
  机场: '机场航站楼导览、巡检与服务场景',
  工业场景: '工厂 / 产线的工业作业与巡检场景',
  遥操数采: '遥操作与数据采集类项目',
};
const PROJECT_TYPE_ROWS = PROJECT_TYPES.map((t, i) => ({ id: `PT-${i + 1}`, name: t, desc: PROJECT_TYPE_DESC[t] || '', enabled: true }));

const MODULE_DESC = {
  机械臂: '执行抓取 / 操作动作的机械臂总成',
  夹爪: '末端夹持执行器',
  灵巧手: '多自由度仿人灵巧手',
  控制器: '运动控制与主控计算单元',
  其他核心部件: '电池 / 底盘 / 传感器等其他核心部件',
};
const MODULE_ROWS = CORE_PART_TYPES.map((t, i) => ({ id: `MOD-${i + 1}`, name: t, desc: MODULE_DESC[t] || '', enabled: true }));

const NOTIF_RULES = [
  { id: 'NR-1', event: '健康告警触发', target: '运维工程师 / 厂长', channel: '飞书', enabled: true },
  { id: 'NR-2', event: '严重告警生成工单', target: '维修工程师 / 厂长', channel: '飞书 / 短信', enabled: true },
  { id: 'NR-3', event: '维修工单状态变更', target: '运维工程师', channel: '飞书', enabled: true },
  { id: 'NR-4', event: '出厂检验 NG', target: '质检员 / 运维工程师', channel: '飞书', enabled: true },
  { id: 'NR-5', event: '现场安装调试 NG', target: '运维工程师', channel: '飞书', enabled: false },
  { id: 'NR-6', event: '客户验收 NG', target: '项目负责人', channel: '飞书', enabled: true },
  { id: 'NR-7', event: '交付计划延期', target: '项目负责人 / 厂长', channel: '飞书', enabled: true },
  { id: 'NR-8', event: '终测全部通过', target: '项目负责人', channel: '飞书', enabled: true },
  { id: 'NR-9', event: '模块库存不足', target: '厂长', channel: '飞书', enabled: false },
];
const TEMPLATE_PREVIEWS = [
  '【告警通知】SN-DEV-012 发现严重告警，已生成维修工单 WO-003。@赵六（运维工程师）',
  '【工单更新】WO-003 状态已变更为「现场处理中」。@赵六（运维工程师）',
  '【终测通过】SN-DEV-018 已通过 OQT 终测，可分配项目。@蔡八（项目负责人）',
];

/* ─────── 状态字典（tone 与 StatusBadge 实际渲染一致） ─────── */
const TONE_META = {
  neutral: { label: '中性', dot: 'bg-gray-400' },
  info: { label: '进行中', dot: 'bg-blue-500' },
  success: { label: '成功', dot: 'bg-green-500' },
  warning: { label: '警告', dot: 'bg-amber-500' },
  danger: { label: '异常', dot: 'bg-red-500' },
  purple: { label: '强调', dot: 'bg-purple-500' },
};
const STATUS_DICT = [
  { object: '设备生命周期', items: [
    ['生产中', 'info', '整机在生产 / 测试流程中'],
    ['待入库', 'neutral', '已完成生产，等待入库'],
    ['待交付', 'neutral', '已入库并分配项目，等待交付'],
    ['交付中', 'info', '处于出厂 / 安装 / 验收交付过程'],
    ['在线运营', 'success', '已验收并在点位在线运营'],
    ['维修中', 'neutral', '因故障返厂 / 现场维修'],
    ['已作废', 'neutral', '设备退役 / 报废，终态'],
  ] },
  { object: '在线状态', items: [
    ['在线', 'neutral', '设备联网且心跳正常'],
    ['离线', 'neutral', '曾接入但当前失联'],
    ['未接入', 'neutral', '尚未接入监控平台'],
    ['未知', 'neutral', '无有效心跳数据'],
  ] },
  { object: '售后工单', items: [
    ['待分派', 'warning', '工单已创建，待分派处理人'],
    ['待接单', 'neutral', '已分派，待工程师接单'],
    ['待上门', 'neutral', '已接单，待现场上门'],
    ['现场处理中', 'info', '工程师现场处理中'],
    ['已关单', 'success', '问题已解决并关单'],
    ['已取消', 'neutral', '工单取消，终态'],
  ] },
  { object: '交付计划', items: [
    ['未开始', 'neutral', '交付计划尚未启动'],
    ['交付中', 'info', '交付执行中'],
    ['已验收', 'success', '客户验收通过'],
    ['已延期', 'danger', '超出计划验收时间未完成'],
  ] },
  { object: '质量问题', items: [
    ['待处理', 'warning', '问题已上报，待处理'],
    ['处理中', 'info', '问题处理中'],
    ['已关闭', 'neutral', '问题已闭环，终态'],
  ] },
];

/* ─────── 列 / 字段配置 ─────── */
const nameDescColumns = (nameLabel) => [
  { key: 'name', label: nameLabel, render: (r) => <span className="font-medium text-gray-800">{r.name}</span> },
  { key: 'desc', label: '说明', render: (r) => <span className="text-gray-600">{r.desc || '—'}</span> },
  { key: 'enabled', label: '启用', render: (r) => <EnabledBadge on={r.enabled} /> },
];
const nameDescFields = (nameLabel) => [
  { key: 'name', label: nameLabel, type: 'text', required: true },
  { key: 'desc', label: '说明', type: 'text' },
];

const WORKFLOW_COLUMNS = [
  { key: 'name', label: '模板名', render: (r) => <span className="font-medium text-gray-800">{r.name}</span> },
  { key: 'scope', label: '适用业务' },
  { key: 'nodeCount', label: '节点数' },
  { key: 'enabled', label: '状态', render: (r) => <EnabledBadge on={r.enabled} /> },
  { key: 'updatedAt', label: '更新时间', render: (r) => <span className="text-gray-500 text-xs">{r.updatedAt}</span> },
];
const WORKFLOW_FIELDS = [
  { key: 'name', label: '模板名称', type: 'text', required: true, placeholder: '如：标准生产流程' },
  { key: 'scope', label: '适用业务', type: 'select', options: ['通用', ...PROJECT_TYPES, '售后'] },
  { key: 'nodeCount', label: '节点数', type: 'text', placeholder: '如：6' },
];

const FIELD_COLUMNS = [
  { key: 'node', label: '业务节点' },
  { key: 'field', label: '字段名', render: (r) => <span className="font-medium text-gray-800">{r.field}</span> },
  { key: 'type', label: '字段类型' },
  { key: 'required', label: '是否必填', render: (r) => (r.required ? <Chip>必填</Chip> : <span className="text-gray-400 text-xs">选填</span>) },
  { key: 'enabled', label: '是否启用', render: (r) => <EnabledBadge on={r.enabled} /> },
];
const FIELD_FIELDS = [
  { key: 'node', label: '业务节点', type: 'select', options: NODE_OPTIONS },
  { key: 'field', label: '字段名', type: 'text', required: true },
  { key: 'type', label: '字段类型', type: 'select', options: FIELD_TYPES },
  { key: 'required', label: '是否必填', type: 'bool' },
];

const FAULT_COLUMNS = [
  { key: 'l1', label: '一级原因', render: (r) => <span className="font-medium text-gray-800">{r.l1}</span> },
  { key: 'l2', label: '二级原因' },
  { key: 'l3', label: '三级原因' },
  { key: 'scope', label: '适用范围' },
  { key: 'enabled', label: '启用', render: (r) => <EnabledBadge on={r.enabled} /> },
];
const FAULT_FIELDS = [
  { key: 'l1', label: '一级原因', type: 'select', options: L1_OPTIONS },
  { key: 'l2', label: '二级原因', type: 'text', required: true },
  { key: 'l3', label: '三级原因', type: 'text' },
  { key: 'scope', label: '适用范围', type: 'select', options: SCOPE_OPTIONS },
];

const NOTIF_COLUMNS = [
  { key: 'event', label: '触发事件', render: (r) => <span className="font-medium text-gray-800">{r.event}</span> },
  { key: 'target', label: '通知对象 / 角色', render: (r) => <span className="text-gray-600 text-xs">{r.target}</span> },
  { key: 'channel', label: '通知渠道', render: (r) => <Chip>{r.channel}</Chip> },
  { key: 'enabled', label: '启用', render: (r) => <EnabledBadge on={r.enabled} /> },
];
const NOTIF_FIELDS = [
  { key: 'event', label: '触发事件', type: 'text', required: true },
  { key: 'target', label: '通知对象 / 角色', type: 'text', required: true },
  { key: 'channel', label: '通知渠道', type: 'select', options: ['飞书', '短信', '邮件', '飞书 / 短信'] },
];

/* ═════════ 通用小组件 ═════════ */
function EnabledBadge({ on }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${on ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-green-500' : 'bg-gray-300'}`} />
      {on ? '启用' : '停用'}
    </span>
  );
}

function TabNav({ active }) {
  return (
    <div className="border-b border-[#ececec] flex items-center gap-1 overflow-x-auto">
      {TABS.map((t) => (
        <Link
          key={t.key}
          to={`/system?tab=${t.key}`}
          className={`px-3 py-2 text-[13px] whitespace-nowrap border-b-2 -mb-px transition-colors ${active === t.key ? 'border-gray-900 text-gray-900 font-medium' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

// 角色权限矩阵：行=权限项，列=角色；管理员可勾选，其余只读展示。
function PermMatrix({ rows, perms, onToggle, editable, firstColLabel }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr className="bg-[#fafafa] border-b border-[#ececec]">
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 whitespace-nowrap sticky left-0 bg-[#fafafa]">{firstColLabel}</th>
            {ROLES_LIST.map((r) => (
              <th key={r} className="px-3 py-2 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{roleDisplay(r)}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f2f2f2]">
          {rows.map(([key, label]) => (
            <tr key={key} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 text-gray-700 whitespace-nowrap sticky left-0 bg-white">{label}</td>
              {ROLES_LIST.map((role) => {
                const has = (perms[role] || []).includes(key);
                return (
                  <td key={role} className="px-3 py-2 text-center">
                    {editable ? (
                      <input
                        type="checkbox"
                        checked={has}
                        onChange={(e) => onToggle(role, key, e.target.checked)}
                        className="w-3.5 h-3.5 accent-gray-900 cursor-pointer"
                      />
                    ) : has ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 字典通用 tab：Section + 紧凑表格 + 新增/编辑 Modal + 启用停用/删除（原型级 CRUD 占位）。
function DictionaryTab({ title, entity, columns, fields, initial, defaults = {}, idPrefix = 'D' }) {
  const [rows, setRows] = useState(initial);
  const [modal, setModal] = useState(null); // null | { mode: 'add' } | { mode: 'edit', id }
  const [form, setForm] = useState({});
  const seq = useRef(0);

  const openAdd = () => {
    setForm(Object.fromEntries(fields.map((f) => [f.key, f.type === 'bool' ? false : f.type === 'select' ? (f.options?.[0] ?? '') : ''])));
    setModal({ mode: 'add' });
  };
  const openEdit = (row) => {
    setForm({ ...row });
    setModal({ mode: 'edit', id: row.id });
  };
  const close = () => setModal(null);
  const canSave = fields.every((f) => !f.required || String(form[f.key] ?? '').trim());

  const save = () => {
    if (!canSave) return;
    if (modal.mode === 'add') {
      seq.current += 1;
      setRows((r) => [{ id: `${idPrefix}-${Date.now()}-${seq.current}`, enabled: true, ...defaults, ...form }, ...r]);
    } else {
      setRows((r) => r.map((x) => (x.id === modal.id ? { ...x, ...form } : x)));
    }
    close();
  };
  const toggle = (id) => setRows((r) => r.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)));
  const remove = (id) => setRows((r) => r.filter((x) => x.id !== id));

  return (
    <>
      <Section title={title} right={<Btn variant="primary" size="sm" onClick={openAdd}>+ 新增{entity}</Btn>} bodyClassName="p-0">
        <Table head={[...columns.map((c) => c.label), '操作']}>
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-[#fafafa]">
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2 text-gray-700 align-middle whitespace-nowrap">
                  {c.render ? c.render(row) : (row[c.key] ?? '—')}
                </td>
              ))}
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <LinkAction onClick={() => openEdit(row)}>编辑</LinkAction>
                  <LinkAction onClick={() => toggle(row.id)}>{row.enabled ? '停用' : '启用'}</LinkAction>
                  <LinkAction onClick={() => remove(row.id)}>删除</LinkAction>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Section>

      <Modal isOpen={!!modal} onClose={close} title={`${modal?.mode === 'edit' ? '编辑' : '新增'}${entity}`}>
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-[13px] font-medium text-gray-700 mb-1">{f.label}{f.required && ' *'}</label>
              {f.type === 'select' ? (
                <Select className="w-full" value={form[f.key] ?? ''} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}>
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </Select>
              ) : f.type === 'bool' ? (
                <Select className="w-full" value={String(form[f.key] ?? false)} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value === 'true' }))}>
                  <option value="true">是</option>
                  <option value="false">否</option>
                </Select>
              ) : (
                <Input className="w-full" value={form[f.key] ?? ''} placeholder={f.placeholder} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="secondary" onClick={close}>取消</Btn>
            <Btn variant="primary" onClick={save} disabled={!canSave}>保存</Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ═════════ 1. 角色权限 ═════════ */
function RolesTab() {
  const { currentRole, navPermissions, updateNavPermission, actionPermissions, updateActionPermission } = useRole();
  const { state } = useApp();
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const isAdmin = currentRole === '管理员';

  const isOn = (u) => (u.status || '启用') === '启用';
  const users = FEISHU_USERS.filter(
    (u) => (!q || u.name.includes(q) || (u.dept || '').includes(q)) && (!roleFilter || u.role === roleFilter),
  );
  const enabledUsers = FEISHU_USERS.filter(isOn).length;

  const logs = [...(state.operationLogs || [])].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')).slice(0, 20);
  const moduleOf = (log) => (log.productionPlanId ? '生产计划' : log.deliveryPlanId ? '交付计划' : log.projectId ? '项目中心' : log.deviceId ? '资产管理' : '系统');

  return (
    <>
      <StatGrid cols={4}>
        <StatCard label="用户总数" value={FEISHU_USERS.length} />
        <StatCard label="启用用户" value={enabledUsers} tone="success" />
        <StatCard label="角色数" value={ROLES_LIST.length} />
        <StatCard label="系统模块" value={NAV_ROWS.length} />
      </StatGrid>

      <Section
        title="用户与角色"
        subtitle="维护人员部门、角色与数据权限范围。"
        right={
          <div className="flex items-center gap-2">
            <SearchInput placeholder="搜索用户 / 部门" value={q} onChange={(e) => setQ(e.target.value)} className="w-40" />
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">全部角色</option>
              {ROLES_LIST.map((r) => <option key={r} value={r}>{roleDisplay(r)}</option>)}
            </Select>
            <Btn variant="primary" size="sm">+ 新增用户</Btn>
          </div>
        }
        bodyClassName="p-0"
      >
        <Table head={['用户', '部门', '岗位 / 职能', '当前角色', '可访问项目', '数据权限范围', '状态', '最近登录', '操作']} empty="未匹配到用户">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{u.name}</td>
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{u.dept}</td>
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{u.title || '—'}</td>
              <td className="px-3 py-2 whitespace-nowrap"><Chip>{roleDisplay(u.role)}</Chip></td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{u.projectScope || '—'}</td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{u.dataScope || '—'}</td>
              <td className="px-3 py-2 whitespace-nowrap"><EnabledBadge on={isOn(u)} /></td>
              <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{u.lastLogin || '—'}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <LinkAction>编辑</LinkAction>
                  <LinkAction>{isOn(u) ? '停用' : '启用'}</LinkAction>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="导航权限" subtitle={isAdmin ? '勾选各角色可见的导航模块（管理员可编辑）。' : '各角色可见的导航模块（只读）。'} bodyClassName="p-0">
        <PermMatrix rows={NAV_ROWS} perms={navPermissions} onToggle={updateNavPermission} editable={isAdmin} firstColLabel="导航模块" />
      </Section>

      <Section title="操作权限" subtitle={isAdmin ? '勾选各角色可执行的操作（管理员可编辑）。' : '各角色可执行的操作（只读）。'} bodyClassName="p-0">
        <PermMatrix rows={ACTION_ROWS} perms={actionPermissions} onToggle={updateActionPermission} editable={isAdmin} firstColLabel="操作" />
      </Section>

      <Section title="操作日志" subtitle="平台操作留痕，支撑追溯与审计（最近 20 条）。" bodyClassName="p-0">
        <Table head={['操作时间', '操作人', '模块', '操作类型', '操作对象', '说明']} empty="暂无操作日志">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{log.timestamp}</td>
              <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{log.operator}</td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{moduleOf(log)}</td>
              <td className="px-3 py-2 text-gray-700 text-xs whitespace-nowrap">{log.actionType}</td>
              <td className="px-3 py-2 font-mono text-xs text-gray-500 whitespace-nowrap">{log.projectId || log.deliveryPlanId || log.productionPlanId || log.deviceId || '—'}</td>
              <td className="px-3 py-2 text-gray-500 text-xs max-w-[280px] truncate">{log.notes || '—'}</td>
            </tr>
          ))}
        </Table>
      </Section>
    </>
  );
}

/* ═════════ 8. 通知规则 ═════════ */
function WebhookSection() {
  const [url, setUrl] = useState('https://open.feishu.cn/open-apis/bot/v2/hook/example');
  const [saved, setSaved] = useState(false);
  return (
    <Section title="Webhook 配置" subtitle="用于将通知推送到飞书群机器人。">
      <div className="max-w-xl space-y-3">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">飞书 Webhook URL</label>
          <Input className="w-full" value={url} placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..." onChange={(e) => { setUrl(e.target.value); setSaved(false); }} />
        </div>
        <div className="flex items-center gap-3">
          <Btn variant="primary" onClick={() => setSaved(true)}>保存配置</Btn>
          {saved && <span className="text-[13px] text-green-600">配置已保存</span>}
        </div>
      </div>
    </Section>
  );
}

function NotificationsTab() {
  return (
    <>
      <DictionaryTab title="通知规则" entity="规则" idPrefix="NR" columns={NOTIF_COLUMNS} fields={NOTIF_FIELDS} initial={NOTIF_RULES} />
      <WebhookSection />
      <Section title="消息模板预览" subtitle="通知按模板渲染并 @ 相关角色 / 人员。">
        <div className="space-y-2">
          {TEMPLATE_PREVIEWS.map((msg, i) => (
            <div key={i} className="bg-[#fafafa] border border-[#f0f0f0] rounded-md p-3 text-[13px] text-gray-700">{msg}</div>
          ))}
        </div>
      </Section>
    </>
  );
}

/* ═════════ 9. 状态字典 ═════════ */
function StatusesTab() {
  return (
    <>
      {STATUS_DICT.map((group) => (
        <Section key={group.object} title={group.object} bodyClassName="p-0">
          <Table head={['状态值', '语义色', '说明']}>
            {group.items.map(([status, tone, desc]) => (
              <tr key={status} className="hover:bg-[#fafafa]">
                <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={status} /></td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 text-gray-600 text-xs">
                    <span className={`w-2 h-2 rounded-full ${TONE_META[tone].dot}`} />
                    {TONE_META[tone].label}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-600">{desc}</td>
              </tr>
            ))}
          </Table>
        </Section>
      ))}
    </>
  );
}

/* ═════════ 页面 ═════════ */
export default function SystemPage() {
  const [searchParams] = useSearchParams();
  const activeTab = resolveTab(searchParams.get('tab'));
  const activeLabel = TABS.find((t) => t.key === activeTab)?.label || '';

  return (
    <Page>
      <PageHeader
        title="系统管理"
        description={TAB_DESC[activeTab]}
        breadcrumb={<div className="text-xs text-gray-400 mb-1">系统管理 / {activeLabel}</div>}
      />
      <TabNav active={activeTab} />
      {activeTab === 'roles' && <RolesTab />}
      {activeTab === 'workflow' && <DictionaryTab title="流程模板" entity="模板" idPrefix="WF" columns={WORKFLOW_COLUMNS} fields={WORKFLOW_FIELDS} initial={WORKFLOW_ROWS} defaults={{ updatedAt: TODAY }} />}
      {activeTab === 'fields' && <DictionaryTab title="节点字段配置" entity="字段" idPrefix="FLD" columns={FIELD_COLUMNS} fields={FIELD_FIELDS} initial={FIELD_ROWS} />}
      {activeTab === 'faults' && <DictionaryTab title="故障原因字典" entity="故障原因" idPrefix="FA" columns={FAULT_COLUMNS} fields={FAULT_FIELDS} initial={FAULT_ROWS} />}
      {activeTab === 'models' && <DictionaryTab title="机器人型号字典" entity="型号" idPrefix="RM" columns={nameDescColumns('型号')} fields={nameDescFields('型号')} initial={MODEL_ROWS} />}
      {activeTab === 'projectTypes' && <DictionaryTab title="项目类型 / 业务场景字典" entity="类型" idPrefix="PT" columns={nameDescColumns('类型名')} fields={nameDescFields('类型名')} initial={PROJECT_TYPE_ROWS} />}
      {activeTab === 'modules' && <DictionaryTab title="模块 / 核心部件字典" entity="部件" idPrefix="MOD" columns={nameDescColumns('部件类型')} fields={nameDescFields('部件类型')} initial={MODULE_ROWS} />}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'statuses' && <StatusesTab />}
    </Page>
  );
}
