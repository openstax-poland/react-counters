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
