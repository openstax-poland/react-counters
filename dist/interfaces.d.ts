/**
 * Reference to a counter
 *
 * References to this interface should only be obtained from
 * {@link createCounter}.
 */
export interface Counter {
}
/** Create a new counter */
export declare function createCounter(options?: {
    name?: string;
}): Counter;
/** Current state of counters on a node */
export type Instances = Map<Counter, Instance[]>;
/** Instance of a counter */
export interface Instance {
    /** Node which created this instance */
    origin: Origin;
    /** Current value */
    value: number;
}
/** Node on which a counter instance was created */
export type Origin = Node | Before;
/** A virtual ::before node */
export type Before = {
    node: Node;
};
