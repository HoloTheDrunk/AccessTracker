import { AccessTrackerProxy } from '../src/index';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const setup = <T extends Record<string, unknown>>(obj: T, ms: number): [T, AccessTrackerProxy<T>] => {
    const accessTracker = new AccessTrackerProxy<T>(ms);
    return [
        accessTracker.init(obj),
        accessTracker
    ];
};

describe('example case', () => {
    type Obj = { a: number, b?: number };

    const capture = <T>(consoleMock: Partial<Console>, callback: () => T): T => {
        const regularConsole = console;
        console = { ...console, ...consoleMock };

        const ret = callback();

        console = regularConsole;

        return ret;
    };

    it('uses console.table', async () => {
        const ms = 50;

        let hasOutput = false;

        await capture({ table: () => { hasOutput = true; } },
            async () => {
                const [myObj, _accessTracker] = setup<Obj>({ a: 2 }, ms);
                myObj.b = myObj.a * (myObj.b ?? 1) + myObj.a;
                console.log(myObj.b);

                await sleep(ms);
            }
        );

        expect(hasOutput);
    });

    it('tracks accesses correctly', async () => {
        const ms = 50;

        const [myObj, _accessTracker] = setup<Obj>({ a: 2 }, ms);
        myObj.b = myObj.a * (myObj.b ?? 1) + myObj.a;
        myObj.b = 42;

        const a = _accessTracker.get('a');
        expect(a[0] === 2 && a[1] === 0);
        const b = _accessTracker.get('b');
        expect(b[0] === 1 && b[1] === 2);

        await sleep(ms);
    })
});
