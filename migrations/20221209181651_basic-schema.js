/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.createTableIfNotExists('users', function (table) {
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
		table.string('follower');
		table.string('followee');
		table.unique(['follower', 'followee'])
	}).createTableIfNotExists('casts', function (table) {
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
		table.foreign('publisher');
	})
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.dropTable('casts').dropTable('follows').dropTable('users');
};
