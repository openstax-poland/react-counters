## React counters

A system for implementing counters similar to CSS counters, created because
it's easier than polyfilling `target-counter()`.

### Usage

Counter states are only maintained in selected subtrees. To enable counters in
a subtree, mark its root as a _counter root_ with `useCounterRoot`:

```jsx
function MyCounterRoot() {
    const ref = React.useRef(null)
    Counters.useCounterRoot(ref)

    return <div ref={ref}>
        {/* your component here */}
    </div>
}
```

To affect counters on a node similarly mark it with `useCounter`:

```jsx
function MyNode() {
    const ref = React.useRef(null)
    Counters.useCounter(ref, { /* counter properties */})
}
```

This hook takes as its second argument an object whose property `reset`
corresponds to CSS property `counter-reset`, `increment` to `counter-increment`,
and `set` to `counter-set`. For example this CSS

```css
.my-node {
    counter-reset: a, b 2;
    counter-increment: c, d 3;
    counter-set: e, f 5;
}
```

can be written as

```jsx
const A = Counters.createCounter('a')
const B = Counters.createCounter('b')
const C = Counters.createCounter('c')
const D = Counters.createCounter('d')
const E = Counters.createCounter('e')
const F = Counters.createCounter('f')

function MyNode() {
    const ref = React.useRef(null)
    Counters.useCounter(ref, {
        reset: [A, [B, 2]],
        increment: [C, [D, 3]],
        set: [E, [F, 5]],
    })

    return <div ref={ref} className="my-node">
        {/* ... */}
    </div>
}
```

#### Getting values

Current value of a counter can be obtained using one of two hooks:
`useCounterValue` and `useCounterValues`. The first corresponds to CSS functions
`counter()` and `target-counter()`, the second to `counters()` and
`target-counters()`.

In their first form, both take reference to a node as their first argument and
a counter name as their second, and return value of the counter on specified
node. `useCounterValue` returns value of just the innermost counter, and
`useCounterValues` an array of values of all instances of the counter.

```ts
function useCounterValue(
    ref: Node | React.RefObject<Node>,
    counter: Counter,
): number

function useCounterValues(
    ref: Node | React.RefObject<Node>,
    counter: Counter,
): number[]
```

In their second form they additionally take a style (specified as an instance of
`Style` or as a string naming one of CSS's predefined counter styles), and in
case of `useCounterValues` a separator string. In this form they return the
value formatted as a string according to specified style. This is the form
equivalent to CSS functions.

```ts
export function useCounterValue(
    ref: Node | React.RefObject<Node>,
    counter: Counter,
    style: Style | StyleName,
): string

function useCounterValues(
    ref: Node | React.RefObject<Node>,
    counter: Counter,
    style: Style | StyleName,
    separator: string
): string
```

#### ::before

It is possible to specify what happens to counters on the virtual `::before`
node by passing additional `before` key in the argument to `useCounter`. This
property has the same structure as the object itself (but does not accept
a nested `before`).

For example, following CSS

```css
.my-node {
    counter-increment: a;
}

.my-node::before {
    counter-reset: a;
}
```

can be written as

```jsx
const A = Counters.createCounter('a')

function MyNode() {
    const ref = React.useRef(null)
    Counters.useCounter(ref, {
        increment: [A],
        before: {
            reset: [A],
        },
    })

    return <div ref={ref} className="my-node">
        {/* ... */}
    </div>
}
```

Note that it is not possible to obtain value of a counter on the ::before node.
