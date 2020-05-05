// Copyright 2020 OpenStax Poland
// Licensed under the MIT license. See LICENSE file in the project root for
// full license text.

import { Action } from './interfaces'

/** Function called when value of a counter changes for a registered node */
export type Notify = (value: number) => void

export type Unregister = () => void

/** Registration for a node */
interface Registration {
    /** Registered node */
    node: Node
    /** Is this node managed or merely observed? */
    mode: 'managed' | 'observed'
    /** Functions to call when counter on this node changes */
    listeners: Notify[]
    /** Counter's current value at this node */
    value: number
    /** Action this node performs with a counter */
    action?: Action
}

export class State {
    /**
     * Nodes for which counter state is maintained
     *
     * Nodes in this array are sorted in document order, which is the same as
     * their counter order.
     */
    nodes: Registration[] = []

    /**
     * Register a node for this counter
     *
     * The returned function can be later used to unregister the node. For each
     * node there can only be a single registration at a time.
     */
    public register(node: Node, notify: Notify, action: Action): Unregister {
        const inx = this.findNode(node)
        const reg = this.nodes[inx]

        if (reg != null && reg.node === node) {
            if (reg.mode === 'managed') {
                throw new Error("attempted to register node a second time")
            }

            reg.mode = 'managed'
            reg.listeners.push(notify)
            reg.action = action
        } else {
            this.nodes.splice(inx, 0, {
                node,
                mode: 'managed',
                listeners: [notify],
                value: 0,
                action,
            })
        }

        this.update(inx)

        return this.unregister.bind(this, node)
    }

    /**
     * Watch a node for changes to this counter
     *
     * This is similar to {@link register}, but watchers don't affect counter's
     * value, and there may be multiple watchers registered for each node.
     */
    public watch(node: Node, notify: Notify): Unregister {
        const inx = this.findNode(node)
        const reg = this.nodes[inx]

        if (reg != null && reg.node === node) {
            reg.listeners.push(notify)
            notify(reg.value)
        } else {
            this.nodes.splice(inx, 0, {
                node,
                mode: 'observed',
                listeners: [notify],
                value: 0,
            })
            this.update(inx)
        }

        return this.unwatch.bind(this, node, notify)
    }

    /** Remove an existing registration */
    private unregister(node: Node) {
        const index = this.nodes.findIndex(r => r.node === node)
        this.nodes.splice(index, 1)
        this.update(index)
    }

    /** Remove listener from a registration */
    private unwatch(node: Node, notify: Notify) {
        const index = this.nodes.findIndex(r => r.node === node)
        const reg = this.nodes[index]

        if (reg.mode === 'observed' && reg.listeners.length === 1) {
            this.nodes.splice(index, 1)
            return
        }

        const i2 = reg.listeners.findIndex(l => l === notify)
        reg.listeners.splice(i2, 1)
    }

    /** Update counters for all nodes starting at an index */
    private update(start: number) {
        let value = start > 0
            ? this.nodes[start - 1].value
            : 0

        for (let inx = start ; inx < this.nodes.length ; ++inx) {
            const node = this.nodes[inx]

            if (node.action != null) {
                switch (node.action.type) {
                case 'increment': value += node.action.by; break
                case 'set': value = node.action.value; break
                }
            }

            // PERF: if value at this node didn't change then it also can't
            // change at any further node, as only the start node was modified.
            if (value === node.value) {
                break
            }

            node.value = value

            for (const notify of node.listeners) {
                notify(value)
            }
        }
    }

    /** Find index at which a node could be inserted to maintain document order */
    private findNode(node: Node): number {
        let start = 0
        let end = this.nodes.length

        while (start < end) {
            const middle = Math.floor((start + end) / 2)
            const reg = this.nodes[middle]

            if (node === reg.node) {
                return start
            }

            const o = reg.node.compareDocumentPosition(node)

            if (o & Node.DOCUMENT_POSITION_PRECEDING) {
                end = middle
            } else {
                start = middle + 1
            }
        }

        return start
    }
}
