export function $teraSwap(templateId: string, targetId: string): void {
  const template = document.getElementById(templateId) as HTMLTemplateElement | null;
  const target = document.getElementById(targetId);
  if (!template || !target || !template.content) return;
  target.replaceWith(template.content.cloneNode(true));
}

export function installTeraSwap(): void {
  if (typeof window !== "undefined") {
    (window as any).$teraSwap = $teraSwap;
  }
}
