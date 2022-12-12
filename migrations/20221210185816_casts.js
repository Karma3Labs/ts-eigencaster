/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.createTableIfNotExists('casts', function (table) {
		table.integer('sequence');
		table.string('type');
		table.string('publisher');
		table.string('text', 5000).nullable();
		table.integer('reactions').nullable();
		table.integer('recasts').nullable();
		table.integer('watches').nullable();
		table.specificType('mentions', 'text ARRAY').nullable();
		table.integer('reply_to').nullable();
		table.json('metrics');
		table.datetime('published_at');

		table.foreign('publisher').references('address').inTable('users');
	})
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.dropTable('casts')
};
