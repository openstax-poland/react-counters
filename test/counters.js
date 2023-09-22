/* eslint-disable import/no-commonjs */
const should = require('chai').should()
const { Additive, Alphabetic, Cyclic, Fixed, Numeric, Style, Styles, Symbolic } = require('../src')

describe('counters', () => {
    describe('systems', () => {
        it('cyclic', () => {
            const system = new Cyclic('ab')

            system.format(-1).should.eq('a')
            system.format(0).should.eq('b')
            system.format(1).should.eq('a')
            system.format(2).should.eq('b')
            system.format(3).should.eq('a')
        })

        describe('fixed', () => {
            const system = new Fixed('abc', 2)

            it('in range', () => {
                system.format(2).should.eq('a')
                system.format(3).should.eq('b')
                system.format(4).should.eq('c')
            })

            it('out of range', () => {
                should.not.exist(system.format(1))
                should.not.exist(system.format(5))
            })
        })

        describe('symbolic', () => {
            const system = new Symbolic('abc')

            it('in range', () => {
                system.format(1).should.eq('a')
                system.format(2).should.eq('b')
                system.format(3).should.eq('c')
            })

            it('above range', () => {
                system.format(4).should.eq('aa')
                system.format(5).should.eq('bb')
                system.format(6).should.eq('cc')
            })
        })

        describe('alphabetic', () => {
            const system = new Alphabetic('abc')

            it('in range', () => {
                system.format(1).should.eq('a')
                system.format(2).should.eq('b')
                system.format(3).should.eq('c')
            })

            it('above range', () => {
                system.format(4).should.eq('aa')
                system.format(5).should.eq('ab')
                system.format(6).should.eq('ac')
                system.format(7).should.eq('ba')
                system.format(8).should.eq('bb')
                system.format(9).should.eq('bc')
            })
        })

        it('numeric', () => {
            const system = new Numeric('012')

            system.format(0).should.eq('0')
            system.format(1).should.eq('1')
            system.format(2).should.eq('2')
            system.format(3).should.eq('10')
            system.format(4).should.eq('11')
            system.format(5).should.eq('12')
            system.format(6).should.eq('20')
        })

        describe('additive', () => {
            const system = new Additive([[7, 'a'], [5, 'b'], [3, 'c'], [1, 'e'], [0, 'f']])

            it('in range', () => {
                system.format(0).should.eq('f')
                system.format(1).should.eq('e')
                system.format(2).should.eq('ee')
                system.format(3).should.eq('c')
                system.format(4).should.eq('ce')
                system.format(5).should.eq('b')
                system.format(6).should.eq('be')
                system.format(7).should.eq('a')
                system.format(8).should.eq('ae')
                system.format(12).should.eq('ab')
                system.format(14).should.eq('aa')
            })

            it('out of range', () => {
                should.not.exist(system.format(-1))
            })
        })

        describe('Chinese', () => {
            const system = Styles['simp-chinese-informal'].system

            it('informal below 20', () => {
                system.format(4).should.eq('四')
                system.format(12).should.eq('十二')
            })

            it('large number', () => {
                system.format(7382).should.eq('七千三百八十二')
            })

            it('inner zero', () => {
                system.format(105).should.eq('一百零五')
            })
        })

        it('Ethiopic', () => {
            const system = Styles['ethiopic-numeric'].system
            system.format(100).should.eq('፻')
            system.format(78010092).should.eq('፸፰፻፩፼፺፪')
            system.format(780100000092).should.eq('፸፰፻፩፼፼፺፪')
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

        it('positive in range', () => style.format(5).should.eq('  bc'))
        it('negative in range', () => style.format(-1).should.eq('( b)'))
        it('positive out of range', () => style.format(8).should.eq('8'))
        it('negative out of range', () => style.format(-20).should.eq('-20'))

        it('array in range', () => {
            style.format([3, -5, 7], ':').should.eq('  ba:(bc):  cb')
        })

        it('array mixed', () => {
            style.format([8, -4, 6, -20], '.').should.eq('8.(bb).  ca.-20')
        })

        it('longer than pad', () => {
            const style = Style.create({
                system: 'symbolic',
                symbols: 'a',
                pad: { length: 2, symbol: '-' },
            })

            style.format(1).should.eq('-a')
            style.format(2).should.eq('aa')
            style.format(3).should.eq('aaa')
        })
    })
})
