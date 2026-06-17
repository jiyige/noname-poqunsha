const skills = {
	rixun: {
		skill_id: "rixun",
		group: ["rixun_effect"],
		subSkill: {
			effect: {
				skill_id: "rixun_effect",
				trigger: { global: "phaseBegin" },
				forced: true,
				filter: function (event, player) {
					return event.player.storage.rixun_mark == player && player.isAlive();
				},
				content: async function (event, trigger, player) {
					var target = trigger.player;
					target.storage.rixun_mark = false;
					target.unmarkSkill("rixun_mark");

					var result = await target
						.chooseControlList(
							["跳过摸牌阶段，本回合使用【杀】伤害+1", "跳过出牌阶段，回复1点体力"],
							true,
						)
						.set("ai", function () {
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
									return (
										current != self && get.attitude(self, current) < 0 && self.inRange(current)
									);
								});
								if (enemies.length > 0) return 0;
							}
							// 残血 → 选回血
							if (self.hp < self.maxHp) return 1;
							// 默认 → 选杀+1
							return 0;
						});
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
						await target.recover();
					}
				},
				sub: true,
				sourceSkill: "rixun",
			},
			sha_bonus: {
				skill_id: "rixun_sha_bonus",
				trigger: { source: "damageBegin" },
				forced: true,
				filter: function (event, player) {
					return event.card && event.card.name == "sha";
				},
				content: function () {
					trigger.num++;
				},
				sub: true,
				sourceSkill: "rixun",
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
		content: async function (event, trigger, player) {
			var target = event.target;
			game.log("【日询】", player, "将", event.cards, "交给", target);
			await player.give(event.cards, target);
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
			tag: { gain: 1 },
		},
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
	},
	tuhao: {
		skill_id: "tuhao",
		group: ["tuhao_grant"],
		subSkill: {
			grant: {
				skill_id: "tuhao_grant",
				trigger: { global: "phaseUseBegin" },
				forced: false,
				frequent: true,
				popup: false,
				filter: function (event, player) {
					return event.player != player && player.isAlive();
				},
				content: async function (event, trigger, player) {
					trigger.player.addTempSkill("tuhao_request", { player: "phaseAfter" });
					trigger.player.addTempSkill("tuhao_dtrack", { player: "phaseAfter" });
					trigger.player.addTempSkill("tuhao_rtrack", { player: "phaseAfter" });
					trigger.player.addTempSkill("tuhao_settle", { player: "phaseAfter" });

					// 初始化 storage
					trigger.player.storage.tuhao_xiaoch = null;
					trigger.player.storage.tuhao_dealt = false;
					trigger.player.storage.tuhao_recovered = false;
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
				filter: function (event, player) {
					var xiaoch = game.findPlayer(function (p) {
						return p.hasSkill("tuhao");
					});
					if (!xiaoch || !xiaoch.isAlive()) return false;
					var canUseSha =
						player.getCardUsable("sha") > 0 &&
						game.hasPlayer(function (t) {
							return t != player && player.inRange(t);
						});
					var canUseTao = player.isDamaged();
					return canUseSha || canUseTao;
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

					// 小澈选牌或拒绝
					var cardResult = await xiaoch
						.chooseCard(
							"h",
							function (card) {
								return card.name == selectedName;
							},
							"【土豪】是否代" +
								get.translation(player) +
								"使用【" +
								+get.translation(selectedName) +
								"】（选择一张牌同意，点取消拒绝）",
						)
						.set("ai", function (card) {
							var att = get.attitude(xiaoch, player);
							if (att <= 0) return -1;
							if (xiaoch.countCards("h") <= 2) return -1;

							var handCount = xiaoch.countCards("h", function (c) {
								return c.name == selectedName;
							});

							if (selectedName == "tao") {
								if (player.hp <= 1 && handCount > 1) return 10;
								if (player.hp <= 1 && xiaoch.countCards("h") >= 4) return 10;
								if (handCount >= 2) return 5;
								return -1;
							}
							if (selectedName == "sha") {
								if (target && get.attitude(xiaoch, target) < 0 && handCount >= 1) return 5;
								return -1;
							}
							if (selectedName == "jiu") {
								return handCount >= 2 ? 5 : -1;
							}
							return -1;
						})
						.forResult();

					if (!cardResult.bool || !cardResult.cards) {
						xiaoch.popup("拒绝");
						game.log(xiaoch, "拒绝了【土豪】请求");
						return;
					}

					player.storage.tuhao_xiaoch = xiaoch;
					await player.addSkill("tuhao_settle");

					var givenCard = cardResult.cards[0];
					await xiaoch.give(givenCard, player);
					await player.useCard(givenCard, target);
				},
				ai: {
					order: 2,
					result: {
						player: function (player) {
							var xiaoch = game.findPlayer(function (p) {
								return p.hasSkill("tuhao");
							});
							if (!xiaoch || !xiaoch.isAlive()) return -2;
							if (get.attitude(player, xiaoch) <= 0) return -2;

							var xiaochHand = xiaoch.countCards("h"); // 总手牌数，公开信息
							if (xiaochHand <= 2) return -2; // 牌太少，大概率拒绝

							var hasGoodTarget = game.hasPlayer(function (t) {
								return t != player && player.inRange(t) && get.attitude(player, t) < 0;
							});

							// 用公开手牌数估算小澈有多余牌的概率
							// 牌越多，越可能有富余的基本牌愿意给
							var generous = xiaochHand >= 5;

							// === 求杀 ===
							if (hasGoodTarget && !player.countCards("h", { name: "sha" })) {
								// 杀牌较常见，手牌多时小澈大概率有
								return generous ? 3 : xiaochHand >= 4 ? 2 : -2;
							}

							// === 求酒 ===
							if (hasGoodTarget && player.countCards("h", { name: "sha" })) {
								// 酒牌稀少，需要小澈牌很多才值得请求
								if (xiaochHand >= 6) return 1.5;
								return -2;
							}

							// === 非濒死回血 ===
							if (player.isDamaged()) {
								// 桃很珍贵，小澈牌非常充裕时才值得
								if (xiaochHand >= 6) return 0.5;
								return -2;
							}

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
					if (player.storage.tuhao_recovered && player.getEquip(2) !== null) {
						game.log("【土豪】", player, "于此阶段回复体力，", xiaoch, "获得", player, "的防具");
						var card = player.getEquip(2);
						if (xiaoch.getEquip(2)) {
							await xiaoch.discard(xiaoch.getEquip(2));
						}
						player.$give(card, xiaoch);
						await xiaoch.equip(card);
					}
					player.storage.tuhao_xiaoch = null;
					player.storage.tuhao_dealt = false;
					player.storage.tuhao_recovered = false;
				},
			},
			dtrack: {
				skill_id: "tuhao_dtrack",
				charlotte: true,
				trigger: { source: "damageAfter" },
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
				trigger: { player: "recoverAfter" },
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
		frequent: true,
		popup: false,
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
			var baseType = get.type(trigger.card);
			var isDelayed = false;
			if (baseType === "trick") {
				var info = lib.card[trigger.card.name];
				isDelayed = info && info.type === "delay";
			}

			// 类型显示名
			var typeText = (function () {
				if (baseType === "basic") return "基本";
				if (baseType === "trick") return isDelayed ? "延时锦囊" : "普通锦囊";
				if (baseType === "equip") return "装备";
				return get.translation(baseType);
			})();

			// 过滤函数：同大类 + 同子类（普通/延时）
			var filterFunc = function (card) {
				if (get.type(card) !== baseType) return false;
				if (baseType === "trick") {
					var cardInfo = lib.card[card.name];
					var cardIsDelayed = cardInfo && cardInfo.type === "delay";
					return cardIsDelayed === isDelayed;
				}
				return true;
			};

			// ---------- 小澈没有对应类型牌 → 弹提示 ----------
			if (!xiaoch.countCards("h", filterFunc)) {
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
					if (xiaoch === player && xiaoch.hp <= event.num) return 150 - get.value(card);
					if (event.num >= 2) return 90 - get.value(card);
					if (get.attitude(xiaoch, player) > 0) return 50 - get.value(card);
					return -1;
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
	},
	guangming: {
		skill_id: "guangming",
		forced: true,
		locked: true,
		group: ["guangming_baiyin", "guangming_recover"],
		init: function (player, skill) {
			player.addExtraEquip(skill, "baiyin", true, function (player2) {
				return player2.hasEmptySlot(2) && lib.card.baiyin;
			});
		},
		onremove: function (player, skill) {
			player.removeExtraEquip(skill);
		},
		subSkill: {
			baiyin: {
				skill_id: "guangming_baiyin",
				equipSkill: true,
				noHidden: true,
				inherit: "baiyin_skill",
				sourceSkill: "guangming",
				filter: function (event, player) {
					if (!player.hasEmptySlot(2)) return false;
					return true;
				},
			},
			recover: {
				skill_id: "guangming_recover",
				trigger: { player: "equipAfter" },
				forced: true,
				popup: false,
				filter: function (event, player) {
					if (!event.card || get.subtype(event.card) !== "equip2") return false;
					if (!player.hasSkill("guangming")) return false;
					return player.isDamaged();
				},
				content: async function (event, trigger, player) {
					await player.recover();
					game.log(player, "【光明】白银狮子被替换，回复1点体力");
				},
			},
		},
	},
	maihao: {
		skill_id: "maihao",
		trigger: { global: "dieAfter" },
		forced: false,
		frequent: true,
		popup: false,
		filter: function (event, player) {
			var round = game.roundNumber;
			return player.storage.maihao !== round && event.player !== player;
		},
		content: async function (event, trigger, player) {
			var result = await player
				.chooseBool("是否发动【买号】，将武将替换为" + get.translation(trigger.player) + "？")
				.set("ai", function () {
					var dead = trigger.player;
					var oldName = player.name1 || player.name;
					var newName = dead.name;
					var oldRank = get.rank(oldName, true);
					var newRank = get.rank(newName, true);
					var rankDiff = newRank - oldRank;
					var hpDiff = dead.maxHp - player.maxHp;
					var discardCount = player.countCards("hej");
					var drawCount = dead.maxHp;
					var netCards = drawCount - discardCount;
					var hpRatio = player.hp / player.maxHp;
					var score = 0;
					score += rankDiff * 10;
					score += hpDiff * 4;
					score += netCards * 2;
					if (hpRatio <= 0.3) score += 15;
					if (player.hp <= 1) score += 20;
					if (player.hp <= 0) return true;
					if (rankDiff <= 0 && netCards <= 0) return false;
					if (rankDiff > 0) return score > 5;
					return score > 10;
				})
				.forResult();

			if (!result.bool) return;

			// 保存需要保留的数据
			var maihaoStorage = player.storage.maihao;
			var keepName = player.name;

			// 替换武将
			player.reinit(player.name, trigger.player.name);

			// 改回名字
			player.name = keepName;
			if (player.name1) player.name1 = keepName;
			player.node.name.innerHTML = get.translation(keepName);

			// 补回保留的技能
			player.addSkill("maihao");
			player.storage.maihao = maihaoStorage;

			// 弃置区域内的全部牌
			var cards = player.getCards("hej");
			if (cards.length) {
				await player.discard(cards);
			}

			// 摸X张牌
			await player.draw(player.maxHp);

			game.log(
				player,
				"发动【买号】，替换为",
				trigger.player,
				"，弃置所有牌并摸" + player.maxHp + "张牌",
			);
		},
	},
	shenyin: {
		skill_id: "shenyin",
		forced: true,
		locked: true,
		mod: {
			targetEnabled: function (card, player, target) {
				if (card.name === "bingliang") return false;
			},
			globalTo: function (from, to, distance) {
				return distance + 1;
			},
		},
	},
	ruoji: {
		skill_id: "ruoji",
		forced: true,
		locked: true,
		mod: {
			cardname: function (card, player) {
				if (card.name === "sha") {
					if (get.color(card) === "red") return "shan";
					if (get.color(card) === "black") return "wuxie";
				}
			},
		},
	},
	jiche: {
		skill_id: "jiche",
		trigger: { global: "useCardToPlayer" },
		forced: false,
		frequent: true,
		popup: false,
		filter: function (event, player) {
			if (event.target === player) return false;
			if (event.player === player) return false;
			if (event.card.name !== "sha" && get.type(event.card) !== "trick") return false;
			// 唯一目标判断
			var useEvent = event.getParent();
			if (!useEvent || !useEvent.targets) return false;
			if (useEvent.targets.length !== 1) return false;
			// 没手牌不能弃
			if (!player.countCards("h")) return false;
			// 借刀杀人需要自己有武器
			if (event.card.name === "jiedao" && !player.getEquip(1)) return false;
			return true;
		},
		content: async function (event, trigger, player) {
			var oldTarget = trigger.target;
			var card = trigger.card;

			// 预计算效果值
			var effectOnTarget = get.effect(oldTarget, card, trigger.player, player);
			var effectOnSelf = get.effect(player, card, trigger.player, player);

			var result = await player
				.chooseCard(
					"h",
					"【鸡车】弃置一张手牌，代替" +
						get.translation(oldTarget) +
						"成为" +
						get.translation(card) +
						"的目标",
				)
				.set("ai", function (hCard) {
					// 不保护敌人
					if (get.attitude(player, oldTarget) <= 0) return -1;

					// 对目标有益的牌不挡（无中生有等）
					if (effectOnTarget >= 0) return -1;

					// 自己扛不住不挡（会死）
					if (-effectOnSelf >= player.hp) return -1;

					// 颜色匹配摸牌
					var colorMatch = get.color(hCard) === get.color(card);
					var score = colorMatch ? 8 : 4;

					// 目标越危险越值得挡
					if (oldTarget.hp <= 1) score += 3;

					return score - get.value(hCard);
				})
				.forResult();

			if (!result.bool) return;

			await player.discard(result.cards[0]);

			// 替换目标
			trigger.target = player;
			var useEvent = trigger.getParent();
			if (useEvent && useEvent.targets) {
				var idx = useEvent.targets.indexOf(oldTarget);
				if (idx !== -1) useEvent.targets[idx] = player;
			}

			game.log(player, "发动【鸡车】，代替", oldTarget, "成为", card, "的目标");

			// 颜色匹配摸牌
			if (get.color(result.cards[0]) === get.color(card)) {
				await player.draw();
				game.log(player, "弃置的牌与目标牌颜色相同，摸一张牌");
			}
		},
	},
	bianlu: {
		skill_id: "bianlu",
		trigger: { player: "phaseUseEnd" },
		forced: true,
		group: ["bianlu_reset", "bianlu_dtrack"],
		filter: function (event, player) {
			return !player.storage.bianlu_damaged && player.maxHp > 1;
		},
		content: async function (event, trigger, player) {
			player.maxHp--;
			player.update();
			game.log(player, "【辩戮】减1点体力上限");
			var nanman = game.createCard("nanman", "none", 0);
			await player.useCard(
				nanman,
				game.filterPlayer(function (current) {
					return current !== player;
				}),
			);
		},
		subSkill: {
			reset: {
				skill_id: "bianlu_reset",
				trigger: { player: "phaseBegin" },
				forced: true,
				popup: false,
				silent: true,
				firstDo: true,
				content: function (event, trigger, player) {
					player.storage.bianlu_damaged = false;
				},
			},
			dtrack: {
				skill_id: "bianlu_dtrack",
				trigger: { source: "damageAfter" },
				forced: true,
				popup: false,
				silent: true,
				filter: function (event, player) {
					return _status.currentPhase === player;
				},
				content: function (event, trigger, player) {
					player.storage.bianlu_damaged = true;
				},
			},
		},
	},
	daifa: {
		skill_id: "daifa",
		trigger: { global: "phaseEnd" },
		forced: false,
		frequent: true,
		group: ["daifa_dtrack", "daifa_reset"],
		filter: function (event, player) {
			if (event.player === player) return false;
			if (event.player.isDead()) return false;
			if (!event.player.storage.daifa_damaged_this_turn) return false;
			var round = game.roundNumber;
			if (player.storage.daifa_round !== round) {
				player.storage.daifa_round = round;
				player.storage.daifa_count = 0;
			}
			var maxUse = player.maxHp - player.hp;
			if (maxUse <= 0) return false;
			if (player.storage.daifa_count >= maxUse) return false;
			return player.countCards("h") > 0;
		},
		content: async function (event, trigger, player) {
			var target = trigger.player;
			var result = await player
				.chooseCard(
					"h",
					"【代伐】弃置一张手牌，视为对" +
						get.translation(target) +
						"使用【决斗】（选牌同意，取消拒绝）",
				)
				.set("ai", function (card) {
					if (get.attitude(player, target) >= 0) return -1;
					var effect = get.effect(target, { name: "juedou" }, player, player);
					if (effect <= 0) return -1;
					return effect * 2 - get.value(card);
				})
				.forResult();

			if (!result.bool) return;

			await player.discard(result.cards[0]);

			var round = game.roundNumber;
			if (player.storage.daifa_round !== round) {
				player.storage.daifa_round = round;
				player.storage.daifa_count = 0;
			}
			player.storage.daifa_count++;
			console.log("代伐使用次数+1");

			var juedou = game.createCard("juedou", "none", 0);
			console.log("创建一张决斗", juedou);
			await player.useCard(juedou, [target]);

			game.log(player, "发动【代伐】，弃置一张手牌，对", target, "使用【决斗】");
		},
		subSkill: {
			dtrack: {
				skill_id: "daifa_dtrack",
				trigger: { global: "damageSource" },
				forced: true,
				popup: false,
				silent: true,
				filter: function (event, player) {
					console.log("当前角色", _status.currentPhase);
					console.log("伤害来源", event.source);
					return _status.currentPhase === event.source;
				},
				content: function (event, trigger, player) {
					console.log("当前角色造成了伤害");
					trigger.source.storage.daifa_damaged_this_turn = true;
				},
			},
			reset: {
				skill_id: "daifa_reset",
				trigger: { global: "turnBegin" },
				forced: true,
				popup: false,
				silent: true,
				content: function (event, trigger, player) {
					console.log("当前角色重置", trigger.player);
					trigger.player.storage.daifa_damaged_this_turn = false;
				},
			},
		},
	},
	caishang: {
		skill_id: "caishang",
		trigger: { player: "phaseEnd" },
		forced: false,
		frequent: true,
		filter: function (event, player) {
			return game.hasPlayer(function (current) {
				return current !== player && current.countCards("h") > 0;
			});
		},
		content: async function (event, trigger, player) {
			var X = Math.max(player.maxHp - player.hp, 1);

			var result = await player
				.chooseTarget(
					"【财商】选择至多" + X + "名其他角色（他们可以交给你一张手牌）",
					[1, X],
					function (card, player, target) {
						return target !== player && target.countCards("h") > 0;
					},
				)
				.set("ai", function (target) {
					if (get.attitude(target, player) <= 0) return 0;
					return get.attitude(target, player) + target.countCards("h");
				})
				.forResult();

			if (!result.bool) return;

			var givers = [];

			for (var i = 0; i < result.targets.length; i++) {
				var target = result.targets[i];
				if (target.isDead() || !target.countCards("h")) continue;

				var giveResult = await target
					.chooseCard(
						"h",
						"【财商】交给" + get.translation(player) + "一张手牌（选牌交出，取消拒绝）",
					)
					.set("ai", function (card) {
						if (get.attitude(target, player) <= 0) return -1;
						return 6 - get.value(card);
					})
					.forResult();

				if (giveResult.bool && giveResult.cards) {
					await target.give(giveResult.cards[0], player);
					givers.push(target);
					game.log(target, "交给", player, "一张手牌");
				}
			}

			// 记录本轮给过牌的角色，供下回合深造使用
			player.storage.caishang_givers = givers;
		},
	},
	shenzao: {
		skill_id: "shenzao",
		trigger: { player: "phaseDrawBegin" },
		forced: false,
		frequent: true,
		filter: function (event, player) {
			return player.countCards("h") > 0;
		},
		content: async function (event, trigger, player) {
			// 弃置任意张牌
			var result = await player
				.chooseToDiscard("h", "【深造】弃置任意张牌，多摸等量的牌（手牌上限-1）")
				.set("selectCard", [1, player.countCards("h")])
				.set("ai", function (card) {
					return 6 - get.value(card);
				})
				.forResult();

			if (!result.bool || !result.cards || !result.cards.length) return;

			var discardCount = result.cards.length;
			var discardedCards = result.cards;

			// 多摸等量的牌
			trigger.num += discardCount;

			// 本回合手牌上限-1
			player.addTempSkill("shenzao_limit", "roundAfter");

			// 读取上回合财商给过牌的角色
			var givers = player.storage.caishang_givers || [];
			player.storage.caishang_givers = [];

			// 依次选择是否给弃置的牌
			for (var i = 0; i < givers.length; i++) {
				var giver = givers[i];
				if (!giver || giver.isDead()) continue;

				var available = discardedCards.filter(function (c) {
					return c.parentNode === ui.discardPile;
				});
				if (!available.length) break;

				var cardResult = await player
					.chooseButton([
						"【深造】是否将一张弃置的牌交给" + get.translation(giver) + "？",
						available,
					])
					.set("ai", function (button) {
						if (get.attitude(player, giver) <= 0) return false;
						return true;
					})
					.forResult();

				if (cardResult.bool && cardResult.links) {
					var idx = available.indexOf(cardResult.links[0]);
					if (idx !== -1) available.splice(idx, 1);
					await giver.gain(cardResult.links[0], "gain2");
					game.log(player, "将", cardResult.links[0], "交给", giver);
				}
			}
		},
		subSkill: {
			limit: {
				skill_id: "shenzao_limit",
				charlotte: true,
				mark: false,
				mod: {
					maxHandcard: function (player, num) {
						return num - 1;
					},
				},
			},
		},
	},
	yuefeng: {
		skill_id: "yuefeng",
		zhuSkill: true,
		forced: true,
		locked: true,
		mod: {
			maxHandcard: function (player, num) {
				return (
					num +
					game.filterPlayer(function (current) {
						return current.group === "qun" && current.isAlive();
					}).length
				);
			},
		},
	},
	poqun_fugui: {
		skill_id: "poqun_fugui",
		trigger: { player: "damageBegin2" },
		forced: false,
		frequent: true,
		mod: {
			targetEnabled: function (card, player, target) {
				if (target.isTurnedOver() && get.type(card) === "delay") return false;
			},
		},
		filter: function (event, player) {
			return !player.isTurnedOver();
		},
		content: async function (event, trigger, player) {
			var result = await player
				.chooseBool("是否发动【复归】，翻面防止此伤害？")
				.set("ai", function () {
					if (player.hp <= trigger.num) return true;
					if (trigger.num >= 2) return true;
					if (player.hp >= 4) return true;
					return false;
				})
				.forResult();

			if (!result.bool) return;

			player.turnOver();
			trigger.cancel();
			game.log(player, "发动【复归】，翻面防止此伤害");
		},
	},
	poqun_lingfeng: {
		skill_id: "poqun_lingfeng",
		trigger: {
			player: "phaseBefore",
		},
		forced: true,
		popup: false,
		filter: function (event, player) {
			return player.isTurnedOver();
		},
		content: async function (event, trigger, player) {
			// 摸两张牌
			await player.draw(2);

			// 额外回合
			player.addSkill("safeng_sha_bonus");
			await player.phaseUse();
			player.removeSkill("safeng_sha_bonus");
		},
		subSkill: {
			sha_bonus: {
				skill_id: "poqun_lingfeng_sha_bonus",
				charlotte: true,
				mod: {
					targetInRange: function (card, player) {
						if (card.name === "sha") return true;
					},
				},
				trigger: { player: "useCard" },
				forced: true,
				popup: false,
				filter: function (event, player) {
					return event.card && event.card.name === "sha";
				},
				content: async function (event, trigger, player) {
					trigger.directHit.addArray(trigger.targets);
				},
			},
		},
	},
};

export default skills;
