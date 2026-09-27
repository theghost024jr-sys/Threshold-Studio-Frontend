let socket;
let listeners = new Set();

export function connect() {
  socket = new WebSocket("ws://127.0.0.1:8080/world");

  socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    listeners.forEach(fn => fn(data));
  };
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
