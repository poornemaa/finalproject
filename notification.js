const socket = io();

// Subscribe user to their notifications room
socket.emit('subscribe', userId);

// Listen for new notifications
socket.on('notification', (data) => {
  const notificationsList = document.getElementById('notificationsList');
  const li = document.createElement('li');
  li.className = 'list-group-item list-group-item-info';
  li.innerText = data.message;
  notificationsList.prepend(li);
});
