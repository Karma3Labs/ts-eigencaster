import { isAddress } from "ethers/lib/utils"
import { getAddress, userExists } from "./db"

export const getAddressFromQueryParams = async (query: Record<string, any>): Promise<string> => {
	let address: string
	if (query.address) {
		address = query.address as string

		if (!isAddress(address)) {
			throw new Error('Invalid address') 
		}

		if (!(await userExists(address))) {
			throw new Error('User does not exist')
		}
	}
	else if (query.username) {
		const stripped = (query.username as string).trim() 
		address = await getAddress(stripped)

		if (!address) {
			throw new Error('Username does not exist')
		}
	}
	else {
		throw new Error('Either address or username should be provided')
	}

	return address
}