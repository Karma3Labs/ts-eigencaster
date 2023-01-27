/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.createTableIfNotExists('profiles', function (table) {
		table.integer('fid').unique();
		table.string('address').unique();
		table.string('username');
		table.string('display_name').nullable();
		table.string('avatar_url', 1000).nullable();
		table.boolean('avatar_verified');
		table.string('followers');
		table.string('following');
		table.string('bio', 1000).nullable();
		table.string('telegram').nullable();
		table.string('referrer').nullable();
		table.string('connected_address');
		table.dateTime('registered_at');
		table.datetime('updated_at');
		table.json('custom_metrics');
	}).createTableIfNotExists('follows', function (table) {
		table.integer('follower_fid');
		table.integer('following_fid');
		table.dateTime('created_at');
		table.unique(['follower_fid', 'following_fid'])
	}).createTableIfNotExists('casts', function (table) {
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
	return knex.schema.dropTable('casts').dropTable('follows').dropTable('profiles');
};
