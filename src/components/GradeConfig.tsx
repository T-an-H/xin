import { useState, useEffect } from 'react';
import { Settings, Save, X } from 'lucide-react';
import { useStore } from '@/store';
import { getDefaultGradeConfig } from '@/types';
import type { GradeWeightConfig } from '@/types';

interface Props {
  courseId: string;
  open: boolean;
  onClose: () => void;
}

export default function GradeConfig({ courseId, open, onClose }: Props) {
  const { gradeConfigs, saveGradeConfig } = useStore();
  const [cfg, setCfg] = useState<GradeWeightConfig>(getDefaultGradeConfig(courseId));

  useEffect(() => {
    if (open) {
      setCfg(gradeConfigs[courseId] || getDefaultGradeConfig(courseId));
    }
  }, [open, courseId, gradeConfigs]);

  const update = (key: keyof GradeWeightConfig, val: number) => {
    setCfg((prev) => ({ ...prev, [key]: Math.max(0, Math.min(100, val || 0)) }));
  };

  const mainTotal = cfg.regularWeight + cfg.midtermWeight + cfg.finalWeight;
  const regularTotal = cfg.selfEvalWeight + cfg.peerReviewWeight + cfg.interGroupEvalWeight + cfg.teacherScoreWeight + cfg.mentorScoreWeight;
  const midtermSubTotal = cfg.midtermExamWeight + cfg.midtermProjectWeight;
  const finalSubTotal = cfg.finalExamWeight + cfg.finalProjectWeight;

  const handleSave = () => {
    saveGradeConfig({ ...cfg, courseId });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">成绩权重配置</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 总成绩权重 */}
          <Section title="总成绩权重" hint={`合计：${mainTotal}%${mainTotal !== 100 ? '（须等于 100%）' : ''}`} valid={mainTotal === 100}>
            <Slider label="平时成绩" val={cfg.regularWeight} onChange={(v) => update('regularWeight', v)} />
            <Slider label="期中成绩" val={cfg.midtermWeight} onChange={(v) => update('midtermWeight', v)} />
            <Slider label="期末成绩" val={cfg.finalWeight} onChange={(v) => update('finalWeight', v)} />
          </Section>

          {/* 平时成绩构成 */}
          <Section title="平时成绩构成" hint={`合计：${regularTotal}%${regularTotal !== 100 ? '（须等于 100%）' : ''}`} valid={regularTotal === 100}>
            <Slider label="自评" val={cfg.selfEvalWeight} onChange={(v) => update('selfEvalWeight', v)} />
            <Slider label="组内互评" val={cfg.peerReviewWeight} onChange={(v) => update('peerReviewWeight', v)} />
            <Slider label="组间互评" val={cfg.interGroupEvalWeight} onChange={(v) => update('interGroupEvalWeight', v)} />
            <Slider label="教师评价" val={cfg.teacherScoreWeight} onChange={(v) => update('teacherScoreWeight', v)} />
            <Slider label="企业导师评价" val={cfg.mentorScoreWeight} onChange={(v) => update('mentorScoreWeight', v)} />
          </Section>

          {/* 期中成绩构成 */}
          <Section title="期中成绩构成" hint={`合计：${midtermSubTotal}%${midtermSubTotal !== 100 ? '（须等于 100%）' : ''}`} valid={midtermSubTotal === 100}>
            <Slider label="期中考试" val={cfg.midtermExamWeight} onChange={(v) => update('midtermExamWeight', v)} />
            <Slider label="项目成绩" val={cfg.midtermProjectWeight} onChange={(v) => update('midtermProjectWeight', v)} />
          </Section>

          {/* 期末成绩构成 */}
          <Section title="期末成绩构成" hint={`合计：${finalSubTotal}%${finalSubTotal !== 100 ? '（须等于 100%）' : ''}`} valid={finalSubTotal === 100}>
            <Slider label="期末测试" val={cfg.finalExamWeight} onChange={(v) => update('finalExamWeight', v)} />
            <Slider label="项目成绩" val={cfg.finalProjectWeight} onChange={(v) => update('finalProjectWeight', v)} />
          </Section>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors text-sm font-medium">取消</button>
          <button onClick={handleSave} disabled={mainTotal !== 100 || regularTotal !== 100 || midtermSubTotal !== 100 || finalSubTotal !== 100}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded-lg transition-colors text-sm font-medium">
            <Save className="w-4 h-4" /> 保存配置
          </button>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, val, onChange }: { label: string; val: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 w-28 flex-shrink-0">{label}</span>
      <input type="range" min="0" max="100" value={val} onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-amber-500" />
      <input type="number" min="0" max="100" value={val} onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 px-2 py-1 rounded border border-gray-200 focus:border-amber-500 outline-none text-sm text-center" />
      <span className="text-sm text-gray-400 w-4">%</span>
    </div>
  );
}

function Section({ title, hint, valid, children }: { title: string; hint: string; valid: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <span className={`text-xs ${valid ? 'text-emerald-500' : 'text-red-400'}`}>{hint}</span>
      </div>
      <div className="space-y-2 pl-2">{children}</div>
    </div>
  );
}
