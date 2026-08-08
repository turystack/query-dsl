import { describe, expect, it } from 'vitest'
import z from 'zod'

import { ListSchema, listToQuery, queryToList } from './list.js'

const StatusSchema = ListSchema(
	z.enum([
		'active',
		'inactive',
	]),
	[
		'active',
		'inactive',
	] as const,
)

describe('ListSchema', () => {
	it('should trim, remove empty items, and deduplicate values', () => {
		expect(StatusSchema.parse(' active, inactive,active, ')).toEqual([
			'active',
			'inactive',
		])
	})

	it.each([
		undefined,
		'',
		',,,',
	])('should parse %j as an empty list', (input) => {
		expect(StatusSchema.parse(input)).toEqual([])
	})

	it('should reject values outside the supplied schema', () => {
		const result = StatusSchema.safeParse('active,archived')

		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0]).toMatchObject({
				params: {
					allowed: [
						'active',
						'inactive',
					],
					code: 'listInvalidValue',
				},
			})
		}
	})

	it('should keep lightweight helpers symmetric', () => {
		const list = queryToList<'active' | 'inactive'>(' active,,inactive,active ')

		expect(list).toEqual([
			'active',
			'inactive',
		])
		expect(listToQuery(list)).toBe('active,inactive')
		expect(queryToList(null)).toEqual([])
	})
})
