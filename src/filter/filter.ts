import z from 'zod'

/**
 * Creates an optional string schema with OpenAPI metadata listing
 * the filterable fields. Useful for generic text search parameters.
 *
 * @param fields - Field names that the filter matches against.
 * @param options - Optional object with an `example` value for docs.
 *
 * @example
 * const schema = FilterSchema(['name', 'email'], { example: 'john' })
 */
export const FilterSchema = (
	fields: readonly string[],
	options?: {
		example: string
	},
) =>
	z
		.string()
		.optional()
		.meta({
			description: `Generic filter that matches against\n${fields
				.map((field) => `- ${field}`)
				.join('\n')}`,
			example: options?.example,
		})

export type Filter = {
	filter?: z.infer<ReturnType<typeof FilterSchema>>
}
