import * as mc from "@minecraft/server";

const TYPE = "lb:sky_damselfly_mount";
const MAX_ENERGY = 600;
const STEP = 10;
const RECHARGE = 20;
const KEY_ENERGY = "lb:damselfly_energy";
const KEY_MODE = "lb:damselfly_mode";

function riders(entity) {
  try { return entity.getComponent("minecraft:rideable")?.getRiders() ?? []; }
  catch { return []; }
}
function bar(player, energy, exhausted=false) {
  const pct = Math.max(0, Math.min(100, Math.round(energy / MAX_ENERGY * 100)));
  try {
    player.onScreenDisplay.setActionBar(
      exhausted ? "§bSky Damselfly §8— §cExhausted §7(dismount to recover)"
                : "§bSky Damselfly §8— §fFlight §3" + pct + "%"
    );
  } catch {}
}

mc.system.runInterval(() => {
  for (const dimensionId of ["overworld","nether","the_end"]) {
    let dimension;
    try { dimension = mc.world.getDimension(dimensionId); } catch { continue; }
    for (const mount of dimension.getEntities({ type: TYPE })) {
      let energy = Number(mount.getDynamicProperty(KEY_ENERGY));
      if (!Number.isFinite(energy)) {
        energy = MAX_ENERGY;
        mount.setDynamicProperty(KEY_ENERGY, energy);
      }
      let mode = String(mount.getDynamicProperty(KEY_MODE) ?? "ground");
      const currentRiders = riders(mount);
      const rider = currentRiders.find(e => e instanceof mc.Player);

      if (rider) {
        if (energy > 0) {
          if (mode !== "flight") {
            try { mount.triggerEvent("lb:flight_start"); } catch {}
            mode = "flight";
            mount.setDynamicProperty(KEY_MODE, mode);
          }
          energy = Math.max(0, energy - STEP);
          mount.setDynamicProperty(KEY_ENERGY, energy);
          if ((energy % 40) === 0 || energy <= 40) bar(rider, energy, false);
          if (energy <= 0) {
            try { mount.triggerEvent("lb:flight_exhausted"); } catch {}
            mode = "exhausted";
            mount.setDynamicProperty(KEY_MODE, mode);
            bar(rider, 0, true);
            try { dimension.playSound("random.break", mount.location, { volume:0.45, pitch:1.35 }); } catch {}
          }
        } else {
          if (mode !== "exhausted") {
            try { mount.triggerEvent("lb:flight_exhausted"); } catch {}
            mount.setDynamicProperty(KEY_MODE, "exhausted");
          }
          bar(rider, 0, true);
        }
        continue;
      }

      if (mode === "flight") {
        try { mount.triggerEvent("lb:flight_land"); } catch {}
        mode = "ground";
        mount.setDynamicProperty(KEY_MODE, mode);
      }

      if (energy < MAX_ENERGY) {
        energy = Math.min(MAX_ENERGY, energy + RECHARGE);
        mount.setDynamicProperty(KEY_ENERGY, energy);
        if (energy >= MAX_ENERGY && mode === "exhausted") {
          try { mount.triggerEvent("lb:flight_land"); } catch {}
          mount.setDynamicProperty(KEY_MODE, "ground");
        }
      } else if (mode === "exhausted") {
        try { mount.triggerEvent("lb:flight_land"); } catch {}
        mount.setDynamicProperty(KEY_MODE, "ground");
      }
    }
  }
}, STEP);
