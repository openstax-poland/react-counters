// Copyright 2020 OpenStax Poland
// Licensed under the MIT license. See LICENSE file in the project root for
// full license text.

let FALLBACK: Style

/**
 * Representation of a counter style
 */
export class Style {
    /** System to use to format a single number */
    public readonly system: System

    /** Value to prefix and suffix to a formatted number when it is negative */
    public readonly negative: NegativeSymbol

    /** Limit on range of supported values */
    public readonly range: Range

    /** Minimal length and padding of a formatted value */
    public readonly pad?: Pad

    /** Style to fall back to when value can't be formatted using this one */
    public readonly fallback: Style

    /**
     * Create a new style
     *
     * This functions is a shorthand for creating a new {@link System} instance
     * and passing it to {@link Style}'s constructor, designed to look closer
     * to CSS's {@code @counter-style} declaration.
     */
    public static create(
        options: {
            negative?: string | NegativeSymbol,
            range?: Partial<Range>,
            pad?: Pad,
            fallback?: Style,
        } & SystemOptions,
    ): Style {
        let system

        switch (options.system) {
        case 'cyclic':
            system = new Cyclic(options.symbols)
            break

        case 'fixed':
            system = new Fixed(options.symbols, options.firstValue)
            break

        case 'symbolic':
            system = new Symbolic(options.symbols)
            break

        case 'alphabetic':
            system = new Alphabetic(options.symbols)
            break

        case 'numeric':
            system = new Numeric(options.symbols)
            break

        case 'additive':
            system = new Additive(options.symbols)
            break
        }

        return new Style({ ...options, system })
    }

    public constructor(
        options: {
            system: System,
            negative?: string | NegativeSymbol,
            range?: Partial<Range>,
            pad?: Pad,
            fallback?: Style,
        },
    ) {
        const { system, negative, range, pad, fallback } = options

        this.system = system
        this.negative = negative == null
            ? { prefix: '-' }
            : typeof negative === 'string'
                ? { prefix: negative }
                : negative
        this.range = {
            min: range?.min || system.range.min,
            max: range?.max || system.range.max,
        }
        this.pad = pad
        this.fallback = fallback || FALLBACK
    }

    /** Format a single number */
    public format(value: number): string

    /** Format a full counter sequence using a separator */
    public format(value: number[], separator: string): string

    public format(value: number | number[], separator = '.'): string {
        return typeof value === 'number'
            ? this.formatNumber(value)
            : this.formatNumbers(value, separator)
    }

    /** Format a single number */
    private formatNumber(value: number): string {
        const number = value < 0 ? Math.abs(value) : value

        if (number < this.range.min || number > this.range.max) {
            return this.fallback.formatNumber(value)
        }

        let formatted = this.system.format(number)

        if (formatted == null) {
            return this.fallback.formatNumber(value)
        }

        if (this.pad != null) {
            let length = this.pad.length - formatted.length

            if (value < 0) {
                length -= this.negative.prefix.length
                    + (this.negative.suffix?.length || 0)
            }

            if (length > 0) {
                formatted = this.pad.symbol.repeat(length) + formatted
            }
        }

        if (value < 0) {
            formatted = this.negative.prefix + formatted

            if (this.negative.suffix != null) {
                formatted += this.negative.suffix
            }
        }

        return formatted
    }

    /** Format multiple numbers */
    private formatNumbers(value: number[], separator: string): string {
        return value.map(this.formatNumber.bind(this)).join(separator)
    }
}

/** Symbols to add to a formatted value when it is negative */
export interface NegativeSymbol {
    /** Symbol to prefix to the value */
    prefix: string
    /** Symbol to suffix to the value */
    suffix?: string
}

export interface Range {
    min: number
    max: number
}

export interface Pad {
    /** Minimal length */
    length: number
    /** Symbol used to pad a formatted value to the minimal length */
    symbol: string
}

/** A system describing how number should be represented in text */
export interface System {
    /**
     * Range of values supported by this system
     *
     * Values from outside this range must not be passed to
     {@link System#format}.
     */
    readonly range: Range

    /**
     * Format a number
     *
     * If the number cannot be formatted using this system {@code null} is
     * returned.
     */
    format(number: number): string | null
}

export type SystemOptions =
    CyclicArgs | FixedArgs | SymbolicArgs | AlphabeticArgs | NumericArgs | AdditiveArgs

/**
 * System which cycles repeatedly through its provided symbols, looping back to
 * the beginning when it reaches the end of the list
 */
export class Cyclic implements System {
    public readonly symbols: string[]

    public constructor(symbols: Iterable<string>) {
        this.symbols = Array.from(symbols)
    }

    public get range(): Range {
        return { min: -Infinity, max: Infinity }
    }

    public format(number: number): string {
        return this.symbols[Math.abs((number - 1) % this.symbols.length)]
    }
}

interface CyclicArgs {
    system: 'cyclic'
    symbols: Iterable<string>
}

/**
 * System which runs through its list of counter symbols once, then falls back
 */
export class Fixed implements System {
    public readonly symbols: string[]

    public constructor(
        symbols: Iterable<string>,
        public readonly firstValue: number = 1,
    ) {
        this.symbols = Array.from(symbols)
    }

    public get range(): Range {
        return { min: -Infinity, max: Infinity }
    }

    public format(number: number): string | null {
        const index = number - this.firstValue

        return index >= this.symbols.length
            ? null
            : this.symbols[number - this.firstValue]
    }
}

interface FixedArgs {
    system: 'fixed'
    symbols: Iterable<string>
    firstValue?: number
}

/**
 * System which cycles repeatedly through its provided symbols, doubling,
 * tripling, etc. the symbols on each successive pass through the list
 *
 * This implementation is limited to 60 repetitions, after which it will fall
 * back.
 */
export class Symbolic implements System {
    public readonly symbols: string[]

    public constructor(symbols: Iterable<string>) {
        this.symbols = Array.from(symbols)
    }

    public get range(): Range {
        return { min: 1, max: Infinity }
    }

    public format(number: number): string | null {
        const index = (number - 1) % this.symbols.length
        const count = Math.ceil(number / this.symbols.length)

        return count > 60
            ? null
            : this.symbols[index].repeat(count)
    }
}

interface SymbolicArgs {
    system: 'symbolic'
    symbols: Iterable<string>
}

/**
 * System which system interprets the list of counter symbols as digits to
 * an alphabetic numbering system
 */
export class Alphabetic implements System {
    public readonly symbols: string[]

    public constructor(symbols: Iterable<string>) {
        this.symbols = Array.from(symbols)
    }

    public get range(): Range {
        return { min: 1, max: Infinity }
    }

    public format(number: number): string {
        let result = ''

        while (number > 0) {
            number -= 1
            result = this.symbols[number % this.symbols.length] + result
            number = Math.floor(number / this.symbols.length)
        }

        return result
    }
}

interface AlphabeticArgs {
    system: 'alphabetic'
    symbols: Iterable<string>
}

/**
 * System which interprets the list of counter symbols as digits to a
 * "place-value" numbering system
 */
export class Numeric implements System {
    public readonly symbols: string[]

    public constructor(symbols: Iterable<string>) {
        this.symbols = Array.from(symbols)
    }

    public get range(): Range {
        return { min: -Infinity, max: Infinity }
    }

    public format(number: number): string {
        if (number === 0) {
            return this.symbols[0]
        }

        let result = ''

        while (number !== 0) {
            result = this.symbols[number % this.symbols.length] + result
            number = Math.floor(number / this.symbols.length)
        }

        return result
    }
}

interface NumericArgs {
    system: 'numeric'
    symbols: Iterable<string>
}

/** Sign-value numbering system */
export class Additive implements System {
    public readonly symbols: [number, string][]

    public constructor(symbols: Iterable<[number, string]>) {
        this.symbols = Array.from(symbols)
    }

    public get range(): Range {
        return { min: 0, max: Infinity }
    }

    public format(value: number): string | null {
        if (value === 0) {
            const [weight, symbol] = this.symbols[this.symbols.length - 1]

            if (weight === 0) {
                return symbol
            }
        }

        let result = ''

        for (let i = 0 ; i < this.symbols.length && value > 0 ; ++i) {
            const [weight, symbol] = this.symbols[i]
            const count = Math.floor(value / weight)
            result += symbol.repeat(count)
            value -= weight * count
        }

        if (value !== 0) {
            return null
        }

        return result
    }
}

interface AdditiveArgs {
    system: 'additive'
    symbols: Iterable<[number, string]>
}

export class Chinese implements System {
    public readonly digits: string[]

    public readonly counters: { [key: number]: string }

    public constructor(
        public readonly formal: boolean,
        digits: Iterable<string>,
        counters: string | string[],
    ) {
        this.digits = Array.from(digits)
        this.counters = { 10: counters[0], 100: counters[1], 1000: counters[2] }
    }

    public get range(): Range {
        return { min: -9999, max: 9999 }
    }

    public format(number: number): string {
        if (number === 0) {
            return this.digits[0]
        }

        if (!this.formal) {
            if (number === 10) {
                return this.counters[10]
            }

            if (number >= 10 && number < 20) {
                return this.counters[10] + this.digits[number - 10]
            }
        }

        let result = ''
        let mult = Math.pow(10, Math.floor(Math.log10(number)))
        let zero = false

        for (; number > 0 ; number = number % mult, mult = Math.floor(mult / 10)) {
            const digit = Math.floor(number / mult)

            if (digit === 0) {
                zero = true
                continue
            } else if (zero) {
                result += this.digits[0]
                zero = false
            }

            result += this.digits[digit]

            if (mult > 1) {
                result += this.counters[mult]
            }
        }

        return result
    }
}

export class Ethiopic implements System {
    /* eslint-disable-next-line max-len */
    public static DIGITS: string[] = Array.from(' \u1369\u136a\u136b\u136c\u136d\u136e\u136f\u1370\u1371\u1372 \u1373\u1374\u1375\u1376\u1377\u1378\u1379\u137a')

    public get range(): Range {
        return { min: 1, max: Infinity }
    }

    public format(number: number): string {
        if (number === 1) {
            return '\u1369'
        }

        let result = ''

        for (let inx = 0 ; number > 0 ; ++inx, number = Math.floor(number / 100)) {
            const group = number % 100
            const tens = Math.floor(group / 10)
            const ones = group % 10

            const skip = group === 0
                || (group === 1 && number < 100)
                || (group === 1 && inx % 2 === 1)

            let v = ''

            if (!skip) {
                if (tens > 0) {
                    v += Ethiopic.DIGITS[10 + tens]
                }
                if (ones > 0) {
                    v += Ethiopic.DIGITS[ones]
                }
            }

            if (group !== 0 && inx % 2 === 1) {
                v += '\u137b'
            }

            if (inx !== 0 && inx % 2 === 0) {
                v += '\u137c'
            }

            result = v + result
        }

        return result
    }
}

function *zip<A, B>(a: Iterable<A>, b: Iterable<B>): Iterable<[A, B]> {
    const ai = a[Symbol.iterator]()
    const bi = b[Symbol.iterator]()

    for (;;) {
        const av = ai.next()
        const bv = bi.next()

        if (av.done || bv.done) {
            break
        }

        yield [av.value, bv.value]
    }
}

/* eslint-disable array-element-newline, @typescript-eslint/naming-convention, max-len */

// --- simple counter styles ---------------------------------------------------
//
// These styles are defined in CSS Counter Styles Level 3 §6. Definitions are
// provided for all styles except disclosure-open and disclosure-closed.

// Numeric styles

FALLBACK = Style.create({
    system: 'numeric',
    symbols: '0123456789',
    fallback: null as unknown as Style,
})

const decimal_leading_zero = new Style({
    system: FALLBACK.system,
    pad: { length: 2, symbol: '0' },
})

const arabic_indic = Style.create({
    system: 'numeric',
    symbols: '\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669',
})

const ARMENIAN_WEIGHTS = [9000, 8000, 7000, 6000, 5000, 4000, 3000, 2000, 1000,
    900, 800, 700, 600, 500, 400, 300, 200, 100, 90, 80, 70, 60, 50, 40, 30, 20,
    10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

const armenian = Style.create({
    system: 'additive',
    symbols: zip(ARMENIAN_WEIGHTS, '\u0554\u0553\u0552\u0551\u0550\u054F\u054E\u054D\u054C\u054B\u054A\u0549\u0548\u0547\u0546\u0545\u0544\u0543\u0542\u0541\u0540\u053F\u053E\u053D\u053C\u053B\u053A\u0539\u0538\u0537\u0536\u0535\u0534\u0533\u0532\u0531'),
    range: { min: 1, max: 9999 },
})

const lower_armenian = Style.create({
    system: 'additive',
    symbols: zip(ARMENIAN_WEIGHTS, '\u0584\u0583\u0582\u0581\u0580\u057F\u057E\u057D\u057C\u057B\u057A\u0579\u0578\u0577\u0576\u0575\u0574\u0573\u0572\u0571\u0570\u056F\u056E\u056D\u056C\u056B\u056A\u0569\u0568\u0567\u0566\u0565\u0564\u0563\u0562\u0561'),
    range: { min: 1, max: 9999 },
})

const bengali = Style.create({
    system: 'numeric',
    symbols: '\u09E6\u09E7\u09E8\u09E9\u09EA\u09EB\u09EC\u09ED\u09EE\u09EF',
})

const cambodian = Style.create({
    system: 'numeric',
    symbols: '\u17E0\u17E1\u17E2\u17E3\u17E4\u17E5\u17E6\u17E7\u17E8\u17E9',
})

const cjk_decimal = Style.create({
    system: 'numeric',
    symbols: '\u3007\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D',
    range: { min: 0, max: Infinity },
})

const devanagari = Style.create({
    system: 'numeric',
    symbols: '\u0966\u0967\u0968\u0969\u096A\u096B\u096C\u096D\u096E\u096F',
})

const georgian = Style.create({
    system: 'additive',
    symbols: zip(
        [10000, 9000, 8000, 7000, 6000, 5000, 4000, 3000, 2000, 1000, 900, 800,
            700, 600, 500, 400, 300, 200, 100, 90, 80, 70, 60, 50, 40, 30, 20,
            10, 9, 8, 7, 6, 5, 4, 2, 1],
        '\u10F5\u10F0\u10EF\u10F4\u10EE\u10ED\u10EC\u10EB\u10EA\u10E9\u10E8\u10E7\u10E6\u10E5\u10E4\u10F3\u10E2\u10E1\u10E0\u10DF\u10DE\u10DD\u10F2\u10DC\u10DB\u10DA\u10D9\u10D8\u10D7\u10F1\u10D6\u10D5\u10D4\u10D3\u10D2\u10D1\u10D0',
    ),
    range: { min: 1, max: 19999 },
})

const gujarati = Style.create({
    system: 'numeric',
    symbols: '\u0AE6\u0AE7\u0AE8\u0AE9\u0AEA\u0AEB\u0AEC\u0AED\u0AEE\u0AEF',
})

const gurmukhi = Style.create({
    system: 'numeric',
    symbols: '\u0A66\u0A67\u0A68\u0A69\u0A6A\u0A6B\u0A6C\u0A6D\u0A6E\u0A6F',
})

const hebrew = Style.create({
    system: 'additive',
    symbols: zip(
        [10000, 9000, 8000, 7000, 6000, 5000, 4000, 3000, 2000, 1000, 400, 300,
            200, 100, 90, 80, 70, 60, 50, 40, 30, 20, 19, 18, 17, 16, 15, 10, 9,
            8, 7, 6, 5, 4, 3, 2, 1],
        ['\u05D9\u05F3', '\u05D8\u05F3', '\u05D7\u05F3', '\u05D6\u05F3',
            '\u05D5\u05F3', '\u05D4\u05F3', '\u05D3\u05F3', '\u05D2\u05F3',
            '\u05D1\u05F3', '\u05D0\u05F3', '\u05EA', '\u05E9', '\u05E8',
            '\u05E7', '\u05E6', '\u05E4', '\u05E2', '\u05E1', '\u05E0',
            '\u05DE', '\u05DC', '\u05DB', '\u05D9\u05D8', '\u05D9\u05D7',
            '\u05D9\u05D6', '\u05D8\u05D6', '\u05D8\u05D5', '\u05D9', '\u05D8',
            '\u05D7', '\u05D6', '\u05D5', '\u05D4', '\u05D3', '\u05D2',
            '\u05D1', '\u05D0'],
    ),
    range: { min: 1, max: 10999 },
})

const kannada = Style.create({
    system: 'numeric',
    symbols: '\u0CE6\u0CE7\u0CE8\u0CE9\u0CEA\u0CEB\u0CEC\u0CED\u0CEE\u0CEF',
})

const lao = Style.create({
    system: 'numeric',
    symbols: '\u0ED0\u0ED1\u0ED2\u0ED3\u0ED4\u0ED5\u0ED6\u0ED7\u0ED8\u0ED9',
})

const malayalam = Style.create({
    system: 'numeric',
    symbols: '\u0D66\u0D67\u0D68\u0D69\u0D6A\u0D6B\u0D6C\u0D6D\u0D6E\u0D6F',
})

const mongolian = Style.create({
    system: 'numeric',
    symbols: '\u1810\u1811\u1812\u1813\u1814\u1815\u1816\u1817\u1818\u1819',
})

const myanmar = Style.create({
    system: 'numeric',
    symbols: '\u1040\u1041\u1042\u1043\u1044\u1045\u1046\u1047\u1048\u1049',
})

const oriya = Style.create({
    system: 'numeric',
    symbols: '\u0B66\u0B67\u0B68\u0B69\u0B6A\u0B6B\u0B6C\u0B6D\u0B6E\u0B6F',
})

const persian = Style.create({
    system: 'numeric',
    symbols: '\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9',
})

const ROMAN_WEIGHTS = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]

const lower_roman = Style.create({
    system: 'additive',
    symbols: zip(ROMAN_WEIGHTS,
        ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i']),
    range: { min: 1, max: 3999 },
})

const upper_roman = Style.create({
    system: 'additive',
    symbols: zip(ROMAN_WEIGHTS,
        ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']),
    range: { min: 1, max: 3999 },
})

const tamil = Style.create({
    system: 'numeric',
    symbols: '\u0BE6\u0BE7\u0BE8\u0BE9\u0BEA\u0BEB\u0BEC\u0BED\u0BEE\u0BEF',
})

const telugu = Style.create({
    system: 'numeric',
    symbols: '\u0C66\u0C67\u0C68\u0C69\u0C6A\u0C6B\u0C6C\u0C6D\u0C6E\u0C6F',
})

const thai = Style.create({
    system: 'numeric',
    symbols: '\u0E50\u0E51\u0E52\u0E53\u0E54\u0E55\u0E56\u0E57\u0E58\u0E59',
})

const tibetan = Style.create({
    system: 'numeric',
    symbols: '\u0F20\u0F21\u0F22\u0F23\u0F24\u0F25\u0F26\u0F27\u0F28\u0F29',
})

// Alphabetic styles:

const lower_alpha = Style.create({
    system: 'alphabetic',
    symbols: 'abcdefghijklmnopqrstuvwxyz',
})

const upper_alpha = Style.create({
    system: 'alphabetic',
    symbols: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
})

const lower_greek = Style.create({
    system: 'alphabetic',
    symbols: '\u03B1\u03B2\u03B3\u03B4\u03B5\u03B6\u03B7\u03B8\u03B9\u03BA\u03BB\u03BC\u03BD\u03BE\u03BF\u03C0\u03C1\u03C3\u03C4\u03C5\u03C6\u03C7\u03C8\u03C9',
})

const hiragana = Style.create({
    system: 'alphabetic',
    symbols: '\u3042\u3044\u3046\u3048\u304A\u304B\u304D\u304F\u3051\u3053\u3055\u3057\u3059\u305B\u305D\u305F\u3061\u3064\u3066\u3068\u306A\u306B\u306C\u306D\u306E\u306F\u3072\u3075\u3078\u307B\u307E\u307F\u3080\u3081\u3082\u3084\u3086\u3088\u3089\u308A\u308B\u308C\u308D\u308F\u3090\u3091\u3092\u3093',
})

const hiragana_iroha = Style.create({
    system: 'alphabetic',
    symbols: '\u3044\u308D\u306F\u306B\u307B\u3078\u3068\u3061\u308A\u306C\u308B\u3092\u308F\u304B\u3088\u305F\u308C\u305D\u3064\u306D\u306A\u3089\u3080\u3046\u3090\u306E\u304A\u304F\u3084\u307E\u3051\u3075\u3053\u3048\u3066\u3042\u3055\u304D\u3086\u3081\u307F\u3057\u3091\u3072\u3082\u305B\u3059',
})

const katakana = Style.create({
    system: 'alphabetic',
    symbols: '\u30A2\u30A4\u30A6\u30A8\u30AA\u30AB\u30AD\u30AF\u30B1\u30B3\u30B5\u30B7\u30B9\u30BB\u30BD\u30BF\u30C1\u30C4\u30C6\u30C8\u30CA\u30CB\u30CC\u30CD\u30CE\u30CF\u30D2\u30D5\u30D8\u30DB\u30DE\u30DF\u30E0\u30E1\u30E2\u30E4\u30E6\u30E8\u30E9\u30EA\u30EB\u30EC\u30ED\u30EF\u30F0\u30F1\u30F2\u30F3',
})

const katakana_iroha = Style.create({
    system: 'alphabetic',
    symbols: '\u30A4\u30ED\u30CF\u30CB\u30DB\u30D8\u30C8\u30C1\u30EA\u30CC\u30EB\u30F2\u30EF\u30AB\u30E8\u30BF\u30EC\u30BD\u30C4\u30CD\u30CA\u30E9\u30E0\u30A6\u30F0\u30CE\u30AA\u30AF\u30E4\u30DE\u30B1\u30D5\u30B3\u30A8\u30C6\u30A2\u30B5\u30AD\u30E6\u30E1\u30DF\u30B7\u30F1\u30D2\u30E2\u30BB\u30B9',
})

// Symbolic styles:

const disc = Style.create({ system: 'cyclic', symbols: '\u2022' })
const circle = Style.create({ system: 'cyclic', symbols: '\u25e6' })
const square = Style.create({ system: 'cyclic', symbols: '\u25fe' })

// Fixed:

const cjk_earthly_branch = Style.create({
    system: 'fixed',
    symbols: '\u5B50\u4E11\u5BC5\u536F\u8FB0\u5DF3\u5348\u672A\u7533\u9149',
})

const cjk_heavenly_stem = Style.create({
    system: 'fixed',
    symbols: '\u7532\u4E59\u4E19\u4E01\u620A\u5DF1\u5E9A\u8F9B\u58EC\u7678',
})

// --- complex counter styles --------------------------------------------------
//
// These styles are defined in CSS Counter Styles Level 3 §7.

// Japanese:

const JAPANESE_WEIGHTS = [9000, 8000, 7000, 6000, 5000, 4000, 3000, 2000, 1000,
    900, 800, 700, 600, 500, 400, 300, 200, 100, 90, 80, 70, 60, 50, 40, 30, 20,
    10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

const japanese = {
    system: 'additive' as const,
    range: { min: -9999, max: 9999 },
    negative: '\u30DE\u30A4\u30CA\u30B9',
    fallback: cjk_decimal,
}

const japanese_informal = Style.create({
    ...japanese,
    symbols: zip(JAPANESE_WEIGHTS, ['\u4E5D\u5343', '\u516B\u5343',
        '\u4E03\u5343', '\u516D\u5343', '\u4E94\u5343', '\u56DB\u5343',
        '\u4E09\u5343', '\u4E8C\u5343', '\u5343', '\u4E5D\u767E',
        '\u516B\u767E', '\u4E03\u767E', '\u516D\u767E', '\u4E94\u767E',
        '\u56DB\u767E', '\u4E09\u767E', '\u4E8C\u767E', '\u767E',
        '\u4E5D\u5341', '\u516B\u5341', '\u4E03\u5341', '\u516D\u5341',
        '\u4E94\u5341', '\u56DB\u5341', '\u4E09\u5341', '\u4E8C\u5341',
        '\u5341', '\u4E5D', '\u516B', '\u4E03', '\u516D', '\u4E94', '\u56DB',
        '\u4E09', '\u4E8C', '\u4E00', '\u3007']),
})

const japanese_formal = Style.create({
    ...japanese,
    symbols: zip(JAPANESE_WEIGHTS, ['\u4E5D\u9621', '\u516B\u9621',
        '\u4E03\u9621', '\u516D\u9621', '\u4F0D\u9621', '\u56DB\u9621',
        '\u53C2\u9621', '\u5F10\u9621', '\u58F1\u9621', '\u4E5D\u767E',
        '\u516B\u767E', '\u4E03\u767E', '\u516D\u767E', '\u4F0D\u767E',
        '\u56DB\u767E', '\u53C2\u767E', '\u5F10\u767E', '\u58F1\u767E',
        '\u4E5D\u62FE', '\u516B\u62FE', '\u4E03\u62FE', '\u516D\u62FE',
        '\u4F0D\u62FE', '\u56DB\u62FE', '\u53C2\u62FE', '\u5F10\u62FE',
        '\u58F1\u62FE', '\u4E5D', '\u516B', '\u4E03', '\u516D', '\u4F0D',
        '\u56DB', '\u53C2', '\u5F10', '\u58F1', '\u96F6']),
})

// Korean:

const KOREAN_WEIGHTS = [9000, 8000, 7000, 6000, 5000, 4000, 3000, 2000, 1000,
    900, 800, 700, 600, 500, 400, 300, 200, 100, 90, 80, 70, 60, 50, 40, 30, 20,
    10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]

const korean = {
    system: 'additive' as const,
    range: { min: -9999, max: 9999 },
    negative: '\uB9C8\uC774\uB108\uC2A4 ',
}

const korean_hangul_formal = Style.create({
    ...korean,
    symbols: zip(KOREAN_WEIGHTS, ['\uAD6C\uCC9C', '\uD314\uCC9C', '\uCE60\uCC9C',
        '\uC721\uCC9C', '\uC624\uCC9C', '\uC0AC\uCC9C', '\uC0BC\uCC9C',
        '\uC774\uCC9C', '\uC77C\uCC9C', '\uAD6C\uBC31', '\uD314\uBC31',
        '\uCE60\uBC31', '\uC721\uBC31', '\uC624\uBC31', '\uC0AC\uBC31',
        '\uC0BC\uBC31', '\uC774\uBC31', '\uC77C\uBC31', '\uAD6C\uC2ED',
        '\uD314\uC2ED', '\uCE60\uC2ED', '\uC721\uC2ED', '\uC624\uC2ED',
        '\uC0AC\uC2ED', '\uC0BC\uC2ED', '\uC774\uC2ED', '\uC77C\uC2ED',
        '\uAD6C', '\uD314', '\uCE60', '\uC721', '\uC624', '\uC0AC', '\uC0BC',
        '\uC774', '\uC77C', '\uC601']),
})

const korean_hanja_informal = Style.create({
    ...korean,
    symbols: zip(KOREAN_WEIGHTS, ['\u4E5D\u5343', '\u516B\u5343', '\u4E03\u5343',
        '\u516D\u5343', '\u4E94\u5343', '\u56DB\u5343', '\u4E09\u5343',
        '\u4E8C\u5343', '\u5343', '\u4E5D\u767E', '\u516B\u767E', '\u4E03\u767E',
        '\u516D\u767E', '\u4E94\u767E', '\u56DB\u767E', '\u4E09\u767E',
        '\u4E8C\u767E', '\u767E', '\u4E5D\u5341', '\u516B\u5341', '\u4E03\u5341',
        '\u516D\u5341', '\u4E94\u5341', '\u56DB\u5341', '\u4E09\u5341',
        '\u4E8C\u5341', '\u5341', '\u4E5D', '\u516B', '\u4E03', '\u516D',
        '\u4E94', '\u56DB', '\u4E09', '\u4E8C', '\u4E00', '\u96F6']),
})

const korean_hanja_formal = Style.create({
    ...korean,
    symbols: zip(KOREAN_WEIGHTS, ['\u4E5D\u4EDF', '\u516B\u4EDF', '\u4E03\u4EDF',
        '\u516D\u4EDF', '\u4E94\u4EDF', '\u56DB\u4EDF', '\u53C3\u4EDF',
        '\u8CB3\u4EDF', '\u58F9\u4EDF', '\u4E5D\u767E', '\u516B\u767E',
        '\u4E03\u767E', '\u516D\u767E', '\u4E94\u767E', '\u56DB\u767E',
        '\u53C3\u767E', '\u8CB3\u767E', '\u58F9\u767E', '\u4E5D\u62FE',
        '\u516B\u62FE', '\u4E03\u62FE', '\u516D\u62FE', '\u4E94\u62FE',
        '\u56DB\u62FE', '\u53C3\u62FE', '\u8CB3\u62FE', '\u58F9\u62FE',
        '\u4E5D', '\u516B', '\u4E03', '\u516D', '\u4E94', '\u56DB', '\u53C3',
        '\u8CB3', '\u58F9', '\u96F6']),
})

// Chinese:

const simp_chinese_informal = new Style({
    system: new Chinese(false,
        '\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d',
        '\u5341\u767e\u5343'),
    negative: '\u8d1f',
    fallback: cjk_decimal,
})

const simp_chinese_formal = new Style({
    system: new Chinese(true,
        '\u96f6\u58f9\u8d30\u51c1\u8086\u4f0d\u9646\u67d2\u634c\u7396',
        '\u62fe\u4f70\u4edf'),
    negative: '\u8d1f',
    fallback: cjk_decimal,
})

const trad_chinese_informal = new Style({
    system: new Chinese(false,
        '\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d',
        '\u5341\u767e\u5343'),
    negative: '\u8ca0',
    fallback: cjk_decimal,
})

const trad_chinese_formal = new Style({
    system: new Chinese(true,
        '\u96f6\u58f9\u8cb3\u53c3\u8086\u4f0d\u9678\u67d2\u634c\u7396',
        '\u62fe\u4f70\u4edf'),
    negative: '\u8ca0',
    fallback: cjk_decimal,
})

// Ethiopic:

const ethiopic_numeric = new Style({ system: new Ethiopic() })

// -----------------------------------------------------------------------------

export const Styles = {
    armenian, bengali, cambodian, devanagari, georgian, gujarati, gurmukhi,
    hebrew, kannada, lao, malayalam, mongolian, myanmar, oriya, persian, tamil,
    telugu, thai, tibetan, hiragana, katakana, disc, circle, square,
    decimal: FALLBACK,
    'decimal-leading-zero': decimal_leading_zero,
    'arabic-indic': arabic_indic,
    'upper-armenian': armenian,
    'lower-armenian': lower_armenian,
    khmer: cambodian,
    'cjk-decimal': cjk_decimal,
    'lower-roman': lower_roman,
    'upper-roman': upper_roman,
    'lower-alpha': lower_alpha,
    'upper-alpha': upper_alpha,
    'lower-latin': lower_alpha,
    'upper-latin': upper_alpha,
    'hiragana-iroha': hiragana_iroha,
    'katakana-iroha': katakana_iroha,
    'cjk-earthly-branch': cjk_earthly_branch,
    'cjk-heavenly-stem': cjk_heavenly_stem,
    'lower-greek': lower_greek,
    'japanese-formal': japanese_formal,
    'japanese-informal': japanese_informal,
    'korean-hangul-formal': korean_hangul_formal,
    'korean-hanja-informal': korean_hanja_informal,
    'korean-hanja-formal': korean_hanja_formal,
    'simp-chinese-informal': simp_chinese_informal,
    'simp-chinese-formal': simp_chinese_formal,
    'trad-chinese-informal': trad_chinese_informal,
    'trad-chinese-formal': trad_chinese_formal,
    'ethiopic-numeric': ethiopic_numeric,
}

export type StyleName = keyof typeof Styles
