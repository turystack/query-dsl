import { describe, expect, it } from 'vitest'

import {
	DateRangeSchema,
	dateRangeRegex,
	dateRangeToQuery,
	queryToDateRange,
} from './date-range.js'

describe('DateRangeSchema', () => {
	it('should parse date-only ranges', () => {
		expect(DateRangeSchema.parse('>=2026-01-01;<=2026-12-31')).toEqual({
			gte: new Date('2026-01-01'),
			lte: new Date('2026-12-31'),
		})
	})

	it('should parse ISO datetimes with timezone', () => {
		expect(
			DateRangeSchema.parse(
				'>=2026-07-18T10:00:00.000Z;<2026-07-18T12:00:00-03:00',
			),
		).toEqual({
			gte: new Date('2026-07-18T10:00:00.000Z'),
			lt: new Date('2026-07-18T12:00:00-03:00'),
		})
	})

	it('should parse equality and strict greater-than operators', () => {
		expect(DateRangeSchema.parse('>2026-01-01;=2026-07-18')).toEqual({
			eq: new Date('2026-07-18'),
			gt: new Date('2026-01-01'),
		})
	})

	it('should return undefined for an omitted value', () => {
		expect(DateRangeSchema.parse(undefined)).toBeUndefined()
		expect(DateRangeSchema.parse('')).toBeUndefined()
	})

	it.each([
		'2026-01-01',
		'>=2026-02-30',
		'>=2026-01-01T10:00:00',
		'>=invalid',
	])('should reject invalid format %s', (input) => {
		expect(DateRangeSchema.safeParse(input).success).toBe(false)
	})

	it('should reject duplicated operators with a stable error code', () => {
		const result = DateRangeSchema.safeParse('>=2026-01-01;>=2026-02-01')

		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0]).toMatchObject({
				params: {
					code: 'dateRangeDuplicatedOperator',
				},
			})
		}
	})

	it('should round-trip serialized ranges', () => {
		const range = {
			gte: new Date('2026-01-01T00:00:00.000Z'),
			lte: new Date('2026-12-31T23:59:59.999Z'),
		}

		const query = dateRangeToQuery(range)

		expect(DateRangeSchema.parse(query)).toEqual(range)
		expect(queryToDateRange(query)).toEqual(range)
	})

	it('should ignore malformed and invalid dates in the lightweight parser', () => {
		expect(queryToDateRange('invalid;>=invalid;<=2026-12-31')).toEqual({
			lte: new Date('2026-12-31'),
		})
		expect(queryToDateRange('  ')).toEqual({})
	})

	it('should expose a regex consistent with the schema format', () => {
		expect(dateRangeRegex.test('=2026-07-18')).toBe(true)
		expect(dateRangeRegex.test('=2026-07-18T12:00:00Z')).toBe(true)
		expect(dateRangeRegex.test('=2026-07-18T12:00:00')).toBe(false)
	})
})
