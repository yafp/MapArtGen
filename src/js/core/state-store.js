// Small observable state boundary. State remains serializable and framework-free.
(function attachStateStore(global) {
  function createStore(initialState) {
    let current = initialState;
    const listeners = new Set();

    return {
      getState() {
        return current;
      },
      patch(partialState, { notify = true } = {}) {
        Object.assign(current, partialState);
        if (notify) listeners.forEach(listener => listener(current));
        return current;
      },
      replace(nextState, { notify = true } = {}) {
        current = nextState;
        if (notify) listeners.forEach(listener => listener(current));
        return current;
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }
    };
  }

  global.CartivaState = Object.freeze({ createStore });
})(window);
