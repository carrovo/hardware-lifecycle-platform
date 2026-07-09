import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRole } from '../context/RoleContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Page, PageHeader, Section, DescList, Table, Btn, LinkAction, EmptyState } from '../components/ui';
import { deviceLifecycleStatus, deviceBusinessNode } from '../utils/status';

const STATION_LABELS = { semi: '半成品检验', init: '初测', mid: '中测', oqt: 'OQT终测' };

// 模块作用域时间戳，避免组件渲染期调用不纯函数（react-hooks/purity）。
const nowStamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

// 在线状态四态推导（与设备台账口径一致）。
function onlineStateOf(device) {
  const lc = deviceLifecycleStatus(device);
  if (lc === '在线运营') {
    if (device.online === true) return '在线';
    if (device.online === false) return '离线';
    return '未知';
  }
  if (['生产中', '待入库', '待交付', '交付中'].includes(lc)) return '未接入';
  return '未知';
}

// 占位二维码：由 SN 派生的确定性图案 + 三个定位角，纯展示用。
function QrPlaceholder({ seed = '' }) {
  const n = 21;
  const s = seed || 'SN';
  const isFinder = (r, c) => {
    const inBox = (br, bc) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
    const ring = (br, bc) => inBox(br, bc) && !(r > br && r < br + 6 && c > bc && c < bc + 6 && !(r > br + 1 && r < br + 5 && c > bc + 1 && c < bc + 5));
    return ring(0, 0) || ring(0, n - 7) || ring(n - 7, 0);
  };
  const rects = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const finderZone = (r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8);
      if (finderZone) {
        if (isFinder(r, c)) rects.push(<rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" />);
      } else {
        const v = (s.charCodeAt((r * n + c) % s.length) + r * 7 + c * 13) % 5;
        if (v < 2) rects.push(<rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" />);
      }
    }
  }
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className="w-44 h-44 text-gray-900" fill="currentColor" shapeRendering="crispEdges">
      {rects}
    </svg>
  );
}

function VoidTestRecordInline({ record, onVoid }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  if (!open) return <button onClick={() => setOpen(true)} className="ui-link text-red-500">作废</button>;
  return (
    <div className="flex items-center gap-2">
      <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="作废原因" className="ui-input w-36 h-7 text-xs" />
      <Btn size="sm" variant="danger" onClick={() => { if (reason.trim()) { onVoid(record, reason.trim()); setOpen(false); setReason(''); } }}>确认</Btn>
      <Btn size="sm" variant="ghost" onClick={() => { setOpen(false); setReason(''); }}>取消</Btn>
    </div>
  );
}

export default function DeviceDetail() {
  const { id } = useParams();
  const { state, dispatch } = useApp();
  const { canDo } = useRole();
  const [showQR, setShowQR] = useState(false);

  const device = state.devices.find((d) => d.id === id);

  if (!device) {
    return (
      <Page>
        <PageHeader title="设备不存在" description="未找到该设备，可能已被移除。" actions={<Btn as="link" to="/assets?tab=devices" variant="secondary">返回设备台账</Btn>} />
        <EmptyState>设备不存在</EmptyState>
      </Page>
    );
  }

  const deviceType = state.deviceTypes.find((dt) => dt.id === device.deviceTypeId);
  const project = device.projectId ? state.projects.find((p) => p.id === device.projectId) : null;
  const location = device.locationId ? (state.locations || []).find((l) => l.id === device.locationId) : null;
  const plan = device.productionPlanId ? (state.workflowProductionPlans || []).find((p) => p.id === device.productionPlanId) : null;
  const deliveryPlan = device.deliveryPlanId ? (state.deliveryPlans || []).find((p) => p.id === device.deliveryPlanId) : null;

  const testRecords = state.testRecords.filter((t) => t.deviceId === id).sort((a, b) => (b.testTime || '').localeCompare(a.testTime || ''));
  const operationLogs = state.operationLogs.filter((l) => l.deviceId === id).sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  const deliveries = state.deliveryRecords.filter((d) => d.deviceId === id).sort((a, b) => (b.recordTime || '').localeCompare(a.recordTime || ''));
  const workOrders = state.workOrders.filter((w) => w.deviceId === id);
  const productionWorkOrders = (state.productionWorkOrders || []).filter((w) => w.deviceId === id);
  const replacements = state.moduleReplacements.filter((mr) => mr.deviceId === id);
  const qualityIssues = (state.qualityIssues || []).filter((q) => q.deviceId === id);
  const alerts = (state.alerts || []).filter((a) => a.deviceId === id);

  const lifecycle = deviceLifecycleStatus(device);
  const online = onlineStateOf(device);

  const getModuleName = (mtId) => state.moduleTypes.find((m) => m.id === mtId)?.name || mtId;
  const getModuleCategory = (mtId) => state.moduleTypes.find((m) => m.id === mtId)?.category || '';
  const getMaterial = (materialId) => state.materials.find((m) => m.id === materialId);
  const getMaterialSN = (materialId) => getMaterial(materialId)?.sn || materialId || '—';
  const getSlotName = (mtId) => deviceType?.slots?.find((s) => s.moduleTypeId === mtId)?.slotName || '—';

  const handleVoidTestRecord = (record, reason) => {
    const now = nowStamp();
    dispatch({ type: 'UPDATE_TEST_RECORD', payload: { id: record.id, voided: true, voidReason: reason, voidedAt: now } });
    dispatch({
      type: 'ADD_OPERATION_LOG',
      payload: { id: `LOG-${record.id}-void`, deviceId: id, operator: state.currentUser, timestamp: now, actionType: '作废测试记录', fromStatus: device.status, toStatus: device.status, notes: `作废测试记录 ${record.id}，原因：${reason}` },
    });
  };

  // 问题与售后：质量问题 + 售后工单 + 健康告警合并时间线
  const issueRows = [
    ...qualityIssues.map((q) => ({ kind: '质量问题', id: q.id, summary: q.issueDesc, stage: q.sourceStage, severity: q.severity, status: q.status, owner: q.owner || q.reporterName, time: q.reportTime, to: '/after-sales?tab=quality' })),
    ...workOrders.map((w) => ({ kind: '售后工单', id: w.id, summary: w.description, stage: w.woClass, severity: w.severity, status: w.status, owner: w.assignedTo || '待指派', time: w.createdAt, to: '/after-sales?tab=orders' })),
    ...alerts.map((a) => ({ kind: '健康告警', id: a.id, summary: a.description, stage: a.alertType, severity: a.severity, status: a.status, owner: a.owner || '—', time: a.alertTime, to: null })),
  ].sort((a, b) => (b.time || '').localeCompare(a.time || ''));

  const moduleRows = (device.usedMaterials && device.usedMaterials.length > 0)
    ? device.usedMaterials.map((um) => ({ slot: getSlotName(um.moduleTypeId), type: getModuleName(um.moduleTypeId), cat: getModuleCategory(um.moduleTypeId), sn: getMaterial(um.materialId)?.sn || um.materialId, boundAt: device.assemblyTime || '—', status: getMaterial(um.materialId)?.status || '已装配', template: false }))
    : (deviceType?.slots || []).map((slot) => ({ slot: slot.slotName, type: getModuleName(slot.moduleTypeId), cat: getModuleCategory(slot.moduleTypeId), sn: '待绑定', boundAt: '—', status: '待确认', template: true }));

  return (
    <Page>
      <PageHeader
        breadcrumb={
          <div className="text-xs text-gray-400 mb-1">
            <Link to="/assets?tab=devices" className="ui-link">设备台账</Link>
            <span className="mx-1">/</span>
            <span className="text-gray-500">{device.sn}</span>
          </div>
        }
        title={device.sn}
        description={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <span>{deviceType?.name || device.deviceTypeId}</span>
            {project && <><span className="text-gray-300">·</span><span>{project.name}</span></>}
            <StatusBadge status={lifecycle} />
            <StatusBadge status={online} />
          </span>
        }
        actions={<Btn as="link" to="/assets?tab=devices" variant="secondary">返回设备台账</Btn>}
      />

      {/* 基础信息 */}
      <Section title="基础信息">
        <DescList
          cols={4}
          items={[
            ['设备 SN', device.sn],
            ['机器人型号', deviceType?.name || device.deviceTypeId],
            ['所属项目', project ? <Link to={`/projects/${project.id}`} className="ui-link">{project.name}</Link> : '—'],
            ['客户名称', project?.client ?? '—'],
            ['项目类型 / 业务场景', project?.projectType ?? '—'],
            ['所属点位', location?.name ?? '—'],
            ['当前状态', <StatusBadge key="lc" status={lifecycle} />],
            ['在线状态', <StatusBadge key="on" status={online} />],
            ['当前业务节点', <StatusBadge key="node" status={deviceBusinessNode(device)} />],
            ['装配人', device.assembler ?? '—'],
            ['装配时间', device.assemblyTime ?? '—'],
            ['创建时间', device.createdAt ?? '—'],
            ['最近更新', device.updatedAt ?? '—'],
            ['设备别名', device.alias ?? '—'],
            ['网络标识', device.networkId ?? '—'],
          ]}
        />
      </Section>

      {/* 二维码入口 */}
      <Section title="二维码入口" right={<Btn size="sm" variant="secondary" onClick={() => setShowQR(true)}>查看二维码</Btn>}>
        <DescList
          cols={4}
          items={[
            ['二维码状态', device.qrStatus ?? '已生成'],
            ['二维码标识', device.qrCodeId ?? `QR-${device.sn}`],
            ['生成时间', device.qrGeneratedAt ?? device.createdAt ?? '—'],
            ['最近扫码时间', device.qrLastScanAt ?? '—'],
          ]}
        />
        <p className="text-xs text-gray-400 mt-3">扫码可进入移动端上报页登记质量问题；二维码标识用于设备识别，不承载敏感信息。</p>
      </Section>

      {/* 模块 / 核心部件 */}
      <Section title="模块 / 核心部件" subtitle={moduleRows.some((r) => r.template) ? '该设备暂未登记核心部件实例，按机器人型号槽位模板展示应绑定模块' : `按槽位展示已绑定核心部件（${moduleRows.length}）`} bodyClassName="p-0">
        <Table head={['槽位名称', '核心部件类型', '模块 SN', '绑定时间', '状态']} empty="暂无模块绑定记录">
          {moduleRows.map((m, i) => (
            <tr key={i} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{m.slot}</td>
              <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{m.type}{m.cat && <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded-full">{m.cat}</span>}</td>
              <td className="px-3 py-2 font-mono text-xs text-gray-600">{m.sn}</td>
              <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{m.boundAt}</td>
              <td className="px-3 py-2"><StatusBadge status={m.status} /></td>
            </tr>
          ))}
        </Table>
      </Section>

      {/* 生产过程记录 */}
      <Section title="生产过程记录" subtitle={`装配：${device.assembler || '—'} · ${device.assemblyTime || '—'}${plan ? ` · 生产计划 ${plan.name || plan.id}` : ''}`} bodyClassName="p-0">
        <Table head={['生产工单', 'NG 工站', '描述', '严重程度', '状态', '负责人', '更新时间']} empty="暂无生产返修 / 工单记录">
          {productionWorkOrders.map((w) => (
            <tr key={w.id} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 font-mono text-xs text-gray-700 whitespace-nowrap">{w.id}</td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{STATION_LABELS[w.ngStation] || w.ngStation || '—'}</td>
              <td className="px-3 py-2 text-gray-600 text-xs max-w-xs"><span className="truncate block">{w.description}</span></td>
              <td className="px-3 py-2"><StatusBadge status={w.severity} /></td>
              <td className="px-3 py-2"><StatusBadge status={w.status} /></td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{w.assignedTo || '待指派'}</td>
              <td className="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">{w.updatedAt || '—'}</td>
            </tr>
          ))}
        </Table>
      </Section>

      {/* 质量测试记录 */}
      <Section title="质量测试记录" subtitle={`共 ${testRecords.length} 条`} bodyClassName="p-0">
        <Table head={['测试工站', '结果', '测试员', '测试时间', '报告文件', '备注', '操作']} empty="暂无测试记录">
          {testRecords.map((t) => (
            <tr key={t.id} className={`hover:bg-[#fafafa] ${t.voided ? 'opacity-60' : ''}`}>
              <td className="px-3 py-2 text-gray-700 text-xs whitespace-nowrap">{STATION_LABELS[t.stationKey] || t.testType || '—'}</td>
              <td className="px-3 py-2">{t.voided ? <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">已作废</span> : <StatusBadge status={t.result === '合格' ? '合格' : '不合格'} />}</td>
              <td className="px-3 py-2 text-gray-600 text-xs">{t.operator}</td>
              <td className={`px-3 py-2 text-xs whitespace-nowrap ${t.voided ? 'line-through text-gray-400' : 'text-gray-500'}`}>{t.testTime}</td>
              <td className="px-3 py-2 text-gray-400 text-xs font-mono">{t.reportFile || '—'}</td>
              <td className="px-3 py-2 text-gray-400 text-xs">{t.notes || '—'}</td>
              <td className="px-3 py-2 text-xs">
                {t.voided
                  ? <span className="text-gray-400 text-xs">已作废 · {t.voidedAt}</span>
                  : canDo('void_test_record')
                    ? <VoidTestRecordInline record={t} onVoid={handleVoidTestRecord} />
                    : <span className="text-gray-300">—</span>}
              </td>
            </tr>
          ))}
        </Table>
      </Section>

      {/* 交付记录 */}
      <Section title="交付记录" subtitle={deliveryPlan ? `交付计划 ${deliveryPlan.batchNo || deliveryPlan.name}` : undefined} bodyClassName="p-0">
        <Table head={['阶段', '结果', '地点', '操作人', '时间', '备注']} empty="暂无交付记录">
          {deliveries.map((d) => (
            <tr key={d.id} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 text-gray-700 text-xs whitespace-nowrap">{d.stage}</td>
              <td className="px-3 py-2"><StatusBadge status={d.result} /></td>
              <td className="px-3 py-2 text-gray-500 text-xs">{d.address || '—'}</td>
              <td className="px-3 py-2 text-gray-600 text-xs">{d.operator || '—'}</td>
              <td className="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">{d.recordTime}</td>
              <td className="px-3 py-2 text-gray-400 text-xs max-w-xs"><span className="truncate block">{d.notes || '—'}</span></td>
            </tr>
          ))}
        </Table>
      </Section>

      {/* 问题与售后 */}
      <Section title="问题与售后" subtitle="设备关联的质量问题、售后工单与健康告警" bodyClassName="p-0">
        <Table head={['类型', '编号', '摘要', '阶段 / 分类', '严重程度', '状态', '负责人', '时间', '入口']} empty="暂无问题与售后记录">
          {issueRows.map((r) => (
            <tr key={`${r.kind}-${r.id}`} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 text-gray-700 text-xs whitespace-nowrap">{r.kind}</td>
              <td className="px-3 py-2 font-mono text-xs text-gray-500 whitespace-nowrap">{r.id}</td>
              <td className="px-3 py-2 text-gray-600 text-xs max-w-xs"><span className="truncate block">{r.summary}</span></td>
              <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{r.stage || '—'}</td>
              <td className="px-3 py-2"><StatusBadge status={r.severity} /></td>
              <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{r.owner}</td>
              <td className="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">{r.time}</td>
              <td className="px-3 py-2 text-xs whitespace-nowrap">{r.to ? <LinkAction to={r.to}>查看</LinkAction> : <span className="text-gray-300">—</span>}</td>
            </tr>
          ))}
        </Table>
      </Section>

      {/* 换件记录 */}
      <Section title="换件记录" subtitle={`共 ${replacements.length} 条`} bodyClassName="p-0">
        <Table head={['槽位', '原模块 SN', '新模块 SN', '原件处置', '关联工单', '操作人', '时间', '备注']} empty="暂无换件记录">
          {replacements.map((mr) => (
            <tr key={mr.id} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{mr.slotName || '—'}</td>
              <td className="px-3 py-2 font-mono text-xs text-gray-500 whitespace-nowrap">{getMaterialSN(mr.removedMaterialId)}</td>
              <td className="px-3 py-2 font-mono text-xs text-gray-700 whitespace-nowrap">{getMaterialSN(mr.addedMaterialId)}</td>
              <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{mr.removedDisposition || '—'}</td>
              <td className="px-3 py-2 text-xs whitespace-nowrap">{mr.workOrderId ? <LinkAction to="/after-sales?tab=orders">{mr.workOrderId}</LinkAction> : '—'}</td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{mr.operator || '—'}</td>
              <td className="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">{mr.timestamp}</td>
              <td className="px-3 py-2 text-gray-400 text-xs max-w-xs"><span className="truncate block">{mr.notes || '—'}</span></td>
            </tr>
          ))}
        </Table>
      </Section>

      {/* ERP 关联信息 */}
      <Section title="ERP 关联信息" subtitle="只读同步自 ERP">
        <DescList
          cols={4}
          items={[
            ['ERP 项目号', project?.erpProjectNo ?? '—'],
            ['产成品入库单号', device.erpStorageOrderNo ?? '—'],
            ['入库单号', device.erpInboundNo ?? '—'],
            ['检验单号', device.erpInspectionNo ?? '—'],
            ['检验状态', device.erpInspectionStatus ?? '—'],
            ['库存状态', device.erpStockStatus ?? '—'],
            ['ERP 序列号', device.erpSerialNo ?? '—'],
            ['仓库', device.warehouse ?? '—'],
            ['入库时间', device.inboundTime ?? '—'],
          ]}
        />
      </Section>

      {/* 操作日志 */}
      <Section title="操作日志" subtitle={`共 ${operationLogs.length} 条 · 从新到旧`} bodyClassName="p-0">
        <Table head={['时间', '操作人', '动作', '状态变化', '说明']} empty="暂无操作日志">
          {operationLogs.map((log) => (
            <tr key={log.id} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">{log.timestamp}</td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{log.operator}</td>
              <td className="px-3 py-2 text-gray-700 text-xs whitespace-nowrap">{log.actionType}</td>
              <td className="px-3 py-2 text-xs whitespace-nowrap">
                {log.fromStatus && log.toStatus
                  ? <span className="inline-flex items-center gap-1.5 text-gray-500"><StatusBadge status={log.fromStatus} /><span className="text-gray-300">→</span><StatusBadge status={log.toStatus} /></span>
                  : '—'}
              </td>
              <td className="px-3 py-2 text-gray-500 text-xs max-w-md"><span className="truncate block">{log.notes || '—'}</span></td>
            </tr>
          ))}
        </Table>
      </Section>

      <Modal isOpen={showQR} onClose={() => setShowQR(false)} title="设备二维码" size="sm">
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="p-4 bg-white border border-[#ececec] rounded-lg"><QrPlaceholder seed={device.sn} /></div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-800 font-mono">{device.sn}</div>
            <div className="text-xs text-gray-400 mt-0.5">二维码标识：{device.qrCodeId ?? `QR-${device.sn}`}</div>
          </div>
          <p className="text-xs text-gray-400 text-center">（原型占位二维码）扫码进入移动端上报页登记该设备的质量问题。</p>
        </div>
      </Modal>
    </Page>
  );
}
