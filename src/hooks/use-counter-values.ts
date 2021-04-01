// Copyright 2020 OpenStax Poland
// Licensed under the MIT license. See LICENSE file in the project root for
// full license text.

import * as React from 'react'

import { Counter } from '../interfaces'
import { Style, StyleName, Styles } from '../style'
import { useCounters } from './use-counters'

export function useCounterValues(
    ref: Node | React.RefObject<Node>,
    counter: Counter,
): number[]

export function useCounterValues(
    ref: Node | React.RefObject<Node>,
    counter: Counter,
    style: Style | StyleName,
    separator: string
): string

/**
 * Get current value of a counter on a node, and values of all counters
 * containing it
 *
 * This hook corresponds to CSS function target-counters(), with the difference
 * being that it returns an array of values rather than a formatted string.
 */
export function useCounterValues(
    ref: Node | React.RefObject<Node>,
    counter: Counter,
    style?: Style | StyleName,
    separator?: string,
): number[] | string {
    const counters = useCounters(ref)
    const instances = counters.get(counter) || []
    const values = instances.map(i => i.value)

    React.useDebugValue(values)

    return style == null
        ? values
        : (typeof style === 'string' ? Styles[style] : style).format(values, separator)
}
