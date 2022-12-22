import Recommender from './base'
import { EthAddress, Follow, LocalTrust, Pretrust } from '../types'
import { getFollowersOfAddress } from './utils'

export default class FollowsRecommender extends Recommender {
	/**
	 * Pretrust is calculated by giving the same amount of trust to every user that the root user follows.
	*/
	async calculatePretrust(address: string, users: EthAddress[], follows: Follow[]): Promise<Pretrust<EthAddress>> {
		const pretrust: Pretrust<EthAddress> = []
		const followers = await getFollowersOfAddress(address)
		followers.forEach((follower) => {
			pretrust.push({
				i: follower,
				v: 1 / followers.size
			})
		})

		return pretrust
	}

	/**
	 * Feel free to tweak localtrust as well
	 */	
	calculateLocalTrust(users: string[], follows: Follow[]): Promise<LocalTrust<EthAddress>> {
		return super.calculateLocalTrust(users, follows);
	}
}