import { Knex } from 'knex';
import { Follow, EthAddress } from '../types'

export const saveFollows = async (db: Knex, follows: Follow[]) => {
	if (follows.length == 0)  {
		return
	}

	await db("follows")
		.insert(follows)
		.onConflict()
		.ignore()
}

export const saveUsers = async (db: Knex, users: any[]) => {
	await db("users")
		.insert(users)
		.onConflict()
		.ignore();
}

export const saveCasts = async (db: Knex, casts: any[]) => {
	await db("casts")
		.insert(casts)
		.onConflict()
		.ignore();
}