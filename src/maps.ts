// Copyright 2020 OpenStax Poland
// Licensed under the MIT license. See LICENSE file in the project root for
// full license text.

import { Counter } from './interfaces'
import { State } from './state'

/**
 * Mapping from counter descriptors created by {@link createCounter} to their
 * specific React contexts
 */
export const COUNTER_CONTEXTS: WeakMap<Counter, React.Context<State>> = new WeakMap()

/**
 * Get a React context for a counter, throwing if the counter wasn't created by
 * {@link createCounter}
 */
export function getContext(counter: Counter): React.Context<State> {
    const context = COUNTER_CONTEXTS.get(counter)

    if (context == null) {
        throw new Error("attempted to use counter not created with createCounter")
    }

    return context
}
