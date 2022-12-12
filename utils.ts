import humps from 'humps'

export const getDB = () => {
	const config = require('./knexfile.js')['development'];
	let options: Record<string, any> = {
		...config,
		wrapIdentifier: (value: any, origImpl: Function, _: any) =>
			origImpl(humps.decamelize(value)),
		postProcessResponse: (result: any, _: any) => {
			return humps.camelizeKeys(result)
		},
	}
	const knex = require('knex')(options)
	return knex
}