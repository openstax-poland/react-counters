// Copyright 2020 OpenStax Poland
// Licensed under the MIT license. See LICENSE file in the project root for
// full license text.

import * as React from 'react'

import { Counter } from '../interfaces'
import * as Observer from '../observer'

/** Actions which can be performed on counters of a node */
export interface Actions {
    /**
     * Reset counter's value
     *
     * This corresponds to CSS property counter-reset.
     */
    reset?: Action[]
    /**
     * Increment counter's value
     *
     * This corresponds to CSS property counter-increment.
     */
    increment?: Action[]
    /**
     * Set counter's value
     *
     * This corresponds to CSS property counter-set.
     */
    set?: Action[]
}

export type Action = [Counter, number] | Counter

/**
 * Perform actions on counters of a node
 *
 * The node on which counters will be processed is specified by ref.
 */
export function useCounter(
    ref: React.RefObject<Node>,
    actions: Partial<Actions>,
): void {
    const compiledActions = React.useMemo(() => compileActions(actions), [actions])

    React.useEffect(() => {
        Observer.setActions(ref.current, compiledActions)
    }, [ref, actions])
}

const TYPES: (keyof Actions)[] = ['reset', 'increment', 'set']

function compileActions(src: Actions): Observer.Actions {
    const actions = new Map()

    for (const key of TYPES) {
        if (src[key] == null) {
            continue
        }

        for (const action of src[key]) {
            const [name, value] = action instanceof Array
                ? action
                : [action, key === 'increment' ? 1 : 0]

            let counter = actions.get(name)

            if (counter == null) {
                actions.set(name, counter = {})
            }

            if (counter[key] == null || key !== 'increment') {
                counter[key] = value
            } else {
                counter[key] += value
            }
        }
    }

    return actions
}
