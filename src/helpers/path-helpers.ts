function normalizeSimplePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/+/, "");
}

export function pathRelative(fromDir: string, toPath: string): string {
  const fromParts = normalizeSimplePath(fromDir).split("/").filter(Boolean);
  const toParts = normalizeSimplePath(toPath).split("/").filter(Boolean);

  while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
    fromParts.shift();
    toParts.shift();
  }

  const up = "../".repeat(fromParts.length);
  return `${up}${toParts.join("/")}`;
}

export function getHrefForMarkdownPage(currentHtmlPath: string, targetHtmlPath: string): string {
  const current = normalizeSimplePath(currentHtmlPath || "");
  const target = normalizeSimplePath(targetHtmlPath);
  const currentDir = current.split("/").slice(0, -1).join("/");
  const relative = currentDir ? pathRelative(currentDir, target) : target;
  return normalizeSimplePath(relative);
}
