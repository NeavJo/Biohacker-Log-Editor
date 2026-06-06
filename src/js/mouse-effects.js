(function() {
  'use strict';

  let glowElement = null;
  let mouseX = 0;
  let mouseY = 0;
  let rafId = null;

  // 初始化
  function init() {
    glowElement = document.getElementById('mouse-glow');
    if (!glowElement) return;

    // 鼠标移动监听
    document.addEventListener('mousemove', function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    // 点击监听
    document.addEventListener('click', function(e) {
      createRipple(e.clientX, e.clientY);
    }, { passive: true });

    // 开始动画循环
    updatePosition();
  }

  // 更新光效位置
  function updatePosition() {
    if (glowElement) {
      glowElement.style.left = mouseX + 'px';
      glowElement.style.top = mouseY + 'px';
    }
    rafId = requestAnimationFrame(updatePosition);
  }

  // 创建点击波纹
  function createRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'click-ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    document.body.appendChild(ripple);

    // 动画结束后移除
    setTimeout(function() {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 500);
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
