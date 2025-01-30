# AccessTracker

Are you working on a tangled codebase with so many intertwined parts accessing each other in various untyped ways that you can't find where something is changing?

This *might* help. No promises.

## Usage

```ts
const accessTracker = new AccessTrackerProxy<{ a: number, b?: number }>(3000);
const myObj = accessTracker.init({ a: 2, b: undefined });
myObj.b = myObj.a * (myObj.b ?? 1) + myObj.a;
console.log(myObj.b);
```
This code will output the following table to the console:
![Table with access counts](https://github.com/HoloTheDrunk/AccessTracker/blob/master/.github/table.png)
