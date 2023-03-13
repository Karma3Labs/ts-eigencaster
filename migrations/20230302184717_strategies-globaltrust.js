/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.createTable('globaltrust', (table) => {
		table.integer('strategy_id')
		table.bigInteger('i')
		table.float('v')
		table.index('strategy_id', 'globaltrust_id_idx')
		table.unique(['strategy_id', 'i'], 'globaltrust_id_i_idx')
	})
		.createTable('strategies', (table) => {
			table.increments('id')
			table.text('pretrust')
			table.text('localtrust')
			table.float('alpha')
			table.unique(['pretrust', 'localtrust', 'alpha'], 'strategies_pt_lt_a_idx')
		});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.dropTable('globaltrust').dropTable('strategies');
};
