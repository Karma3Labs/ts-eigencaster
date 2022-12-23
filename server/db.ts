import { EthAddress } from "../types";
import { getDB } from "../utils";

export const db = getDB()

export const getUsers = (users: EthAddress[]) => {
	return db('users').select().whereIn('address', users)
}

export const getCasts = (sequences: number[]) => {
	return db('users').select().whereIn('sequence', sequences)
}