// Copyright 2020 OpenStax Poland
// Licensed under the MIT license. See LICENSE file in the project root for
// full license text.
/** Symbol used to associate a node with it's virtual ::before child */
const BEFORE = Symbol('::before');
/** Roots of trees in which we maintain counter state */
const ROOTS = new Map();
/** Per-node data */
const NODES = new WeakMap();
/**
 * Start tracking counter values in a subtree rooted at node
 *
 * The returned function can be called to stop tracking this subtree.
 */
export function trackRoot(node) {
    for (const root of ROOTS.keys()) {
        if (root === node) {
            throw new Error("Attempted to observe an already observed node");
        }
        const p = root.compareDocumentPosition(node);
        if ((p & Node.DOCUMENT_POSITION_CONTAINS) !== 0) {
            throw new Error("Attempted to observe a node containing another observed node");
        }
        if ((p & Node.DOCUMENT_POSITION_CONTAINED_BY) !== 0) {
            throw new Error("Attempted to observe a node contained within another observed node");
        }
    }
    const observer = new MutationObserver(onMutation);
    observer.observe(node, {
        childList: true,
        subtree: true,
    });
    ROOTS.set(node, observer);
    update([node]);
    return () => {
        observer.disconnect();
        ROOTS.delete(node);
    };
}
/**
 * Set counter actions to be performed on a node
 *
 * Any previously set actions will be removed prior to setting these actions.
 */
export function setActions(node, actions, before) {
    const state = getState(node);
    state.counters.actions = actions;
    if (before != null) {
        state.before = { instances: new Map(), actions: before };
    }
    else {
        delete state.before;
    }
    for (const root of ROOTS.keys()) {
        const p = root.compareDocumentPosition(node);
        if (root === node || p & Node.DOCUMENT_POSITION_CONTAINS) {
            return update([node]);
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
export function observe(node, notify) {
    const state = getState(node);
    state.listeners.push(notify);
    notify(state.counters.instances);
    return () => {
        const inx = state.listeners.findIndex(n => n === notify);
        state.listeners.splice(inx, 1);
    };
}
function onMutation(mutations) {
    const dirty = new Set();
    for (const mutation of mutations) {
        if (mutation.type !== 'childList') {
            continue;
        }
        // Newly inserted nodes wouldn't have their counters calculated, and
        // moved nodes need them recalculated.
        for (const node of mutation.addedNodes) {
            dirty.add(node);
        }
        // When a node is removed the next node (in document order) may need
        // its counters recalculated. However since removed nodes have already
        // been disconnected from the DOM we can't find the next node. Instead
        // we first try the next node to previousSibling, and if it is not set
        // we mark all child nodes of target as dirty. This way we may process
        // more nodes than necessary in update(), but we won't miss any.
        if (mutation.removedNodes.length > 0) {
            if (mutation.previousSibling != null) {
                const node = next(mutation.previousSibling, false);
                if (node != null)
                    dirty.add(node);
            }
            else {
                for (const node of mutation.target.childNodes) {
                    dirty.add(node);
                }
            }
        }
    }
    update(Array.from(dirty));
}
/** Update counters in tracked subtrees given a list of changed nodes */
function update(dirty) {
    dirty.sort(compareNodePositions);
    while (dirty.length > 0) {
        let node = dirty.shift();
        for (; node != null; node = next(node)) {
            let state = NODES.get(node);
            let changed = false;
            if (state == null) {
                state = createState(node);
                changed = true;
            }
            const counterSrc = getCounterSource(node);
            const valueSrc = getValueSource(node);
            changed = processCounters(node, state.counters, counterSrc, valueSrc) || changed;
            if (changed) {
                for (const notify of state.listeners) {
                    notify(state.counters.instances);
                }
            }
            changed = processBefore(node, state) || changed;
            // PERF: if values of counters didn't change we don't need to spend
            // time notifying listeners (and potentially re-rendering parts of
            // the document).
            if (!changed) {
                break;
            }
        }
        // PERF: Remove dirty nodes already processed when processing previous
        // dirty nodes.
        while (dirty.length > 0
            /* eslint-disable-next-line no-unmodified-loop-condition */
            && (node == null || isBefore(dirty[0], node) || dirty[0] === node)) {
            dirty.shift();
        }
    }
}
/** Process the ::before child of a node */
function processBefore(node, state) {
    // Node has no ::before child.
    if (state.before == null) {
        return false;
    }
    // Node used to have a ::before child, but it was removed.
    if (state.before.actions == null) {
        delete state.before;
        return true;
    }
    /* eslint-disable @typescript-eslint/no-explicit-any,
        @typescript-eslint/no-unsafe-assignment,
        @typescript-eslint/no-unsafe-member-access */
    const before = BEFORE in node
        ? node[BEFORE]
        : node[BEFORE] = { before: node };
    /* eslint-enable @typescript-eslint/no-explicit-any,
        @typescript-eslint/no-unsafe-assignment,
        @typescript-eslint/no-unsafe-member-access */
    // Since ::before is always the first child node will be
    // both its counter and value source.
    const src = state.counters.instances;
    return processCounters(before, state.before, src, src);
}
/** Create new state for a node */
function createState(node) {
    const state = {
        counters: { instances: new Map() },
        listeners: [],
    };
    NODES.set(node, state);
    return state;
}
/** Get node's state, creating new one if necessary */
function getState(node) {
    const state = NODES.get(node);
    return state != null
        ? state
        : createState(node);
}
/** Get counter source for a given node */
function getCounterSource(node) {
    if (node.previousSibling != null) {
        return getState(node.previousSibling).counters.instances;
    }
    if (node.parentElement == null)
        return new Map();
    const parent = getState(node.parentElement);
    return parent.before != null
        ? parent.before.instances
        : parent.counters.instances;
}
/** Get counter value source for a given node */
function getValueSource(node) {
    const p = prev(node);
    if (p === node.parentElement) {
        const parent = getState(p);
        if (parent.before != null) {
            return parent.before.instances;
        }
    }
    return getState(p).counters.instances;
}
/** Process counters on a node */
function processCounters(origin, state, counterSrc, valueSrc) {
    var _a;
    const counters = new Map();
    let changed = false;
    // Inherit counters.
    for (const [name, iv] of valueSrc) {
        const ic = counterSrc.get(name);
        if (ic == null) {
            continue;
        }
        const instances = [];
        for (let i = 0; i < iv.length && i < ic.length; ++i) {
            if (iv[i].origin !== ic[i].origin) {
                break;
            }
            instances.push({
                origin: iv[i].origin,
                value: iv[i].value,
            });
        }
        if (instances.length > 0) {
            counters.set(name, instances);
        }
    }
    // Perform actions on counters. Since counters are independent,
    // instead of performing each action separately for all counters
    // (as it is described in CSS spec) we perform all actions for each
    // counter. This way we can easily check whether value of a given
    // counter instance has changed, and thus whether we can skip
    // notifying listeners.
    for (const [name, actions] of (_a = state.actions) !== null && _a !== void 0 ? _a : []) {
        let instances = counters.get(name);
        if (instances == null) {
            instances = [{ origin, value: 0 }];
            counters.set(name, instances);
        }
        if (actions.reset != null) {
            const last = instances[instances.length - 1];
            if (last.origin === origin
                || (!isBefore(last.origin, origin) && isSibling(last.origin, origin))) {
                instances.pop();
            }
            instances.push({ origin, value: actions.reset });
        }
        const last = instances[instances.length - 1];
        if (actions.increment != null) {
            last.value += actions.increment;
        }
        if (actions.set != null) {
            last.value = actions.set;
        }
    }
    // Check if there are any counters witch changed values.
    for (const [name, instances] of counters) {
        const oldInstances = state.instances.get(name);
        if (oldInstances == null
            || !compareInstances(instances, oldInstances)) {
            changed = true;
        }
        state.instances.delete(name);
    }
    // Any counters left in the old states have been removed.
    if (state.instances.size > 0) {
        changed = true;
    }
    // Update state with new counter values.
    state.instances = counters;
    return changed;
}
/** Check two counter instance stacks for equality */
function compareInstances(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; ++i) {
        if (a[i].origin !== b[i].origin || a[i].value !== b[i].value) {
            return false;
        }
    }
    return true;
}
/** Return next node in document order */
function next(node, children = true) {
    if (children && node.hasChildNodes()) {
        return node.firstChild;
    }
    for (;;) {
        if (node.nextSibling != null) {
            return node.nextSibling;
        }
        if (node.parentElement == null)
            return null;
        node = node.parentElement;
        if (ROOTS.has(node)) {
            return null;
        }
    }
}
/** Return previous node in document order */
function prev(node) {
    var _a;
    if (node.previousSibling != null) {
        let n = node.previousSibling;
        while (n.hasChildNodes()) {
            n = n.lastChild;
        }
        return n;
    }
    return (_a = node.parentElement) !== null && _a !== void 0 ? _a : node;
}
/** Return true if a is before b in document order */
function isBefore(a, b) {
    const an = unpackOrigin(a);
    const bn = unpackOrigin(b);
    return (bn.compareDocumentPosition(an) & Node.DOCUMENT_POSITION_PRECEDING) !== 0;
}
/** Return true if a is a sibling of b */
function isSibling(a, b) {
    const ref = b instanceof Node ? b.parentElement : b.node;
    return unpackOrigin(a).parentElement === ref;
}
function unpackOrigin(origin) {
    return origin instanceof Node ? origin : origin.node;
}
/**
 * Compare relative positions of two nodes
 *
 * This function can be used as a sort comparator to sort an array according to
 * document order.
 */
function compareNodePositions(a, b) {
    const p = b.compareDocumentPosition(a);
    return (p & Node.DOCUMENT_POSITION_PRECEDING) !== 0
        ? -1
        : (p & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
            ? 1
            : 0;
}
