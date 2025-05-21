const eventEmitter = {
  events: {},
  dispatch(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  },
  subscribe(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
    // Return a function to unsubscribe
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
      if (this.events[event].length === 0) {
        delete this.events[event]; // Clean up if no more listeners
      }
    };
  },
};

export default eventEmitter; 