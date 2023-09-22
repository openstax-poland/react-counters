// Copyright 2020 OpenStax Poland
// Licensed under the MIT license. See LICENSE file in the project root for
// full license text.
import * as React from 'react';
import * as Observer from '../observer';
/**
 * Perform actions on counters of a node
 *
 * The node on which counters will be processed is specified by ref.
 */
export function useCounter(ref, actions) {
    const compiled = React.useMemo(() => ({
        actions: compileActions(actions),
        before: actions.before && compileActions(actions.before),
    }), [actions]);
    React.useLayoutEffect(() => {
        if (ref.current != null) {
            Observer.setActions(ref.current, compiled.actions, compiled.before);
        }
    }, [ref, actions]);
}
const TYPES = ['reset', 'increment', 'set'];
function compileActions(src) {
    const actions = new Map();
    for (const key of TYPES) {
        const keyval = src[key];
        if (keyval == null) {
            continue;
        }
        for (const action of keyval) {
            const [name, value] = action instanceof Array
                ? action
                : [action, key === 'increment' ? 1 : 0];
            let counter = actions.get(name);
            if (counter == null) {
                actions.set(name, counter = {});
            }
            if (counter[key] == null || key !== 'increment') {
                counter[key] = value;
            }
            else {
                counter[key] += value;
            }
        }
    }
    return actions;
}
