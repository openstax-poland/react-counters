// Copyright 2020 OpenStax Poland
// Licensed under the MIT license. See LICENSE file in the project root for
// full license text.

import * as React from 'react'

import { Counter } from '../interfaces'
import { getContext } from '../maps'

/**
 * Get current value of a counter on a node.
 *
 * The node on which counters will be processed is specified by ref.
 *
 * This hook performs operation equivalent to CSS directive counter-increment,
 * and returns a number which CSS function counter() would use for formatting.
 */
export function useCounter(ref: React.RefObject<Node>, counter: Counter): number {
    const [value, setValue] = React.useState(0)
    const state = React.useContext(getContext(counter))

    React.useEffect(() => {
        return state.register(ref.current, setValue)
    }, [state, ref])

    return value
}
