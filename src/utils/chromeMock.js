/**
 * mock chrome api for development
 */

export const initChrome = () => {
  if (typeof chrome === 'undefined') {
    global.chrome = {
      runtime: {
        onInstalled: {
          addListener: (callback) => {
            console.log('Mock: Extension installed');
            callback();
          }
        }
      },
      storage: {
        local: {
          get: (keys) => Promise.resolve({}),
          set: (items) => Promise.resolve()
        }
      },
      tabs: {
        onUpdated: {
          addListener: (callback) => {}
        }
      }
    };
  }
};

