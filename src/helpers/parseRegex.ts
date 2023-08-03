/**
 * Transform the escaped string provided into a valid regex
 * @param {string} str
 * @return {RegExp}
 */
export const parseRegex = (str: string): RegExp => {
  const parts = str.split("/");
  return new RegExp(`${parts[1]}`.replace(/\\\\/g, "\\"), parts[2]);
};
