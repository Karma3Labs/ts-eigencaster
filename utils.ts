export const getDB = () => {
	const config = require('./knexfile.js')['development'];
	const knex = require('knex')(config)
	return knex
}

