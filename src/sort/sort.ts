import z from 'zod'

/** Sort direction: `asc` or `desc`. */
export const SortOrderSchema = z
	.enum([
		'asc',
		'desc',
	])
	.meta({
		description: 'Sort order',
		example: 'asc',
	})

export type SortOrder = z.infer<typeof SortOrderSchema>

type SortSchemaOptions<T extends string> = {
	defaultSortBy: T
	defaultSortOrder: SortOrder
}

/**
 * Query schema for sorting (`?sortBy=createdAt&sortOrder=desc`), constrained
 * to an allow-list of fields with explicit defaults.
 *
 * @example
 * const OrderSortSchema = SortSchema(['createdAt', 'total'], {
 *   defaultSortBy: 'createdAt',
 *   defaultSortOrder: 'desc',
 * })
 * OrderSortSchema.parse({}) // { sortBy: 'createdAt', sortOrder: 'desc' }
 */
export const SortSchema = <T extends readonly string[]>(
	fields: T,
	options: SortSchemaOptions<T[number]>,
) =>
	z.object({
		sortBy: z
			.enum(
				fields as unknown as [
					T[number],
					...T[number][],
				],
			)
			.default(options.defaultSortBy)
			.meta({
				description: 'Field to sort by',
				example: options.defaultSortBy,
			}),
		sortOrder: SortOrderSchema.default(options.defaultSortOrder).meta({
			description: 'Sort order',
			example: options.defaultSortOrder,
		}),
	})

export type Sort<T extends readonly string[]> = {
	sortBy?: T[number]
	sortOrder?: SortOrder
}
