import { Link } from 'react-router-dom';
import { useRole } from '../context/RoleContext';

const LIFECYCLE_STEPS = [
  '来料管理', '整机装配', '质量测试', '整机入库', '出厂检验', '现场调试', '客户验收', '在线运营',
];

const MODULE_CARDS = [
  {
    path: '/dashboard',
    name: '运营看板',
    desc: '实时监控在线设备健康状态、告警与运营数据',
    color: 'border-blue-500',
    iconBg: 'bg-blue-100',
    icon: '📊',
  },
  {
    path: '/projects',
    name: '项目中心',
    desc: '管理生产计划、交付计划，查看质量看板与项目进度',
    color: 'border-emerald-500',
    iconBg: 'bg-emerald-100',
    icon: '🏭',
  },
  {
    path: '/assets',
    name: '资产管理',
    desc: '追踪来料批次与设备全生命周期，管理设备类型与模块',
    color: 'border-amber-500',
    iconBg: 'bg-amber-100',
    icon: '📦',
  },
  {
    path: '/after-sales',
    name: '售后管理',
    desc: '处理生产与交付工单，记录维修与售后服务全流程',
    color: 'border-red-500',
    iconBg: 'bg-red-100',
    icon: '🔧',
  },
  {
    path: '/system',
    name: '系统管理',
    desc: '配置角色权限、设备标签字典与系统通知推送',
    color: 'border-purple-500',
    iconBg: 'bg-purple-100',
    icon: '⚙️',
  },
];

export default function HomePage() {
  const { canSeeNav } = useRole();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">硬件全生命周期管理平台</h1>
        <p className="text-gray-500 text-base">全流程数字化追踪与管理 · 智平方机器人</p>
      </div>

      {/* Lifecycle Flow */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">硬件生命周期流程</h2>
        <div className="overflow-x-auto">
          <div className="flex items-center flex-nowrap gap-1.5 min-w-max">
            {LIFECYCLE_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-xs text-gray-700 whitespace-nowrap">{step}</span>
                </div>
                {i < LIFECYCLE_STEPS.length - 1 && (
                  <span className="text-gray-300 text-sm">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div className="mt-8">
        <h2 className="text-sm font-medium text-gray-500 mb-4">功能模块</h2>
        <div className="grid grid-cols-3 gap-4">
          {MODULE_CARDS.slice(0, 3).map((card) => (
            <Link
              key={card.path}
              to={card.path}
              className={`bg-white rounded-xl shadow-sm border-l-4 ${card.color} p-5 h-[140px] flex items-start gap-4 group hover:-translate-y-0.5 transition-transform`}
            >
              <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center text-xl flex-shrink-0`}>
                {card.icon}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-gray-800 group-hover:text-slate-600 mb-1">{card.name}</div>
                <div className="text-xs text-gray-500 leading-relaxed line-clamp-2">{card.desc}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {MODULE_CARDS.slice(3).map((card) => (
            <Link
              key={card.path}
              to={card.path}
              className={`bg-white rounded-xl shadow-sm border-l-4 ${card.color} p-5 h-[140px] flex items-start gap-4 group hover:-translate-y-0.5 transition-transform`}
            >
              <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center text-xl flex-shrink-0`}>
                {card.icon}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-gray-800 group-hover:text-slate-600 mb-1">{card.name}</div>
                <div className="text-xs text-gray-500 leading-relaxed line-clamp-2">{card.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
