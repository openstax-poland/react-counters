// Copyright 2020 OpenStax Poland
// Licensed under the MIT license. See LICENSE file in the project root for
// full license text.

import * as React from 'react'

import { Counter } from '../interfaces'
import * as Observer from '../observer'
import { useCounters } from './use-counters'

/**
 * Get current value of a counter on a node
 *
 * This hook corresponds to CSS function target-counter(), with the difference
 * being that it returns counter's value rather than a formatted string.
 */
export function useCounterValue(
    ref: Node | React.RefObject<Node>,
    counter: Counter,
): number {
    const counters = useCounters(ref)
    const instances = counters.get(counter)

    return instances == null
        ? 0
        : instances[instances.length - 1].value
}
