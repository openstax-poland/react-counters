// Copyright 2020 OpenStax Poland
// Licensed under the MIT license. See LICENSE file in the project root for
// full license text.

import * as React from 'react'

import { Counter } from '../interfaces'
import { getContext } from '../maps'

/**
 * Get current value of a counter on a node.
 *
 * This hook is equivalent to CSS function target-counter(). It doesn't affect
 * value of any counters.
 */
export function useTargetCounter(target: Node, counter: Counter): number {
    const [value, setValue] = React.useState(0)
    const state = React.useContext(getContext(counter))

    React.useEffect(() => {
        if (target != null) {
            return state.watch(target, setValue)
        }
    }, [target, state])

    return value
}
