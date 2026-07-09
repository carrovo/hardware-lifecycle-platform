import { useState } from 'react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import { Pagination, usePaged } from '../components/Pagination';
import { Section, Toolbar, Select, SearchInput, StatCard, StatGrid, Table, LinkAction } from '../components/ui';
import { MATERIAL_CATEGORIES, moduleInstances as MODULE_INSTANCES } from '../data/mockData';

// 物料与部件台账：两个只读台账区块。
//  区块1 物料信息       —— 供应商来料物料条目，入库 / 库存 / 同步时间以 ERP 为准（平台只读同步）。
//  区块2 核心部件追溯   —— SN 级核心部件（moduleInstances），追踪批次来源、装配绑定、换件与返修。
// 平台不新增 / 编辑 / 删除 ERP 正式单据，本页为只读台账视图。

const MODULE_STATUSES = ['在库可用', '已锁定生产计划', '已装配', '维修中', '已报废', '退货换货'];

export default function Materials() {
  const { state } = useApp();
  const materials = state.materials || [];
  const batches = state.materialBatches || [];
  const moduleTypes = state.moduleTypes || [];
  const devices = state.devices || [];
  const deviceTypes = state.deviceTypes || [];
  const replacements = state.moduleReplacements || [];
  const moduleInstances = MODULE_INSTANCES || [];

  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [supplier, setSupplier] = useState('');
  const [status, setStatus] = useState('');

  const batchOf = (id) => batches.find((b) => b.id === id);
  const typeName = (id) => moduleTypes.find((m) => m.id === id)?.name || id || '—';
  const deviceOf = (id) => devices.find((d) => d.id === id);
  // 关联物料编码：核心部件按批次的分类+型号回关到物料条目（原型近似映射），缺失回退 '—'。
  const materialCodeOf = (batch) => (batch ? (materials.find((m) => m.model === batch.model && m.category === batch.category)?.id || '—') : '—');
  const slotNameOf = (device, moduleTypeId) => {
    if (!device) return '—';
    const dt = deviceTypes.find((t) => t.id === device.deviceTypeId);
    return dt?.slots?.find((s) => s.moduleTypeId === moduleTypeId)?.slotName || '—';
  };

  const suppliers = [...new Set([...materials.map((m) => m.supplier), ...batches.map((b) => b.supplier)].filter(Boolean))];
  const kw = q.trim().toLowerCase();

  // 概览
  const boundCount = moduleInstances.filter((m) => m.boundDeviceId).length;
  const repairingCount = moduleInstances.filter((m) => /维修|返修/.test(m.status || '')).length;

  /* ── 区块1：物料信息 ── */
  const materialRows = materials.map((m) => ({
    ...m,
    name: `${m.category} ${m.model}`.trim(),
    erpInbound: m.erpInboundStatus ?? '已入库',
    erpStock: m.erpStockStatus ?? (m.inspectionResult === '不合格' ? '不合格' : '合格可用'),
    syncAt: m.updatedAt ?? m.inspectionTime ?? '—',
  })).filter((m) => (!category || m.category === category)
    && (!supplier || m.supplier === supplier)
    && (!kw || m.id.toLowerCase().includes(kw) || (m.model || '').toLowerCase().includes(kw) || (m.name || '').toLowerCase().includes(kw) || (m.batchNo || '').toLowerCase().includes(kw)));
  const matPaged = usePaged(materialRows, 8);

  /* ── 区块2：核心部件追溯 ── */
  const partRows = moduleInstances.map((mi) => {
    const batch = batchOf(mi.sourceBatchId);
    const device = mi.boundDeviceId ? deviceOf(mi.boundDeviceId) : null;
    return {
      ...mi,
      partType: typeName(mi.moduleTypeId),
      materialCode: materialCodeOf(batch),
      name: batch ? `${mi.category} ${batch.model || ''}`.trim() : (mi.category || '—'),
      model: batch?.model || '—',
      supplierName: batch?.supplier || '—',
      batchNo: batch?.batchNo || '—',
      bound: !!mi.boundDeviceId,
      device,
      slot: slotNameOf(device, mi.moduleTypeId),
      replaced: replacements.some((r) => r.deviceId === mi.boundDeviceId && r.moduleTypeId === mi.moduleTypeId),
      repaired: /维修|返修/.test(mi.status || ''),
      syncAt: mi.updatedAt ?? batch?.inspectionTime ?? '—',
    };
  }).filter((p) => (!category || p.category === category)
    && (!supplier || p.supplierName === supplier)
    && (!status || p.status === status)
    && (!kw || (p.sn || '').toLowerCase().includes(kw) || (p.id || '').toLowerCase().includes(kw) || (p.model || '').toLowerCase().includes(kw) || (p.batchNo || '').toLowerCase().includes(kw)));
  const partPaged = usePaged(partRows, 8);

  const yesNo = (v) => (v ? <span className="text-gray-700">是</span> : <span className="text-gray-300">否</span>);

  return (
    <div className="space-y-5">
      <StatGrid cols={4}>
        <StatCard label="物料条目" value={materials.length} />
        <StatCard label="核心部件总数" value={moduleInstances.length} />
        <StatCard label="已绑定设备" value={boundCount} tone="success" />
        <StatCard label="维修中部件" value={repairingCount} tone={repairingCount ? 'warning' : 'default'} />
      </StatGrid>

      <Toolbar right={<span className="text-xs text-gray-400">数据只读同步自 ERP</span>}>
        <SearchInput placeholder="搜索物料编码 / 型号 / 批次 / 模块 SN" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
        <Select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">全部分类</option>{MATERIAL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
        <Select value={supplier} onChange={(e) => setSupplier(e.target.value)}><option value="">全部供应商</option>{suppliers.map((s) => <option key={s}>{s}</option>)}</Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">全部部件状态</option>{MODULE_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select>
      </Toolbar>

      {/* 区块1 物料信息 */}
      <Section title="物料信息" subtitle={`共 ${materialRows.length} 条 · 入库 / 库存 / 同步时间只读同步自 ERP`} bodyClassName="p-0">
        <Table
          head={['物料编码', '物料名称', '规格型号', '物料分类', '供应商', '批次号', 'ERP 入库状态', 'ERP 库存状态', '最近同步时间']}
          empty="暂无物料"
          footer={<Pagination page={matPaged.page} total={matPaged.total} totalPages={matPaged.totalPages} onChange={matPaged.setPage} />}
        >
          {matPaged.pageItems.map((m) => (
            <tr key={m.id} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 font-mono text-xs text-gray-800 font-medium whitespace-nowrap">{m.id}</td>
              <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{m.name}</td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{m.model || '—'}</td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{m.category}</td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{m.supplier || '—'}</td>
              <td className="px-3 py-2 font-mono text-xs text-gray-500 whitespace-nowrap">{m.batchNo || '—'}</td>
              <td className="px-3 py-2"><StatusBadge status={m.erpInbound} /></td>
              <td className="px-3 py-2 text-xs"><span className={m.erpStock === '不合格' ? 'text-red-600 font-medium' : 'text-gray-600'}>{m.erpStock}</span></td>
              <td className="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">{m.syncAt}</td>
            </tr>
          ))}
        </Table>
      </Section>

      {/* 区块2 核心部件追溯 */}
      <Section title="核心部件追溯" subtitle={`共 ${partRows.length} 个核心部件 · 追踪 SN、批次来源、装配绑定、换件与返修`} bodyClassName="p-0">
        <Table
          head={['模块 SN / 内部 ID', '核心部件类型', '关联物料编码', '物料名称', '规格型号', '供应商', '批次号', '当前状态', '是否已绑定设备', '绑定设备 SN', '绑定槽位', '是否发生换件', '是否发生返修', '最近更新时间']}
          empty="暂无核心部件"
          footer={<Pagination page={partPaged.page} total={partPaged.total} totalPages={partPaged.totalPages} onChange={partPaged.setPage} />}
        >
          {partPaged.pageItems.map((p) => (
            <tr key={p.id} className="hover:bg-[#fafafa]">
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="font-mono text-xs text-gray-800 font-medium">{p.sn}</div>
                <div className="text-[11px] text-gray-400 font-mono">{p.id}</div>
              </td>
              <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{p.partType}</td>
              <td className="px-3 py-2 font-mono text-xs text-gray-500 whitespace-nowrap">{p.materialCode}</td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{p.name}</td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{p.model}</td>
              <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{p.supplierName}</td>
              <td className="px-3 py-2 font-mono text-xs text-gray-500 whitespace-nowrap">{p.batchNo}</td>
              <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
              <td className="px-3 py-2 text-xs">{yesNo(p.bound)}</td>
              <td className="px-3 py-2 text-xs whitespace-nowrap">{p.device ? <LinkAction to={`/devices/${p.device.id}`}>{p.device.sn}</LinkAction> : <span className="text-gray-300">—</span>}</td>
              <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{p.slot}</td>
              <td className="px-3 py-2 text-xs">{yesNo(p.replaced)}</td>
              <td className="px-3 py-2 text-xs">{yesNo(p.repaired)}</td>
              <td className="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">{p.syncAt}</td>
            </tr>
          ))}
        </Table>
      </Section>
    </div>
  );
}
