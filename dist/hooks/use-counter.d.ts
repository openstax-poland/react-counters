import * as React from 'react';
import { Counter } from '../interfaces';
/** Actions which can be performed on counters of a node */
export interface Actions {
    /**
     * Reset counter's value
     *
     * This corresponds to CSS property counter-reset.
     */
    reset?: Action[];
    /**
     * Increment counter's value
     *
     * This corresponds to CSS property counter-increment.
     */
    increment?: Action[];
    /**
     * Set counter's value
     *
     * This corresponds to CSS property counter-set.
     */
    set?: Action[];
}
export declare type Action = [Counter, number] | Counter;
/**
 * Actions which can be performed on counters of a node
 *
 * Properties inherited from {@link Actions} specify actions on the node itself,
 * properties in before specify actions on a virtual ::before node.
 */
export interface ActionSpec extends Actions {
    before?: Actions;
}
/**
 * Perform actions on counters of a node
 *
 * The node on which counters will be processed is specified by ref.
 */
export declare function useCounter(ref: React.RefObject<Node>, actions: ActionSpec): void;
