const Toast = (() => {
  const notifications = [];
  let container = null;

  const getContainer = () => {
    if (!container) {
      container = document.getElementById('notification-container');
    }
    return container;
  };

  const removeNotification = (index) => {
    const notification = notifications[index];
    if (notification) {
      clearTimeout(notification.timeout);
      notification.element.classList.remove('notification-enter');
      notification.element.classList.add('notification-exit');
      setTimeout(() => {
        notification.element.remove();
      }, 500);
      notifications.splice(index, 1);
      updateNotificationPositions();
    }
  };

  const updateNotificationPositions = () => {
    notifications.forEach((notif, index) => {
      notif.element.classList.remove('notification-current', 'notification-previous', 'notification-previous2');
      if (index === 0) {
        notif.element.classList.add('notification-current');
      } else if (index === 1) {
        notif.element.classList.add('notification-previous');
      } else if (index === 2) {
        notif.element.classList.add('notification-previous2');
      }
    });
  };

  return {
    show(message, type = 'success') {
      const notificationContainer = getContainer();
      if (!notificationContainer) {
        console.error('Notification container not found');
        return;
      }

      const notificationElement = document.createElement('div');
      notificationElement.textContent = message;
      notificationElement.classList.add('notification-current', 'notification-enter');

      notificationElement.addEventListener('click', () => {
        const index = notifications.findIndex(n => n.element === notificationElement);
        if (index !== -1) {
          removeNotification(index);
        }
      });

      notificationContainer.appendChild(notificationElement);

      const timeout = setTimeout(() => {
        const index = notifications.findIndex(n => n.element === notificationElement);
        if (index !== -1) {
          removeNotification(index);
        }
      }, 4700);

      notifications.unshift({ element: notificationElement, timeout });

      if (notifications.length > 3) {
        removeNotification(3);
      }

      updateNotificationPositions();
    }
  };
})();
