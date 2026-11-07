import { system, world } from "@minecraft/server";
import { CustomForm, ObservableBoolean, ObservableString } from "@minecraft/server-ui";

const RESOURCE_PACK_ID = "fcb9b4ec-ecef-47e4-ad9b-867e391b3f17";
const UI_TEXTURE = "textures/ui/status-window/";
const openForms = new Map();

const SAMPLE_PROFILE = Object.freeze({
  className: "황혼의 길잡이",
  attack: 284,
  defense: 167,
  movement: 112,
  equipment: [
    "머리   ·  달무리의 관",
    "몸통   ·  잿빛 서약 흉갑",
    "장갑   ·  안개추적 건틀릿",
    "다리   ·  검은솔 바지",
    "발     ·  바람결 장화",
    "무기   ·  새벽을 여는 송곳",
    "유물   ·  쌍성의 인장"
  ]
});

function bar(value, maximum, colorCode) {
  const segmentCount = 12;
  const ratio = maximum > 0 ? Math.max(0, Math.min(1, value / maximum)) : 0;
  const filled = Math.round(ratio * segmentCount);
  return `${colorCode}${"█".repeat(filled)}§8${"·".repeat(segmentCount - filled)}§r`;
}

function formatValue(value) {
  return Number.isFinite(value) ? `${Math.round(value * 10) / 10}` : "0";
}

function makeHealthLine(player) {
  const health = player.getComponent("minecraft:health");
  if (!health) {
    return "§c♥ 생명력  §7확인할 수 없습니다.";
  }

  const current = Math.max(0, health.currentValue);
  const maximum = Math.max(1, health.effectiveMax);
  return `§c♥ 생명력  §f${formatValue(current)} / ${formatValue(maximum)}   ${bar(current, maximum, "§c")}`;
}

function makeExperienceLine(player) {
  const earned = Math.max(0, player.xpEarnedAtCurrentLevel ?? 0);
  const needed = Math.max(0, player.totalXpNeededForNextLevel ?? 0);
  const remaining = Math.max(0, needed - earned);
  return `§d✦ 경험치  §f${Math.round(earned)} / ${Math.round(needed)}   ${bar(earned, needed, "§d")}  §8다음 레벨까지 ${Math.round(remaining)}`;
}

function imageDetails(name) {
  return {
    imagePackId: RESOURCE_PACK_ID,
    imageSrc: `${UI_TEXTURE}${name}`
  };
}

function showStatusWindow(player) {
  if (!player || player.typeId !== "minecraft:player" || openForms.has(player.id)) {
    return;
  }

  const overviewVisible = new ObservableBoolean(true);
  const equipmentVisible = new ObservableBoolean(false);
  const playerLine = new ObservableString("");
  const healthLine = new ObservableString("");
  const experienceLine = new ObservableString("");
  const equipmentDetail = new ObservableString("슬롯을 선택하면 장비 설명이 여기에 표시됩니다.");

  const form = new CustomForm(player, "DUSKVEIL  /  모험가 기록")
    .closeButton()
    .image(`${UI_TEXTURE}banner`, RESOURCE_PACK_ID, { width: 1, visible: overviewVisible })
    .label(playerLine, { visible: overviewVisible })
    .label(`§7직업  §f${SAMPLE_PROFILE.className}  §8·  견본`, { visible: overviewVisible })
    .label("§8실시간  이름 · 레벨 · 체력 · 경험치", { visible: overviewVisible })
    .label(healthLine, { visible: overviewVisible })
    .label(experienceLine, { visible: overviewVisible })
    .divider({ visible: overviewVisible })
    .header("전투 능력  /  견본 기록", { visible: overviewVisible })
    .label(`§6ATK  §f${SAMPLE_PROFILE.attack}     §bDEF  §f${SAMPLE_PROFILE.defense}     §aMOVE  §f${SAMPLE_PROFILE.movement}%`, { visible: overviewVisible })
    .label("§8전투 수치와 직업은 표시 예시입니다.", { visible: overviewVisible })
    .button("장비 기록 보기", () => {
      overviewVisible.setData(false);
      equipmentVisible.setData(true);
    }, {
      imageDetails: imageDetails("icon-equipment"),
      tooltip: "착용 슬롯과 견본 장비를 살펴봅니다.",
      visible: overviewVisible
    })
    .image(`${UI_TEXTURE}equipment-grid`, RESOURCE_PACK_ID, { width: 1, visible: equipmentVisible })
    .header("착용 슬롯", { visible: equipmentVisible })
    .label(`§f${SAMPLE_PROFILE.equipment.join("\n§7")}`, { visible: equipmentVisible })
    .divider({ visible: equipmentVisible })
    .header("장비 이야기", { visible: equipmentVisible })
    .label(equipmentDetail, { visible: equipmentVisible })
    .button("무기  ·  새벽을 여는 송곳", () => {
      equipmentDetail.setData("§f새벽을 여는 송곳\n§7유성철을 접어 만든 날.\n§6공격력  +24  §8·  견본 기록");
    }, {
      imageDetails: imageDetails("icon-weapon"),
      tooltip: "무기의 이름과 간단한 설명을 표시합니다.",
      visible: equipmentVisible
    })
    .button("방어구  ·  잿빛 서약 흉갑", () => {
      equipmentDetail.setData("§f잿빛 서약 흉갑\n§7검은 가죽 위로 은빛 비늘을 덧댄 갑옷.\n§b방어력  +38  §8·  견본 기록");
    }, {
      imageDetails: imageDetails("icon-armor"),
      tooltip: "방어구의 이름과 간단한 설명을 표시합니다.",
      visible: equipmentVisible
    })
    .button("유물  ·  쌍성의 인장", () => {
      equipmentDetail.setData("§f쌍성의 인장\n§7두 개의 별을 새긴 오래된 부적.\n§a이동 속도  +12%  §8·  견본 기록");
    }, {
      imageDetails: imageDetails("icon-relic"),
      tooltip: "유물의 이름과 간단한 설명을 표시합니다.",
      visible: equipmentVisible
    })
    .button("개요로 돌아가기", () => {
      equipmentDetail.setData("슬롯을 선택하면 장비 설명이 여기에 표시됩니다.");
      equipmentVisible.setData(false);
      overviewVisible.setData(true);
    }, {
      imageDetails: imageDetails("icon-overview"),
      tooltip: "이름, 생명력, 경험치와 전투 능력으로 돌아갑니다.",
      visible: equipmentVisible
    });

  const refresh = () => {
    try {
      playerLine.setData(`§f${player.name}  §8·  §6LV. ${player.level}`);
      healthLine.setData(makeHealthLine(player));
      experienceLine.setData(makeExperienceLine(player));
    } catch (error) {
      console.warn(`[status-window] Live player data refresh failed: ${error}`);
    }
  };

  refresh();
  const session = { taskId: undefined };
  openForms.set(player.id, session);

  try {
    session.taskId = system.runInterval(refresh, 10);
    form.show().then(
      () => finishSession(player.id, session),
      (error) => {
        console.warn(`[status-window] Form closed: ${error}`);
        finishSession(player.id, session);
      }
    );
  } catch (error) {
    finishSession(player.id, session);
    console.warn(`[status-window] Could not show form: ${error}`);
  }
}

function finishSession(playerId, session) {
  if (session.taskId !== undefined) {
    system.clearRun(session.taskId);
  }
  if (openForms.get(playerId) === session) {
    openForms.delete(playerId);
  }
}

world.afterEvents.itemUse.subscribe((event) => {
  if (event.itemStack.typeId === "minecraft:compass" && event.source.typeId === "minecraft:player") {
    showStatusWindow(event.source);
  }
});
