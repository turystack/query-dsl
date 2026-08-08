import { describe, expect, it } from 'vitest'

import { queryToRange, RangeSchema, rangeToQuery } from './number-range.js'

describe('RangeSchema', () => {
	it.each([
		[
			'>=10;<=50',
			{
				gte: 10,
				lte: 50,
			},
		],
		[
			'>-10.5;<0',
			{
				gt: -10.5,
				lt: 0,
			},
		],
		[
			'=42',
			{
				eq: 42,
			},
		],
	] as const)('should parse %s', (input, expected) => {
		expect(RangeSchema.parse(input)).toEqual(expected)
	})

	it.each([
		'',
		'10',
		'>=',
		'>=1e3',
		'>=NaN',
		'>= 10',
	])('should reject invalid format %j', (input) => {
		expect(RangeSchema.safeParse(input).success).toBe(false)
	})

	it('should reject duplicated operators with a stable error code', () => {
		const result = RangeSchema.safeParse('>=10;>=20')

		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0]).toMatchObject({
				params: {
					code: 'rangeDuplicatedOperator',
				},
			})
		}
	})

	it('should round-trip serialized ranges', () => {
		const range = {
			gt: -10.5,
			lte: 50,
		}
		const query = rangeToQuery(range)

		expect(query).toBe('>-10.5;<=50')
		expect(RangeSchema.parse(query)).toEqual(range)
		expect(queryToRange(query)).toEqual(range)
	})

	it('should ignore malformed values in the lightweight parser', () => {
		expect(queryToRange('invalid;>= ;<NaN;<=20')).toEqual({
			lte: 20,
		})
		expect(queryToRange('  ')).toEqual({})
	})

	it('should omit non-finite range values when serializing', () => {
		expect(
			rangeToQuery({
				gt: Number.NaN,
				lte: 10,
			}),
		).toBe('<=10')
	})
})
