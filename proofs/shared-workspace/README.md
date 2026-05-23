# Terajs Proof Workspace

This proof workspace is a small shared-source app kept separate from terajs-com.

## Scope

- shared `.tera` source lives under `src/shared`
- selected targets are `web`, `android`, and `ios`
- generated native output is reserved under `.terajs/generated`
- generated host metadata is reserved under `.terajs/hosts`

## Local commands

```bash
npm run dev
npm run build
```

## Layout

- `src/shared/pages` holds shared proof routes
- `src/shared/components` holds shared proof components
- `.terajs/generated/android` and `.terajs/generated/ios` hold generated native artifacts
- `.terajs/hosts/android` and `.terajs/hosts/ios` hold generated host metadata

This workspace is the proof-app boundary for the multi-target build slices.