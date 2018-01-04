This directory contains a starter kit for the Problem 1 of Homework 1, "Fluent Regular Expressions".

`engexp` is a Node.js module, written in [TypeScript](http://www.typescriptlang.org/), a typed
superset of JavaScript. The repository contains both TypeScript original sources (\*.ts)
and auto-generated JavaScript files (\*.js). You don't have to learn TypeScript to complete
this homework, feel free to edit JavaScript files directly.

To get started after cloning this repository, install [Node.js](https://nodejs.org),
and run `npm install`. After NPM successfully resolves all dependencies into `npm_modules`,
run `npm test`. You should see an output similar to the following:

```
$ npm test

> hw1@1.0.0 test csep590c-sp16/hw1/engexp
> mocha

  EngExp
    √ should parse a basic URL
    1) should parse a disjunctive date pattern
    2) should capture nested groups


  1 passing (48ms)
  2 failing
```

Out of the three tests defined in [test/engexp.ts](engexp/test/engexp.ts), only one is
currently passing. Your goal is to implement missing functions `or`, `beginCapture`, and `endCapture`
in [src/engexp.ts](engexp/src/engexp.ts) or [src/engexp.js](engexp/src/engexp.js)
so that the rest of the tests pass.

Note: we will be verifying your solution on an additional hidden suite of tests, so
please make sure your implementation is general-purpose.
The hidden suite will be made public after the grades are assigned.

