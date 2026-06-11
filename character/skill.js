const skills = {
	rixun: {
		skill_id: "rixun",
		group: ["rixun_effect", "rixun_sha_bonus"],
		subSkill: {
			effect: {
				skill_id: "rixun_effect",
				trigger: {
					global: "phaseBegin",
				},
				forced: true,
				filter: function (event, player) {
					var result = event.player.storage.rixun_mark == player && player.isAlive();
					return result;
				},
				content: function () {
					"step 0";
					var target = trigger.player;
					target.storage.rixun_mark = false;
					target.unmarkSkill("rixun_mark");
					var next = target.chooseControlList(
						["跳过摸牌阶段，本回合使用【杀】伤害+1", "跳过出牌阶段，回复1点体力"],
						true,
					);
					next.set("ai", function () {
						var self = trigger.player;
						var judges = self.getCards("j");
						var hasLebu = false;
						var hasBingliang = false;
						for (var i = 0; i < judges.length; i++) {
							if (judges[i].name == "lebu") hasLebu = true;
							if (judges[i].name == "bingliang") hasBingliang = true;
						}
						// 有乐不思蜀 → 选回血（乐跳了出牌阶段也是白回血）
						if (hasLebu) return 1;
						// 有兵粮寸断 → 选杀+1（兵跳了摸牌阶段，选1等于白赚）
						if (hasBingliang) return 0;
						// 有杀且有可攻击敌人 → 选杀+1
						if (self.countCards("h", { name: "sha" }) > 0) {
							var enemies = game.filterPlayer(function (current) {
								return current != self && get.attitude(self, current) < 0 && self.inRange(current);
							});
							if (enemies.length > 0) return 0;
						}
						// 残血 → 选回血
						if (self.hp < self.maxHp) return 1;
						// 默认 → 选杀+1
						return 0;
					});
					("step 1");
					var target = trigger.player;
					game.log(
						"【日询】",
						target,
						"选择了选项：",
						result.index == 0 ? "跳过摸牌，杀伤害+1" : "跳过出牌，回复体力",
					);
					if (result.index == 0) {
						target.skip("phaseDraw");
						target.addTempSkill("rixun_sha_bonus", { player: "phaseAfter" });
					} else {
						target.skip("phaseUse");
						target.recover();
					}
				},
				sub: true,
				sourceSkill: "rixun",
				_priority: 0,
			},
			sha_bonus: {
				skill_id: "rixun_sha_bonus",
				trigger: {
					source: "damageBegin",
				},
				forced: true,
				filter: function (event, player) {
					var result = event.card && event.card.name == "sha";
					return result;
				},
				content: function () {
					trigger.num++;
				},
				sub: true,
				sourceSkill: "rixun",
				_priority: 0,
			},
		},
		enable: "phaseUse",
		usable: 1,
		filterCard: function (card) {
			return true;
		},
		position: "h",
		selectCard: 1,
		filterTarget: function (card, player, target) {
			return target != player;
		},
		content: function () {
			game.log("【日询】", player, "将", cards, "交给", target);
			player.give(cards, target);
			target.storage.rixun_mark = player;
			target.markSkill("rixun_mark");
		},
		ai: {
			order: 6,
			result: {
				player: function (player, target) {
					var att = get.attitude(player, target);
					var judges = target.getCards("j");
					var hasLebu = false;
					var hasBingliang = false;
					for (var i = 0; i < judges.length; i++) {
						if (judges[i].name == "lebu") hasLebu = true;
						if (judges[i].name == "bingliang") hasBingliang = true;
					}
					if (att > 0) {
						// 队友：手牌充足才给
						var score = player.countCards("h") > 2 ? 1 : -1;
						// 队友被乐 → 给他标记能白赚回血，加分
						if (hasLebu) score += 1.5;
						// 队友被兵 → 给他标记会选杀+1，但手牌少发挥有限，略减
						if (hasBingliang) score -= 0.5;
						return score;
					} else {
						// 敌人被乐 → 对方必选回血 = 白送牌帮回血，绝对不给
						if (hasLebu) return -5;
						// 敌人被兵 → 对方会选杀+1但手牌少，微亏
						if (hasBingliang) return -1;
						// 敌人满血 → 两个选项都亏阶段，可以给
						if (target.hp >= target.maxHp) return 0.5;
						// 敌人残血 → 选回血，白送牌
						return -3;
					}
				},
				target: function (player, target) {
					var att = get.attitude(player, target);
					var judges = target.getCards("j");
					var hasLebu = false;
					var hasBingliang = false;
					for (var i = 0; i < judges.length; i++) {
						if (judges[i].name == "lebu") hasLebu = true;
						if (judges[i].name == "bingliang") hasBingliang = true;
					}
					if (att > 0) {
						// 队友拿到牌 + 增益选项
						var score = 2;
						if (hasLebu) score += 1;
						if (hasBingliang) score -= 1;
						return score;
					} else {
						// 敌人被乐 → 保底回血，白拿牌
						if (hasLebu) return 4;
						// 敌人被兵 → 选杀+1但手牌少，收益有限
						if (hasBingliang) return 1;
						// 满血敌人：两个选项都亏阶段
						if (target.hp >= target.maxHp) return -1;
						// 残血敌人：白拿牌+回血
						return 3;
					}
				},
			},
			tag: {
				gain: 1,
			},
		},
		_priority: 0,
	},
	moyu: {
		skill_id: "moyu",
		trigger: {
			global: "phaseAfter",
		},
		forced: false,
		filter: function (event, player) {
			if (!player.isAlive()) return false;
			return (
				event.player.getHistory("useCard", function (evt) {
					return evt.card.name == "sha";
				}).length == 0
			);
		},
		content: function () {
			player.draw();
		},
		ai: {
			threaten: 1.2,
		},
		_priority: 0,
	},
	yuyu: {
		skill_id: "yuyu",
		marktext: "玉",
		intro: {
			content: function (storage) {
				if (!storage || storage.length == 0) return "未记录任何花色";
				var suitMap = { spade: "♠", heart: "♥", club: "♣", diamond: "♦" };
				return (
					"记录花色：" +
					storage
						.map(function (s) {
							return suitMap[s] || s;
						})
						.join(" ")
				);
			},
		},
		group: ["yuyu_def", "yuyu_clean"],
		subSkill: {
			def: {
				skill_id: "yuyu_def",
				trigger: {
					player: "damageBegin2",
				},
				forced: true,
				filter: function (event, player) {
					return (
						player.storage.yuyu &&
						player.storage.yuyu.length > 0 &&
						event.card &&
						player.storage.yuyu.indexOf(get.suit(event.card)) != -1
					);
				},
				content: function () {
					trigger.cancel();
				},
				sub: true,
				sourceSkill: "yuyu",
				_priority: 0,
			},
			clean: {
				skill_id: "yuyu_clean",
				trigger: {
					player: "phaseBegin",
				},
				forced: true,
				popup: false,
				filter: function (event, player) {
					return player.storage.yuyu && player.storage.yuyu.length > 0;
				},
				content: function () {
					player.storage.yuyu = [];
					player.unmarkSkill("yuyu");
				},
				sub: true,
				sourceSkill: "yuyu",
				_priority: 0,
			},
		},
		trigger: {
			player: "damageEnd",
		},
		forced: false,
		filter: function (event, player) {
			return event.card && get.suit(event.card);
		},
		content: function () {
			var suit = get.suit(trigger.card);
			game.log("【玉玉】记录花色：", suit);
			if (!player.storage.yuyu) player.storage.yuyu = [];
			if (player.storage.yuyu.indexOf(suit) == -1) {
				player.storage.yuyu.push(suit);
			}
			player.markSkill("yuyu");
		},
		ai: {
			threaten: 1,
			effect: {
				target: function (card, player, target, current) {
					if (target.storage.yuyu && target.storage.yuyu.length > 0 && card) {
						var suit = get.suit(card);
						if (suit && target.storage.yuyu.indexOf(suit) != -1) {
							// 返回0表示"此牌对该目标无效"
							if (get.tag(card, "damage")) {
								return 0;
							}
						}
					}
				},
			},
		},
		_priority: 0,
	},
	tuhao: {
		skill_id: "tuhao",
		group: ["tuhao_grant"],
		subSkill: {
			grant: {
				skill_id: "tuhao_grant",
				trigger: { global: "phaseUseBegin" },
				forced: true,
				popup: false,
				filter: function (event, player) {
					return event.player != player && player.isAlive();
				},
				content: async function (event, trigger, player) {
					trigger.player.addTempSkill("tuhao_request", { player: "phaseAfter" });

					// 初始化 storage
					trigger.player.storage.tuhao_xiaoch = null;
					trigger.player.storage.tuhao_dealt = false;
					trigger.player.storage.tuhao_recovered = false;

					// 注册附属技能，监听整个出牌阶段
					trigger.player.addSkill("tuhao_settle");
					trigger.player.addSkill("tuhao_dtrack");
					trigger.player.addSkill("tuhao_rtrack");
				},
			},
			request: {
				skill_id: "tuhao_request",
				enable: "phaseUse",
				usable: 1,
				filterCard: function () {
					return false;
				},
				selectCard: 0,
				mark: true,
				intro: {
					content: "可请求小澈代为使用基本牌",
				},
				filter: function (event, player) {
					var xiaoch = game.findPlayer(function (p) {
						return p.hasSkill("tuhao");
					});
					if (!xiaoch || !xiaoch.isAlive()) return false;
					if (player.isDamaged()) return true;
					if (
						game.hasPlayer(function (t) {
							return t != player && player.inRange(t);
						})
					) {
						return true;
					}
					return false;
				},
				content: async function (event) {
					var player = event.player;
					var xiaoch = game.findPlayer(function (p) {
						return p.hasSkill("tuhao");
					});
					if (!xiaoch || xiaoch.isDead()) return;

					var canUseSha =
						player.getCardUsable("sha") > 0 &&
						game.hasPlayer(function (t) {
							return t != player && player.inRange(t);
						});
					var canUseTao = player.isDamaged();

					var list = [
						["基本", "", "sha"],
						["基本", "", "shan"],
						["基本", "", "tao"],
						["基本", "", "jiu"],
					];

					// 请求者选牌型
					var buttonResult = await player
						.chooseButton(["【土豪】选择要使用的基本牌", [list, "vcard"]])
						.set("filterButton", function (button) {
							var name = button.link[2];
							if (name == "shan") return false;
							if (name == "sha") return canUseSha;
							if (name == "tao") return canUseTao;
							return true;
						})
						.set("ai", function (button) {
							var name = button.link[2];
							var att = get.attitude(player, xiaoch);
							// 对小澈态度差，不会主动求帮忙
							if (att < 0) return -1;

							var hasGoodTarget = game.hasPlayer(function (t) {
								return t != player && player.inRange(t) && get.attitude(player, t) < 0;
							});

							// 优先级：濒死求桃 > 有好目标求杀 > 求酒蓄爆
							if (name == "tao") {
								if (player.hp <= 1) return 15;
								if (player.hp == player.maxHp) return 0;
								return 8;
							}
							if (name == "sha") {
								if (!hasGoodTarget) return 0;
								return 10;
							}
							if (name == "jiu") {
								if (hasGoodTarget && player.hp >= 2) return 5;
								return 1;
							}
							return 0;
						})
						.forResult();

					if (!buttonResult.bool || !buttonResult.links) return;
					var selectedName = buttonResult.links[0][2];
					await player.addSkill("tuhao_limit");
					game.log(player, "发动了【土豪】，请求使用【", selectedName, "】");

					var target = player;
					if (selectedName == "sha") {
						var targetResult = await player
							.chooseTarget("选择【杀】的目标", function (card, player, t) {
								return t != player && player.inRange(t);
							})
							.set("ai", function (t) {
								return get.effect(t, { name: "sha" }, player, player);
							})
							.forResult();
						if (!targetResult.bool || !targetResult.targets) return;
						target = targetResult.targets[0];
						game.log(player, "选择了", target, "作为【杀】的目标");
					}

					// 小澈没该牌 → 显示原因 + 确认按钮
					if (
						!xiaoch.countCards("h", function (card) {
							return card.name == selectedName;
						})
					) {
						await xiaoch
							.chooseButton([
								"提示",
								[["您没有" + get.translation(selectedName) + "所需要的基本牌"], "tdnodes"],
							])
							.set("ai", function () {
								return true;
							});
						xiaoch.popup("拒绝");
						game.log(xiaoch, "拒绝了【土豪】请求");
						return;
					}

					// 小澈决定是否同意
					var boolResult = await xiaoch
						.chooseBool(
							"是否代" +
								get.translation(player) +
								"使用一张【" +
								get.translation(selectedName) +
								"】？",
						)
						.set("ai", function () {
							var att = get.attitude(xiaoch, player);
							// 敌人直接拒绝
							if (att <= 0) return false;

							// 手牌太少，自保优先
							if (xiaoch.countCards("h") <= 2) return false;

							var handCount = xiaoch.countCards("h", function (c) {
								return c.name == selectedName;
							});

							// 桃：队友濒死必须救，中等血量看情况
							if (selectedName == "tao") {
								if (player.hp <= 1 && handCount > 1) return true;
								if (player.hp <= 1 && xiaoch.countCards("h") >= 4) return true;
								if (handCount >= 2) return true;
								return false;
							}

							// 杀：有明确敌人目标时帮忙
							if (selectedName == "sha") {
								if (target && get.attitude(xiaoch, target) < 0) {
									return handCount >= 1;
								}
								return false;
							}

							// 酒：队友要蓄爆，有多余的才给
							if (selectedName == "jiu") {
								return handCount >= 2;
							}

							return false;
						})
						.forResult();

					if (!boolResult.bool) {
						xiaoch.popup("拒绝");
						game.log(xiaoch, "拒绝了【土豪】请求");
						return;
					}

					game.log(xiaoch, "同意了【土豪】请求");

					// 小澈选牌
					var cardResult = await xiaoch
						.chooseCard(
							"h",
							function (card) {
								return card.name == selectedName;
							},
							"选择一张【" + get.translation(selectedName) + "】",
						)
						.set("ai", function (card) {
							// 优先出价值低的
							return -get.value(card);
						})
						.forResult();

					if (!cardResult.bool || !cardResult.cards) return;

					player.storage.tuhao_xiaoch = xiaoch;
					player.storage.tuhao_dealt = false;
					player.storage.tuhao_recovered = false;
					await player.addSkill("tuhao_settle");

					var givenCard = cardResult.cards[0];
					await xiaoch.give(givenCard, player);
					await player.useCard(givenCard, target);
				},
				ai: {
					order: function (item, player) {
						var hasTarget = game.hasPlayer(function (t) {
							return t != player && player.inRange(t);
						});
						if (hasTarget && !player.countCards("h", { name: "sha" })) return 9;
						return 2;
					},
					result: {
						player: function (player) {
							var xiaoch = game.findPlayer(function (p) {
								return p.hasSkill("tuhao");
							});
							if (!xiaoch || !xiaoch.isAlive()) return -2;
							if (get.attitude(player, xiaoch) <= 0) return -2;
							if (xiaoch.countCards("h") < 1) return -2;
							var hasTarget = game.hasPlayer(function (t) {
								return t != player && player.inRange(t);
							});
							if (hasTarget && !player.countCards("h", { name: "sha" })) return 2;
							if (
								hasTarget &&
								player.countCards("h", { name: "sha" }) &&
								!player.countCards("h", { name: "jiu" })
							)
								return 1;
							if (player.isDamaged() && !player.countCards("h", { name: "tao" }) && player.hp <= 1)
								return 0.5;
							return -2;
						},
					},
				},
			},
			settle: {
				skill_id: "tuhao_settle",
				charlotte: true,
				trigger: { player: "phaseUseEnd" },
				forced: true,
				popup: false,
				filter: function (event, player) {
					return player.storage.tuhao_xiaoch && player.storage.tuhao_xiaoch.isAlive();
				},
				content: async function (event, trigger, player) {
					var xiaoch = player.storage.tuhao_xiaoch;
					if (player.storage.tuhao_dealt) {
						await xiaoch.draw();
						game.log("【土豪】", player, "于此阶段造成伤害，", xiaoch, "摸一张牌");
					}
					if (player.storage.tuhao_recovered) {
						game.log("【土豪】", player, "于此阶段回复体力，", xiaoch, "弃置一张牌");
						await xiaoch.chooseToDiscard("h", 1, true, "请选择弃置一张牌");
					}
					player.storage.tuhao_xiaoch = null;
					player.storage.tuhao_dealt = false;
					player.storage.tuhao_recovered = false;
				},
			},
			dtrack: {
				skill_id: "tuhao_dtrack",
				charlotte: true,
				trigger: { source: "damage" },
				forced: true,
				popup: false,
				silent: true,
				content: async function (event, trigger, player) {
					player.storage.tuhao_dealt = true;
				},
			},
			rtrack: {
				skill_id: "tuhao_rtrack",
				charlotte: true,
				trigger: { player: "recover" },
				forced: true,
				popup: false,
				silent: true,
				content: async function (event, trigger, player) {
					player.storage.tuhao_recovered = true;
				},
			},
			limit: {
				skill_id: "tuhao_limit",
				charlotte: true,
				mod: {
					maxHandcard: function (player, num) {
						game.log("【土豪】", player, "手牌上限-1");
						return num - 1;
					},
				},
			},
		},
	},
	ziyi: {
		skill_id: "ziyi",
		trigger: {
			player: "damageBegin1",
		},
		forced: false,
		filter: function (event, player) {
			return event.card && player.countCards("h") > 0;
		},
		content: async function (event, trigger, player) {
			var xiaoch = game.findPlayer(function (p) {
				return p.hasSkill("tuhao");
			});
			if (!xiaoch || xiaoch.isDead()) return;

			// 没有牌的伤害不触发
			if (!trigger.card) return;

			// 获取造成伤害的牌的类型
			var damageCardType = get.type(trigger.card, "trick");
			var typeText = get.translation(damageCardType);
			var filterFunc = function (card) {
				return get.type(card, "trick") == damageCardType;
			};

			var hasCard = xiaoch.countCards("h", filterFunc) > 0;
			if (!hasCard) {
				await xiaoch
					.chooseButton(["提示", [["您没有" + typeText + "类型的牌"], "tdnodes"]])
					.set("ai", function () {
						return true;
					});
				return;
			}

			var cardResult = await xiaoch
				.chooseCard("h", filterFunc, "您可以弃置一张" + typeText + "牌，令此伤害-1")
				.set("ai", function (card) {
					if (xiaoch.hp <= event.num) return 100 - get.value(card);
					if (event.num >= 2) return 80 - get.value(card);
					return 30 - get.value(card);
				})
				.forResult();

			if (!cardResult.bool || !cardResult.cards) return;

			await xiaoch.discard(cardResult.cards);
			trigger.num--;
			game.log(xiaoch, "弃置了一张" + typeText + "牌，令此伤害-1");
		},
		ai: {
			effect: {
				target: function (card, player, target, current) {
					if (get.tag(card, "damage") && target.countCards("h") > 0) {
						return 0.7;
					}
				},
			},
		},
		_priority: 0,
	},
	guangming: {
		skill_id: "guangming",
		forced: true,
		locked: true,
		group: "guangming_baiyin",
		init: function (player, skill) {
			player.addExtraEquip(skill, "baiyin", true, function (player2) {
				return player2.hasEmptySlot(2) && lib.card.baiyin;
			});
		},
		onremove: function (player, skill) {
			player.removeExtraEquip(skill);
		},
		_priority: 0,
	},
	guangming_baiyin: {
		equipSkill: true,
		noHidden: true,
		inherit: "baiyin_skill",
		sourceSkill: "guangming",
		filter: function (event, player) {
			if (!player.hasEmptySlot(2)) return false;
			return true;
		},
	},
};

export default skills;
