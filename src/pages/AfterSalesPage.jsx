import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { FEISHU_USERS } from '../data/mockData';

const TABS = [
  { key: 'orders',  label: '工单中心' },
  { key: 'quality', label: '质量问题台账' },
];

// 售后管理边界说明（在工单中心 / 质量问题台账内展示）：
// 生产测试 NG → 生产返修记录（不进入售后工单）；
// 出厂检验 / 现场安装调试 / 客户验收 NG → 交付工单；
// 在线运营后的问题 → 售后工单或质量问题记录。
const WO_TYPE_LABEL = { delivery: '交付工单', aftersales: '售后工单', production: '生产返修记录' };

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
  const updateType = actionType === 'production' ? 'UPDATE_PRODUCTION_WORK_ORDER'
    : actionType === 'aftersales' ? 'UPDATE_WORK_ORDER'
    : 'UPDATE_DELIVERY_WORK_ORDER';

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

/* ─────── 工单中心：新增工单弹窗（工单类型动态） ─────── */
const SOURCE_NODES = {
  delivery: ['出厂检验', '现场安装调试', '客户验收'],
  aftersales: ['在线运营', '客户反馈', '手动录入'],
};
function OrderCenterAddModal({ isOpen, onClose, onSave, state }) {
  const { projects, devices, deliveryPlans = [] } = state;
  const [form, setForm] = useState({ woType: 'delivery', projectId: '', deviceId: '', deliveryPlanId: '', sourceNode: '', description: '', severity: '高', assignedTo: '', notes: '' });
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  const projDevices = form.projectId ? devices.filter(d => d.projectId === form.projectId) : devices;
  const projDeliveryPlans = form.projectId ? deliveryPlans.filter(p => p.projectId === form.projectId) : deliveryPlans;

  const submit = (e) => {
    e.preventDefault();
    const device = devices.find(d => d.id === form.deviceId);
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const prefix = form.woType === 'delivery' ? 'DWO' : 'WO';
    onSave(form.woType, {
      id: `${prefix}-${Date.now().toString().slice(-6)}`, type: form.woType,
      projectId: form.projectId, deviceId: form.deviceId, deviceSN: device?.sn || '',
      deliveryPlanId: form.woType === 'delivery' ? form.deliveryPlanId : undefined,
      sourceNode: form.sourceNode, description: form.description, severity: form.severity,
      status: '待处理', assignedTo: form.assignedTo, notes: form.notes,
      createdAt: now, updatedAt: now, closedAt: null, processLogs: [],
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增工单" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">工单类型 *</label>
            <select className={inp} value={form.woType} onChange={e => setForm({ ...form, woType: e.target.value, sourceNode: '' })}>
              <option value="delivery">交付工单</option>
              <option value="aftersales">售后工单</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">来源节点 *</label>
            <select className={inp} required value={form.sourceNode} onChange={e => setForm({ ...form, sourceNode: e.target.value })}>
              <option value="">-- 选择来源节点 --</option>
              {SOURCE_NODES[form.woType].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关联项目</label>
            <select className={inp} value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value, deviceId: '', deliveryPlanId: '' })}>
              <option value="">-- 选择项目 --</option>
              {projects.filter(p => !p.voided).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关联设备SN *</label>
            <select className={inp} required value={form.deviceId} onChange={e => setForm({ ...form, deviceId: e.target.value })}>
              <option value="">-- 选择设备 --</option>
              {projDevices.map(d => <option key={d.id} value={d.id}>{d.sn}</option>)}
            </select>
          </div>
          {form.woType === 'delivery' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">关联交付计划</label>
              <select className={inp} value={form.deliveryPlanId} onChange={e => setForm({ ...form, deliveryPlanId: e.target.value })}>
                <option value="">-- 选择交付计划 --</option>
                {projDeliveryPlans.map(p => <option key={p.id} value={p.id}>{p.batchNo || p.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">负责人</label>
            <select className={inp} value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
              <option value="">-- 待指派 --</option>
              {FEISHU_USERS.map(u => <option key={u.id} value={u.name}>{u.name}（{u.dept}）</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">严重程度 *</label>
            <select className={inp} value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
              {['高', '中', '低'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">问题描述 *</label>
            <textarea rows={3} className={inp} required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">附件</label>
            <input className={`${inp} bg-gray-50 text-gray-400`} disabled placeholder="（原型占位）支持上传日志 / 图片" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea rows={2} className={inp} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700">
          {form.woType === 'delivery' ? '交付工单来源于：出厂检验、现场安装调试、客户验收。' : '售后工单来源于：在线运营、客户反馈、手动录入。'}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">提交</button>
        </div>
      </form>
    </Modal>
  );
}

/* ─────── 工单中心：交付工单 + 售后工单 ─────── */
function OrderCenterTable({ state, dispatch, currentUser, canDo }) {
  const [filterStatus, setFilterStatus] = useState('全部');
  const [filterType, setFilterType] = useState('全部');
  const [expandedId, setExpandedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { projects } = state;

  const deliveryWOs = (state.deliveryWorkOrders || []).map(w => ({ ...w, _kind: 'delivery' }));
  const aftersalesWOs = (state.workOrders || []).map(w => ({ ...w, _kind: 'aftersales' }));
  const allOrders = [...deliveryWOs, ...aftersalesWOs];

  const sourceNode = (w) => w.sourceNode || w.ngStation || (w._kind === 'aftersales' ? '在线运营' : '出厂检验');
  const getProjectName = id => projects.find(p => p.id === id)?.name || '—';

  const filtered = allOrders
    .filter(w => (filterStatus === '全部' ? w.status !== '已作废' : w.status === filterStatus))
    .filter(w => filterType === '全部' || w._kind === filterType)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const statusCounts = { '待处理': 0, '处理中': 0, '复检中': 0, '已关闭': 0, '已作废': 0 };
  allOrders.forEach(w => { if (statusCounts[w.status] !== undefined) statusCounts[w.status]++; });

  const handleAdd = (woType, wo) => dispatch({ type: woType === 'delivery' ? 'ADD_DELIVERY_WORK_ORDER' : 'ADD_WORK_ORDER', payload: wo });

  return (
    <div>
      <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700 mb-4">
        工单中心用于派人处理、状态推进和闭环。生产测试 NG 进入「生产返修记录」不在此；出厂检验 / 现场安装调试 / 客户验收 NG → 交付工单；在线运营后的问题 → 售后工单。
      </div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          {['全部', '待处理', '处理中', '复检中', '已关闭', '已作废'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 text-xs rounded-full border font-medium ${filterStatus === s ? 'bg-slate-700 text-white border-slate-700' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
              {s === '全部' ? `全部 ${allOrders.filter(w => w.status !== '已作废').length}` : `${s} ${statusCounts[s] ?? 0}`}
            </button>
          ))}
          <select className="border border-gray-300 rounded px-3 py-1 text-xs text-gray-600 focus:outline-none" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="全部">全部类型</option>
            <option value="delivery">交付工单</option>
            <option value="aftersales">售后工单</option>
          </select>
        </div>
        {canDo('update_work_order') && (
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800 flex-shrink-0">+ 新增工单</button>
        )}
      </div>

      <div className="bg-white rounded shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['工单ID', '工单类型', '关联项目', '关联设备SN', '关联交付计划', '来源节点', '问题描述', '严重程度', '状态', '负责人', '创建时间', ''].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
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
                    className={`cursor-pointer border-t border-gray-100 hover:bg-blue-50 ${isExpanded ? 'bg-slate-50' : ''} ${isVoided ? 'opacity-50' : ''}`}>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-600 whitespace-nowrap">{wo.id}</td>
                    <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full border ${wo._kind === 'delivery' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>{WO_TYPE_LABEL[wo._kind]}</span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{getProjectName(wo.projectId)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-800 font-medium whitespace-nowrap">{wo.deviceSN}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-500 whitespace-nowrap">{wo.deliveryPlanId || '—'}</td>
                    <td className="px-3 py-2.5 text-xs"><StatusBadge status={sourceNode(wo)} /></td>
                    <td className="px-3 py-2.5 text-gray-700 max-w-[180px]"><div className="truncate">{wo.description}</div></td>
                    <td className="px-3 py-2.5"><StatusBadge status={wo.severity} /></td>
                    <td className="px-3 py-2.5"><StatusBadge status={wo.status} /></td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{wo.assignedTo || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">{wo.createdAt}</td>
                    <td className="px-3 py-2.5 text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</td>
                  </tr>
                  {isExpanded && !isVoided && (
                    <tr>
                      <td colSpan={12} className="p-0">
                        <WorkOrderDetail wo={wo} state={state} dispatch={dispatch} currentUser={currentUser} canDo={canDo} actionType={wo._kind} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-400">暂无工单</td></tr>}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <OrderCenterAddModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleAdd} state={state} />
      )}
    </div>
  );
}

/* ─────── Quality Issue: Scan QR Modal ─────── */
function ScanQRModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="扫码上报问题">
      <div className="space-y-5 text-center">
        <p className="text-sm text-gray-600 text-left">使用飞书扫一扫扫描下方二维码，自动识别设备信息后填写上报。</p>
        <div className="flex justify-center">
          <svg width="160" height="160" viewBox="0 0 160 160" className="border border-gray-200 rounded p-2">
            <rect x="10" y="10" width="50" height="50" rx="3" fill="none" stroke="#1e293b" strokeWidth="5"/>
            <rect x="20" y="20" width="30" height="30" rx="1" fill="#1e293b"/>
            <rect x="100" y="10" width="50" height="50" rx="3" fill="none" stroke="#1e293b" strokeWidth="5"/>
            <rect x="110" y="20" width="30" height="30" rx="1" fill="#1e293b"/>
            <rect x="10" y="100" width="50" height="50" rx="3" fill="none" stroke="#1e293b" strokeWidth="5"/>
            <rect x="20" y="110" width="30" height="30" rx="1" fill="#1e293b"/>
            <rect x="75" y="10" width="8" height="8" fill="#1e293b"/>
            <rect x="87" y="10" width="8" height="8" fill="#1e293b"/>
            <rect x="75" y="22" width="8" height="8" fill="#1e293b"/>
            <rect x="87" y="22" width="8" height="8" fill="#1e293b"/>
            <rect x="75" y="75" width="8" height="8" fill="#1e293b"/>
            <rect x="87" y="75" width="8" height="8" fill="#1e293b"/>
            <rect x="99" y="75" width="8" height="8" fill="#1e293b"/>
            <rect x="111" y="75" width="8" height="8" fill="#1e293b"/>
            <rect x="123" y="75" width="8" height="8" fill="#1e293b"/>
            <rect x="135" y="75" width="8" height="8" fill="#1e293b"/>
            <rect x="75" y="87" width="8" height="8" fill="#1e293b"/>
            <rect x="99" y="87" width="8" height="8" fill="#1e293b"/>
            <rect x="111" y="87" width="8" height="8" fill="#1e293b"/>
            <rect x="135" y="87" width="8" height="8" fill="#1e293b"/>
            <rect x="75" y="99" width="8" height="8" fill="#1e293b"/>
            <rect x="87" y="99" width="8" height="8" fill="#1e293b"/>
            <rect x="111" y="99" width="8" height="8" fill="#1e293b"/>
            <rect x="123" y="99" width="8" height="8" fill="#1e293b"/>
            <rect x="75" y="111" width="8" height="8" fill="#1e293b"/>
            <rect x="99" y="111" width="8" height="8" fill="#1e293b"/>
            <rect x="135" y="111" width="8" height="8" fill="#1e293b"/>
            <rect x="75" y="123" width="8" height="8" fill="#1e293b"/>
            <rect x="87" y="123" width="8" height="8" fill="#1e293b"/>
            <rect x="99" y="123" width="8" height="8" fill="#1e293b"/>
            <rect x="123" y="123" width="8" height="8" fill="#1e293b"/>
            <rect x="135" y="123" width="8" height="8" fill="#1e293b"/>
            <rect x="75" y="135" width="8" height="8" fill="#1e293b"/>
            <rect x="111" y="135" width="8" height="8" fill="#1e293b"/>
            <rect x="123" y="135" width="8" height="8" fill="#1e293b"/>
          </svg>
        </div>
        <p className="text-xs text-gray-400">扫码后将在飞书内打开填报页面，设备信息自动带入</p>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">关闭</button>
        </div>
      </div>
    </Modal>
  );
}

/* ─────── Quality Issue: Manual Entry Modal ─────── */
function ManualEntryModal({ isOpen, onClose, onSave, state }) {
  const { projects, devices, locations = [] } = state;
  const [form, setForm] = useState({ projectId: '', deviceId: '', locationId: '', sourceStage: '在线运营', issueType: '功能异常', severity: '中', issueDesc: '', genWorkOrder: false });
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';

  const projDevices = form.projectId ? devices.filter(d => d.projectId === form.projectId) : [];
  const projLocations = form.projectId ? locations.filter(l => l.projectId === form.projectId) : [];
  const selectedDevice = devices.find(d => d.id === form.deviceId);

  const handleSubmit = (e) => {
    e.preventDefault();
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const id = `QI-${Date.now().toString().slice(-6)}`;
    onSave({
      id,
      deviceId: form.deviceId,
      deviceSN: selectedDevice?.sn || '',
      deviceName: selectedDevice ? (state.deviceTypes?.find(dt => dt.id === selectedDevice.deviceTypeId)?.name || '') : '',
      locationId: form.locationId || null,
      projectId: form.projectId,
      sourceStage: form.sourceStage,
      issueType: form.issueType,
      severity: form.severity,
      issueDesc: form.issueDesc,
      reporterId: state.currentUserId,
      reporterName: state.currentUser,
      owner: state.currentUser,
      reportTime: now,
      status: '待处理',
      source: '手动录入',
      linkedWorkOrder: form.genWorkOrder,
      processLogs: [],
    });
    setForm({ projectId: '', deviceId: '', locationId: '', sourceStage: '在线运营', issueType: '功能异常', severity: '中', issueDesc: '', genWorkOrder: false });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="手动录入质量问题" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">所属项目 *</label>
            <select className={inp} required value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value, deviceId: '', locationId: '' })}>
              <option value="">-- 选择项目 --</option>
              {projects.filter(p => !p.voided).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">设备SN *</label>
            <select className={inp} required value={form.deviceId} onChange={e => setForm({ ...form, deviceId: e.target.value })} disabled={!form.projectId}>
              <option value="">-- 选择设备 --</option>
              {projDevices.map(d => <option key={d.id} value={d.id}>{d.sn}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">设备名称</label>
            <input className={`${inp} bg-gray-50`} readOnly value={selectedDevice ? (state.deviceTypes?.find(dt => dt.id === selectedDevice.deviceTypeId)?.name || '') : ''} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">所属点位</label>
            <select className={inp} value={form.locationId} onChange={e => setForm({ ...form, locationId: e.target.value })} disabled={!form.projectId}>
              <option value="">— 不选择点位 —</option>
              {projLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">来源阶段</label>
            <select className={inp} value={form.sourceStage} onChange={e => setForm({ ...form, sourceStage: e.target.value })}>
              {['生产测试', '出厂检验', '现场安装调试', '客户验收', '在线运营'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">上报方式</label>
            <input className={`${inp} bg-gray-50`} readOnly value="手动录入" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">问题类型</label>
            <select className={inp} value={form.issueType} onChange={e => setForm({ ...form, issueType: e.target.value })}>
              {['功能异常', '外观缺陷', '性能不达标', '通信异常', '其他'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">严重程度</label>
            <select className={inp} value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
              {['高', '中', '低'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">问题描述 *</label>
          <textarea rows={4} className={inp} required value={form.issueDesc} onChange={e => setForm({ ...form, issueDesc: e.target.value })} placeholder="请描述发现的问题..." />
        </div>
        <div className="grid grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">附件</label>
            <input className={`${inp} bg-gray-50 text-gray-400`} disabled placeholder="（原型占位）支持上传图片 / 日志" />
          </div>
          <label className="flex items-center gap-2 mt-5 cursor-pointer">
            <input type="checkbox" checked={form.genWorkOrder} onChange={e => setForm({ ...form, genWorkOrder: e.target.checked })} />
            <span className="text-sm text-gray-700">提交后同时生成工单</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">提交</button>
        </div>
      </form>
    </Modal>
  );
}

/* ─────── Quality Issue Detail ─────── */
function QualityIssueDetail({ qi, state, dispatch, canDo }) {
  const { projects, locations = [] } = state;
  const [closeNote, setCloseNote] = useState('');
  const [showClose, setShowClose] = useState(false);
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';

  const project = projects.find(p => p.id === qi.projectId);
  const location = locations.find(l => l.id === qi.locationId);
  const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

  const handleStart = () => {
    const t = now();
    const log = { time: t, operator: state.currentUser, fromStatus: qi.status, toStatus: '处理中', notes: '开始处理' };
    dispatch({ type: 'UPDATE_QUALITY_ISSUE', payload: { id: qi.id, status: '处理中', processLogs: [...(qi.processLogs || []), log] } });
  };

  const handleClose = (e) => {
    e.preventDefault();
    const t = now();
    const log = { time: t, operator: state.currentUser, fromStatus: qi.status, toStatus: '已关闭', notes: closeNote || '问题已解决，关闭' };
    dispatch({ type: 'UPDATE_QUALITY_ISSUE', payload: { id: qi.id, status: '已关闭', processLogs: [...(qi.processLogs || []), log] } });
    setCloseNote('');
    setShowClose(false);
  };

  return (
    <div className="px-6 py-5 space-y-5 bg-slate-50 border-b border-slate-200">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div><span className="text-gray-500">问题编号：</span><span className="font-mono text-gray-700">{qi.id}</span></div>
        <div><span className="text-gray-500">来源：</span><span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${qi.source === '扫码上报' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>{qi.source}</span></div>
        {project && <div><span className="text-gray-500">项目：</span><span className="text-gray-700">{project.name}</span></div>}
        {location && <div><span className="text-gray-500">点位：</span><span className="text-gray-700">{location.name}</span></div>}
        <div><span className="text-gray-500">上报人：</span><span className="text-gray-700">{qi.reporterName}</span></div>
      </div>
      <div>
        <div className="text-xs font-medium text-gray-500 mb-1">问题描述</div>
        <div className="text-sm text-gray-800 bg-white border border-gray-200 rounded p-3 leading-relaxed">{qi.issueDesc}</div>
      </div>
      <div className="flex items-center gap-3">
        {qi.status === '待处理' && canDo('update_quality_issue') && (
          <button onClick={handleStart} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">开始处理</button>
        )}
        {qi.status === '处理中' && canDo('update_quality_issue') && (
          <button onClick={() => setShowClose(v => !v)} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700">关闭问题</button>
        )}
      </div>
      {showClose && (
        <form onSubmit={handleClose} className="bg-green-50 border border-green-200 rounded p-4 space-y-3">
          <div className="text-sm font-medium text-green-800">填写处理结果后关闭问题</div>
          <textarea rows={3} className={inp} value={closeNote} onChange={e => setCloseNote(e.target.value)} placeholder="请描述处理结果（选填）" />
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700">确认关闭</button>
            <button type="button" onClick={() => setShowClose(false)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          </div>
        </form>
      )}
      {qi.processLogs && qi.processLogs.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-500 mb-2">处理记录</div>
          <div className="space-y-2">
            {qi.processLogs.map((log, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-0.5 flex-shrink-0" />
                  {i < qi.processLogs.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="pb-2">
                  <div className="flex items-center gap-2 text-gray-500 mb-0.5">
                    <span>{log.time}</span>
                    <span className="font-medium text-gray-700">{log.operator}</span>
                    <span>·</span><StatusBadge status={log.fromStatus} /><span className="text-gray-400">→</span><StatusBadge status={log.toStatus} />
                  </div>
                  <div className="text-gray-700">{log.notes}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────── Quality Issue Table ─────── */
function QualityIssueTable({ state, dispatch, canDo }) {
  const { qualityIssues = [], projects, locations = [] } = state;
  const [filterStatus, setFilterStatus] = useState('全部');
  const [filterProject, setFilterProject] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  const getLocationName = id => locations.find(l => l.id === id)?.name || '—';
  const getProjectName = id => projects.find(p => p.id === id)?.name || '—';

  const filtered = qualityIssues.filter(qi => {
    const matchStatus = filterStatus === '全部' || qi.status === filterStatus;
    const matchProject = !filterProject || qi.projectId === filterProject;
    return matchStatus && matchProject;
  }).sort((a, b) => b.reportTime.localeCompare(a.reportTime));

  const statusCounts = { '待处理': 0, '处理中': 0, '已关闭': 0 };
  qualityIssues.forEach(qi => { if (statusCounts[qi.status] !== undefined) statusCounts[qi.status]++; });

  const handleSave = (qi) => {
    dispatch({ type: 'ADD_QUALITY_ISSUE', payload: qi });
  };

  return (
    <div>
      <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700 mb-4">
        扫码上报和手动录入仅作为质量问题创建入口，提交后进入质量问题台账；需要处理的问题可进一步生成工单。质量问题台账用于质量沉淀、追溯和统计，不替代工单处理。
      </div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          {['全部', '待处理', '处理中', '已关闭'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${filterStatus === s ? 'bg-slate-700 text-white border-slate-700' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
              {s === '全部' ? `全部 ${qualityIssues.length}` : `${s} ${statusCounts[s] ?? 0}`}
            </button>
          ))}
          <select className="border border-gray-300 rounded px-3 py-1 text-xs text-gray-600 focus:outline-none"
            value={filterProject} onChange={e => setFilterProject(e.target.value)}>
            <option value="">全部项目</option>
            {projects.filter(p => !p.voided).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowScanModal(true)} className="px-4 py-2 border border-slate-600 text-slate-700 text-sm rounded hover:bg-slate-50">扫码上报</button>
          {canDo('add_quality_issue') && (
            <button onClick={() => setShowManualModal(true)} className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">+ 手动录入</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['问题编号', '设备SN', '设备名称', '所属点位', '所属项目', '来源阶段', '问题描述', '严重程度', '上报方式', '上报人', '上报时间', '状态'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(qi => {
              const isExpanded = expandedId === qi.id;
              return (
                <React.Fragment key={qi.id}>
                  <tr onClick={() => setExpandedId(isExpanded ? null : qi.id)}
                    className={`cursor-pointer border-t border-gray-100 hover:bg-blue-50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{qi.id}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-800 font-medium">{qi.deviceSN}</td>
                    <td className="px-3 py-2.5 text-gray-700 text-xs">{qi.deviceName}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{qi.locationId ? getLocationName(qi.locationId) : '—'}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{getProjectName(qi.projectId)}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{qi.sourceStage || '在线运营'}</td>
                    <td className="px-3 py-2.5 text-gray-700 max-w-[160px]"><div className="truncate text-xs">{qi.issueDesc}</div></td>
                    <td className="px-3 py-2.5"><StatusBadge status={qi.severity || '中'} /></td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${qi.source === '扫码上报' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>{qi.source}</span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{qi.reporterName}</td>
                    <td className="px-3 py-2.5 text-gray-400 text-xs">{qi.reportTime}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={qi.status} /></td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={12} className="p-0">
                        <QualityIssueDetail qi={qi} state={state} dispatch={dispatch} canDo={canDo} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-400">暂无质量问题记录</td></tr>}
          </tbody>
        </table>
      </div>

      <ScanQRModal isOpen={showScanModal} onClose={() => setShowScanModal(false)} />
      {showManualModal && <ManualEntryModal isOpen={showManualModal} onClose={() => setShowManualModal(false)} onSave={handleSave} state={state} />}
    </div>
  );
}

/* ─────── Main ─────── */
export default function AfterSalesPage() {
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'orders';
  const activeTab = TABS.some(t => t.key === tab) ? tab : 'orders';
  const activeLabel = TABS.find(t => t.key === activeTab)?.label || '';

  return (
    <div>
      <div className="px-6 pt-5 pb-4 bg-white border-b border-gray-100">
        <div className="text-xs text-gray-400">设备全生命周期质量管理平台 / 售后管理 / {activeLabel}</div>
      </div>
      <div className="p-6">
        {activeTab === 'orders' && (
          <OrderCenterTable state={state} dispatch={dispatch} currentUser={state.currentUser} canDo={canDo} />
        )}
        {activeTab === 'quality' && (
          <QualityIssueTable state={state} dispatch={dispatch} canDo={canDo} />
        )}
      </div>
    </div>
  );
}
