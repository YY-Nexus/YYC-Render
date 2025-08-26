export interface LearningStep {
  id: string;
  title: string;
  description: string;
  type: "reading" | "video" | "exercise" | "project" | "quiz";
  estimatedMinutes: number;
  completed: boolean;
  completedAt?: number;
  resources: Array<{
    title: string;
    url: string;
    type: "article" | "video" | "document" | "website";
  }>;
  notes?: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  progress: number;
  steps: LearningStep[];
  createdAt: number;
  updatedAt: number;
  tags: string[];
  author: string;
  isPublic: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: "milestone" | "streak" | "completion" | "social";
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
  target: number;
  reward?: {
    type: "badge" | "points" | "feature";
    value: string | number;
  };
}

export interface LearningStats {
  totalPaths: number;
  completedPaths: number;
  completedSteps: number;
  totalHours: number;
  achievementsCount: number;
  currentStreak: number;
  longestStreak: number;
  categoryStats: Array<{
    name: string;
    count: number;
    completedCount: number;
  }>;
  recentActivities: Array<{
    type: "started" | "completed" | "achievement";
    description: string;
    timestamp: number;
  }>;
  recommendations: string[];
}

export class LearningManager {
  private static readonly STORAGE_KEY = "learning_data";
  private static readonly PATHS_KEY = "learning_paths";
  private static readonly ACHIEVEMENTS_KEY = "achievements";
  private static readonly STATS_KEY = "learning_stats";

  // 获取学习路径
  static async getLearningPaths(): Promise<LearningPath[]> {
    try {
      const stored = localStorage.getItem(this.PATHS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // 返回默认示例数据
      const defaultPaths = this.getDefaultPaths();
      await this.saveLearningPaths(defaultPaths);
      return defaultPaths;
    } catch (error) {
      console.error("获取学习路径失败:", error);
      return this.getDefaultPaths();
    }
  }

  // 保存学习路径
  static async saveLearningPaths(paths: LearningPath[]): Promise<void> {
    try {
      localStorage.setItem(this.PATHS_KEY, JSON.stringify(paths));
    } catch (error) {
      console.error("保存学习路径失败:", error);
    }
  }

  // 创建学习路径
  static async createLearningPath(pathData: Omit<LearningPath, "id" | "createdAt" | "updatedAt" | "progress">): Promise<LearningPath> {
    const newPath: LearningPath = {
      ...pathData,
      id: `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const paths = await this.getLearningPaths();
    paths.unshift(newPath);
    await this.saveLearningPaths(paths);

    // 更新统计
    await this.updateStats();
    
    return newPath;
  }

  // 更新学习路径
  static async updateLearningPath(pathId: string, updates: Partial<LearningPath>): Promise<void> {
    const paths = await this.getLearningPaths();
    const pathIndex = paths.findIndex(p => p.id === pathId);
    
    if (pathIndex !== -1) {
      paths[pathIndex] = {
        ...paths[pathIndex],
        ...updates,
        updatedAt: Date.now(),
      };
      
      // 重新计算进度
      paths[pathIndex].progress = this.calculateProgress(paths[pathIndex]);
      
      await this.saveLearningPaths(paths);
      await this.updateStats();
    }
  }

  // 切换步骤完成状态
  static async toggleStepCompletion(pathId: string, stepId: string): Promise<void> {
    const paths = await this.getLearningPaths();
    const path = paths.find(p => p.id === pathId);
    
    if (path) {
      const step = path.steps.find(s => s.id === stepId);
      if (step) {
        step.completed = !step.completed;
        step.completedAt = step.completed ? Date.now() : undefined;
        
        // 重新计算进度
        path.progress = this.calculateProgress(path);
        path.updatedAt = Date.now();
        
        await this.saveLearningPaths(paths);
        await this.updateStats();
        
        // 检查成就
        await this.checkAchievements();
      }
    }
  }

  // 计算学习路径进度
  private static calculateProgress(path: LearningPath): number {
    if (path.steps.length === 0) return 0;
    const completedSteps = path.steps.filter(step => step.completed).length;
    return (completedSteps / path.steps.length) * 100;
  }

  // 获取成就
  static async getAchievements(): Promise<Achievement[]> {
    try {
      const stored = localStorage.getItem(this.ACHIEVEMENTS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      
      const defaultAchievements = this.getDefaultAchievements();
      await this.saveAchievements(defaultAchievements);
      return defaultAchievements;
    } catch (error) {
      console.error("获取成就失败:", error);
      return this.getDefaultAchievements();
    }
  }

  // 保存成就
  static async saveAchievements(achievements: Achievement[]): Promise<void> {
    try {
      localStorage.setItem(this.ACHIEVEMENTS_KEY, JSON.stringify(achievements));
    } catch (error) {
      console.error("保存成就失败:", error);
    }
  }

  // 检查并解锁成就
  static async checkAchievements(): Promise<void> {
    const achievements = await this.getAchievements();
    const paths = await this.getLearningPaths();
    const stats = await this.getStats();
    
    let hasUpdates = false;
    
    achievements.forEach(achievement => {
      if (achievement.unlocked) return;
      
      let shouldUnlock = false;
      
      switch (achievement.type) {
        case "milestone":
          if (achievement.id === "first_path" && paths.length >= 1) {
            achievement.progress = paths.length;
            shouldUnlock = true;
          } else if (achievement.id === "path_creator" && paths.length >= 5) {
            achievement.progress = paths.length;
            shouldUnlock = true;
          }
          break;
          
        case "completion":
          if (achievement.id === "first_completion" && stats.completedSteps >= 1) {
            achievement.progress = stats.completedSteps;
            shouldUnlock = true;
          } else if (achievement.id === "step_master" && stats.completedSteps >= 50) {
            achievement.progress = stats.completedSteps;
            shouldUnlock = true;
          }
          break;
          
        case "streak":
          if (achievement.id === "consistent_learner" && stats.currentStreak >= 7) {
            achievement.progress = stats.currentStreak;
            shouldUnlock = true;
          }
          break;
      }
      
      if (shouldUnlock) {
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        hasUpdates = true;
      }
    });
    
    if (hasUpdates) {
      await this.saveAchievements(achievements);
    }
  }

  // 获取学习统计
  static async getStats(): Promise<LearningStats> {
    try {
      const paths = await this.getLearningPaths();
      const achievements = await this.getAchievements();
      
      const completedPaths = paths.filter(p => p.progress === 100).length;
      const completedSteps = paths.reduce((total, path) => 
        total + path.steps.filter(step => step.completed).length, 0
      );
      const totalHours = paths.reduce((total, path) => total + path.estimatedHours, 0);
      
      // 分类统计
      const categoryStats = this.calculateCategoryStats(paths);
      
      // 最近活动
      const recentActivities = this.getRecentActivities(paths, achievements);
      
      // 个性化建议
      const recommendations = this.generateRecommendations(paths, achievements);
      
      return {
        totalPaths: paths.length,
        completedPaths,
        completedSteps,
        totalHours,
        achievementsCount: achievements.filter(a => a.unlocked).length,
        currentStreak: this.calculateCurrentStreak(paths),
        longestStreak: this.calculateLongestStreak(paths),
        categoryStats,
        recentActivities,
        recommendations,
      };
    } catch (error) {
      console.error("获取统计数据失败:", error);
      return this.getDefaultStats();
    }
  }

  // 计算当前连续学习天数
  private static calculateCurrentStreak(paths: LearningPath[]): number {
    // 提取所有已完成步骤的完成时间
    const completionDates = paths.flatMap(path => 
      path.steps.filter(step => step.completed && step.completedAt)
        .map(step => new Date(step.completedAt!))
    );
    
    // 如果没有完成的步骤，连续学习天数为0
    if (completionDates.length === 0) return 0;
    
    // 按完成时间排序
    completionDates.sort((a, b) => b.getTime() - a.getTime());
    
    // 获取今天的日期（忽略时间）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 计算连续学习天数
    let streak = 0;
    let currentDate = new Date(today);
    
    for (const date of completionDates) {
      date.setHours(0, 0, 0, 0);
      
      // 如果是同一天或前一天，继续计算连续天数
      if (date.getTime() === currentDate.getTime()) {
        continue;
      } else if (date.getTime() === new Date(currentDate.getTime() - 24 * 60 * 60 * 1000).getTime()) {
        streak++;
        currentDate = new Date(date);
      } else {
        // 不连续，停止计算
        break;
      }
    }
    
    // 如果今天有完成的步骤，加上今天
    if (completionDates.some(date => date.getTime() === today.getTime())) {
      streak++;
    }
    
    return streak;
  }

  // 计算最长连续学习天数
  private static calculateLongestStreak(paths: LearningPath[]): number {
    // 提取所有已完成步骤的完成时间
    const completionDates = paths.flatMap(path => 
      path.steps.filter(step => step.completed && step.completedAt)
        .map(step => new Date(step.completedAt!))
    );
    
    // 如果没有完成的步骤，最长连续学习天数为0
    if (completionDates.length === 0) return 0;
    
    // 去重并排序
    const uniqueDates = Array.from(new Set(completionDates.map(date => date.toDateString())))
      .map(dateStr => new Date(dateStr));
    uniqueDates.sort((a, b) => a.getTime() - b.getTime());
    
    // 计算最长连续天数
    let maxStreak = 0;
    let currentStreak = 1;
    
    for (let i = 1; i < uniqueDates.length; i++) {
      const diffTime = Math.abs(uniqueDates[i].getTime() - uniqueDates[i - 1].getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }
    
    // 检查最后一个连续序列
    maxStreak = Math.max(maxStreak, currentStreak);
    
    return maxStreak;
  }

  // 计算分类统计
  private static calculateCategoryStats(paths: LearningPath[]) {
    const categories = new Map<string, { count: number; completedCount: number }>();
    
    paths.forEach(path => {
      const current = categories.get(path.category) || { count: 0, completedCount: 0 };
      current.count++;
      if (path.progress === 100) {
        current.completedCount++;
      }
      categories.set(path.category, current);
    });
    
    return Array.from(categories.entries()).map(([name, stats]) => ({
      name,
      count: stats.count,
      completedCount: stats.completedCount,
    }));
  }

  // 获取最近活动
  private static getRecentActivities(paths: LearningPath[], achievements: Achievement[]) {
    const activities: Array<{
      type: "started" | "completed" | "achievement";
      description: string;
      timestamp: number;
    }> = [];
    
    // 添加路径活动
    paths.forEach(path => {
      activities.push({
        type: "started",
        description: `开始学习路径：${path.title}`,
        timestamp: path.createdAt,
      });
      
      if (path.progress === 100) {
        activities.push({
          type: "completed",
          description: `完成学习路径：${path.title}`,
          timestamp: path.updatedAt,
        });
      }
      
      // 添加步骤完成活动
      path.steps.forEach(step => {
        if (step.completed && step.completedAt) {
          activities.push({
            type: "completed",
            description: `完成步骤：${step.title} (${path.title})`,
            timestamp: step.completedAt,
          });
        }
      });
    });
    
    // 添加成就活动
    achievements.filter(a => a.unlocked && a.unlockedAt).forEach(achievement => {
      activities.push({
        type: "achievement",
        description: `解锁成就：${achievement.title}`,
        timestamp: achievement.unlockedAt!,
      });
    });
    
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }

  // 生成个性化建议
  private static generateRecommendations(paths: LearningPath[], achievements: Achievement[]): string[] {
    const recommendations: string[] = [];
    
    if (paths.length === 0) {
      recommendations.push("创建您的第一个学习路径，开始学习之旅");
    } else {
      const incompletePaths = paths.filter(p => p.progress < 100 && p.steps.some(s => !s.completed));
      if (incompletePaths.length > 0) {
        const nextPath = incompletePaths.sort((a, b) => a.progress - b.progress)[0];
        const nextStep = nextPath.steps.find(s => !s.completed);
        if (nextStep) {
          recommendations.push(`继续完成 ${nextPath.title}：${nextStep.title}`);
        } else {
          recommendations.push(`继续完成 ${nextPath.title}，您已经完成了 ${Math.round(nextPath.progress)}%`);
        }
      }
    }
    
    // 推荐解锁下一个成就
    const lockedAchievements = achievements.filter(a => !a.unlocked);
    if (lockedAchievements.length > 0) {
      const nextAchievement = lockedAchievements
        .filter(a => a.progress < a.target)
        .sort((a, b) => (b.progress / b.target) - (a.progress / a.target))[0];
      
      if (nextAchievement) {
        recommendations.push(`距离解锁"${nextAchievement.title}"还需要 ${nextAchievement.target - nextAchievement.progress} 个进度`);
      }
    }
    
    // 基于类别推荐
    const categoryCounts = new Map<string, number>();
    paths.forEach(path => {
      categoryCounts.set(path.category, (categoryCounts.get(path.category) || 0) + 1);
    });
    
    const allCategories = ["技术", "设计", "开发", "数据", "人工智能", "编程语言", "工具使用"];
    const underrepresentedCategories = allCategories.filter(cat => !(categoryCounts.get(cat) || 0) > 0);
    
    if (underrepresentedCategories.length > 0) {
      recommendations.push(`尝试新类别：${underrepresentedCategories[0]}`);
    }
    
    // 其他通用推荐
    recommendations.push("每天坚持学习30分钟，养成良好的学习习惯");
    recommendations.push("尝试不同类别的学习内容，拓展知识面");
    
    return recommendations.slice(0, 4);
  }

  // 更新统计数据
  private static async updateStats(): Promise<void> {
    try {
      const stats = await this.getStats();
      localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error("更新统计数据失败:", error);
    }
  }

  // 默认学习路径
  private static getDefaultPaths(): LearningPath[] {
    return [
      {
        id: "path_ai_basics",
        title: "人工智能基础入门",
        description: "从零开始学习人工智能的基本概念、发展历史和核心技术",
        category: "技术",
        difficulty: "beginner",
        estimatedHours: 20,
        progress: 45,
        author: "AI导师",
        isPublic: true,
        tags: ["人工智能", "机器学习", "基础"],
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
        steps: [
          {
            id: "step_1",
            title: "什么是人工智能",
            description: "了解人工智能的定义、历史和发展现状",
            type: "reading",
            estimatedMinutes: 30,
            completed: true,
            completedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
            resources: [
              {
                title: "人工智能简史",
                url: "https://example.com/ai-history",
                type: "article"
              }
            ]
          },
          {
            id: "step_2",
            title: "机器学习基础",
            description: "学习机器学习的基本概念和分类",
            type: "video",
            estimatedMinutes: 45,
            completed: true,
            completedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
            resources: [
              {
                title: "机器学习入门视频",
                url: "https://example.com/ml-intro",
                type: "video"
              }
            ]
          },
          {
            id: "step_3",
            title: "深度学习概述",
            description: "了解深度学习的原理和应用",
            type: "reading",
            estimatedMinutes: 40,
            completed: false,
            resources: [
              {
                title: "深度学习指南",
                url: "https://example.com/dl-guide",
                type: "document"
              }
            ]
          },
          {
            id: "step_4",
            title: "实践项目：图像识别",
            description: "使用Python实现简单的图像识别项目",
            type: "project",
            estimatedMinutes: 120,
            completed: false,
            resources: [
              {
                title: "项目代码库",
                url: "https://github.com/example/image-recognition",
                type: "website"
              }
            ]
          }
        ]
      },
      {
        id: "path_web_design",
        title: "现代网页设计",
        description: "学习现代网页设计的原则、工具和最佳实践",
        category: "设计",
        difficulty: "intermediate",
        estimatedHours: 15,
        progress: 20,
        author: "设计师小王",
        isPublic: true,
        tags: ["网页设计", "UI/UX", "前端"],
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        steps: [
          {
            id: "step_design_1",
            title: "设计原则基础",
            description: "学习色彩、排版、布局等基本设计原则",
            type: "reading",
            estimatedMinutes: 60,
            completed: true,
            completedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
            resources: [
              {
                title: "设计原则指南",
                url: "https://example.com/design-principles",
                type: "article"
              }
            ]
          },
          {
            id: "step_design_2",
            title: "Figma工具使用",
            description: "掌握Figma设计工具的基本操作",
            type: "video",
            estimatedMinutes: 90,
            completed: false,
            resources: [
              {
                title: "Figma入门教程",
                url: "https://example.com/figma-tutorial",
                type: "video"
              }
            ]
          },
          {
            id: "step_design_3",
            title: "响应式设计",
            description: "学习创建适应各种设备的响应式网页设计",
            type: "reading",
            estimatedMinutes: 45,
            completed: false,
            resources: [
              {
                title: "响应式设计指南",
                url: "https://example.com/responsive-design",
                type: "document"
              }
            ]
          },
          {
            id: "step_design_4",
            title: "UI组件设计",
            description: "学习设计和实现各种UI组件",
            type: "project",
            estimatedMinutes: 120,
            completed: false,
            resources: [
              {
                title: "UI组件库示例",
                url: "https://example.com/ui-components",
                type: "website"
              }
            ]
          }
        ]
      }
    ];
  }

  // 默认成就
  private static getDefaultAchievements(): Achievement[] {
    return [
      {
        id: "first_path",
        title: "探索者",
        description: "创建你的第一个学习路径",
        type: "milestone",
        icon: "📚",
        unlocked: false,
        progress: 0,
        target: 1,
        reward: {
          type: "badge",
          value: "探索者徽章"
        }
      },
      {
        id: "first_completion",
        title: "完成者",
        description: "完成你的第一个学习步骤",
        type: "completion",
        icon: "✅",
        unlocked: false,
        progress: 0,
        target: 1,
        reward: {
          type: "points",
          value: 100
        }
      },
      {
        id: "consistent_learner",
        title: "坚持者",
        description: "连续7天学习",
        type: "streak",
        icon: "🔥",
        unlocked: false,
        progress: 0,
        target: 7,
        reward: {
          type: "feature",
          value: "自定义学习主题"
        }
      },
      {
        id: "path_creator",
        title: "创作者",
        description: "创建5个学习路径",
        type: "milestone",
        icon: "🏆",
        unlocked: false,
        progress: 0,
        target: 5,
        reward: {
          type: "badge",
          value: "创作者徽章"
        }
      },
      {
        id: "step_master",
        title: "大师",
        description: "完成50个学习步骤",
        type: "completion",
        icon: "🌟",
        unlocked: false,
        progress: 0,
        target: 50,
        reward: {
          type: "badge",
          value: "学习大师徽章"
        }
      }
    ];
  }

  // 默认统计数据
  private static getDefaultStats(): LearningStats {
    return {
      totalPaths: 0,
      completedPaths: 0,
      completedSteps: 0,
      totalHours: 0,
      achievementsCount: 0,
      currentStreak: 0,
      longestStreak: 0,
      categoryStats: [],
      recentActivities: [],
      recommendations: ["创建您的第一个学习路径，开始学习之旅"]
    };
  }
}
