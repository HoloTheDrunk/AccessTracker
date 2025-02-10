"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessTrackerProxy = void 0;
class AccessTrackerEntry {
    accesses;
    constructor() {
        this.accesses = [];
    }
    get(exists, path) {
        this.accesses.push({
            mode: 'get',
            path,
            exists,
            time: Date.now(),
            source: new Error().stack?.split('\n')[4],
        });
    }
    set(exists, path) {
        this.accesses.push({
            mode: 'set',
            path,
            exists,
            time: Date.now(),
            source: new Error().stack?.split('\n')[4],
        });
    }
    get count() {
        return this.accesses.length;
    }
    existCounts() {
        const counts = [0, 0];
        for (const access of this.accesses) {
            counts[+!access.exists]++;
        }
        return counts;
    }
}
class AccessTracker {
    accessed;
    summary;
    constructor(timeout = 2000) {
        this.accessed = new Map();
        this.summary = new Map();
        if (timeout > 0) {
            setTimeout(() => {
                this.logSummary();
            }, timeout);
        }
    }
    logSummary() {
        const arr = Array.from(this.summary, ([prop, entry]) => {
            const [ok, missing] = entry.existCounts();
            const uniqueSources = new Set();
            for (const { exists, source } of entry.accesses) {
                if (source !== undefined) {
                    uniqueSources.add(`${exists ? 'ok' : 'undefined'} | ${source}`);
                }
            }
            return { property: prop, ok, undefined: missing, uniqueSources };
        });
        // eslint-disable-next-line no-console
        console.table(arr);
    }
    insert(mode, target, prop) {
        const exists = target[prop] !== undefined;
        if (!this.accessed.has(target)) {
            this.accessed.set(target, new Map());
        }
        AccessTracker.register(mode, this.accessed.get(target), exists, prop);
        AccessTracker.register(mode, this.summary, exists, prop);
    }
    static register(mode, map, exists, prop) {
        const optEntry = map.get(prop);
        const entry = optEntry ?? new AccessTrackerEntry();
        entry[mode](exists);
        if (optEntry === undefined) {
            map.set(prop, entry);
        }
    }
}
/**
 * Debugging helper class logging all accesses to an object's properties.
 *
 * # Usage
 * ```ts
 * // accessTracker will log a summary to the console after 3000 milliseconds.
 * const accessTracker = new AccessTrackerProxy<{ a: number, b?: number }>(3000);
 * const myObj = accessTracker.init({ a: 2, b: undefined });
 * myObj.b = myObj.a * (myObj.b ?? 1) + myObj.a;
 * console.log(myObj.b);
 * ```
 */
class AccessTrackerProxy {
    _tracker;
    constructor(timeout = 2000) {
        this._tracker = new AccessTracker(timeout);
    }
    init(obj) {
        const tracker = this._tracker;
        return new Proxy(obj, {
            get(target, prop, receiver) {
                tracker.insert('get', target, prop);
                if (typeof target[prop] === 'object' && target[prop] !== null) {
                    return new Proxy(Reflect.get(target, prop, receiver), { get: this.get });
                }
                else {
                    return Reflect.get(target, prop, receiver);
                }
            },
            set(target, prop, newValue, receiver) {
                tracker.insert('set', target, prop);
                Reflect.set(target, prop, newValue, receiver);
                return true;
            },
        });
    }
    get(prop) {
        const entry = this._tracker.summary.get(prop);
        if (entry !== undefined) {
            const accesses = entry.accesses;
            const ok = accesses.filter(value => value.exists).length;
            return [ok, accesses.length - ok];
        }
        else {
            return [0, 0];
        }
    }
}
exports.AccessTrackerProxy = AccessTrackerProxy;
