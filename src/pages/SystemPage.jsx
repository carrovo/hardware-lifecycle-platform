import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Users from './Users';
import Roles from './Roles';

const TABS = [
  { key: 'users', label: '用户管理' },
  { key: 'roles', label: '角色权限' },
  { key: 'notifications', label: '通知配置' },
];

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

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-bold text-gray-800">飞书通知配置</h2>

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

export default function SystemPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'users';
  const activeTab = TABS.some((t) => t.key === tab) ? tab : 'users';

  const setTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    setSearchParams(next);
  };

  return (
    <div>
      {/* Hub Tab nav */}
      <div className="border-b border-gray-200 bg-white px-6">
        <div className="flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? 'border-slate-700 text-slate-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'users' && <Users />}
      {activeTab === 'roles' && <Roles />}
      {activeTab === 'notifications' && <NotificationConfig />}
    </div>
  );
}
