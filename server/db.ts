import { EthAddress } from "../types";
import { getDB } from "../utils";

export const db = getDB()

// TODO - FIX THIS - db has custody address which is different from eth address
export const getFidByAddress = async (address: EthAddress): Promise<number> => {
	const record = await db('fids')
		.where({ custody_address: address })
		.first('fid')

	return record?.fid 
}

export const profileExists = async (fid: number) => {
	const [{ count }] = await db('fids').where({ fid }).count()
	return +count >= 1
}

export const getFidByUsername = async (username: string): Promise<number> => {
	const record = await db('user_data')
		.where({ value: username, type: 6 })
		.first('fid')
	
	return record?.fid 
}
