import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import SecondaryTabs from '../components/SecondaryTabs';
import { FEISHU_USERS } from '../data/mockData';

const TABS = [
  { key: 'production', label: '生产工单' },
  { key: 'delivery',   label: '交付工单' },
];

/* ─────── Shared work order modals ─────── */

function StartProcessingModal({ isOpen, onClose, onConfirm, currentUser }) {
  const [assignee, setAssignee] = useState(currentUser);
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="开始处理">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">确认承接此工单并开始处理。</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">承接人</label>
          <select className={inp} value={assignee} onChange={e => setAssignee(e.target.value)}>
            {FEISHU_USERS.map(u => <option key={u.id} value={u.name}>{u.name}（{u.dept}）</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button onClick={() => { onConfirm(assignee); onClose(); }} className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">确认开始处理</button>
        </div>
      </div>
    </Modal>
  );
}

function SubmitRecheckModal({ isOpen, onClose, onConfirm }) {
  const [recheckPerson, setRecheckPerson] = useState('');
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="提交复检">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">维修操作已完成，提交复检。请指定复检人员。</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">复检人 *</label>
          <select className={inp} value={recheckPerson} onChange={e => setRecheckPerson(e.target.value)}>
            <option value="">-- 选择复检人 --</option>
            {FEISHU_USERS.map(u => <option key={u.id} value={u.name}>{u.name}（{u.dept}）</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button onClick={() => { if (recheckPerson) { onConfirm(recheckPerson); onClose(); } }} disabled={!recheckPerson}
            className="px-4 py-2 text-sm text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50">提交复检</button>
        </div>
      </div>
    </Modal>
  );
}

/* ─────── Add Work Order Modal ─────── */

function AddWorkOrderModal({ isOpen, onClose, onSave, actionType, state }) {
  const { devices, workflowProductionPlans = [], deliveryPlans = [] } = state;
  const blankForm = actionType === 'production'
    ? { deviceId: '', planId: '', ngStation: '', description: '', severity: '高', notes: '' }
    : { deviceId: '', planId: '', description: '', severity: '高', notes: '' };
  const [form, setForm] = useState(blankForm);
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';

  const handleSubmit = (e) => {
    e.preventDefault();
    const device = devices.find(d => d.id === form.deviceId);
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const prefix = actionType === 'production' ? 'PWO' : 'DWO';
    const newId = `${prefix}-${Date.now().toString().slice(-6)}`;
    const planKey = actionType === 'production' ? 'productionPlanId' : 'deliveryPlanId';
    onSave({
      id: newId,
      type: actionType,
      [planKey]: form.planId,
      deviceId: form.deviceId,
      deviceSN: device?.sn || '',
      ...(actionType === 'production' ? { ngStation: form.ngStation } : {}),
      description: form.description,
      severity: form.severity,
      status: '待处理',
      assignedTo: '',
      notes: form.notes,
      createdAt: now,
      updatedAt: now,
      closedAt: null,
      repairActions: '',
      recheckResult: null,
      recheckPerson: null,
      processLogs: [],
    });
    setForm(blankForm);
    onClose();
  };

  const plans = actionType === 'production' ? workflowProductionPlans : deliveryPlans;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`新增${actionType === 'production' ? '生产' : '交付'}工单`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关联设备SN *</label>
            <select className={inp} required value={form.deviceId} onChange={e => setForm({ ...form, deviceId: e.target.value })}>
              <option value="">-- 选择设备 --</option>
              {devices.map(d => <option key={d.id} value={d.id}>{d.sn}（{d.status}）</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              关联{actionType === 'production' ? '生产计划' : '交付计划'} *
            </label>
            <select className={inp} required value={form.planId} onChange={e => setForm({ ...form, planId: e.target.value })}>
              <option value="">-- 选择计划 --</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
            </select>
          </div>
        </div>
        {actionType === 'production' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NG工站 *</label>
            <select className={inp} required value={form.ngStation} onChange={e => setForm({ ...form, ngStation: e.target.value })}>
              <option value="">-- 选择工站 --</option>
              {['半成品检验', '初测', '中测', 'OQT终测'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">故障描述 *</label>
          <textarea rows={3} className={inp} required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">严重程度 *</label>
          <div className="flex gap-4">
            {['高', '中', '低'].map(s => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="severity-add" value={s} checked={form.severity === s} onChange={() => setForm({ ...form, severity: s })} />
                <span className="text-sm">{s}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea rows={2} className={inp} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">提交</button>
        </div>
      </form>
    </Modal>
  );
}

/* ─────── Edit Work Order Modal ─────── */

function EditWorkOrderModal({ isOpen, onClose, wo, onSave }) {
  const [form, setForm] = useState({ description: wo?.description || '', severity: wo?.severity || '高', notes: wo?.notes || '' });
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="编辑工单">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 rounded p-3">
          <div><span className="text-gray-400">工单号：</span><span className="font-mono text-gray-600">{wo?.id}</span></div>
          <div><span className="text-gray-400">设备SN：</span><span className="font-mono text-gray-600">{wo?.deviceSN}</span></div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">故障描述 *</label>
          <textarea rows={3} className={inp} required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">严重程度 *</label>
          <div className="flex gap-4">
            {['高', '中', '低'].map(s => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="severity-edit" value={s} checked={form.severity === s} onChange={() => setForm({ ...form, severity: s })} />
                <span className="text-sm">{s}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea rows={2} className={inp} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">保存</button>
        </div>
      </form>
    </Modal>
  );
}

/* ─────── Void Work Order Modal ─────── */

function VoidWorkOrderModal({ isOpen, onClose, wo, onConfirm }) {
  const [reason, setReason] = useState('');
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="作废工单">
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
          作废后工单将不可恢复，也不参与统计，但记录保留可查。
        </div>
        <div className="text-sm text-gray-600">工单号：<span className="font-mono font-medium">{wo?.id}</span></div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">作废原因 *</label>
          <textarea rows={3} className={inp} value={reason} onChange={e => setReason(e.target.value)} placeholder="请填写作废原因（必填）" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button onClick={handleConfirm} disabled={!reason.trim()} className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-40">确认作废</button>
        </div>
      </div>
    </Modal>
  );
}

/* ─────── Work order detail panel ─────── */

function WorkOrderDetail({ wo, state, dispatch, currentUser, canDo, actionType }) {
  const { projects } = state;
  const [showStartModal, setShowStartModal] = useState(false);
  const [showRecheckModal, setShowRecheckModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [recheckResult, setRecheckResult] = useState('');

  const project = projects.find(p => p.id === wo.projectId);
  const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
  const updateType = actionType === 'production' ? 'UPDATE_PRODUCTION_WORK_ORDER' : 'UPDATE_DELIVERY_WORK_ORDER';

  const canEdit = ['待处理', '处理中'].includes(wo.status) && canDo('update_work_order');
  const canVoid = ['待处理', '处理中'].includes(wo.status) && canDo('update_work_order');

  const handleStartProcessing = (assignee) => {
    const t = now();
    const log = { time: t, operator: assignee, fromStatus: wo.status, toStatus: '处理中', notes: '已承接工单，开始处理' };
    dispatch({ type: updateType, payload: { id: wo.id, status: '处理中', assignedTo: assignee, updatedAt: t, processLogs: [...(wo.processLogs || []), log] } });
  };

  const handleSubmitRecheck = (recheckPerson) => {
    const t = now();
    const log = { time: t, operator: state.currentUser, fromStatus: wo.status, toStatus: '复检中', notes: '维修完成，提交复检', recheckPerson };
    dispatch({ type: updateType, payload: { id: wo.id, status: '复检中', recheckPerson, updatedAt: t, processLogs: [...(wo.processLogs || []), log] } });
  };

  const handleCloseOrder = () => {
    const t = now();
    const log = { time: t, operator: state.currentUser, fromStatus: wo.status, toStatus: '已关闭', notes: `复检${recheckResult}，关闭工单` };
    dispatch({ type: updateType, payload: { id: wo.id, status: '已关闭', recheckResult, closedAt: t, updatedAt: t, processLogs: [...(wo.processLogs || []), log] } });
    setRecheckResult('');
  };

  const handleRevertToProcessing = () => {
    const t = now();
    const log = { time: t, operator: state.currentUser, fromStatus: wo.status, toStatus: '处理中', notes: '复检未通过，打回维修' };
    dispatch({ type: updateType, payload: { id: wo.id, status: '处理中', recheckResult: null, updatedAt: t, processLogs: [...(wo.processLogs || []), log] } });
    setRecheckResult('');
  };

  const handleEdit = (form) => {
    dispatch({ type: updateType, payload: { id: wo.id, ...form, updatedAt: now() } });
  };

  const handleVoid = (reason) => {
    const t = now();
    const log = { time: t, operator: state.currentUser, fromStatus: wo.status, toStatus: '已作废', notes: `工单作废，原因：${reason}` };
    dispatch({ type: updateType, payload: { id: wo.id, status: '已作废', voidReason: reason, updatedAt: t, processLogs: [...(wo.processLogs || []), log] } });
  };

  return (
    <div className="px-6 py-5 space-y-5 bg-slate-50 border-b border-slate-200">
      {/* Status row */}
      <div className="flex items-center gap-4 text-sm flex-wrap">
        <div><span className="text-gray-500">状态：</span><StatusBadge status={wo.status} /></div>
        <div><span className="text-gray-500">严重程度：</span><StatusBadge status={wo.severity} /></div>
        {project && <div><span className="text-gray-500">所属项目：</span><Link to={`/projects/${project.id}`} className="text-slate-700 hover:underline">{project.name}</Link></div>}
        {wo.recheckPerson && <div><span className="text-gray-500">复检人：</span><span>{wo.recheckPerson}</span></div>}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Primary */}
        {wo.status === '待处理' && canDo('update_work_order') && (
          <button onClick={() => setShowStartModal(true)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">开始处理</button>
        )}
        {wo.status === '处理中' && canDo('update_work_order') && (
          <button onClick={() => setShowRecheckModal(true)} className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">提交复检</button>
        )}

        {/* Secondary */}
        <div className="flex-1" />
        {canEdit && (
          <button onClick={() => setShowEditModal(true)} className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50">编辑</button>
        )}
        {canVoid && (
          <button onClick={() => setShowVoidModal(true)} className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:underline">作废工单</button>
        )}
      </div>

      {/* Description + repair */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">故障描述</div>
          <div className="text-sm text-gray-800 bg-white border border-gray-200 rounded p-3 leading-relaxed">{wo.description}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">维修措施</div>
          <div className="text-sm text-gray-800 bg-white border border-gray-200 rounded p-3 leading-relaxed min-h-[60px]">
            {wo.repairActions || <span className="text-gray-400">暂无记录</span>}
          </div>
        </div>
      </div>

      {/* Attachments */}
      {(wo.attachmentDesc || wo.logFile || wo.imageFile) && (
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">附件</div>
          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            {wo.attachmentDesc && <span className="bg-gray-100 rounded px-2 py-0.5">{wo.attachmentDesc}</span>}
            {wo.logFile && <span className="bg-gray-100 rounded px-2 py-0.5">{wo.logFile}</span>}
            {wo.imageFile && <span className="bg-gray-100 rounded px-2 py-0.5">{wo.imageFile}</span>}
          </div>
        </div>
      )}

      {/* 复检 */}
      {wo.status === '复检中' && (
        <div className="bg-purple-50 border border-purple-200 rounded p-4">
          <div className="text-sm font-medium text-purple-800 mb-3">复检操作</div>
          <div className="flex gap-4 mb-3">
            {['合格', '不合格'].map(r => (
              <label key={r} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name={`recheck-${wo.id}`} value={r} checked={recheckResult === r} onChange={() => setRecheckResult(r)} />
                <span className={`text-sm font-medium ${r === '合格' ? 'text-green-700' : 'text-red-700'}`}>{r}</span>
              </label>
            ))}
          </div>
          {recheckResult && canDo('recheck_work_order') && (
            <div className="flex gap-2">
              {recheckResult === '不合格' && (
                <button onClick={handleRevertToProcessing} className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700">打回维修</button>
              )}
              {recheckResult === '合格' && (
                <button onClick={handleCloseOrder} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700">关闭工单</button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Process logs */}
      {wo.processLogs && wo.processLogs.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-500 mb-2">处理记录</div>
          <div className="space-y-2">
            {wo.processLogs.map((log, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-0.5 flex-shrink-0" />
                  {i < wo.processLogs.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="pb-2">
                  <div className="flex items-center gap-2 text-gray-500 mb-0.5">
                    <span>{log.time}</span>
                    <span className="font-medium text-gray-700">{log.operator}</span>
                    <span>·</span>
                    <StatusBadge status={log.fromStatus} />
                    <span className="text-gray-400">→</span>
                    <StatusBadge status={log.toStatus} />
                  </div>
                  <div className="text-gray-700">{log.notes}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <StartProcessingModal isOpen={showStartModal} onClose={() => setShowStartModal(false)} onConfirm={handleStartProcessing} currentUser={currentUser} />
      <SubmitRecheckModal isOpen={showRecheckModal} onClose={() => setShowRecheckModal(false)} onConfirm={handleSubmitRecheck} />
      {showEditModal && <EditWorkOrderModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} wo={wo} onSave={handleEdit} />}
      {showVoidModal && <VoidWorkOrderModal isOpen={showVoidModal} onClose={() => setShowVoidModal(false)} wo={wo} onConfirm={handleVoid} />}
    </div>
  );
}

/* ─────── Generic Work Order Table ─────── */
function WorkOrderTable({ workOrders, actionType, state, dispatch, currentUser, canDo }) {
  const [filterStatus, setFilterStatus] = useState('全部');
  const [expandedId, setExpandedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const activeWOs = workOrders.filter(w => w.status !== '已作废');
  const voidedWOs = workOrders.filter(w => w.status === '已作废');

  const filtered = [...workOrders]
    .filter(w => {
      if (filterStatus === '全部') return w.status !== '已作废';
      return w.status === filterStatus;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const statusCounts = { '待处理': 0, '处理中': 0, '复检中': 0, '已关闭': 0, '已作废': 0 };
  workOrders.forEach(w => { if (statusCounts[w.status] !== undefined) statusCounts[w.status]++; });

  const handleAdd = (wo) => {
    dispatch({ type: actionType === 'production' ? 'ADD_PRODUCTION_WORK_ORDER' : 'ADD_DELIVERY_WORK_ORDER', payload: wo });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap gap-2">
          {['全部', '待处理', '处理中', '复检中', '已关闭', '已作废'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${filterStatus === s ? 'bg-slate-700 text-white border-slate-700' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
              {s === '全部'
                ? <>{s} <span className="ml-1">{activeWOs.length}</span></>
                : <>{s} <span className="ml-1 font-bold">{statusCounts[s] ?? 0}</span></>}
            </button>
          ))}
        </div>
        {canDo('update_work_order') && (
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800 flex-shrink-0">
            + 新增工单
          </button>
        )}
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['工单号', '设备SN', '故障描述', '严重程度', '状态', '处理人', '创建时间', ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(wo => {
              const isExpanded = expandedId === wo.id;
              const isVoided = wo.status === '已作废';
              return (
                <React.Fragment key={wo.id}>
                  <tr onClick={() => setExpandedId(isExpanded ? null : wo.id)}
                    className={`cursor-pointer border-t border-gray-100 transition-colors hover:bg-blue-50 ${isExpanded ? 'bg-slate-50' : ''} ${isVoided ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{wo.id}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-800 font-medium">{wo.deviceSN}</td>
                    <td className="px-4 py-2.5 text-gray-700 max-w-[200px]"><div className="truncate">{wo.description}</div></td>
                    <td className="px-4 py-2.5"><StatusBadge status={wo.severity} /></td>
                    <td className="px-4 py-2.5"><StatusBadge status={wo.status} /></td>
                    <td className="px-4 py-2.5 text-gray-600">{wo.assignedTo || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{wo.createdAt}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{isExpanded ? '▲ 收起' : '▼ 展开'}</td>
                  </tr>
                  {isExpanded && !isVoided && (
                    <tr>
                      <td colSpan={8} className="p-0">
                        <WorkOrderDetail wo={wo} state={state} dispatch={dispatch} currentUser={currentUser} canDo={canDo} actionType={actionType} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">暂无工单</td></tr>}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddWorkOrderModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAdd}
          actionType={actionType}
          state={state}
        />
      )}
    </div>
  );
}

/* ─────── Main ─────── */
export default function AfterSalesPage() {
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'production';
  const activeTab = TABS.some(t => t.key === tab) ? tab : 'production';

  const setTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    setSearchParams(next);
  };

  const productionWOs = state.productionWorkOrders || [];
  const deliveryWOs = state.deliveryWorkOrders || [];

  return (
    <div>
      <div className="px-6 pt-5 pb-4 bg-white border-b border-gray-100">
        <SecondaryTabs
          tabs={TABS.map(t => ({
            ...t,
            badge: t.key === 'production' ? productionWOs.filter(w => w.status === '待处理').length : 0,
          }))}
          activeTab={activeTab}
          onChange={setTab}
        />
      </div>
      <div className="p-6">
        {activeTab === 'production' && (
          <WorkOrderTable workOrders={productionWOs} actionType="production" state={state} dispatch={dispatch} currentUser={state.currentUser} canDo={canDo} />
        )}
        {activeTab === 'delivery' && (
          <WorkOrderTable workOrders={deliveryWOs} actionType="delivery" state={state} dispatch={dispatch} currentUser={state.currentUser} canDo={canDo} />
        )}
      </div>
    </div>
  );
}
