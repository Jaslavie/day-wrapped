/**
 * mock chrome api for development
 */

const createStorageMock = () => {
  let store = {};
  return {
    local: {
      get: (keys, callback) => {
        // If keys is an array, create an object with those keys
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(key => {
            result[key] = store[key];
          });
          callback(result);
          return;
        }
        // If keys is a string, return just that key
        if (typeof keys === 'string') {
          callback({ [keys]: store[keys] });
          return;
        }
        // If keys is an object, return all storage
        callback({ ...store });
      },
      set: (items, callback) => {
        store = { ...store, ...items };
        if (callback) callback();
      }
    }
  };
};

const mockChrome = {
  storage: createStorageMock(),
  runtime: {
    onInstalled: {
      addListener: (callback) => {}
    }
  },
  tabs: {
    onUpdated: {
      addListener: (callback) => {}
    }
  }
};

export const initChrome = () => {
  if (typeof window.chrome === 'undefined') {
    console.log('Initializing Chrome mock for development');
    window.chrome = mockChrome;
  }
};

