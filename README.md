# Token Battle Damage

Token Battle Damage is a Foundry VTT module that swaps token artwork as an actor's HP changes. A GM can configure HP thresholds and image paths on an Actor, and active tokens for that Actor will update automatically when the configured HP data changes.

## Version

Current development version: `0.1.7`

## Features in this first build

- World settings for current HP and max HP data paths
- Actor-level battle damage configuration
- Configurable damage stages with manual image paths
- Automatic token image updates on Actor HP changes
- Original token image preservation and restoration
- Healing support, including reverting to healthier images
- Optional 0 HP / defeated stage
- Default `BattleDamage` art folder with actor-specific subfolders
- Multi-image upload into each Actor's battle damage folder
- Reset button for default stage names and thresholds
- GM-only update guard with duplicate-GM protection
- Optional combat tracker refresh after token image changes
- Tokenizer-safe behavior: selected images are stored independently in module flags

## Foundry Compatibility

This module is marked compatible with Foundry VTT v14. It uses the current package manifest compatibility field and avoids hard dependencies on game systems or other visual modules.

The actor configuration window currently uses Foundry's legacy `FormApplication` API, which remains available in v14 but is deprecated. A future release should migrate the configuration UI to `ApplicationV2`.

## Usage

1. Enable the module in Foundry.
2. Open Configure Settings and set the current/max HP paths for your game system.
3. Open an Actor sheet as a GM.
4. Click Battle Damage Art in the sheet header.
5. Enable battle damage for the Actor and choose images for the configured HP stages.

To make image selection easier, Token Battle Damage uses a `BattleDamage` folder in Foundry User Data by default. When battle damage is enabled for an Actor, the module creates an actor-specific subfolder such as `BattleDamage/Creeg-Greythorn`. The Actor configuration window includes an Open Actor Art Folder button, which opens Foundry's file picker at that location. Use the file picker's upload controls to add new images if your Foundry user has upload permission.

The Upload Images button lets you select several local image files at once. The module uploads them into that Actor's battle damage folder and fills empty non-original stage image fields in order. Foundry's public FilePicker API does not provide safe file deletion, so Reset Stages clears the module's stage configuration but does not delete uploaded files.

The default HP paths are:

```text
system.attributes.hp.value
system.attributes.hp.max
```

To find HP paths for another system: select a token, press F12, run `console.dir(canvas.tokens.controlled[0].actor.system)`, then expand the HP data. Add `system.` before the property path you find. You can also inspect a specific Actor with `console.dir(game.actors.getName("Actor Name").system)`.

## Compatibility Notes

### Tokenizer

This module does not require Tokenizer and does not modify Tokenizer's UI or actor portraits. Tokenizer can still be used to create token images; Token Battle Damage simply stores the selected image paths in its own flags and updates `TokenDocument.texture.src`.

### Carousel Combat Tracker

This module does not patch combat tracker templates or manipulate tracker UI. It updates the underlying token image. If a tracker module does not refresh immediately, enable the optional "Refresh combat tracker after image update" setting.

Some carousel-style trackers use the Actor portrait instead of the token image. For those, enable the optional "Update Actor portrait for combat trackers" setting.

## Development

Run the lightweight unit tests with:

```bash
npm test
```
