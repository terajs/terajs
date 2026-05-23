export const overlayWorkbenchDenseJournalStyles = `

  .investigation-journal-shell {
    gap: 12px;
    height: 100%;
  }

  .investigation-journal-grid {
    grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
    gap: 12px;
    min-height: 0;
    height: 100%;
  }

  .investigation-journal-feed,
  .investigation-journal-detail {
    gap: 12px;
    padding: 14px 16px 16px;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .investigation-journal-feed {
    background: transparent;
  }

  .investigation-journal-detail {
    min-height: 0;
    padding: 14px 18px 18px;
  }

  .investigation-journal-section-header {
    display: grid;
    align-content: center;
    gap: 6px;
    min-height: 56px;
    padding: 4px 0 14px;
    border-bottom: 1px solid var(--tera-separator);
  }

  .investigation-journal--logs .investigation-journal-section-title,
  .investigation-journal--timeline .investigation-journal-section-title,
  .investigation-journal--queue .investigation-journal-section-title {
    color: var(--tera-title-ink);
  }

  .investigation-journal--logs .investigation-journal-section-subtitle,
  .investigation-journal--timeline .investigation-journal-section-subtitle,
  .investigation-journal--queue .investigation-journal-section-subtitle {
    color: var(--tera-tone-label);
  }

  .investigation-journal--issues .investigation-journal-section-title {
    color: var(--tera-amber);
  }
`;