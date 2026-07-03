import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import { ROLES_LIST, ROLE_NAV_PERMISSIONS, ROLE_ACTION_PERMISSIONS, FEISHU_USERS } from '../data/mockData';

// 「标签配置」「工站配置」评审阶段暂不开放，从导航与可见入口隐藏（组件代码保留）；
// 直接访问 ?tab=labels / ?tab=stations 时会回退到「用户与角色」。
const TABS = [
  { key: 'roles', label: '用户与角色' },
  { key: 'permissions', label: '权限配置' },
  { key: 'notifications', label: '通知配置' },
  { key: 'logs', label: '操作日志' },
];

// 内部角色值 → 展示名（与右上角用户菜单一致）。
const roleDisplay = (r) => ({ 厂长: '工厂负责人', ERP协同角色: 'ERP 协同角色' }[r] || r);

const NAV_LABELS = {
  '/home': '首页', '/dashboard': '看板中心', '/projects': '项目中心',
  '/assets': '资产管理', '/after-sales': '售后管理', '/system': '系统管理',
};

/* ─────── 用户与角色 ─────── */
function UsersRolesPage() {
  return (
    <div className="p-6 space-y-4">
      <p className="text-sm text-gray-500">用户与角色用于维护人员所属部门、角色和可访问项目范围。具体能看哪些模块、能做哪些操作，在权限配置中维护。</p>
      <div className="bg-white rounded shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{['用户', '部门', '岗位/职能', '当前角色', '可访问项目', '数据权限范围', '状态', '最近登录', '操作'].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {FEISHU_USERS.map(u => {
              const enabled = (u.status || '启用') === '启用';
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{u.name}</td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{u.dept}</td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{u.title || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap"><span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{roleDisplay(u.role)}</span></td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs whitespace-nowrap">{u.projectScope || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs whitespace-nowrap">{u.dataScope || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap"><span className={`text-xs px-2 py-0.5 rounded-full border ${enabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{u.status || '启用'}</span></td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{u.lastLogin || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">编辑 / {enabled ? '停用' : '启用'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────── 标签配置 ─────── */
const LABEL_ROWS = [
  { name: '批次标签', use: '生产追溯', types: 'AlphaBot 1 / AlphaBot 2', node: '整机装配', type: '单选', required: '是', write: '是', sample: '首批' },
  { name: '客户标签', use: '客户归属', types: '全部', node: '交付绑定', type: '文本', required: '否', write: '是', sample: '智魔方' },
  { name: '版本标签', use: '版本管理', types: 'AlphaBot 2', node: '整机入库', type: '单选', required: '否', write: '是', sample: 'V2' },
  { name: '点位标签', use: '点位管理', types: '全部', node: '现场安装调试', type: '文本', required: '否', write: '是', sample: 'T3-A区' },
];
function LabelConfig() {
  return (
    <div className="p-6 space-y-4">
      <p className="text-sm text-gray-500">标签配置用于定义设备实例标签模板。装配、入库或交付过程中填写的标签会写入设备详情，并用于筛选、追溯和质量分析。</p>
      <div className="bg-white rounded shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{['标签名称', '标签用途', '适用设备类型', '填写节点', '字段类型', '是否必填', '是否写入设备详情', '示例值', '启用状态', '操作'].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {LABEL_ROWS.map(l => (
              <tr key={l.name} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{l.name}</td>
                <td className="px-4 py-2.5"><span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">{l.use}</span></td>
                <td className="px-4 py-2.5 text-gray-600 text-xs">{l.types}</td>
                <td className="px-4 py-2.5"><span className="text-xs bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-full">{l.node}</span></td>
                <td className="px-4 py-2.5 text-xs text-gray-600">{l.type}</td>
                <td className="px-4 py-2.5 text-xs text-gray-600">{l.required}</td>
                <td className="px-4 py-2.5 text-xs text-gray-600">{l.write}</td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{l.sample}</td>
                <td className="px-4 py-2.5"><span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">启用</span></td>
                <td className="px-4 py-2.5 text-xs text-slate-500">编辑 / 停用</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────── 权限配置 ─────── */
function PermissionsConfig() {
  return (
    <div className="p-6 space-y-4">
      <p className="text-sm text-gray-500">按角色维护可访问模块、可操作动作与数据范围，支撑项目中心、资产管理与售后管理的权限控制。</p>
      <div className="bg-white rounded shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{['角色', '可访问模块', '可操作动作', '数据范围', '状态', '操作'].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ROLES_LIST.map(role => (
              <tr key={role} className="hover:bg-gray-50 align-top">
                <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{role}</td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {(ROLE_NAV_PERMISSIONS[role] || []).map(p => <span key={p} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded-full">{NAV_LABELS[p] || p}</span>)}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{(ROLE_ACTION_PERMISSIONS[role] || []).length} 项动作</td>
                <td className="px-4 py-2.5 text-xs text-gray-600">{role === '项目负责人' ? '本人负责项目' : role === '管理员' || role === '厂长' ? '全部数据' : '本部门'}</td>
                <td className="px-4 py-2.5"><span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">启用</span></td>
                <td className="px-4 py-2.5 text-xs text-slate-500">查看 / 编辑</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────── 工站配置 ─────── */
const STATION_ROWS = [
  { name: '半成品检验', flow: '质量测试', order: 1 },
  { name: '初测', flow: '质量测试', order: 2 },
  { name: '中测', flow: '质量测试', order: 3 },
  { name: 'OQT终测', flow: '质量测试', order: 4 },
  { name: '出厂检验', flow: '交付流程', order: 1 },
  { name: '现场安装调试', flow: '交付流程', order: 2 },
  { name: '客户验收', flow: '交付流程', order: 3 },
];
function StationsConfig() {
  return (
    <div className="p-6 space-y-4">
      <p className="text-sm text-gray-500">维护质量测试与交付流程的工站字典，供生产计划详情、交付计划详情引用。</p>
      <div className="bg-white rounded shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{['工站名称', '所属流程', '顺序', '是否必填', '是否启用', '操作'].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {STATION_ROWS.map(s => (
              <tr key={`${s.flow}-${s.name}`} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-800">{s.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{s.flow}</td>
                <td className="px-4 py-2.5 text-gray-600">{s.order}</td>
                <td className="px-4 py-2.5 text-xs text-gray-600">{s.name === '中测' ? '否' : '是'}</td>
                <td className="px-4 py-2.5"><span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">启用</span></td>
                <td className="px-4 py-2.5 text-xs text-slate-500">编辑 / 停用</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────── 操作日志 ─────── */
function OperationLogsPage() {
  const { state } = useApp();
  const logs = [...(state.operationLogs || [])].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')).slice(0, 100);
  const moduleOf = (log) => log.productionPlanId ? '生产计划' : log.deliveryPlanId ? '交付计划' : log.projectId ? '项目中心' : log.deviceId ? '资产管理' : '系统';
  return (
    <div className="p-6 space-y-4">
      <p className="text-sm text-gray-500">平台操作留痕，支撑追溯与审计。</p>
      <div className="bg-white rounded shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{['操作时间', '操作人', '模块', '操作类型', '操作对象', '说明'].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap">{log.timestamp}</td>
                <td className="px-4 py-2 text-gray-700">{log.operator}</td>
                <td className="px-4 py-2 text-gray-600 text-xs">{moduleOf(log)}</td>
                <td className="px-4 py-2 text-gray-700 text-xs">{log.actionType}</td>
                <td className="px-4 py-2 font-mono text-xs text-gray-500">{log.projectId || log.deliveryPlanId || log.productionPlanId || log.deviceId || '—'}</td>
                <td className="px-4 py-2 text-gray-500 text-xs max-w-[280px] truncate">{log.notes || '—'}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无操作日志</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const TRIGGER_OPTIONS = [
  '健康告警触发',
  '严重告警生成工单',
  '维修工单状态变更',
  '终测全部通过',
  '客户验收通过',
];

const AT_CONFIGS = [
  { event: '健康告警触发', roles: ['运维工程师', '厂长'], people: ['赵六'] },
  { event: '严重告警生成工单', roles: ['维修工程师', '厂长'], people: ['赵六', '李七'] },
  { event: '维修工单状态变更', roles: ['运维工程师'], people: ['赵六'] },
  { event: '终测全部通过', roles: ['项目负责人'], people: ['蔡八'] },
  { event: '客户验收通过', roles: ['项目负责人', '厂长'], people: ['蔡八', '李七'] },
];

const TEMPLATE_PREVIEWS = [
  '【告警通知】SN-DEV-012 发现严重告警，已生成维修工单 WO-003。@赵六（运维工程师）',
  '【工单更新】WO-003 状态已变更为「处理中」。@赵六（运维工程师）',
  '【终测通过】SN-DEV-018 已通过 OQT 终测，可分配项目。@蔡八（项目负责人）',
];

function NotificationConfig() {
  const [webhookUrl, setWebhookUrl] = useState('https://open.feishu.cn/open-apis/bot/v2/hook/example');
  const [triggers, setTriggers] = useState(['健康告警触发', '严重告警生成工单']);
  const [saved, setSaved] = useState(false);

  const toggleTrigger = (trigger) => {
    setTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';

  const scenarios = [
    { scene: '交付计划延期', cond: '计划验收时间 < 今日且未验收', target: '项目负责人 / 厂长', channel: '飞书' },
    { scene: '出厂检验NG', cond: '出厂检验结果 = NG', target: '质检员 / 运维工程师', channel: '飞书' },
    { scene: '安装调试NG', cond: '现场安装调试结果 = NG', target: '运维工程师', channel: '飞书' },
    { scene: '客户验收NG', cond: '客户验收结果 = NG', target: '项目负责人', channel: '飞书' },
    { scene: '工单超时', cond: '工单处理超时未闭环', target: '维修工程师 / 厂长', channel: '飞书 / 短信' },
    { scene: '模块库存不足', cond: '可用库存 < 阈值', target: '厂长', channel: '飞书' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* 通知场景 */}
      <div className="bg-white rounded shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">通知场景</h3>
        <div className="overflow-x-auto border border-gray-100 rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['通知场景', '触发条件', '通知对象', '通知渠道', '启用状态', '操作'].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {scenarios.map(s => (
                <tr key={s.scene} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{s.scene}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">{s.cond}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">{s.target}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">{s.channel}</td>
                  <td className="px-4 py-2.5"><span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">启用</span></td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">编辑</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Webhook URL */}
      <div className="bg-white rounded shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Webhook 配置</h3>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">飞书 Webhook URL</label>
          <input
            type="text"
            className={inputClass}
            value={webhookUrl}
            onChange={(e) => { setWebhookUrl(e.target.value); setSaved(false); }}
            placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
          />
        </div>
      </div>

      {/* Trigger checkboxes */}
      <div className="bg-white rounded shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">触发条件</h3>
        <div className="space-y-2">
          {TRIGGER_OPTIONS.map((trigger) => (
            <label key={trigger} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={triggers.includes(trigger)}
                onChange={() => toggleTrigger(trigger)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{trigger}</span>
            </label>
          ))}
        </div>
      </div>

      {/* @人员 table */}
      <div className="bg-white rounded shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">@人员配置</h3>
        <div className="overflow-hidden border border-gray-200 rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['触发事件', '@角色', '@人员'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {AT_CONFIGS.map((config) => (
                <tr key={config.event} className={`${!triggers.includes(config.event) ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-2.5 text-gray-700 text-sm">{config.event}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {config.roles.map((r) => (
                        <span key={r} className="bg-blue-100 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded-full">{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {config.people.map((p) => (
                        <span key={p} className="bg-gray-100 text-gray-700 border border-gray-300 text-xs px-2 py-0.5 rounded-full">@{p}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message template preview */}
      <div className="bg-white rounded shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">消息模板预览</h3>
        <div className="space-y-2">
          {TEMPLATE_PREVIEWS.map((msg, i) => (
            <div key={i} className="bg-blue-50 border border-blue-100 rounded p-3 text-sm text-gray-700 font-mono">
              {msg}
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800"
        >
          保存配置
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">配置已保存</span>}
      </div>
    </div>
  );
}

/* ─────── Label Management ─────── */

function AddCategoryModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState('');
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增标签类别">
      <div className="space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">类别名称 *</label>
          <input type="text" className={inp} value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button onClick={() => { if (name.trim()) { onSave(name.trim()); onClose(); setName(''); } }}
            disabled={!name.trim()} className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800 disabled:opacity-40">保存</button>
        </div>
      </div>
    </Modal>
  );
}

function AddOptionModal({ isOpen, onClose, onSave, categoryName }) {
  const [value, setValue] = useState('');
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`新增选项 — ${categoryName}`}>
      <div className="space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">选项值 *</label>
          <input type="text" className={inp} value={value} onChange={e => setValue(e.target.value)} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button onClick={() => { if (value.trim()) { onSave(value.trim()); onClose(); setValue(''); } }}
            disabled={!value.trim()} className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800 disabled:opacity-40">保存</button>
        </div>
      </div>
    </Modal>
  );
}

function LabelManagement() {
  const { state, dispatch } = useApp();
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [addOptionTarget, setAddOptionTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const categories = state.labelCategories || [];

  const handleAddCategory = (name) => {
    dispatch({ type: 'ADD_LABEL_CATEGORY', payload: { id: `LC-${Date.now()}`, name, options: [] } });
  };

  const handleAddOption = (categoryId, value) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return;
    dispatch({ type: 'UPDATE_LABEL_CATEGORY', payload: { ...cat, options: [...cat.options, value] } });
  };

  const handleDeleteOption = (categoryId, option) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return;
    dispatch({ type: 'UPDATE_LABEL_CATEGORY', payload: { ...cat, options: cat.options.filter(o => o !== option) } });
  };

  const handleDeleteCategory = (id) => {
    dispatch({ type: 'DELETE_LABEL_CATEGORY', payload: id });
    setDeleteConfirm(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setShowAddCategory(true)} className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
          + 新增类别
        </button>
      </div>

      <div className="space-y-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white rounded shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-gray-800">{cat.name}</div>
              <div className="flex gap-2">
                <button onClick={() => setAddOptionTarget(cat)} className="px-3 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100">
                  + 新增选项
                </button>
                <button onClick={() => setDeleteConfirm(cat)} className="px-3 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50">
                  删除类别
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {cat.options.map(opt => (
                <div key={opt} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
                  <span className="text-sm text-gray-700">{opt}</span>
                  <button onClick={() => handleDeleteOption(cat.id, opt)} className="text-gray-400 hover:text-red-500 ml-1 text-xs leading-none">×</button>
                </div>
              ))}
              {cat.options.length === 0 && <span className="text-sm text-gray-400">暂无选项，点击上方按钮添加</span>}
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-400">暂无标签类别，点击「新增类别」开始</div>
        )}
      </div>

      <AddCategoryModal isOpen={showAddCategory} onClose={() => setShowAddCategory(false)} onSave={handleAddCategory} />
      {addOptionTarget && (
        <AddOptionModal isOpen={!!addOptionTarget} onClose={() => setAddOptionTarget(null)} onSave={v => handleAddOption(addOptionTarget.id, v)} categoryName={addOptionTarget.name} />
      )}
      {deleteConfirm && (
        <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="删除类别">
          <div className="space-y-4">
            <p className="text-sm text-gray-700">确认删除标签类别 <span className="font-semibold">「{deleteConfirm.name}」</span>？此操作不可撤销。</p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
              <button onClick={() => handleDeleteCategory(deleteConfirm.id)} className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700">确认删除</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function SystemPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'roles';
  const activeTab = TABS.some((t) => t.key === tab) ? tab : 'roles';
  const activeLabel = TABS.find((t) => t.key === activeTab)?.label || '';

  return (
    <div>
      <div className="px-6 pt-5 pb-4 bg-white border-b border-gray-100">
        <div className="text-xs text-gray-400">系统管理 / {activeLabel}</div>
      </div>
      {activeTab === 'roles' && <UsersRolesPage />}
      {activeTab === 'permissions' && <PermissionsConfig />}
      {activeTab === 'labels' && <LabelConfig />}
      {activeTab === 'stations' && <StationsConfig />}
      {activeTab === 'notifications' && <NotificationConfig />}
      {activeTab === 'logs' && <OperationLogsPage />}
    </div>
  );
}
