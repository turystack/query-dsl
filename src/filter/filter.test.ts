import { describe, expect, it } from 'vitest'

import { FilterSchema } from './filter.js'

describe('FilterSchema', () => {
	it('should parse strings and omitted values', () => {
		const schema = FilterSchema([
			'name',
			'email',
		])

		expect(schema.parse('john')).toBe('john')
		expect(schema.parse(undefined)).toBeUndefined()
		expect(schema.safeParse(10).success).toBe(false)
	})

	it('should expose field and example metadata', () => {
		const metadata = FilterSchema(
			[
				'name',
				'email',
			],
			{
				example: 'john',
			},
		).meta()

		expect(metadata).toMatchObject({
			description: expect.stringContaining('- name\n- email'),
			example: 'john',
		})
	})
})
