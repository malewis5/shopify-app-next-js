export function getHref(target: EventTarget | null) {
  if (!(target instanceof Element) || !("href" in target)) return null;

  const href = target.attributes.getNamedItem("href")?.value ?? target.href;
  return typeof href === "string" && href ? href : null;
}
