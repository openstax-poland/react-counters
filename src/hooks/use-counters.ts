// Copyright 2020 OpenStax Poland
// Licensed under the MIT license. See LICENSE file in the project root for
// full license text.

import * as React from 'react'

import * as Observer from '../observer'
import { Instances } from '../interfaces'

/**
 * Get current state of counter instances on a node
 *
 * This is a low level hook, you probably want to use either
 * {@link useCounterValue} or {@link getCounterValues}.
 */
export function useCounters(ref: Node | React.RefObject<Node>): Instances {
    const [state, setState] = React.useState(new Map())

    React.useEffect(() => {
        const node = ref == null
            ? null
            : ref instanceof Node
                ? ref
                : ref.current

        if (node == null) {
            return
        }

        return Observer.observe(node, setState)
    }, [ref])

    return state
}
