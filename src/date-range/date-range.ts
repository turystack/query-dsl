import z from 'zod'

/** Validates the `>=2024-01-01;<=2024-12-31` date range query format. */
export const dateRangeRegex =
	/^(>=|<=|>|<|=)\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?(?:;(?:>=|<=|>|<|=)\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?)*$/

const dateValueSchema = z.union([
	z.iso.date(),
	z.iso.datetime({
		offset: true,
	}),
])

/**
 * Zod schema that parses a semicolon-separated date range string
 * (e.g. `>=2024-01-01;<=2024-12-31`) into a `DateRange` object with Date values.
 *
 * Validates each date segment with `z.iso.date()` and throws on
 * duplicate operators or invalid dates.
 *
 * @example
 * DateRangeSchema.parse('>=2024-01-01;<=2024-12-31')
 * // { gte: Date, lte: Date }
 */
export const DateRangeSchema = z
	.string()
	.optional()
	.refine((value) => (value ? dateRangeRegex.test(value) : true), {
		params: {
			code: 'dateRangeInvalidFormat',
		},
	})
	.transform((value, ctx) => {
		if (!value) {
			return undefined
		}

		const parts = value.split(';')

		const result: DateRange = {}
		const usedOps = new Set<string>()

		for (const part of parts) {
			const [, op, rawDate] = part.match(/(>=|<=|>|<|=)(.*)/)!

			const parsed = dateValueSchema.safeParse(rawDate)
			if (!parsed.success) {
				ctx.issues.push({
					code: 'custom',
					input: rawDate,
					message: '',
					params: {
						code: 'dateInvalid',
					},
				})
				return z.NEVER
			}

			if (usedOps.has(op)) {
				ctx.issues.push({
					code: 'custom',
					input: op,
					message: '',
					params: {
						code: 'dateRangeDuplicatedOperator',
					},
				})
				return z.NEVER
			}

			usedOps.add(op)

			const d = new Date(rawDate)

			if (op === '>=') {
				result.gte = d
			}
			if (op === '<=') {
				result.lte = d
			}
			if (op === '>') {
				result.gt = d
			}
			if (op === '<') {
				result.lt = d
			}
			if (op === '=') {
				result.eq = d
			}
		}

		return result
	})
	.meta({
		description: 'Available operators: >, >=, <, <=, =.',
		example: '>=2024-01-01;<=2024-12-31',
	})

export type DateRange = {
	eq?: Date
	gt?: Date
	gte?: Date
	lt?: Date
	lte?: Date
}

export type DateRangeValue = {
	from?: Date
	to?: Date
}

/**
 * Serializes a `DateRange` object back into the query-string format
 * using ISO 8601 date strings.
 *
 * @example
 * dateRangeToQuery({ gte: new Date('2024-01-01') }) // '>=2024-01-01T00:00:00.000Z'
 */
export const dateRangeToQuery = (range: DateRange) => {
	const opMap: Record<keyof DateRange, string> = {
		eq: '=',
		gt: '>',
		gte: '>=',
		lt: '<',
		lte: '<=',
	}

	return Object.entries(range)
		.filter(([, value]) => value instanceof Date)
		.map(([key, date]) => {
			const op = opMap[key as keyof DateRange]
			return `${op}${(date as Date).toISOString()}`
		})
		.join(';')
}

/**
 * Parses a date range query string into a `DateRange` object without Zod validation.
 * Useful on the client side where the value is already trusted.
 *
 * @example
 * queryToDateRange('>=2024-01-01') // { gte: Date }
 */
export const queryToDateRange = (query: string): DateRange => {
	const opMap: Record<string, keyof DateRange> = {
		'<': 'lt',
		'<=': 'lte',
		'=': 'eq',
		'>': 'gt',
		'>=': 'gte',
	}

	const result: DateRange = {}

	if (!query.trim()) {
		return result
	}

	for (const part of query.split(';')) {
		const [, op, rawDate] = part.match(/(>=|<=|>|<|=)(.*)/) || []

		if (!op || !rawDate) {
			continue
		}

		const date = new Date(rawDate)

		if (!Number.isNaN(date.getTime())) {
			const key = opMap[op]
			result[key] = date
		}
	}

	return result
}
