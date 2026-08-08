import z from 'zod'

/**
 * Creates a Zod schema that parses a comma-separated string into a
 * deduplicated array of validated values.
 *
 * @param schema - Zod schema used to validate each individual value.
 * @param list - Allowed values, used for the error message and OpenAPI example.
 *
 * @example
 * const StatusSchema = ListSchema(z.enum(['active', 'inactive']), ['active', 'inactive'])
 * StatusSchema.parse('active,inactive') // ['active', 'inactive']
 */
export const ListSchema = <T extends string>(
	schema: z.ZodSchema<T>,
	list: readonly T[],
) =>
	z
		.string()
		.optional()
		.transform((value, ctx) => {
			if (!value) {
				return []
			}

			const values = value
				.split(',')
				.map((v) => v.trim())
				.filter((v) => v.length > 0)

			const parsedValues = values.map((value) => schema.safeParse(value))

			if (parsedValues.some((result) => !result.success)) {
				ctx.issues.push({
					code: 'custom',
					input: values,
					message: '',
					params: {
						allowed: list,
						code: 'listInvalidValue',
					},
				})
				return z.NEVER
			}

			return [
				...new Set(
					parsedValues.filter((v) => v.success).map((v) => v.data),
				).values(),
			] as List<T>
		})
		.meta({
			description: 'Parses a comma-separated string.',
			example: list.join(','),
		})

export type List<T extends string> = T[]

/**
 * Parses a comma-separated query string into a typed array without Zod validation.
 * Returns an empty array for nullish values.
 *
 * @example
 * queryToList('active,inactive') // ['active', 'inactive']
 * queryToList(null)              // []
 */
export const queryToList = <T extends string>(
	query?: string | null,
): List<T> => {
	if (!query) {
		return []
	}

	return [
		...new Set(
			query
				.split(',')
				.map((value) => value.trim())
				.filter(Boolean),
		),
	] as List<T>
}

/**
 * Joins an array of values into a comma-separated query string.
 *
 * @example
 * listToQuery(['active', 'inactive']) // 'active,inactive'
 */
export const listToQuery = <T extends string>(list: List<T>): string => {
	return list.join(',')
}
