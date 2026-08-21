import { parse, ParserOptions } from "@babel/parser";
import type * as t from "@babel/types";

/**
 * Remove surrounding quotes ('", `) and whitespace from a string
 */
export const stripQuotes = (str: string): string =>
  str.trim().replace(/^['"`]|['"`]$/g, "");

const PARSER_OPTIONS: ParserOptions = {
  sourceType: "unambiguous",
  plugins: [
    "typescript",
    "jsx",
    "classProperties",
    "decorators-legacy",
    "dynamicImport",
    "exportDefaultFrom",
    "exportNamespaceFrom",
  ],
  errorRecovery: true,
};

/**
 * Parse source code into a Babel AST
 */
export const parseAst = (code: string): t.File => {
  try {
    return parse(code, PARSER_OPTIONS);
  } catch {
    return {
      type: "File",
      program: {
        type: "Program",
        body: [],
        directives: [],
        sourceType: "module",
        sourceFile: "",
      },
      comments: null,
      tokens: null,
    } as unknown as t.File;
  }
};

/**
 * Extract string value or placeholder representation from an AST node
 */
export const extractNodeString = (
  node: t.Node | null | undefined,
): string | undefined => {
  if (!node) return undefined;

  if (node.type === "StringLiteral") {
    if (node.extra && typeof node.extra.raw === "string") {
      return (node.extra.raw as string).slice(1, -1);
    }
    return node.value;
  }

  if (node.type === "TemplateLiteral") {
    return node.quasis
      .map(
        (q, i) =>
          q.value.raw +
          (node.expressions[i]
            ? `\${${extractNodeString(node.expressions[i]) ?? ""}}`
            : ""),
      )
      .join("");
  }

  if (node.type === "Identifier") {
    return node.name;
  }

  if (node.type === "MemberExpression") {
    const obj = extractNodeString(node.object);
    const prop = extractNodeString(node.property);
    return obj && prop ? `${obj}.${prop}` : undefined;
  }

  if (
    node.type === "TSAsExpression" ||
    node.type === "TSTypeAssertion" ||
    node.type === "TSNonNullExpression"
  ) {
    return extractNodeString(node.expression);
  }

  if (node.type === "JSXExpressionContainer") {
    return extractNodeString(node.expression);
  }

  if (node.type === "JSXText") {
    return node.value.trim();
  }

  return undefined;
};

/**
 * Parse namespaces from an AST argument node (e.g. 'common', ['ns1', 'ns2'])
 */
export const parseNamespacesFromNode = (
  node: t.Node | null | undefined,
): string[] => {
  if (!node) return [];

  if (node.type === "StringLiteral" || node.type === "TemplateLiteral") {
    const val = extractNodeString(node);
    return val ? [val] : [];
  }

  if (node.type === "ArrayExpression") {
    return node.elements
      .map(extractNodeString)
      .filter(Boolean) as string[];
  }

  if (
    node.type === "NullLiteral" ||
    (node.type === "Identifier" &&
      (node.name === "undefined" || node.name === "null"))
  ) {
    return [];
  }

  return [];
};

/**
 * Parse keyPrefix property from an AST options node (e.g. `{ keyPrefix: 'foo.bar' }` or `{ keyPrefix }`)
 */
export const parseKeyPrefixFromNode = (
  node: t.Node | null | undefined,
): string | undefined => {
  if (!node || node.type !== "ObjectExpression") return undefined;

  for (const prop of node.properties) {
    if (prop.type === "ObjectProperty") {
      const keyName =
        prop.key.type === "Identifier"
          ? prop.key.name
          : prop.key.type === "StringLiteral"
            ? prop.key.value
            : undefined;

      if (keyName === "keyPrefix") {
        if (prop.shorthand && prop.key.type === "Identifier") {
          return prop.key.name;
        }
        return extractNodeString(prop.value);
      }
    }
  }

  return undefined;
};

/**
 * Extract an attribute value from a JSX opening element
 */
export const extractJsxAttr = (
  openingElement: t.JSXOpeningElement,
  attrName: string,
): string | undefined => {
  for (const attr of openingElement.attributes) {
    if (
      attr.type === "JSXAttribute" &&
      attr.name &&
      attr.name.type === "JSXIdentifier" &&
      attr.name.name === attrName
    ) {
      if (!attr.value) return undefined;
      if (attr.value.type === "StringLiteral") {
        return attr.value.value;
      }
      if (attr.value.type === "JSXExpressionContainer") {
        return extractNodeString(attr.value.expression);
      }
    }
  }

  return undefined;
};

/**
 * Extract namespaces from JSX opening element (ns="..." or ns={['...']})
 */
export const extractJsxNsAttr = (
  openingElement: t.JSXOpeningElement,
): string[] => {
  for (const attr of openingElement.attributes) {
    if (
      attr.type === "JSXAttribute" &&
      attr.name &&
      attr.name.type === "JSXIdentifier" &&
      attr.name.name === "ns"
    ) {
      if (!attr.value) return [];
      if (attr.value.type === "StringLiteral") {
        return [attr.value.value];
      }
      if (attr.value.type === "JSXExpressionContainer") {
        return parseNamespacesFromNode(attr.value.expression);
      }
    }
  }

  return [];
};
