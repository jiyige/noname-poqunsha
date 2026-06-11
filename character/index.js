import { game } from "noname";
import characters from "./character.js";
import pinyins from "./pinyin.js";
import skills from "./skill.js";
import translates from "./translate.js";
import characterIntros from "./intro.js";
import characterFilters from "./characterFilter.js";
import perfectPairs from "./perfectPairs.js";
import voices from "./voices.js";
import { characterSort, characterSortTranslate } from "./sort.js";

game.import("character", function () {
	return {
		name: "poqun",
		connect: true,
		connectBanned: [],
		character: { ...characters },
		characterSort: {
			poqun: characterSort,
		},
		characterFilter: { ...characterFilters },
		characterIntro: { ...characterIntros },
		skill: { ...skills },
		perfectPair: { ...perfectPairs },
		translate: { ...translates, ...voices, ...characterSortTranslate },
		pinyins: { ...pinyins },
	};
});
