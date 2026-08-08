import z from 'zod'

/** Validates the `>=10;<=50` numeric range query format. */
const rangeRegex =
	/^(>=|<=|>|<|=)(-?\d+(?:\.\d+)?)(;(>=|<=|>|<|=)(-?\d+(?:\.\d+)?))*$/

/**
 * Zod schema that parses a semicolon-separated range string (e.g. `>=10;<=50`)
 * into a `Range` object with numeric comparison operators.
 *
 * Throws on duplicate operators or invalid format.
 *
 * @example
 * RangeSchema.parse('>=10;<=50') // { gte: 10, lte: 50 }
 * RangeSchema.parse('=42')       // { eq: 42 }
 */
export const RangeSchema = z
	.string()
	.refine((value) => rangeRegex.test(value), {
		params: {
			code: 'rangeInvalidFormat',
		},
	})
	.transform((value, ctx) => {
		const parts = value.split(';')

		const result: Range = {}
		const usedOps = new Set<string>()

		for (const part of parts) {
			const [, op, num] = part.match(/(>=|<=|>|<|=)(.*)/)!

			if (usedOps.has(op)) {
				ctx.issues.push({
					code: 'custom',
					input: op,
					message: '',
					params: {
						code: 'rangeDuplicatedOperator',
					},
				})
				return z.NEVER
			}

			usedOps.add(op)

			const n = Number(num)

			if (op === '>=') {
				result.gte = n
			}
			if (op === '<=') {
				result.lte = n
			}
			if (op === '>') {
				result.gt = n
			}
			if (op === '<') {
				result.lt = n
			}
			if (op === '=') {
				result.eq = n
			}
		}

		return result
	})
	.meta({
		description: 'Available operators: >, >=, <, <=, =.',
		example: '>=10;<=50',
	})

export type Range = {
	eq?: number
	gt?: number
	gte?: number
	lt?: number
	lte?: number
}

export type RangeValue = {
	from?: number
	to?: number
}

/**
 * Serializes a `Range` object back into the query-string format.
 *
 * @example
 * rangeToQuery({ gte: 10, lte: 50 }) // '>=10;<=50'
 */
export const rangeToQuery = (range: Range) => {
	const opMap: Record<keyof Range, string> = {
		eq: '=',
		gt: '>',
		gte: '>=',
		lt: '<',
		lte: '<=',
	}

	return Object.entries(range)
		.filter(([, value]) => typeof value === 'number' && !Number.isNaN(value))
		.map(([key, value]) => {
			const op = opMap[key as keyof Range]
			return `${op}${value}`
		})
		.join(';')
}

/**
 * Parses a range query string into a `Range` object without Zod validation.
 * Useful on the client side where the value is already trusted.
 *
 * @example
 * queryToRange('>=10;<=50') // { gte: 10, lte: 50 }
 */
export const queryToRange = (query: string): Range => {
	const opMap: Record<string, keyof Range> = {
		'<': 'lt',
		'<=': 'lte',
		'=': 'eq',
		'>': 'gt',
		'>=': 'gte',
	}

	const result: Range = {}

	if (!query.trim()) {
		return result
	}

	for (const part of query.split(';')) {
		const [, op, raw] = part.match(/(>=|<=|>|<|=)(.*)/) || []

		if (!op || !raw) {
			continue
		}

		const value = raw.trim()

		if (!value) {
			continue
		}

		const key = opMap[op]
		const num = Number(value)

		if (!Number.isNaN(num)) {
			result[key] = num
		}
	}

	return result
}
