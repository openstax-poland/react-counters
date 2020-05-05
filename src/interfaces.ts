// Copyright 2020 OpenStax Poland
// Licensed under the MIT license. See LICENSE file in the project root for
// full license text.

/**
 * Reference to a counter
 *
 * References to this interface should only be obtained from
 * {@link createCounter}.
 */
export interface Counter {
    /**
     * Use this counter in a subtree
     *
     * Putting this component in a tree is equivalent to specifying CSS property
     * counter-reset on a virtual element containing this component.
     */
    Provider: React.Provider<unknown>
}

/** Action performed on a counter by a node */
export type Action = IncrementCounter | SetCounter

/**
 * Increment counter's value by a specified amount
 *
 * This actions corresponds to CSS directive counter-increment.
 */
export interface IncrementCounter {
    type: 'increment'
    by: number
}

/**
 * Reset counter to specified value
 *
 * This action corresponds to CSS directives counter-reset and counter-set.
 * While in CSS those actions are distinct in that one creates a new counter and
 * the other modifies an existing counter, this library makes no distinction
 * between them, as the only way to create a new counter is to use
 * {@link Counter.Provider}.
 */
export interface SetCounter {
    type: 'set'
    value: number
}
