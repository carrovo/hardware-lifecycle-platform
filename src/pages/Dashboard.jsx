import { useApp } from '../context/AppContext';

const SPARKLINES = {
  '来料检验': [86, 88, 85, 90, 89, 91, 87],
  '功能测试': [75, 80, 78, 83, 80, 85, 83],
  '老化测试': [88, 85, 90, 87, 92, 88, 91],
  '终测':     [92, 94, 91, 95, 93, 96, 95],
};

const WEEK_DELTA = {
  '来料检验': -1,
  '功能测试': +5,
  '老化测试': +3,
  '终测':     +2,
};

function MiniSparkline({ data, color = '#475569' }) {
  const W = 80, H = 30, PAD = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
      const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DonutChart({ rate }) {
  const r = 16, cx = 20, cy = 20;
  const circ = 2 * Math.PI * r;
  const filled = (Math.min(rate, 100) / 100) * circ;
  const color = rate >= 90 ? '#16a34a' : rate >= 70 ? '#d97706' : '#dc2626';
  return (
    <svg width={40} height={40} viewBox="0 0 40 40">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={4} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={9} fontWeight="600" fill={color}>{rate}%</text>
    </svg>
  );
}

function KPICard({ label, value, trend, trendLabel }) {
  const isUp = trend > 0;
  const isDown = trend < 0;
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
      <div className="text-4xl font-semibold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1 mb-3">{label}</div>
      <div className={`flex items-center gap-1 text-sm font-medium ${isUp ? 'text-green-600' : isDown ? 'text-red-500' : 'text-gray-400'}`}>
        <span className="text-base">{isUp ? '↑' : isDown ? '↓' : '→'}</span>
        <span>较昨日 {trend > 0 ? `+${trend}` : trend}</span>
        {trendLabel && <span className="text-gray-400 font-normal ml-1">{trendLabel}</span>}
      </div>
    </div>
  );
}

function QualityCard({ stage, rate, delta }) {
  const isUp = delta > 0;
  const isDown = delta < 0;
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 mb-1">{stage}</div>
        <div className="flex items-end gap-1">
          <DonutChart rate={rate} />
          <div className="text-3xl font-semibold text-gray-900 leading-none pb-1">{rate}<span className="text-lg text-gray-400">%</span></div>
        </div>
        <div className={`text-xs mt-2 flex items-center gap-0.5 font-medium ${isUp ? 'text-green-600' : isDown ? 'text-red-500' : 'text-gray-400'}`}>
          <span>{isUp ? '↑' : isDown ? '↓' : '→'}</span>
          <span>较上周 {delta > 0 ? `+${delta}pt` : delta === 0 ? '持平' : `${delta}pt`}</span>
        </div>
      </div>
      <MiniSparkline data={SPARKLINES[stage]} color={delta >= 0 ? '#475569' : '#ef4444'} />
    </div>
  );
}

const WIP_STAGES = [
  { key: '装配中',    color: 'bg-blue-400',   label: '装配中' },
  { key: '功能测试中', color: 'bg-violet-400', label: '功能测试' },
  { key: '老化测试中', color: 'bg-amber-400',  label: '老化测试' },
  { key: '终测中',    color: 'bg-orange-400',  label: '终测' },
  { key: '待分配项目', color: 'bg-green-400',  label: '待分配' },
];

export default function Dashboard() {
  const { state } = useApp();
  const { materials, devices, testRecords } = state;

  const readyToAssign = devices.filter((d) => d.status === '待分配项目').length;

  const funcPassed  = testRecords.filter((t) => t.testType === '功能测试' && t.result === '合格').length;
  const funcTotal   = testRecords.filter((t) => t.testType === '功能测试').length;
  const burnPassed  = testRecords.filter((t) => t.testType === '老化测试' && t.result === '合格').length;
  const burnTotal   = testRecords.filter((t) => t.testType === '老化测试').length;
  const finalPassed = testRecords.filter((t) => t.testType === '终测' && t.result === '合格').length;
  const finalTotal  = testRecords.filter((t) => t.testType === '终测').length;
  const inspPassed  = materials.filter((m) => m.inspectionResult === '合格' || m.inspectionResult === '特批使用').length;
  const inspTotal   = materials.length;

  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

  const qualityStages = [
    { stage: '来料检验', rate: pct(inspPassed, inspTotal),   delta: WEEK_DELTA['来料检验'] },
    { stage: '功能测试', rate: pct(funcPassed, funcTotal),   delta: WEEK_DELTA['功能测试'] },
    { stage: '老化测试', rate: pct(burnPassed, burnTotal),   delta: WEEK_DELTA['老化测试'] },
    { stage: '终测',     rate: pct(finalPassed, finalTotal), delta: WEEK_DELTA['终测'] },
  ];

  const wipCounts = {};
  WIP_STAGES.forEach((s) => { wipCounts[s.key] = 0; });
  devices.forEach((d) => { if (wipCounts[d.status] !== undefined) wipCounts[d.status]++; });
  const wipTotal = Object.values(wipCounts).reduce((a, b) => a + b, 0) || 1;

  const anomalies = testRecords.filter((t) => t.result === '不合格');
  const stuckDevices = devices.filter((d) =>
    ['功能测试中', '老化测试中', '终测中', '装配中'].includes(d.status)
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">生产看板</h1>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="今日来料" value={8} trend={3} />
        <KPICard label="今日装配完成" value={3} trend={1} />
        <KPICard label="今日测试通过" value={5} trend={-2} />
        <KPICard label="待分配设备" value={readyToAssign} trend={2} trendLabel="可调拨" />
      </div>

      {/* Quality + Alerts Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">各环节质量指标</h2>
          <div className="grid grid-cols-2 gap-3">
            {qualityStages.map((q) => (
              <QualityCard key={q.stage} {...q} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">需要关注</h2>
          {anomalies.length > 0 || stuckDevices.length > 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-bold text-2xl">{anomalies.length}</span>
                <span className="text-sm text-red-700">条不合格记录</span>
              </div>
              <div>
                <div className="text-xs font-semibold text-red-700 mb-2">⚠ 滞留设备</div>
                <div className="space-y-1.5">
                  {stuckDevices.slice(0, 5).map((d) => (
                    <div key={d.id} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-gray-700 truncate">{d.sn}</span>
                      <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs border border-orange-200 whitespace-nowrap">
                        {d.status}
                      </span>
                    </div>
                  ))}
                  {stuckDevices.length > 5 && (
                    <div className="text-xs text-red-400">…另{stuckDevices.length - 5}台</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2 text-green-700">
              <span className="text-xl">✓</span>
              <span className="text-sm font-medium">一切正常</span>
            </div>
          )}

          {/* Inventory summary */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <div className="text-xs font-semibold text-gray-600 mb-3">物料库存快览</div>
            {Object.entries(
              materials.reduce((acc, m) => {
                acc[m.category] = (acc[m.category] || 0) + (m.status === '待装配' ? 1 : 0);
                return acc;
              }, {})
            ).map(([cat, cnt]) => (
              <div key={cat} className="flex justify-between text-xs py-0.5">
                <span className="text-gray-600">{cat}</span>
                <span className="font-semibold text-gray-800">{cnt} 待装配</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WIP Pipeline Bar */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">在制品流向分布</h2>
        <div className="flex h-10 rounded-full overflow-hidden gap-px">
          {WIP_STAGES.map((s) => {
            const count = wipCounts[s.key];
            const pctW = Math.round((count / wipTotal) * 100);
            if (pctW === 0) return null;
            return (
              <div
                key={s.key}
                className={`${s.color} flex items-center justify-center text-white text-xs font-medium transition-all`}
                style={{ width: `${pctW}%` }}
                title={`${s.label}: ${count}台`}
              >
                {pctW > 12 ? `${s.label} ${count}` : count}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-4 mt-3">
          {WIP_STAGES.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
              <span>{s.label}</span>
              <span className="font-medium text-gray-700">{wipCounts[s.key]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
