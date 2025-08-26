"use client"

import React from "react"

// 动画系统 - 增强微交互效果
export interface AnimationConfig {
  duration: number
  easing: string
  delay: number
  fill: "none" | "forwards" | "backwards" | "both"
}

export interface SpringConfig {
  tension: number
  friction: number
  mass: number
}

export interface TransitionConfig {
  property: string
  duration: number
  easing: string
  delay: number
}

export class AnimationSystem {
  private static instance: AnimationSystem
  private animations = new Map<string, Animation>()
  private observers = new Map<string, IntersectionObserver>()

  static getInstance(): AnimationSystem {
    if (!AnimationSystem.instance) {
      AnimationSystem.instance = new AnimationSystem()
    }
    return AnimationSystem.instance
  }

  // 预定义动画
  static presets = {
    // 淡入淡出
    fadeIn: {
      keyframes: [
        { opacity: 0, transform: "translateY(20px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      options: { duration: 300, easing: "ease-out", fill: "forwards" as const },
    },

    fadeOut: {
      keyframes: [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(-20px)" },
      ],
      options: { duration: 300, easing: "ease-in", fill: "forwards" as const },
    },

    // 缩放动画
    scaleIn: {
      keyframes: [
        { opacity: 0, transform: "scale(0.8)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      options: { duration: 200, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", fill: "forwards" as const },
    },

    scaleOut: {
      keyframes: [
        { opacity: 1, transform: "scale(1)" },
        { opacity: 0, transform: "scale(0.8)" },
      ],
      options: { duration: 200, easing: "ease-in", fill: "forwards" as const },
    },

    // 滑动动画
    slideInLeft: {
      keyframes: [
        { opacity: 0, transform: "translateX(-100%)" },
        { opacity: 1, transform: "translateX(0)" },
      ],
      options: { duration: 400, easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", fill: "forwards" as const },
    },

    slideInRight: {
      keyframes: [
        { opacity: 0, transform: "translateX(100%)" },
        { opacity: 1, transform: "translateX(0)" },
      ],
      options: { duration: 400, easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", fill: "forwards" as const },
    },

    slideInUp: {
      keyframes: [
        { opacity: 0, transform: "translateY(100%)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      options: { duration: 400, easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", fill: "forwards" as const },
    },

    slideInDown: {
      keyframes: [
        { opacity: 0, transform: "translateY(-100%)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      options: { duration: 400, easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", fill: "forwards" as const },
    },

    // 旋转动画
    rotateIn: {
      keyframes: [
        { opacity: 0, transform: "rotate(-180deg) scale(0.8)" },
        { opacity: 1, transform: "rotate(0deg) scale(1)" },
      ],
      options: { duration: 500, easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", fill: "forwards" as const },
    },

    // 弹跳动画
    bounce: {
      keyframes: [
        { transform: "translateY(0)" },
        { transform: "translateY(-10px)" },
        { transform: "translateY(0)" },
        { transform: "translateY(-5px)" },
        { transform: "translateY(0)" },
      ],
      options: { duration: 600, easing: "ease-out", fill: "forwards" as const },
    },

    // 摇摆动画
    shake: {
      keyframes: [
        { transform: "translateX(0)" },
        { transform: "translateX(-10px)" },
        { transform: "translateX(10px)" },
        { transform: "translateX(-10px)" },
        { transform: "translateX(10px)" },
        { transform: "translateX(-5px)" },
        { transform: "translateX(5px)" },
        { transform: "translateX(0)" },
      ],
      options: { duration: 500, easing: "ease-in-out", fill: "forwards" as const },
    },

    // 脉冲动画
    pulse: {
      keyframes: [
        { transform: "scale(1)", opacity: 1 },
        { transform: "scale(1.05)", opacity: 0.8 },
        { transform: "scale(1)", opacity: 1 },
      ],
      options: { duration: 1000, easing: "ease-in-out", fill: "forwards" as const },
    },

    // 加载动画
    spin: {
      keyframes: [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
      options: { duration: 1000, easing: "linear", fill: "forwards" as const, iterations: Number.POSITIVE_INFINITY },
    },

    // 心跳动画
    heartbeat: {
      keyframes: [
        { transform: "scale(1)" },
        { transform: "scale(1.3)" },
        { transform: "scale(1)" },
        { transform: "scale(1.3)" },
        { transform: "scale(1)" },
      ],
      options: { duration: 1300, easing: "ease-in-out", fill: "forwards" as const },
    },
  }

  // 执行动画
  animate(element: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions = {}): Animation {
    const animation = element.animate(keyframes, {
      duration: 300,
      easing: "ease-out",
      fill: "forwards",
      ...options,
    })

    const animationId = `${Date.now()}_${Math.random()}`
    this.animations.set(animationId, animation)

    animation.addEventListener("finish", () => {
      this.animations.delete(animationId)
    })

    return animation
  }

  // 使用预设动画
  animateWithPreset(
    element: HTMLElement,
    presetName: keyof typeof AnimationSystem.presets,
    customOptions: Partial<KeyframeAnimationOptions> = {},
  ): Animation {
    const preset = AnimationSystem.presets[presetName]
    const options = { ...preset.options, ...customOptions }

    return this.animate(element, preset.keyframes, options)
  }

  // 序列动画
  async animateSequence(
    animations: Array<{
      element: HTMLElement
      preset?: keyof typeof AnimationSystem.presets
      keyframes?: Keyframe[]
      options?: KeyframeAnimationOptions
      delay?: number
    }>,
  ): Promise<void> {
    for (const animConfig of animations) {
      if (animConfig.delay) {
        await this.delay(animConfig.delay)
      }

      let animation: Animation

      if (animConfig.preset) {
        animation = this.animateWithPreset(animConfig.element, animConfig.preset, animConfig.options)
      } else if (animConfig.keyframes) {
        animation = this.animate(animConfig.element, animConfig.keyframes, animConfig.options)
      } else {
        continue
      }

      await animation.finished
    }
  }

  // 并行动画
  async animateParallel(
    animations: Array<{
      element: HTMLElement
      preset?: keyof typeof AnimationSystem.presets
      keyframes?: Keyframe[]
      options?: KeyframeAnimationOptions
    }>,
  ): Promise<void> {
    const animationPromises = animations.map((animConfig) => {
      let animation: Animation

      if (animConfig.preset) {
        animation = this.animateWithPreset(animConfig.element, animConfig.preset, animConfig.options)
      } else if (animConfig.keyframes) {
        animation = this.animate(animConfig.element, animConfig.keyframes, animConfig.options)
      } else {
        return Promise.resolve()
      }

      return animation.finished
    })

    await Promise.all(animationPromises)
  }

  // 滚动触发动画
  animateOnScroll(
    element: HTMLElement,
    preset: keyof typeof AnimationSystem.presets,
    options: {
      threshold?: number
      rootMargin?: string
      once?: boolean
    } = {},
  ): void {
    const { threshold = 0.1, rootMargin = "0px", once = true } = options

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.animateWithPreset(element, preset)

            if (once) {
              observer.unobserve(element)
            }
          }
        })
      },
      { threshold, rootMargin },
    )

    observer.observe(element)

    const observerId = `scroll_${Date.now()}_${Math.random()}`
    this.observers.set(observerId, observer)
  }

  // 悬停动画
  setupHoverAnimation(
    element: HTMLElement,
    hoverPreset: keyof typeof AnimationSystem.presets,
    leavePreset?: keyof typeof AnimationSystem.presets,
  ): void {
    let currentAnimation: Animation | null = null

    element.addEventListener("mouseenter", () => {
      if (currentAnimation) {
        currentAnimation.cancel()
      }
      currentAnimation = this.animateWithPreset(element, hoverPreset)
    })

    element.addEventListener("mouseleave", () => {
      if (currentAnimation) {
        currentAnimation.cancel()
      }
      if (leavePreset) {
        currentAnimation = this.animateWithPreset(element, leavePreset)
      }
    })
  }

  // 点击动画
  setupClickAnimation(element: HTMLElement, preset: keyof typeof AnimationSystem.presets): void {
    element.addEventListener("click", () => {
      this.animateWithPreset(element, preset)
    })
  }

  // 创建自定义缓动函数
  static createCubicBezier(x1: number, y1: number, x2: number, y2: number): string {
    return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`
  }

  // 常用缓动函数
  static easings = {
    easeInQuad: "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
    easeOutQuad: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    easeInOutQuad: "cubic-bezier(0.455, 0.03, 0.515, 0.955)",
    easeInCubic: "cubic-bezier(0.55, 0.055, 0.675, 0.19)",
    easeOutCubic: "cubic-bezier(0.215, 0.61, 0.355, 1)",
    easeInOutCubic: "cubic-bezier(0.645, 0.045, 0.355, 1)",
    easeInQuart: "cubic-bezier(0.895, 0.03, 0.685, 0.22)",
    easeOutQuart: "cubic-bezier(0.165, 0.84, 0.44, 1)",
    easeInOutQuart: "cubic-bezier(0.77, 0, 0.175, 1)",
    easeInQuint: "cubic-bezier(0.755, 0.05, 0.855, 0.06)",
    easeOutQuint: "cubic-bezier(0.23, 1, 0.32, 1)",
    easeInOutQuint: "cubic-bezier(0.86, 0, 0.07, 1)",
    easeInBack: "cubic-bezier(0.6, -0.28, 0.735, 0.045)",
    easeOutBack: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    easeInOutBack: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // 停止所有动画
  stopAllAnimations(): void {
    this.animations.forEach((animation) => {
      animation.cancel()
    })
    this.animations.clear()
  }

  // 清理观察器
  cleanup(): void {
    this.stopAllAnimations()

    this.observers.forEach((observer) => {
      observer.disconnect()
    })
    this.observers.clear()
  }

  // 性能监控
  getPerformanceStats(): {
    activeAnimations: number
    activeObservers: number
  } {
    return {
      activeAnimations: this.animations.size,
      activeObservers: this.observers.size,
    }
  }
}

// React Hook for animations
export const useAnimation = () => {
  const animationSystem = React.useRef(AnimationSystem.getInstance())

  React.useEffect(() => {
    return () => {
      // 组件卸载时清理动画
      animationSystem.current.cleanup()
    }
  }, [])

  const animate = React.useCallback(
    (
      element: HTMLElement,
      preset: keyof typeof AnimationSystem.presets,
      options?: Partial<KeyframeAnimationOptions>,
    ) => {
      return animationSystem.current.animateWithPreset(element, preset, options)
    },
    [],
  )

  const animateSequence = React.useCallback((animations: any[]) => {
    return animationSystem.current.animateSequence(animations)
  }, [])

  const animateOnScroll = React.useCallback(
    (element: HTMLElement, preset: keyof typeof AnimationSystem.presets, options?: any) => {
      animationSystem.current.animateOnScroll(element, preset, options)
    },
    [],
  )

  return {
    animate,
    animateSequence,
    animateOnScroll,
    presets: AnimationSystem.presets,
    easings: AnimationSystem.easings,
  }
}

// 动画工具函数
export const animateElement = (
  element: HTMLElement,
  preset: keyof typeof AnimationSystem.presets,
  options?: Partial<KeyframeAnimationOptions>,
) => {
  return AnimationSystem.getInstance().animateWithPreset(element, preset, options)
}

export const setupScrollAnimations = (selector = "[data-animate]") => {
  const elements = document.querySelectorAll(selector)
  const animationSystem = AnimationSystem.getInstance()

  elements.forEach((element) => {
    const preset = element.getAttribute("data-animate") as keyof typeof AnimationSystem.presets
    const delay = Number.parseInt(element.getAttribute("data-delay") || "0")
    const threshold = Number.parseFloat(element.getAttribute("data-threshold") || "0.1")

    if (preset && AnimationSystem.presets[preset]) {
      setTimeout(() => {
        animationSystem.animateOnScroll(element as HTMLElement, preset, { threshold })
      }, delay)
    }
  })
}
