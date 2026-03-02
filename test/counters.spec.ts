import { describe, expect, it } from 'vitest'

import { Additive, Alphabetic, Cyclic, Fixed, Numeric, Style, Styles, Symbolic } from '../src'

describe('counters', () => {
    describe('systems', () => {
        it('cyclic', () => {
            const system = new Cyclic('ab')

            expect(system.format(-1)).eq('a')
            expect(system.format(0)).eq('b')
            expect(system.format(1)).eq('a')
            expect(system.format(2)).eq('b')
            expect(system.format(3)).eq('a')
        })

        describe('fixed', () => {
            const system = new Fixed('abc', 2)

            it('in range', () => {
                expect(system.format(2)).eq('a')
                expect(system.format(3)).eq('b')
                expect(system.format(4)).eq('c')
            })

            it('out of range', () => {
                expect(system.format(1)).to.not.exist
                expect(system.format(5)).to.not.exist
            })
        })

        describe('symbolic', () => {
            const system = new Symbolic('abc')

            it('in range', () => {
                expect(system.format(1)).eq('a')
                expect(system.format(2)).eq('b')
                expect(system.format(3)).eq('c')
            })

            it('above range', () => {
                expect(system.format(4)).eq('aa')
                expect(system.format(5)).eq('bb')
                expect(system.format(6)).eq('cc')
            })
        })

        describe('alphabetic', () => {
            const system = new Alphabetic('abc')

            it('in range', () => {
                expect(system.format(1)).eq('a')
                expect(system.format(2)).eq('b')
                expect(system.format(3)).eq('c')
            })

            it('above range', () => {
                expect(system.format(4)).eq('aa')
                expect(system.format(5)).eq('ab')
                expect(system.format(6)).eq('ac')
                expect(system.format(7)).eq('ba')
                expect(system.format(8)).eq('bb')
                expect(system.format(9)).eq('bc')
            })
        })

        it('numeric', () => {
            const system = new Numeric('012')

            expect(system.format(0)).eq('0')
            expect(system.format(1)).eq('1')
            expect(system.format(2)).eq('2')
            expect(system.format(3)).eq('10')
            expect(system.format(4)).eq('11')
            expect(system.format(5)).eq('12')
            expect(system.format(6)).eq('20')
        })

        describe('additive', () => {
            const system = new Additive([[7, 'a'], [5, 'b'], [3, 'c'], [1, 'e'], [0, 'f']])

            it('in range', () => {
                expect(system.format(0)).eq('f')
                expect(system.format(1)).eq('e')
                expect(system.format(2)).eq('ee')
                expect(system.format(3)).eq('c')
                expect(system.format(4)).eq('ce')
                expect(system.format(5)).eq('b')
                expect(system.format(6)).eq('be')
                expect(system.format(7)).eq('a')
                expect(system.format(8)).eq('ae')
                expect(system.format(12)).eq('ab')
                expect(system.format(14)).eq('aa')
            })

            it('out of range', () => {
                expect(system.format(-1)).to.not.exist
            })
        })

        describe('Chinese', () => {
            const system = Styles['simp-chinese-informal'].system

            it('informal below 20', () => {
                expect(system.format(4)).eq('四')
                expect(system.format(12)).eq('十二')
            })

            it('large number', () => {
                expect(system.format(7382)).eq('七千三百八十二')
            })

            it('inner zero', () => {
                expect(system.format(105)).eq('一百零五')
            })
        })

        it('Ethiopic', () => {
            const system = Styles['ethiopic-numeric'].system
            expect(system.format(100)).eq('፻')
            expect(system.format(78010092)).eq('፸፰፻፩፼፺፪')
            expect(system.format(780100000092)).eq('፸፰፻፩፼፼፺፪')
        })
    })

    describe('style', () => {
        const style = Style.create({
            system: 'numeric',
            symbols: 'abc',
            range: { min: 0, max: 7 },
            negative: { prefix: '(', suffix: ')' },
            pad: { length: 4, symbol: ' ' },
        })

        it('positive in range', () => expect(style.format(5)).to.eq('  bc'))
        it('negative in range', () => expect(style.format(-1)).to.eq('( b)'))
        it('positive out of range', () => expect(style.format(8)).to.eq('8'))
        it('negative out of range', () => expect(style.format(-20)).to.eq('-20'))

        it('array in range', () => {
            expect(style.format([3, -5, 7], ':')).to.eq('  ba:(bc):  cb')
        })

        it('array mixed', () => {
            expect(style.format([8, -4, 6, -20], '.')).to.eq('8.(bb).  ca.-20')
        })

        it('longer than pad', () => {
            const style = Style.create({
                system: 'symbolic',
                symbols: 'a',
                pad: { length: 2, symbol: '-' },
            })

            expect(style.format(1)).to.eq('-a')
            expect(style.format(2)).to.eq('aa')
            expect(style.format(3)).to.eq('aaa')
        })
    })
})
