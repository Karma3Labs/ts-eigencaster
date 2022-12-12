// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: 'pg',
    connection: 'postgresql://localhost/farcaster' // process.env.PG_CONNECTION_STRING,
  }
};
