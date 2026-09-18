# External Add-On / Mod Integration Architecture

Reviewed: 2026-09-18

## Why this structure exists

Large Bedrock projects and build systems do not safely scale by copying unrelated packs over each other. The reliable patterns observed in current Bedrock projects are:

1. Keep BP and RP as explicit pack units linked by manifest UUID dependencies.
2. Give each logical add-on/content source its own namespace or remap imported content into one controlled namespace.
3. Keep Script API source modular and converge through one entry/bootstrap path rather than putting all external content logic in one file.
4. Package all required components together so the player does not need to resolve dependencies manually.
5. Pin external source revisions and maintain a machine-readable provenance map.
6. When two full behavior packs must remain separate, do not assume their JavaScript modules can import each other. Bedrock behavior-pack script realms are isolated; cross-addon coordination needs an explicit messaging/discovery layer.

## Reference projects studied

### miclip/minecraft-addons
Uses a monorepo where each add-on remains a self-contained BP/RP pair. TypeScript is bundled to the BP script entry and packaging auto-discovers add-on folders. BP and RP UUID cross-references are kept synchronized.

Adopted lesson:
- source modules can be numerous, but distributable Script API should have a controlled bundled/entry path;
- each content unit must have predictable ownership.

### der-fruhling/what-the-pack
Its BP explicitly depends on its RP UUID. The packaging script verifies that required components are not omitted, then combines Behavior/Resources/WorldTemplate into one .mcaddon.

Adopted lesson:
- packaging must understand dependency completeness, not merely ZIP whatever files happen to exist.

### BEPack
Maintains BP/RP manifests, Script API dependency versions and release archives from one config while preserving fields it does not own.

Adopted lesson:
- manifest dependency/version updates should be centralized;
- generated/release state should not silently overwrite source ownership.

### Regolith / bedrock-core bundler
Uses a source pipeline where many TypeScript modules are bundled into BP/scripts/main.js and source files are not copied blindly into release output.

Adopted lesson:
- source modules should be separated by responsibility/source, while the runtime entry remains controlled.

### @bedrock-core/server
Documents the important Bedrock limitation that separate behavior packs run scripts in isolated realms and cannot directly import/share JavaScript state. Its solution is runtime discovery/RPC over script events.

Adopted lesson:
- distinguish **vendored merge** from **sidecar integration**.

## Lucky Block integration modes

### A. Vendored merge — default

Use when the source license permits redistribution/modification and the useful content can be cleanly ported.

Process:
1. pin upstream repository + commit;
2. record exact upstream file;
3. import/convert asset;
4. rename into `lb:` namespace and `lb_*` filenames;
5. put source-specific behavior in `BP/scripts/integrations/<source>.js`;
6. expose reward selection through `reward_registry.js`;
7. record target files in `vendor/ASSET_REGISTRY.json`;
8. package it inside our BP/RP.

This is the mode currently used for Microsoft sample material, CorvaeOboro crystals and Loy's Goodies.

### B. Sidecar integration

Use only when an upstream Bedrock add-on should remain an independent BP/RP, for example because independent updates are valuable or its license/architecture makes direct vendoring undesirable.

Rules:
- never directly import JavaScript between behavior packs;
- give the sidecar fresh/unchanged UUID ownership as appropriate;
- define a small versioned Script Event messaging contract when interaction is required;
- the main Lucky Block pack must detect absence and degrade cleanly;
- a distributable .mcaddon must include every required sidecar pack if redistribution is allowed.

We do not currently ship a sidecar dependency, so no unused messaging framework is added yet.

### C. Reference only

Use when redistribution is not permitted or provenance is uncertain. Design/mechanics may inform original implementation, but original files do not enter BP/RP.

## Source layout

```
addon/LuckyBlock/
  BP/
    scripts/
      main.js                    # Lucky opening runtime entry
      reward_registry.js         # reward selection data
      reward_behaviors.js        # integration bootstrap
      integrations/
        loys_goodies.js          # source-owned behavior adapter
  RP/
  vendor/
    ASSET_REGISTRY.json          # source commit -> upstream file -> target mapping
  tools/
    audit_integrations.mjs       # collision/provenance/target check
```

## Identifier rules

- All project-owned gameplay identifiers use `lb:`.
- Vendored source namespaces are not carried into runtime unless compatibility requires them.
- Imported file names are remapped to deterministic `lb_*` names.
- A content ID may have exactly one owning vendor/core record.
- External source updates are deliberate rebases against a new reviewed commit, never unpinned "latest" pulls.

## Scaling rule

When a new external source is introduced, first create its vendor registry source entry and integration module. Only then add its rewards to tier pools. This prevents a future 200+ reward table from losing provenance or mixing source-specific behavior into unrelated code.


## Microsoft Cooperative Add-On alignment

The current Microsoft cooperative add-on guidance reinforces the chosen production layout:

- ship one Behavior Pack and one Resource Pack;
- make the two packs depend on each other;
- avoid dependencies on packs outside the add-on;
- make the Resource Pack world-scoped so it is not accidentally applied globally;
- use unique namespaces to avoid pack-stack identifier collisions.

Lucky Block now follows this directly:
- final external content is vendored/remapped into `lb:` when licensing allows;
- BP/RP are mutually linked;
- RP declares `pack_scope: "world"`;
- the integration audit rejects non-`lb:` vendored content IDs;
- sidecar integration is retained only as an exceptional interoperability pattern, not the default release design.
