import { Knex } from 'knex';
import { Cast, Follow, User } from '../types'

export const saveFollows = async (db: Knex, follows: Follow[]) => {
	if (follows.length == 0)  {
		return
	}

	await db("follows")
		.insert(follows)
		.onConflict()
		.ignore()
}

export const saveUsers = async (db: Knex, users: User[]) => {
	if (users.length == 0)  {
		return
	}

	await db("users")
		.insert(users)
		.onConflict()
		.ignore();
}

export const saveCasts = async (db: Knex, casts: Cast[]) => {
	if (casts.length == 0)  {
		return
	}

	await db("casts")
		.insert(casts)
		.onConflict()
		.ignore();
}