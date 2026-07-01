import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import SecondaryTabs from '../components/SecondaryTabs';

const TABS = [
  { key: 'operation', label: '运营看板' },
  { key: 'quality', label: '质量看板' },
];

function PlaceholderBoard({ type }) {
  const { state } = useApp();
  const productionPlans = [...(state.workflowProductionPlans || []), ...(state.productionPlans || [])];
  const deliveryPlans = state.deliveryPlans || [];
  const workOrders = [...(state.productionWorkOrders || []), ...(state.deliveryWorkOrders || [])];

  const cards = type === 'operation'
    ? [
        { label: '项目总数', value: state.projects.length, color: 'border-blue-500' },
        { label: '生产计划', value: productionPlans.length, color: 'border-indigo-500' },
        { label: '交付计划', value: deliveryPlans.length, color: 'border-emerald-500' },
        { label: '在线设备', value: state.devices.filter((d) => d.status === '在线运营').length, color: 'border-teal-500' },
      ]
    : [
        { label: '生产工单', value: state.productionWorkOrders?.length || 0, color: 'border-orange-500' },
        { label: '交付工单', value: state.deliveryWorkOrders?.length || 0, color: 'border-red-500' },
        { label: '质量问题', value: state.qualityIssues?.length || 0, color: 'border-purple-500' },
        { label: '待处理', value: workOrders.filter((w) => ['待处理', '处理中'].includes(w.status)).length, color: 'border-amber-500' },
      ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{type === 'operation' ? '运营看板' : '质量看板'}</h1>
        <p className="text-sm text-gray-500 mt-1">此阶段先保留基础指标占位，后续接入趋势、预警和质量分析。</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className={`bg-white rounded shadow-sm border-l-4 ${card.color} p-5`}>
            <div className="text-3xl font-semibold text-gray-900">{card.value}</div>
            <div className="text-sm text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded shadow-sm p-8 text-center text-gray-400 text-sm">
        {type === 'operation' ? '运营趋势、项目交付风险与设备运行概况将在下一阶段补齐。' : '来料、生产、交付、售后质量指标将在下一阶段补齐。'}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'operation';
  const activeTab = TABS.some((t) => t.key === tab) ? tab : 'operation';

  return (
    <div>
      <div className="bg-white px-6 pt-5 pb-4 border-b border-gray-100">
        <SecondaryTabs tabs={TABS} activeTab={activeTab} onChange={(key) => setSearchParams({ tab: key })} />
      </div>
      <PlaceholderBoard type={activeTab} />
    </div>
  );
}
