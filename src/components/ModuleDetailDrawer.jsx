// 共享「模块 / 核心部件详情」抽屉。供 物料与部件台账 / 生产计划单机记录 / 设备详情 复用。
// 明确区分 ERP 状态（只读同步）与 平台占用状态（平台按绑定/换件/返修过程生成）。
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import { DescList, Section, Table, LinkAction, EmptyState } from './ui';
import { platformOccupancyStatus } from '../utils/status';

export default function ModuleDetailDrawer({ moduleId, onClose }) {
  const { state } = useApp();
  const mi = (state.moduleInstances || []).find((m) => m.id === moduleId || m.sn === moduleId);
  if (!moduleId) return null;

  const moduleTypes = state.moduleTypes || [];
  const batches = state.materialBatches || [];
  const devices = state.devices || [];
  const replacements = state.moduleReplacements || [];

  const mt = mi ? moduleTypes.find((t) => t.id === mi.moduleTypeId) : null;
  const batch = mi ? batches.find((b) => b.id === mi.sourceBatchId) : null;
  const boundDevice = mi ? devices.find((d) => d.id === mi.boundDeviceId) : null;
  const relatedRepl = mi ? replacements.filter((r) => r.removedMaterialId === mi.id || r.addedMaterialId === mi.id || r.deviceId === mi.boundDeviceId) : [];
  const platform = platformOccupancyStatus(mi);

  const erpItems = [
    ['ERP 入库状态', mi?.erpInboundStatus || '已入库'],
    ['ERP 检验状态', mi?.erpInspectionStatus || '检验合格'],
    ['ERP 库存状态', mi?.erpStockStatus || '合格可用'],
  ];
  const erpDocs = [
    batch?.erpPurchaseOrderNo && ['采购单', batch.erpPurchaseOrderNo],
    batch?.erpArrivalNo && ['到货单', batch.erpArrivalNo],
    batch?.erpDeliveryNo && ['生产领料单', batch.erpDeliveryNo],
  ].filter(Boolean);

  return (
    <Modal isOpen={!!moduleId} onClose={onClose} title="模块 / 核心部件详情" size="xl">
      {!mi ? (
        <EmptyState>未找到该模块实例（可能为 ERP 尚未同步）</EmptyState>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-gray-900">{mi.sn}</span>
            <StatusBadge status={platform} />
            <span className="text-xs text-gray-400">{mt?.category || mi.category}</span>
          </div>

          <Section title="基础信息" bodyClassName="p-4">
            <DescList cols={3} items={[
              ['模块 SN / 内部 ID', mi.sn],
              ['核心部件类型', mt?.category || mi.category || '—'],
              ['规格型号', mt?.name || mi.materialName || '—'],
              ['关联物料编码', mi.materialCode || batch?.id || '—'],
              ['物料名称', mi.materialName || (batch ? `${batch.category} ${batch.model}` : '—')],
              ['供应商', mi.supplier || batch?.supplier || '—'],
              ['批次号', mi.batchNo || batch?.batchNo || '—'],
            ]} />
          </Section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section title="ERP 状态（只读同步）" subtitle="来自 ERP 主数据，平台不修改" bodyClassName="p-4">
              <DescList cols={1} items={erpItems} />
            </Section>
            <Section title="平台占用状态" subtitle="平台按绑定/换件/返修过程生成" bodyClassName="p-4">
              <DescList cols={1} items={[
                ['平台占用状态', <StatusBadge key="p" status={platform} />],
                ['当前绑定设备 SN', boundDevice ? <Link key="d" to={`/devices/${boundDevice.id}`} className="ui-link">{boundDevice.sn}</Link> : '—'],
                ['当前绑定槽位', mi.boundSlot || '—'],
                ['是否发生换件', relatedRepl.some((r) => r.removedMaterialId === mi.id) ? '是' : '否'],
                ['是否发生返修', ['旧件待返修', '已返修'].includes(platform) ? '是' : '否'],
                ['最近更新时间', mi.updatedAt || mi.bindTime || '—'],
              ]} />
            </Section>
          </div>

          <Section title="换件 / 返修记录" bodyClassName="p-0">
            {relatedRepl.length === 0 ? <EmptyState className="py-6">暂无换件 / 返修记录</EmptyState> : (
              <Table head={['换件记录编号', '售后工单号', '设备 SN', '旧件 SN', '新件 SN', '换件时间', '操作人']}>
                {relatedRepl.map((r) => {
                  const dev = devices.find((d) => d.id === r.deviceId);
                  return (
                    <tr key={r.id} className="hover:bg-[#fafafa]">
                      <td className="px-3 py-2 text-gray-700">{r.id}</td>
                      <td className="px-3 py-2 text-gray-600 text-xs"><LinkAction to="/after-sales?tab=orders">{r.workOrderId || '—'}</LinkAction></td>
                      <td className="px-3 py-2 text-gray-600 text-xs">{dev?.sn || '—'}</td>
                      <td className="px-3 py-2 text-gray-600 text-xs">{r.removedMaterialId || '—'}</td>
                      <td className="px-3 py-2 text-gray-600 text-xs">{r.addedMaterialId || '—'}</td>
                      <td className="px-3 py-2 text-gray-400 text-xs">{r.timestamp || '—'}</td>
                      <td className="px-3 py-2 text-gray-600 text-xs">{r.operator || '—'}</td>
                    </tr>
                  );
                })}
              </Table>
            )}
          </Section>

          <Section title="ERP 来源单据" subtitle="只读" bodyClassName="p-4">
            {erpDocs.length === 0 ? <div className="text-sm text-gray-400">暂无 ERP 来源单据</div> : (
              <div className="flex flex-wrap gap-2">
                {erpDocs.map(([type, no]) => (
                  <span key={no} className="inline-flex items-center gap-1.5">
                    <StatusBadge status={type} dot={false} />
                    <span className="text-[13px] text-gray-700">{no}</span>
                  </span>
                ))}
              </div>
            )}
          </Section>

          <div className="flex justify-end gap-2 pt-1">
            {boundDevice && <LinkAction to={`/devices/${boundDevice.id}`}>查看绑定设备</LinkAction>}
            <LinkAction to="/assets?tab=materials">前往核心部件追溯</LinkAction>
          </div>
        </div>
      )}
    </Modal>
  );
}
