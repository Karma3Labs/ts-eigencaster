/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.createTable('users', function (table) {
		table.string('address').unique();
		table.string('username');
		table.string('displayName');
		table.string('followerCount');
		table.string('followingCount');
		table.string('isViewerFollowing');
		table.string('isFollowingViewer');
		table.jsonb('profile');
		table.jsonb('avatar');
		table.string('referrerUsername');
		table.string('viewerCanSendDirectCasts');
		table.timestamps();
	}).createTable('follows', function (table) {
		table.string('follower');
		table.string('followee');
		table.index(['follower', 'followee'])
	})
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	knex.schema.dropTable('users')
	knex.schema.dropTable('follows')
};
