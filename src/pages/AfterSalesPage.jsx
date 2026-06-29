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

/* ─────── Work order detail panel ─────── */

function WorkOrderDetail({ wo, state, dispatch, currentUser, canDo, actionType }) {
  const { devices, deviceTypes, materials, moduleTypes, projects, moduleReplacements } = state;
  const [showStartModal, setShowStartModal] = useState(false);
  const [showRecheckModal, setShowRecheckModal] = useState(false);
  const [recheckResult, setRecheckResult] = useState('');

  const device = devices.find(d => d.id === wo.deviceId);
  const project = projects.find(p => p.id === wo.projectId);
  const getMaterialSN = id => materials.find(m => m.id === id)?.sn || id;

  const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

  const handleStartProcessing = (assignee) => {
    const t = now();
    const newLog = { time: t, operator: assignee, fromStatus: wo.status, toStatus: '处理中', notes: '已承接工单，开始处理' };
    dispatch({ type: actionType === 'production' ? 'UPDATE_PRODUCTION_WORK_ORDER' : 'UPDATE_DELIVERY_WORK_ORDER', payload: { id: wo.id, status: '处理中', assignedTo: assignee, updatedAt: t, processLogs: [...(wo.processLogs || []), newLog] } });
  };

  const handleSubmitRecheck = (recheckPerson) => {
    const t = now();
    const newLog = { time: t, operator: state.currentUser, fromStatus: wo.status, toStatus: '复检中', notes: '维修完成，提交复检', recheckPerson };
    dispatch({ type: actionType === 'production' ? 'UPDATE_PRODUCTION_WORK_ORDER' : 'UPDATE_DELIVERY_WORK_ORDER', payload: { id: wo.id, status: '复检中', recheckPerson, updatedAt: t, processLogs: [...(wo.processLogs || []), newLog] } });
  };

  const handleCloseOrder = () => {
    const t = now();
    const newLog = { time: t, operator: state.currentUser, fromStatus: wo.status, toStatus: '已关闭', notes: `复检${recheckResult}，关闭工单` };
    dispatch({ type: actionType === 'production' ? 'UPDATE_PRODUCTION_WORK_ORDER' : 'UPDATE_DELIVERY_WORK_ORDER', payload: { id: wo.id, status: '已关闭', recheckResult, closedAt: t, updatedAt: t, processLogs: [...(wo.processLogs || []), newLog] } });
    setRecheckResult('');
  };

  const handleRevertToProcessing = () => {
    const t = now();
    const newLog = { time: t, operator: state.currentUser, fromStatus: wo.status, toStatus: '处理中', notes: '复检未通过，打回维修' };
    dispatch({ type: actionType === 'production' ? 'UPDATE_PRODUCTION_WORK_ORDER' : 'UPDATE_DELIVERY_WORK_ORDER', payload: { id: wo.id, status: '处理中', recheckResult: null, updatedAt: t, processLogs: [...(wo.processLogs || []), newLog] } });
    setRecheckResult('');
  };

  return (
    <div className="px-6 py-5 space-y-5 bg-slate-50 border-b border-slate-200">
      {/* Status & actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 text-sm">
          <div><span className="text-gray-500">状态：</span><StatusBadge status={wo.status} /></div>
          <div><span className="text-gray-500">严重程度：</span><StatusBadge status={wo.severity} /></div>
          {project && <div><span className="text-gray-500">所属项目：</span><Link to={`/projects/${project.id}`} className="text-slate-700 hover:underline">{project.name}</Link></div>}
          {wo.recheckPerson && <div><span className="text-gray-500">复检人：</span><span>{wo.recheckPerson}</span></div>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {wo.status === '待处理' && canDo('update_work_order') && (
            <button onClick={() => setShowStartModal(true)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">开始处理</button>
          )}
          {wo.status === '处理中' && canDo('update_work_order') && (
            <button onClick={() => setShowRecheckModal(true)} className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">提交复检</button>
          )}
        </div>
      </div>

      {/* Description */}
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

      {/* 复检 section */}
      {wo.status === '复检中' && (
        <div className="bg-purple-50 border border-purple-200 rounded p-4">
          <div className="text-sm font-semibold text-purple-800 mb-3">复检操作</div>
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
          <div className="text-xs font-semibold text-gray-600 mb-2">处理记录</div>
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
    </div>
  );
}

/* ─────── Generic Work Order Table ─────── */
function WorkOrderTable({ workOrders, actionType, state, dispatch, currentUser, canDo, extraAction }) {
  const [filterStatus, setFilterStatus] = useState('全部');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = [...workOrders]
    .filter(w => filterStatus === '全部' || w.status === filterStatus)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const statusCounts = { '待处理': 0, '处理中': 0, '复检中': 0, '已关闭': 0 };
  workOrders.forEach(w => { if (statusCounts[w.status] !== undefined) statusCounts[w.status]++; });

  return (
    <div>
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-4 flex flex-wrap gap-2 items-center">
        {['全部', '待处理', '处理中', '复检中', '已关闭'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${filterStatus === s ? 'bg-slate-700 text-white border-slate-700' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
            {s}{s !== '全部' ? <span className="ml-1 font-bold">{statusCounts[s] ?? 0}</span> : <span className="ml-1">{workOrders.length}</span>}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400">共 {filtered.length} 条</span>
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
              return (
                <React.Fragment key={wo.id}>
                  <tr onClick={() => setExpandedId(isExpanded ? null : wo.id)}
                    className={`cursor-pointer border-t border-gray-100 transition-colors hover:bg-blue-50 ${isExpanded ? 'bg-slate-50' : ''}`}>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{wo.id}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-800 font-medium">{wo.deviceSN}</td>
                    <td className="px-4 py-2.5 text-gray-700 max-w-[200px]"><div className="truncate">{wo.description}</div></td>
                    <td className="px-4 py-2.5"><StatusBadge status={wo.severity} /></td>
                    <td className="px-4 py-2.5"><StatusBadge status={wo.status} /></td>
                    <td className="px-4 py-2.5 text-gray-600">{wo.assignedTo || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{wo.createdAt}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{isExpanded ? '▲ 收起' : '▼ 展开'}</td>
                  </tr>
                  {isExpanded && (
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
