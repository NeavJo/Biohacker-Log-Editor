    // 全局光影互动效果
    const MouseGlowEffect = (() => {
      const glowElement = document.getElementById('mouse-glow');
      let mouseX = -1000;
      let mouseY = -1000;
      let currentX = -1000;
      let currentY = -1000;
      let animationId = null;

      const updatePosition = () => {
        // 使用 requestAnimationFrame 极致顺滑更新位置，无任何 transition
        currentX = mouseX;
        currentY = mouseY;
        glowElement.style.left = currentX + 'px';
        glowElement.style.top = currentY + 'px';
        animationId = requestAnimationFrame(updatePosition);
      };

      const handleMouseMove = (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      };

      const init = () => {
        if (!glowElement) return;
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        animationId = requestAnimationFrame(updatePosition);
      };

      return { init };
    })();

    // 点击波纹动画
    const ClickRippleEffect = (() => {
      const createRipple = (x, y) => {
        const ripple = document.createElement('div');
        ripple.className = 'click-ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        document.body.appendChild(ripple);

        // 动画结束后自动移除 DOM 节点（双保险）
        const removeRipple = () => {
          if (ripple.parentNode) {
            ripple.remove();
          }
        };

        ripple.addEventListener('animationend', removeRipple);
        
        // 备份超时清理，防止 animationend 事件未触发
        setTimeout(removeRipple, 600);
      };

      const handleClick = (e) => {
        createRipple(e.clientX, e.clientY);
      };

      const init = () => {
        document.addEventListener('click', handleClick, { passive: true });
      };

      return { init };
    })();

    // 初始化鼠标光效
    document.addEventListener('DOMContentLoaded', () => {
      MouseGlowEffect.init();
      ClickRippleEffect.init();
    });
