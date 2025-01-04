export const cleanup = {
    clearObject: (obj) => {
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                delete obj[key];
            }
        }
    },
    
    clearArray: (arr) => {
        arr.length = 0;
    },
    
    clearMap: (map) => {
        map.clear();
    },
    
    clearSet: (set) => {
        set.clear();
    }
};

// Force garbage collection hint
export const gcHint = () => {
    if (global.gc) {
        global.gc();
    }
}; 