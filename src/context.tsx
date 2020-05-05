// Copyright 2020 OpenStax Poland
// Licensed under the MIT license. See LICENSE file in the project root for
// full license text.

import * as React from 'react'

import { Counter } from './interfaces'
import { COUNTER_CONTEXTS } from './maps'
import { State } from './state'

/** Create a new counter */
export function createCounter(options: {
    name?: string
} = {}): Counter {
    const { name } = options

    const context = React.createContext(null)
    context.displayName = name ? `Counter (${name})` : "Counter"

    const counter: Counter = Object.freeze({
        Provider: Provider.bind(null, context),
    })

    COUNTER_CONTEXTS.set(counter, context)

    return counter
}

interface ProviderProps {
    children?: React.ReactNode
}

/** Counter state provider */
function Provider(context: React.Context<unknown>, props: ProviderProps) {
    const { children } = props

    const state = React.useRef(null)

    if (state.current == null) {
        state.current = new State()
    }

    return <context.Provider value={state.current}>
        {children}
    </context.Provider>
}
