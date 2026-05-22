function normalizeStyleValue(value: string): string {
  const trimmed = value.trim();
  const pxMatch = /^(-?\d+(?:\.\d+)?)px$/i.exec(trimmed);
  return pxMatch ? pxMatch[1] : trimmed;
}

function normalizeOrientation(value: string): string {
  return value === "row" ? "horizontal" : "vertical";
}

function normalizeGravity(value: string): string {
  switch (value) {
    case "center":
      return "center";
    case "flex-end":
    case "end":
      return "end";
    case "space-between":
      return "space_between";
    default:
      return "start";
  }
}

function normalizeCrossAxis(value: string): string {
  switch (value) {
    case "center":
      return "center";
    case "flex-end":
    case "end":
      return "end";
    case "stretch":
      return "fill";
    default:
      return "start";
  }
}

/**
 * Translates a small CSS-like style subset into Android-facing bridge style keys.
 * The mapping stays package-local so native layout concerns do not leak upward.
 */
export function normalizeAndroidStyle(viewType: string, style: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [name, rawValue] of Object.entries(style)) {
    const value = normalizeStyleValue(String(rawValue));

    switch (name) {
      case "display":
        if (value === "flex" || value === "linear") {
          normalized.layoutMode = "linear";
        }
        break;
      case "flexDirection":
        normalized.orientation = normalizeOrientation(value);
        break;
      case "justifyContent":
        normalized.gravity = normalizeGravity(value);
        break;
      case "alignItems":
        normalized.layoutGravity = normalizeCrossAxis(value);
        break;
      case "gap":
        normalized.spacing = value;
        break;
      case "rowGap":
        normalized.verticalSpacing = value;
        break;
      case "columnGap":
        normalized.horizontalSpacing = value;
        break;
      case "padding":
        normalized.padding = value;
        break;
      case "paddingHorizontal":
        normalized.paddingHorizontal = value;
        break;
      case "paddingVertical":
        normalized.paddingVertical = value;
        break;
      case "margin":
        normalized.layoutMargin = value;
        break;
      case "marginHorizontal":
        normalized.layoutMarginHorizontal = value;
        break;
      case "marginVertical":
        normalized.layoutMarginVertical = value;
        break;
      case "background":
      case "backgroundColor":
        normalized.backgroundColor = value;
        break;
      case "color":
        normalized.textColor = value;
        break;
      case "borderRadius":
        normalized.cornerRadius = value;
        break;
      case "width":
        normalized.layoutWidth = value;
        break;
      case "height":
        normalized.layoutHeight = value;
        break;
      case "fontSize":
        normalized.textSize = value;
        break;
      default:
        normalized[name] = value;
        break;
    }
  }

  if (viewType === "LinearLayout" && normalized.layoutMode == null) {
    normalized.layoutMode = "linear";
  }

  return normalized;
}