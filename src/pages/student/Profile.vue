<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">个人画像</h1>
      <p class="text-gray-500 mt-1">查看个人信息与学习能力分析</p>
    </div>

    <!-- 个人信息卡片 -->
    <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <div class="flex items-start gap-6">
        <div class="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <span class="text-2xl font-bold text-blue-600">{{ student?.name?.charAt(0) || '?' }}</span>
        </div>
        <div class="flex-1">
          <h2 class="text-xl font-bold text-gray-900">{{ student?.name || store.currentUser || '未知用户' }}</h2>
          <div class="grid grid-cols-2 gap-x-8 gap-y-2 mt-3">
            <span class="flex items-center gap-2 text-sm text-gray-500"><Mail class="w-4 h-4" /> {{ student?.email || '未设置' }}</span>
            <span class="flex items-center gap-2 text-sm text-gray-500"><Phone class="w-4 h-4" /> {{ student?.phone || '未设置' }}</span>
            <span class="flex items-center gap-2 text-sm text-gray-500"><Calendar class="w-4 h-4" /> 入学时间：{{ student?.joinDate || '未知' }}</span>
            <span class="flex items-center gap-2 text-sm text-gray-500"><User class="w-4 h-4" /> 学号：{{ student?.id || '未知' }}</span>
          </div>
        </div>
        <div class="flex gap-6">
          <div class="text-center px-4 py-3 bg-blue-50 rounded-lg">
            <p class="text-2xl font-bold text-blue-600">{{ myEnrollments.length }}</p>
            <p class="text-xs text-gray-500 mt-1">已报名</p>
          </div>
          <div class="text-center px-4 py-3 bg-emerald-50 rounded-lg">
            <p class="text-2xl font-bold text-emerald-600">{{ completed }}</p>
            <p class="text-xs text-gray-500 mt-1">已完成</p>
          </div>
          <div class="text-center px-4 py-3 bg-amber-50 rounded-lg">
            <p class="text-2xl font-bold text-amber-600">{{ avgScore }}</p>
            <p class="text-xs text-gray-500 mt-1">平均分</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 能力雷达图 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 class="w-5 h-5 text-blue-500" /> 课程成绩雷达图
        </h3>
        <div v-if="radarData.length > 0" class="relative w-80 h-80 mx-auto cursor-pointer" @click="showDetailModal = true">
          <svg viewBox="-120 -120 440 440" class="w-full h-full">
            <polygon v-for="level in 5" :key="level" :points="gridPoints(level)" fill="none" stroke="#e2e8f0" stroke-width="1" />
            <line v-for="(_, i) in radarData" :key="'axis-' + i" :x1="100" :y1="100" :x2="axisEndX(i)" :y2="axisEndY(i)" stroke="#e2e8f0" stroke-width="1" />
            <polygon :points="dataPolygonPoints" fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" stroke-width="2" />
            <g v-for="(d, i) in radarData" :key="'point-' + i">
              <circle :cx="dataPointX(i)" :cy="dataPointY(i)" r="4" fill="#3b82f6" />
              <text :x="dataLabelX(i)" :y="dataLabelY(i)" :text-anchor="dataLabelAnchor(i)" font-size="9" fill="#64748b">
                {{ d.label }}
              </text>
              <text :x="dataLabelX(i)" :y="dataLabelY(i) + 12" :text-anchor="dataLabelAnchor(i)" font-size="9" fill="#3b82f6" font-weight="bold">
                {{ d.value }}分
              </text>
            </g>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
            <span class="text-white font-medium text-sm bg-blue-600 px-3 py-1 rounded-full shadow-lg">点击查看详情</span>
          </div>
        </div>
        <p v-else class="text-gray-400 text-center py-12">暂无平时成绩数据<br />完成课程评价后将生成能力雷达图</p>
      </div>

      <!-- 学习统计 -->
      <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp class="w-5 h-5 text-emerald-500" /> 学习统计
        </h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-sm text-gray-600">学习中课程</span>
            <span class="font-semibold text-gray-900">{{ inProgress }} 门</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-sm text-gray-600">已完成课程</span>
            <span class="font-semibold text-emerald-600">{{ completed }} 门</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-sm text-gray-600">总学分</span>
            <span class="font-semibold text-blue-600">{{ totalCredits }} 学分</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-sm text-gray-600">平均成绩</span>
            <span class="font-semibold text-amber-600">{{ avgScore }} 分</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-sm text-gray-600">平均进度</span>
            <span class="font-semibold text-gray-900">{{ avgProgress }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习轨迹 -->
    <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <BookOpen class="w-5 h-5 text-purple-500" /> 学习轨迹
      </h3>
      <div class="relative">
        <div v-for="(enr, index) in myEnrollments" :key="enr.id" class="flex gap-4 pb-6 relative">
          <div v-if="index < myEnrollments.length - 1" class="absolute left-[7px] top-4 bottom-0 w-0.5 bg-blue-200" />
          <div :class="`w-4 h-4 rounded-full mt-1 flex-shrink-0 ${
            enr.status === 'completed' ? 'bg-emerald-500' :
            enr.status === 'in_progress' ? 'bg-amber-500' : 'bg-blue-500'
          }`" />
          <div class="flex-1">
            <p class="font-medium text-gray-900">{{ getCourse(enr.courseId)?.title || '未知课程' }}</p>
            <p class="text-sm text-gray-500">
              {{ enr.enrollDate }} · 进度 {{ enr.progress }}% · 
              {{ enr.status === 'completed' ? ' 已完成' : enr.status === 'in_progress' ? ' 学习中' : ' 已报名' }}
            </p>
          </div>
        </div>
        <p v-if="myEnrollments.length === 0" class="text-gray-400 text-center py-4">暂无学习记录</p>
      </div>
    </div>
  </div>

  <!-- 详情弹窗 -->
  <Teleport to="body">
    <div v-if="showDetailModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="showDetailModal = false" />
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div class="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 class="w-6 h-6 text-blue-500" /> 能力分析详情
          </h3>
          <button @click="showDetailModal = false" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <!-- 能力综合分析 - 顶部长条 -->
          <div class="mb-6 p-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Sparkles class="w-5 h-5 text-white" />
              </div>
              <div class="flex-1">
                <h5 class="font-semibold text-white mb-2">能力综合分析</h5>
                <p class="text-white/90 text-sm leading-relaxed">{{ abilityAnalysis }}</p>
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 课程分析 -->
            <div>
              <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen class="w-5 h-5 text-purple-500" /> 课程分析
              </h4>
              <div class="space-y-4">
                <div v-for="(data, index) in radarData" :key="index" class="p-4 bg-gray-50 rounded-lg">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-medium text-gray-900">{{ data.label }}</span>
                    <span class="text-lg font-bold text-blue-600">{{ data.value }}分</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full" :style="{ width: data.value + '%' }"></div>
                  </div>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <span class="px-2 py-1 text-xs rounded-full" :class="getScoreClass(data.value)">
                      {{ getScoreText(data.value) }}
                    </span>
                    <span class="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
                      {{ getCourseDetail(data.label) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 职业推荐 -->
            <div>
              <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles class="w-5 h-5 text-indigo-500" /> 职业推荐
              </h4>
              <div class="space-y-4">
                <div v-for="(rec, index) in careerRecommendations" :key="index" class="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg">
                  <div class="flex items-center gap-2 mb-2">
                    <component :is="rec.icon" class="w-5 h-5 text-indigo-600" />
                    <span class="font-semibold text-gray-900">{{ rec.title }}</span>
                    <span class="ml-auto text-sm font-bold text-indigo-600">{{ rec.matchScore }}%</span>
                  </div>
                  <p class="text-sm text-gray-600 mb-3">{{ rec.description }}</p>
                  <div class="flex flex-wrap gap-1">
                    <span v-for="tag in rec.tags" :key="tag" class="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full">{{ tag }}</span>
                  </div>
                </div>
              </div>
              
              <div v-if="careerRecommendations.length === 0" class="text-gray-400 text-center py-8">
                完成课程评价后，系统将生成职业推荐
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { User, Mail, Phone, Calendar, BookOpen, Award, TrendingUp, BarChart3, Sparkles, LineChart, Cpu } from 'lucide-vue-next'

const store = useAppStore()
const student = computed(() => store.students.find((s) => s.name === store.currentUser))
const myEnrollments = computed(() => (student.value ? store.enrollments.filter((e) => e.studentId === student.value!.id) : []))
const myGrades = computed(() => (student.value ? store.grades.filter((g) => g.studentId === student.value!.id) : []))

const completed = computed(() => myEnrollments.value.filter((e) => e.status === 'completed').length)
const inProgress = computed(() => myEnrollments.value.filter((e) => e.status === 'in_progress').length)

const avgScore = computed(() => {
  if (myGrades.value.length === 0) return 0
  return Math.round(myGrades.value.reduce((s, g) => s + g.score, 0) / myGrades.value.length)
})

const totalCredits = computed(() => {
  return myEnrollments.value.reduce((sum, e) => {
    const course = store.courses.find((c) => c.id === e.courseId)
    return sum + (course ? Math.round(course.duration / 8) : 0)
  }, 0)
})

const avgProgress = computed(() => {
  if (myEnrollments.value.length === 0) return 0
  return Math.round(myEnrollments.value.reduce((s, e) => s + e.progress, 0) / myEnrollments.value.length)
})

const getCourse = (id: string) => store.courses.find((c) => c.id === id)

const radarData = computed(() => {
  const result: { label: string; value: number }[] = []
  for (const enr of myEnrollments.value) {
    const course = getCourse(enr.courseId)
    if (!course) continue
    const detailedGrade = store.detailedGrades.find(
      (dg) => dg.studentId === student.value!.id && dg.courseId === enr.courseId
    )
    if (!detailedGrade) continue
    const cfg = store.getGradeConfig(enr.courseId)
    const selfEval = detailedGrade.selfEvalScore ?? 0
    const peerReview = detailedGrade.peerReviewScore ?? 0
    const interGroup = detailedGrade.interGroupScore ?? 0
    const teacherScore = detailedGrade.teacherScore ?? 0
    const mentorScore = detailedGrade.mentorScore ?? 0
    const hasRegularScore = selfEval > 0 || peerReview > 0 || interGroup > 0 || teacherScore > 0 || mentorScore > 0
    if (!hasRegularScore) continue
    const regularScore =
      (selfEval * cfg.selfEvalWeight +
        peerReview * cfg.peerReviewWeight +
        interGroup * cfg.interGroupEvalWeight +
        teacherScore * cfg.teacherScoreWeight +
        mentorScore * cfg.mentorScoreWeight) /
      100
    result.push({
      label: course.title,
      value: Math.round(regularScore),
    })
  }
  return result
})

function getAngle(i: number): number {
  const total = radarData.value.length || 6
  return ((360 / total) * i - 90) * Math.PI / 180
}

function gridPoints(level: number): string {
  const r = level * 30
  return radarData.value.map((_, i) => {
    const angle = getAngle(i)
    return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`
  }).join(' ')
}

function axisEndX(i: number): number {
  const angle = getAngle(i)
  return 100 + 150 * Math.cos(angle)
}

function axisEndY(i: number): number {
  const angle = getAngle(i)
  return 100 + 150 * Math.sin(angle)
}

const dataPolygonPoints = computed(() => {
  return radarData.value.map((d, i) => {
    const angle = getAngle(i)
    const r = d.value * 1.5
    return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`
  }).join(' ')
})

function dataPointX(i: number): number {
  const angle = getAngle(i)
  const r = radarData.value[i].value * 1.5
  return 100 + r * Math.cos(angle)
}

function dataPointY(i: number): number {
  const angle = getAngle(i)
  const r = radarData.value[i].value * 1.5
  return 100 + r * Math.sin(angle)
}

function dataLabelX(i: number): number {
  const angle = getAngle(i)
  const r = Math.min(radarData.value[i].value * 1.5 + 25, 170)
  return 100 + r * Math.cos(angle)
}

function dataLabelY(i: number): number {
  const angle = getAngle(i)
  const r = Math.min(radarData.value[i].value * 1.5 + 25, 170)
  return 100 + r * Math.sin(angle)
}

function dataLabelAnchor(i: number): string {
  const angle = getAngle(i)
  const r = radarData.value[i].value * 1.5
  const x = 100 + r * Math.cos(angle)
  return x > 100 ? 'start' : 'end'
}

const careerRecommendations = computed(() => {
  if (radarData.value.length === 0) return []
  
  const scores: Record<string, number> = {}
  radarData.value.forEach((d) => {
    scores[d.label] = d.value
  })
  
  const aiScore = scores['AI 生成式应用开发'] || 0
  const vizScore = scores['数据可视化与商业分析'] || 0
  const frontendScore = scores['React 前端开发实战'] || 0
  const tsScore = scores['TypeScript 高级编程'] || 0
  const commScore = scores['高效沟通与表达训练'] || 0
  
  const recommendations = []
  
  if (aiScore >= 80) {
    recommendations.push({
      title: 'AI 应用开发工程师',
      description: '利用AI技术构建智能化应用，将大语言模型能力融入产品，是当前最热门的职业方向之一。',
      tags: ['AI', '大模型', '应用开发', '创新'],
      matchScore: Math.round((aiScore * 0.6 + frontendScore * 0.2 + tsScore * 0.2)),
      icon: Sparkles
    })
  }
  
  if (vizScore >= 75) {
    recommendations.push({
      title: '数据可视化工程师',
      description: '将复杂数据转化为直观的可视化图表，帮助企业洞察业务趋势，支持数据驱动决策。',
      tags: ['数据可视化', '图表', 'BI', '分析'],
      matchScore: Math.round((vizScore * 0.5 + frontendScore * 0.3 + commScore * 0.2)),
      icon: LineChart
    })
  }
  
  if (frontendScore >= 75) {
    recommendations.push({
      title: '前端开发工程师',
      description: '负责构建用户界面和交互体验，结合React、TypeScript等现代技术栈打造高质量Web应用。',
      tags: ['React', 'TypeScript', 'UI', '交互'],
      matchScore: Math.round((frontendScore * 0.5 + tsScore * 0.3 + vizScore * 0.2)),
      icon: Cpu
    })
  }
  
  if (aiScore >= 70 && frontendScore >= 70) {
    recommendations.push({
      title: '全栈AI开发工程师',
      description: '兼具前端开发与AI技术能力，能够独立完成从界面到智能功能的完整项目开发。',
      tags: ['全栈', 'AI', '前端', '后端'],
      matchScore: Math.round((aiScore * 0.35 + frontendScore * 0.35 + tsScore * 0.3)),
      icon: Sparkles
    })
  }
  
  return recommendations.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3)
})

const showDetailModal = ref(false)

function getScoreClass(score: number): string {
  if (score >= 90) return 'bg-emerald-100 text-emerald-700'
  if (score >= 80) return 'bg-blue-100 text-blue-700'
  if (score >= 70) return 'bg-amber-100 text-amber-700'
  if (score >= 60) return 'bg-orange-100 text-orange-700'
  return 'bg-red-100 text-red-700'
}

function getScoreText(score: number): string {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '中等'
  if (score >= 60) return '及格'
  return '需提升'
}

function getCourseDetail(title: string): string {
  const detailMap: Record<string, string> = {
    'AI 生成式应用开发': 'AI技术方向',
    '数据可视化与商业分析': '数据分析方向',
    'React 前端开发实战': '前端开发方向',
    'TypeScript 高级编程': '编程语言方向',
    '高效沟通与表达训练': '软技能方向'
  }
  return detailMap[title] || '综合能力'
}

const abilityAnalysis = computed(() => {
  if (radarData.value.length === 0) return '暂无能力数据'
  
  const scores = radarData.value.map((d) => d.value)
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  const maxScore = Math.max(...scores)
  const minScore = Math.min(...scores)
  const maxLabel = radarData.value.find((d) => d.value === maxScore)?.label || ''
  const minLabel = radarData.value.find((d) => d.value === minScore)?.label || ''
  
  let analysis = `您的平均能力得分为 ${Math.round(avg)} 分，整体表现`
  
  if (avg >= 85) analysis += '优秀'
  else if (avg >= 75) analysis += '良好'
  else if (avg >= 65) analysis += '中等'
  else analysis += '有待提升'
  
  analysis += `。您的优势课程是「${maxLabel}」，建议继续深耕；`
  
  if (minScore < 75) {
    analysis += `「${minLabel}」相对薄弱，建议加强学习。`
  } else {
    analysis += '各课程均衡发展，可尝试拓展更多领域。'
  }
  
  return analysis
})
</script>