import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import OperationLog from '../components/OperationLog';
import { Pagination, usePaged } from '../components/Pagination';
import { Page, PageHeader, Section, DescList, Table, StatCard, StatGrid, Chip, Btn, LinkAction, Select, EmptyState } from '../components/ui';
import { productionPlanStatus, deviceBusinessNode, TODAY } from '../utils/status';

// 生产计划详情（只读追溯视图）
// 定位：平台不创建 ERP 生产订单、不维护 BOM / 入库 / 出库 / 检验。
// 本页 = ERP 工单关联（只读同步）+ 平台生产过程记录 + 质量测试追溯。
// 分区：计划基础信息 / ERP 工单·入库·检验信息 / 设备列表 / 单机生产记录 /
//       质量测试记录 / 生产返修记录 / 操作日志。

const STATION_LABEL = { semi: '半成品检验', init: '初测', mid: '中测', oqt: 'OQT终测' };
const isPassRec = (r) => r.stationResult === 'Pass' || ['合格', 'Pass', '通过'].includes(r.result);

// 平台强工站（来料准备/入库/检验/库存不属于平台强工站，仅在 ERP 关联信息只读展示）
const STATIONS = [['semi', '半成品检验'], ['init', '初测'], ['mid', '中测'], ['oqt', 'OQT终测']];

// 轻量进度条（设备级 / 单机记录使用，不做成计划级所有设备共用一条固定进度条）
function ProgressLine({ done, total, tone = 'bg-blue-500' }) {
  const pct = total > 0 ? Math.min(Math.round((done / total) * 100), 100) : 0;
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{done}/{total || 0}</span>
    </div>
  );
}

// 「长期未结」阈值：创建早于 TODAY - 45 天且未完成。放在模块作用域，避免在渲染期做日期运算。
const LONG_UNSETTLED_BEFORE = (() => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - 45);
  return d.toISOString().slice(0, 10);
})();

export default function ProductionPlanDetail() {
  const { id } = useParams();
  const { state } = useApp();

  const plans = [...(state.workflowProductionPlans || []), ...(state.productionPlans || [])];
  const plan = plans.find((p) => p.id === id);

  const deviceTypes = state.deviceTypes || [];
  const typeName = (tid) => deviceTypes.find((t) => t.id === tid)?.name || '—';

  const planDevices = plan ? (state.devices || []).filter((d) => d.productionPlanId === plan.id) : [];
  const planDeviceIds = new Set(planDevices.map((d) => d.id));
  const snOf = (deviceId) => planDevices.find((d) => d.id === deviceId)?.sn || deviceId;
  const testRecords = plan ? (state.testRecords || []).filter((r) => planDeviceIds.has(r.deviceId) && r.stationKey) : [];
  const repairs = plan ? (state.productionWorkOrders || []).filter((w) => w.productionPlanId === plan.id || planDeviceIds.has(w.deviceId)) : [];
  const planLogs = plan ? (state.operationLogs || []).filter((l) => l.productionPlanId === plan.id || planDeviceIds.has(l.deviceId)) : [];
  const testSorted = [...testRecords].sort((a, b) => String(b.testTime || '').localeCompare(String(a.testTime || '')));

  const devPaged = usePaged(planDevices, 8);
  const testPaged = usePaged(testSorted, 10);
  const repairPaged = usePaged(repairs, 8);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  if (!plan) {
    return (
      <Page>
        <PageHeader title="生产计划详情" actions={<Btn as="link" to="/projects?tab=production" variant="secondary">返回生产计划</Btn>} />
        <EmptyState>未找到生产计划 {id}</EmptyState>
      </Page>
    );
  }

  const project = (state.projects || []).find((p) => p.id === plan.projectId);
  const planStatus = productionPlanStatus(plan);
  const isDone = ['已完成', '已作废'].includes(planStatus);
  const overdue = !!plan.endDate && plan.endDate < TODAY && !isDone && planStatus !== '未开始';
  const longUnsettled = !isDone && !!plan.createdAt && String(plan.createdAt).slice(0, 10) < LONG_UNSETTLED_BEFORE;
  const targetCount = plan.targetCount ?? plan.target ?? 0;

  const stationPassed = (deviceId, key) => {
    const recs = testRecords
      .filter((r) => r.deviceId === deviceId && r.stationKey === key)
      .sort((a, b) => String(a.testTime || '').localeCompare(String(b.testTime || '')));
    const last = recs.at(-1);
    return !!last && isPassRec(last);
  };
  const passedAll = planDevices.filter((d) => ['semi', 'init', 'mid', 'oqt'].every((k) => stationPassed(d.id, k))).length;
  const repairing = planDevices.filter((d) => ['生产返修中', '返修中'].includes(d.status)).length;
  const openRepairs = repairs.filter((w) => !['已关闭', '已作废', '已完成'].includes(w.status)).length;

  // 每台设备最近一次工站测试 & 返修次数（用于设备列表进度快照）
  const latestTest = {};
  testSorted.forEach((r) => { if (!(r.deviceId in latestTest)) latestTest[r.deviceId] = r; });
  const repairCount = {};
  repairs.forEach((w) => { if (w.deviceId) repairCount[w.deviceId] = (repairCount[w.deviceId] || 0) + 1; });

  // 设备状态分布（按当前状态分组计数）
  const statusDist = Object.entries(
    planDevices.reduce((acc, d) => { acc[d.status] = (acc[d.status] || 0) + 1; return acc; }, {}),
  ).sort((a, b) => b[1] - a[1]);

  // 已入库及下游设备数（计划进度概览口径；来料/入库/检验不作为平台强工站）
  const INBOUND_OR_LATER = ['已入库', '待分配项目', '已分配项目', '现场安装调试中', '客户验收中', '在线运营', '退役', '待交付', '可交付'];
  const storedCount = planDevices.filter((d) => INBOUND_OR_LATER.includes(d.status)).length;

  // 当前卡点（平台派生，非单一节点）：未结返修单 / NG → 质量测试；创建久未完成 → 长期未结；否则无明显卡点
  const anyNG = planDevices.some((d) => {
    const lt = latestTest[d.id];
    return ['生产返修中', '返修中', '测试NG', 'NG待返修'].includes(d.status) || (!!lt && !isPassRec(lt));
  });
  const bottleneck = isDone ? '无明显卡点' : (openRepairs > 0 || anyNG) ? '质量测试' : longUnsettled ? '长期未结' : '无明显卡点';

  // 单机生产记录：按设备查看（默认第一台，可从设备列表「查看单机记录」定位）
  const selectedDevice = planDevices.find((d) => d.id === selectedDeviceId) || planDevices[0];
  const stationState = (deviceId, key) => {
    const recs = testRecords
      .filter((r) => r.deviceId === deviceId && r.stationKey === key)
      .sort((a, b) => String(a.testTime || '').localeCompare(String(b.testTime || '')));
    const last = recs.at(-1);
    return last ? (isPassRec(last) ? 'Pass' : 'NG') : '待测试';
  };
  const recheckOf = (r) => {
    if (isPassRec(r)) return '—';
    const w = repairs.find((x) => x.deviceId === r.deviceId && x.ngStation === r.stationKey);
    if (!w) return '—';
    return w.recheckResult || w.status || '—';
  };

  const cycle = `${String(plan.createdAt || '').slice(0, 10) || '—'} ~ ${plan.endDate ?? '—'}`;

  return (
    <Page>
      <PageHeader
        breadcrumb={(
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
            <Link to="/projects?tab=production" className="hover:text-gray-700">生产计划</Link>
            <span>/</span>
            <span className="text-gray-600">{plan.name ?? plan.id}</span>
          </div>
        )}
        title={<span className="inline-flex items-center gap-3">{plan.name ?? plan.id}<StatusBadge status={planStatus} size="md" /></span>}
        description="生产计划仅关联 ERP 工单并记录平台生产过程与质量测试追溯，不创建 ERP 生产订单，也不维护 BOM / 入库 / 出库 / 检验。"
        actions={<Btn as="link" to="/projects?tab=production" variant="secondary">返回生产计划</Btn>}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Chip>当前卡点</Chip>
        <StatusBadge status={bottleneck} size="md" />
        {longUnsettled && <StatusBadge status="长期未结" />}
        {overdue && <StatusBadge status="超期" />}
      </div>

      <StatGrid cols={4}>
        <StatCard label="计划数量" value={targetCount || '—'} />
        <StatCard label="已关联设备数" value={planDevices.length} />
        <StatCard label="全工站通过数" value={passedAll} tone="success" />
        <StatCard label="返修中 / 未结返修单" value={`${repairing} / ${openRepairs}`} tone={openRepairs ? 'warning' : 'default'} />
      </StatGrid>

      <Section title="设备状态分布 / 计划进度概览" subtitle="按设备当前状态分组统计（平台派生，非 ERP 字段、非所有设备统一节点）">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-[13px]">
            <span className="text-gray-500">已入库进度</span>
            <ProgressLine done={storedCount} total={targetCount || planDevices.length} />
            <span className="text-xs text-gray-400">已入库及下游 {storedCount} / {targetCount || planDevices.length} 台</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-3 border-t border-[#f2f2f2]">
            {statusDist.length === 0
              ? <span className="text-sm text-gray-400">该生产计划暂无设备</span>
              : statusDist.map(([st, n]) => (
                <span key={st} className="inline-flex items-center gap-1.5">
                  <StatusBadge status={st} />
                  <span className="text-xs text-gray-500">× {n}</span>
                </span>
              ))}
          </div>
        </div>
      </Section>

      <Section title="计划基础信息">
        <DescList
          cols={3}
          items={[
            ['计划编号', plan.id],
            ['计划名称', plan.name],
            ['所属项目', project ? <Link to={`/projects/${project.id}`} className="ui-link">{project.name}</Link> : '—'],
            ['机器人型号', typeName(plan.deviceTypeId)],
            ['计划数量', targetCount ? `${targetCount} 台` : '—'],
            ['已录入设备', `${planDevices.length} 台`],
            ['负责人', plan.owner],
            ['当前卡点', bottleneck],
            ['计划周期', cycle],
            ['更新时间', plan.updatedAt],
            ['备注', plan.notes],
          ]}
        />
      </Section>

      <Section
        title="ERP 工单 / 入库 / 检验信息"
        subtitle="ERP 工单状态 / 入库状态 / 检验状态均来自 ERP，平台只读同步展示，不创建 ERP 单据（枚举以后以 ERP API 为准）。"
        right={<Chip>ERP 只读同步</Chip>}
      >
        <DescList
          cols={3}
          items={[
            ['ERP 生产订单号', plan.erpProductionOrderNo],
            ['ERP 产品入库单号', plan.erpInboundNo],
            ['ERP 产品检验单号', plan.erpInspectionNo],
            ['ERP 库存状态', plan.erpStockStatus],
            ['入库仓库', plan.warehouse],
            ['同步口径', '只读同步'],
          ]}
        />
        <div className="mt-4 pt-4 border-t border-[#f2f2f2]">
          <div className="text-xs text-gray-400 mb-2">平台派生状态（基于计划周期与设备状态派生，非 ERP 字段）</div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip>当前卡点 · {bottleneck}</Chip>
            {longUnsettled ? <StatusBadge status="长期未结" /> : <Chip tone="outline">非长期未结</Chip>}
            {overdue ? <StatusBadge status="超期" /> : <Chip tone="outline">未超期</Chip>}
          </div>
        </div>
      </Section>

      <Section title="设备列表" subtitle={`进度快照 · 该生产计划下设备 ${planDevices.length} 台（每台设备当前状态）`} bodyClassName="p-0">
        <Table
          head={['设备SN', '机器人型号', '当前状态', '当前工站', '最近测试结果', '是否返修', '返修次数', '装配人', '最近更新时间', '操作']}
          empty="该生产计划暂无设备"
          footer={<Pagination page={devPaged.page} total={devPaged.total} totalPages={devPaged.totalPages} onChange={devPaged.setPage} />}
        >
          {devPaged.pageItems.map((d) => {
            const lt = latestTest[d.id];
            const rc = repairCount[d.id] || 0;
            const repaired = rc > 0 || ['生产返修中', '返修中'].includes(d.status);
            return (
              <tr key={d.id} className="hover:bg-[#fafafa]">
                <td className="px-3 py-2 whitespace-nowrap"><Link to={`/devices/${d.id}`} className="ui-link font-mono text-xs">{d.sn}</Link></td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{typeName(d.deviceTypeId)}</td>
                <td className="px-3 py-2"><StatusBadge status={d.status} /></td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-600">{deviceBusinessNode(d)}</td>
                <td className="px-3 py-2">{lt ? <StatusBadge status={isPassRec(lt) ? 'Pass' : 'NG'} /> : <span className="text-xs text-gray-400">未测试</span>}</td>
                <td className="px-3 py-2">{repaired ? <span className="text-xs font-medium text-red-600">是</span> : <span className="text-xs text-gray-400">否</span>}</td>
                <td className="px-3 py-2 text-gray-600">{rc}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-600">{d.assembler ?? '—'}</td>
                <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{d.updatedAt ?? '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-x-3">
                    <LinkAction to={`/devices/${d.id}`}>查看设备详情</LinkAction>
                    <LinkAction onClick={() => setSelectedDeviceId(d.id)}>查看单机记录</LinkAction>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Section>

      <Section
        title="单机生产记录"
        subtitle="按设备查看整机装配与模块绑定过程留痕（平台生产过程记录）"
        right={planDevices.length > 0 && (
          <Select className="w-52" value={selectedDevice?.id || ''} onChange={(e) => setSelectedDeviceId(e.target.value)}>
            {planDevices.map((d) => <option key={d.id} value={d.id}>{d.sn}</option>)}
          </Select>
        )}
      >
        {!selectedDevice ? <EmptyState>该生产计划暂无设备</EmptyState> : (() => {
          const slots = deviceTypes.find((t) => t.id === selectedDevice.deviceTypeId)?.slots?.length || 0;
          const bound = selectedDevice.usedMaterials?.length || 0;
          const devLogs = (state.operationLogs || []).filter((l) => l.deviceId === selectedDevice.id);
          const anomalies = repairs.filter((w) => w.deviceId === selectedDevice.id).map((w) => w.description).filter(Boolean);
          return (
            <div className="space-y-4">
              <DescList
                cols={3}
                items={[
                  ['设备SN', <Link to={`/devices/${selectedDevice.id}`} className="ui-link font-mono text-xs">{selectedDevice.sn}</Link>],
                  ['机器人型号', typeName(selectedDevice.deviceTypeId)],
                  ['当前状态', <StatusBadge status={selectedDevice.status} />],
                  ['装配开始时间', selectedDevice.assemblyStartTime ?? selectedDevice.createdAt ?? '—'],
                  ['装配完成时间', selectedDevice.assemblyTime ?? '—'],
                  ['装配人', selectedDevice.assembler ?? '—'],
                  ['已绑定模块数量', `${bound} / ${slots}`],
                  ['附件', selectedDevice.photoName ?? '—'],
                  ['异常说明', anomalies.length ? anomalies.join('；') : '—'],
                ]}
              />
              <div className="pt-3 border-t border-[#f2f2f2]">
                <div className="text-xs text-gray-400 mb-2">模块绑定进度</div>
                <ProgressLine done={bound} total={slots} tone="bg-emerald-500" />
              </div>
              <div className="pt-3 border-t border-[#f2f2f2]">
                <div className="text-xs text-gray-400 mb-2">工站进度（该设备）</div>
                <div className="flex flex-wrap gap-4">
                  {STATIONS.map(([k, label]) => (
                    <div key={k} className="flex flex-col gap-1">
                      <span className="text-xs text-gray-400">{label}</span>
                      <StatusBadge status={stationState(selectedDevice.id, k)} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-[#f2f2f2]">
                <div className="text-xs text-gray-400 mb-2">操作日志（{devLogs.length} 条）</div>
                {devLogs.length ? <OperationLog logs={devLogs} /> : <EmptyState>暂无操作日志</EmptyState>}
              </div>
            </div>
          );
        })()}
      </Section>

      <Section
        title="质量测试记录"
        subtitle="工站测试追溯（半成品检验 / 初测 / 中测 / OQT终测）；为平台生产过程测试，不替代 ERP 产品检验单。"
        bodyClassName="p-0"
      >
        <Table
          head={['设备SN', '工站', '测试内容', '结果', '故障代码', '复测结果', '测试人', '测试时间']}
          empty="暂无质量测试记录"
          footer={<Pagination page={testPaged.page} total={testPaged.total} totalPages={testPaged.totalPages} onChange={testPaged.setPage} />}
        >
          {testPaged.pageItems.map((r) => {
            const recheck = recheckOf(r);
            return (
              <tr key={r.id} className="hover:bg-[#fafafa]">
                <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-gray-700">{snOf(r.deviceId)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{STATION_LABEL[r.stationKey] ?? '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-600">{r.testType ?? '—'}</td>
                <td className="px-3 py-2"><StatusBadge status={isPassRec(r) ? 'Pass' : 'NG'} /></td>
                <td className="px-3 py-2 text-xs text-gray-500 max-w-xs">{r.ngReason ?? '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap">{recheck === '—' ? <span className="text-gray-300">—</span> : <StatusBadge status={recheck} />}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-600">{r.operator ?? '—'}</td>
                <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{r.testTime ?? '—'}</td>
              </tr>
            );
          })}
        </Table>
      </Section>

      <Section
        title="生产返修记录"
        subtitle="测试 NG 生成的生产返修 / NG 工单（仅生产阶段，不进入售后工单中心）"
        bodyClassName="p-0"
      >
        <Table
          head={['工单编号', '设备SN', '来源工站', '问题描述', '严重程度', '负责人', '状态']}
          empty="暂无生产返修记录"
          footer={<Pagination page={repairPaged.page} total={repairPaged.total} totalPages={repairPaged.totalPages} onChange={repairPaged.setPage} />}
        >
          {repairPaged.pageItems.map((w) => (
            <tr key={w.id} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-gray-700">{w.id}</td>
              <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-gray-600">{w.deviceSN ?? '—'}</td>
              <td className="px-3 py-2 whitespace-nowrap text-gray-700">{STATION_LABEL[w.ngStation] ?? w.ngStation ?? '—'}</td>
              <td className="px-3 py-2 text-xs text-gray-600 max-w-sm"><div className="truncate">{w.description ?? '—'}</div></td>
              <td className="px-3 py-2"><StatusBadge status={w.severity ?? '—'} /></td>
              <td className="px-3 py-2 whitespace-nowrap text-gray-600">{w.assignedTo || '待指派'}</td>
              <td className="px-3 py-2"><StatusBadge status={w.status} /></td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="操作日志" subtitle={`共 ${planLogs.length} 条`}>
        {planLogs.length ? <OperationLog logs={planLogs} /> : <EmptyState>暂无操作日志</EmptyState>}
      </Section>
    </Page>
  );
}
