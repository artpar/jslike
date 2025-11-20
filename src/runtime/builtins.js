// Built-in global objects and functions

export function createGlobalEnvironment(env) {
  // Global objects (only those not already defined below)
  env.define('Date', Date);

  // console object
  env.define('console', {
    log: (...args) => {
      console.log(...args);
      return undefined;
    },
    error: (...args) => {
      console.error(...args);
      return undefined;
    },
    warn: (...args) => {
      console.warn(...args);
      return undefined;
    },
    info: (...args) => {
      console.info(...args);
      return undefined;
    },
    dir: (...args) => {
      console.dir(...args);
      return undefined;
    }
  });

  // Math object
  env.define('Math', {
    PI: Math.PI,
    E: Math.E,
    abs: Math.abs,
    acos: Math.acos,
    asin: Math.asin,
    atan: Math.atan,
    atan2: Math.atan2,
    ceil: Math.ceil,
    cos: Math.cos,
    exp: Math.exp,
    floor: Math.floor,
    log: Math.log,
    max: Math.max,
    min: Math.min,
    pow: Math.pow,
    random: Math.random,
    round: Math.round,
    sin: Math.sin,
    sqrt: Math.sqrt,
    tan: Math.tan,
    trunc: Math.trunc
  });

  // Global values
  env.define('undefined', undefined);

  // Global functions
  env.define('parseInt', parseInt);
  env.define('parseFloat', parseFloat);
  env.define('isNaN', isNaN);
  env.define('isFinite', isFinite);

  // Array constructor
  env.define('Array', Array);

  // Object constructor
  env.define('Object', Object);

  // String constructor
  env.define('String', String);

  // Number constructor
  env.define('Number', Number);

  // Boolean constructor
  env.define('Boolean', Boolean);

  // Function constructor
  env.define('Function', Function);

  // RegExp constructor
  env.define('RegExp', RegExp);

  // Symbol constructor
  env.define('Symbol', Symbol);

  // Map and Set constructors
  env.define('Map', Map);
  env.define('Set', Set);
  env.define('WeakMap', WeakMap);
  env.define('WeakSet', WeakSet);

  // JSON object
  env.define('JSON', {
    parse: JSON.parse,
    stringify: JSON.stringify
  });

  // setTimeout, setInterval (basic implementations)
  env.define('setTimeout', setTimeout);
  env.define('setInterval', setInterval);
  env.define('clearTimeout', clearTimeout);
  env.define('clearInterval', clearInterval);

  // Promise
  env.define('Promise', Promise);

  // Error constructors
  env.define('Error', Error);
  env.define('TypeError', TypeError);
  env.define('ReferenceError', ReferenceError);
  env.define('SyntaxError', SyntaxError);
  env.define('RangeError', RangeError);

  // Global console functions (shortcuts for console.log/warn/error)
  env.define('log', (...args) => {
    console.log(...args);
    return undefined;
  });
  env.define('warn', (...args) => {
    console.warn(...args);
    return undefined;
  });
  env.define('error', (...args) => {
    console.error(...args);
    return undefined;
  });

  // Wang Standard Library - Array Operations
  env.define('sort_by', (array, keyOrFn) => {
    const arr = [...array];
    if (typeof keyOrFn === 'function') {
      return arr.sort((a, b) => {
        const aVal = keyOrFn(a);
        const bVal = keyOrFn(b);
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      });
    } else {
      return arr.sort((a, b) => {
        const aVal = a[keyOrFn];
        const bVal = b[keyOrFn];
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      });
    }
  });

  env.define('reverse', (array) => {
    return [...array].reverse();
  });

  env.define('unique', (array) => {
    return [...new Set(array)];
  });

  env.define('unique_by', (array, key) => {
    const seen = new Set();
    return array.filter(item => {
      const val = item[key];
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  });

  env.define('group_by', (array, key) => {
    return array.reduce((groups, item) => {
      const groupKey = item[key];
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
      return groups;
    }, {});
  });

  env.define('chunk', (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  });

  env.define('flatten', (array, depth = 1) => {
    return array.flat(depth);
  });

  env.define('first', (array, n) => {
    if (n === undefined) return array[0];
    return array.slice(0, n);
  });

  env.define('last', (array, n) => {
    if (n === undefined) return array[array.length - 1];
    return array.slice(-n);
  });

  env.define('take', (array, n) => {
    return array.slice(0, n);
  });

  env.define('drop', (array, n) => {
    return array.slice(n);
  });

  env.define('zip', (...arrays) => {
    const length = Math.min(...arrays.map(a => a.length));
    return Array.from({ length }, (_, i) => arrays.map(a => a[i]));
  });

  env.define('partition', (array, predicate) => {
    const truthy = [];
    const falsy = [];
    array.forEach(item => {
      if (predicate(item)) truthy.push(item);
      else falsy.push(item);
    });
    return [truthy, falsy];
  });

  env.define('filter', (array, predicate) => {
    return array.filter(predicate);
  });

  env.define('map', (array, fn) => {
    return array.map(fn);
  });

  env.define('find', (array, predicate) => {
    return array.find(predicate);
  });

  env.define('find_index', (array, predicate) => {
    return array.findIndex(predicate);
  });

  env.define('every', (array, predicate) => {
    return array.every(predicate);
  });

  env.define('some', (array, predicate) => {
    return array.some(predicate);
  });

  env.define('count', (array, predicate) => {
    if (!predicate) {
      return array.length;
    }
    return array.filter(predicate).length;
  });

  // Wang Standard Library - Object Operations
  env.define('keys', (obj) => {
    return Object.keys(obj);
  });

  env.define('values', (obj) => {
    return Object.values(obj);
  });

  env.define('entries', (obj) => {
    return Object.entries(obj);
  });

  env.define('pick', (obj, keys) => {
    const result = {};
    keys.forEach(key => {
      if (key in obj) result[key] = obj[key];
    });
    return result;
  });

  env.define('omit', (obj, keys) => {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  });

  env.define('merge', (...objects) => {
    return Object.assign({}, ...objects);
  });

  env.define('get', (obj, path, defaultValue) => {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current == null) return defaultValue;
      current = current[key];
    }
    return current !== undefined ? current : defaultValue;
  });

  env.define('set', (obj, path, value) => {
    const keys = path.split('.');
    const result = JSON.parse(JSON.stringify(obj)); // Deep clone
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) current[key] = {};
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
    return result;
  });

  env.define('clone', (obj) => {
    return JSON.parse(JSON.stringify(obj));
  });

  // Wang Standard Library - String Operations
  env.define('split', (str, separator) => {
    return str.split(separator);
  });

  env.define('join', (array, separator) => {
    return array.join(separator);
  });

  env.define('trim', (str) => {
    return str.trim();
  });

  env.define('trim_start', (str) => {
    return str.trimStart();
  });

  env.define('trim_end', (str) => {
    return str.trimEnd();
  });

  env.define('upper', (str) => {
    return str.toUpperCase();
  });

  env.define('toUpperCase', (str) => {
    return str.toUpperCase();
  });

  env.define('lower', (str) => {
    return str.toLowerCase();
  });

  env.define('toLowerCase', (str) => {
    return str.toLowerCase();
  });

  env.define('capitalize', (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  });

  env.define('starts_with', (str, prefix) => {
    return str.startsWith(prefix);
  });

  env.define('ends_with', (str, suffix) => {
    return str.endsWith(suffix);
  });

  env.define('includes', (str, substring) => {
    return str.includes(substring);
  });

  env.define('pad_start', (str, length, char = ' ') => {
    return str.padStart(length, char);
  });

  env.define('pad_end', (str, length, char = ' ') => {
    return str.padEnd(length, char);
  });

  env.define('truncate', (str, length) => {
    if (str.length <= length) return str;
    return str.slice(0, length - 3) + '...';
  });

  env.define('replace_all', (str, search, replace) => {
    return str.replaceAll(search, replace);
  });

  // Wang Standard Library - Type Checking
  env.define('is_string', (value) => {
    return typeof value === 'string';
  });

  env.define('is_number', (value) => {
    return typeof value === 'number';
  });

  env.define('is_boolean', (value) => {
    return typeof value === 'boolean';
  });

  env.define('is_array', (value) => {
    return Array.isArray(value);
  });

  env.define('is_object', (value) => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  });

  env.define('is_function', (value) => {
    return typeof value === 'function';
  });

  env.define('is_null', (value) => {
    return value === null;
  });

  env.define('is_undefined', (value) => {
    return value === undefined;
  });

  env.define('is_empty', (value) => {
    if (value == null) return true;
    if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  });

  // Wang Standard Library - Math Operations
  env.define('min', (array) => {
    return Math.min(...array);
  });

  env.define('max', (array) => {
    return Math.max(...array);
  });

  env.define('sum', (array) => {
    return array.reduce((a, b) => a + b, 0);
  });

  env.define('avg', (array) => {
    return array.reduce((a, b) => a + b, 0) / array.length;
  });

  env.define('median', (array) => {
    const sorted = [...array].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  });

  env.define('round', (num, decimals = 0) => {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  });

  env.define('floor', (num) => {
    return Math.floor(num);
  });

  env.define('ceil', (num) => {
    return Math.ceil(num);
  });

  env.define('abs', (num) => {
    return Math.abs(num);
  });

  env.define('clamp', (num, min, max) => {
    return Math.min(Math.max(num, min), max);
  });

  env.define('range', (start, end, step) => {
    // Support range(n) -> [0, 1, ..., n-1]
    if (end === undefined) {
      end = start;
      start = 0;
      step = 1;
    }
    if (step === undefined) {
      step = start < end ? 1 : -1;
    }

    const result = [];
    if (step > 0) {
      for (let i = start; i < end; i += step) {
        result.push(i);
      }
    } else {
      for (let i = start; i > end; i += step) {
        result.push(i);
      }
    }
    return result;
  });

  // Wang Standard Library - Utility Functions
  env.define('uuid', () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  });

  env.define('to_json', (value) => {
    return JSON.stringify(value);
  });

  env.define('from_json', (str) => {
    return JSON.parse(str);
  });

  env.define('sleep', async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  });

  env.define('wait', async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  });

  return env;
}
