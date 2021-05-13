/**
 * Representation of a counter style
 */
export declare class Style {
    /** System to use to format a single number */
    readonly system: System;
    /** Value to prefix and suffix to a formatted number when it is negative */
    readonly negative: NegativeSymbol;
    /** Limit on range of supported values */
    readonly range: Range;
    /** Minimal length and padding of a formatted value */
    readonly pad?: Pad;
    /** Style to fall back to when value can't be formatted using this one */
    readonly fallback: Style;
    /**
     * Create a new style
     *
     * This functions is a shorthand for creating a new {@link System} instance
     * and passing it to {@link Style}'s constructor, designed to look closer
     * to CSS's {@code @counter-style} declaration.
     */
    static create(options: {
        negative?: string | NegativeSymbol;
        range?: Partial<Range>;
        pad?: Pad;
        fallback?: Style;
    } & SystemOptions): Style;
    constructor(options: {
        system: System;
        negative?: string | NegativeSymbol;
        range?: Partial<Range>;
        pad?: Pad;
        fallback?: Style;
    });
    /** Format a single number */
    format(value: number): string;
    /** Format a full counter sequence using a separator */
    format(value: number[], separator: string): string;
    /** Format a single number */
    private formatNumber;
    /** Format multiple numbers */
    private formatNumbers;
}
/** Symbols to add to a formatted value when it is negative */
export interface NegativeSymbol {
    /** Symbol to prefix to the value */
    prefix: string;
    /** Symbol to suffix to the value */
    suffix?: string;
}
export interface Range {
    min: number;
    max: number;
}
export interface Pad {
    /** Minimal length */
    length: number;
    /** Symbol used to pad a formatted value to the minimal length */
    symbol: string;
}
/** A system describing how number should be represented in text */
export interface System {
    /**
     * Range of values supported by this system
     *
     * Values from outside this range must not be passed to
     {@link System#format}.
     */
    readonly range: Range;
    /**
     * Format a number
     *
     * If the number cannot be formatted using this system {@code null} is
     * returned.
     */
    format(number: number): string | null;
}
export declare type SystemOptions = CyclicArgs | FixedArgs | SymbolicArgs | AlphabeticArgs | NumericArgs | AdditiveArgs;
/**
 * System which cycles repeatedly through its provided symbols, looping back to
 * the beginning when it reaches the end of the list
 */
export declare class Cyclic implements System {
    readonly symbols: string[];
    constructor(symbols: Iterable<string>);
    get range(): Range;
    format(number: number): string;
}
interface CyclicArgs {
    system: 'cyclic';
    symbols: Iterable<string>;
}
/**
 * System which runs through its list of counter symbols once, then falls back
 */
export declare class Fixed implements System {
    readonly firstValue: number;
    readonly symbols: string[];
    constructor(symbols: Iterable<string>, firstValue?: number);
    get range(): Range;
    format(number: number): string;
}
interface FixedArgs {
    system: 'fixed';
    symbols: Iterable<string>;
    firstValue?: number;
}
/**
 * System which cycles repeatedly through its provided symbols, doubling,
 * tripling, etc. the symbols on each successive pass through the list
 *
 * This implementation is limited to 60 repetitions, after which it will fall
 * back.
 */
export declare class Symbolic implements System {
    readonly symbols: string[];
    constructor(symbols: Iterable<string>);
    get range(): Range;
    format(number: number): string;
}
interface SymbolicArgs {
    system: 'symbolic';
    symbols: Iterable<string>;
}
/**
 * System which system interprets the list of counter symbols as digits to
 * an alphabetic numbering system
 */
export declare class Alphabetic implements System {
    readonly symbols: string[];
    constructor(symbols: Iterable<string>);
    get range(): Range;
    format(number: number): string;
}
interface AlphabeticArgs {
    system: 'alphabetic';
    symbols: Iterable<string>;
}
/**
 * System which interprets the list of counter symbols as digits to a
 * "place-value" numbering system
 */
export declare class Numeric implements System {
    readonly symbols: string[];
    constructor(symbols: Iterable<string>);
    get range(): Range;
    format(number: number): string;
}
interface NumericArgs {
    system: 'numeric';
    symbols: Iterable<string>;
}
/** Sign-value numbering system */
export declare class Additive implements System {
    readonly symbols: [number, string][];
    constructor(symbols: Iterable<[number, string]>);
    get range(): Range;
    format(value: number): string;
}
interface AdditiveArgs {
    system: 'additive';
    symbols: Iterable<[number, string]>;
}
export declare class Chinese implements System {
    readonly formal: boolean;
    readonly digits: string[];
    readonly counters: {
        [key: number]: string;
    };
    constructor(formal: boolean, digits: Iterable<string>, counters: string | string[]);
    get range(): Range;
    format(number: number): string;
}
export declare class Ethiopic implements System {
    static DIGITS: string[];
    get range(): Range;
    format(number: number): string;
}
export declare const Styles: {
    armenian: Style;
    bengali: Style;
    cambodian: Style;
    devanagari: Style;
    georgian: Style;
    gujarati: Style;
    gurmukhi: Style;
    hebrew: Style;
    kannada: Style;
    lao: Style;
    malayalam: Style;
    mongolian: Style;
    myanmar: Style;
    oriya: Style;
    persian: Style;
    tamil: Style;
    telugu: Style;
    thai: Style;
    tibetan: Style;
    hiragana: Style;
    katakana: Style;
    disc: Style;
    circle: Style;
    square: Style;
    decimal: Style;
    'decimal-leading-zero': Style;
    'arabic-indic': Style;
    'upper-armenian': Style;
    'lower-armenian': Style;
    khmer: Style;
    'cjk-decimal': Style;
    'lower-roman': Style;
    'upper-roman': Style;
    'lower-alpha': Style;
    'upper-alpha': Style;
    'lower-latin': Style;
    'upper-latin': Style;
    'hiragana-iroha': Style;
    'katakana-iroha': Style;
    'cjk-earthly-branch': Style;
    'cjk-heavenly-stem': Style;
    'lower-greek': Style;
    'japanese-formal': Style;
    'japanese-informal': Style;
    'korean-hangul-formal': Style;
    'korean-hanja-informal': Style;
    'korean-hanja-formal': Style;
    'simp-chinese-informal': Style;
    'simp-chinese-formal': Style;
    'trad-chinese-informal': Style;
    'trad-chinese-formal': Style;
    'ethiopic-numeric': Style;
};
export declare type StyleName = keyof typeof Styles;
export {};
