import * as mc from "@minecraft/server";

const LORE=new Map([
["lb:common_fragment",["§7[재료] 일반 럭키 조각","§f6개 → 일반 럭키 블럭","§8CC0 외부 크리스탈 외형"]],
["lb:rare_fragment",["§b[재료] 희귀 럭키 조각","§f6개 → 희귀 럭키 블럭"]],
["lb:epic_fragment",["§d[재료] 에픽 럭키 조각","§f6개 → 에픽 럭키 블럭"]],
["lb:legendary_fragment",["§6[재료] 전설 럭키 조각","§f6개 → 전설 럭키 블럭"]],
["lb:mythic_fragment",["§5[재료] 신화 럭키 조각","§f6개 → 신화 럭키 블럭"]],
["lb:common_lucky_block",["§e[럭키 블럭] 설치 후 우클릭","§7일반 보상·소품·재료"]],
["lb:rare_lucky_block",["§b[럭키 블럭] 설치 후 우클릭","§7도구·동료·미니 이벤트"]],
["lb:epic_lucky_block",["§d[럭키 블럭] 설치 후 우클릭","§7고급 장비·탈것·구조 이벤트"]],
["lb:legendary_lucky_block",["§6[럭키 블럭] 설치 후 우클릭","§c후반 전투 콘텐츠 포함"]],
["lb:mythic_lucky_block",["§5[신화 럭키 블럭] 설치 후 우클릭","§c보스·던전·월드 이벤트"]],
["lb:slasher",["§c[전설/후반] Slasher","§f근접: 기본 32 + 추가 20 피해","§f타격 시 3연 빔","§f사용 유지 후 놓기: 충전 빔","§7재사용 1.8초 / Slasher Blade로 수리"]],
["lb:slasher_blade",["§7[수리 재료] Slasher Blade","§f모루에서 Slasher 내구도 +320"]],
["lb:tomemancy_mystical_helmet",["§d[Mystical Aegis] 방어 4","§f4세트: Absorption II 수호막","§7전투 이탈 후 약 10초마다 충전"]],
["lb:tomemancy_mystical_chestplate",["§d[Mystical Aegis] 방어 8","§f4세트: Absorption II 수호막","§7전투 이탈 후 약 10초마다 충전"]],
["lb:tomemancy_mystical_leggings",["§d[Mystical Aegis] 방어 6","§f4세트: Absorption II 수호막","§7전투 이탈 후 약 10초마다 충전"]],
["lb:tomemancy_mystical_boots",["§d[Mystical Aegis] 방어 4","§f4세트: Absorption II 수호막","§7전투 이탈 후 약 10초마다 충전"]],
["lb:explorer_hat",["§6[Explorer] 방어 3","§f2세트: 야간 투시 + 신속 I","§f아군 세트 12m: 성급함 I"]],
["lb:explorer_pack",["§6[Explorer] 방어 7","§f2세트: 야간 투시 + 신속 I","§f아군 세트 12m: 성급함 I"]],
["lb:wizard_hat",["§5[Arcane Focus] 방어 4","§fTomemancy 위력 +15%","§fTomemancy 쿨다운 -15%"]],
["lb:threat_sunglasses",["§b[Threat Lens] 방어 2","§f야간 투시 / 실명·어둠 해제","§f24m 적 수·최근접 거리 표시"]],
["lb:storm_longbow",["§b[Storm Longbow]","§f당김 피해 8 / 14 / 20 / 26","§f완전 당김: 관통 최대 2","§7화살 소모"]],
["lb:amethyst_repeater",["§5[Amethyst Repeater]","§f사용: 3연사 × 12 마법 피해","§7Amethyst Charge 3개 필요·소모"]],
["lb:amethyst_charge",["§d[탄약] Amethyst Charge","§fAmethyst Repeater 1발당 1개","§7한 번의 3연사에 3개 필요"]],
["lb:gallery_slug",["§b[이벤트 탄약] Gallery Slug","§fFortune Gallery 표적 사격 전용","§7이벤트 종료·이탈 시 자동 회수"]],
["lb:javelin",["§6[Javelin]","§f충전 투척: 8~18 피해","§f웅크려 박힌 창 회수","§f박힌 창 위 연속 바운스"]],
["lb:spike_drill",["§6[Spike Drill]","§f사용 유지: 채굴 가속","§f열 120: 과열 / 2초 잠금","§f웅크림+보조손 눈덩이: 열 -30"]],
["lb:fortune_tonic",["§b[Fortune Tonic]","§f흡수 I 60초 / 저항 I 8초","§f재생 I 4초"]],
["lb:flashbang",["§d[Flashbang]","§f투척: 실명·감속·약화","§7PvP OFF 시 다른 플레이어 보호"]],
["lb:smoke_grenade",["§7[Smoke Grenade]","§f연막 내 플레이어 은신","§f적 실명 + 감속"]],
["lb:lucky_guitar",["§6[Lucky Guitar]","§f사용: 10m 아군 재생 + 신속","§715초 재사용"]],
["lb:tomemancy_diamond_staff",["§b[Diamond Staff Focus]","§f근접 공격력 38","§f보조손 장착: Tomemancy 위력 +20%","§fWizard Hat과 곱연산으로 중첩"]],
["lb:tomemancy_meteor_tome",["§c[Meteor Tome]","§f후반 주문: 대형 낙하 폭발","§7Wizard Hat/Staff로 강화"]],
["lb:tomemancy_gigavolt_tome",["§e[Gigavolt Tome]","§f후반 주문: 최대 4연쇄 번개","§7Wizard Hat/Staff로 강화"]],
["lb:tomemancy_dragon_fireball_tome",["§d[Dragon Fireball Tome]","§f후반 주문: 드래곤 화염탄","§7Wizard Hat/Staff로 강화"]],
["lb:reward_burger",["§6[Lucky Burger]","§f설치 후 사용: 포만 + 재생","§7사용 시 블록 소모"]],
["lb:reward_noodles",["§6[Lucky Noodles]","§f설치 후 사용: 포만 + 재생 + 신속","§7사용 시 블록 소모"]],
["lb:reward_plunger",["§b[Lucky Plunger]","§f설치 후 사용: 바라보는 방향으로 도약","§7재사용 가능한 이동 도구"]],
["lb:reward_backpack",["§6[Lucky Backpack]","§f사용: 일반 조각 4~8개","§f55% 희귀 1~2 / 10% 에픽 1","§7사용 시 블록 소모"]],
["lb:reward_snow_globe",["§b[Snow Globe]","§f반경 8블럭 감속 II + 눈덩이 8개","§7PvP OFF 시 다른 플레이어 보호"]],
["lb:reward_vending_machine",["§6[Lucky Vending Machine]","§f총 3회 음식 지급","§fBurger 또는 Noodles","§7마지막 사용 후 소모"]],
["lb:reward_moai",["§7[Lucky Moai]","§f저항 II 15초","§7대가: 감속 I 4초 / 1회 소모"]],
["lb:reward_pc",["§b[Lucky PC]","§f성급함 II 25초 / 신속 I 12초","§f야간 투시 25초 / 1회 소모"]],
["lb:reward_cctv",["§a[Lucky CCTV]","§f24블럭 내 적대 개체 수 탐지","§f가장 가까운 적 거리 표시","§7재사용 가능"]],
["lb:reward_wrench",["§e[Lucky Wrench]","§f성급함 III 30초 / 저항 I 8초","§7사용 시 블록 소모"]],
["lb:reward_chainsaw",["§6[Lucky Chainsaw]","§f주변 원목·목재 최대 28개 절단","§f절단 블록은 아이템으로 회수","§7재사용 가능"]],
["lb:reward_camera",["§b[Lucky Camera]","§f현재 좌표 저장","§f다음 사용 때 이전 촬영 위치도 표시","§7재사용 가능"]],
["lb:reward_golden_hammer",["§6[Golden Hammer]","§f힘 II + 저항 II 12초","§7사용 시 블록 소모"]],
["lb:reward_vase",["§d[Lucky Vase]","§f사용: 랜덤 럭키 조각 캐시","§7일반 65% / 희귀 29% / 에픽 6%"]],
["lb:reward_easel",["§a[Lucky Easel]","§f야간 투시 45초 / 느린 낙하 15초","§f신속 I 10초 / 1회 소모"]],
["lb:reward_cardboard_sword",["§6[Cardboard Sword]","§f힘 I 8초 + 신속 I 6초","§7약화 I 2초 / 1회 소모"]],
["lb:reward_cardboard_axe",["§6[Cardboard Axe]","§f성급함 II 13초 + 신속 I 5초","§7사용 시 블록 소모"]],
["lb:reward_cardboard_shield",["§6[Cardboard Shield]","§f저항 II + 흡수 II 12초","§7사용 시 블록 소모"]],
["lb:reward_turret",["§c[Lucky Auto-Turret]","§f설치 후 사용: 자동 터렛 배치","§f사거리 20 / 1발 9 피해 / 탄약 96","§7후반 커스텀 적도 자동 조준"]],
["lb:reward_gravestone",["§7[Recall Gravestone]","§f사용: 마지막 사망지점 귀환","§f성공할 때만 1회 소모"]],
["lb:reward_mirror",["§d[Fortune Mirror]","§f부정 효과를 이로운 효과로 반전","§f대상이 없으면 소모 안 됨"]],
["lb:reward_air_conditioner",["§b[Lucky Air Conditioner]","§f주변 화염 제거 + 개체 소화","§f근처 플레이어 화염 저항"]],
]);

function sameLore(a,b){if(a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true;}
function applySlot(slot){
  try{
    const item=slot?.getItem();if(!item)return;
    const wanted=LORE.get(item.typeId);if(!wanted)return;
    if(sameLore(item.getLore(),wanted))return;
    item.setLore(wanted);slot.setItem(item);
  }catch{}
}
function refresh(player){
  try{const inv=player.getComponent("inventory")?.container;if(inv)for(let i=0;i<inv.size;i++)applySlot(inv.getSlot(i));}catch{}
  try{
    const eq=player.getComponent("equippable");if(!eq)return;
    for(const s of [mc.EquipmentSlot.Head,mc.EquipmentSlot.Chest,mc.EquipmentSlot.Legs,mc.EquipmentSlot.Feet,mc.EquipmentSlot.Offhand])applySlot(eq.getEquipmentSlot(s));
  }catch{}
}
mc.system.runInterval(()=>{for(const player of mc.world.getAllPlayers())refresh(player);},40);
