export const config = {
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
			localtrust: 'l1rep6rec3m12enhancedConnections',
			alpha: 0.5
		}], 
		['activity', {
      strategy_id: 5,
			pretrust: 'pretrustAllEqually',
			localtrust: 'l1rep1rec1m1enhancedConnections',
			alpha: 0.5
		}],
		['OG circles', { 
			strategy_id: 7,
			pretrust: 'pretrustSpecificUsernames',
			localtrust: 'existingConnections',
			alpha: 0.5,
		}], 
		['OG engagement', {
      strategy_id: 9,
			pretrust: 'pretrustSpecificUsernames',
			localtrust: 'l1rep6rec3m12enhancedConnections',
			alpha: 0.5
		}], 
		['OG activity', {
      strategy_id: 11,
			pretrust: 'pretrustSpecificUsernames',
			localtrust: 'l1rep1rec1m1enhancedConnections',
			alpha: 0.5
		}],
	]),
}