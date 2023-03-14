/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	knex.schema.alterTable('likes', function (table) {
		table.unique(['fid', 'type', 'cast_hash'])
	});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	knex.schema.alterTable('likes', function (table) {
		table.dropIndex(['fid', 'type', 'cast_hash'])
	});
};
