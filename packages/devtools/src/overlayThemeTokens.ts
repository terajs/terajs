export const overlayThemeTokenStyles = `
  :root,
  #terajs-devtools-shell,
  .overlay-frame {
    --tera-black: #07101d;
    --tera-carbon: #0f192a;
    --tera-graphite: #18263d;
    --tera-blue: #4c7bff;
    --tera-cyan: #35c6ff;
    --tera-purple: #7a63ff;
    --tera-mint: #39d3b0;
    --tera-amber: #ffbf66;
    --tera-rose: #ff7196;
    --tera-mist: #9db3d6;
    --tera-cloud: #eef5ff;
    --tera-body-font: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --tera-heading-font: "Space Grotesk", "Inter", sans-serif;
    --tera-code-font: "JetBrains Mono", "Fira Code", monospace;
    --tera-surface: var(--tera-carbon);
    --tera-border: rgba(145, 173, 214, 0.14);
    --tera-border-strong: rgba(108, 147, 255, 0.22);
    --tera-panel-glow: linear-gradient(145deg, rgba(76, 123, 255, 0.08), rgba(53, 198, 255, 0.04) 48%, rgba(122, 99, 255, 0.05));
    --tera-shadow: 0 28px 62px rgba(2, 8, 20, 0.48);
    --tera-shell-bg:
      radial-gradient(circle at 0% 0%, rgba(76, 123, 255, 0.18), transparent 30%),
      radial-gradient(circle at 100% 8%, rgba(122, 99, 255, 0.14), transparent 26%),
      radial-gradient(circle at 74% 28%, rgba(57, 211, 176, 0.08), transparent 22%),
      linear-gradient(180deg, rgba(7, 16, 29, 0.98), rgba(10, 18, 31, 0.97));
    --tera-surface-page: linear-gradient(180deg, rgba(8, 15, 27, 0.98), rgba(5, 9, 18, 0.98));
    --tera-surface-pane: rgba(11, 20, 36, 0.88);
    --tera-surface-pane-muted: rgba(9, 17, 31, 0.78);
    --tera-surface-sidebar: rgba(9, 17, 31, 0.78);
    --tera-surface-pane-strong: rgba(13, 24, 43, 0.94);
    --tera-surface-row-hover: rgba(24, 39, 63, 0.52);
    --tera-surface-row-active: rgba(30, 48, 78, 0.78);
    --tera-surface-raised: rgba(14, 26, 45, 0.92);
    --tera-surface-section: rgba(12, 22, 38, 0.72);
    --tera-surface-section-strong: rgba(10, 19, 33, 0.94);
    --tera-separator: rgba(145, 173, 214, 0.12);
    --tera-separator-strong: rgba(145, 173, 214, 0.18);
    --tera-title-ink: var(--tera-cyan);
    --tera-tone-primary: #9cb8ff;
    --tera-tone-primary-soft: rgba(156, 184, 255, 0.16);
    --tera-tone-primary-muted: rgba(156, 184, 255, 0.8);
    --tera-tone-info: #8ddfff;
    --tera-tone-info-soft: rgba(53, 198, 255, 0.16);
    --tera-tone-info-muted: rgba(141, 223, 255, 0.78);
    --tera-tone-tertiary: #c7b8ff;
    --tera-tone-tertiary-soft: rgba(122, 99, 255, 0.16);
    --tera-tone-tertiary-muted: rgba(199, 184, 255, 0.8);
    --tera-tone-success: #7fe2c4;
    --tera-tone-success-soft: rgba(57, 211, 176, 0.16);
    --tera-tone-success-muted: rgba(127, 226, 196, 0.78);
    --tera-tone-accent: rgba(53, 198, 255, 0.78);
    --tera-tone-accent-soft: rgba(53, 198, 255, 0.16);
    --tera-tone-warn: rgba(232, 136, 62, 0.84);
    --tera-tone-warn-soft: rgba(232, 136, 62, 0.18);
    --tera-tone-warn-muted: rgba(255, 198, 129, 0.82);
    --tera-tone-error: rgba(255, 107, 139, 0.84);
    --tera-tone-error-soft: rgba(255, 107, 139, 0.16);
    --tera-tone-error-muted: rgba(255, 158, 184, 0.82);
    --tera-tone-label: #b4d4ff;
  }

  #terajs-devtools-shell[data-theme="light"],
  #terajs-devtools-root[data-theme="light"] {
    --tera-light-text-strong: #17396a;
    --tera-light-text-soft: #526ea7;
    --tera-light-text-muted: #6780af;
    --tera-light-accent: #3f7cff;
    --tera-light-accent-strong: #265dcb;
    --tera-light-accent-violet: #6a54d7;
    --tera-light-accent-soft: rgba(63, 124, 255, 0.12);
    --tera-light-accent-soft-strong: rgba(63, 124, 255, 0.2);
    --tera-light-border: rgba(112, 148, 214, 0.24);
    --tera-light-border-strong: rgba(63, 124, 255, 0.32);
    --tera-light-shell-bg:
      radial-gradient(circle at 0% 0%, rgba(63, 124, 255, 0.18), transparent 30%),
      radial-gradient(circle at 100% 8%, rgba(106, 84, 215, 0.14), transparent 26%),
      radial-gradient(circle at 74% 28%, rgba(57, 211, 176, 0.08), transparent 24%),
      linear-gradient(180deg, rgba(249, 252, 255, 0.99), rgba(232, 241, 252, 0.98));
    --tera-light-panel-bg:
      radial-gradient(circle at top left, rgba(63, 124, 255, 0.1), transparent 34%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(240, 246, 255, 0.96));
    --tera-light-panel-alt:
      radial-gradient(circle at top left, rgba(63, 124, 255, 0.11), transparent 34%),
      radial-gradient(circle at top right, rgba(106, 84, 215, 0.08), transparent 28%),
      linear-gradient(180deg, rgba(245, 250, 255, 0.98), rgba(233, 242, 255, 0.97));
    --tera-light-panel-emphasis:
      radial-gradient(circle at top left, rgba(63, 124, 255, 0.14), transparent 38%),
      radial-gradient(circle at top right, rgba(53, 198, 255, 0.1), transparent 28%),
      linear-gradient(180deg, rgba(237, 245, 255, 0.98), rgba(221, 233, 252, 0.97));
    --tera-light-panel-raised: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(239, 246, 255, 0.95));
    --tera-light-panel-raised-soft: linear-gradient(180deg, rgba(248, 252, 255, 0.96), rgba(238, 245, 255, 0.95));
    --tera-light-shadow: 0 20px 40px rgba(63, 124, 255, 0.12);
    --tera-light-cyan-ink: #0b7a99;
    --tera-light-purple-ink: #5c44c9;
    --tera-light-red-ink: #ae2d58;
    --tera-light-amber-ink: #a5541a;
    --tera-light-mint-ink: #0f8570;
    --tera-title-ink: var(--tera-light-cyan-ink);
    --tera-tone-primary: #265dcb;
    --tera-tone-primary-soft: rgba(38, 93, 203, 0.1);
    --tera-tone-primary-muted: rgba(38, 93, 203, 0.78);
    --tera-tone-info: var(--tera-light-cyan-ink);
    --tera-tone-info-soft: rgba(11, 122, 153, 0.1);
    --tera-tone-info-muted: rgba(11, 122, 153, 0.76);
    --tera-tone-tertiary: var(--tera-light-purple-ink);
    --tera-tone-tertiary-soft: rgba(92, 68, 201, 0.1);
    --tera-tone-tertiary-muted: rgba(92, 68, 201, 0.76);
    --tera-tone-success: var(--tera-light-mint-ink);
    --tera-tone-success-soft: rgba(15, 133, 112, 0.1);
    --tera-tone-success-muted: rgba(15, 133, 112, 0.76);
    --tera-tone-warn-muted: rgba(165, 84, 26, 0.78);
    --tera-tone-error-muted: rgba(174, 45, 88, 0.78);
    --tera-tone-label: #1f4a8a;
    --tera-surface-page: linear-gradient(180deg, rgba(237, 242, 248, 0.99), rgba(224, 231, 241, 0.98));
    --tera-surface-pane: rgba(246, 249, 253, 0.9);
    --tera-surface-pane-muted: rgba(239, 244, 250, 0.84);
    --tera-surface-sidebar: rgba(231, 237, 245, 0.96);
    --tera-surface-pane-strong: rgba(231, 237, 245, 0.96);
    --tera-surface-row-hover: rgba(63, 124, 255, 0.09);
    --tera-surface-row-active: rgba(63, 124, 255, 0.15);
    --tera-surface-raised: rgba(251, 253, 255, 0.95);
    --tera-surface-section: rgba(242, 246, 251, 0.9);
    --tera-surface-section-strong: rgba(235, 241, 248, 0.96);
    --tera-separator: rgba(101, 130, 172, 0.14);
    --tera-separator-strong: rgba(101, 130, 172, 0.22);
    --tera-tone-accent: rgba(63, 124, 255, 0.82);
    --tera-tone-accent-soft: rgba(63, 124, 255, 0.14);
    --tera-tone-warn: rgba(214, 115, 42, 0.84);
    --tera-tone-warn-soft: rgba(214, 115, 42, 0.16);
    --tera-tone-error: rgba(178, 32, 79, 0.84);
    --tera-tone-error-soft: rgba(178, 32, 79, 0.14);
  }
`;