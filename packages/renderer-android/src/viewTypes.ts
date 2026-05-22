const AndroidViewTypeByTag: Record<string, string> = {
  a: "TextView",
  article: "ViewGroup",
  aside: "ViewGroup",
  button: "Button",
  div: "ViewGroup",
  em: "TextView",
  footer: "ViewGroup",
  form: "ViewGroup",
  h1: "TextView",
  h2: "TextView",
  h3: "TextView",
  h4: "TextView",
  h5: "TextView",
  h6: "TextView",
  header: "ViewGroup",
  img: "ImageView",
  image: "ImageView",
  input: "EditText",
  label: "TextView",
  li: "ViewGroup",
  main: "ViewGroup",
  nav: "ViewGroup",
  ol: "ViewGroup",
  p: "TextView",
  recycler: "RecyclerView",
  section: "ViewGroup",
  select: "Spinner",
  small: "TextView",
  span: "TextView",
  stack: "LinearLayout",
  strong: "TextView",
  switch: "Switch",
  textarea: "EditText",
  toggle: "Switch",
  "button-view": "Button",
  "image-view": "ImageView",
  "scroll-view": "ScrollView",
  "stack-view": "LinearLayout",
  "text-input": "EditText",
  "text-view": "TextView",
  "view-group": "ViewGroup",
  ul: "ViewGroup"
};

/**
 * Resolves Terajs element tags to concrete Android View types inside the Android package.
 * Standard HTML-like tags and native-flavored tags both collapse to Android primitives.
 */
export function resolveAndroidViewType(tag: string): string {
  const trimmed = tag.trim();
  if (!trimmed) {
    return "ViewGroup";
  }

  const mapped = AndroidViewTypeByTag[trimmed.toLowerCase()];
  if (mapped) {
    return mapped;
  }

  if (/^[A-Z]/.test(trimmed)) {
    return trimmed;
  }

  return trimmed;
}