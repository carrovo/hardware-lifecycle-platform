import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Pagination, usePaged } from '../components/Pagination';
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

/* ─────── 工单中心：工单分类与来源阶段 ─────── */
const WO_CLASSES = ['换件工单', '软件问题工单', '其他问题工单'];
const WO_STAGES = ['出厂检验', '现场安装调试', '客户验收', '在线运营', '客户反馈', '手动录入'];
const WO_CLASS_STYLE = {
  换件工单: 'bg-orange-50 text-orange-700 border-orange-200',
  软件问题工单: 'bg-blue-50 text-blue-700 border-blue-200',
  其他问题工单: 'bg-gray-50 text-gray-600 border-gray-200',
};
// 依据既有数据推断工单分类 / 阶段（无字段时兜底）。
function woClassOf(wo) {
  if (wo.woClass) return wo.woClass;
  const d = wo.description || '';
  if (/软件|固件|版本|系统|程序|算法/.test(d)) return '软件问题工单';
  if (/更换|换件|模块|损坏|裂|烧|断|器件|传感器|电机|相机/.test(d) || wo._kind === 'aftersales') return '换件工单';
  return '其他问题工单';
}
const woStageOf = (wo) => wo.stage || wo.sourceNode || wo.ngStation || (wo._kind === 'aftersales' ? '在线运营' : '出厂检验');

function OrderCenterAddModal({ isOpen, onClose, onSave, state }) {
  const { projects, devices, moduleTypes = [], materials = [], deliveryPlans = [] } = state;
  const [form, setForm] = useState({ woClass: '换件工单', projectId: '', deviceId: '', deliveryPlanId: '', stage: '', needModuleType: '', oldModuleSN: '', newModuleId: '', softwareVersion: '', issueType: '功能异常', repro: '', expectBehavior: '', actualBehavior: '', otherCategory: '体验优化', feedbackSource: '', description: '', severity: '高', assignedTo: '', notes: '' });
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  const projDevices = form.projectId ? devices.filter(d => d.projectId === form.projectId) : devices;
  const chosenType = moduleTypes.find(m => m.id === form.needModuleType);
  const availableNew = materials.filter(m => m.status === '待装配' && (!chosenType || m.category === chosenType.category));
  const chosenNew = materials.find(m => m.id === form.newModuleId);

  const submit = (e) => {
    e.preventDefault();
    const device = devices.find(d => d.id === form.deviceId);
    const newMod = materials.find(m => m.id === form.newModuleId);
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    onSave({
      id: `WO-${Date.now().toString().slice(-6)}`, type: 'aftersales', woClass: form.woClass,
      stage: form.stage, projectId: form.projectId, deviceId: form.deviceId, deviceSN: device?.sn || '',
      deliveryPlanId: form.deliveryPlanId || undefined,
      involvesSwap: form.woClass === '换件工单',
      needModuleType: form.woClass === '换件工单' ? chosenType?.name : undefined,
      oldModuleSN: form.woClass === '换件工单' ? form.oldModuleSN : undefined,
      newModuleSN: form.woClass === '换件工单' ? (newMod?.sn || '') : undefined,
      softwareVersion: form.woClass === '软件问题工单' ? form.softwareVersion : undefined,
      issueType: form.woClass === '软件问题工单' ? form.issueType : undefined,
      repro: form.woClass === '软件问题工单' ? form.repro : undefined,
      expectBehavior: form.woClass === '软件问题工单' ? form.expectBehavior : undefined,
      actualBehavior: form.woClass === '软件问题工单' ? form.actualBehavior : undefined,
      problemCategory: form.woClass === '其他问题工单' ? form.otherCategory : undefined,
      feedbackSource: form.woClass === '其他问题工单' ? form.feedbackSource : undefined,
      description: form.description, severity: form.severity, status: '待处理',
      assignedTo: form.assignedTo, notes: form.notes, createdAt: now, updatedAt: now, closedAt: null, processLogs: [],
    });
    onClose();
  };

  const isSwap = form.woClass === '换件工单';
  const isSoft = form.woClass === '软件问题工单';
  const isOther = form.woClass === '其他问题工单';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增工单" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">工单类型 *</label>
            <select className={inp} value={form.woClass} onChange={e => setForm({ ...form, woClass: e.target.value })}>
              {WO_CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">所属阶段 *</label>
            <select className={inp} required value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
              <option value="">-- 选择阶段 --</option>
              {WO_STAGES.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关联项目</label>
            <select className={inp} value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value, deviceId: '' })}>
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

          {isSwap && <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">需更换模块类型 *</label>
              <select className={inp} required value={form.needModuleType} onChange={e => setForm({ ...form, needModuleType: e.target.value, newModuleId: '' })}>
                <option value="">-- 选择模块类型 --</option>
                {moduleTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">旧模块SN</label>
              <input className={inp} value={form.oldModuleSN} onChange={e => setForm({ ...form, oldModuleSN: e.target.value })} placeholder="被更换的旧模块SN" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新模块SN *（仅在库可用）</label>
              <select className={inp} required value={form.newModuleId} onChange={e => setForm({ ...form, newModuleId: e.target.value })}>
                <option value="">-- 选择在库可用模块 --</option>
                {availableNew.map(m => <option key={m.id} value={m.id}>{m.sn}（{m.supplier}）</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新模块库存状态</label>
              <input className={`${inp} bg-gray-50`} readOnly value={form.newModuleId ? '在库可用' : '—'} />
            </div>
          </>}

          {isSoft && <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">软件版本</label>
              <input className={inp} value={form.softwareVersion} onChange={e => setForm({ ...form, softwareVersion: e.target.value })} placeholder="如 v2.3.1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">问题类型</label>
              <select className={inp} value={form.issueType} onChange={e => setForm({ ...form, issueType: e.target.value })}>
                {['功能异常', '崩溃/卡死', '性能问题', '兼容性', '其他'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">复现步骤</label>
              <textarea rows={2} className={inp} value={form.repro} onChange={e => setForm({ ...form, repro: e.target.value })} placeholder="描述如何复现该问题" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期望表现</label>
              <textarea rows={2} className={inp} value={form.expectBehavior} onChange={e => setForm({ ...form, expectBehavior: e.target.value })} placeholder="正常情况下应有的表现" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">实际表现</label>
              <textarea rows={2} className={inp} value={form.actualBehavior} onChange={e => setForm({ ...form, actualBehavior: e.target.value })} placeholder="实际观察到的异常表现" />
            </div>
          </>}

          {isOther && <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">问题分类</label>
              <select className={inp} value={form.otherCategory} onChange={e => setForm({ ...form, otherCategory: e.target.value })}>
                {['体验优化', '客户建议', '需求变更', '非硬件非软件', '其他'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">客户反馈来源</label>
              <input className={inp} value={form.feedbackSource} onChange={e => setForm({ ...form, feedbackSource: e.target.value })} placeholder="如 客户现场 / 电话 / 飞书群" />
            </div>
          </>}

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
          {isSwap ? '换件工单：需选择需更换模块类型与新模块SN（仅在库可用）。换件完成后设备详情新增换件记录，旧模块可转维修中/已报废，新模块变为已装配。'
            : isSoft ? '软件问题工单：不要求选择模块SN，可关联软件版本、问题类型与复现步骤，流转到研发/软件处理人。'
            : '其他问题工单：用于体验优化、客户反馈等非硬件非软件明确归因的问题。'}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800">提交</button>
        </div>
      </form>
    </Modal>
  );
}

/* 分配负责人弹窗 */
function AssignOwnerModal({ isOpen, onClose, wo, onConfirm }) {
  const [assignee, setAssignee] = useState(wo?.assignedTo || '');
  const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500';
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="分配负责人">
      <div className="space-y-4">
        <div className="text-sm text-gray-600">工单号：<span className="font-mono font-medium">{wo?.id}</span></div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">负责人 *</label>
          <select className={inp} value={assignee} onChange={e => setAssignee(e.target.value)}>
            <option value="">-- 选择负责人 --</option>
            {FEISHU_USERS.map(u => <option key={u.id} value={u.name}>{u.name}（{u.dept}）</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button onClick={() => { if (assignee) { onConfirm(assignee); onClose(); } }} disabled={!assignee} className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-40">确认分配</button>
        </div>
      </div>
    </Modal>
  );
}

/* ─────── 工单中心：交付工单 + 售后工单 ─────── */
function OrderCenterTable({ state, dispatch, currentUser, canDo }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('全部');
  const [filterClass, setFilterClass] = useState('全部');
  const [filterStage, setFilterStage] = useState('全部');
  const [filterSeverity, setFilterSeverity] = useState('全部');
  const [filterOwner, setFilterOwner] = useState('全部');
  const [filterSwap, setFilterSwap] = useState('全部');
  const [filterProject, setFilterProject] = useState('全部');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [assignWO, setAssignWO] = useState(null);
  const [voidTarget, setVoidTarget] = useState(null);
  const { projects } = state;
  const getProjectName = id => projects.find(p => p.id === id)?.name || '—';
  const nowText = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
  const updTypeOf = wo => wo._kind === 'delivery' ? 'UPDATE_DELIVERY_WORK_ORDER' : 'UPDATE_WORK_ORDER';

  const deliveryWOs = (state.deliveryWorkOrders || []).map(w => ({ ...w, _kind: 'delivery' }));
  const aftersalesWOs = (state.workOrders || []).map(w => ({ ...w, _kind: 'aftersales' }));
  const allOrders = [...deliveryWOs, ...aftersalesWOs].map(w => ({ ...w, _class: woClassOf(w), _stage: woStageOf(w) }));
  const open = allOrders.filter(w => !['已关闭', '已作废'].includes(w.status));
  const owners = [...new Set(allOrders.map(w => w.assignedTo).filter(Boolean))];

  const cover = {
    pending: allOrders.filter(w => w.status === '待处理').length,
    swap: allOrders.filter(w => w._class === '换件工单' && !['已作废'].includes(w.status)).length,
    software: allOrders.filter(w => w._class === '软件问题工单' && !['已作废'].includes(w.status)).length,
    overdue: open.filter(w => (w.createdAt || '') < '2026-06-20').length,
  };
  const recent = [...allOrders].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5);

  const filtered = allOrders
    .filter(w => (filterStatus === '全部' ? w.status !== '已作废' : w.status === filterStatus))
    .filter(w => filterClass === '全部' || w._class === filterClass)
    .filter(w => filterStage === '全部' || w._stage === filterStage)
    .filter(w => filterSeverity === '全部' || w.severity === filterSeverity)
    .filter(w => filterOwner === '全部' || w.assignedTo === filterOwner)
    .filter(w => filterSwap === '全部' || (filterSwap === '是' ? w._class === '换件工单' : w._class !== '换件工单'))
    .filter(w => filterProject === '全部' || w.projectId === filterProject)
    .filter(w => !dateFrom || (w.createdAt || '') >= dateFrom)
    .filter(w => !dateTo || (w.createdAt || '') <= `${dateTo} 23:59`)
    .filter(w => !search || (w.deviceSN || '').toLowerCase().includes(search.toLowerCase()) || (w.id || '').toLowerCase().includes(search.toLowerCase()) || (w.description || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const paged = usePaged(filtered, 10);

  const handleAdd = (wo) => dispatch({ type: 'ADD_WORK_ORDER', payload: wo });

  const advance = (wo) => {
    const next = wo.status === '待处理' ? '处理中' : wo.status === '处理中' ? '复检中' : wo.status === '复检中' ? '已关闭' : null;
    if (!next) return;
    const t = nowText();
    const patch = { id: wo.id, status: next, updatedAt: t, processLogs: [...(wo.processLogs || []), { time: t, operator: currentUser, fromStatus: wo.status, toStatus: next, notes: '推进工单状态' }] };
    if (next === '处理中' && !wo.assignedTo) patch.assignedTo = currentUser;
    if (next === '已关闭') patch.closedAt = t;
    dispatch({ type: updTypeOf(wo), payload: patch });
  };
  const doAssign = (wo, assignee) => {
    const t = nowText();
    dispatch({ type: updTypeOf(wo), payload: { id: wo.id, assignedTo: assignee, updatedAt: t, processLogs: [...(wo.processLogs || []), { time: t, operator: currentUser, fromStatus: wo.status, toStatus: wo.status, notes: `分配负责人：${assignee}` }] } });
  };
  const closeWO = (wo) => {
    const t = nowText();
    dispatch({ type: updTypeOf(wo), payload: { id: wo.id, status: '已关闭', closedAt: t, updatedAt: t, processLogs: [...(wo.processLogs || []), { time: t, operator: currentUser, fromStatus: wo.status, toStatus: '已关闭', notes: '关闭工单' }] } });
  };
  const doVoid = (wo, reason) => {
    const t = nowText();
    dispatch({ type: updTypeOf(wo), payload: { id: wo.id, status: '已作废', voidReason: reason, updatedAt: t, processLogs: [...(wo.processLogs || []), { time: t, operator: currentUser, fromStatus: wo.status, toStatus: '已作废', notes: `工单作废：${reason}` }] } });
  };
  const genQuality = (wo) => {
    if (wo.linkedQualityIssueId || wo.status === '已作废') return;
    const t = nowText();
    const qiId = `QI-${Date.now().toString().slice(-6)}`;
    dispatch({ type: 'ADD_QUALITY_ISSUE', payload: { id: qiId, deviceId: wo.deviceId, deviceSN: wo.deviceSN, projectId: wo.projectId, sourceStage: wo._stage, issueType: '工单转质量问题', severity: wo.severity || '中', issueDesc: wo.description, reporterName: currentUser, owner: currentUser, reportTime: t, status: '待处理', source: '工单转入', linkedWorkOrder: true, linkedWorkOrderId: wo.id, processLogs: [] } });
    dispatch({ type: updTypeOf(wo), payload: { id: wo.id, linkedQualityIssueId: qiId, updatedAt: t, processLogs: [...(wo.processLogs || []), { time: t, operator: currentUser, fromStatus: wo.status, toStatus: wo.status, notes: `生成质量问题 ${qiId}` }] } });
  };

  const COVER = [
    { label: '待处理工单', value: cover.pending, color: 'border-orange-500' },
    { label: '换件工单', value: cover.swap, color: 'border-amber-500' },
    { label: '软件问题工单', value: cover.software, color: 'border-blue-500' },
    { label: '超时工单', value: cover.overdue, color: 'border-red-500' },
  ];
  const selInp = 'border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-600 focus:outline-none';
  const opBtn = (label, onClick, { disabled = false, title = '', danger = false } = {}) => (
    disabled
      ? <span className={`cursor-not-allowed ${danger ? 'text-red-300' : 'text-gray-300'}`} title={title}>{label}</span>
      : <button className={`hover:underline ${danger ? 'text-red-400 hover:text-red-600' : 'text-blue-600'}`} title={title} onClick={(e) => { e.stopPropagation(); onClick(); }}>{label}</button>
  );

  return (
    <div className="space-y-5">
      {/* 封面 / 概览 */}
      <div className="grid grid-cols-4 gap-4">
        {COVER.map(c => (
          <div key={c.label} className={`bg-white rounded-xl shadow-sm border-l-4 ${c.color} p-4`}>
            <div className="text-3xl font-semibold text-gray-900">{c.value}</div>
            <div className="text-sm text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">最近工单</div>
          <div className="space-y-2">
            {recent.map(w => (
              <div key={w.id} className="flex items-center gap-3 text-sm border-b border-gray-50 pb-2 last:border-0">
                <span className="font-mono text-xs text-gray-500 w-24">{w.id}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${WO_CLASS_STYLE[w._class]}`}>{w._class}</span>
                <span className="text-gray-700 flex-1 truncate">{w.deviceSN} · {w.description}</span>
                <StatusBadge status={w.status} />
              </div>
            ))}
            {recent.length === 0 && <div className="text-sm text-gray-400 py-4 text-center">暂无工单</div>}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">工单分类说明</div>
          <ul className="text-xs text-gray-500 space-y-1.5 leading-relaxed">
            <li>· 换件工单：涉及模块更换，需要选择新模块 SN（在库可用）。</li>
            <li>· 软件问题工单：软件 / 算法 / 版本问题，流转到研发或软件处理人。</li>
            <li>· 其他问题工单：体验优化、客户反馈、非明确硬件/软件归因。</li>
            <li className="text-gray-400 pt-1">生产测试 NG 属于生产返修记录，不在工单中心处理。</li>
          </ul>
        </div>
      </div>

      {/* 筛选（两行） */}
      <div className="bg-white rounded shadow-sm px-4 py-3 space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索工单ID / 设备SN / 描述" className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none w-56" />
          <select className={selInp} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            <option value="全部">全部类型</option>
            {WO_CLASSES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className={selInp} value={filterStage} onChange={e => setFilterStage(e.target.value)}>
            <option value="全部">全部阶段</option>
            {WO_STAGES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className={selInp} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="全部">全部状态</option>
            {['待处理', '处理中', '复检中', '已关闭', '已作废'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select className={selInp} value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
            <option value="全部">全部严重程度</option>
            {['高', '中', '低'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select className={selInp} value={filterOwner} onChange={e => setFilterOwner(e.target.value)}>
            <option value="全部">全部负责人</option>
            {owners.map(o => <option key={o}>{o}</option>)}
          </select>
          <select className={selInp} value={filterSwap} onChange={e => setFilterSwap(e.target.value)}>
            <option value="全部">是否涉及换件</option>
            <option value="是">涉及换件</option>
            <option value="否">不涉及换件</option>
          </select>
          <select className={selInp} value={filterProject} onChange={e => setFilterProject(e.target.value)}>
            <option value="全部">全部项目</option>
            {projects.filter(p => !p.voided).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <label className="text-xs text-gray-500">时间</label>
          <input type="date" className={selInp} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span className="text-xs text-gray-400">~</span>
          <input type="date" className={selInp} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          <span className="text-xs text-gray-400">共 {filtered.length} 条</span>
          {canDo('update_work_order') && (
            <button onClick={() => setShowAddModal(true)} className="ml-auto px-4 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">+ 新增工单</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['工单ID', '工单类型', '所属阶段', '关联项目', '关联设备SN', '是否涉及换件', '需更换模块类型', '旧模块SN', '新模块SN', '新模块库存状态', '问题描述', '严重程度', '状态', '负责人', '创建时间', '操作'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.pageItems.map(wo => {
                const isExpanded = expandedId === wo.id;
                const isVoided = wo.status === '已作废';
                const closed = ['已关闭', '已作废'].includes(wo.status);
                const isSwap = wo._class === '换件工单';
                const needType = isSwap ? (wo.needReplaceModuleType || wo.needModuleType || '待确认') : '不涉及';
                const oldSN = isSwap ? (wo.oldModuleSN || '待确认') : '不涉及';
                const newSN = isSwap ? (wo.newModuleSN || '待选择') : '不涉及';
                const newStock = isSwap ? (wo.newModuleStockStatus || (wo.newModuleSN ? '在库可用' : '待选择')) : '不涉及';
                const swapCls = isSwap ? 'text-gray-600' : 'text-gray-300';
                return (
                  <React.Fragment key={wo.id}>
                    <tr className={`hover:bg-blue-50 ${isExpanded ? 'bg-slate-50' : ''} ${isVoided ? 'opacity-50' : ''}`}>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-600 whitespace-nowrap">{wo.id}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap"><span className={`px-2 py-0.5 rounded-full border ${WO_CLASS_STYLE[wo._class]}`}>{wo._class}</span></td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap"><StatusBadge status={wo._stage} /></td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{getProjectName(wo.projectId)}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-800 font-medium whitespace-nowrap">{wo.deviceSN}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">{isSwap ? <span className="text-orange-600 font-medium">是</span> : <span className="text-gray-400">否</span>}</td>
                      <td className={`px-3 py-2.5 text-xs whitespace-nowrap ${swapCls}`}>{needType}</td>
                      <td className={`px-3 py-2.5 font-mono text-xs whitespace-nowrap ${isSwap ? 'text-gray-500' : 'text-gray-300'}`}>{oldSN}</td>
                      <td className={`px-3 py-2.5 font-mono text-xs whitespace-nowrap ${isSwap ? 'text-gray-500' : 'text-gray-300'}`}>{newSN}</td>
                      <td className={`px-3 py-2.5 text-xs whitespace-nowrap ${swapCls}`}>{newStock}</td>
                      <td className="px-3 py-2.5 text-gray-700 max-w-[180px]"><div className="truncate" title={wo.description}>{wo.description}</div></td>
                      <td className="px-3 py-2.5"><StatusBadge status={wo.severity} /></td>
                      <td className="px-3 py-2.5"><StatusBadge status={wo.status} /></td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{wo.assignedTo || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">{wo.createdAt}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-x-3">
                          <button className="text-slate-600 hover:underline" onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : wo.id); }}>查看详情</button>
                          {opBtn('推进状态', () => advance(wo), { disabled: closed, title: closed ? '已关闭/已作废工单不可推进' : '' })}
                          {opBtn('分配负责人', () => setAssignWO(wo), { disabled: closed, title: closed ? '已关闭/已作废工单不可分配' : '' })}
                          {opBtn('生成质量问题', () => genQuality(wo), { disabled: closed || !!wo.linkedQualityIssueId, title: wo.linkedQualityIssueId ? `已生成质量问题 ${wo.linkedQualityIssueId}` : closed ? '已关闭/已作废工单不可生成' : '' })}
                          {opBtn('关闭', () => closeWO(wo), { disabled: closed, title: closed ? '工单已关闭/作废' : '', danger: true })}
                          {opBtn('作废', () => setVoidTarget(wo), { disabled: !['待处理', '处理中'].includes(wo.status), title: !['待处理', '处理中'].includes(wo.status) ? '仅待处理/处理中可作废' : '', danger: true })}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && !isVoided && (
                      <tr>
                        <td colSpan={16} className="p-0">
                          <div className="px-6 pt-4 bg-slate-50 text-xs text-gray-600 flex flex-wrap gap-x-6 gap-y-1">
                            <span>关联项目：{getProjectName(wo.projectId)}</span>
                            <span>关联交付计划：{wo.deliveryPlanId || '—'}</span>
                            <span>关联质量问题：<span className="font-mono">{wo.linkedQualityIssueId || wo.sourceQualityIssueId || '—'}</span></span>
                            {isSwap
                              ? <span>换件记录：{needType} · 旧 <span className="font-mono">{oldSN}</span> · 新 <span className="font-mono">{newSN}</span> · 新模块库存 {wo.newModuleStockStatus || (wo.newModuleSN ? '在库可用' : '待选择')}</span>
                              : <span>换件记录：不涉及</span>}
                          </div>
                          <WorkOrderDetail wo={wo} state={state} dispatch={dispatch} currentUser={currentUser} canDo={canDo} actionType={wo._kind} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={16} className="px-4 py-8 text-center text-gray-400">暂无工单</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={paged.page} total={paged.total} totalPages={paged.totalPages} onChange={paged.setPage} />
      </div>

      {showAddModal && (
        <OrderCenterAddModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleAdd} state={state} />
      )}
      {assignWO && <AssignOwnerModal isOpen={!!assignWO} onClose={() => setAssignWO(null)} wo={assignWO} onConfirm={(a) => doAssign(assignWO, a)} />}
      {voidTarget && <VoidWorkOrderModal isOpen={!!voidTarget} onClose={() => setVoidTarget(null)} wo={voidTarget} onConfirm={(r) => doVoid(voidTarget, r)} />}
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

  const genWorkOrder = (woClass) => {
    const t = now();
    const woId = `WO-${Date.now().toString().slice(-6)}`;
    dispatch({ type: 'ADD_WORK_ORDER', payload: {
      id: woId, type: 'aftersales', woClass, stage: qi.sourceStage || '在线运营',
      projectId: qi.projectId, deviceId: qi.deviceId, deviceSN: qi.deviceSN,
      involvesSwap: woClass === '换件工单', description: qi.issueDesc, severity: qi.severity || '中',
      status: '待处理', assignedTo: '', sourceQualityIssueId: qi.id,
      createdAt: t, updatedAt: t, closedAt: null, processLogs: [],
    } });
    dispatch({ type: 'UPDATE_QUALITY_ISSUE', payload: { id: qi.id, linkedWorkOrder: true, linkedWorkOrderId: woId, processLogs: [...(qi.processLogs || []), { time: t, operator: state.currentUser, fromStatus: qi.status, toStatus: qi.status, notes: `生成${woClass} ${woId}` }] } });
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
      <div className="flex flex-wrap items-center gap-2">
        {qi.status === '待处理' && canDo('update_quality_issue') && (
          <button onClick={handleStart} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">开始处理</button>
        )}
        {qi.status !== '已关闭' && (
          <>
            <button onClick={() => genWorkOrder('换件工单')} className="px-3 py-1.5 text-sm border border-orange-300 text-orange-700 rounded hover:bg-orange-50">生成换件工单</button>
            <button onClick={() => genWorkOrder('软件问题工单')} className="px-3 py-1.5 text-sm border border-blue-300 text-blue-700 rounded hover:bg-blue-50">生成软件问题工单</button>
          </>
        )}
        {qi.status === '处理中' && canDo('update_quality_issue') && (
          <button onClick={() => setShowClose(v => !v)} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700">关闭问题</button>
        )}
        {qi.linkedWorkOrderId && <span className="text-xs text-gray-500">已关联工单 <span className="font-mono">{qi.linkedWorkOrderId}</span></span>}
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
const QI_SOURCE_STAGES = ['生产测试', '出厂检验', '现场安装调试', '客户验收', '在线运营'];
const QI_ISSUE_TYPES = ['功能异常', '外观缺陷', '性能不达标', '通信异常', '工单转质量问题', '其他'];

function QualityIssueTable({ state, dispatch, canDo }) {
  const { qualityIssues = [], projects, locations = [], devices = [], deviceTypes = [] } = state;
  const [filterStatus, setFilterStatus] = useState('全部');
  const [filterProject, setFilterProject] = useState('');
  const [filterDeviceType, setFilterDeviceType] = useState('');
  const [searchSN, setSearchSN] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterIssueType, setFilterIssueType] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterHasWO, setFilterHasWO] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  const getLocationName = id => locations.find(l => l.id === id)?.name || '—';
  const getProjectName = id => projects.find(p => p.id === id)?.name || '—';
  const deviceTypeOf = qi => {
    const dev = devices.find(d => d.id === qi.deviceId || d.sn === qi.deviceSN);
    return qi.deviceName || deviceTypes.find(dt => dt.id === dev?.deviceTypeId)?.name || '—';
  };
  const owners = [...new Set(qualityIssues.map(q => q.owner).filter(Boolean))];
  const nowText = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
  const hasWO = qi => !!(qi.linkedWorkOrder || qi.linkedWorkOrderId);

  const filtered = qualityIssues.filter(qi => {
    return (filterStatus === '全部' || qi.status === filterStatus)
      && (!filterProject || qi.projectId === filterProject)
      && (!filterDeviceType || deviceTypeOf(qi) === filterDeviceType)
      && (!searchSN || (qi.deviceSN || '').toLowerCase().includes(searchSN.toLowerCase()))
      && (!filterStage || (qi.sourceStage || '在线运营') === filterStage)
      && (!filterIssueType || qi.issueType === filterIssueType)
      && (!filterSeverity || (qi.severity || '中') === filterSeverity)
      && (!filterSource || qi.source === filterSource)
      && (!filterHasWO || (filterHasWO === '是' ? hasWO(qi) : !hasWO(qi)))
      && (!filterOwner || qi.owner === filterOwner)
      && (!dateFrom || (qi.reportTime || '') >= dateFrom)
      && (!dateTo || (qi.reportTime || '') <= `${dateTo} 23:59`);
  }).sort((a, b) => (b.reportTime || '').localeCompare(a.reportTime || ''));
  const paged = usePaged(filtered, 10);

  const handleSave = (qi) => dispatch({ type: 'ADD_QUALITY_ISSUE', payload: qi });

  const genWorkOrder = (qi, woClass) => {
    if (hasWO(qi) || qi.status === '已关闭') return;
    const t = nowText();
    const woId = `WO-${Date.now().toString().slice(-6)}`;
    dispatch({ type: 'ADD_WORK_ORDER', payload: { id: woId, type: 'aftersales', woClass, stage: qi.sourceStage || '在线运营', projectId: qi.projectId, deviceId: qi.deviceId, deviceSN: qi.deviceSN, involvesSwap: woClass === '换件工单', description: qi.issueDesc, severity: qi.severity || '中', status: '待处理', assignedTo: '', sourceQualityIssueId: qi.id, createdAt: t, updatedAt: t, closedAt: null, processLogs: [] } });
    dispatch({ type: 'UPDATE_QUALITY_ISSUE', payload: { id: qi.id, linkedWorkOrder: true, linkedWorkOrderId: woId, processLogs: [...(qi.processLogs || []), { time: t, operator: state.currentUser, fromStatus: qi.status, toStatus: qi.status, notes: `生成${woClass} ${woId}` }] } });
  };
  const closeQI = (qi) => {
    if (qi.status === '已关闭') return;
    const t = nowText();
    dispatch({ type: 'UPDATE_QUALITY_ISSUE', payload: { id: qi.id, status: '已关闭', processLogs: [...(qi.processLogs || []), { time: t, operator: state.currentUser, fromStatus: qi.status, toStatus: '已关闭', notes: '关闭问题' }] } });
  };

  const selInp = 'border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-600 focus:outline-none';
  const opBtn = (label, onClick, { disabled = false, title = '', danger = false } = {}) => (
    disabled
      ? <span className={`cursor-not-allowed ${danger ? 'text-red-300' : 'text-gray-300'}`} title={title}>{label}</span>
      : <button className={`hover:underline ${danger ? 'text-red-400 hover:text-red-600' : 'text-blue-600'}`} title={title} onClick={(e) => { e.stopPropagation(); onClick(); }}>{label}</button>
  );

  return (
    <div>
      <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-700 mb-4">
        质量问题台账用于质量问题沉淀、追溯和统计，不替代工单中心。扫码上报和手动录入仅作为创建入口，提交后进入台账；需要处理的问题可从台账生成换件工单或软件问题工单。
      </div>
      <div className="flex items-center justify-end mb-3 gap-2">
        <button onClick={() => setShowScanModal(true)} className="px-4 py-2 border border-slate-600 text-slate-700 text-sm rounded hover:bg-slate-50">扫码上报</button>
        {canDo('add_quality_issue') && (
          <button onClick={() => setShowManualModal(true)} className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">+ 手动录入</button>
        )}
      </div>

      {/* 筛选（两行） */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-4 space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <select className={selInp} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            {['全部', '待处理', '处理中', '已关闭'].map(s => <option key={s} value={s}>{s === '全部' ? '全部状态' : s}</option>)}
          </select>
          <select className={selInp} value={filterProject} onChange={e => setFilterProject(e.target.value)}>
            <option value="">全部项目</option>
            {projects.filter(p => !p.voided).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className={selInp} value={filterDeviceType} onChange={e => setFilterDeviceType(e.target.value)}>
            <option value="">全部设备类型</option>
            {deviceTypes.map(dt => <option key={dt.id} value={dt.name}>{dt.name}</option>)}
          </select>
          <input value={searchSN} onChange={e => setSearchSN(e.target.value)} placeholder="设备SN" className="border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none w-36" />
          <select className={selInp} value={filterStage} onChange={e => setFilterStage(e.target.value)}>
            <option value="">全部来源阶段</option>
            {QI_SOURCE_STAGES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select className={selInp} value={filterIssueType} onChange={e => setFilterIssueType(e.target.value)}>
            <option value="">全部问题类型</option>
            {QI_ISSUE_TYPES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className={selInp} value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
            <option value="">全部严重程度</option>
            {['高', '中', '低'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select className={selInp} value={filterSource} onChange={e => setFilterSource(e.target.value)}>
            <option value="">全部上报方式</option>
            {['扫码上报', '手动录入', '工单转入'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select className={selInp} value={filterHasWO} onChange={e => setFilterHasWO(e.target.value)}>
            <option value="">是否已生成工单</option>
            <option value="是">已生成</option>
            <option value="否">未生成</option>
          </select>
          <select className={selInp} value={filterOwner} onChange={e => setFilterOwner(e.target.value)}>
            <option value="">全部负责人</option>
            {owners.map(o => <option key={o}>{o}</option>)}
          </select>
          <label className="text-xs text-gray-500">时间</label>
          <input type="date" className={selInp} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span className="text-xs text-gray-400">~</span>
          <input type="date" className={selInp} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          <span className="text-xs text-gray-400">共 {filtered.length} 条</span>
        </div>
      </div>

      <div className="bg-white rounded shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['问题编号', '设备SN', '设备类型', '所属点位', '所属项目', '来源阶段', '问题类型', '问题描述', '严重程度', '上报方式', '是否已生成工单', '关联工单ID', '负责人', '上报时间', '状态', '操作'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.pageItems.map(qi => {
                const isExpanded = expandedId === qi.id;
                const linked = hasWO(qi);
                const closed = qi.status === '已关闭';
                const isSoftIssue = /软件|算法|固件|版本|系统|程序/.test(qi.issueType || '');
                const swapDisabled = linked || closed || isSoftIssue;
                const softDisabled = linked || closed;
                return (
                  <React.Fragment key={qi.id}>
                    <tr className={`hover:bg-blue-50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-600 whitespace-nowrap">{qi.id}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-800 font-medium whitespace-nowrap">{qi.deviceSN}</td>
                      <td className="px-3 py-2.5 text-gray-700 text-xs whitespace-nowrap">{deviceTypeOf(qi)}</td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{qi.locationId ? getLocationName(qi.locationId) : '—'}</td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{getProjectName(qi.projectId)}</td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{qi.sourceStage || '在线运营'}</td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{qi.issueType || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-700 max-w-[160px]"><div className="truncate text-xs">{qi.issueDesc}</div></td>
                      <td className="px-3 py-2.5"><StatusBadge status={qi.severity || '中'} /></td>
                      <td className="px-3 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full border ${qi.source === '扫码上报' ? 'bg-blue-50 text-blue-700 border-blue-200' : qi.source === '工单转入' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>{qi.source}</span></td>
                      <td className="px-3 py-2.5 text-xs">{linked ? <span className="text-emerald-600 font-medium">是</span> : <span className="text-gray-400">否</span>}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-500 whitespace-nowrap">{qi.linkedWorkOrderId || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{qi.owner || qi.reporterName || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">{qi.reportTime}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={qi.status} /></td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-x-3">
                          <button className="text-slate-600 hover:underline" onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : qi.id); }}>查看详情</button>
                          {opBtn('生成换件工单', () => genWorkOrder(qi, '换件工单'), { disabled: swapDisabled, title: linked ? `已生成工单 ${qi.linkedWorkOrderId || ''}` : closed ? '已关闭问题不可生成' : isSoftIssue ? '软件问题请生成软件问题工单' : '' })}
                          {opBtn('生成软件问题工单', () => genWorkOrder(qi, '软件问题工单'), { disabled: softDisabled, title: linked ? `已生成工单 ${qi.linkedWorkOrderId || ''}` : closed ? '已关闭问题不可生成' : '' })}
                          {opBtn('关闭问题', () => closeQI(qi), { disabled: closed, title: closed ? '问题已关闭' : '', danger: true })}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={16} className="p-0">
                          <QualityIssueDetail qi={qi} state={state} dispatch={dispatch} canDo={canDo} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={16} className="px-4 py-8 text-center text-gray-400">暂无质量问题记录</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={paged.page} total={paged.total} totalPages={paged.totalPages} onChange={paged.setPage} />
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
