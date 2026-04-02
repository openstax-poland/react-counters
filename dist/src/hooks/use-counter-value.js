// Copyright 2020 OpenStax Poland
// Licensed under the MIT license. See LICENSE file in the project root for
// full license text.
import * as React from 'react';
import { Styles } from '../style';
import { useCounters } from './use-counters';
/**
 * Get current value of a counter on a node
 *
 * This hook corresponds to CSS function target-counter(), with the difference
 * being that it returns counter's value rather than a formatted string.
 */
export function useCounterValue(ref, counter, style) {
    const counters = useCounters(ref);
    const instances = counters.get(counter);
    const value = instances == null
        ? 0
        : instances[instances.length - 1].value;
    React.useDebugValue(value);
    return style == null
        ? value
        : (typeof style === 'string' ? Styles[style] : style).format(value);
}
