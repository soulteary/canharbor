// SPDX-License-Identifier: AGPL-3.0-or-later
/** Stands in for a command inside a translated sentence. */
export const CODE_SLOT = "\u0001";
/**
 * Place a command in a `<code>` element inside a sentence that was rendered
 * whole with `CODE_SLOT` as the command's value.
 */
export function aroundCode(sentence: string, command: string) {
  const [before, after = ""] = sentence.split(CODE_SLOT);
  return (
    <>
      {before}
      <code>{command}</code>
      {after}
    </>
  );
}
