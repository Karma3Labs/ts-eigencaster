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
		table.integer('sequence');
		table.string('address');
		table.string('username');
		table.string('display_name');
		table.string('avatar_url');
		table.boolean('avatar_verified')
		table.string('text', 5000).nullable();
		table.string('reply_parent_merkle_root').nullable();
		table.string('merkle_root');
		table.string('thread_merkle_root');
		table.string('reply_parent_username');
		table.integer('num_reply_children').nullable();
		table.integer('reactions').nullable();
		table.integer('recasts').nullable();
		table.integer('watches').nullable();
		table.specificType('mentions', 'text ARRAY').nullable();
		table.datetime('published_at');
		table.foreign('publisher');
		table.unique('merkle_root')
	})
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.dropTable('casts').dropTable('follows').dropTable('profiles');
};
