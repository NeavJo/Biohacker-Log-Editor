// RippleEffect - 基于 @figliolia/ripples 的涟漪效果控制器
import { Ripples } from "@figliolia/ripples";

class RippleEffect {
  constructor() {
    this.ripples = null;
    this.container = null;
    this.autoRippleTimer = null;
    this.isInitialized = false;
    this.Ripples = Ripples;
    
    // 涟漪参数 - Frutiger Aero 美学风格
    this.config = {
      // 周期性自动涟漪间隔（毫秒）
      autoRippleInterval: 5000,
      // 涟漪半径范围
      dropRadiusMin: 15,
      dropRadiusMax: 25,
      // 涟漪强度范围
      strengthMin: 0.8,
      strengthMax: 1.2,
      // 是否启用交互式涟漪
      interactive: true,
      // WebGL 渲染分辨率（值越大越平滑，但性能开销越大）
      resolution: 512,
      // 折射强度（值越大扭曲越明显）
      perturbance: 0.015,
    };
  }

  // 检查 WebGL 支持
  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  // 初始化涟漪效果
  async init() {
    if (this.isInitialized) {
      console.warn('RippleEffect: Already initialized');
      return;
    }

    // 检查 WebGL 支持
    if (!this.checkWebGLSupport()) {
      console.warn('RippleEffect: WebGL not supported, ripple effect disabled');
      return;
    }

    try {
      // 创建背景容器
      this.createRippleContainer();

      // 初始化 Ripples 库
      this.ripples = new this.Ripples(this.container, {
        resolution: this.config.resolution,
        dropRadius: this.config.dropRadiusMax,
        perturbance: this.config.perturbance,
        interactive: this.config.interactive,
      });

      // 等待 Ripples 初始化完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // 启动自动涟漪
      this.startAutoRipple();

      this.isInitialized = true;
      console.log('RippleEffect: Initialized successfully');

    } catch (error) {
      console.error('RippleEffect: Failed to initialize', error);
      this.cleanup();
    }
  }

  // 创建涟漪容器
  createRippleContainer() {
    this.container = document.createElement('div');
    this.container.id = 'ripple-background';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: -1;
      pointer-events: none;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      overflow: hidden;
    `;

    // 将容器插入到 body 的最前面，确保在其他内容之下
    document.body.insertBefore(this.container, document.body.firstChild);
  }

  // 添加单个涟漪
  drop(x, y, radius, strength) {
    if (!this.ripples || !this.isInitialized) {
      console.warn('RippleEffect: Not initialized');
      return;
    }

    try {
      // x 和 y 是相对于容器的百分比坐标 (0-1)
      this.ripples.drop(x, y, radius, strength);
    } catch (error) {
      console.error('RippleEffect: Failed to create drop', error);
    }
  }

  // 在随机位置添加涟漪
  addRandomRipple() {
    if (!this.ripples || !this.isInitialized) return;

    // 生成随机位置（避免边缘区域）
    const margin = 0.15;
    const x = margin + Math.random() * (1 - 2 * margin);
    const y = margin + Math.random() * (1 - 2 * margin);

    // 生成随机参数
    const radius = this.config.dropRadiusMin + 
                   Math.random() * (this.config.dropRadiusMax - this.config.dropRadiusMin);
    const strength = this.config.strengthMin + 
                     Math.random() * (this.config.strengthMax - this.config.strengthMin);

    this.drop(x, y, radius, strength);
  }

  // 启动自动涟漪
  startAutoRipple() {
    if (this.autoRippleTimer) {
      clearInterval(this.autoRippleTimer);
    }

    // 初始延迟，让页面先加载完成
    setTimeout(() => {
      // 添加初始涟漪
      this.addRandomRipple();

      // 设置定时器定期添加涟漪
      this.autoRippleTimer = setInterval(() => {
        this.addRandomRipple();
      }, this.config.autoRippleInterval);

      console.log(`RippleEffect: Auto ripple started (interval: ${this.config.autoRippleInterval}ms)`);
    }, 2000);
  }

  // 停止自动涟漪
  stopAutoRipple() {
    if (this.autoRippleTimer) {
      clearInterval(this.autoRippleTimer);
      this.autoRippleTimer = null;
      console.log('RippleEffect: Auto ripple stopped');
    }
  }

  // 暂停涟漪动画
  pause() {
    if (this.ripples) {
      this.ripples.pause();
      console.log('RippleEffect: Paused');
    }
  }

  // 恢复涟漪动画
  play() {
    if (this.ripples) {
      this.ripples.play();
      console.log('RippleEffect: Resumed');
    }
  }

  // 销毁涟漪效果
  destroy() {
    this.cleanup();
  }

  // 清理资源
  cleanup() {
    this.stopAutoRipple();

    if (this.ripples) {
      try {
        this.ripples.destroy();
      } catch (error) {
        console.error('RippleEffect: Error destroying ripples', error);
      }
      this.ripples = null;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.isInitialized = false;

    console.log('RippleEffect: Cleaned up');
  }

  // 更新配置
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('RippleEffect: Config updated', this.config);
  }

  // 获取当前状态
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isPlaying: this.ripples ? true : false,
      autoRippleActive: this.autoRippleTimer !== null,
      config: this.config
    };
  }
}

// 创建全局实例
const rippleEffect = new RippleEffect();

// DOM 加载完成后自动初始化涟漪效果
document.addEventListener('DOMContentLoaded', () => {
  // 延迟初始化，确保其他脚本已完成加载
  setTimeout(() => {
    rippleEffect.init();
  }, 100);
});

// 导出供外部使用
export default rippleEffect;
