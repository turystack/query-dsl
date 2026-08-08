import z from 'zod'

const LimitSchema = z.coerce.number().min(1).max(100).default(10).meta({
	description: 'Items per page',
	example: 10,
})

/**
 * Query schema for page-based pagination (`?page=2&limit=10`).
 *
 * @example
 * PagePaginationSchema.parse({ page: '2' }) // { page: 2, limit: 10 }
 */
export const PagePaginationSchema = z.object({
	limit: LimitSchema,
	page: z.coerce.number().min(1).default(1).meta({
		description: 'Page number',
		example: 1,
	}),
})

export type PagePagination = z.infer<typeof PagePaginationSchema>

/** Response meta for page-based pagination. */
export const PagePaginationMetaSchema = z.object({
	limit: z.number().meta({
		description: 'Items per page',
		example: 10,
	}),
	page: z.number().meta({
		description: 'Current page',
		example: 1,
	}),
	totalItems: z.number().meta({
		description: 'Total items',
		example: 100,
	}),
	totalPages: z.number().meta({
		description: 'Total pages',
		example: 10,
	}),
})

export type PagePaginationMeta = z.infer<typeof PagePaginationMetaSchema>

/**
 * Query schema for cursor-based pagination (`?limit=10&nextCursor=123`).
 *
 * @example
 * CursorPaginationSchema.parse({ nextCursor: '123' }) // { limit: 10, nextCursor: '123' }
 */
export const CursorPaginationSchema = z.object({
	limit: LimitSchema,
	nextCursor: z.string().optional().meta({
		description: 'Cursor to end before',
		example: '123',
	}),
	previousCursor: z.string().optional().meta({
		description: 'Cursor to start after',
		example: '123',
	}),
})

export type CursorPagination = z.infer<typeof CursorPaginationSchema>

/** Response meta for cursor-based pagination. */
export const CursorPaginationMetaSchema = z.object({
	hasMore: z.boolean().default(false).meta({
		description: 'Has more items',
		example: true,
	}),
	limit: z.number().meta({
		description: 'Items per page',
		example: 10,
	}),
	nextCursor: z.string().optional().meta({
		description: 'Cursor for the next page',
		example: '123',
	}),
})

export type CursorPaginationMeta = z.infer<typeof CursorPaginationMetaSchema>

/**
 * Query schema accepting page OR cursor pagination — never both. The output
 * is a discriminated union on `mode`; nothing sent resolves to page 1.
 *
 * @example
 * PaginationSchema.parse({ page: '2' })          // { mode: 'page', page: 2, limit: 10 }
 * PaginationSchema.parse({ nextCursor: 'abc' })  // { mode: 'cursor', limit: 10, nextCursor: 'abc' }
 * PaginationSchema.parse({ page: '2', nextCursor: 'abc' }) // throws paginationMixedModes
 */
export const PaginationSchema = z
	.object({
		limit: LimitSchema,
		nextCursor: z.string().optional().meta({
			description: 'Cursor to end before (cursor mode)',
			example: '123',
		}),
		page: z.coerce.number().min(1).optional().meta({
			description: 'Page number (page mode)',
			example: 1,
		}),
		previousCursor: z.string().optional().meta({
			description: 'Cursor to start after (cursor mode)',
			example: '123',
		}),
	})
	.superRefine((value, ctx) => {
		const hasPage = value.page !== undefined
		const hasCursor =
			value.nextCursor !== undefined || value.previousCursor !== undefined

		if (hasPage && hasCursor) {
			ctx.addIssue({
				code: 'custom',
				input: value,
				message: '',
				params: {
					code: 'paginationMixedModes',
				},
			})
		}
	})
	.transform((value) => {
		if (value.nextCursor !== undefined || value.previousCursor !== undefined) {
			return {
				limit: value.limit,
				mode: 'cursor' as const,
				nextCursor: value.nextCursor,
				previousCursor: value.previousCursor,
			}
		}

		return {
			limit: value.limit,
			mode: 'page' as const,
			page: value.page ?? 1,
		}
	})

export type Pagination = z.output<typeof PaginationSchema>

/** Response meta discriminated on `mode` — matches whichever mode was requested. */
export const PaginationMetaSchema = z.discriminatedUnion('mode', [
	PagePaginationMetaSchema.extend({
		mode: z.literal('page'),
	}),
	CursorPaginationMetaSchema.extend({
		mode: z.literal('cursor'),
	}),
])

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>

const EnvelopeSchema = <T extends z.ZodTypeAny, M extends z.ZodTypeAny>(
	dataSchema: T,
	metaSchema: M,
) =>
	z
		.object({
			data: z.array(dataSchema),
		})
		.extend({
			meta: metaSchema,
		})

/**
 * Response envelope for mode-dynamic pagination: `{ data: T[], meta }` with
 * the meta discriminated on `mode` — the canonical shape for list endpoints
 * that accept page or cursor.
 *
 * @example
 * PaginatedResponseSchema(OrderSchema)
 */
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
	dataSchema: T,
) => EnvelopeSchema(dataSchema, PaginationMetaSchema)

export type PaginatedResponse<T> =
	| {
			data: T[]
			meta: {
				mode: 'page'
			} & PagePaginationMeta
	  }
	| {
			data: T[]
			meta: {
				mode: 'cursor'
			} & CursorPaginationMeta
	  }

/**
 * Response envelope for page-based pagination: `{ data: T[], meta }`.
 *
 * @example
 * PagePaginatedResponseSchema(OrderSchema)
 */
export const PagePaginatedResponseSchema = <T extends z.ZodTypeAny>(
	dataSchema: T,
) => EnvelopeSchema(dataSchema, PagePaginationMetaSchema)

export type PagePaginatedResponse<T> = {
	data: T[]
	meta: PagePaginationMeta
}

/**
 * Response envelope for cursor-based pagination: `{ data: T[], meta }`.
 *
 * @example
 * CursorPaginatedResponseSchema(OrderSchema)
 */
export const CursorPaginatedResponseSchema = <T extends z.ZodTypeAny>(
	dataSchema: T,
) => EnvelopeSchema(dataSchema, CursorPaginationMetaSchema)

export type CursorPaginatedResponse<T> = {
	data: T[]
	meta: CursorPaginationMeta
}
