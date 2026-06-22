import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import StatusBadge from '../components/StatusBadge';

const FLOW_STAGES = ['来料检验', '整机装配', '功能测试', '老化测试', '终测', '待分配'];

const STATUS_STAGE_IDX = {
  '整机装配': 1, '装配中': 1,
  '功能测试中': 2,
  '老化测试中': 3,
  '终测中': 4,
  '待分配项目': 5,
  '已激活': 6,
};

function StageStepper({ status }) {
  const currentIdx = STATUS_STAGE_IDX[status] ?? -1;
  const isRepair = status === '返修中';

  return (
    <div className="bg-white rounded shadow-sm p-5">
      {isRepair && (
        <div className="mb-4 flex items-center gap-2 text-red-600 text-sm font-medium">
          <span>⚠</span><span>当前设备处于返修状态，待修复后继续流转</span>
        </div>
      )}
      <div className="flex items-start">
        {FLOW_STAGES.map((stage, i) => {
          const done = currentIdx > i;
          const active = currentIdx === i;
          return (
            <div key={stage} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  done ? 'bg-green-500 text-white'
                  : active ? (isRepair ? 'bg-red-500 text-white' : 'bg-blue-600 text-white')
                  : 'bg-gray-100 text-gray-400 border border-gray-300'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-xs mt-1 text-center whitespace-nowrap ${
                  done ? 'text-green-700'
                  : active ? (isRepair ? 'text-red-600 font-semibold' : 'text-blue-700 font-semibold')
                  : 'text-gray-400'
                }`}>{stage}</span>
              </div>
              {i < FLOW_STAGES.length - 1 && (
                <div className={`flex-1 h-0.5 mt-4 mx-1 ${done ? 'bg-green-300' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VoidTestRecordInline({ record, onVoid }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-2 py-0.5 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50">
        作废
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="填写作废原因..."
        className="border border-gray-300 rounded px-2 py-1 text-xs w-48 focus:outline-none focus:border-red-400"
      />
      <button
        onClick={() => { if (reason.trim()) { onVoid(record, reason.trim()); setOpen(false); setReason(''); } }}
        className="px-2 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700">
        确认
      </button>
      <button
        onClick={() => { setOpen(false); setReason(''); }}
        className="px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
        取消
      </button>
    </div>
  );
}

const CATEGORY_COLOR = {
  assembly: 'bg-blue-500',
  test_pass: 'bg-green-500',
  test_fail: 'bg-red-500',
  allocation: 'bg-purple-500',
  delivery_pass: 'bg-teal-500',
  delivery_fail: 'bg-orange-500',
  workorder: 'bg-yellow-500',
  replacement: 'bg-amber-500',
  log: 'bg-gray-400',
  voided: 'bg-gray-300',
};

function buildTimeline(device, state) {
  const events = [];

  events.push({
    id: `${device.id}-assembly`,
    actionType: '整机装配',
    category: 'assembly',
    operator: device.assembler,
    timestamp: device.assemblyTime,
    summary: '整机装配完成',
    detail: `装配人：${device.assembler}`,
  });

  state.testRecords
    .filter((t) => t.deviceId === device.id)
    .forEach((t) => {
      const voided = t.voided;
      const pass = t.result === '合格';
      events.push({
        id: t.id,
        actionType: t.testType,
        category: voided ? 'voided' : pass ? 'test_pass' : 'test_fail',
        operator: t.operator,
        timestamp: t.testTime,
        summary: `${t.testType} — ${t.result}${voided ? '（已作废）' : ''}`,
        detail: t.notes || '',
        voided,
      });
    });

  state.deviceAllocations
    .filter((a) => a.deviceId === device.id)
    .forEach((a) => {
      const proj = state.projects.find((p) => p.id === a.projectId);
      events.push({
        id: a.id,
        actionType: '分配至项目',
        category: 'allocation',
        operator: a.allocatedBy,
        timestamp: a.allocatedAt,
        summary: `分配至项目：${proj?.name || a.projectId}`,
        detail: a.notes || '',
      });
    });

  state.deliveryRecords
    .filter((d) => d.deviceId === device.id)
    .forEach((d) => {
      const pass = d.result === '合格' || d.result === '通过';
      events.push({
        id: d.id,
        actionType: d.stage,
        category: pass ? 'delivery_pass' : 'delivery_fail',
        operator: d.operator,
        timestamp: d.recordTime,
        summary: `${d.stage} — ${d.result}`,
        detail: d.notes || (d.address ? `地址：${d.address}` : ''),
      });
    });

  state.workOrders
    .filter((w) => w.deviceId === device.id)
    .forEach((wo) => {
      events.push({
        id: wo.id,
        actionType: '维修工单',
        category: 'workorder',
        operator: wo.assignedTo,
        timestamp: wo.createdAt,
        summary: `工单 ${wo.id}：${wo.description}`,
        detail: wo.repairActions || '',
      });
      (wo.replacedModules || []).forEach((rm, i) => {
        const mtName = state.moduleTypes.find((m) => m.id === rm.moduleTypeId)?.name || rm.moduleTypeId;
        const removedSN = state.materials.find((m) => m.id === rm.removedMaterialId)?.sn || rm.removedMaterialId;
        const addedSN = state.materials.find((m) => m.id === rm.addedMaterialId)?.sn || rm.addedMaterialId;
        events.push({
          id: `${wo.id}-rm-${i}`,
          actionType: '换件',
          category: 'replacement',
          operator: rm.operator || wo.assignedTo,
          timestamp: rm.operatedAt || wo.updatedAt,
          summary: `换件：${rm.slotName || mtName}`,
          detail: `拆：${removedSN} → 装：${addedSN}${rm.notes ? `（${rm.notes}）` : ''}`,
        });
      });
    });

  const ALLOWED_LOG_TYPES = new Set(['返修完成', '退役', '作废测试记录']);
  state.operationLogs
    .filter((l) => l.deviceId === device.id && ALLOWED_LOG_TYPES.has(l.actionType))
    .forEach((l) => {
      events.push({
        id: l.id,
        actionType: l.actionType,
        category: 'log',
        operator: l.operator,
        timestamp: l.timestamp,
        summary: l.notes,
        detail: `${l.fromStatus || '—'} → ${l.toStatus || '—'}`,
      });
    });

  return events
    .filter((e) => e.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function Timeline({ entries }) {
  if (entries.length === 0) {
    return <div className="text-sm text-gray-400">暂无生命周期记录</div>;
  }

  return (
    <div className="relative">
      <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-200" />
      <div className="space-y-3">
        {entries.map((entry, idx) => {
          const dotColor = CATEGORY_COLOR[entry.category] || 'bg-gray-400';
          return (
            <div key={entry.id || idx} className={`relative flex gap-4 ${entry.voided ? 'opacity-50' : ''}`}>
              <div className={`relative z-10 w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-0.5 ${dotColor}`}>
                {entry.category === 'assembly' ? '装' :
                 entry.category === 'allocation' ? '分' :
                 entry.category === 'workorder' ? '修' :
                 entry.category === 'replacement' ? '换' :
                 entry.category === 'log' ? '记' :
                 entry.category.startsWith('delivery') ? '交' : '测'}
              </div>
              <div className="flex-1 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`text-sm font-medium ${entry.voided ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {entry.summary}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{entry.timestamp}</div>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">{entry.operator}</span>
                  {entry.detail && <span className="text-xs text-gray-400">· {entry.detail}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DeviceDetail() {
  const { id } = useParams();
  const { state, dispatch } = useApp();
  const { canDo } = useRole();

  const device = state.devices.find((d) => d.id === id);

  if (!device) {
    return (
      <div className="p-6">
        <Link to="/devices" className="text-slate-600 hover:underline text-sm">← 返回设备列表</Link>
        <div className="mt-8 text-center text-gray-400">设备不存在</div>
      </div>
    );
  }

  const deviceType = state.deviceTypes.find((dt) => dt.id === device.deviceTypeId);
  const testRecords = state.testRecords
    .filter((t) => t.deviceId === id)
    .sort((a, b) => new Date(a.testTime) - new Date(b.testTime));

  const getModuleName = (moduleTypeId) =>
    state.moduleTypes.find((m) => m.id === moduleTypeId)?.name || moduleTypeId;

  const getModuleCategory = (moduleTypeId) =>
    state.moduleTypes.find((m) => m.id === moduleTypeId)?.category || '';

  const getMaterial = (materialId) =>
    state.materials.find((m) => m.id === materialId);

  const handleVoidTestRecord = (record, reason) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    dispatch({
      type: 'UPDATE_TEST_RECORD',
      payload: { id: record.id, voided: true, voidReason: reason, voidedAt: now },
    });
    dispatch({
      type: 'ADD_OPERATION_LOG',
      payload: {
        id: `LOG-${Date.now()}`,
        deviceId: id,
        operator: state.currentUser,
        timestamp: now,
        actionType: '作废测试记录',
        fromStatus: device.status,
        toStatus: device.status,
        notes: `作废测试记录 ${record.id}，原因：${reason}`,
      },
    });
  };

  const timelineEntries = buildTimeline(device, state);

  return (
    <div className="p-6 space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/devices" className="text-slate-600 hover:underline">设备列表</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-700 font-medium">{device.sn}</span>
      </div>

      {/* Stage stepper */}
      <StageStepper status={device.status} />

      {/* Section 1: Basic Info */}
      <div className="bg-white rounded shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4">基本信息</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">设备SN</div>
            <div className="text-sm font-medium text-gray-800">{device.sn}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">整机类型</div>
            <div className="text-sm font-medium text-gray-800">{deviceType?.name || device.deviceTypeId}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">当前状态</div>
            <StatusBadge status={device.status} size="sm" />
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">创建时间</div>
            <div className="text-sm text-gray-600">{device.createdAt}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">最近更新</div>
            <div className="text-sm text-gray-600">{device.updatedAt}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">装配人</div>
            <div className="text-sm text-gray-600">{device.assembler}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">装配时间</div>
            <div className="text-sm text-gray-600">{device.assemblyTime}</div>
          </div>
          {device.photoName && (
            <div>
              <div className="text-xs text-gray-400 mb-1">现场照片</div>
              <div className="text-sm text-gray-500 font-mono">{device.photoName}</div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Assembly Record / Module List */}
      <div className="bg-white rounded shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4">装配模组记录</h2>
        {device.usedMaterials && device.usedMaterials.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['模组类型', '类别', '物料SN', '物料状态'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {device.usedMaterials.map((um, i) => {
                const mat = getMaterial(um.materialId);
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-700 font-medium">{getModuleName(um.moduleTypeId)}</td>
                    <td className="px-4 py-2.5">
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{getModuleCategory(um.moduleTypeId)}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{mat?.sn || um.materialId}</td>
                    <td className="px-4 py-2.5">
                      {mat ? <StatusBadge status={mat.status} size="sm" /> : <span className="text-xs text-gray-400">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-sm text-gray-400">暂无模组物料记录</div>
        )}
      </div>

      {/* Section 3: Test History */}
      <div className="bg-white rounded shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4">测试历史</h2>
        {testRecords.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['测试类型', '结果', '测试员', '测试时间', '报告文件', '备注', canDo('void_test_record') ? '操作' : ''].filter(Boolean).map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {testRecords.map((t) => (
                <tr key={t.id} className={`${t.voided ? 'bg-gray-50 opacity-60' : t.result === '不合格' ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                  <td className={`px-4 py-2 ${t.voided ? 'line-through text-gray-400' : 'text-gray-700'}`}>{t.testType}</td>
                  <td className="px-4 py-2">
                    {t.voided ? (
                      <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">已作废</span>
                    ) : (
                      <StatusBadge status={t.result === '合格' ? '合格' : '不合格'} />
                    )}
                  </td>
                  <td className={`px-4 py-2 ${t.voided ? 'text-gray-400' : 'text-gray-600'}`}>{t.operator}</td>
                  <td className={`px-4 py-2 text-xs whitespace-nowrap ${t.voided ? 'line-through text-gray-400' : 'text-gray-500'}`}>{t.testTime}</td>
                  <td className="px-4 py-2 text-gray-400 text-xs font-mono">{t.reportFile || '—'}</td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{t.notes || '—'}</td>
                  {canDo('void_test_record') && (
                    <td className="px-4 py-2">
                      {t.voided ? (
                        <div className="text-xs text-gray-400">
                          <div>{t.voidedAt}</div>
                          <div className="truncate max-w-[120px]" title={t.voidReason}>{t.voidReason}</div>
                        </div>
                      ) : (
                        <VoidTestRecordInline record={t} onVoid={handleVoidTestRecord} />
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-sm text-gray-400">暂无测试记录</div>
        )}
      </div>

      {/* Section 4: Full Lifecycle Timeline */}
      <div className="bg-white rounded shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4">全生命周期时间线</h2>
        <Timeline entries={timelineEntries} />
      </div>
    </div>
  );
}
