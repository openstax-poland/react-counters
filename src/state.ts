// Copyright 2020 OpenStax Poland
// Licensed under the MIT license. See LICENSE file in the project root for
// full license text.

/** Function called when value of a counter changes for a registered node */
export type Notify = (value: number) => void

export type Unregister = () => void

/** Registration for a node */
interface Registration {
    /** Registered node */
    node: Node
    /** Functions to call when counter on this node changes */
    listeners: Notify[]
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
    public register(node: Node, notify: Notify): Unregister {
        const inx = this.findNode(node)

        if (inx < this.nodes.length && this.nodes[inx].node === node) {
            throw new Error("attempted to register node a second time")
        }

        this.nodes.splice(inx, 0, {
            node,
            listeners: [notify],
        })

        this.update(inx)

        return this.unregister.bind(this, node)
    }

    /** Remove an existing registration */
    private unregister(node: Node) {
        const index = this.nodes.findIndex(r => r.node === node)
        this.nodes.splice(index, 1)
        this.update(index)
    }

    /** Update counters for all nodes starting at an index */
    private update(start: number) {
        for (; start < this.nodes.length ; ++start) {
            for (const notify of this.nodes[start].listeners) {
                notify(start + 1)
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
