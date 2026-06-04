function normalizeStyleValue(value: string): string {
  const trimmed = value.trim();
  const pxMatch = /^(-?\d+(?:\.\d+)?)px$/i.exec(trimmed);
  return pxMatch ? pxMatch[1] : trimmed;
}

function normalizeAxis(value: string): string {
  return value === "row" ? "horizontal" : "vertical";
}

function normalizeDistribution(value: string): string {
  switch (value) {
    case "center":
      return "center";
    case "flex-end":
    case "end":
      return "trailing";
    case "space-around":
    case "space-evenly":
      return "equalCentering";
    case "space-between":
      return "equalSpacing";
    case "stretch":
      return "fill";
    default:
      return "leading";
  }
}

function normalizeAlignment(value: string): string {
  switch (value) {
    case "center":
      return "center";
    case "flex-end":
    case "end":
      return "trailing";
    case "stretch":
      return "fill";
    default:
      return "leading";
  }
}

/**
 * Translates a small CSS-like style subset into UIKit-facing bridge style keys.
 * The mapping stays package-local so native layout concerns do not leak upward.
 */
export function normalizeUIKitStyle(viewType: string, style: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [name, rawValue] of Object.entries(style)) {
    const value = normalizeStyleValue(String(rawValue));

    switch (name) {
      case "display":
        if (value === "flex" || value === "stack") {
          normalized.layoutMode = "stack";
        }
        break;
      case "flexDirection":
        normalized.stackAxis = normalizeAxis(value);
        break;
      case "justifyContent":
        normalized.stackDistribution = normalizeDistribution(value);
        break;
      case "alignItems":
        normalized.stackAlignment = normalizeAlignment(value);
        break;
      case "gap":
        normalized.stackSpacing = value;
        break;
      case "rowGap":
        normalized.stackVerticalSpacing = value;
        break;
      case "columnGap":
        normalized.stackHorizontalSpacing = value;
        break;
      case "padding":
        normalized.contentPadding = value;
        break;
      case "paddingHorizontal":
        normalized.contentPaddingHorizontal = value;
        break;
      case "paddingVertical":
        normalized.contentPaddingVertical = value;
        break;
      case "margin":
        normalized.layoutMargin = value;
        break;
      case "marginTop":
        normalized.layoutMarginTop = value;
        break;
      case "marginRight":
        normalized.layoutMarginRight = value;
        break;
      case "marginBottom":
        normalized.layoutMarginBottom = value;
        break;
      case "marginLeft":
        normalized.layoutMarginLeft = value;
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
        normalized.preferredWidth = value;
        break;
      case "height":
        normalized.preferredHeight = value;
        break;
      case "fontSize":
        normalized.fontSize = value;
        break;
      default:
        normalized[name] = value;
        break;
    }
  }

  if (viewType === "UIStackView" && normalized.layoutMode == null) {
    normalized.layoutMode = "stack";
  }

  return normalized;
}
