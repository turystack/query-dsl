import { describe, expect, it } from 'vitest'
import z from 'zod'

import {
	CursorPaginatedResponseSchema,
	CursorPaginationMetaSchema,
	CursorPaginationSchema,
	PagePaginatedResponseSchema,
	PagePaginationSchema,
	PaginatedResponseSchema,
	PaginationSchema,
} from './pagination.js'

describe('PagePaginationSchema', () => {
	it('applies defaults', () => {
		expect(PagePaginationSchema.parse({})).toEqual({
			limit: 10,
			page: 1,
		})
	})

	it('coerces query-string numbers', () => {
		expect(
			PagePaginationSchema.parse({
				limit: '25',
				page: '3',
			}),
		).toEqual({
			limit: 25,
			page: 3,
		})
	})

	it('caps limit at 100 and rejects page below 1', () => {
		expect(() =>
			PagePaginationSchema.parse({
				limit: '101',
			}),
		).toThrow()
		expect(() =>
			PagePaginationSchema.parse({
				page: '0',
			}),
		).toThrow()
	})
})

describe('CursorPaginationSchema', () => {
	it('accepts optional cursors and defaults limit', () => {
		expect(
			CursorPaginationSchema.parse({
				nextCursor: '123',
			}),
		).toEqual({
			limit: 10,
			nextCursor: '123',
		})
	})
})

describe('CursorPaginationMetaSchema', () => {
	it('defaults hasMore to false', () => {
		expect(
			CursorPaginationMetaSchema.parse({
				limit: 10,
			}),
		).toEqual({
			hasMore: false,
			limit: 10,
		})
	})
})

describe('PaginationSchema', () => {
	it('resolves to page mode with defaults when nothing is sent', () => {
		expect(PaginationSchema.parse({})).toEqual({
			limit: 10,
			mode: 'page',
			page: 1,
		})
	})

	it('resolves to page mode when page is sent', () => {
		expect(
			PaginationSchema.parse({
				limit: '25',
				page: '3',
			}),
		).toEqual({
			limit: 25,
			mode: 'page',
			page: 3,
		})
	})

	it('resolves to cursor mode when a cursor is sent', () => {
		expect(
			PaginationSchema.parse({
				nextCursor: 'abc',
			}),
		).toEqual({
			limit: 10,
			mode: 'cursor',
			nextCursor: 'abc',
			previousCursor: undefined,
		})
	})

	it('resolves to cursor mode with previousCursor', () => {
		expect(
			PaginationSchema.parse({
				previousCursor: 'xyz',
			}),
		).toMatchObject({
			mode: 'cursor',
			previousCursor: 'xyz',
		})
	})

	it('composes flat query params with .and()', () => {
		const QuerySchema = PaginationSchema.and(
			z.object({
				status: z.string().optional(),
			}),
		)

		expect(
			QuerySchema.parse({
				page: '2',
				status: 'active',
			}),
		).toEqual({
			limit: 10,
			mode: 'page',
			page: 2,
			status: 'active',
		})
	})

	it('rejects mixing page and cursor in the same request', () => {
		expect(() =>
			PaginationSchema.parse({
				nextCursor: 'abc',
				page: '2',
			}),
		).toThrow()
	})
})

describe('PaginatedResponseSchema', () => {
	const ItemSchema = z.object({
		id: z.string(),
	})

	it('accepts a page-mode meta', () => {
		const parsed = PaginatedResponseSchema(ItemSchema).parse({
			data: [],
			meta: {
				limit: 10,
				mode: 'page',
				page: 1,
				totalItems: 0,
				totalPages: 0,
			},
		})

		expect(parsed.meta.mode).toBe('page')
	})

	it('accepts a cursor-mode meta', () => {
		const parsed = PaginatedResponseSchema(ItemSchema).parse({
			data: [],
			meta: {
				hasMore: true,
				limit: 10,
				mode: 'cursor',
				nextCursor: 'abc',
			},
		})

		expect(parsed.meta.mode).toBe('cursor')
	})

	it('rejects a meta without mode discriminator', () => {
		expect(() =>
			PaginatedResponseSchema(ItemSchema).parse({
				data: [],
				meta: {
					limit: 10,
					page: 1,
					totalItems: 0,
					totalPages: 0,
				},
			}),
		).toThrow()
	})
})

describe('paginated response schemas', () => {
	const ItemSchema = z.object({
		id: z.string(),
	})

	it('validates the page envelope { data, meta }', () => {
		const parsed = PagePaginatedResponseSchema(ItemSchema).parse({
			data: [
				{
					id: 'a1',
				},
			],
			meta: {
				limit: 10,
				page: 1,
				totalItems: 1,
				totalPages: 1,
			},
		})

		expect(parsed.data).toHaveLength(1)
		expect(parsed.meta.totalPages).toBe(1)
	})

	it('validates the cursor envelope { data, meta }', () => {
		const parsed = CursorPaginatedResponseSchema(ItemSchema).parse({
			data: [],
			meta: {
				hasMore: true,
				limit: 10,
				nextCursor: 'b2',
			},
		})

		expect(parsed.data).toEqual([])
		expect(parsed.meta.hasMore).toBe(true)
	})

	it('rejects data items that fail the item schema', () => {
		expect(() =>
			PagePaginatedResponseSchema(ItemSchema).parse({
				data: [
					{
						id: 1,
					},
				],
				meta: {
					limit: 10,
					page: 1,
					totalItems: 1,
					totalPages: 1,
				},
			}),
		).toThrow()
	})
})
