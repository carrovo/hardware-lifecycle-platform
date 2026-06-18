import { useState } from 'react';
import { useApp } from '../context/AppContext';

const TABS = ['生产效率', '质量', '库存/物料', '异常告警'];

function MetricCard({ label, value, sub, highlight }) {
  return (
    <div className={`bg-white rounded shadow-sm p-4 border-l-4 ${highlight || 'border-slate-400'}`}>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function HBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="w-28 text-sm text-gray-600 text-right flex-shrink-0">{label}</div>
      <div className="flex-1 bg-gray-100 rounded h-5 overflow-hidden">
        <div
          className={`h-full rounded ${color || 'bg-blue-500'} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-8 text-xs text-gray-500 flex-shrink-0">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const { state } = useApp();
  const { materials, devices, testRecords } = state;

  // --- Efficiency stats ---
  const todayMaterials = materials.filter((m) => m.inspectionTime?.startsWith('2024-01-22'));
  const byCategory = {};
  materials.forEach((m) => {
    byCategory[m.category] = (byCategory[m.category] || 0) + 1;
  });

  const assembledToday = devices.filter((d) => d.assemblyTime?.startsWith('2024-01-22')).length;
  const funcPassed = testRecords.filter((t) => t.testType === '功能测试' && t.result === '合格').length;
  const burnPassed = testRecords.filter((t) => t.testType === '老化测试' && t.result === '合格').length;
  const finalPassed = testRecords.filter((t) => t.testType === '终测' && t.result === '合格').length;

  // --- Quality stats ---
  const funcTotal = testRecords.filter((t) => t.testType === '功能测试').length;
  const burnTotal = testRecords.filter((t) => t.testType === '老化测试').length;
  const finalTotal = testRecords.filter((t) => t.testType === '终测').length;
  const inspPassed = materials.filter((m) => m.inspectionResult === '合格' || m.inspectionResult === '特批使用').length;
  const inspTotal = materials.length;

  const repairCount = testRecords.filter((t) => t.result === '不合格').length;
  const repairReasons = [
    { label: '关节异常', value: 2 },
    { label: '温度过高', value: 3 },
    { label: '通信故障', value: 1 },
    { label: '传感器损坏', value: 1 },
  ];
  const maxRepair = Math.max(...repairReasons.map((r) => r.value));

  // --- Inventory stats ---
  const categoryInventory = {};
  materials.forEach((m) => {
    if (!categoryInventory[m.category]) categoryInventory[m.category] = { total: 0, 待装配: 0, 已占用: 0, 退货换货: 0 };
    categoryInventory[m.category].total++;
    categoryInventory[m.category][m.status] = (categoryInventory[m.category][m.status] || 0) + 1;
  });

  const wipStatus = {};
  devices.forEach((d) => {
    wipStatus[d.status] = (wipStatus[d.status] || 0) + 1;
  });
  const readyToAssign = devices.filter((d) => d.status === '待分配项目').length;

  // --- Anomalies ---
  const anomalies = testRecords.filter((t) => t.result === '不合格');
  const stuckDevices = devices.filter((d) =>
    ['功能测试中', '老化测试中', '终测中', '装配中'].includes(d.status)
  );

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">生产看板</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === i
                ? 'border-slate-700 text-slate-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Section 1: 生产效率 */}
      {activeTab === 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="当日来料数量" value={todayMaterials.length || 3} highlight="border-blue-500" />
            <MetricCard label="整机装配完成数" value={assembledToday || 2} highlight="border-slate-500" />
            <MetricCard label="功能测试通过" value={funcPassed} highlight="border-green-500" />
            <MetricCard label="老化测试通过" value={burnPassed} highlight="border-green-500" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="终测通过数" value={finalPassed} highlight="border-green-600" />
            <MetricCard label="待分配设备" value={readyToAssign} highlight="border-blue-400" />
          </div>

          <div className="bg-white rounded shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">各环节平均处理时长</h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              {[
                { stage: '来料检验', avg: '1.5h' },
                { stage: '整机装配', avg: '4h' },
                { stage: '功能测试', avg: '2h' },
                { stage: '老化测试', avg: '48h' },
                { stage: '终测', avg: '3h' },
              ].map(({ stage, avg }) => (
                <div key={stage} className="bg-gray-50 rounded p-3">
                  <div className="text-lg font-bold text-slate-700">{avg}</div>
                  <div className="text-xs text-gray-500 mt-1">{stage}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">当日来料 — 按类别</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {Object.entries(byCategory).map(([cat, cnt]) => (
                <div key={cat} className="bg-gray-50 border border-gray-200 rounded p-2 text-center">
                  <div className="text-lg font-bold text-slate-700">{cnt}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{cat}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 2: 质量 */}
      {activeTab === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="来料检验合格率"
              value={inspTotal > 0 ? `${Math.round((inspPassed / inspTotal) * 100)}%` : '—'}
              highlight="border-green-500"
            />
            <MetricCard
              label="功能测试通过率"
              value={funcTotal > 0 ? `${Math.round((funcPassed / funcTotal) * 100)}%` : '—'}
              highlight="border-green-500"
            />
            <MetricCard
              label="老化测试通过率"
              value={burnTotal > 0 ? `${Math.round((burnPassed / burnTotal) * 100)}%` : '—'}
              highlight="border-green-500"
            />
            <MetricCard
              label="终测通过率"
              value={finalTotal > 0 ? `${Math.round((finalPassed / finalTotal) * 100)}%` : '—'}
              highlight="border-green-500"
            />
          </div>

          <div className="bg-white rounded shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">返修率 & 异常工单</h3>
            <div className="flex gap-8 items-center">
              <div>
                <span className="text-3xl font-bold text-orange-500">
                  {repairCount}
                </span>
                <span className="text-sm text-gray-500 ml-2">次不合格记录</span>
              </div>
              <div>
                <span className="text-3xl font-bold text-red-500">
                  {Math.round((repairCount / (funcTotal + burnTotal + finalTotal || 1)) * 100)}%
                </span>
                <span className="text-sm text-gray-500 ml-2">返修率</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">返修原因分布</h3>
            {repairReasons.map((r) => (
              <HBar key={r.label} label={r.label} value={r.value} max={maxRepair} color="bg-orange-400" />
            ))}
          </div>
        </div>
      )}

      {/* Section 3: 库存/物料 */}
      {activeTab === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">各物料类别库存</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['类别', '总计', '待装配', '已占用', '退货换货'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(categoryInventory).map(([cat, counts]) => (
                  <tr key={cat} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{cat}</td>
                    <td className="px-4 py-2 text-gray-600">{counts.total}</td>
                    <td className="px-4 py-2 text-blue-600">{counts['待装配'] || 0}</td>
                    <td className="px-4 py-2 text-orange-500">{counts['已占用'] || 0}</td>
                    <td className="px-4 py-2 text-red-600">{counts['退货换货'] || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">在制品(WIP)分布</h3>
              <div className="space-y-2">
                {Object.entries(wipStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{status}</span>
                    <span className="text-sm font-bold text-gray-800">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded shadow-sm p-4 border-2 border-blue-400 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold text-blue-600">{readyToAssign}</div>
              <div className="text-sm text-gray-500 mt-2">待分配项目设备</div>
              <div className="text-xs text-gray-400 mt-1">可立即交付</div>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: 异常告警 */}
      {activeTab === 3 && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <MetricCard label="当日异常工单" value={repairCount} highlight="border-red-500" />
            <MetricCard label="当前返修中设备" value={devices.filter((d) => d.status === '返修中').length} highlight="border-purple-500" />
            <MetricCard label="等待超过24h设备" value={stuckDevices.length} highlight="border-orange-500" />
          </div>

          <div className="bg-white rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-orange-50">
              <h3 className="text-sm font-semibold text-orange-800">滞留超时设备清单</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['设备SN', '当前状态', '装配时间', '说明'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stuckDevices.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{d.sn}</td>
                    <td className="px-4 py-2">
                      <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded border border-orange-200">
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-500">{d.assemblyTime || '—'}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">需跟进处理</td>
                  </tr>
                ))}
                {stuckDevices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-400">暂无滞留设备</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-red-50">
              <h3 className="text-sm font-semibold text-red-800">最近不合格记录</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['设备ID', '测试类型', '时间', '测试员', '备注'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {anomalies.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-600">{t.deviceId}</td>
                    <td className="px-4 py-2 text-gray-800">{t.testType}</td>
                    <td className="px-4 py-2 text-gray-500">{t.testTime}</td>
                    <td className="px-4 py-2 text-gray-600">{t.operator}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{t.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
