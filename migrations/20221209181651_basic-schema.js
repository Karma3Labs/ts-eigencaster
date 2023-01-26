/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.createTableIfNotExists('casts', function (table) {
		table.string('hash');
		table.string('thread_hash').nullable();
		table.integer('author_fid');
		table.string('username');
		table.string('text', 5000).nullable();
		table.string('reply_parent_username').nullable();
		table.string('display_name');
		table.datetime('published_at');
		table.string('avatar_url');
		table.boolean('avatar_verified')
		table.json('reply_to_data').nullable()
		table.integer('reactions').nullable();
		table.integer('recasts').nullable();
		table.integer('watches').nullable();
		table.specificType('mentions', 'text ARRAY').nullable();
	})
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.dropTable('casts')//.schema.dropTable('casts').dropTable('follows').dropTable('profiles');
};
