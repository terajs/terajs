export const overlaySignalsJournalSignalStyles = `

  .signals-layout .devtools-workbench-list-item {
    position: relative;
    gap: 8px;
    padding: 12px 34px 12px 13px;
    border-color: #233752;
    border-radius: 14px;
    background: #0b1627;
  }

  .signals-layout .devtools-workbench-list-item::after {
    content: "›";
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(150, 179, 232, 0.54);
    font-size: 17px;
    line-height: 1;
  }

  .signals-layout .devtools-workbench-list-item:hover {
    background: #152238;
    border-color: #4e85ff;
  }

  .signals-layout .devtools-workbench-list-item.is-active {
    background: linear-gradient(180deg, #223657, #152238);
    border-color: #4e85ff;
    box-shadow: none;
  }

  .signals-layout .devtools-workbench-list-item.is-active::after {
    color: rgba(223, 239, 255, 0.84);
  }

  .signals-layout .signals-detail-value {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    min-height: 0;
    height: 100%;
  }

  .signals-layout .signals-detail-stage {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
  }

  .signals-layout .signals-detail-stage .structured-value-viewer,
  .signals-layout .signals-detail-stage .inspector-code {
    flex: 1 1 auto;
    min-height: 0;
    max-height: none;
  }

  .signals-selection-note {
    padding: 10px 12px;
    border: 1px solid #4e85ff;
    border-radius: 12px;
    background: #12213a;
    color: rgba(213, 228, 255, 0.82);
    font-size: 12px;
    line-height: 1.55;
  }
`;