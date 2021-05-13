import * as React from 'react';
import { Instances } from '../interfaces';
/**
 * Get current state of counter instances on a node
 *
 * This is a low level hook, you probably want to use either
 * {@link useCounterValue} or {@link getCounterValues}.
 */
export declare function useCounters(ref: Node | React.RefObject<Node>): Instances;
