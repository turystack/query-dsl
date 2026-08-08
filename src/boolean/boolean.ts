import z from 'zod'

/**
 * Zod schema that coerces `"true"` and `"false"` query-string values
 * into native booleans before validating with `z.boolean()`.
 *
 * @example
 * BooleanSchema.parse('true')  // true
 * BooleanSchema.parse('false') // false
 */
export const BooleanSchema = z.preprocess((value) => {
	if (value === 'false') {
		return false
	}
	if (value === 'true') {
		return true
	}

	return value
}, z.boolean())

export type Boolean = z.infer<typeof BooleanSchema>
