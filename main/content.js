// 武将评级和稀有度，图一乐
import { lib, game, ui, get, ai, _status } from "noname";

export function content(config, pack) {
	if (lib.rank) {
		const rank = {
			ap: [],
			a: [],
			am: [],
			bp: [],
			b: [],
			bm: [],
		};
		for (let i in rank) {
			lib.rank[i].addArray(rank[i]);
		}
		if (lib.rank.rarity) {
			const rarity = {
				rare: [],
			};
			for (let i in rarity) {
				lib.rank.rarity[i].addArray(rarity[i]);
			}
		}
	}
}
