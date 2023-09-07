export const config = {
	localtrustStrategies: [
		'existingConnections',
		'l1rep3rec6m8enhancedConnections',
	],
	pretrustStrategies: [
		'pretrustAllEqually',
		'pretrustSpecificUsernames',
	],
	defaultRankingStrategy: 'follows',
	rankingStrategies: new Map<string,any>([
		['follows', { 
			strategy_id: 1,
			pretrust: 'pretrustAllEqually',
			localtrust: 'existingConnections',
			alpha: 0.5,
		}], 
		['engagement', {
		    strategy_id: 3,
			pretrust: 'pretrustAllEqually',
			localtrust: 'l1rep3rec6m8enhancedConnections',
			alpha: 0.5
		}], 
		['creator', {
      		strategy_id: 5,
			pretrust: 'pretrustSpecificUsernames',
			localtrust: 'existingConnections',
			alpha: 0.5
		}], 
		['active OGs', {
      		strategy_id: 7,
			pretrust: 'pretrustSpecificUsernames',
			localtrust: 'l1rep3rec6m8enhancedConnections',
			alpha: 0.5
		}],
		['passiveFollows', { 
			strategy_id: 11,
			pretrust: 'pretrustAllEqually',
			localtrust: 'l1rep6rec12m18enhancedConnections',
			alpha: 0.5,
		}], 
		['hyperEngaged', {
		    strategy_id: 13,
			pretrust: 'pretrustAllEqually',
			localtrust: 'l1rep6rec12m18enhancedConnections',
			alpha: 0.5
		}],
		['listener', {
			strategy_id: 15,
			pretrust: 'pretrustAllEqually',
			localtrust: 'l18rep12rec6m1enhancedConnections',
			alpha: 0.5
		}], 
		['hyperActive', {
			strategy_id: 17,
			pretrust: 'pretrustAllEqually',
			localtrust: 'l1rep6rec12m18enhancedConnections',
			alpha: 0.5
		}],
]),
}