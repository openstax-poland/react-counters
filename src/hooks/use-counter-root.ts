// Copyright 2020 OpenStax Poland
// Licensed under the MIT license. See LICENSE file in the project root for
// full license text.

import * as React from 'react'

import * as Observer from '../observer'

/** Mark element referenced by the ref as a counter root */
export function useCounterRoot(ref: React.RefObject<HTMLElement>): void {
    React.useLayoutEffect(() => Observer.trackRoot(ref.current), [ref])
}
