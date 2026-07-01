import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const ENTRY_CARDS = [
  { path: '/projects', title: '项目中心', desc: '项目列表、生产计划、交付计划', color: 'border-blue-500' },
  { path: '/dashboard', title: '看板中心', desc: '运营看板与质量看板', color: 'border-emerald-500' },
  { path: '/assets', title: '资产管理', desc: '来料、设备与设备类型', color: 'border-amber-500' },
  { path: '/after-sales', title: '问题与工单', desc: '生产工单、交付工单、质量问题', color: 'border-red-500' },
];

export default function HomePage() {
  const { state } = useApp();
  const productionPlans = [...(state.workflowProductionPlans || []), ...(state.productionPlans || [])];
  const deliveryPlans = state.deliveryPlans || [];
  const activeProjects = state.projects.filter((p) => !p.voided && !['已关闭', '已作废'].includes(p.status));
  const pendingWorkOrders = [...(state.productionWorkOrders || []), ...(state.deliveryWorkOrders || [])]
    .filter((w) => ['待处理', '处理中'].includes(w.status)).length;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">设备全生命周期质量管理平台</h1>
        <p className="text-sm text-gray-500 mt-2">当前阶段聚焦项目中心、生产计划与交付计划，首页仅保留入口和基础概览。</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '项目总数', value: state.projects.length },
          { label: '进行中项目', value: activeProjects.length },
          { label: '生产计划', value: productionPlans.length },
          { label: '交付计划', value: deliveryPlans.length },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded shadow-sm p-5 border border-gray-100">
            <div className="text-3xl font-semibold text-gray-900">{item.value}</div>
            <div className="text-sm text-gray-500 mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {ENTRY_CARDS.map((card) => (
          <Link key={card.path} to={card.path} className={`bg-white rounded shadow-sm border-l-4 ${card.color} p-5 hover:shadow-md transition-shadow`}>
            <div className="font-semibold text-gray-900">{card.title}</div>
            <div className="text-xs text-gray-500 mt-2 leading-relaxed">{card.desc}</div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded shadow-sm p-5 border border-gray-100">
        <div className="text-sm font-semibold text-gray-700 mb-3">待关注</div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-500">待处理工单：</span><span className="font-semibold text-gray-900">{pendingWorkOrders}</span></div>
          <div><span className="text-gray-500">未验收交付计划：</span><span className="font-semibold text-gray-900">{deliveryPlans.filter((p) => p.status !== '已验收').length}</span></div>
          <div><span className="text-gray-500">生产中计划：</span><span className="font-semibold text-gray-900">{productionPlans.filter((p) => ['进行中', '生产中'].includes(p.status)).length}</span></div>
        </div>
      </div>
    </div>
  );
}
