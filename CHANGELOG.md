# Changelog

## 0.1.8

- Added Simple, Standard, and Full quick setup presets.
- Made bulk upload automatically choose a setup based on image count and assign uploaded images.
- Added thumbnails and per-stage token preview buttons to the Actor configuration dialog.

## 0.1.7

- Added multi-image upload into each Actor's battle damage folder.
- Added Reset Stages to restore default stage names, thresholds, original-image flags, and empty image paths.
- Added an optional Actor portrait update setting for carousel-style combat trackers.
- Documented that uploaded file deletion is not available through Foundry's public FilePicker API.

## 0.1.6

- Corrected the HP path discovery instructions to use a selected token or named Actor lookup.

## 0.1.5

- Added short HP path discovery instructions to the module settings and README.

## 0.1.4

- Defaulted battle damage image storage to a `BattleDamage` User Data folder.
- Added automatic actor-specific art folder creation when battle damage is enabled.
- Pointed the Actor art browser and empty image pickers at the actor-specific folder.

## 0.1.3

- Fixed the damage-stage header overlap while scrolling in the Actor configuration dialog.
- Added a default battle damage art folder setting.
- Added an Open Art Browser button that opens Foundry's file picker for browsing and uploads.

## 0.1.2

- Fixed the Actor configuration dialog layout so damage stages appear without a large blank scroll area.
- Made the dialog resizable and constrained internal scrolling to the stage list.

## 0.1.1

- Marked the module verified for Foundry VTT v14.
- Documented the v14 compatibility status and future `ApplicationV2` migration target.

## 0.1.0

- Initial Foundry VTT module scaffold.
- Added actor-level battle damage configuration.
- Added automatic token image updates from configurable HP thresholds.
