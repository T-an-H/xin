import { X } from 'lucide-react';
import type { DetailedGrade, GradeWeightConfig } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  studentName: string;
  courseTitle: string;
  detail: DetailedGrade | null;
  cfg: GradeWeightConfig;
  totalScore: number;
}

function wAvg(subScores: { score: number | undefined; weight: number }[]): number {
  const total = subScores.reduce((s, item) => s + (item.score ?? 0) * item.weight, 0);
  return Math.round(total * 100) / 100;
}

export default function ScoreDetail({ open, onClose, studentName, courseTitle, detail, cfg, totalScore }: Props) {
  if (!open) return null;

  const regularSubs = [
    { score: detail?.selfEvalScore, weight: cfg.selfEvalWeight, label: '自评' },
    { score: detail?.peerReviewScore, weight: cfg.peerReviewWeight, label: '组内互评' },
    { score: detail?.interGroupScore, weight: cfg.interGroupEvalWeight, label: '组间互评' },
    { score: detail?.teacherScore, weight: cfg.teacherScoreWeight, label: '教师评价' },
    { score: detail?.mentorScore, weight: cfg.mentorScoreWeight, label: '企业导师评价' },
  ];
  const midtermSubs = [
    { score: detail?.midtermExamScore, weight: cfg.midtermExamWeight, label: '期中考试' },
    { score: detail?.midtermProjectScore, weight: cfg.midtermProjectWeight, label: '项目成绩(期中)' },
  ];
  const finalSubs = [
    { score: detail?.finalExamScore, weight: cfg.finalExamWeight, label: '期末测试' },
    { score: detail?.finalProjectScore, weight: cfg.finalProjectWeight, label: '项目成绩(期末)' },
  ];

  const regularScore = wAvg(regularSubs);
  const midtermScore = wAvg(midtermSubs);
  const finalScore = wAvg(finalSubs);

  const regularContrib = regularScore * cfg.regularWeight / 100;
  const midtermContrib = midtermScore * cfg.midtermWeight / 100;
  const finalContrib = finalScore * cfg.finalWeight / 100;

  const hasDetail = detail && Object.values(regularSubs).some((s) => s.score !== undefined);
  const noMidterm = cfg.midtermWeight === 0;
  const noFinal = cfg.finalWeight === 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* 顶部 */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{studentName}</h2>
            <p className="text-sm text-gray-400">{courseTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {!hasDetail && (
            <div className="text-center py-8 text-gray-400 text-sm">暂无分项成绩数据</div>
          )}

          {hasDetail && (
            <>
              {/* ── 平时成绩 ── */}
              <SectionCalc
                title="平时成绩"
                weight={cfg.regularWeight}
                score={regularScore}
                contribution={regularContrib}
                items={regularSubs}
              />

              {/* ── 期中成绩 ── */}
              {cfg.midtermWeight > 0 && (
                <SectionCalc
                  title="期中成绩"
                  weight={cfg.midtermWeight}
                  score={midtermScore}
                  contribution={midtermContrib}
                  items={midtermSubs}
                />
              )}

              {/* ── 期末成绩 ── */}
              {cfg.finalWeight > 0 && (
                <SectionCalc
                  title="期末成绩"
                  weight={cfg.finalWeight}
                  score={finalScore}
                  contribution={finalContrib}
                  items={finalSubs}
                />
              )}

              {/* ── 总计行 ── */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">最终成绩</span>
                  <span className="text-2xl font-bold text-gray-900">{totalScore}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {regularScore}×{cfg.regularWeight}% {cfg.midtermWeight > 0 ? `+ ${midtermScore}×${cfg.midtermWeight}%` : ''} {cfg.finalWeight > 0 ? `+ ${finalScore}×${cfg.finalWeight}%` : ''}
                  {' = '}
                  {regularContrib.toFixed(1)}{cfg.midtermWeight > 0 ? ` + ${midtermContrib.toFixed(1)}` : ''}{cfg.finalWeight > 0 ? ` + ${finalContrib.toFixed(1)}` : ''}
                  {' = '}
                  <span className="font-semibold">{totalScore}</span>
                </p>
              </div>
            </>
          )}

          {/* 权重摘要 */}
          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
            <p><span className="font-medium">权重配置：</span>平时 {cfg.regularWeight}% + 期中 {cfg.midtermWeight}% + 期末 {cfg.finalWeight}%</p>
            {cfg.regularWeight > 0 && (
              <p>平时构成：自评 {cfg.selfEvalWeight}% · 组内互评 {cfg.peerReviewWeight}% · 组间互评 {cfg.interGroupEvalWeight}% · 教师 {cfg.teacherScoreWeight}% · 企业导师 {cfg.mentorScoreWeight}%</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCalc({ title, weight, score, contribution, items }: {
  title: string; weight: number; score: number; contribution: number;
  items: { score: number | undefined; weight: number; label: string }[];
}) {
  const barPercent = Math.min(score, 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-800">{title} <span className="text-xs text-gray-400 font-normal">(权重 {weight}%)</span></h3>
        <span className="text-lg font-bold text-gray-900">{score}</span>
      </div>

      {/* 子项列表 */}
      <div className="space-y-1.5 mb-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20 flex-shrink-0">{item.label} ({item.weight}%)</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(item.score ?? 0)}%`, backgroundColor: item.score != null ? '#f59e0b' : '#e5e7eb' }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700 w-8 text-right">{item.score ?? '-'}</span>
          </div>
        ))}
      </div>

      {/* 贡献值 */}
      <p className="text-xs text-gray-400">
        {score} × {weight}% = {contribution.toFixed(1)} 分
        {weight > 0 && (
          <span className="text-gray-300">（贡献至总分）</span>
        )}
      </p>
    </div>
  );
}
