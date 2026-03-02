import { Counter, Instances } from './interfaces';
/** Function called when state of counters on a node changes */
export type Notify = (counters: Instances) => void;
/** Actions to perform on counters */
export type Actions = Map<Counter, Action>;
/** Actions to perform on a counter */
export interface Action {
    /** Value to reset the counter to */
    reset?: number;
    /** Value to add to the counter */
    increment?: number;
    /** Value to set the counter to */
    set?: number;
}
/**
 * Start tracking counter values in a subtree rooted at node
 *
 * The returned function can be called to stop tracking this subtree.
 */
export declare function trackRoot(node: Node): () => void;
/**
 * Set counter actions to be performed on a node
 *
 * Any previously set actions will be removed prior to setting these actions.
 */
export declare function setActions(node: Node, actions: Actions, before?: Actions): void;
/**
 * Observe a node for changes to counter values
 *
 * Notification function will be called with current states of all counters
 * whenever they change.
 *
 * The returned function can be called to unregister the listener.
 */
export declare function observe(node: Node, notify: Notify): () => void;
