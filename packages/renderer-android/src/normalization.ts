const AndroidTextPropViewTypes = new Set(["Button", "EditText", "TextView"]);
const AndroidImagePropViewTypes = new Set(["ImageView"]);

export interface AndroidNormalizedProp {
  name: string;
  value: unknown;
}

function normalizeNativeKey(name: string): string {
  return name.replace(/[-_\s]/g, "").toLowerCase();
}

export function normalizeAndroidProp(viewType: string, name: string, value: unknown): AndroidNormalizedProp {
  const normalizedKey = normalizeNativeKey(name);

  if (
    normalizedKey === "arialabel"
    || normalizedKey === "accessibilitylabel"
    || normalizedKey === "contentdescription"
  ) {
    return {
      name: "contentDescription",
      value
    };
  }

  if (AndroidTextPropViewTypes.has(viewType) && ["text", "title", "label", "value"].includes(normalizedKey)) {
    return {
      name: "text",
      value
    };
  }

  if (AndroidImagePropViewTypes.has(viewType) && ["src", "source", "imagesource"].includes(normalizedKey)) {
    return {
      name: "source",
      value
    };
  }

  if (viewType === "Switch" && ["checked", "on"].includes(normalizedKey)) {
    return {
      name: "checked",
      value: Boolean(value)
    };
  }

  return {
    name,
    value
  };
}

export function normalizeAndroidEventName(viewType: string, name: string): string {
  const normalizedKey = normalizeNativeKey(name);

  if (["click", "press", "tap"].includes(normalizedKey)) {
    return "press";
  }

  if (
    ["change", "input", "toggle"].includes(normalizedKey)
    && viewType === "Switch"
  ) {
    return "change";
  }

  if (
    ["input", "change", "textinput"].includes(normalizedKey)
    && viewType === "EditText"
  ) {
    return "change";
  }

  return name;
}