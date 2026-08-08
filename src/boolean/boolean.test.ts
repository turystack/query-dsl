import { describe, expect, it } from 'vitest'

import { BooleanSchema } from './boolean.js'

describe('BooleanSchema', () => {
	it.each([
		[
			'true',
			true,
		],
		[
			'false',
			false,
		],
		[
			true,
			true,
		],
		[
			false,
			false,
		],
	] as const)('should parse %j as %j', (input, expected) => {
		expect(BooleanSchema.parse(input)).toBe(expected)
	})

	it.each([
		'TRUE',
		'1',
		1,
		null,
		undefined,
	])('should reject unsupported value %j', (input) => {
		expect(BooleanSchema.safeParse(input).success).toBe(false)
	})
})
