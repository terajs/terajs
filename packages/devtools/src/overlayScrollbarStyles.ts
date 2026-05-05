export const overlayScrollbarStyles = `

  #terajs-devtools-root::-webkit-scrollbar-track,
  .devtools-panel::-webkit-scrollbar-track,
  .devtools-tabs::-webkit-scrollbar-track,
  .components-screen-body::-webkit-scrollbar-track,
  .stack-list::-webkit-scrollbar-track,
  .signals-list::-webkit-scrollbar-track,
  .ai-prompt::-webkit-scrollbar-track,
  .ai-response::-webkit-scrollbar-track,
  .inspector-code::-webkit-scrollbar-track,
  .runtime-history-scroll::-webkit-scrollbar-track {
    background: rgba(9, 20, 39, 0.46);
    border-radius: 999px;
  }

  #terajs-devtools-root::-webkit-scrollbar-thumb,
  .devtools-panel::-webkit-scrollbar-thumb,
  .devtools-tabs::-webkit-scrollbar-thumb,
  .components-screen-body::-webkit-scrollbar-thumb,
  .stack-list::-webkit-scrollbar-thumb,
  .signals-list::-webkit-scrollbar-thumb,
  .ai-prompt::-webkit-scrollbar-thumb,
  .ai-response::-webkit-scrollbar-thumb,
  .inspector-code::-webkit-scrollbar-thumb,
  .runtime-history-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(55, 139, 255, 0.88), rgba(50, 215, 255, 0.76));
    border-radius: 999px;
    border: 2px solid rgba(9, 20, 39, 0.46);
  }

  #terajs-devtools-root[data-theme="light"]::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .devtools-panel::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .devtools-tabs::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .components-screen-body::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .stack-list::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .signals-list::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .ai-prompt::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .ai-response::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .inspector-code::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .runtime-history-scroll::-webkit-scrollbar-track {
    background: rgba(206, 220, 243, 0.88);
  }

  #terajs-devtools-root[data-theme="light"]::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .devtools-panel::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .devtools-tabs::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .components-screen-body::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .stack-list::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .signals-list::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .ai-prompt::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .ai-response::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .inspector-code::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .runtime-history-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(64, 126, 213, 0.9), rgba(39, 174, 217, 0.86));
    border-color: rgba(206, 220, 243, 0.88);
  }

`;