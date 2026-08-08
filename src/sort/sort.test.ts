import { describe, expect, it } from 'vitest'

import { SortOrderSchema, SortSchema } from './sort.js'

describe('SortOrderSchema', () => {
	it('accepts asc and desc only', () => {
		expect(SortOrderSchema.parse('asc')).toBe('asc')
		expect(SortOrderSchema.parse('desc')).toBe('desc')
		expect(() => SortOrderSchema.parse('up')).toThrow()
	})
})

describe('SortSchema', () => {
	const OrderSortSchema = SortSchema(
		[
			'createdAt',
			'total',
		] as const,
		{
			defaultSortBy: 'createdAt',
			defaultSortOrder: 'desc',
		},
	)

	it('applies the declared defaults', () => {
		expect(OrderSortSchema.parse({})).toEqual({
			sortBy: 'createdAt',
			sortOrder: 'desc',
		})
	})

	it('accepts allowed fields and orders', () => {
		expect(
			OrderSortSchema.parse({
				sortBy: 'total',
				sortOrder: 'asc',
			}),
		).toEqual({
			sortBy: 'total',
			sortOrder: 'asc',
		})
	})

	it('rejects fields outside the allow-list', () => {
		expect(() =>
			OrderSortSchema.parse({
				sortBy: 'password',
			}),
		).toThrow()
	})
})
