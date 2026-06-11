import { lib, game, ui, get, ai, _status } from "noname";
import { precontent } from "./main/precontent.js";
import { content } from "./main/content.js";

const extensionInfo = await lib.init.promises.json(`${lib.assetURL}extension/破群杀/info.json`);
let extensionPackage = {
	name: "破群杀",
	editable: false,
	connect: true,
	config: {},
	help: {},
	content,
	precontent,
	package: {},
	files: { character: [], card: [], skill: [], audio: [] },
};

Object.keys(extensionInfo)
	.filter((key) => key !== "name")
	.forEach((key) => {
		extensionPackage.package[key] = extensionInfo[key];
	});

export let type = "extension";
export default extensionPackage;
