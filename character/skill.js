const skills = {
	poqun_rixun: {
		skill_id: "poqun_rixun",
		subSkill: {
			mark: {
				skill_id: "poqun_rixun_mark",
				charlotte: true,
				mark: true,
				marktext: "询",
				intro: {
					content: "回合开始时须选择一项：1.跳过摸牌，杀伤害+1；2.跳过出牌，回复体力",
				},
				trigger: { player: "phaseBegin" },
				forced: true,
				content: async function (event, trigger, player) {
					player.removeSkill("poqun_rixun_mark");

					var result = await player
						.chooseControlList([
							"跳过摸牌阶段，本回合使用【杀】伤害+1",
							"跳过出牌阶段，回复1点体力",
						])
						.set("forced", true)
						.set("ai", function () {
							var judges = player.getCards("j");
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
							if (player.countCards("h", { name: "sha" }) > 0) {
								var enemies = game.filterPlayer(function (current) {
									return (
										current != player &&
										get.attitude(player, current) < 0 &&
										player.inRange(current)
									);
								});
								if (enemies.length > 0) return 0;
							}
							// 残血 → 选回血
							if (player.hp < player.maxHp) return 1;
							// 默认 → 选杀+1
							return 0;
						})
						.forResult();
					game.log(
						"【日询】",
						player,
						"选择了选项：",
						result.index == 0 ? "跳过摸牌，杀伤害+1" : "跳过出牌，回复体力",
					);
					if (result.index == 0) {
						player.skip("phaseDraw");
						player.addTempSkill("poqun_rixun_sha_bonus", { player: "phaseAfter" });
					} else {
						player.skip("phaseUse");
						await player.recover();
					}
				},
				sub: true,
				sourceSkill: "poqun_rixun",
			},
			sha_bonus: {
				skill_id: "poqun_rixun_sha_bonus",
				trigger: { source: "damageBegin" },
				forced: true,
				filter: function (event, player) {
					return event.card && event.card.name == "sha";
				},
				content: function () {
					trigger.num++;
				},
				sub: true,
				sourceSkill: "poqun_rixun",
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
			target.addSkill("poqun_rixun_mark");
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
	poqn_touxian: {
		skill_id: "poqn_touxian",
		trigger: {
			global: "phaseAfter",
		},
		forced: false,
		filter: function (event, player) {
			if (!player.isAlive()) return false;
			return event.player.getHistory("useCard").length === 0;
		},
		content: function () {
			player.draw();
		},
		ai: {
			threaten: 1.2,
		},
	},
	poqun_yishen: {
		skill_id: "poqun_yishen",
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
		group: ["poqun_yishen_def", "poqun_yishen_clean"],
		subSkill: {
			def: {
				skill_id: "poqun_yishen_def",
				trigger: {
					player: "damageBegin2",
				},
				forced: true,
				filter: function (event, player) {
					return (
						player.storage.poqun_yishen &&
						player.storage.poqun_yishen.length > 0 &&
						event.card &&
						player.storage.poqun_yishen.indexOf(get.suit(event.card)) != -1
					);
				},
				content: function () {
					trigger.cancel();
				},
				sub: true,
				sourceSkill: "poqun_yishen",
			},
			clean: {
				skill_id: "poqun_yishen_clean",
				trigger: {
					player: "phaseBegin",
				},
				forced: true,
				popup: false,
				filter: function (event, player) {
					return player.storage.poqun_yishen && player.storage.poqun_yishen.length > 0;
				},
				content: function () {
					player.storage.poqun_yishen = [];
					player.unmarkSkill("poqun_yishen");
				},
				sub: true,
				sourceSkill: "poqun_yishen",
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
			game.log("【抑沈】记录花色：", suit);
			if (!player.storage.poqun_yishen) player.storage.poqun_yishen = [];
			if (player.storage.poqun_yishen.indexOf(suit) == -1) {
				player.storage.poqun_yishen.push(suit);
			}
			player.markSkill("poqun_yishen");
		},
		ai: {
			threaten: 1,
			effect: {
				target: function (card, player, target, current) {
					if (target.storage.poqun_yishen && target.storage.poqun_yishen.length > 0 && card) {
						var suit = get.suit(card);
						if (suit && target.storage.poqun_yishen.indexOf(suit) != -1) {
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
	poqun_leshi: {
		skill_id: "poqun_leshi",
		group: ["poqun_leshi_grant", "poqun_leshi_die"],
		subSkill: {
			// 出牌阶段开始时，你让对方看你手牌选一张
			grant: {
				skill_id: "poqun_leshi_grant",
				trigger: { global: "phaseUseBegin" },
				forced: false,
				direct: true,
				filter: function (event, player) {
					return event.player !== player && player.isAlive() && player.countCards("h") > 0;
				},
				content: async function (event, trigger, player) {
					var target = trigger.player;

					var confirm = await player
						.chooseBool("是否让" + get.translation(target) + "观看你的手牌并选择一张？")
						.set("ai", function () {
							return true;
							if (get.attitude(player, target) <= 0) return false;
							if (player.countCards("h") <= 2) return false;
							var hasUseful = player.countCards("h", function (card) {
								var name = card.name;
								if (name === "sha" && target.getCardUsable("sha") > 0) return true;
								if (name === "tao" && target.isDamaged()) return true;
								if (name === "jiu") return true;
								if (get.type(card) === "trick") return true;
								return false;
							});
							return hasUseful > 0;
						})
						.forResult();

					if (!confirm.bool) return;

					player.logSkill("poqun_leshi_grant");

					var result = await target
						.choosePlayerCard(
							player,
							true,
							"【乐施】选择" + get.translation(player) + "的一张手牌",
							"visible",
							"h",
						)
						.set("ai", function (button) {
							var card = button.link;
							var name = card.name;
							var type = get.type(card);
							var score = 0;

							if (type === "trick") {
								score = 8;
							} else if (name === "sha" && target.getCardUsable("sha") > 0) {
								var hasEnemy = game.hasPlayer(function (t) {
									return t !== target && target.inRange(t) && get.attitude(target, t) < 0;
								});
								score = hasEnemy ? 7 : 2;
							} else if (name === "tao" && target.isDamaged()) {
								score = target.hp <= 1 ? 9 : 5;
							} else if (name === "jiu") {
								var hasEnemy = game.hasPlayer(function (t) {
									return t !== target && target.inRange(t) && get.attitude(target, t) < 0;
								});
								score = hasEnemy && target.hp >= 2 ? 6 : 1;
							} else if (name === "shan") {
								score = 1;
							} else if (type === "equip") {
								var subtype = get.subtype(card);
								if (subtype === "equip2") score = !target.getEquip(2) ? 7 : 3;
								else if (subtype === "equip1") score = !target.getEquip(1) ? 6 : 3;
								else if (subtype === "equip3") score = !target.getEquip(3) ? 5 : 2;
								else if (subtype === "equip4") score = !target.getEquip(4) ? 4 : 2;
								else score = 3;
							} else {
								score = get.value(card) * 0.3;
							}

							if (target.countCards("h", { name: name }) > 0) score *= 0.5;
							return score;
						})
						.forResult();

					if (!result.bool || !result.links) return;

					var chosenCard = result.links[0];

					// 给真牌加标记
					chosenCard.addGaintag("poqun_leshi_tag");

					target.storage.poqun_leshi_card = chosenCard;
					target.storage.poqun_leshi_owner = player;
					target.storage.poqun_leshi_used = false;
					target.storage.poqun_leshi_dealt = false;
					target.storage.poqun_leshi_recovered = false;

					target.addTempSkill("poqun_leshi_use", { player: "phaseAfter" });
					target.addTempSkill("poqun_leshi_watch", { player: "phaseAfter" });
					target.addTempSkill("poqun_leshi_dtrack", { player: "phaseAfter" });
					target.addTempSkill("poqun_leshi_rtrack", { player: "phaseAfter" });
					target.addTempSkill("poqun_leshi_settle", { player: "phaseAfter" });

					game.log(player, "让", target, "观看手牌并选择了一张牌");
				},
				sub: true,
				sourceSkill: "poqun_leshi",
			},

			// 监控真牌：被用掉或被拿走时取消乐施
			watch: {
				skill_id: "poqun_leshi_watch",
				charlotte: true,
				trigger: { global: ["loseAfter", "useCardAfter"] },
				forced: true,
				popup: false,
				silent: true,
				filter: function (event, player) {
					var card = player.storage.poqun_leshi_card;
					var owner = player.storage.poqun_leshi_owner;
					if (!card || !owner || owner.isDead()) return false;
					return !owner.getCards("h").includes(card);
				},
				content: function (event, trigger, player) {
					var card = player.storage.poqun_leshi_card;
					if (card) card.removeGaintag("poqun_leshi_tag");
					player.storage.poqun_leshi_card = null;
					game.log("【乐施】所选牌已离开手牌，无法使用");
				},
				sub: true,
				sourceSkill: "poqun_leshi",
			},

			// 对方点按钮使用
			use: {
				skill_id: "poqun_leshi_use",
				charlotte: true,
				enable: "phaseUse",
				selectCard: 0,
				filterCard: function () {
					return false;
				},
				usable: 1,
				group: ["poqun_leshi_cleanup"],
				filter: function (event, player) {
					var card = player.storage.poqun_leshi_card;
					var owner = player.storage.poqun_leshi_owner;
					if (!card || !owner || owner.isDead()) return false;
					if (player.storage.poqun_leshi_used) return false;
					return owner.getCards("h").includes(card);
				},
				content: async function (event, trigger, player) {
					var card = player.storage.poqun_leshi_card;
					var owner = player.storage.poqun_leshi_owner;

					// 先拿牌
					// await owner.give(card, player);

					// 使用
					await player.chooseUseTarget(card, false, false);

					// 检查牌是否还在手里
					if (player.getCards("h").includes(card)) {
						// 没用掉，还回去，标记保留（还能再试）
						// await player.give(card, owner);
						card.addGaintag("poqun_leshi_tag");
						game.log(player, "未使用此牌，归还给", owner);
						return;
					}

					// 用掉了
					card.removeGaintag("poqun_leshi_tag");
					player.addTempSkill("poqun_leshi_limit", { player: "phaseAfter" });
					player.storage.poqun_leshi_used = true;
					game.log("【乐施】", player, "使用了此牌，手牌上限-1");
				},
				ai: {
					order: 8,
					result: { player: 1 },
				},
				sub: true,
				sourceSkill: "poqun_leshi",
			},

			cleanup: {
				skill_id: "poqun_leshi_cleanup",
				charlotte: true,
				trigger: { player: "phaseAfter" },
				forced: true,
				popup: false,
				silent: true,
				content: function (event, trigger, player) {
					var card = player.storage.poqun_leshi_card;
					if (card) card.removeGaintag("poqun_leshi_tag");

					player.storage.poqun_leshi_card = null;
					player.storage.poqun_leshi_owner = null;
					player.storage.poqun_leshi_used = false;
					player.storage.poqun_leshi_dealt = false;
					player.storage.poqun_leshi_recovered = false;
				},
				sub: true,
				sourceSkill: "poqun_leshi",
			},

			// 手牌上限-1
			limit: {
				skill_id: "poqun_leshi_limit",
				charlotte: true,
				mod: {
					maxHandcard: function (player, num) {
						return num - 1;
					},
				},
				sub: true,
				sourceSkill: "poqun_leshi",
			},

			// 造成伤害追踪
			dtrack: {
				skill_id: "poqun_leshi_dtrack",
				charlotte: true,
				trigger: { source: "damageAfter" },
				forced: true,
				popup: false,
				silent: true,
				filter: function (event, player) {
					return _status.currentPhase === player;
				},
				content: function (event, trigger, player) {
					player.storage.poqun_leshi_dealt = true;
				},
				sub: true,
				sourceSkill: "poqun_leshi",
			},

			// 回复体力追踪
			rtrack: {
				skill_id: "poqun_leshi_rtrack",
				charlotte: true,
				trigger: { player: "recoverAfter" },
				forced: true,
				popup: false,
				silent: true,
				content: function (event, trigger, player) {
					player.storage.poqun_leshi_recovered = true;
				},
				sub: true,
				sourceSkill: "poqun_leshi",
			},

			// 出牌阶段结束时结算（小澈决定是否摸牌）
			settle: {
				skill_id: "poqun_leshi_settle",
				charlotte: true,
				trigger: { player: "phaseUseEnd" },
				forced: true,
				popup: false,
				filter: function (event, player) {
					return (
						player.storage.poqun_leshi_used &&
						player.storage.poqun_leshi_owner &&
						player.storage.poqun_leshi_owner.isAlive()
					);
				},
				content: async function (event, trigger, player) {
					var owner = player.storage.poqun_leshi_owner;

					if (player.storage.poqun_leshi_recovered) {
						var rResult = await owner
							.chooseBool("【乐施】" + get.translation(player) + "于此阶段回复体力，是否摸一张牌？")
							.set("ai", function () {
								return true;
							})
							.forResult();
						if (rResult.bool) {
							await owner.draw();
							game.log("【乐施】", owner, "摸了一张牌（", player, "回复体力）");
						}
					}
					if (player.storage.poqun_leshi_dealt) {
						var dResult = await owner
							.chooseBool("【乐施】" + get.translation(player) + "于此阶段造成伤害，是否摸一张牌？")
							.set("ai", function () {
								return true;
							})
							.forResult();
						if (dResult.bool) {
							await owner.draw();
							game.log("【乐施】", owner, "摸了一张牌（", player, "造成伤害）");
						}
					}

					// 清理标记
					var card = player.storage.poqun_leshi_card;
					if (card) card.removeGaintag("poqun_leshi_tag");

					// 清理
					player.storage.poqun_leshi_card = null;
					player.storage.poqun_leshi_owner = null;
					player.storage.poqun_leshi_used = false;
					player.storage.poqun_leshi_dealt = false;
					player.storage.poqun_leshi_recovered = false;
				},
				sub: true,
				sourceSkill: "poqun_leshi",
			},

			// 技能主人死亡时清理
			die: {
				skill_id: "poqun_leshi_die",
				trigger: { player: "die" },
				forced: true,
				popup: false,
				silent: true,
				content: function (event, trigger, player) {
					game.filterPlayer(function (current) {
						if (current.storage.poqun_leshi_owner === player) {
							var card = current.storage.poqun_leshi_card;
							if (card) card.removeGaintag("poqun_leshi_tag");
							current.removeSkill("poqun_leshi_use");
							current.removeSkill("poqun_leshi_watch");
							current.removeSkill("poqun_leshi_limit");
							current.removeSkill("poqun_leshi_dtrack");
							current.removeSkill("poqun_leshi_rtrack");
							current.removeSkill("poqun_leshi_settle");
							current.storage.poqun_leshi_card = null;
							current.storage.poqun_leshi_owner = null;
							current.storage.poqun_leshi_used = false;
							current.storage.poqun_leshi_dealt = false;
							current.storage.poqun_leshi_recovered = false;
						}
					});
				},
				sub: true,
				sourceSkill: "poqun_leshi",
			},
		},
	},
	poqun_ziyu: {
		skill_id: "poqun_ziyu",
		trigger: {
			player: "damageBegin1",
		},
		forced: false,
		direct: true,
		popup: false,
		filter: function (event, player) {
			return event.card && player.countCards("h") > 0;
		},
		content: async function (event, trigger, player) {
			var xiaoch = game.findPlayer(function (p) {
				return p.hasSkill("poqun_leshi");
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
	poqun_quuan: {
		skill_id: "poqun_quuan",
		forced: true,
		locked: true,
		group: ["poqun_quuan_baiyin", "poqun_quuan_recover"],
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
				skill_id: "poqun_quuan_baiyin",
				equipSkill: true,
				noHidden: true,
				inherit: "baiyin_skill",
				sourceSkill: "poqun_quuan",
				filter: function (event, player) {
					if (!player.hasEmptySlot(2)) return false;
					return true;
				},
			},
			recover: {
				skill_id: "poqun_quuan_recover",
				trigger: { player: "equipAfter" },
				forced: true,
				popup: false,
				filter: function (event, player) {
					if (!event.card || get.subtype(event.card) !== "equip2") return false;
					if (!player.hasSkill("poqun_quuan")) return false;
					return player.isDamaged();
				},
				content: async function (event, trigger, player) {
					await player.recover();
					game.log(player, "【驱暗】白银狮子被替换，回复1点体力");
				},
			},
		},
	},
	poqun_zhuanjie: {
		skill_id: "poqun_zhuanjie",
		trigger: { global: "dieAfter" },
		forced: false,
		direct: true,
		popup: false,
		filter: function (event, player) {
			var round = game.roundNumber;
			return player.storage.poqun_zhuanjie !== round && event.player !== player;
		},
		content: async function (event, trigger, player) {
			var result = await player
				.chooseBool("是否发动【转劫】，将武将替换为" + get.translation(trigger.player) + "？")
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

			// 替换武将
			player.reinit(player.name, trigger.player.name);

			// 补回保留的技能
			player.addSkill("poqun_zhuanjie");
			// 记录发动技能的回合数并且重置其他全部缓存
			player.storage = { poqun_zhuanjie: game.roundNumber };

			// 弃置区域内的全部牌
			var cards = player.getCards("hej");
			if (cards.length) {
				await player.discard(cards);
			}

			// 摸X张牌
			await player.draw(player.maxHp);

			game.log(
				player,
				"发动【转劫】，替换为",
				trigger.player,
				"，弃置所有牌并摸" + player.maxHp + "张牌",
			);
		},
	},
	poqun_qianzong: {
		skill_id: "poqun_qianzong",
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
	poqun_cangfeng: {
		skill_id: "poqun_cangfeng",
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
	poqun_huifeng: {
		skill_id: "poqun_huifeng",
		trigger: { global: "useCardToPlayer" },
		trigger: { player: "damageEnd" },
		forced: false,
		direct: true,
		content: async function (event, trigger, player) {
			var result = await player
				.chooseTarget("【回锋】选择一名其他角色", function (card, player, target) {
					return target !== player && target.isAlive();
				})
				.set("ai", function (target) {
					if (get.attitude(player, target) >= 0) return 0;
					var handCount = target.countCards("h");
					return handCount * get.damageEffect(target, player, player);
				})
				.forResult();

			if (!result.bool) return;

			var target = result.targets[0];

			// 展示手牌
			var handCards = target.getCards("h");
			if (handCards.length) {
				await target.showCards(handCards);
				game.log(target, "的手牌为", handCards);
			}

			// 数杀的数量
			var shaCount = handCards.filter(function (card) {
				return card.name === "sha";
			}).length;

			// 造成伤害
			if (shaCount > 0) {
				game.log(player, "对", target, "造成" + shaCount + "点伤害");
				await target.damage(shaCount, player);
			} else {
				game.log(target, "手牌中没有【杀】");
			}
		},
		ai: {
			threaten: 1,
		},
	},
	poqun_bianlu: {
		skill_id: "poqun_bianlu",
		trigger: { player: "phaseUseEnd" },
		forced: false,
		limited: true,
		group: ["poqun_bianlu_reset", "poqun_bianlu_dtrack"],
		filter: function (event, player) {
			return !player.storage.poqun_bianlu_damaged && player.maxHp > 1;
		},
		check: function (event, player) {
			if (player.maxHp <= 2) return false;
			var enemies = game.filterPlayer(function (current) {
				return current !== player && get.attitude(player, current) < 0;
			});
			return enemies.some(function (current) {
				return !current.countCards("h", { name: "sha" });
			});
		},
		content: async function (event, trigger, player) {
			player.awakenSkill("poqun_bianlu");

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
				skill_id: "poqun_bianlu_reset",
				trigger: { player: "phaseBegin" },
				forced: true,
				popup: false,
				silent: true,
				firstDo: true,
				content: function (event, trigger, player) {
					player.storage.poqun_bianlu_damaged = false;
				},
			},
			dtrack: {
				skill_id: "poqun_bianlu_dtrack",
				trigger: { source: "damageAfter" },
				forced: true,
				popup: false,
				silent: true,
				filter: function (event, player) {
					return _status.currentPhase === player;
				},
				content: function (event, trigger, player) {
					player.storage.poqun_bianlu_damaged = true;
				},
			},
		},
	},
	poqun_daifa: {
		skill_id: "poqun_daifa",
		trigger: { global: "phaseEnd" },
		forced: false,
		group: ["poqun_daifa_dtrack", "poqun_daifa_reset"],
		filter: function (event, player) {
			if (event.player === player) return false;
			if (event.player.isDead()) return false;
			if (!event.player.storage.poqun_daifa_damaged_this_turn) return false;
			var round = game.roundNumber;
			if (player.storage.daifa_round !== round) {
				player.storage.daifa_round = round;
				player.storage.daifa_count = 0;
			}
			var maxUse = player.maxHp - player.hp;
			if (maxUse <= 0) return false;
			if ((player.storage.poqun_daifa_count || 0) >= maxUse) return false;
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

			var juedou = game.createCard("juedou", "none", 0);
			await player.useCard(juedou, [target]);

			game.log(player, "发动【代伐】，弃置一张手牌，对", target, "使用【决斗】");
		},
		subSkill: {
			dtrack: {
				skill_id: "poqun_daifa_dtrack",
				trigger: { global: "damageSource" },
				forced: true,
				popup: false,
				silent: true,
				filter: function (event, player) {
					return _status.currentPhase === event.source;
				},
				content: function (event, trigger, player) {
					trigger.source.storage.poqun_daifa_damaged_this_turn = true;
				},
			},
			reset: {
				skill_id: "poqun_daifa_reset",
				trigger: { global: "phaseBegin" },
				forced: true,
				popup: false,
				silent: true,
				content: function (event, trigger, player) {
					trigger.player.storage.poqun_daifa_damaged_this_turn = false;
				},
			},
		},
	},
	poqun_yucheng: {
		skill_id: "poqun_yucheng",
		trigger: { player: "phaseEnd" },
		forced: false,
		direct: true,
		filter: function (event, player) {
			return game.hasPlayer(function (current) {
				return current !== player && current.countCards("h") > 0;
			});
		},
		content: async function (event, trigger, player) {
			var X = Math.max(player.maxHp - player.hp, 1);

			var result = await player
				.chooseTarget(
					"【予诚】选择至多" + X + "名其他角色（他们可以交给你一张手牌）",
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
						"【予诚】交给" + get.translation(player) + "一张手牌（选牌交出，取消拒绝）",
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

			// 记录本轮给过牌的角色，供下回合权断使用
			player.storage.poqun_yucheng_givers = givers;
		},
	},
	poqun_quanduan: {
		skill_id: "poqun_quanduan",
		trigger: { player: "phaseDrawBegin" },
		forced: false,
		direct: true,
		filter: function (event, player) {
			return player.countCards("h") > 0;
		},
		content: async function (event, trigger, player) {
			// 弃置任意张牌
			var result = await player
				.chooseToDiscard("h", "【权断】弃置任意张牌，多摸等量的牌")
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

			// 读取上回合予诚给过牌的角色
			var givers = player.storage.poqun_yucheng_givers || [];
			player.storage.poqun_yucheng_givers = [];

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
						"【权断】是否将一张弃置的牌交给" + get.translation(giver) + "？",
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
	},
	poqun_quce: {
		skill_id: "poqun_quce",
		zhuSkill: true,
		trigger: { global: "roundStart" },
		forced: false,
		direct: true,
		filter: function (event, player) {
			return player.isAlive();
		},
		content: async function (event, trigger, player) {
			var result = await player
				.chooseTarget("【驱策】指定一名角色（吴势力角色对其使用【杀】可摸一张牌）")
				.set("ai", function (target) {
					if (get.attitude(player, target) < 0) {
						var wuAllies = game.filterPlayer(function (current) {
							return (
								current !== player &&
								current.group === "wu" &&
								current.isAlive() &&
								current.inRange(target)
							);
						});
						return wuAllies.length * 5 + 2;
					}
					return 0;
				})
				.forResult();

			if (!result.bool) return;

			// 移除上一个目标的标记
			var oldTarget = game.findPlayer(function (current) {
				return current.hasSkill("poqun_quce_mark");
			});
			if (oldTarget) {
				oldTarget.removeSkill("poqun_quce_mark");
			}

			// 设置新目标并加标记
			var newTarget = result.targets[0];
			newTarget.addTempSkill("poqun_quce_mark", "roundAfter");

			player.addTempSkill("poqun_quce_sha_bonus", "roundAfter");
			player.addTempSkill("poqun_quce_phase_reset", "roundAfter");
			game.log(player, "发动【驱策】，指定", result.targets[0]);
		},
		subSkill: {
			mark: {
				skill_id: "poqun_quce_mark",
				charlotte: true,
				mark: true,
				marktext: "策",
				intro: {
					content: "被指定为【驱策】的目标",
				},
			},
			sha_bonus: {
				skill_id: "poqun_quce_sha_bonus",
				trigger: { global: "useCard" },
				forced: true,
				popup: false,
				filter: function (event, player) {
					if (!event.card || event.card.name !== "sha") return false;
					var target = game.findPlayer(function (current) {
						return current.hasSkill("poqun_quce_mark");
					});
					if (!target) return false;
					var source = event.player;
					if (source.group !== "wu") return false;
					if (source.isDead()) return false;
					// 目标是指定角色
					if (!event.targets || !event.targets.includes(target)) return false;
					// 出牌阶段限一次
					if (source.storage.poqun_quce_used_this_phase) return false;
					return true;
				},
				content: async function (event, trigger, player) {
					var source = trigger.player;
					source.storage.poqun_quce_used_this_phase = true;
					await source.draw();
					var target = game.findPlayer(function (current) {
						return current.hasSkill("poqun_quce_mark");
					});
					game.log("【驱策】", source, "对", target, "使用【杀】，摸一张牌");
				},
			},
			phase_reset: {
				skill_id: "poqun_quce_phase_reset",
				trigger: { global: "phaseAfter" },
				forced: true,
				popup: false,
				silent: true,
				content: function (event, trigger, player) {
					trigger.player.storage.poqun_quce_used_this_phase = false;
				},
			},
		},
	},
	poqun_yuefeng: {
		skill_id: "poqun_yuefeng",
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
		direct: true,
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
			// 摸1张牌
			await player.draw();

			// 额外回合
			player.addSkill("poqun_lingfeng_sha_bonus");
			await player.phaseUse();
			player.removeSkill("poqun_lingfeng_sha_bonus");
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
	poqun_zhiwei: {
		skill_id: "poqun_zhiwei",
		enable: "phaseUse",
		usable: 1,
		filterCard: function (card, player) {
			var suit = get.suit(card);
			if (suit === "heart" && player.isDamaged()) return true;
			if (suit === "spade") return true;
			return false;
		},
		selectCard: 1,
		position: "h",
		filter: function (event, player) {
			return player.hasCard(function (card) {
				return get.suit(card) === "heart" || get.suit(card) === "spade";
			}, "h");
		},
		check: function (card) {
			var player = _status.event.player;
			if (get.suit(card) === "heart") {
				if (player.isDamaged()) return 10 - get.value(card);
				return 3 - get.value(card);
			}
			return 6 - get.value(card);
		},
		content: async function (event, trigger, player) {
			var card = event.cards[0];
			var suit = get.suit(card);
			if (suit === "heart") {
				var tao = game.createCard("tao", card.suit, card.number);
				await player.useCard(tao, player);
			} else if (suit === "spade") {
				var jiu = game.createCard("jiu", card.suit, card.number);
				await player.useCard(jiu, player);
			}
		},
		ai: {
			order: 5,
			result: { player: 1 },
			tag: { recover: 1, save: 1 },
		},
	},
	poqun_yunchou: {
		skill_id: "poqun_yunchou",
		enable: "phaseUse",
		usable: 1,
		filterCard: true,
		selectCard: 1,
		position: "h",
		discard: false,
		lose: false,
		prepare: function (cards, player) {
			player.$throw(cards, 1000);
		},
		content: async function (event, trigger, player) {
			var card = event.cards[0];

			// 展示手牌并放到牌堆顶
			await player.showCards(card, "【运筹】展示");
			player.loseToDiscardpile(card, ui.cardPile, "visible", "insert").log = false;
			game.log(player, "将", card, "置于牌堆顶");

			await game.delay(0.3);

			while (true) {
				// 展示并获得牌堆底的牌
				var bottomCard = ui.cardPile.lastChild;
				if (!bottomCard) break;

				await player.gain(bottomCard, "draw");
				game.log(player, "获得牌堆底的", bottomCard);

				// 比较花色
				if (get.suit(card) !== get.suit(bottomCard)) {
					game.log(player, "花色不同，停止");
					break;
				}

				game.log(player, "花色相同，摸一张牌并继续");
				await player.draw();

				// 没手牌了不能继续
				if (!player.countCards("h")) {
					game.log(player, "没有手牌，停止");
					break;
				}

				// 选一张手牌继续
				var result = await player
					.chooseCard("h", "【运筹】是否再展示一张手牌置于牌堆顶？（选牌继续，取消停止）")
					.set("ai", function (card) {
						return 4 - get.value(card);
					})
					.forResult();

				if (!result.bool || !result.cards) break;

				card = result.cards[0];
				await player.showCards(card, "【运筹】展示");
				player.lose(card, ui.special);
				ui.cardPile.insertBefore(card, ui.cardPile.firstChild);
				game.log(player, "将", card, "置于牌堆顶");

				await game.delay(0.3);
			}
		},
		ai: {
			order: 4,
			result: { player: 1 },
		},
	},
	poqun_fengchun: {
		skill_id: "poqun_fengchun",
		limited: true,
		trigger: { player: "dying" },
		forced: false,
		check: function (event, player) {
			return player.countCards("h") <= 2;
		},
		content: async function (event, trigger, player) {
			player.awakenSkill("poqun_fengchun");

			// 弃置所有手牌
			var handCards = player.getCards("h");
			if (handCards.length) {
				await player.discard(handCards);
			}

			// 展示牌堆顶两张牌
			var cards = [];
			for (var i = 0; i < 2; i++) {
				var card = get.cardPile(function (c) {
					return !cards.includes(c);
				});
				if (card) cards.push(card);
			}

			if (cards.length) {
				await player.showCards(cards, "【逢春】展示");
			}

			// 数红牌
			var redCount = cards.filter(function (card) {
				return get.color(card) === "red";
			}).length;

			// 回复体力（至少1点）
			var recoverAmount = Math.max(redCount, 1);
			if (player.hp < recoverAmount) {
				await player.recover(recoverAmount - player.hp);
			}
			game.log(player, "回复至" + Math.max(player.hp, recoverAmount) + "点体力");

			// 获得黑色牌
			var blackCards = cards.filter(function (card) {
				return get.color(card) === "black";
			});
			if (blackCards.length) {
				await player.gain(blackCards, "gain2");
				game.log(player, "获得", blackCards);
			}
		},
		ai: { threaten: 0.5 },
	},
	poqun_lanxian: {
		skill_id: "poqun_lanxian",
		group: ["poqun_lanxian_draw"],
		trigger: { global: "phaseZhunbei" },
		forced: false,
		direct: true,
		filter: function (event, player) {
			return event.player !== player && player.countCards("he") > 0;
		},
		content: async function (event, trigger, player) {
			var target = trigger.player;
			var result = await player
				.chooseCard("he", [1, 2], "【揽贤】将至多两张牌置于牌堆顶")
				.set("ai", function (card) {
					return 5 - get.value(card);
				})
				.forResult();

			if (!result.bool || !result.cards || !result.cards.length) return;

			player.logSkill("poqun_lanxian");

			var count = result.cards.length;
			for (var i = 0; i < count; i++) {
				player.loseToDiscardpile(result.cards[i], ui.cardPile, "visible", "insert").log = false;
			}
			game.log(player, "将" + count + "张牌置于牌堆顶");

			if (count === 2) {
				player.storage.poqun_lanxian_target = target;
			}
		},
		subSkill: {
			draw: {
				skill_id: "poqun_lanxian_draw",
				trigger: { global: "phaseAfter" },
				forced: true,
				popup: false,
				filter: function (event, player) {
					return (
						player.storage.poqun_lanxian_target &&
						event.player === player.storage.poqun_lanxian_target
					);
				},
				content: async function (event, trigger, player) {
					var target = player.storage.poqun_lanxian_target;
					player.storage.poqun_lanxian_target = null;
					await player.draw();
					await target.draw();
					game.log(player, "和", target, "各摸一张牌");
				},
				sub: true,
				sourceSkill: "poqun_lanxian",
			},
		},
	},
	poqun_juyi: {
		skill_id: "poqun_juyi",
		enable: "phaseUse",
		group: ["poqun_juyi_reset"],
		filter: function (event, player) {
			var noCard =
				player.storage.poqun_shengwei_mods && player.storage.poqun_shengwei_mods.includes(2);
			if (!noCard && !player.countCards("he")) return false;

			var declared = player.storage.poqun_juyi_declared || [];
			var allowBasic =
				player.storage.poqun_shengwei_mods && player.storage.poqun_shengwei_mods.includes(3);
			for (var i = 0; i < lib.inpile.length; i++) {
				var name = lib.inpile[i];
				if (declared.includes(name)) continue;
				var type = get.type(name);
				if (type === "trick" && get.subtype(name) !== "delay") {
					var info = lib.card[name];
					if (
						info &&
						info.selectTarget !== -1 &&
						!info.notarget &&
						(!info.selectTarget || info.selectTarget === 1)
					) {
						return true;
					}
				}
				if (allowBasic && type === "basic" && name !== "shan") return true;
			}
			return false;
		},
		content: async function (event, trigger, player) {
			var noCard =
				player.storage.poqun_shengwei_mods && player.storage.poqun_shengwei_mods.includes(2);

			// 声威升级2未生效时，需要弃置一张手牌
			if (!noCard) {
				var cardResult = await player
					.chooseCard("he", "【聚义】弃置一张牌", true)
					.set("ai", function (card) {
						return 4 - get.value(card);
					})
					.forResult();

				if (!cardResult.bool) return;
				await player.discard(cardResult.cards);
				game.log(player, "弃置了一张牌");
			}

			var declared = player.storage.poqun_juyi_declared || [];
			var allowBasic =
				player.storage.poqun_shengwei_mods && player.storage.poqun_shengwei_mods.includes(3);
			var list = [];

			for (var i = 0; i < lib.inpile.length; i++) {
				var name = lib.inpile[i];
				if (declared.includes(name)) continue;
				var type = get.type(name);
				if (type === "trick" && get.subtype(name) !== "delay") {
					var info = lib.card[name];
					if (
						info &&
						info.selectTarget !== -1 &&
						!info.notarget &&
						(!info.selectTarget || info.selectTarget === 1)
					) {
						list.push(["锦囊", "", name]);
					}
				}
				if (allowBasic && type === "basic" && name !== "shan") {
					list.push(["基本", "", name]);
				}
			}

			if (!list.length) return;

			var result = await player
				.chooseButton(["【聚义】声明一张牌名", [list, "vcard"]], true)
				.set("ai", function (button) {
					var name = button.link[2];
					if (name === "guohe" || name === "shunshou") return 5;
					if (name === "huogong") return 3;
					if (name === "sha") return 2;
					if (name === "tao" || name === "jiu") return 1;
					return 0.5;
				})
				.forResult();

			if (!result.bool) return;

			var cardName = result.links[0][2];

			if (!player.storage.poqun_juyi_declared) player.storage.poqun_juyi_declared = [];
			player.storage.poqun_juyi_declared.push(cardName);

			game.log(player, "声明了【" + get.translation(cardName) + "】");

			var responders = 0;
			var nonResponders = 0;
			var otherPlayers = game.filterPlayer(function (current) {
				return current !== player && current.isAlive();
			});

			for (var i = 0; i < otherPlayers.length; i++) {
				var current = otherPlayers[i];
				var response = await current
					.chooseBool(
						"【聚义】是否响应" +
							get.translation(player) +
							"声明的【" +
							get.translation(cardName) +
							"】？",
					)
					.set("ai", function () {
						return get.attitude(current, player) > 0;
					})
					.forResult();

				if (response.bool) {
					responders++;
					current.popup("响应");
					game.log(current, "响应了【聚义】");
				} else {
					nonResponders++;
					current.popup("拒绝");
					game.log(current, "未响应【聚义】");
				}
			}

			var condition;
			if (player.storage.poqun_shengwei_mods && player.storage.poqun_shengwei_mods.includes(1)) {
				var shuCount = game.filterPlayer(function (current) {
					return current.group === "shu" && current.isAlive();
				}).length;
				condition = responders + shuCount > nonResponders;
			} else {
				condition = responders >= nonResponders;
			}

			if (condition) {
				game.log("【聚义】响应成功！");
				await player.chooseUseTarget({ name: cardName, isCard: true }, true, false);
			} else {
				game.log("【聚义】响应失败");
				await player.draw();
				game.log(player, "摸了一张牌");
			}
		},
		subSkill: {
			reset: {
				skill_id: "poqun_juyi_reset",
				trigger: { player: "phaseUseBegin" },
				forced: true,
				popup: false,
				silent: true,
				content: function (event, trigger, player) {
					player.storage.poqun_juyi_declared = [];
				},
				sub: true,
				sourceSkill: "poqun_juyi",
			},
		},
		ai: {
			order: 6,
			result: { player: 1 },
		},
	},
	poqun_shengwei: {
		skill_id: "poqun_shengwei",
		zhuSkill: true,
		trigger: { player: "phaseZhunbei" },
		forced: false,
		direct: true,
		filter: function (event, player) {
			return !player.storage.poqun_shengwei_mods || player.storage.poqun_shengwei_mods.length < 3;
		},
		content: async function (event, trigger, player) {
			if (!player.storage.poqun_shengwei_mods) player.storage.poqun_shengwei_mods = [];

			var choiceList = [];
			var mods = [];

			if (!player.storage.poqun_shengwei_mods.includes(1)) {
				choiceList.push("响应人数+蜀势力数 > 未响应数");
				mods.push(1);
			}
			if (!player.storage.poqun_shengwei_mods.includes(2)) {
				choiceList.push("删除弃置一张牌");
				mods.push(2);
			}
			if (!player.storage.poqun_shengwei_mods.includes(3)) {
				choiceList.push("可声明基本牌（除闪外）");
				mods.push(3);
			}

			choiceList.push("不修改");

			var result = await player
				.chooseControl()
				.set("choiceList", choiceList)
				.set("prompt", "【声威】选择一项修改【聚义】")
				.set("ai", function () {
					if (mods.includes(2)) return mods.indexOf(2);
					if (mods.includes(1)) return mods.indexOf(1);
					return choiceList.length - 1;
				})
				.forResult();

			if (result.index >= mods.length) return;

			player.logSkill("poqun_shengwei");

			var mod = mods[result.index];
			player.storage.poqun_shengwei_mods.push(mod);
			game.log(player, "【声威】升级了【聚义】");
		},
		ai: {
			threaten: 1.5,
		},
	},
	poqun_guangyin: {
		skill_id: "poqun_guangyin",
		forced: false,
		group: ["poqun_guangyin_judge", "poqun_guangyin_discard"],
		subSkill: {
			// 判定时可选（非锁定技）
			judge: {
				skill_id: "poqun_guangyin_judge",
				trigger: { global: "judge" },
				forced: false,
				direct: true,
				filter: function (event, player) {
					return ui.cardPile && ui.cardPile.childNodes.length >= 2;
				},
				content: async function (event, trigger, player) {
					var target = trigger.player;

					// 先问古乐是否发动
					var result = await player
						.chooseBool("是否发动【光引】让" + get.translation(target) + "观看牌堆底两张牌？")
						.set("ai", function () {
							var att = get.attitude(player, target);
							if (att <= 0) return false;
							return true;
						})
						.forResult();

					if (!result.bool) return;

					player.logSkill("poqun_guangyin_judge");

					var pile = ui.cardPile;
					var bottomCards = [
						pile.childNodes[pile.childNodes.length - 2],
						pile.childNodes[pile.childNodes.length - 1],
					];

					// 让判定者选择
					var chooseResult = await target
						.chooseButton(["【光引】选择一张作为判定牌", bottomCards], true)
						.set("ai", function (button) {
							// 用 judge 函数评估，返回值对判定者有利
							return trigger.judge(button.link);
						})
						.forResult();

					if (!chooseResult.bool || !chooseResult.links) return;

					var chosen = chooseResult.links[0];

					if (trigger.player.judging[0].clone) {
						trigger.player.judging[0].clone.classList.remove("thrownhighlight");
						game.broadcast(function (card) {
							if (card.clone) {
								card.clone.classList.remove("thrownhighlight");
							}
						}, trigger.player.judging[0]);
						game.addVideo("deletenode", player, get.cardsInfo([trigger.player.judging[0].clone]));
					}

					// 丢弃旧判定牌
					game.cardsDiscard(trigger.player.judging[0]);

					// 新判定牌从牌堆底移除
					if (chosen.parentNode) {
						chosen.parentNode.removeChild(chosen);
					}

					// 展示新判定牌（关键：加上视觉效果）
					target.$throw(chosen);

					// 替换判定牌
					trigger.player.judging[0] = chosen;
					trigger.orderingCards.add(chosen);

					game.log(target, "的判定牌改为", chosen);
					await game.delay(2);
				},
				sub: true,
				sourceSkill: "poqun_guangyin",
			},
			// 弃牌进牌堆底（锁定技）
			discard: {
				skill_id: "poqun_guangyin_discard",
				trigger: { player: "loseAfter" },
				forced: true,
				locked: true,
				popup: false,
				filter: function (event, player) {
					return event.type === "discard";
				},
				content: async function (event, trigger, player) {
					var cards = trigger.cards.filter(function (card) {
						return card.parentNode === ui.discardPile;
					});
					if (!cards.length) return;

					if (cards.length > 1) {
						var next = player
							.chooseToMove("【光引】将弃置的牌以任意顺序置于牌堆底")
							.set("list", [["牌堆底", cards]])
							.set("processAI", function (list) {
								var cards = list[0][1].slice();

								// 分析当前局面
								// 1. 队友即将被判定（乐/兵/闪电）
								var pendingJudge = null;
								var judgeCards = [];
								game.filterPlayer(function (current) {
									if (get.attitude(player, current) <= 0) return false;
									var judges = current.getCards("j");
									for (var i = 0; i < judges.length; i++) {
										var name = judges[i].name;
										if (name === "lebu" || name === "bingliang" || name === "shandian") {
											judgeCards.push({ name: name, target: current });
										}
									}
								});

								// 2. 手牌中的点数（用于激斗联动）
								var handNumbers = {};
								var handCards = player.getCards("h");
								for (var i = 0; i < handCards.length; i++) {
									var num = get.number(handCards[i]);
									if (num) {
										handNumbers[num] = (handNumbers[num] || 0) + 1;
									}
								}

								cards.sort(function (a, b) {
									var scoreA = 0;
									var scoreB = 0;

									// === 判定联动（放最后=牌堆底=判定用） ===
									// 乐不思蜀需要♥
									for (var i = 0; i < judgeCards.length; i++) {
										var jc = judgeCards[i];
										if (jc.name === "lebu") {
											if (get.suit(a) === "heart") scoreA += 50;
											if (get.suit(b) === "heart") scoreB += 50;
										}
										if (jc.name === "bingliang") {
											if (get.suit(a) === "club") scoreA += 50;
											if (get.suit(b) === "club") scoreB += 50;
										}
										if (jc.name === "shandian") {
											if (get.suit(a) === "spade" && get.number(a) >= 2 && get.number(a) <= 9)
												scoreA -= 50;
											if (get.suit(b) === "spade" && get.number(b) >= 2 && get.number(b) <= 9)
												scoreB -= 50;
										}
									}

									// === 激斗联动（同点数放最后=牌堆底=判定用=激斗获得） ===
									var numA = get.number(a);
									var numB = get.number(b);
									if (numA && handNumbers[numA]) scoreA += handNumbers[numA] * 15;
									if (numB && handNumbers[numB]) scoreB += handNumbers[numB] * 15;

									// === 通用排序（高价值放前面=靠近牌堆顶=更容易被摸到） ===
									scoreA -= get.value(a) * 0.5;
									scoreB -= get.value(b) * 0.5;

									// score 高的放后面（牌堆底）
									return scoreA - scoreB;
								});

								return [cards];
							});
						var result = await next.forResult();
						if (result.bool) {
							cards = result.moved[0];
						}
					}

					for (var i = 0; i < cards.length; i++) {
						ui.cardPile.appendChild(cards[i]);
					}
					game.log(player, "将弃置的牌以指定顺序置于牌堆底");
				},
				sub: true,
				sourceSkill: "poqun_guangyin",
			},
		},
	},
	poqun_jidou: {
		skill_id: "poqun_jidou",
		trigger: { global: "useCardToTargeted" },
		forced: false,
		direct: true,
		filter: function (event, player) {
			return event.card && event.card.name === "juedou" && event.target && event.player;
		},
		content: async function (event, trigger, player) {
			var source = trigger.player;
			var target = trigger.target;

			var chooseResult = await player
				.chooseTarget("【激斗】令一名角色进行判定", function (card, player, t) {
					return t === source || t === target;
				})
				.set("ai", function (t) {
					return get.attitude(player, t);
				})
				.forResult();

			if (!chooseResult.bool) return;

			player.logSkill("poqun_jidou");

			var chosen = chooseResult.targets[0];

			var judgeEvent = chosen.judge();
			judgeEvent.judging2 = true;
			await judgeEvent;

			var judgeCard = judgeEvent.result.card;
			if (!judgeCard) return;

			await chosen.gain(judgeCard, "gain2");
			game.log(chosen, "获得了判定牌", judgeCard);

			var judgeNumber = get.number(judgeCard);
			if (judgeNumber) {
				chosen.storage.poqun_jidou_number = judgeNumber;
				chosen.storage.poqun_jidou_duel = trigger.getParent();
				chosen.addTempSkill("poqun_jidou_sha");
				game.log("【激斗】", chosen, "手中点数为" + judgeNumber + "的牌视为【杀】");
			}
		},
		subSkill: {
			sha: {
				skill_id: "poqun_jidou_sha",
				charlotte: true,
				mod: {
					cardname: function (card, player) {
						if (
							player.storage.poqun_jidou_number &&
							get.number(card) === player.storage.poqun_jidou_number
						) {
							return "sha";
						}
					},
				},
				trigger: { global: "useCardAfter" },
				forced: true,
				popup: false,
				silent: true,
				filter: function (event, player) {
					return event === player.storage.poqun_jidou_duel;
				},
				content: function (event, trigger, player) {
					player.removeSkill("poqun_jidou_sha");
					player.storage.poqun_jidou_number = null;
					player.storage.poqun_jidou_duel = null;
				},
				mark: true,
				marktext: "斗",
				intro: {
					content: function (storage, player) {
						return "手牌中点数为" + player.storage.poqun_jidou_number + "的牌视为【杀】";
					},
				},
				sub: true,
				sourceSkill: "poqun_jidou",
			},
		},
		ai: {
			threaten: 1.2,
		},
	},
	poqun_zhechong: {
		skill_id: "poqun_zhechong",
		trigger: { target: "useCardToTargeted" },
		forced: false,
		filter: function (event, player) {
			if (!event.card || event.card.name !== "sha") return false;
			if (player.hasSkill("poqun_zhechong_cd")) return false;
			return true;
		},
		check: function (event, player) {
			var source = event.player;
			var shaInHand = player.countCards("h", { name: "sha" });
			var enemySha = source.countCards("h", { name: "sha" });
			if (get.attitude(player, source) >= 0) return false;
			return shaInHand >= enemySha;
		},
		content: async function (event, trigger, player) {
			player.addTempSkill("poqun_zhechong_cd", "roundAfter");

			var idx = trigger.targets.indexOf(player);
			if (idx !== -1) {
				trigger.targets.splice(idx, 1);
			}

			await trigger.player.useCard(game.createCard("juedou", "none", 0), [player]);

			game.log(player, "发动【折冲】，将", trigger.card, "转换为【决斗】");
		},
		subSkill: {
			cd: {
				skill_id: "poqun_zhechong_cd",
				charlotte: true,
				mark: true,
				marktext: "折",
				intro: { content: "本回合已发动【折冲】" },
				sub: true,
				sourceSkill: "poqun_zhechong",
			},
		},
	},
	poqun_yiyu: {
		skill_id: "poqun_yiyu",
		enable: "phaseUse",
		usable: 1,
		group: ["poqun_yiyu_reset", "poqun_yiyu_die"],
		filter: function (event, player) {
			return game.hasPlayer(function (current) {
				return current !== player && current.isAlive();
			});
		},
		content: async function (event, trigger, player) {
			// 1. 直接看牌堆顶一张牌（不取出来）
			var topCard = ui.cardPile.firstChild;
			if (!topCard) return;

			player.viewCards("【疑谕】牌堆顶的牌", [topCard]);

			var realSuit = get.suit(topCard);
			var realNumber = get.number(topCard);

			// 2. 声明花色
			var reverseSuitMap = { "♠": "spade", "♥": "heart", "♣": "club", "♦": "diamond" };
			var suitDisplay = ["♠", "♥", "♣", "♦"];
			var suitMap = { spade: "♠", heart: "♥", club: "♣", diamond: "♦" };

			var suitResult = await player
				.chooseControl(suitDisplay)
				.set("prompt", "【疑谕】声明花色")
				.set("ai", function () {
					return suitMap[realSuit];
				})
				.forResult();

			var declaredSuit = reverseSuitMap[suitResult.control];

			// 3. 声明点数
			var numberNames = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
			var numberMap = {};
			for (var i = 0; i < 13; i++) {
				numberMap[numberNames[i]] = i + 1;
			}

			var numberResult = await player
				.chooseControl(numberNames)
				.set("prompt", "【疑谕】声明点数")
				.set("ai", function () {
					return numberNames[realNumber - 1];
				})
				.forResult();

			var declaredNumber = numberMap[numberResult.control];

			game.log(player, "声明：" + (suitMap[declaredSuit] || declaredSuit) + declaredNumber);

			// 4. 其他角色依次质疑
			var doubters = [];
			var others = game.filterPlayer(function (current) {
				return current !== player && current.isAlive();
			});

			for (var i = 0; i < others.length; i++) {
				var current = others[i];
				var doubtResult = await current
					.chooseBool(
						"【疑谕】是否质疑" +
							get.translation(player) +
							"的声明？（" +
							(suitMap[declaredSuit] || declaredSuit) +
							declaredNumber +
							"）",
					)
					.set("ai", function () {
						var att = get.attitude(current, player);
						// 队友不质疑
						if (att >= 0) return false;
						// 敌人：手牌中匹配声明的越多，越想质疑避免被禁
						var myHand = current.getCards("h");
						var matchCount = 0;
						for (var j = 0; j < myHand.length; j++) {
							if (
								get.suit(myHand[j]) === declaredSuit ||
								get.number(myHand[j]) === declaredNumber
							) {
								matchCount++;
							}
						}
						return matchCount >= 2;
					})
					.forResult();

				if (doubtResult.bool) {
					doubters.push(current);
					current.popup("质疑");
					game.log(current, "选择质疑");
				} else {
					current.popup("不质疑");
					game.log(current, "选择不质疑");
				}
			}

			// 5. 展示该牌
			await player.showCards(topCard, "【疑谕】展示");

			var isCorrect = declaredSuit === realSuit && declaredNumber === realNumber;

			var gotWang = false;

			// 6. 结算结果
			if (doubters.length === 0) {
				game.log("无人质疑");
				await player.draw();
				player.addSkill("poqun_wangfu_mark");
				player.storage.poqun_wangfu_suit = declaredSuit;
				player.storage.poqun_wangfu_number = declaredNumber;
				game.log(player, "获得“罔”");
				gotWang = true;
			} else if (isCorrect) {
				game.log("声明正确，质疑者获得“罔”");
				for (var i = 0; i < doubters.length; i++) {
					doubters[i].addSkill("poqun_wangfu_mark");
					doubters[i].storage.poqun_wangfu_suit = declaredSuit;
					doubters[i].storage.poqun_wangfu_number = declaredNumber;
				}
				gotWang = true;
			} else {
				game.log("声明错误，质疑者摸牌");
				for (var i = 0; i < doubters.length; i++) {
					await doubters[i].draw();
				}
			}

			if (gotWang) {
				await player.draw();
				game.log(player, '因"罔"摸了一张牌');
			}
		},
		subSkill: {
			// 准备阶段清除所有"罔"
			reset: {
				skill_id: "poqun_yiyu_reset",
				trigger: { player: "phaseZhunbei" },
				forced: true,
				locked: true,
				content: function (event, trigger, player) {
					var cleared = false;
					game.filterPlayer(function (current) {
						if (current.hasSkill("poqun_wangfu_mark")) {
							current.removeSkill("poqun_wangfu_mark");
							current.storage.poqun_wangfu_suit = null;
							current.storage.poqun_wangfu_number = null;
							cleared = true;
						}
					});
					if (cleared) {
						game.log(player, '重置了所有角色的"罔"');
					}
				},
				sub: true,
				sourceSkill: "poqun_yiyu",
			},
			// 阵亡时清除所有"罔"
			die: {
				skill_id: "poqun_yiyu_die",
				trigger: { player: "die" },
				forced: true,
				popup: false,
				silent: true,
				content: function (event, trigger, player) {
					game.filterPlayer(function (current) {
						if (current.hasSkill("poqun_wangfu_mark")) {
							current.removeSkill("poqun_wangfu_mark");
							current.storage.poqun_wangfu_suit = null;
							current.storage.poqun_wangfu_number = null;
						}
					});
				},
				sub: true,
				sourceSkill: "poqun_yiyu",
			},
		},
		ai: {
			order: 5,
			result: { player: 1 },
		},
	},
	poqun_wangfu: {
		skill_id: "poqun_wangfu",
		subSkill: {
			mark: {
				skill_id: "poqun_wangfu_mark",
				charlotte: true,
				mark: true,
				marktext: "罔",
				intro: {
					content: function (storage, player) {
						var suit = player.storage.poqun_wangfu_suit;
						var number = player.storage.poqun_wangfu_number;
						if (!suit && !number) return "无限制";
						var suitMap = { spade: "♠", heart: "♥", club: "♣", diamond: "♦" };
						var parts = [];
						if (suit) parts.push(suitMap[suit] || suit);
						if (number) parts.push("点数" + number);
						return "不能使用或打出" + parts.join("或") + "的牌";
					},
				},
				mod: {
					cardEnabled: function (card, player) {
						if (
							player.storage.poqun_wangfu_suit &&
							get.suit(card) === player.storage.poqun_wangfu_suit
						)
							return false;
						if (
							player.storage.poqun_wangfu_number &&
							get.number(card) === player.storage.poqun_wangfu_number
						)
							return false;
					},
					cardRespondable: function (card, player) {
						if (
							player.storage.poqun_wangfu_suit &&
							get.suit(card) === player.storage.poqun_wangfu_suit
						)
							return false;
						if (
							player.storage.poqun_wangfu_number &&
							get.number(card) === player.storage.poqun_wangfu_number
						)
							return false;
					},
					cardSavable: function (card, player) {
						if (
							player.storage.poqun_wangfu_suit &&
							get.suit(card) === player.storage.poqun_wangfu_suit
						)
							return false;
						if (
							player.storage.poqun_wangfu_number &&
							get.number(card) === player.storage.poqun_wangfu_number
						)
							return false;
					},
				},
				sub: true,
				sourceSkill: "poqun_wangfu",
			},
		},
	},
	poqun_jihe: {
		skill_id: "poqun_jihe",
		trigger: { global: "phaseDiscardEnd" },
		forced: false,
		filter: function (event, player) {
			if (event.player === player) return false;
			if (!player.countCards("h")) return false;
			var myNumbers = {};
			player.getCards("he").forEach(function (card) {
				myNumbers[get.number(card)] = true;
			});
			return event.player.hasHistory("lose", function (evt) {
				if (evt.type !== "discard") return false;
				return evt.cards.some(function (card) {
					return card.parentNode === ui.discardPile && myNumbers[get.number(card)];
				});
			});
		},
		content: async function (event, trigger, player) {
			// 展示所有手牌
			var handCards = player.getCards("h");
			if (handCards.length) {
				await player.showCards(handCards, "【稽核】展示手牌");
			}

			// 获取弃置的牌中点数匹配的
			var myNumbers = {};
			player.getCards("he").forEach(function (card) {
				myNumbers[get.number(card)] = true;
			});

			var validCards = [];
			trigger.player.getHistory("lose", function (evt) {
				if (evt.type === "discard") {
					for (var i = 0; i < evt.cards.length; i++) {
						var card = evt.cards[i];
						if (card.parentNode === ui.discardPile && myNumbers[get.number(card)]) {
							validCards.push(card);
						}
					}
				}
			});

			if (!validCards.length) return;

			var gainResult = await player
				.chooseButton(["【稽核】获得一张点数相同的牌", validCards], true)
				.set("ai", function (button) {
					return get.value(button.link);
				})
				.forResult();

			if (gainResult.bool && gainResult.links) {
				await player.gain(gainResult.links[0], "gain2");
				game.log(player, "获得了", gainResult.links[0]);
			}
		},
		ai: {
			threaten: 1,
		},
	},
	poqun_chengyi: {
		skill_id: "poqun_chengyi",
		zhuSkill: true,
		marktext: "继",
		group: ["poqun_chengyi_gain", "poqun_chengyi_activate"],
		intro: {
			content: function (storage, player) {
				var skills = player.storage.poqun_chengyi_skills || [];
				if (!skills.length) return "未获得任何技能";
				return (
					"已获得：" +
					skills
						.map(function (s) {
							return get.translation(s);
						})
						.join("、")
				);
			},
		},
		subSkill: {
			// 蜀势力阵亡时获取技能
			gain: {
				skill_id: "poqun_chengyi_gain",
				trigger: { global: "die" },
				forced: false,
				direct: true,
				filter: function (event, player) {
					return event.player.group === "shu" && event.player !== player && player.isAlive();
				},
				content: async function (event, trigger, player) {
					var target = trigger.player;

					// 获取该角色可转移的技能（排除限定技和隐匿技）
					var skills = target.getStockSkills(true, true).filter(function (skill) {
						var info = lib.skill[skill];
						if (!info) return false;
						if (info.limited) return false;
						if (info.charlotte) return false;
						return true;
					});

					if (!skills.length) return;

					// 让阵亡角色选择
					var result = await target
						.chooseControl()
						.set(
							"choiceList",
							skills.map(function (s) {
								return "【" + get.translation(s) + "】";
							}),
						)
						.set("prompt", "选择一个技能令" + get.translation(player) + "获得")
						.set("ai", function () {
							var att = get.attitude(target, player);

							if (att > 0) {
								for (var i = 0; i < skills.length; i++) {
									if (lib.skill[skills[i]] && lib.skill[skills[i]].enable) return i;
								}
								for (var i = 0; i < skills.length; i++) {
									if (lib.skill[skills[i]] && lib.skill[skills[i]].trigger) return i;
								}
								return 0;
							}

							var badSkills = [];
							for (var i = 0; i < skills.length; i++) {
								var info = lib.skill[skills[i]];
								if (!info || (!info.enable && !info.trigger)) {
									badSkills.push(i);
								}
							}
							if (badSkills.length) return badSkills[0];

							return skills.length - 1;
						})
						.forResult();

					if (result.index !== undefined && result.index < skills.length) {
						var chosenSkill = skills[result.index];
						if (!player.storage.poqun_chengyi_skills) {
							player.storage.poqun_chengyi_skills = [];
						}
						if (!player.storage.poqun_chengyi_skills.includes(chosenSkill)) {
							player.storage.poqun_chengyi_skills.push(chosenSkill);
						}
						player.markSkill("poqun_chengyi");
						game.log(target, "将【" + get.translation(chosenSkill) + "】交给", player);
					}
				},
				sub: true,
				sourceSkill: "poqun_chengyi",
			},
			// 准备阶段选择一个承遗技能激活
			activate: {
				skill_id: "poqun_chengyi_activate",
				trigger: { player: "phaseZhunbei" },
				forced: false,
				direct: true,
				filter: function (event, player) {
					return (
						player.storage.poqun_chengyi_skills && player.storage.poqun_chengyi_skills.length > 0
					);
				},
				content: async function (event, trigger, player) {
					var skills = player.storage.poqun_chengyi_skills;

					var choiceList = skills.map(function (s) {
						return "使用【" + get.translation(s) + "】";
					});
					choiceList.push("取消");

					var result = await player
						.chooseControl()
						.set("choiceList", choiceList)
						.set("prompt", "【承遗】选择一个技能于本回合使用")
						.set("ai", function () {
							for (var i = 0; i < skills.length; i++) {
								if (lib.skill[skills[i]] && lib.skill[skills[i]].enable) return i;
							}
							return choiceList.length - 1;
						})
						.forResult();

					if (result.index >= skills.length) return;

					var chosenSkill = skills[result.index];
					player.addTempSkill(chosenSkill, { player: "phaseAfter" });
					player.logSkill("poqun_jicheng_activate");
					game.log(player, "本回合获得技能【" + get.translation(chosenSkill) + "】");
				},
				sub: true,
				sourceSkill: "poqun_chengyi",
			},
		},
	},
};

export default skills;
