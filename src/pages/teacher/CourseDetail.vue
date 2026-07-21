<template>
  <div class="space-y-6">
    <!-- 返回按钮 + 课程信息栏 -->
    <div class="flex items-center gap-3">
      <button @click="$router.back()" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <ArrowLeft class="w-5 h-5 text-gray-500" />
      </button>
      <div class="flex-1">
        <h1 class="text-2xl font-bold text-gray-900">{{ course?.title || '课程详情' }}</h1>
        <p class="text-gray-500 mt-1">{{ course?.id }} · {{ course?.duration }}课时</p>
      </div>
      <span :class="`text-xs px-2 py-0.5 rounded-full ${course?.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`">
        {{ course?.status === 'active' ? '进行中' : '已结束' }}
      </span>
    </div>

    <!-- 已结束只读提示 -->
    <div v-if="isReadOnly" class="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
      <Eye class="w-4 h-4 text-gray-400" />
      <span>该课程已结束，当前为<strong>只读查看</strong>模式，无法进行配置修改操作</span>
    </div>

    <!-- Tab 切换 -->
    <div class="flex gap-1 border-b border-gray-200">
      <button v-for="tab in tabList" :key="tab.key"
        @click="activeTab = tab.key"
        :class="`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all ${activeTab === tab.key ? 'bg-white text-blue-600 border border-b-0 border-gray-200 -mb-px' : 'text-gray-500 hover:text-gray-700'}`">
        <component :is="tab.icon" class="w-4 h-4 inline mr-1.5" />{{ tab.label }}
      </button>
    </div>

    <!-- Tab: 评论管理 -->
    <div v-if="activeTab === 'comments'" class="space-y-6">
      <!-- 评价方案配置 -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <button @click="evalConfigLocked ? null : (showSettings = !showSettings)" class="w-full flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Settings class="w-5 h-5 text-gray-400" />
            <h2 class="font-semibold text-gray-900">评价方案配置</h2>
          </div>
          <div class="flex items-center gap-3">
            <span v-if="evalConfigLocked" class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
              <Lock class="w-3 h-3 inline mr-0.5" />已锁定
            </span>
            <span class="text-xs text-gray-400">
              {{ selectedConfig ? EvalTemplateLabels[selectedConfig.template] : '默认方案' }} ·
              {{ selectedConfig ? EvalFrequencyLabels[selectedConfig.frequency] : '默认频率' }}
            </span>
            <span v-if="!isReadOnly && !evalConfigLocked" class="text-xs text-gray-400 hover:text-gray-600">{{ showSettings ? '收起 ▲' : '展开 ▼' }}</span>
            <span v-if="isReadOnly || evalConfigLocked" class="text-xs text-gray-300">仅查看</span>
          </div>
        </button>

        <!-- 锁定提示 -->
        <div v-if="evalConfigLocked" class="mt-3 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
          <Lock class="w-3.5 h-3.5 text-gray-400" />
          <span v-if="selectedConfig">评价方案已在第一节课开始前配置完成，已锁定不可修改。</span>
          <span v-else>第一节课已开始，评价方案未配置，现按默认方案实施，已锁定不可修改。</span>
        </div>

        <div class="flex flex-wrap gap-2 mt-3 mb-1">
          <template v-for="t in ALL_EVAL_TYPES" :key="t">
            <span v-if="!selectedConfig || !TEMPLATE_EVAL_TYPES[selectedConfig.template].includes(t)"
              class="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-300 border border-gray-200">
              {{ EvalTypeLabels[t] }} ✗
            </span>
            <span v-else-if="(t === 'intra_group' || t === 'inter_group') && !courseHasGroups || t === 'mentor' && selectedConfig && !selectedConfig.hasMentor"
              class="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-500 border border-amber-200">
              <EyeOff class="w-3 h-3 inline mr-0.5" />
              {{ EvalTypeLabels[t] }}（自动隐藏）
            </span>
            <span v-else :class="`text-xs px-2.5 py-1 rounded-full border ${EvalTypeColors[t]}`">
              <Eye class="w-3 h-3 inline mr-0.5" />
              {{ EvalTypeLabels[t] }}
            </span>
          </template>
        </div>

        <template v-if="showSettings && !isReadOnly && !evalConfigLocked">
          <div class="border-t border-gray-100 mt-3 pt-4 space-y-4">
            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">评价模板</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button v-for="tpl in EVAL_TEMPLATE_KEYS" :key="tpl"
                  @click="handleSetConfig({ template: tpl })"
                  :class="`text-left p-3 rounded-lg border transition-all ${selectedConfig?.template === tpl ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'}`">
                  <span class="text-sm font-medium text-gray-900">{{ EvalTemplateLabels[tpl] }}</span>
                  <p class="text-xs text-gray-400 mt-0.5">{{ EvalTemplateDescs[tpl] }}</p>
                  <div class="flex gap-1 mt-1">
                    <span v-for="et in TEMPLATE_EVAL_TYPES[tpl]" :key="et" class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{{ EvalTypeLabels[et] }}</span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">评价频率</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button v-for="freq in EVAL_FREQUENCY_KEYS" :key="freq"
                  @click="handleSetConfig({ frequency: freq })"
                  :class="`text-left p-3 rounded-lg border transition-all ${selectedConfig?.frequency === freq ? 'border-cyan-300 bg-cyan-50' : 'border-gray-200 bg-white hover:border-gray-300'}`">
                  <span class="text-sm font-medium text-gray-900">{{ EvalFrequencyLabels[freq] }}</span>
                  <p class="text-xs text-gray-400 mt-0.5">{{ EvalFrequencyDescs[freq] }}</p>
                  <span class="text-xs text-cyan-500 mt-0.5 block">共 {{ courseId ? store.getEvalSessions(courseId) : 0 }} 次评价</span>
                </button>
              </div>
              <div v-if="selectedConfig?.frequency === 'custom'" class="mt-2">
                <label class="text-xs text-gray-500">自定义评价次数：</label>
                <input type="number" min="1" max="20"
                  :value="selectedConfig?.customSessions || 3"
                  @change="(e) => handleSetConfig({ customSessions: parseInt((e.target as HTMLInputElement).value) || 3 })"
                  class="ml-2 w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>

            <div class="flex items-center gap-3">
              <label class="text-sm font-medium text-gray-700">企业导师参与评价</label>
              <button @click="handleSetConfig({ hasMentor: !selectedConfig?.hasMentor })"
                :class="`relative w-10 h-5 rounded-full transition-colors ${selectedConfig?.hasMentor ? 'bg-emerald-400' : 'bg-gray-300'}`">
                <span :class="`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${selectedConfig?.hasMentor ? 'left-5.5' : 'left-0.5'}`" />
              </button>
              <span class="text-xs text-gray-400">{{ selectedConfig?.hasMentor ? '已启用' : '已禁用' }}</span>
            </div>

            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">逾期未评处理规则</p>
              <div class="flex gap-3">
                <button v-for="rule in OVERDUE_RULE_KEYS" :key="rule"
                  @click="handleSetConfig({ overdueRule: rule })"
                  :class="`px-4 py-2 rounded-lg border text-sm transition-all ${selectedConfig?.overdueRule === rule ? 'border-purple-300 bg-purple-50 text-purple-700 font-medium' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`">
                  {{ OverdueRuleLabels[rule] }}
                </button>
              </div>
            </div>
          </div>
        </template>
        <!-- 课程结束 / 锁定 readonly 展示 -->
        <template v-else-if="(isReadOnly || evalConfigLocked) && showSettings">
          <div class="border-t border-gray-100 mt-3 pt-4 text-sm text-gray-400 text-center py-4">
            <EyeOff class="w-5 h-5 inline mr-1" />
            {{ isReadOnly ? '已结束课程不可修改配置' : '第一节课已开始，评价方案已锁定不可修改' }}
          </div>
        </template>
      </div>

      <!-- 评价管理（合并批量评价 + 逐次评价） -->
      <div v-if="!isReadOnly" class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <ClipboardCheck class="w-5 h-5 text-gray-400" />
            <h2 class="font-semibold text-gray-900">评价管理</h2>
            <span class="text-xs text-gray-400">{{ enrolledStudents.length }}名学生</span>
          </div>
          <button @click="handleProcessOverdue" class="text-xs flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-100">
            <RefreshCw class="w-3 h-3" />
            处理逾期自评
          </button>
        </div>

        <!-- 轮次 + 类型选择器 -->
        <div class="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <span class="text-xs text-gray-500 font-medium">评价轮次：</span>
          <button v-for="s in totalSessions" :key="s"
            @click="handleSessionSelect(s)"
            :disabled="isSessionDisabled(s)"
            :title="getSessionTitle(s)"
            :class="`text-xs px-3 py-1.5 rounded-lg border transition-all ${selectedBatchSession === s ? 'bg-blue-50 text-blue-600 border-blue-300 font-medium' : isSessionDisabled(s) ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`">
            第{{ s }}次
            <span v-if="store.isSessionLocked(courseId || '', s)" class="ml-1">🔒</span>
            <span v-else-if="!isSessionTime(s)" class="ml-1 text-gray-300">⏳</span>
          </button>
        </div>

        <!-- 轮次状态提示 -->
        <div v-if="store.isSessionLocked(courseId || '', selectedBatchSession)" class="flex items-center gap-2 px-3 py-2 mb-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
          <EyeOff class="w-3.5 h-3.5 text-gray-400" />
          <span>该轮次已锁定，评价不可修改。上一轮次结束后自动锁定并处理逾期。</span>
        </div>
        <div v-else-if="!isSessionTime(selectedBatchSession)" class="flex items-center gap-2 px-3 py-2 mb-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-600">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>{{ selectedBatchSession === 1 ? '第一节课已开始，评价已开启' : '该轮次尚未到开启时间' }}</span>
        </div>
        <div v-else-if="isFinalSessionExpired" class="flex items-center gap-2 px-3 py-2 mb-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-500">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
          <span>课程已结束，最终评价已截止。</span>
        </div>

        <!-- 学生搜索 -->
        <div class="mb-3">
          <div class="relative max-w-xs">
            <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input v-model="evalStudentSearch" type="text" placeholder="搜索学生姓名..."
              class="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
          </div>
        </div>

        <!-- 学生列表（按组排列，显示全部评价类型分数） -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="w-10 py-2.5 px-2">
                  <input type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleAll"
                    class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                </th>
                <th class="text-left py-2.5 px-3 text-gray-500 font-medium">学生</th>
                <th class="text-center py-2.5 px-2 w-14 text-gray-500 font-medium text-[10px]">自评</th>
                <th class="text-center py-2.5 px-2 w-14 text-gray-500 font-medium text-[10px]">组内</th>
                <th class="text-center py-2.5 px-2 w-14 text-gray-500 font-medium text-[10px]">组间</th>
                <th class="text-center py-2.5 px-2 w-14 text-gray-500 font-medium text-[10px]">教师</th>
                <th class="text-center py-2.5 px-2 w-14 text-gray-500 font-medium text-[10px]">导师</th>
                <th class="text-left py-2.5 px-3 w-24 text-gray-500 font-medium">状态</th>
                <th class="text-left py-2.5 px-3 w-36 text-gray-500 font-medium">新评分</th>
              </tr>
            </thead>
            <tbody>
              <!-- 无分组学生 -->
              <template v-for="(section, si) in evalTableSections" :key="si">
                <tr class="bg-gray-50 border-b border-gray-100">
                  <td colspan="9" class="py-2 px-3">
                    <span class="text-sm font-semibold text-gray-700">{{ section.groupName }}</span>
                    <span class="text-xs text-gray-400 ml-2">{{ section.students.length }}人</span>
                  </td>
                </tr>
                <tr v-for="s in section.students" :key="s.student.id"
                  class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  :class="{ 'bg-blue-50/30': selectedStudentIds.includes(s.student.id), 'bg-emerald-50/20': s.submitted }">
                  <td class="py-2.5 px-2 text-center">
                    <input type="checkbox"
                      v-model="selectedStudentIds"
                      :value="s.student.id"
                      :disabled="s.submitted"
                      class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  </td>
                  <td class="py-2.5 px-3">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span class="text-xs font-medium text-blue-600">{{ s.student.name.charAt(0) }}</span>
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 text-sm">{{ s.student.name }}</p>
                        <p class="text-xs text-gray-400">{{ s.student.id }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="py-2.5 px-2 text-center">
                    <span class="text-xs font-medium" :class="s.selfScore !== null ? 'text-blue-600' : 'text-gray-300'">{{ s.selfScore !== null ? s.selfScore + '分' : '-' }}</span>
                  </td>
                  <td class="py-2.5 px-2 text-center">
                    <span class="text-xs font-medium" :class="s.intraScore !== null ? 'text-emerald-600' : 'text-gray-300'">{{ s.intraScore !== null ? s.intraScore + '分' : '-' }}</span>
                  </td>
                  <td class="py-2.5 px-2 text-center">
                    <span class="text-xs font-medium" :class="s.interScore !== null ? 'text-purple-600' : 'text-gray-300'">{{ s.interScore !== null ? s.interScore + '分' : '-' }}</span>
                  </td>
                  <td class="py-2.5 px-2 text-center">
                    <span class="text-xs font-medium" :class="s.teacherScore !== null ? 'text-amber-600' : 'text-gray-300'">{{ s.teacherScore !== null ? s.teacherScore + '分' : '-' }}</span>
                  </td>
                  <td class="py-2.5 px-2 text-center">
                    <span class="text-xs font-medium" :class="s.mentorScore !== null ? 'text-rose-600' : 'text-gray-300'">{{ s.mentorScore !== null ? s.mentorScore + '分' : '-' }}</span>
                  </td>
                  <td class="py-2.5 px-3">
                    <span v-if="s.submitted" class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      <CheckCircle class="w-3 h-3" />已提交
                    </span>
                    <span v-else-if="s.hasDraft" class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                      <Save class="w-3 h-3" />已保存
                    </span>
                    <span v-else class="text-xs text-gray-300">-</span>
                  </td>
                  <td class="py-2.5 px-3">
                    <div v-if="!s.submitted" class="flex items-center gap-1">
                      <input type="number" min="0" max="100"
                        v-model.number="evalScoreInputs[s.student.id]"
                        placeholder="输入分数"
                        class="w-full max-w-[90px] px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                      <span class="text-xs text-gray-400">分</span>
                    </div>
                    <span v-else class="text-xs font-medium text-emerald-600">{{ s.finalScore }}分</span>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
          <div v-if="evalTableSections.length === 0 || evalTableSections.every(sec => sec.students.length === 0)" class="text-center py-8 text-gray-400">
            {{ evalStudentSearch ? '未找到匹配的学生' : '该课程暂无学生' }}
          </div>
        </div>

        <!-- 底部操作区 -->
        <div class="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-start justify-between gap-4">
          <!-- 批量等级按钮 -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs text-gray-500 font-medium">一键等级评价（选中 {{ selectedUnsubmittedCount }} 名学生）：</span>
            <div class="flex flex-wrap gap-1.5">
              <button v-for="level in LEVEL_OPTIONS" :key="level.label"
                @click="handleBatchEval(level.label)"
                :class="`text-xs px-3 py-1.5 rounded-lg border transition-all ${level.color} hover:opacity-80 ${selectedUnsubmittedCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`"
                :disabled="selectedUnsubmittedCount === 0">
                {{ level.label }} ({{ level.range[0] }}-{{ level.range[1] }}分)
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="handleSaveEvalScores"
              :class="`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${hasEvalInputs ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`"
              :disabled="!hasEvalInputs">
              <Save class="w-4 h-4" />
              保存评分
            </button>
            <button @click="handleSubmitAll"
              :class="`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${hasSubmittable ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`"
              :disabled="!hasSubmittable">
              <CheckCircle class="w-4 h-4" />
              全部提交（{{ submittableCount }}人）
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: 成绩管理（考试/项目成绩录入） -->
    <div v-if="activeTab === 'grades'" class="space-y-6">
      <!-- 顶部操作栏 -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <TrendingUp class="w-5 h-5 text-gray-400" />
            <h2 class="font-semibold text-gray-900">考试/项目成绩管理</h2>
            <span class="text-xs text-gray-400">{{ enrolledStudents.length }}名学生</span>
          </div>
          <div class="flex items-center gap-2">
            <!-- 权重配置 -->
            <button @click="showGradeConfig = true" :disabled="isReadOnly || isWeightLocked"
              :class="`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isWeightLocked ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed' : 'bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100'}`"
              :title="isWeightLocked ? '期末考试成绩已录入，权重已锁定不可修改' : ''">
              <Lock v-if="isWeightLocked" class="w-3.5 h-3.5" />
              <Settings v-else class="w-3.5 h-3.5" />
              权重配置
            </button>
            <!-- 添加考试/项目 -->
            <button @click="showNewExamModal = true" :disabled="isReadOnly"
              class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              添加考试/项目
            </button>
            <!-- Excel导入 -->
            <label :class="`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${isReadOnly ? 'bg-gray-100 text-gray-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'}`">
              <FileSpreadsheet class="w-3.5 h-3.5" />
              导入 Excel
              <input type="file" accept=".xlsx,.xls" @change="handleExcelImport" class="hidden" :disabled="isReadOnly" />
            </label>
            <button @click="handleDownloadTemplate" :disabled="isReadOnly"
              class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              <FileSpreadsheet class="w-3.5 h-3.5" />
              下载模板
            </button>
          </div>
        </div>

        <!-- 权重锁定提示 -->
        <div v-if="isWeightLocked" class="mb-4 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
          <Lock class="w-3.5 h-3.5 text-gray-400" />
          <span>期末考试成绩已录入，权重已锁定，不可再修改。</span>
        </div>

        <!-- 权重配置区域（按类型分组） -->
        <div v-if="examsByType.length > 0" class="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
              <span class="text-xs font-medium text-gray-600">成绩权重配置</span>
              <span class="text-xs text-gray-400">权重总和: {{ examWeightTotal }}%</span>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="examWeightTotal !== 100" class="text-xs text-amber-500 font-medium">⚠ 权重总和不等于100%</span>
              <span v-else class="text-xs text-emerald-500 font-medium">✓ 权重已平衡</span>
            </div>
          </div>

          <!-- 按类型显示权重 -->
          <div class="space-y-2">
            <div v-for="group in examsByType" :key="group.type"
              class="bg-white rounded-lg px-3 py-2 border border-gray-200">
              <div class="flex items-center gap-2 mb-1.5">
                <span class="text-xs font-medium text-gray-700">{{ ExamTypeLabels[group.type] || group.type }}</span>
                <span class="text-xs text-gray-400">{{ group.exams.length }}项</span>
                <!-- 该类型的总权重 -->
                <span class="text-xs text-gray-500 ml-auto">类型权重：<strong>{{ getTypeWeightLabel(group.type) }}</strong></span>
              </div>
              <!-- 如果该类型下只有1项，不显示子权重输入 -->
              <!-- 如果该类型下有多项，显示每项的子权重 -->
              <div v-if="group.exams.length > 1" class="mt-1 pt-1.5 border-t border-gray-100">
                <div class="flex items-center gap-1 mb-1.5">
                  <span class="text-xs text-gray-400">默认均分：{{ Math.floor((parseInt(getTypeWeightLabel(group.type)) || 0) / group.exams.length) }}%/项，可手动调整</span>
                </div>
                <div class="flex flex-wrap gap-2">
                  <div v-for="name in group.exams" :key="name"
                    class="flex items-center gap-1.5 bg-gray-50 rounded px-2 py-1 border border-gray-100">
                    <span class="text-xs text-gray-500">{{ name }}:</span>
                    <input type="number" min="0" max="100"
                      :value="getExamWeightFromConfig(name)"
                      @change="(e) => handleWeightChange(name, parseInt((e.target as HTMLInputElement).value) || 0)"
                      class="w-12 px-1 py-0.5 border border-gray-200 rounded text-xs text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      :disabled="isReadOnly || isWeightLocked" />
                    <span class="text-xs text-gray-400">%</span>
                  </div>
                </div>
              </div>
              <!-- 只有1项时，显示该类型权重已自动应用 -->
              <div v-else class="text-xs text-gray-400 mt-0.5">
                该类型下仅1项，权重已按类型配置自动分配
              </div>
            </div>
          </div>
        </div>

        <!-- 考试/项目名称选择 + 搜索 -->
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <span class="text-xs text-gray-500 font-medium">考试/项目：</span>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="name in examNames" :key="name"
              @click="handleSelectExam(name)"
              :class="`text-xs px-3 py-1.5 rounded-lg border transition-all ${selectedExam === name ? 'bg-blue-50 text-blue-600 border-blue-300 font-medium' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`">
              {{ name }}
            </button>
            <span v-if="examNames.length === 0" class="text-xs text-gray-400 italic">暂无考试/项目，请先添加</span>
          </div>
          <div class="ml-auto flex items-center gap-2">
            <div class="relative w-48">
              <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input v-model="gradeSearch" type="text" placeholder="搜索学生姓名或学号..."
                class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-xs" />
            </div>
          </div>
        </div>

        <div v-if="selectedExam" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left py-2.5 px-3 text-gray-500 font-medium w-28">学生</th>
                <th class="text-left py-2.5 px-3 text-gray-500 font-medium w-20">满分</th>
                <th class="text-left py-2.5 px-3 text-gray-500 font-medium w-20">成绩</th>
                <th class="text-left py-2.5 px-3 text-gray-500 font-medium w-28">折合百分制</th>
                <th class="text-left py-2.5 px-3 text-gray-500 font-medium w-24">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="{ student } in filteredGradeStudents" :key="student!.id"
                class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                :class="{ 'bg-emerald-50/20': isExamSubmitted(student!.id) }">
                <td class="py-2.5 px-3">
                  <span class="text-sm font-medium text-gray-900">{{ student!.name }}</span>
                </td>
                <td class="py-2.5 px-3 text-xs text-gray-500">{{ currentExamFullScore }}</td>
                <td class="py-2.5 px-3">
                  <div v-if="!isExamSubmitted(student!.id)" class="flex items-center gap-1">
                    <input type="number" min="0" :max="currentExamFullScore"
                      :value="examInputs[student!.id] ?? getStudentExamScore(student!.id)"
                      @input="(e) => { const v = parseInt((e.target as HTMLInputElement).value); if (!isNaN(v)) examInputs[student!.id] = Math.min(currentExamFullScore, Math.max(0, v)); else delete examInputs[student!.id] }"
                      :placeholder="getStudentExamScore(student!.id) !== null ? String(getStudentExamScore(student!.id)) : '分数'"
                      class="w-full max-w-[80px] px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                    <span class="text-xs text-gray-400">/ {{ currentExamFullScore }}</span>
                  </div>
                  <span v-else class="text-xs font-medium text-emerald-600">{{ getStudentExamScore(student!.id) }}分</span>
                </td>
                <td class="py-2.5 px-3">
                  <span class="text-xs font-medium text-blue-600">
                    {{ getStudentExamPercent(student!.id) }}
                  </span>
                </td>
                <td class="py-2.5 px-3">
                  <span v-if="isExamSubmitted(student!.id)" class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <CheckCircle class="w-3 h-3" />已提交
                  </span>
                  <span v-else-if="getStudentExamScore(student!.id) !== null" class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                    <Save class="w-3 h-3" />已保存
                  </span>
                  <span v-else class="text-xs text-gray-300">-</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredGradeStudents.length === 0" class="text-center py-8 text-gray-400">暂无学生数据</div>
        </div>

        <!-- 底部操作（保存/提交） -->
        <div v-if="selectedExam && !isReadOnly" class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500">共 {{ enrolledStudents.length }} 名学生，已提交 {{ submittedExamCount }} 人</span>
          </div>
          <div class="flex items-center gap-2">
            <button @click="handleSaveExamScores"
              :class="`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${hasExamInputs ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`"
              :disabled="!hasExamInputs">
              <Save class="w-4 h-4" />
              保存成绩
            </button>
            <button @click="handleSubmitExamScores"
              :class="`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pendingExamSubmits > 0 ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`"
              :disabled="pendingExamSubmits === 0">
              <CheckCircle class="w-4 h-4" />
              全部提交（{{ pendingExamSubmits }}人）
            </button>
          </div>
        </div>
      </div>

      <!-- 学生成绩总览/搜索区 -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            <h2 class="font-semibold text-gray-900">成绩查询</h2>
          </div>
        </div>
        <div class="flex items-end gap-3 mb-4">
          <div class="flex-1">
            <label class="text-xs text-gray-500 mb-1 block">搜索学生姓名</label>
            <input v-model="totalSearch" type="text" placeholder="输入学生姓名查询总成绩..."
              class="w-full max-w-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
          </div>
        </div>
        <!-- 学生成绩列表（按首字母分组） -->
        <div v-if="studentGradeGroups.length > 0" class="space-y-3">
          <div v-for="group in studentGradeGroups" :key="group.initial"
            class="border border-gray-100 rounded-xl overflow-hidden">
            <div class="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <span class="text-sm font-bold text-gray-700">{{ group.initial }}</span>
              <span class="text-xs text-gray-400">{{ group.students.length }}人</span>
            </div>
            <div class="divide-y divide-gray-50">
              <div v-for="student in group.students" :key="student.id"
                class="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
                @click="totalSearch = student.name">
                <div class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span class="text-xs font-medium text-blue-600">{{ student.name.charAt(0) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 text-sm">{{ student.name }}</p>
                  <p class="text-xs text-gray-400">{{ student.id }}</p>
                </div>
                <div class="grid grid-cols-3 gap-4 text-right">
                  <div>
                    <p class="text-[10px] text-gray-400">加权总分</p>
                    <p class="text-sm font-bold" :style="{ color: totalScoreColor(getStudentTotalScore(student.id)) }">
                      {{ getStudentTotalScore(student.id) }}
                    </p>
                  </div>
                  <div>
                    <p class="text-[10px] text-gray-400">考试数</p>
                    <p class="text-sm font-bold text-blue-600">{{ getStudentExamCount(student.id) }}</p>
                  </div>
                  <div>
                    <p class="text-[10px] text-gray-400">平时成绩</p>
                    <p class="text-sm font-bold text-emerald-600">{{ getStudentAvgScore(student.id) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="totalSearch.trim()" class="text-center py-6 text-gray-400">
          未找到学生 "{{ totalSearch }}"
        </div>
      </div>

      <!-- 新建考试/项目弹窗 -->
      <Teleport to="body">
        <div v-if="showNewExamModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showNewExamModal = false" />
          <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">新建考试/项目</h3>
            <div class="space-y-3">
              <div>
                <label class="text-xs text-gray-500 font-medium mb-1 block">名称</label>
                <input v-model="newExamName" type="text" placeholder="如：期中考试、项目一、期末考试"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
              <div>
                <label class="text-xs text-gray-500 font-medium mb-1 block">满分</label>
                <input v-model.number="newExamFullScore" type="number" min="1" max="200" value="100"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
              <div>
                <label class="text-xs text-gray-500 font-medium mb-1 block">类型</label>
                <select v-model="newExamType"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none">
                  <option value="midterm_exam">期中考试（仅1次）</option>
                  <option value="midterm_project">期中项目</option>
                  <option value="final_exam">期末考试（仅1次）</option>
                  <option value="final_project">期末项目</option>
                </select>
              </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
              <button @click="showNewExamModal = false"
                class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                取消
              </button>
              <button @click="handleAddExam"
                :disabled="!newExamName.trim()"
                class="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                创建
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>

    <!-- Tab: 学生管理（统一视图 - 以组为单位） -->
    <div v-if="activeTab === 'students'" class="space-y-6">
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <!-- 工具栏 -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Users class="w-5 h-5 text-gray-400" />
            <h2 class="font-semibold text-gray-900">学生管理</h2>
            <span class="text-xs text-gray-400">{{ enrolledStudents.length }}名学生 · {{ store.studentGroups.filter(g => g.courseId === courseId).length }}个组</span>
          </div>
          <div class="flex items-center gap-2">
            <input ref="studentExcelInput" type="file" accept=".xlsx,.xls" class="hidden" @change="handleImportStudentsExcel" />
            <button @click="studentExcelInput?.click()" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors">
              <FileSpreadsheet class="w-3.5 h-3.5" />
              导入学生
            </button>
            <input ref="groupExcelInput" type="file" accept=".xlsx,.xls" class="hidden" @change="handleImportGroupsExcel" />
            <button @click="groupExcelInput?.click()" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors">
              <FileSpreadsheet class="w-3.5 h-3.5" />
              导入分组
            </button>
            <button @click="showAddStudentModal = true" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              <Plus class="w-3.5 h-3.5" />
              添加学生
            </button>
            <button @click="openNewGroupModal()" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              <Users class="w-3.5 h-3.5" />
              新建分组
            </button>
          </div>
        </div>

        <!-- 搜索 -->
        <div class="mb-3">
          <div class="relative max-w-xs">
            <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input v-model="studentSearch" type="text" placeholder="搜索学生姓名或学号..."
              class="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
          </div>
        </div>

        <!-- 以组为单位的学生列表 -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left py-2.5 px-3 text-gray-500 font-medium">学生</th>
                <th class="text-left py-2.5 px-3 text-gray-500 font-medium">学号</th>
                <th class="text-center py-2.5 px-2 w-32 text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(section, si) in studentSections" :key="si">
                <!-- 组标题行 -->
                <tr class="bg-gray-50 border-b border-gray-100">
                  <td colspan="3" class="py-2 px-3">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <Users class="w-4 h-4 text-gray-400" />
                        <span class="text-sm font-semibold text-gray-700">{{ section.groupName }}</span>
                        <span class="text-xs text-gray-400">{{ section.students.length }}人</span>
                      </div>
                      <div v-if="section.groupId" class="flex items-center gap-1">
                        <button @click="openEditGroupModal(store.studentGroups.find(g => g.id === section.groupId)!)"
                          class="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-white/60 transition-colors">
                          <Edit3 class="w-3.5 h-3.5" />
                          编辑组
                        </button>
                        <button @click="handleDeleteGroup(section.groupId)"
                          class="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-white/60 transition-colors">
                          <Trash2 class="w-3.5 h-3.5" />
                          删除组
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
                <!-- 学生行 -->
                <tr v-for="item in section.students" :key="item.student.id"
                  class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td class="py-2.5 px-3">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span class="text-xs font-medium text-emerald-600">{{ item.student.name.charAt(0) }}</span>
                      </div>
                      <span class="font-medium text-gray-900 text-sm">{{ item.student.name }}</span>
                    </div>
                  </td>
                  <td class="py-2.5 px-3">
                    <span class="text-sm text-gray-500">{{ item.student.id }}</span>
                  </td>
                  <td class="py-2.5 px-3">
                    <div class="flex items-center justify-center gap-1">
                      <button @click="handleEditStudent(item.student)"
                        class="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                        <Edit3 class="w-3.5 h-3.5" />
                        编辑
                      </button>
                      <button v-if="section.groupId"
                        @click="handleRemoveStudentFromGroup(item.student.id)"
                        class="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 px-2 py-1 rounded hover:bg-orange-50 transition-colors">
                        移出组
                      </button>
                      <button @click="handleRemoveStudent(item.student.id)"
                        class="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                        <Trash2 class="w-3.5 h-3.5" />
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div v-if="studentSections.length === 0 || studentSections.every(s => s.students.length === 0)" class="text-center py-8 text-gray-400">暂无学生数据，请导入学生或添加学生</div>
      </div>

      <!-- 添加学生弹窗 -->
      <Teleport to="body">
        <div v-if="showAddStudentModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showAddStudentModal = false" />
          <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">添加学生到课程</h3>
            <div class="space-y-3">
              <div>
                <label class="text-sm text-gray-600 block mb-1">学生姓名</label>
                <input v-model="newStudentName" type="text" placeholder="输入学生姓名"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
              <div>
                <label class="text-sm text-gray-600 block mb-1">学生学号</label>
                <input v-model="newStudentId" type="text" placeholder="输入学生学号（可选）"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
              <button @click="showAddStudentModal = false" class="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
              <button @click="handleAddSingleStudent" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">添加</button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- 新建/编辑分组弹窗 -->
      <Teleport to="body">
        <div v-if="showGroupModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showGroupModal = false" />
          <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingGroup ? '编辑分组' : '新建分组' }}</h3>
            <div class="space-y-3">
              <div>
                <label class="text-sm text-gray-600 block mb-1">组名</label>
                <input v-model="groupFormName" type="text" placeholder="输入组名"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
              <div>
                <label class="text-sm text-gray-600 block mb-1">选择成员</label>
                <div class="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                  <label v-for="s in enrolledStudents" :key="s.student!.id"
                    class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" :value="s.student!.id" v-model="groupFormMembers"
                      class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span class="text-sm text-gray-700">{{ s.student!.name }}</span>
                    <span class="text-xs text-gray-400">{{ s.student!.id }}</span>
                  </label>
                  <div v-if="enrolledStudents.length === 0" class="text-center py-4 text-xs text-gray-400">暂无学生可添加</div>
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
              <button @click="showGroupModal = false" class="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
              <button @click="handleSaveGroup" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">{{ editingGroup ? '保存' : '创建' }}</button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- 编辑学生弹窗 -->
      <Teleport to="body">
        <div v-if="showEditStudentModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showEditStudentModal = false" />
          <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">编辑学生信息</h3>
            <div class="space-y-3">
              <div>
                <label class="text-sm text-gray-600 block mb-1">学生姓名</label>
                <input v-model="editStudentName" type="text" placeholder="输入学生姓名"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
              <div>
                <label class="text-sm text-gray-600 block mb-1">学生学号</label>
                <input v-model="editStudentIdField" type="text" placeholder="输入学生学号"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
              <div>
                <label class="text-sm text-gray-600 block mb-1">归属分组</label>
                <select v-model="editStudentGroupId"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none">
                  <option value="">-- 不分组 --</option>
                  <option v-for="g in store.studentGroups.filter(g => g.courseId === courseId)" :key="g.id" :value="g.id">
                    {{ g.name }}
                  </option>
                </select>
              </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
              <button @click="showEditStudentModal = false" class="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
              <button @click="handleSaveEditStudent" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">保存</button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>

  <!-- GradeConfig 权重配置弹窗 -->
  <GradeConfig
    :course-id="courseId || ''"
    :open="showGradeConfig"
    :on-close="() => { showGradeConfig = false; if (pendingFinalExamSelect) { selectedExam = pendingFinalExamSelect; pendingFinalExamSelect = ''; } }"
  />

  <!-- 期末成绩权重提醒弹窗 -->
  <Teleport to="body">
    <div v-if="showWeightReminderModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="showWeightReminderModal = false" />
      <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">权重配置提醒</h3>
            <p class="text-xs text-gray-500">请在录入期末考试/项目成绩前完成权重配置</p>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-4">
          当前尚未完成成绩权重配置，期末考试/项目成绩录入后权重将<strong class="text-red-500">无法修改</strong>。
          建议先完成权重配置，再录入成绩。
        </p>
        <div class="flex justify-end gap-2">
          <button @click="showWeightReminderModal = false; selectedExam = pendingFinalExamSelect"
            class="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            忽略，直接录入
          </button>
          <button @click="handleOpenGradeConfigFromReminder"
            class="flex items-center gap-1.5 px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
            <Settings class="w-4 h-4" />
            去配置权重
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 已结束课程只读提示（评价管理区域） -->
  <div v-if="isReadOnly" class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center text-sm text-gray-400">
    <EyeOff class="w-8 h-8 mx-auto mb-2 text-gray-300" />
    <p>该课程已结束，评价管理功能已关闭</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import GradeConfig from '@/components/GradeConfig.vue'
import {
  ArrowLeft, Users, ClipboardCheck, Search, Settings,
  TrendingUp, RefreshCw,
  Eye, EyeOff, Save, CheckCircle, FileSpreadsheet,
  Plus, Trash2, Edit3, Lock
} from 'lucide-vue-next'
import {
  EvalTemplateLabels, EvalTemplateDescs, TEMPLATE_EVAL_TYPES,
  EvalTypeLabels, EvalTypeColors, EvalFrequencyLabels,
  EvalFrequencyDescs, OverdueRuleLabels
} from '@/types'
import type { EvalTemplate, EvalType, Evaluation, EvalFrequency, OverdueRule } from '@/types'

const route = useRoute()
const store = useAppStore()

const courseId = computed(() => route.params.id as string)
const course = computed(() => store.courses.find((c) => c.id === courseId.value))
const isReadOnly = computed(() => course.value?.status !== 'active')

// ---- Tab 配置 ----
const tabList = [
  { key: 'comments',  label: '评论管理', icon: ClipboardCheck },
  { key: 'grades',    label: '成绩管理', icon: TrendingUp },
  { key: 'students',  label: '学生管理', icon: Users },
]

// ---- 常量 ----
const LEVEL_OPTIONS = [
  { label: 'A (优秀)', range: [90, 100], color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { label: 'B (良好)', range: [80, 89],  color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { label: 'C (中等)', range: [70, 79],  color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { label: 'D (及格)', range: [60, 69],  color: 'bg-orange-100 text-orange-700 border-orange-300' },
]
const ALL_EVAL_TYPES: EvalType[] = ['self', 'intra_group', 'inter_group', 'teacher', 'mentor']
const EVAL_TEMPLATE_KEYS = Object.keys(EvalTemplateLabels) as EvalTemplate[]
const EVAL_FREQUENCY_KEYS = Object.keys(EvalFrequencyLabels) as EvalFrequency[]
const OVERDUE_RULE_KEYS = Object.keys(OverdueRuleLabels) as OverdueRule[]
const ExamTypeLabels: Record<string, string> = {
  midterm_exam: '期中考试',
  midterm_project: '期中项目',
  final_exam: '期末考试',
  final_project: '期末项目',
  quiz: '隨堂测验',
  assignment: '课后作业',
}

// ---- 配置锁定状态 ----
/** 评价方案是否已锁定（第一节课开始后不可修改） */
const evalConfigLocked = computed(() => {
  if (!courseId.value) return true
  return !store.isEvalConfigEditable(courseId.value)
})
/** 成绩权重是否已锁定（期末考试成绩录入后不可修改） */
const isWeightLocked = computed(() => {
  if (!courseId.value) return true
  return !store.isWeightConfigEditable(courseId.value)
})

// ---- 状态 ----
const activeTab = ref<string>('comments')
const showSettings = ref(false)
const studentSearch = ref('')

// ---- 学生管理（统一视图） ----
// 添加学生
const showAddStudentModal = ref(false)
const newStudentName = ref('')
const newStudentId = ref('')
const studentExcelInput = ref<HTMLInputElement | null>(null)
// 分组管理
const showGroupModal = ref(false)
const editingGroup = ref<import('@/types').StudentGroup | null>(null)
const groupFormName = ref('')
const groupFormMembers = ref<string[]>([])
const groupExcelInput = ref<HTMLInputElement | null>(null)
// 学生弹窗编辑
const showEditStudentModal = ref(false)
const editingStudent = ref<import('@/types').Student | null>(null)
const editStudentName = ref('')
const editStudentIdField = ref('')
const editStudentGroupId = ref('')

// ---- 成绩管理（考试/项目）状态 ----
const showNewExamModal = ref(false)
const showGradeConfig = ref(false)
const newExamName = ref('')
const newExamFullScore = ref(100)
const newExamType = ref<'midterm_exam' | 'midterm_project' | 'final_exam' | 'final_project' | 'quiz' | 'assignment'>('midterm_exam')
const selectedExam = ref('')
const gradeSearch = ref('')
const totalSearch = ref('')
// 期末成绩权重提醒弹窗
const showWeightReminderModal = ref(false)
const pendingFinalExamSelect = ref('')

/** 获取学生姓名首字母 */
function getStudentInitial(name: string): string {
  const ch = name.charAt(0)
  // 英文字母
  if (/[a-zA-Z]/.test(ch)) return ch.toUpperCase()
  // 中文字符 — 取本身
  return ch
}

/** 按首字母分组的成绩学生列表（无搜索时显示全部） */
const studentGradeGroups = computed(() => {
  const enrolled = enrolledStudents.value
    .map((e) => e.student)
    .filter(Boolean) as NonNullable<(typeof enrolledStudents.value)[number]['student']>[]

  // 过滤：有搜索词时只保留匹配的
  const q = totalSearch.value.trim().toLowerCase()
  const filtered = q
    ? enrolled.filter((s) => s.name.toLowerCase().includes(q))
    : enrolled

  // 按首字母分组
  const groups = new Map<string, typeof filtered>()
  for (const student of filtered) {
    const initial = getStudentInitial(student.name)
    if (!groups.has(initial)) groups.set(initial, [])
    groups.get(initial)!.push(student)
  }

  // 排序
  const sorted = Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
  return sorted.map(([initial, students]) => ({
    initial,
    students: students.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
  }))
})
const examInputs = ref<Record<string, number>>({})
const selectedStudentIds = ref<string[]>([])
/** 教师/导师评价输入 */
const evalScoreInputs = ref<Record<string, number>>({})
/** 评价学生搜索 */
const evalStudentSearch = ref('')

/** 当前评价轮次 */
const selectedBatchSession = ref(1)

// ---- 计算属性 ----
const myCourses = computed(() => store.courses.filter((c) => c.teacher === store.currentUser))
const selectedConfig = computed(() => courseId.value ? store.evalConfigs.find((c) => c.courseId === courseId.value) : null)
const baseEnabledTypes = computed<EvalType[]>(() => selectedConfig.value ? TEMPLATE_EVAL_TYPES[selectedConfig.value.template] : [])
const totalSessions = computed(() => courseId.value ? store.getEvalSessions(courseId.value) : 1)
const courseHasGroups = computed(() => courseId.value ? store.hasGroups(courseId.value) : false)

// ---- 评价管理 ----

/** 学生搜索过滤 + 按组排列 */
const evalTableSections = computed(() => {
  if (!courseId.value) return []
  const session = selectedBatchSession.value
  const search = evalStudentSearch.value.trim().toLowerCase()

  // 所有未退课学生
  const enrolled = store.enrollments
    .filter((e) => e.courseId === courseId.value && e.status !== 'dropped')
    .map((e) => store.students.find((s) => s.id === e.studentId))
    .filter(Boolean) as NonNullable<ReturnType<typeof store.students.find>>[]

  // 搜索过滤
  const filtered = search
    ? enrolled.filter((s) => s.name.toLowerCase().includes(search))
    : enrolled

  // 获取课程分组
  const groups = store.studentGroups.filter((g) => g.courseId === courseId.value)
  const memberToGroup = new Map<string, string>()
  for (const g of groups) {
    for (const mid of g.memberIds) {
      memberToGroup.set(mid, g.name)
    }
  }

  // 按组归类
  const groupedMap = new Map<string, typeof filtered>()
  const ungrouped: typeof filtered = []
  for (const s of filtered) {
    const groupName = memberToGroup.get(s.id)
    if (groupName) {
      if (!groupedMap.has(groupName)) groupedMap.set(groupName, [])
      groupedMap.get(groupName)!.push(s)
    } else {
      ungrouped.push(s)
    }
  }

  // 构建每行数据
  function buildRow(student: typeof filtered[number]) {
    const evals = store.evaluations.filter(
      (e) => e.courseId === courseId.value && e.studentId === student.id && e.sessionNumber === session
    )
    const getScore = (type: EvalType) => {
      const found = evals.filter((e) => e.type === type)
      if (found.length === 0) return null
      return Math.round(found.reduce((a, e) => a + e.score, 0) / found.length)
    }
    const submitted = store.isSessionLocked(courseId.value || '', session) ||
      store.isTeacherEvalSubmitted(courseId.value || '', student.id, session, 'teacher')
    const draftEvals = evals.filter((e) => e.type === 'teacher')
    return {
      student,
      selfScore: getScore('self'),
      intraScore: getScore('intra_group'),
      interScore: getScore('inter_group'),
      teacherScore: getScore('teacher'),
      mentorScore: getScore('mentor'),
      submitted,
      hasDraft: !submitted && draftEvals.length > 0,
      finalScore: store.getSubmittedTeacherScore(courseId.value || '', student.id, session, 'teacher') ?? '-',
    }
  }

  // 组装 section
  const sections: { groupName: string; students: ReturnType<typeof buildRow>[] }[] = []
  for (const [name, members] of groupedMap) {
    sections.push({ groupName: name, students: members.map(buildRow) })
  }
  if (ungrouped.length > 0) {
    sections.push({ groupName: '未分组', students: ungrouped.map(buildRow) })
  }
  return sections
})

const hasEvalInputs = computed(() => Object.keys(evalScoreInputs.value).length > 0)

// 全选/反选
const isAllSelected = computed(() => {
  const total = evalTableSections.value.reduce((a, s) => a + s.students.length, 0)
  return total > 0 && selectedStudentIds.value.length === total
})

// ---- 成绩管理 computed ----
const examNames = computed(() => {
  if (!courseId.value) return []
  return store.getExamNames(courseId.value)
})

/** 按类型分组的考试/项目 */
const examsByType = computed(() => {
  if (!courseId.value) return []
  const names = examNames.value
  const map = new Map<string, string[]>()
  for (const name of names) {
    const type = getExamTypeForName(name)
    if (!map.has(type)) map.set(type, [])
    map.get(type)!.push(name)
  }
  return Array.from(map.entries()).map(([type, exams]) => ({ type, exams }))
})

/** 获取某个考试类型的权重标签（从 GradeConfig 中读取） */
function getTypeWeightLabel(type: string): string {
  if (!courseId.value) return '-'
  const cfg = store.getGradeConfig(courseId.value)
  if (type === 'midterm_exam' || type === 'midterm_project') {
    return `${cfg.midtermWeight}%`
  }
  if (type === 'final_exam' || type === 'final_project') {
    return `${cfg.finalWeight}%`
  }
  return `${cfg.regularWeight}%`
}

const currentExamFullScore = computed(() => {
  if (!courseId.value || !selectedExam.value) return 100
  const scores = store.getExamScoresForCourse(courseId.value, selectedExam.value)
  return scores.length > 0 ? scores[0].fullScore : 100
})

const currentExamWeight = computed(() => {
  if (!courseId.value || !selectedExam.value) return 0
  return store.getExamWeight(courseId.value, selectedExam.value)
})

const filteredGradeStudents = computed(() => {
  if (!selectedExam.value) return []
  let list = enrolledStudents.value
  if (gradeSearch.value.trim()) {
    const q = gradeSearch.value.trim().toLowerCase()
    list = list.filter(({ student }) =>
      student && (student.name.toLowerCase().includes(q) || student.id.toLowerCase().includes(q))
    )
  }
  return list
})

const hasExamInputs = computed(() => Object.keys(examInputs.value).length > 0)

const submittedExamCount = computed(() => {
  if (!courseId.value || !selectedExam.value) return 0
  return store.getExamScoresForCourse(courseId.value, selectedExam.value)
    .filter((s) => s.status === 'submitted').length
})

const pendingExamSubmits = computed(() => {
  if (!courseId.value || !selectedExam.value) return 0
  return filteredGradeStudents.value.filter(({ student }) => {
    if (!student) return false
    const score = store.getExamScoresForCourse(courseId.value, selectedExam.value)
      .find((s) => s.studentId === student.id)
    return score && score.status === 'draft'
  }).length
})

function getStudentExamScore(studentId: string): number | null {
  if (!courseId.value || !selectedExam.value) return null
  const score = store.getExamScoresForCourse(courseId.value, selectedExam.value)
    .find((s) => s.studentId === studentId)
  return score?.score ?? null
}

function isExamSubmitted(studentId: string): boolean {
  if (!courseId.value || !selectedExam.value) return false
  const score = store.getExamScoresForCourse(courseId.value, selectedExam.value)
    .find((s) => s.studentId === studentId)
  return score?.status === 'submitted'
}

/** 获取该学生当前选中考试的百分制成绩 */
function getStudentExamPercent(studentId: string): string {
  if (!courseId.value || !selectedExam.value) return '-'
  const score = store.getExamScoresForCourse(courseId.value, selectedExam.value)
    .find((s) => s.studentId === studentId)
  if (!score) return '-'
  return `${Math.round((score.score / score.fullScore) * 100)}分`
}

/** 从 store 获取某个考试/项目的权重 */
function getExamWeightFromConfig(examName: string): number {
  if (!courseId.value) return 0
  return store.getExamWeight(courseId.value, examName)
}

/** 权重总和（基于类型权重） */
const examWeightTotal = computed(() => {
  if (!courseId.value) return 0
  const cfg = store.getGradeConfig(courseId.value)
  return cfg.midtermWeight + cfg.finalWeight + cfg.regularWeight
})

/** 修改权重 */
function handleWeightChange(examName: string, weight: number) {
  if (!courseId.value || isReadOnly.value) return
  store.setExamWeight(courseId.value, examName, weight)
}

/** 获取某个考试/项目的类型 */
function getExamTypeForName(examName: string): string {
  if (!courseId.value) return 'midterm_exam'
  const scores = store.getExamScoresForCourse(courseId.value, examName)
  return scores.length > 0 ? scores[0].type : 'midterm_exam'
}

/** 判断是否为期末考试/期末项目类型 */
function isFinalExamType(examName: string): boolean {
  const type = getExamTypeForName(examName)
  return type === 'final_exam' || type === 'final_project'
}

/** 选择考试/项目：如果是期末类型且权重未配置，弹出提醒 */
function handleSelectExam(name: string) {
  if (!courseId.value) return
  // 如果是期末类型且权重未配置完成，弹出提醒
  if (isFinalExamType(name) && !isWeightLocked.value) {
    const gradeConfig = store.getGradeConfig(courseId.value)
    const isConfigDefault =
      gradeConfig.regularWeight === 40 && gradeConfig.midtermWeight === 0 && gradeConfig.finalWeight === 60
    if (isConfigDefault) {
      // 使用默认值（未配置），弹出提醒
      showWeightReminderModal.value = true
      pendingFinalExamSelect.value = name
      return
    }
  }
  // 直接选中
  selectedExam.value = name
}

/** 从提醒弹窗打开权重配置 */
function handleOpenGradeConfigFromReminder() {
  showWeightReminderModal.value = false
  showGradeConfig.value = true
}

function handleAddExam() {
  if (!courseId.value || !newExamName.value.trim()) return
  const name = newExamName.value.trim()
  const type = newExamType.value

  // 期中/期末考试只能创建一次
  if (type === 'midterm_exam' || type === 'final_exam') {
    const existing = store.getExamScoresForCourse(courseId.value)
      .filter((s) => s.type === type)
    if (existing.length > 0) {
      alert(`${type === 'midterm_exam' ? '期中考试' : '期末考试'}已存在，每个学期仅可创建一次`)
      return
    }
  }

  for (const { student } of enrolledStudents.value) {
    if (!student) continue
    const id = `exam-${courseId.value}-${student.id}-${name}-${Date.now()}`
    store.addExamScore({
      id,
      courseId: courseId.value,
      studentId: student.id,
      examName: name,
      score: 0,
      fullScore: newExamFullScore.value,
      weight: 0,
      type,
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
      gradedAt: '',
    })
  }

  // 项目类：自动为该类型的每项分配均分权重
  if (type === 'midterm_project' || type === 'final_project') {
    const sameTypeExams = store.getExamScoresForCourse(courseId.value)
      .filter((s) => s.type === type)
    const uniqueNames = Array.from(new Set(sameTypeExams.map((s) => s.examName)))
    const typeWeight = type === 'midterm_project'
      ? store.getGradeConfig(courseId.value).midtermWeight
      : store.getGradeConfig(courseId.value).finalWeight
    if (uniqueNames.length > 0 && typeWeight > 0) {
      const eachWeight = Math.floor(typeWeight / uniqueNames.length)
      uniqueNames.forEach((examName) => store.setExamWeight(courseId.value!, examName, eachWeight))
    }
  }

  showNewExamModal.value = false
  selectedExam.value = name
  newExamName.value = ''
}

function handleSaveExamScores() {
  if (!courseId.value || !selectedExam.value) return
  // 从已有记录中获取正确的考试类型、满分，权重从配置读取
  const existingScores = store.getExamScoresForCourse(courseId.value, selectedExam.value)
  const examType = existingScores.length > 0
    ? existingScores[0].type
    : 'midterm_exam'
  const examWeight = store.getExamWeight(courseId.value, selectedExam.value)
  Object.entries(examInputs.value).forEach(([studentId, score]) => {
    const existing = existingScores.find((s) => s.studentId === studentId)
    if (existing && existing.status !== 'submitted') {
      store.updateExamScore(existing.id, { score, gradedAt: new Date().toISOString().split('T')[0] })
    } else if (!existing) {
      const id = `exam-${courseId.value}-${studentId}-${selectedExam.value}-${Date.now()}`
      store.addExamScore({
        id,
        courseId: courseId.value,
        studentId,
        examName: selectedExam.value,
        score,
        fullScore: currentExamFullScore.value,
        weight: examWeight,
        type: examType,
        status: 'draft',
        createdAt: new Date().toISOString().split('T')[0],
        gradedAt: '',
      })
    }
  })
  examInputs.value = {}
}

function handleSubmitExamScores() {
  if (!courseId.value || !selectedExam.value) return
  // 先保存未保存的输入
  handleSaveExamScores()
  store.submitExamScores(courseId.value, selectedExam.value)
}

/** 查询学生总成绩 */
/** 获取某学生的加权总分（按类型权重计算，多项目时均分类型权重） */
function getStudentTotalScore(studentId: string): string | number {
  if (!courseId.value) return '-'
  const scores = store.getExamScoresForCourse(courseId.value)
    .filter((s) => s.studentId === studentId && s.status === 'submitted')
  if (scores.length === 0) return '-'
  const gradeConfig = store.getGradeConfig(courseId.value)
  let weightedSum = 0
  let totalWeight = 0
  // 按类型分组，计算每个类型中已配置了单独权重的和未配置的
  const typeGroups = new Map<string, { count: number; sumPercent: number }>()
  for (const s of scores) {
    const w = store.getExamWeight(courseId.value, s.examName)
    const percent = (s.score / s.fullScore) * 100
    if (w > 0) {
      // 已配置单独权重，直接使用
      weightedSum += percent * w
      totalWeight += w
    } else {
      // 未配置单独权重，归入类型组
      if (!typeGroups.has(s.type)) typeGroups.set(s.type, { count: 0, sumPercent: 0 })
      const g = typeGroups.get(s.type)!
      g.count++
      g.sumPercent += percent
    }
  }
  // 应用类型级权重
  for (const [type, g] of typeGroups) {
    let typeWeight = 0
    if (type === 'midterm_exam' || type === 'midterm_project') typeWeight = gradeConfig.midtermWeight
    else if (type === 'final_exam' || type === 'final_project') typeWeight = gradeConfig.finalWeight
    else typeWeight = gradeConfig.regularWeight
    if (typeWeight > 0 && g.count > 0) {
      const avgPercent = g.sumPercent / g.count
      weightedSum += avgPercent * typeWeight
      totalWeight += typeWeight
    }
  }
  if (totalWeight === 0) return '0'
  return Math.round(weightedSum / totalWeight)
}

/** 获取某学生的考试/项目数 */
function getStudentExamCount(studentId: string): number {
  if (!courseId.value) return 0
  return store.getExamScoresForCourse(courseId.value)
    .filter((s) => s.studentId === studentId).length
}

/** 获取某学生的截至当前的平时成绩 */
function getStudentAvgScore(studentId: string): string | number {
  if (!courseId.value) return '-'
  const allEvals = store.evaluations.filter(
    (e) => e.courseId === courseId.value && e.studentId === studentId
  )
  if (allEvals.length === 0) return '-'
  const maxSession = Math.max(...allEvals.map((e) => e.sessionNumber))
  const relevantEvals = allEvals.filter((e) => e.sessionNumber <= maxSession)
  const sum = relevantEvals.reduce((a, e) => a + e.score, 0)
  return Math.round(sum / relevantEvals.length)
}

function getStudentScoreForExam(studentId: string, examName: string): string | number {
  if (!courseId.value) return '-'
  const score = store.getExamScoresForCourse(courseId.value, examName)
    .find((s) => s.studentId === studentId && s.status === 'submitted')
  return score?.score ?? '-'
}

/** Excel 导入 */
async function handleExcelImport(event: Event) {
  if (!courseId.value || !selectedExam.value) return
  // 从已有记录中获取正确的考试类型
  const existingScores = store.getExamScoresForCourse(courseId.value, selectedExam.value)
  const examType = existingScores.length > 0
    ? existingScores[0].type
    : 'midterm_exam'
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]
  try {
    const buf = await file.arrayBuffer()
    const XLSX = await import('xlsx')
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data: Record<string, string>[] = XLSX.utils.sheet_to_json(ws)
    // 期望格式：第一列是学生姓名/学号，第二列是成绩
    const keys = Object.keys(data[0] || {})
    if (keys.length < 2) {
      alert('Excel 格式不正确，请确保第一列为学生姓名/学号，第二列为成绩')
      return
    }
    const nameKey = keys[0]
    const scoreKey = keys[1]
    let imported = 0
    for (const row of data) {
      const name = String(row[nameKey] || '').trim().toLowerCase()
      const rawScore = parseFloat(String(row[scoreKey] || '').trim())
      if (isNaN(rawScore) || !name) continue
      const student = store.students.find(
        (s) => s.name.toLowerCase() === name || s.id.toLowerCase() === name
      )
      if (!student) continue
      const existing = existingScores.find((s) => s.studentId === student.id)
      const score = Math.min(currentExamFullScore.value, Math.max(0, rawScore))
      if (existing && existing.status !== 'submitted') {
        store.updateExamScore(existing.id, { score, gradedAt: new Date().toISOString().split('T')[0] })
      } else if (!existing) {
        store.addExamScore({
          id: `exam-${courseId.value}-${student.id}-${selectedExam.value}-${Date.now()}`,
          courseId: courseId.value,
          studentId: student.id,
          examName: selectedExam.value,
          score,
          fullScore: currentExamFullScore.value,
          weight: currentExamWeight.value,
          type: examType,
          status: 'draft',
          createdAt: new Date().toISOString().split('T')[0],
          gradedAt: '',
        })
      }
      imported++
    }
    alert(`导入成功！共导入 ${imported} 名学生的成绩`)
    input.value = ''
  } catch (err) {
    console.error('Excel 导入失败:', err)
    alert('Excel 导入失败，请检查文件格式')
    input.value = ''
  }
}

/** 下载 Excel 导入模板 */
async function handleDownloadTemplate() {
  if (!courseId.value || !selectedExam.value) {
    alert('请先选择一个考试/项目')
    return
  }
  try {
    const XLSX = await import('xlsx')
    const data = enrolledStudents.value.map(({ student }) => ({
      '学生姓名': student!.name,
      '学生学号': student!.id,
      [selectedExam.value]: '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '成绩')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buf], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedExam.value}-成绩模板.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('下载模板失败:', err)
    alert('下载模板失败')
  }
}

const enabledTypes = computed(() => baseEnabledTypes.value.filter((t) => {
  if ((t === 'intra_group' || t === 'inter_group') && !courseHasGroups.value) return false
  if (t === 'mentor' && !selectedConfig.value?.hasMentor) return false
  return true
}))

const filteredEvalTypes = computed(() => enabledTypes.value.filter((t) => true)) // no filter needed

const displaySessions = computed(() => {
  const count = Math.min(totalSessions.value, 3)
  return Array.from({ length: count }, (_, i) => i + 1)
})

// 课程学生（未退课）
const enrolledStudents = computed(() => {
  if (!courseId.value) return []
  return store.enrollments
    .filter((e) => e.courseId === courseId.value && e.status !== 'dropped')
    .map((e) => ({
      enrollmentId: e.id,
      student: store.students.find((s) => s.id === e.studentId),
    }))
    .filter((e) => e.student)
})

/** 以组为单位的学生列表（包含分组信息和成员） */
const studentSections = computed(() => {
  if (!courseId.value) return []
  const search = studentSearch.value.trim().toLowerCase()

  // 所有未退课学生
  const enrolled = store.enrollments
    .filter((e) => e.courseId === courseId.value && e.status !== 'dropped')
    .map((e) => ({
      enrollmentId: e.id,
      student: store.students.find((s) => s.id === e.studentId),
    }))
    .filter((e) => e.student) as { enrollmentId: string; student: NonNullable<ReturnType<typeof store.students.find>> }[]

  // 搜索过滤
  const filtered = search
    ? enrolled.filter(({ student }) => student.name.toLowerCase().includes(search) || student.id.includes(search))
    : enrolled

  // 获取课程分组
  const groups = store.studentGroups.filter((g) => g.courseId === courseId.value)
  const memberToGroup = new Map<string, string>()
  const groupIdMap = new Map<string, string>()
  for (const g of groups) {
    for (const mid of g.memberIds) {
      memberToGroup.set(mid, g.name)
      groupIdMap.set(mid, g.id)
    }
  }

  // 按组归类
  const groupedMap = new Map<string, { groupId: string; students: typeof filtered }>()
  const ungrouped: typeof filtered = []
  for (const item of filtered) {
    const groupName = memberToGroup.get(item.student.id)
    const groupId = groupIdMap.get(item.student.id) || ''
    if (groupName && groupId) {
      if (!groupedMap.has(groupName)) groupedMap.set(groupName, { groupId, students: [] })
      groupedMap.get(groupName)!.students.push(item)
    } else {
      ungrouped.push(item)
    }
  }

  // 组装 sections
  const sections: { groupId: string; groupName: string; students: typeof filtered }[] = []
  for (const g of groups) {
    const entry = groupedMap.get(g.name)
    if (entry) {
      sections.push({ groupId: g.id, groupName: g.name, students: entry.students })
      groupedMap.delete(g.name)
    } else {
      sections.push({ groupId: g.id, groupName: g.name, students: [] })
    }
  }
  if (ungrouped.length > 0) {
    sections.push({ groupId: '', groupName: '未分组', students: ungrouped })
  }
  return sections
})

// ---- 评价数据 ----
function getStudentEvals(studentId: string, sessionNumber?: number, type?: EvalType): Evaluation[] {
  return store.evaluations.filter((e) => {
    if (e.courseId !== courseId.value || e.studentId !== studentId) return false
    if (sessionNumber && e.sessionNumber !== sessionNumber) return false
    if (type && e.type !== type) return false
    return true
  })
}

function getStudentEvalCount(studentId: string): number {
  return store.evaluations.filter((e) => e.courseId === courseId.value && e.studentId === studentId && e.type === 'self').length
}

function getAvgScore(studentId: string, sessionNumber: number, type: EvalType): number | null {
  const evals = getStudentEvals(studentId, sessionNumber, type)
  if (evals.length === 0) return null
  return Math.round(evals.reduce((a, e) => a + e.score, 0) / evals.length)
}

function getScoreDisplay(studentId: string, sessionNumber: number, type: EvalType): string {
  const v = getAvgScore(studentId, sessionNumber, type)
  return v !== null ? `${v}分` : '-'
}

function scoreCellClass(studentId: string, sessionNumber: number, type: EvalType): string {
  const v = getAvgScore(studentId, sessionNumber, type)
  if (v === null) return 'text-gray-300'
  if (v >= 85) return 'text-emerald-600'
  if (v >= 60) return 'text-blue-600'
  return 'text-red-500'
}

function getStudentTotalAvg(studentId: string): string {
  let total = 0; let count = 0
  displaySessions.value.forEach((s) => {
    filteredEvalTypes.value.forEach((t) => {
      const v = getAvgScore(studentId, s, t)
      if (v !== null) { total += v; count++ }
    })
  })
  return count > 0 ? `${Math.round(total / count)}分` : '-'
}

function totalScoreColor(val: string | number): string {
  if (val === '-') return '#9ca3af'
  const n = parseInt(String(val))
  if (n >= 85) return '#059669'
  if (n >= 60) return '#2563eb'
  return '#dc2626'
}

// 选课状态
function getEnrollStatus(studentId: string): { label: string; color: string; progress: number } {
  const enr = store.enrollments.find((e) => e.courseId === courseId.value && e.studentId === studentId)
  if (!enr) return { label: '未知', color: 'bg-gray-50 text-gray-500', progress: 0 }
  const map: Record<string, { label: string; color: string }> = {
    enrolled:     { label: '已报名',    color: 'bg-blue-50 text-blue-600' },
    in_progress:  { label: '学习中',    color: 'bg-amber-50 text-amber-600' },
    completed:    { label: '已完成',    color: 'bg-emerald-50 text-emerald-600' },
    dropped:      { label: '已退课',    color: 'bg-red-50 text-red-600' },
  }
  return { ...map[enr.status] || { label: '未知', color: 'bg-gray-50 text-gray-500' }, progress: enr.progress || 0 }
}

// ---- 操作 ----
const handleSetConfig = (updates: Partial<import('@/types').EvaluationConfig>) => {
  if (!courseId.value) return
  const existing = store.evalConfigs.find((c) => c.courseId === courseId.value)
  const config = {
    courseId: courseId.value,
    template: existing?.template || 'standard',
    frequency: existing?.frequency || 'biweekly',
    hasMentor: existing?.hasMentor ?? false,
    overdueRule: existing?.overdueRule || 'average',
    ...existing,
    ...updates,
  }
  store.setEvalConfig(config)
  store.markConfigCompleted(courseId.value, 'evalConfig')
}

const handleBatchEval = (level: string) => {
  if (!courseId.value) return
  const range = LEVEL_OPTIONS.find((o) => o.label === level)?.range
  if (!range) return
  const score = Math.round((range[0] + range[1]) / 2)
  const session = selectedBatchSession.value
  const type: EvalType = 'teacher'

  // 只给选中的学生批量打分（跳过已提交的）
  selectedStudentIds.value.forEach((studentId) => {
    if (store.isSessionLocked(courseId.value || '', session) ||
        store.isTeacherEvalSubmitted(courseId.value || '', studentId, session, type)) return
    const existing = store.evaluations.find(
      (e) => e.courseId === courseId.value && e.studentId === studentId && e.type === type && e.sessionNumber === session
    )
    const ev: Evaluation = {
      id: existing ? existing.id : `ev-batch-${Date.now()}-${studentId}-${type}`,
      courseId: courseId.value,
      studentId,
      sessionNumber: session,
      type,
      score,
      evaluatorId: store.currentUser || 'teacher',
      evaluatorName: store.currentUser || '教师',
      comment: level,
      createdAt: new Date().toISOString().split('T')[0],
    }
    if (existing) {
      store.updateEvaluation(ev.id, { score, comment: level, createdAt: ev.createdAt })
    } else {
      store.addEvaluation(ev)
    }
  })
  // 清空输入缓存，防止后续"保存评分"覆盖批量结果
  evalScoreInputs.value = {}
  // 标记该轮次所有评价提醒为已完成
  store.markSessionEvalRemindersCompleted(courseId.value, session)
}

/** 保存教师评价评分（单条输入） */
function handleSaveEvalScores() {
  if (!courseId.value) return
  const session = selectedBatchSession.value
  const type: EvalType = 'teacher'
  Object.entries(evalScoreInputs.value).forEach(([studentId, score]) => {
    if (store.isSessionLocked(courseId.value || '', session) ||
        store.isTeacherEvalSubmitted(courseId.value || '', studentId, session, type)) return
    const existing = store.evaluations.find(
      (e) => e.courseId === courseId.value && e.studentId === studentId && e.type === type && e.sessionNumber === session
    )
    const ev: Evaluation = {
      id: existing ? existing.id : `ev-manual-${Date.now()}-${studentId}-${type}`,
      courseId: courseId.value,
      studentId,
      sessionNumber: session,
      type,
      score,
      evaluatorId: store.currentUser || 'teacher',
      evaluatorName: store.currentUser || '教师',
      createdAt: new Date().toISOString().split('T')[0],
    }
    if (existing) {
      store.updateEvaluation(ev.id, { score, createdAt: ev.createdAt })
    } else {
      store.addEvaluation(ev)
    }
  })
  evalScoreInputs.value = {}
}

// ---- 提交所有保存的评价（提交后不可修改） ----
function handleSubmitAll() {
  if (!courseId.value) return
  const session = selectedBatchSession.value
  const type: EvalType = 'teacher'

  // 先保存所有输入的评分
  handleSaveEvalScores()

  // 标记所有有评价的学生为已提交
  const allStudents = store.enrollments
    .filter((e) => e.courseId === courseId.value && e.status !== 'dropped')
    .map((e) => e.studentId)
  for (const studentId of allStudents) {
    if (store.isSessionLocked(courseId.value || '', session) ||
        store.isTeacherEvalSubmitted(courseId.value || '', studentId, session, type)) continue
    const hasEval = store.evaluations.some(
      (e) => e.courseId === courseId.value && e.studentId === studentId && e.type === type && e.sessionNumber === session
    )
    if (hasEval) {
      store.submitTeacherEval(courseId.value, studentId, session, type)
    }
  }

  // 标记该轮次所有评价提醒为已完成
  store.markSessionEvalRemindersCompleted(courseId.value, session)
}

// ---- 全选/反选 ----
const toggleAll = () => {
  if (isAllSelected.value) {
    selectedStudentIds.value = []
  } else {
    const allIds: string[] = []
    for (const section of evalTableSections.value) {
      for (const s of section.students) {
        if (!s.submitted) allIds.push(s.student.id)
      }
    }
    selectedStudentIds.value = allIds
  }
}

const selectedUnsubmittedCount = computed(() => {
  return selectedStudentIds.value.length
})

// ---- 评价轮次锁定与时机 ----

/** 选择评价轮次：自动锁定上一轮并处理逾期 */
function handleSessionSelect(session: number) {
  if (!courseId.value) return
  // 自动锁定上一轮（触发逾期处理）
  store.autoLockPreviousSession(courseId.value, session)
  selectedBatchSession.value = session
}

/** 某轮次是否不可选（已锁定 / 未到上课时间 / 最终轮次超期） */
function isSessionDisabled(session: number): boolean {
  if (!courseId.value) return true
  if (store.isSessionLocked(courseId.value, session)) return true
  if (!store.isSessionTime(courseId.value, session)) return true
  if (session === totalSessions.value && isFinalSessionExpired.value) return true
  return false
}

/** 某轮次是否已到上课时间 */
function isSessionTime(session: number): boolean {
  if (!courseId.value) return true
  return store.isSessionTime(courseId.value, session)
}

/** 最终轮次是否已过截止期 */
const isFinalSessionExpired = computed(() => {
  if (!courseId.value) return false
  return store.isFinalSessionDeadlinePassed(courseId.value, totalSessions.value)
})

/** 轮次按钮 tooltip */
function getSessionTitle(session: number): string {
  if (!courseId.value) return ''
  if (store.isSessionLocked(courseId.value, session)) return '该轮次已锁定，不可修改'
  if (!store.isSessionTime(courseId.value, session)) return session === 1 ? '第一节课尚未开始' : '该轮次尚未到开启时间'
  if (session === totalSessions.value && isFinalSessionExpired.value) return '课程已结束，最终评价已截止'
  return ''
}

/** 当前轮次是否有可提交的评分 */
const hasSubmittable = computed(() => submittableCount.value > 0)

const submittableCount = computed(() => {
  const session = selectedBatchSession.value
  const type: EvalType = 'teacher'
  let count = 0
  for (const section of evalTableSections.value) {
    for (const s of section.students) {
      if (s.submitted) continue
      if (s.hasDraft) count++
    }
  }
  return count
})

// ---- 逾期处理 ----
const handleProcessOverdue = () => {
  if (!courseId.value) return
  for (let s = 1; s <= totalSessions.value; s++) {
    store.processSessionOverdue(courseId.value, s)
  }
  // 标记逾期学生自评提醒为已完成
  const students = enrolledStudents.value.map(({ student }) => student).filter(Boolean)
  for (const s of students) {
    for (let sn = 1; sn <= totalSessions.value; sn++) {
      store.markEvalReminderCompleted(courseId.value, s!.id, sn)
    }
  }
}

/** 获取学生姓名 */
function getStudentName(studentId: string): string {
  const student = store.students.find((s) => s.id === studentId)
  return student?.name || studentId
}

/** 获取学生所在组名 */
function getStudentGroupId(studentId: string): string | null {
  for (const g of store.studentGroups) {
    if (g.memberIds.includes(studentId)) return g.id
  }
  return null
}

/** 从分组中移除学生 */
function handleRemoveStudentFromGroup(studentId: string) {
  for (const g of store.studentGroups) {
    if (g.memberIds.includes(studentId)) {
      store.updateStudentGroup(g.id, {
        memberIds: g.memberIds.filter((id) => id !== studentId),
      })
      break
    }
  }
}

/** 编辑学生 - 打开弹窗 */
function handleEditStudent(student: import('@/types').Student) {
  editingStudent.value = student
  editStudentName.value = student.name
  editStudentIdField.value = student.id
  // 查找学生当前所在分组
  const group = store.studentGroups.find(g => g.courseId === courseId.value && g.memberIds.includes(student.id))
  editStudentGroupId.value = group?.id || ''
  showEditStudentModal.value = true
}

/** 编辑学生 - 保存 */
function handleSaveEditStudent() {
  if (!editingStudent.value || !editStudentName.value.trim()) return
  const student = editingStudent.value
  const newId = editStudentIdField.value.trim() || student.id
  // 如果学号变了，检查是否已被占用
  if (newId !== student.id && store.students.some((s) => s.id === newId)) {
    alert('该学号已被其他学生使用')
    return
  }
  const oldId = student.id
  // 更新学生信息
  store.updateStudent(oldId, { name: editStudentName.value.trim(), id: newId })

  // 如果学号变化，级联更新所有关联数据
  if (newId !== oldId) {
    // 更新选课记录
    store.enrollments.forEach((e) => {
      if (e.studentId === oldId) {
        store.updateEnrollment(e.id, { studentId: newId })
      }
    })
    // 更新评价记录（学生评价和教师评价）
    store.evaluations.forEach((ev) => {
      if (ev.studentId === oldId) {
        store.updateEvaluation(ev.id, { studentId: newId })
      }
      if (ev.evaluatorId === oldId) {
        store.updateEvaluation(ev.id, { evaluatorId: newId })
      }
    })
    // 更新考试成绩
    const examScores = (store as any).examScores?.value || []
    examScores.forEach((s: any) => {
      if (s.studentId === oldId) {
        ;(store as any).examScores.value = examScores.map((es: any) =>
          es.id === s.id ? { ...es, studentId: newId } : es
        )
      }
    })
    // 更新评价提醒
    const evalReminders = (store as any).evalReminders?.value || []
    ;(store as any).evalReminders.value = evalReminders.map((r: any) => {
      if (r.studentId === oldId) return { ...r, studentId: newId }
      return r
    })
    // 更新分组中的成员 ID
    store.studentGroups.forEach((g) => {
      if (g.memberIds.includes(oldId)) {
        store.updateStudentGroup(g.id, {
          memberIds: g.memberIds.map((id) => (id === oldId ? newId : id)),
        })
      }
    })
    // 持久化 examScores 和 evalReminders
    try {
      localStorage.setItem('examScores', JSON.stringify((store as any).examScores?.value || []))
      localStorage.setItem('evalReminders', JSON.stringify((store as any).evalReminders?.value || []))
    } catch {}
  }

  // 处理分组归属变更
  const currentGroup = store.studentGroups.find(g => g.courseId === courseId.value && g.memberIds.includes(newId))
  const currentGroupId = currentGroup?.id || ''
  if (currentGroupId !== editStudentGroupId.value) {
    // 从旧分组移除
    if (currentGroupId) {
      store.updateStudentGroup(currentGroupId, {
        memberIds: currentGroup!.memberIds.filter((id) => id !== newId),
      })
    }
    // 加入新分组
    if (editStudentGroupId.value) {
      const newGroup = store.studentGroups.find((g) => g.id === editStudentGroupId.value)
      if (newGroup) {
        store.updateStudentGroup(newGroup.id, {
          memberIds: [...newGroup.memberIds, newId],
        })
      }
    }
  }

  showEditStudentModal.value = false
  editingStudent.value = null
  editStudentName.value = ''
  editStudentIdField.value = ''
  editStudentGroupId.value = ''
}

/** 移除学生（退课 + 清理分组） */
function handleRemoveStudent(studentId: string) {
  if (!courseId.value) return
  if (!confirm('确定将该学生删除并从课程中移除？')) return
  // 从分组中移除
  handleRemoveStudentFromGroup(studentId)
  // 删除选课记录
  const enrollment = store.enrollments.find(
    (e) => e.courseId === courseId.value && e.studentId === studentId && e.status !== 'dropped'
  )
  if (enrollment) {
    store.deleteEnrollment(enrollment.id)
  }
}

/** 添加单个学生 */
function handleAddSingleStudent() {
  if (!courseId.value || !newStudentName.value.trim()) return
  const name = newStudentName.value.trim()
  // 查找或创建学生
  let student = store.students.find((s) => s.name === name || (newStudentId.value.trim() && s.id === newStudentId.value.trim()))
  if (!student) {
    const id = newStudentId.value.trim() || `stu-${Date.now()}`
    store.addStudent({ id, name, phone: '', email: '', avatar: '', joinDate: new Date().toISOString().split('T')[0], status: 'active' })
    student = store.students.find((s) => s.id === id)!
  }
  // 检查是否已选课
  const exists = store.enrollments.some(
    (e) => e.courseId === courseId.value && e.studentId === student!.id && e.status !== 'dropped'
  )
  if (exists) {
    alert('该学生已在课程中')
    return
  }
  store.addEnrollment({
    id: `enr-${courseId.value}-${student!.id}-${Date.now()}`,
    courseId: courseId.value,
    studentId: student!.id,
    scheduleId: '',
    status: 'enrolled',
    progress: 0,
    enrollDate: new Date().toISOString().split('T')[0],
  })
  showAddStudentModal.value = false
  newStudentName.value = ''
  newStudentId.value = ''
}

/** Excel 导入学生 */
async function handleImportStudentsExcel(event: Event) {
  if (!courseId.value) return
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]
  try {
    const buf = await file.arrayBuffer()
    const XLSX = await import('xlsx')
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data: Record<string, string>[] = XLSX.utils.sheet_to_json(ws)
    const keys = Object.keys(data[0] || {})
    if (keys.length < 1) {
      alert('Excel 格式不正确，请确保第一列为学生姓名')
      return
    }
    const nameKey = keys[0]
    const idKey = keys.length >= 2 ? keys[1] : null
    let imported = 0
    for (const row of data) {
      const name = String(row[nameKey] || '').trim()
      if (!name) continue
      const rawId = idKey ? String(row[idKey] || '').trim() : ''
      let student = rawId
        ? store.students.find((s) => s.id === rawId || s.name === name)
        : store.students.find((s) => s.name === name)
      if (!student) {
        const id = rawId || `stu-${Date.now()}-${imported}`
        store.addStudent({ id, name, phone: '', email: '', avatar: '', joinDate: new Date().toISOString().split('T')[0], status: 'active' })
        student = store.students.find((s) => s.id === id)!
      }
      const exists = store.enrollments.some(
        (e) => e.courseId === courseId.value && e.studentId === student!.id && e.status !== 'dropped'
      )
      if (exists) continue
      store.addEnrollment({
        id: `enr-${courseId.value}-${student!.id}-${Date.now()}-${imported}`,
        courseId: courseId.value,
        studentId: student!.id,
        scheduleId: '',
        status: 'enrolled',
        progress: 0,
        enrollDate: new Date().toISOString().split('T')[0],
      })
      imported++
    }
    alert(`导入成功！共导入 ${imported} 名学生`)
  } catch (err) {
    console.error('Excel 导入失败:', err)
    alert('Excel 导入失败，请检查文件格式')
  }
  input.value = ''
}

// ====== 学生管理：分组管理 ======

/** 打开新建分组弹窗 */
function openNewGroupModal() {
  editingGroup.value = null
  groupFormName.value = ''
  groupFormMembers.value = []
  showGroupModal.value = true
}

/** 打开编辑分组弹窗 */
function openEditGroupModal(group: import('@/types').StudentGroup) {
  editingGroup.value = group
  groupFormName.value = group.name
  groupFormMembers.value = [...group.memberIds]
  showGroupModal.value = true
}

/** 保存分组（新建或编辑） */
function handleSaveGroup() {
  if (!courseId.value || !groupFormName.value.trim()) {
    alert('请输入组名')
    return
  }
  const name = groupFormName.value.trim()
  if (editingGroup.value) {
    store.updateStudentGroup(editingGroup.value.id, {
      name,
      memberIds: groupFormMembers.value,
    })
  } else {
    store.addStudentGroup({
      id: `group-${courseId.value}-${Date.now()}`,
      courseId: courseId.value,
      name,
      memberIds: groupFormMembers.value,
    })
  }
  showGroupModal.value = false
  editingGroup.value = null
  groupFormName.value = ''
  groupFormMembers.value = []
}

/** 删除分组 */
function handleDeleteGroup(groupId: string) {
  if (!confirm('确定删除该分组？')) return
  store.deleteStudentGroup(groupId)
}

/** Excel 导入分组 */
async function handleImportGroupsExcel(event: Event) {
  if (!courseId.value) return
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]
  try {
    const buf = await file.arrayBuffer()
    const XLSX = await import('xlsx')
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data: Record<string, string>[] = XLSX.utils.sheet_to_json(ws)
    const keys = Object.keys(data[0] || {})
    if (keys.length < 2) {
      alert('Excel 格式不正确，请确保第一列为组名，第二列及之后为学生姓名/学号')
      return
    }
    const groupNameKey = keys[0]
    // 按组名聚合成员
    const groupMap = new Map<string, string[]>()
    for (const row of data) {
      const groupName = String(row[groupNameKey] || '').trim()
      if (!groupName) continue
      for (let i = 1; i < keys.length; i++) {
        const studentRef = String(row[keys[i]] || '').trim()
        if (!studentRef) continue
        if (!groupMap.has(groupName)) groupMap.set(groupName, [])
        const student = store.students.find(
          (s) => s.name === studentRef || s.id === studentRef
        )
        if (student) {
          groupMap.get(groupName)!.push(student.id)
        }
      }
    }
    let imported = 0
    for (const [name, memberIds] of groupMap) {
      const existing = store.studentGroups.find(
        (g) => g.courseId === courseId.value && g.name === name
      )
      if (existing) {
        const merged = Array.from(new Set([...existing.memberIds, ...memberIds]))
        store.updateStudentGroup(existing.id, { memberIds: merged })
      } else {
        store.addStudentGroup({
          id: `group-${courseId.value}-${Date.now()}-${imported}`,
          courseId: courseId.value,
          name,
          memberIds: Array.from(new Set(memberIds)),
        })
      }
      imported++
    }
    alert(`导入成功！共导入 ${imported} 个分组`)
  } catch (err) {
    console.error('Excel 导入失败:', err)
    alert('Excel 导入失败，请检查文件格式')
  }
  input.value = ''
}
</script>
