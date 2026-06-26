import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Roles from './Roles';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import TabBar from '../components/TabBar';

const TABS = [
  { key: 'roles', label: '角色权限' },
  { key: 'labels', label: '标签管理' },
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
        <h2 className="text-lg font-bold text-gray-800">标签管理</h2>
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
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'roles';
  const activeTab = TABS.some((t) => t.key === tab) ? tab : 'roles';

  const setTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    setSearchParams(next);
  };

  return (
    <div>
      <TabBar tabs={TABS} activeTab={activeTab} onChange={setTab} />

      {/* Content */}
      {activeTab === 'roles' && <Roles />}
      {activeTab === 'labels' && <LabelManagement />}
      {activeTab === 'notifications' && <NotificationConfig />}
    </div>
  );
}
