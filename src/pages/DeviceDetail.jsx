import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import StatusBadge from '../components/StatusBadge';

const FLOW_STAGES = ['整机装配', '质量测试', '整机入库', '出厂检验', '现场安装调试', '客户验收', '在线运营'];

function getStageProgress(status) {
  switch (status) {
    case '装配中': return { doneUpTo: 0, currentIdx: 0 };
    case '半成品检验中':
    case '初测中':
    case '中测中':
    case 'OQT终测中':
    case '生产返修中':
      return { doneUpTo: 1, currentIdx: 1 };
    case '已入库':
    case '待分配项目':
      return { doneUpTo: 3, currentIdx: -1 };
    case '已分配项目':
    case '出厂检验中':
      return { doneUpTo: 3, currentIdx: 3 };
    case '现场安装调试中':
      return { doneUpTo: 4, currentIdx: 4 };
    case '客户验收中':
      return { doneUpTo: 5, currentIdx: 5 };
    case '在线运营':
      return { doneUpTo: 7, currentIdx: -1 };
    default:
      return { doneUpTo: 0, currentIdx: -1 };
  }
}

function StageStepper({ status }) {
  const { doneUpTo, currentIdx } = getStageProgress(status);
  const isRepair = status === '生产返修中';

  return (
    <div className="bg-white rounded shadow-sm p-5">
      {isRepair && (
        <div className="mb-4 flex items-center gap-2 text-red-600 text-sm font-medium">
          <span>⚠</span><span>当前设备处于返修状态，待修复后继续流转</span>
        </div>
      )}
      <div className="flex items-start overflow-x-auto">
        {FLOW_STAGES.map((stage, i) => {
          const done = doneUpTo > i;
          const active = currentIdx === i;
          return (
            <div key={stage} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-center min-w-[64px]">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  done ? 'bg-green-500 text-white'
                  : active ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                  : 'border-2 border-gray-300 text-gray-400 bg-white'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-xs mt-1 text-center whitespace-nowrap ${
                  done ? 'text-green-700'
                  : active ? 'text-blue-700 font-semibold'
                  : 'text-gray-400'
                }`}>{stage}</span>
              </div>
              {i < FLOW_STAGES.length - 1 && (
                <div className={`flex-1 h-0.5 mt-4 mx-1 ${doneUpTo > i ? 'bg-green-300' : 'bg-gray-200'}`} />
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
      <button onClick={() => setOpen(true)}
        className="px-2 py-0.5 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50">
        作废
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
        placeholder="填写作废原因..." className="border border-gray-300 rounded px-2 py-1 text-xs w-48 focus:outline-none focus:border-red-400" />
      <button onClick={() => { if (reason.trim()) { onVoid(record, reason.trim()); setOpen(false); setReason(''); } }}
        className="px-2 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700">确认</button>
      <button onClick={() => { setOpen(false); setReason(''); }}
        className="px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
    </div>
  );
}

// Timeline event types → visual config
const EVENT_STYLES = {
  '整机装配':      { dot: 'bg-blue-500',   label: '整机装配',   icon: '🔧' },
  '功能测试-合格':  { dot: 'bg-green-500',  label: '功能测试',   icon: '✅' },
  '功能测试-不合格':{ dot: 'bg-red-500',    label: '功能测试',   icon: '❌' },
  '老化测试-合格':  { dot: 'bg-green-500',  label: '老化测试',   icon: '✅' },
  '老化测试-不合格':{ dot: 'bg-red-500',    label: '老化测试',   icon: '❌' },
  '终测-合格':     { dot: 'bg-green-500',  label: '终测',       icon: '✅' },
  '终测-不合格':   { dot: 'bg-red-500',    label: '终测',       icon: '❌' },
  '作废测试记录':  { dot: 'bg-gray-400',   label: '作废记录',   icon: '⊘' },
  '返修完成':      { dot: 'bg-purple-500', label: '返修完成',   icon: '🔨' },
  '项目分配':      { dot: 'bg-indigo-500', label: '项目分配',   icon: '📋' },
  '项目转移':      { dot: 'bg-violet-500', label: '项目转移',   icon: '🔄' },
  '出厂检验':      { dot: 'bg-teal-500',   label: '出厂检验',   icon: '🏭' },
  '现场安装调试':  { dot: 'bg-orange-500', label: '现场安装调试', icon: '🛠' },
  '客户验收':      { dot: 'bg-emerald-500',label: '客户验收',   icon: '🤝' },
  '在线运营':      { dot: 'bg-emerald-500',label: '上线运营',   icon: '💡' },
  '维修工单':      { dot: 'bg-red-500',    label: '维修工单',   icon: '🔴' },
  '模块更换':      { dot: 'bg-purple-500', label: '模块更换',   icon: '🔩' },
  '退役':          { dot: 'bg-gray-500',   label: '设备退役',   icon: '📦' },
  '默认':          { dot: 'bg-gray-400',   label: '',           icon: '📝' },
};

function buildLifecycleTimeline(device, testRecords, operationLogs, deviceAllocations, deliveryRecords, workOrders, moduleReplacements, materials, projects) {
  const events = [];
  const getMaterialSN = (id) => materials.find((m) => m.id === id)?.sn || id;
  const getProjectName = (id) => projects.find((p) => p.id === id)?.name || id;

  // 1. Assembly event
  if (device.assemblyTime) {
    events.push({
      key: `asm-${device.id}`,
      type: '整机装配',
      timestamp: device.assemblyTime,
      operator: device.assembler,
      summary: `完成整机装配，装配人：${device.assembler}`,
    });
  }

  // 2. Test records
  testRecords.forEach((t) => {
    const resultKey = `${t.testType}-${t.result}`;
    events.push({
      key: t.id,
      type: resultKey,
      timestamp: t.testTime,
      operator: t.operator,
      summary: `${t.testType} ${t.result} · 测试人：${t.operator}${t.notes ? ' · ' + t.notes : ''}`,
      voided: t.voided,
      voidReason: t.voidReason,
    });
  });

  // 3. Operation logs — include only types not covered by structured data above
  const SKIP_LOG_TYPES = new Set([
    '装配', '功能测试通过', '功能测试不合格', '老化测试通过', '老化测试不合格',
    '分配至项目', '上线运营',
  ]);
  operationLogs.forEach((log) => {
    if (!SKIP_LOG_TYPES.has(log.actionType)) {
      events.push({
        key: log.id,
        type: log.actionType,
        timestamp: log.timestamp,
        operator: log.operator,
        summary: log.notes || log.actionType,
      });
    }
  });

  // 4. Project allocations
  deviceAllocations.forEach((a) => {
    const typeLabel = a.type === '转移' ? '项目转移' : '项目分配';
    const projectName = getProjectName(a.projectId);
    events.push({
      key: a.id,
      type: typeLabel,
      timestamp: a.allocatedAt,
      operator: a.allocatedBy,
      summary: `${typeLabel}至「${projectName}」${a.notes ? ' · ' + a.notes : ''}`,
    });
  });

  // 5. Delivery records
  deliveryRecords.forEach((d) => {
    const resultIcon = (d.result === '合格' || d.result === '通过') ? '通过' : '未通过';
    events.push({
      key: d.id,
      type: d.stage,
      timestamp: d.recordTime,
      operator: d.operator,
      summary: `${d.stage} · 结果：${d.result}${d.address ? ' · 地点：' + d.address : ''}${d.notes ? ' · ' + d.notes : ''}`,
      result: resultIcon,
    });
  });

  // 6. Work orders (creation event only, to avoid clutter)
  workOrders.forEach((w) => {
    events.push({
      key: `wo-${w.id}`,
      type: '维修工单',
      timestamp: w.createdAt,
      operator: w.assignedTo,
      summary: `维修工单 ${w.id} 创建 · ${w.description.length > 40 ? w.description.slice(0, 40) + '…' : w.description}`,
      woId: w.id,
    });
  });

  // 7. Module replacements
  moduleReplacements.forEach((mr) => {
    const oldSN = getMaterialSN(mr.removedMaterialId);
    const newSN = getMaterialSN(mr.addedMaterialId);
    events.push({
      key: mr.id,
      type: '模块更换',
      timestamp: mr.timestamp,
      operator: mr.operator,
      summary: `${mr.slotName} 模块由 ${oldSN} → ${newSN} · 关联工单：${mr.workOrderId}${mr.notes ? ' · ' + mr.notes : ''}`,
    });
  });

  // Sort descending (newest first)
  return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function LifecycleTimeline({ events }) {
  if (!events || events.length === 0) {
    return <div className="text-center text-gray-400 py-8 text-sm">暂无操作记录</div>;
  }

  return (
    <div className="space-y-0">
      {events.map((ev, idx) => {
        const style = EVENT_STYLES[ev.type] || EVENT_STYLES['默认'];
        return (
          <div key={ev.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${style.dot} ${ev.voided ? 'opacity-40' : ''}`} />
              {idx < events.length - 1 && <div className="w-0.5 bg-gray-200 flex-1 my-1" />}
            </div>
            <div className="pb-4 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className={`text-xs ${ev.voided ? 'line-through text-gray-400' : 'font-medium text-gray-800'}`}>
                  {style.icon} {style.label || ev.type}
                </span>
                <span className="text-xs text-gray-400">{ev.timestamp}</span>
                {ev.operator && <span className="text-xs text-gray-500">· {ev.operator}</span>}
                {ev.woId && (
                  <Link to={`/work-orders?highlight=${ev.woId}`}
                    className="text-xs text-blue-600 hover:underline">
                    查看工单 →
                  </Link>
                )}
              </div>
              <div className={`text-xs ${ev.voided ? 'text-gray-400 line-through' : 'text-gray-500'}`}>
                {ev.summary}
              </div>
              {ev.voided && ev.voidReason && (
                <div className="text-xs text-gray-400 mt-0.5">作废原因：{ev.voidReason}</div>
              )}
            </div>
          </div>
        );
      })}
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
  const operationLogs = state.operationLogs.filter((l) => l.deviceId === id);
  const allocations = state.deviceAllocations.filter((a) => a.deviceId === id);
  const deliveries = state.deliveryRecords.filter((d) => d.deviceId === id);
  const deviceWorkOrders = state.workOrders.filter((w) => w.deviceId === id);
  const deviceModuleReplacements = state.moduleReplacements.filter((mr) => mr.deviceId === id);

  const timelineEvents = buildLifecycleTimeline(
    device, testRecords, operationLogs, allocations, deliveries,
    deviceWorkOrders, deviceModuleReplacements, state.materials, state.projects
  );

  const getModuleName = (moduleTypeId) =>
    state.moduleTypes.find((m) => m.id === moduleTypeId)?.name || moduleTypeId;

  const getModuleCategory = (moduleTypeId) =>
    state.moduleTypes.find((m) => m.id === moduleTypeId)?.category || '';

  const getMaterial = (materialId) =>
    state.materials.find((m) => m.id === materialId);

  const getSlotName = (moduleTypeId) => {
    const slot = deviceType?.slots?.find((s) => s.moduleTypeId === moduleTypeId);
    return slot?.slotName || '—';
  };

  const handleVoidTestRecord = (record, reason) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    dispatch({ type: 'UPDATE_TEST_RECORD', payload: { id: record.id, voided: true, voidReason: reason, voidedAt: now } });
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

      {/* Basic Info */}
      <div className="bg-white rounded shadow-sm p-5">
        <div className="text-sm font-medium text-gray-600 mb-3">基本信息</div>
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
          {device.erpStorageOrderNo && (
            <div>
              <div className="text-xs text-gray-400 mb-1">产成品入库单号</div>
              <div className="text-sm text-gray-600 font-mono">{device.erpStorageOrderNo}</div>
            </div>
          )}
          {device.photoName && (
            <div>
              <div className="text-xs text-gray-400 mb-1">现场照片</div>
              <div className="text-sm text-gray-500 font-mono">{device.photoName}</div>
            </div>
          )}
        </div>
        {device.labels && Object.keys(device.labels).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-400 mb-2">设备标签</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(device.labels).map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-1 rounded-full">
                  <span className="text-blue-500">{k}:</span>
                  <span className="font-medium">{v}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Module list by slot */}
      <div className="bg-white rounded shadow-sm p-5">
        <div className="text-sm font-medium text-gray-600 mb-3">当前模组清单（按槁位）</div>
        {device.usedMaterials && device.usedMaterials.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['槁位', '模组类型', '类别', '物料SN', '状态', '出厂日期', '固件版本', '累计运行'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {device.usedMaterials.map((um, i) => {
                const mat = getMaterial(um.materialId);
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-xs text-gray-500">{getSlotName(um.moduleTypeId)}</td>
                    <td className="px-4 py-2.5 text-gray-700 font-medium">{getModuleName(um.moduleTypeId)}</td>
                    <td className="px-4 py-2.5">
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{getModuleCategory(um.moduleTypeId)}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{mat?.sn || um.materialId}</td>
                    <td className="px-4 py-2.5">
                      {mat ? <StatusBadge status={mat.status} size="sm" /> : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{mat?.manufactureDate || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">{mat?.firmwareVersion ? mat.firmwareVersion : '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{mat && mat.operatingHours > 0 ? `${mat.operatingHours}h` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-sm text-gray-400">暂无模组物料记录</div>
        )}
      </div>

      {/* Test History — grouped by station */}
      <div className="bg-white rounded shadow-sm p-5">
        <div className="text-sm font-medium text-gray-600 mb-3">测试历史</div>
        {testRecords.length > 0 ? (() => {
          // Group by stationKey (quality stations) or testType (legacy)
          const STATION_LABELS = {
            semi: '半成品检验',
            init: '初测',
            mid: '中测',
            oqt: 'OQT终测',
          };
          const stationOrder = ['semi', 'init', 'mid', 'oqt'];
          const grouped = {};
          testRecords.forEach((t) => {
            const key = t.stationKey || t.testType || '其他';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(t);
          });
          // Sort groups: known stations first in order, then legacy by first appearance
          const knownKeys = stationOrder.filter((k) => grouped[k]);
          const otherKeys = Object.keys(grouped).filter((k) => !stationOrder.includes(k));
          const orderedKeys = [...knownKeys, ...otherKeys];

          return (
            <div className="space-y-4">
              {orderedKeys.map((key) => {
                const recs = grouped[key];
                const label = STATION_LABELS[key] || key;
                const passCount = recs.filter((r) => !r.voided && r.result === '合格').length;
                const ngCount = recs.filter((r) => !r.voided && r.result === '不合格').length;
                return (
                  <div key={key}>
                    {/* Station header */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-gray-700">{label}</span>
                      {passCount > 0 && (
                        <span className="inline-flex items-center border rounded font-medium text-xs px-2 py-0.5 bg-green-100 text-green-700 border-green-300">
                          合格 {passCount}
                        </span>
                      )}
                      {ngCount > 0 && (
                        <span className="inline-flex items-center border rounded font-medium text-xs px-2 py-0.5 bg-red-100 text-red-700 border-red-300">
                          不合格 {ngCount}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{recs.length} 条记录</span>
                    </div>
                    <table className="w-full text-sm mb-1">
                      <thead className="bg-gray-50">
                        <tr>
                          {['结果', '测试员', '测试时间', '报告文件', '备注', canDo('void_test_record') ? '操作' : ''].filter(Boolean).map((h) => (
                            <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recs.map((t) => (
                          <tr key={t.id} className={`${t.voided ? 'bg-gray-50 opacity-60' : t.result === '不合格' ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                            <td className="px-4 py-2">
                              {t.voided
                                ? <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">已作废</span>
                                : <StatusBadge status={t.result === '合格' ? '合格' : '不合格'} />
                              }
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
                  </div>
                );
              })}
            </div>
          );
        })() : (
          <div className="text-sm text-gray-400">暂无测试记录</div>
        )}
      </div>

      {/* Full Lifecycle Timeline */}
      <div className="bg-white rounded shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-gray-600">全生命周期操作时间线</div>
          <span className="text-xs text-gray-400">{timelineEvents.length} 条记录 · 从新到旧</span>
        </div>
        <LifecycleTimeline events={timelineEvents} />
      </div>
    </div>
  );
}
