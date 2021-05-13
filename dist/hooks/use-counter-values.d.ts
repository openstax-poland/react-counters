import * as React from 'react';
import { Counter } from '../interfaces';
import { Style, StyleName } from '../style';
export declare function useCounterValues(ref: Node | React.RefObject<Node>, counter: Counter): number[];
export declare function useCounterValues(ref: Node | React.RefObject<Node>, counter: Counter, style: Style | StyleName, separator: string): string;
