# Blockbench asset workflow

- Local Blockbench detected: `5.2.1`.
- No connected Blockbench MCP integration is exposed in this task.
- `build_models.py` deterministically creates two editable `.bbmodel` sources, their Bedrock `.geo.json` counterparts, and the associated pixel textures. It does not automate or claim a successful Blockbench GUI export.
- Regenerate from the repository root with:

  ```powershell
  python projects/monster-restaurant/assets/blockbench/build_models.py
  ```

- Official Blockbench workflow for a manual geometry export is **File → Export → Export Bedrock Geometry**. Keep each `.bbmodel`, exported `.geo.json`, texture, and animation together under the project’s source tree.
- Before approving these assets, open both models in Blockbench 5.2.1, verify the bone hierarchy and UV mapping, and inspect them in the target Bedrock build from front/side and normal play distance. That GUI and game review has not yet been completed.
