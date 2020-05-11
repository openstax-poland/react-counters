// Copyright 2020 OpenStax Poland
// Licensed under the MIT license. See LICENSE file in the project root for
// full license text.

import { Counter, Instances, Instance } from './interfaces'

/** Roots of trees in which we maintain counter state */
const ROOTS = new Map<Node, MutationObserver>()

/** Per-node data */
const NODES = new WeakMap<Node, State>()

/** Per-node data */
interface State {
    /** Current state of counters on this node */
    counters: Instances
    /** Actions to perform on counters on this node */
    actions?: Actions
    /** Listeners to notify when counter values change */
    listeners: Notify[]
}

/** Function called when state of counters on a node changes */
export type Notify = (counters: Instances) => void

/** Actions to perform on counters */
export type Actions = Map<Counter, Action>

/** Actions to perform on a counter */
export interface Action {
    /** Value to reset the counter to */
    reset?: number
    /** Value to add to the counter */
    increment?: number
    /** Value to set the counter to */
    set?: number
}

/**
 * Start tracking counter values in a subtree rooted at node
 *
 * The returned function can be called to stop tracking this subtree.
 */
export function trackRoot(node: Node): () => void {
    for (const root of ROOTS.keys()) {
        if (root === node) {
            throw new Error("Attempted to observe an already observed node")
        }

        const p = root.compareDocumentPosition(node)

        if ((p & Node.DOCUMENT_POSITION_CONTAINS) !== 0) {
            throw new Error(
                "Attempted to observe a node containing another observed node")
        }

        if ((p & Node.DOCUMENT_POSITION_CONTAINED_BY) !== 0) {
            throw new Error(
                "Attempted to observe a node contained within another observed node")
        }
    }

    const observer = new MutationObserver(onMutation)

    observer.observe(node, {
        childList: true,
        subtree: true,
    })

    ROOTS.set(node, observer)

    update([node])

    return () => {
        observer.disconnect()
        ROOTS.delete(node)
    }
}

/**
 * Set counter actions to be performed on a node
 *
 * Any previously set actions will be removed prior to setting these actions.
 */
export function setActions(node: Node, actions: Actions) {
    const state = getState(node)

    state.actions = actions

    for (const root of ROOTS.keys()) {
        const p = root.compareDocumentPosition(node)

        if (p & Node.DOCUMENT_POSITION_CONTAINS) {
            return update([node])
        }
    }
}

/**
 * Observe a node for changes to counter values
 *
 * Notification function will be called with current states of all counters
 * whenever they change.
 *
 * The returned function can be called to unregister the listener.
 */
export function observe(node: Node, notify: Notify): () => void {
    const state = getState(node)

    state.listeners.push(notify)

    notify(state.counters)

    return () => {
        const inx = state.listeners.findIndex(n => n === notify)
        state.listeners.splice(inx, 1)
    }
}

function onMutation(mutations: MutationRecord[]) {
    const dirty = new Set<Node>()

    for (const mutation of mutations) {
        if (mutation.type !== 'childList') {
            continue
        }

        // Newly inserted nodes wouldn't have their counters calculated, and
        // moved nodes need them recalculated.
        for (const node of mutation.addedNodes) {
            dirty.add(node)
        }

        // When a node is removed the next node (in document order) may need
        // its counters recalculated. However since removed nodes have already
        // been disconnected from the DOM we can't find the next node. Instead
        // we first try the next node to previousSibling, and if it is not set
        // we mark all child nodes of target as dirty. This way we may process
        // more nodes than necessary in update(), but we won't miss any.
        if (mutation.removedNodes.length > 0) {
            if (mutation.previousSibling != null) {
                dirty.add(next(mutation.previousSibling, false))
            } else {
                for (const node of mutation.target.childNodes) {
                    dirty.add(node)
                }
            }
        }
    }

    update(Array.from(dirty))
}

/** Update counters in tracked subtrees given a list of changed nodes */
function update(dirty: Node[]) {
    dirty.sort(compareNodePositions)

    while (dirty.length > 0) {
        let node = dirty.shift()

        for (; node != null ; node = next(node)) {
            let state = NODES.get(node)
            let changed = false

            if (state == null) {
                state = createState(node)
                changed = true
            }

            const counters = new Map()

            // Inherit counters.

            const counterSrc = getCounterSource(node)
            const valueSrc = getValueSource(node)

            for (const [name, iv] of valueSrc) {
                const ic = counterSrc.get(name)

                if (ic == null) {
                    continue
                }

                const instances: Instance[] = []
                counters.set(name, instances)

                for (let i = 0 ; i < iv.length && i < ic.length ; ++i) {
                    if (iv[i].origin !== ic[i].origin) {
                        break
                    }

                    instances.push({
                        origin: iv[i].origin,
                        value: iv[i].value,
                    })
                }
            }

            // Perform actions on counters. Since counters are independent,
            // instead of performing each action separately for all counters
            // (as it is described in CSS spec) we perform all actions for each
            // counter. This way we can easily check whether value of a given
            // counter instance has changed, and thus whether we can skip
            // notifying listeners.

            for (const [name, actions] of state.actions || []) {
                let instances = counters.get(name)

                if (instances == null) {
                    instances = [{ origin: node, value: 0 }]
                    counters.set(name, instances)
                }

                if (actions.reset != null) {
                    const last = instances[instances.length - 1]

                    if (last.origin === node || isSibling(last.origin, node)) {
                        instances.pop()
                    }

                    instances.push({ origin: node, value: actions.reset })
                }

                const last = instances[instances.length - 1]

                if (actions.increment != null) {
                    last.value += actions.increment
                }

                if (actions.set != null) {
                    last.value = actions.set
                }
            }

            // Check if there are any counters witch changed values.
            for (const [name, instances] of counters) {
                const oldInstances = state.counters.get(name)

                if (oldInstances == null
                || !compareInstances(instances, oldInstances)) {
                    changed = true
                }

                state.counters.delete(name)
            }

            // Any counters left in the old states have been removed.
            if (state.counters.size > 0) {
                changed = true
            }

            // Update state with new counter values.
            state.counters = counters

            // PERF: if values of counters didn't change we don't need to spend
            // time notifying listeners (and potentially re-rendering parts of
            // the document).
            if (!changed) {
                break
            }

            for (const notify of state.listeners) {
                notify(state.counters)
            }
        }

        // PERF: Remove dirty nodes already processed when processing previous
        // dirty nodes.
        while (dirty.length > 0
        && (isBefore(dirty[0], node) || dirty[0] === node)) {
            dirty.shift()
        }
    }
}

/** Create new state for a node */
function createState(node: Node): State {
    const state: State = {
        counters: new Map(),
        listeners: [],
    }

    NODES.set(node, state)

    return state
}

/** Get node's state, creating new one if necessary */
function getState(node: Node): State {
    const state = NODES.get(node)

    return state != null
        ? state
        : createState(node)
}

/** Get counter source for a given node */
function getCounterSource(node: Node): Instances {
    if (node.previousSibling != null) {
        return getState(node.previousSibling).counters
    }

    return getState(node.parentElement).counters
}

/** Get counter value source for a given node */
function getValueSource(node: Node): Instances {
    return getState(prev(node)).counters
}

/** Check two counter instance stacks for equality */
function compareInstances(a: Instance[], b: Instance[]): boolean {
    if (a.length !== b.length) {
        return false
    }

    for (let i = 0 ; i < a.length ; ++i) {
        if (a[i].origin !== b[i].origin || a[i].value !== b[i].value) {
            return false
        }
    }

    return true
}

/** Return next node in document order */
function next(node: Node, children: boolean = true): Node | null {
    if (children && node.hasChildNodes()) {
        return node.firstChild
    }

    for (;;) {
        if (node.nextSibling != null) {
            return node.nextSibling
        }

        node = node.parentElement

        if (ROOTS.has(node)) {
            return null
        }
    }
}

/** Return previous node in document order */
function prev(node: Node): Node {
    if (node.previousSibling != null) {
        if (node.previousSibling.hasChildNodes()) {
            return node.previousSibling.lastChild
        }

        return node.previousSibling
    }

    return node.parentElement
}

/** Return true if a is before b in document order */
function isBefore(a: Node, b: Node): boolean {
    return (b.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_PRECEDING) != 0
}

/** Return true if a is a sibling of b */
function isSibling(a: Node, b: Node): boolean {
    return a.parentElement === b.parentElement
}

/**
 * Compare relative positions of two nodes
 *
 * This function can be used as a sort comparator to sort an array according to
 * document order.
 */
function compareNodePositions(a: Node, b: Node): number {
    const p = b.compareDocumentPosition(a)

    return (p & Node.DOCUMENT_POSITION_PRECEDING) != 0
        ? -1
        : (p & Node.DOCUMENT_POSITION_FOLLOWING) != 0
            ? 1
            : 0
}
