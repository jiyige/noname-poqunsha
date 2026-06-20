// 每个角色翻译隔开一下
const translates = {
	poqun_jiyi: "记忆",
	poqun_rixun: "日询",
	poqun_rixun_info:
		"出牌阶段限一次，你将一张手牌交给一名其他角色，若如此做，该角色回合开始时须选择一项:1·跳过摸牌阶段，此回合使用【杀】伤害+1；2.跳过出牌阶段，回复1点体力。",
	poqn_touxian: "偷闲",
	poqn_touxian_info: "一名角色回合结束后，若其回合内没有使用牌，你可以摸一张牌。",
	poqun_yishen: "抑沈",
	poqun_yishen_info:
		"当你受到伤害后，你可以记录伤害牌的花色。锁定技，本回合与此法记录的花色相同的牌对你造成伤害取消之。",

	poqun_xiaoche: "小澈",
	tuhao: "土豪",
	tuhao_info:
		"其他角色出牌阶段限一次，当其需要使用一张基本牌并指定目标后，可询问你是否帮其使用。若如此做，其当前回合手牌上限-1。你代其使用牌后，其出牌阶段结束时，若其于此阶段:回复过体力，你获得其装备区的防具并装备之；造成过伤害，你摸一张牌。",
	ziyi: "资医",
	ziyi_info: "当你受到伤害时，你可以弃置一张与伤害牌类型一致的牌，令此伤害-1。",
	guangming: "光明",
	guangming_info: "若你装备区没有防具牌，视为装备了白银狮子。",

	poqun_xiaoqi: "小奇",
	maihao: "买号",
	maihao_info:
		"每轮限一次，一名角色阵亡结算后，你可以保留【买号】将武将将面替换成该角色武将，然后弃置区域内的全部牌，并摸X张牌(X为你替换后的体力上限）",
	shenyin: "神隐",
	shenyin_info: "锁定技，你不能成为兵粮寸断的目标，其他角色计算与你的距离+1。",

	poqun_lingxin: "灵心",
	poqun_cangfeng: "藏锋",
	poqun_cangfeng_info: "锁定技，你的红色【杀】视为【闪】，你的黑色【杀】视为无懈可击。",
	poqun_huifeng: "回锋",
	poqun_huifeng_info:
		"当你受到伤害后，你可以选择一名其他角色展示其手牌，你对其造成X（X为其手牌里【杀】的数量）点伤害。",

	poqun_dadi: "大迪",
	poqun_bianlu: "辩戮",
	poqun_bianlu_info:
		"限定技，出牌阶段结束时，若你于此回合未造成伤害，且体力上限大于1，你减一点体力上限，视为使用一张【南蛮入侵】。",
	poqun_daifa: "代伐",
	poqun_daifa_info:
		"每轮限X次（X为你已损失的体力值），其他角色回合结束时，若其于此回合造成过伤害，你可以弃置一张手牌视为对其使用一张【决斗】。",

	poqun_shaoye: "少爷",
	poqun_yucheng: "予诚",
	poqun_yucheng_info:
		"回合结束时，你可以指定至多X(X为你当前已损失的体力值且至少为1）名其他角色，被指定的角色可以交给你一张手牌。",
	poqun_quanduan: "权断",
	poqun_quanduan_info:
		"摸牌阶段，你可以弃置任意张牌，然后多摸等量的牌。上回合因【予诚】给过手牌的角色你可以依次选择其是否获得1张你以此法弃置的牌。",
	poqun_quce: "驱策",
	poqun_quce_info:
		"主公技，每轮开始时，你可以指定一名角色。吴势力角色出牌阶段限一次，对你指定的角色使用【杀】可以摸一张牌。",

	poqun_peipei: "佩佩",
	poqun_yuefeng: "乐风",
	poqun_yuefeng_info: "主公技，锁定技，你的手牌上限+X（X为场上的群势力角色数）。",

	poqun_fengjie: "风姐",
	poqun_fugui: "复归",
	poqun_fugui_info:
		"当你受到伤害时，若你的武将牌正面向上，你可以翻面防止此伤害。若如此做，你不能成为延时类锦囊牌的目标直到你的武将牌翻回正面。",
	poqun_lingfeng: "飒风",
	poqun_lingfeng_info:
		"当你因翻面跳过回合后，你可以摸两张牌并额外进行一个出牌阶段，此阶段使用的【杀】无距离限制且不可被闪避。",

	poqun_maolaoshi: "毛老师",
	poqun_zhiwei: "知味",
	poqun_zhiwei_info:
		"出牌阶段限一次，你可以将一张♥手牌当作【桃】使用，或将一张♠手牌当作【酒】使用。",
	poqun_yunchou: "运筹",
	poqun_yunchou_info:
		"出牌阶段限一次，你可以将1张手牌展示后置于牌堆顶，然后展示牌堆底的1张牌获得之。若这两张牌的花色相同，你可以摸1张牌并重复此操作。",
	poqun_fengchun: "逢春",
	poqun_fengchun_info:
		"限定技，当你进入濒死状态时，你可以弃置所有手牌，并展示牌堆顶两张牌，然后回复至X（X为其中的红牌数量，且至少为1），并获得其他黑色牌。",
};

export default translates;
