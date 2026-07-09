// 首页（评审版）：极简展示平台定位 + 设备全生命周期工作流占位图。
// 不展示项目统计 / 待办 / 风险 / 消息动态 / 最近操作等运营数据，这些统一放到运营看板。
// 工作流为静态占位，后续替换为正式流程设计图。

const WORKFLOW = [
  '项目创建',
  '生产计划',
  '来料/领料确认',
  '整机装配',
  '质量测试',
  'ERP 入库/检验关联',
  '交付计划',
  '出厂检验',
  '现场安装调试',
  '客户验收',
  '在线运营',
  '告警 / 质量问题 / 工单闭环',
];

export default function HomePage() {
  return (
    <div className="p-6 md:p-10 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* 标题 + 一句副标题 */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">设备全生命周期质量管理平台</h1>
          <p className="text-[13px] text-gray-500 mt-1.5">
            从项目、生产、交付、资产到售后，统一追踪设备全生命周期质量状态。
          </p>
        </div>

        {/* 工作流 / 项目流程图占位卡片 */}
        <div className="bg-white rounded-lg border border-[#ececec] p-6">
          <div className="text-[13px] font-semibold text-gray-700 mb-5">设备全生命周期工作流</div>
          <div className="flex flex-wrap items-center gap-y-3">
            {WORKFLOW.map((node, i) => (
              <div key={node} className="flex items-center">
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700">
                  {node}
                </span>
                {i < WORKFLOW.length - 1 && <span className="text-gray-300 text-lg px-1.5">→</span>}
              </div>
            ))}
          </div>
        </div>

        {/* 浅色提示 */}
        <p className="text-xs text-gray-400">此处后续替换为正式流程设计图。</p>
      </div>
    </div>
  );
}
