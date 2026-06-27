// 每个角色翻译隔开一下
const translates = {
	poqun_jiyi: "记忆",
	poqun_rixun: "日询",
	poqun_rixun_info:
		"出牌阶段限一次，你将一张手牌交给一名其他角色，若如此做，该角色回合开始时须选择一项: 1. 跳过判断和摸牌阶段，令你摸1张牌。2.跳过出牌和弃牌阶段，令你执行1个出牌阶段。",
	poqn_touxian: "偷闲",
	poqn_touxian_info: "一名角色回合结束后，若其回合内没有使用牌，你可以摸一张牌。",
	poqun_yishen: "抑沈",
	poqun_yishen_info:
		"当你受到伤害后，你可以记录伤害牌的花色。准备阶段，你重置记录的花色。锁定技，与此法记录的花色相同的牌对你造成伤害取消之。",

	poqun_xiaoche: "小澈",
	poqun_leshi: "乐施",
	poqun_leshi_tag: "乐施牌",
	poqun_leshi_info:
		"其他角色出牌阶段开始时，你可以令其观看你的手牌并选择一张，其可以于此阶段使用此牌。若其使用了此牌，其当前回合手牌上限-1，且其出牌阶段结束时，若其于此阶段回复过体力或造成过伤害，你可分别摸一张牌。",
	poqun_ziyu: "资愈",
	poqun_ziyu_info: "当你受到伤害时，你可以弃置一张与伤害牌类型一致的牌，令此伤害-1。",
	poqun_quuan: "驱暗",
	poqun_quuan_info: "若你装备区没有防具牌，视为装备了白银狮子。",

	poqun_xiaoqi: "小奇",
	poqun_zhuanjie: "转劫",
	poqun_zhuanjie_info:
		"每轮限一次，一名角色阵亡结算后，你可以保留【转劫】将武将将面替换成该角色武将，然后弃置区域内的全部牌，并摸X张牌(X为你替换后的体力上限）",
	poqun_qianzong: "潜踪",
	poqun_qianzong_info: "锁定技，你不能成为兵粮寸断的目标，其他角色计算与你的距离+1。",

	poqun_lingxin: "灵心",
	poqun_cangfeng: "藏锋",
	poqun_cangfeng_info: "锁定技，你的红色【杀】视为【闪】，你的黑色【杀】视为无懈可击。",
	poqun_huifeng: "回锋",
	poqun_huifeng_info:
		"当你受到伤害后，你可以选择一名手牌数不大于你的一名角色，展示其手牌，若其手牌包含【杀】，你可以对其造成1点伤害或弃置其一张【杀】。",

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
		"当你受到伤害后，若你的武将牌正面向上，你可以翻面防止此伤害。若如此做，你不能成为延时类锦囊牌的目标直到你的武将牌翻回正面。",
	poqun_lingfeng: "凌风",
	poqun_lingfeng_info:
		"当你因翻面跳过回合后，你可以摸1张牌并额外进行一个出牌阶段，此阶段使用的【杀】无距离限制且不可被闪避。",

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

	poqun_xiaokong: "小空",
	poqun_lanxian: "揽贤",
	poqun_lanxian_info:
		"其他角色准备阶段，你可以将至多两张牌置于牌堆顶。若你以此法放置了两张牌，该角色回合结束时，你与其各摸一张牌。",
	poqun_juyi: "聚义",
	poqun_juyi_info:
		"出牌阶段限一次，你可以弃置一张牌声明一张此阶段未声明过的单目标普通锦囊牌牌名，其他角色须依次决定是否响应。若响应的人数不小于未响应角色数，你立即使用你声明的牌；反之，你摸一张牌。",
	poqun_shengwei: "声威",
	poqun_shengwei_info:
		"主公技，准备阶段，你的【聚义】描述可选择一项修改:1.将“响应的人数不小于”改为“响应的人数+蜀势力角色数大于”；2.删除“弃置一张牌”；3.将“单目标普通锦囊牌”改为“单目标普通锦囊牌或基本牌”。",

	poqun_gule: "古乐",
	poqun_guangyin: "光引",
	poqun_guangyin_info:
		"一名角色的判定牌生效前，你可以弃置一张牌令其观看牌堆底两张牌，选择一张作为判定牌。锁定技，你弃置的牌不进入弃牌堆，改为以任意顺序置于牌堆底。",
	poqun_jidou: "激斗",
	poqun_jidou_info:
		"当一名角色对另一名角色使用【决斗】时，你可以令决斗中的一名角色进行判定并获得判定牌，若如此做，该角色在此决斗中，与判定牌点数相同的手牌均视为【杀】。",
	poqun_zhechong: "折冲",
	poqun_zhechong_info:
		"每轮限一次，一名角色使用【杀】指定你为目标后，你可以将此【杀】效果转换成【决斗】。",

	poqun_feichi: "肥翅",
	poqun_yiyu: "疑谕",
	poqun_yiyu_info:
		"准备阶段或你阵亡时，你重置全部的“罔”。出牌阶段限一次，你可以观看牌堆顶一张牌，然后声明其花色和点数。其他角色依次选择是否质疑，然后你展示该牌。若无人质疑，你摸1张牌并获得“罔”；反之，若你声明正确，质疑的角色获得“罔”；若你的声明错误，质疑的角色摸一张牌。若有角色因此法获得“罔”，你摸1张牌。",
	poqun_wangfu: "妄缚",
	poqun_wangfu_info: "锁定技，拥有“罔”的角色不能使用或打出当前【疑谕】声明的花色或点数相同的牌。",

	poqun_yikun: "一焜",
	poqun_jihe: "稽核",
	poqun_jihe_info:
		"其他角色弃牌阶段结束时，你可以展示所有手牌，并获得其弃置的牌中任意一张与你手牌或装备区中点数相同的牌。",
	poqun_chengyi: "承遗",
	poqun_chengyi_info:
		"主公技，一名蜀势力角色阵亡时，其可以选择其一个除限定技外的技能令你获得之。准备阶段，你可以选择一个以此法获得的技能于你的回合内使用。",

	poqun_xujiejie: "徐姐姐",
};

export default translates;
