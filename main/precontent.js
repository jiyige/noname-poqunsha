import { lib, game, ui, get, ai, _status } from "noname";

export function precontent(config, pack) {
	// 适用于多模块并行场景，一个加载失败其余均不加载
	Promise.all([import("../character/index.js")])
		.then(() => {
			lib.translate.poqun_character_config = "破群杀";
		})
		.catch((err) => {
			console.error("Failed to import extension 『破群杀』: ", err);
			alert("Error:『破群杀』扩展导入失败");
		});
}
