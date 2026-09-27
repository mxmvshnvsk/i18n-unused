import _traverse, { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";
import { KeyUsage, ExtractKeysResult } from "../types";
import { buildKeyCandidates, isDynamicKeyUsage } from "./keyCandidates";
import {
  parseAst,
  extractNodeString,
  parseNamespacesFromNode,
  parseKeyPrefixFromNode,
  extractJsxAttr,
  extractJsxNsAttr,
} from "./codeParser";

const traverse = ((_traverse as unknown as { default?: typeof _traverse })
  .default || _traverse) as typeof _traverse;

export { KeyUsage, ExtractKeysResult };
export { buildKeyCandidates, isDynamicKeyUsage };

export interface ScopeBinding {
  fnName: string;
  keyPrefix?: string;
  namespaces: string[];
  startPos: number;
  endPos: number;
}

export const STANDARD_TRANSLATION_FNS = /^(t|\$t|\$_|\$tc|tc)$/;

export const isMatchingCallee = (callee: t.Node, name: string): boolean => {
  if (callee.type === "Identifier" && callee.name === name) return true;
  if (
    callee.type === "MemberExpression" &&
    callee.property.type === "Identifier" &&
    callee.property.name === name
  ) {
    return true;
  }
  return false;
};

export const extractCalleeName = (callee: t.Node): string | undefined => {
  if (callee.type === "Identifier") return callee.name;
  if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
    return callee.property.name;
  }
  if (
    (callee as { type: string; property?: t.Node }).type ===
      "OptionalMemberExpression" &&
    (callee as { property?: t.Node }).property?.type === "Identifier"
  ) {
    return (callee as { property: t.Identifier }).property.name;
  }
  return undefined;
};

export const findActiveBinding = (
  bindings: ScopeBinding[],
  pos: number,
  fnName = "t",
): ScopeBinding | undefined => {
  let activeBinding: ScopeBinding | undefined;
  let smallestScopeSize = Infinity;

  for (const binding of bindings) {
    if (
      binding.fnName === fnName &&
      pos >= binding.startPos &&
      pos <= binding.endPos
    ) {
      const scopeSize = binding.endPos - binding.startPos;
      if (scopeSize < smallestScopeSize) {
        smallestScopeSize = scopeSize;
        activeBinding = binding;
      }
    }
  }

  return activeBinding;
};

/**
 * Extract bound translation function name(s) from variable declarations around hooks
 */
export const extractHookBoundFunctionNames = (
  path: NodePath<t.CallExpression | t.OptionalCallExpression>,
): string[] => {
  const fnNames: string[] = [];
  const parent = path.parent;

  if (parent && parent.type === "VariableDeclarator") {
    const id = parent.id;
    if (id.type === "ObjectPattern") {
      for (const prop of id.properties) {
        if (prop.type === "ObjectProperty") {
          const propKey =
            prop.key.type === "Identifier"
              ? prop.key.name
              : prop.key.type === "StringLiteral"
                ? prop.key.value
                : undefined;
          if (propKey === "t" && prop.value.type === "Identifier") {
            fnNames.push(prop.value.name);
          }
        }
      }
      if (fnNames.length === 0) {
        const hasT = id.properties.some(
          (p) =>
            p.type === "ObjectProperty" &&
            ((p.key.type === "Identifier" && p.key.name === "t") ||
              (p.key.type === "StringLiteral" && p.key.value === "t")),
        );
        if (hasT) fnNames.push("t");
      }
    } else if (id.type === "ArrayPattern") {
      const first = id.elements[0];
      if (first && first.type === "Identifier") {
        fnNames.push(first.name);
      }
    } else if (id.type === "Identifier") {
      fnNames.push(id.name);
    }
  } else if (
    path.parentPath.isMemberExpression() &&
    path.parentPath.node.property.type === "Identifier" &&
    path.parentPath.node.property.name === "t"
  ) {
    const grandParent = path.parentPath.parent;
    if (
      grandParent &&
      grandParent.type === "VariableDeclarator" &&
      grandParent.id.type === "Identifier"
    ) {
      fnNames.push(grandParent.id.name);
    } else {
      fnNames.push("t");
    }
  }

  return fnNames.length > 0 ? fnNames : ["t"];
};

/**
 * Extract scope bindings created by a useTranslation hook invocation
 */
export const extractUseTranslationBindings = (
  path: NodePath<t.CallExpression | t.OptionalCallExpression>,
  fileContent: string,
): ScopeBinding[] => {
  const args = path.node.arguments;
  const fnNames = extractHookBoundFunctionNames(path);

  let namespaces: string[] = [];
  let keyPrefix: string | undefined;

  if (args.length > 0) {
    if (args[0].type === "ObjectExpression") {
      keyPrefix = parseKeyPrefixFromNode(args[0]);
    } else {
      namespaces = parseNamespacesFromNode(args[0] as t.Node);
      if (args.length > 1) {
        keyPrefix = parseKeyPrefixFromNode(args[1] as t.Node);
      }
    }
  }

  const block = path.scope.block;
  const startPos = block.start ?? 0;
  const endPos = block.end ?? fileContent.length;

  return fnNames.map((fnName) => ({
    fnName,
    keyPrefix,
    namespaces,
    startPos,
    endPos,
  }));
};

/**
 * Extract scope bindings created by a withTranslation HOC wrapper
 */
export const extractWithTranslationBindings = (
  path: NodePath<t.CallExpression | t.OptionalCallExpression>,
  fileContent: string,
): ScopeBinding[] => {
  const args = path.node.arguments;
  const fnNames = ["t"];
  const namespaces =
    args.length > 0 ? parseNamespacesFromNode(args[0] as t.Node) : [];
  const keyPrefix =
    args.length > 1 ? parseKeyPrefixFromNode(args[1] as t.Node) : undefined;

  if (path.parentPath.isCallExpression()) {
    const wrapperArg = path.parentPath.node.arguments[0];
    if (
      wrapperArg &&
      (wrapperArg.type === "ArrowFunctionExpression" ||
        wrapperArg.type === "FunctionExpression")
    ) {
      const param0 = wrapperArg.params[0];
      if (param0 && param0.type === "ObjectPattern") {
        for (const prop of param0.properties) {
          if (prop.type === "ObjectProperty") {
            const propKey =
              prop.key.type === "Identifier"
                ? prop.key.name
                : prop.key.type === "StringLiteral"
                  ? prop.key.value
                  : undefined;
            if (propKey === "t" && prop.value.type === "Identifier") {
              fnNames.push(prop.value.name);
            }
          }
        }
      }
    }
  }

  const block = path.scope.block;
  const startPos = block.start ?? 0;
  const endPos = block.end ?? fileContent.length;

  return fnNames.map((fnName) => ({
    fnName,
    keyPrefix,
    namespaces,
    startPos,
    endPos,
  }));
};

/**
 * Extract scope bindings created by getFixedT calls
 */
export const extractGetFixedTBindings = (
  path: NodePath<t.CallExpression | t.OptionalCallExpression>,
  fileContent: string,
): ScopeBinding[] => {
  const args = path.node.arguments;
  let fnName = "t";
  const parent = path.parent;
  if (parent && parent.type === "VariableDeclarator" && parent.id.type === "Identifier") {
    fnName = parent.id.name;
  }

  const rawNs = args[1] as t.Node;
  const rawPrefix = args[2] as t.Node;
  const namespaces = parseNamespacesFromNode(rawNs);
  let keyPrefix = extractNodeString(rawPrefix);
  if (keyPrefix === "null" || keyPrefix === "undefined") {
    keyPrefix = undefined;
  }

  const block = path.scope.block;
  const startPos = block.start ?? 0;
  const endPos = block.end ?? fileContent.length;

  return [{ fnName, keyPrefix, namespaces, startPos, endPos }];
};

/**
 * Extract scope binding created by a <Translation> JSX render-prop element
 */
export const extractTranslationElementBinding = (
  path: NodePath<t.JSXElement>,
  fileContent: string,
): ScopeBinding | undefined => {
  const opening = path.node.openingElement;
  if (
    opening.name.type !== "JSXIdentifier" ||
    opening.name.name !== "Translation"
  ) {
    return undefined;
  }

  const namespaces = extractJsxNsAttr(opening);
  const keyPrefix = extractJsxAttr(opening, "keyPrefix");
  let fnName = "t";

  for (const child of path.node.children) {
    if (child.type === "JSXExpressionContainer") {
      const expr = child.expression;
      if (
        expr.type === "ArrowFunctionExpression" ||
        expr.type === "FunctionExpression"
      ) {
        const param0 = expr.params[0];
        if (param0) {
          if (param0.type === "Identifier") {
            fnName = param0.name;
          } else if (param0.type === "ObjectPattern") {
            for (const prop of param0.properties) {
              if (prop.type === "ObjectProperty") {
                const propKey =
                  prop.key.type === "Identifier"
                    ? prop.key.name
                    : prop.key.type === "StringLiteral"
                      ? prop.key.value
                      : undefined;
                if (propKey === "t" && prop.value.type === "Identifier") {
                  fnName = prop.value.name;
                }
              }
            }
          }
        }
      }
    }
  }

  const startPos = path.node.start ?? 0;
  const endPos = path.node.end ?? fileContent.length;

  return { fnName, keyPrefix, namespaces, startPos, endPos };
};

/**
 * Collect all scope bindings created by useTranslation, withTranslation, getFixedT, and <Translation>
 */
export const collectScopeBindings = (
  ast: t.File,
  fileContent: string,
): ScopeBinding[] => {
  const bindings: ScopeBinding[] = [];

  const handleCall = (
    path: NodePath<t.CallExpression | t.OptionalCallExpression>,
  ): void => {
    const { callee } = path.node;

    if (isMatchingCallee(callee, "useTranslation")) {
      bindings.push(...extractUseTranslationBindings(path, fileContent));
    } else if (isMatchingCallee(callee, "withTranslation")) {
      bindings.push(...extractWithTranslationBindings(path, fileContent));
    } else if (isMatchingCallee(callee, "getFixedT")) {
      bindings.push(...extractGetFixedTBindings(path, fileContent));
    }
  };

  traverse(ast, {
    CallExpression: handleCall,
    OptionalCallExpression: handleCall,
    JSXElement(path) {
      const binding = extractTranslationElementBinding(path, fileContent);
      if (binding) {
        bindings.push(binding);
      }
    },
  });

  return bindings;
};

/**
 * Extract key usage from a <Trans> JSX element
 */
export const extractTransUsage = (
  path: NodePath<t.JSXElement>,
  fileContent: string,
  scopeBindings: ScopeBinding[],
): KeyUsage | undefined => {
  const opening = path.node.openingElement;
  if (opening.name.type !== "JSXIdentifier" || opening.name.name !== "Trans") {
    return undefined;
  }

  const rawKey = extractJsxAttr(opening, "i18nKey");
  if (!rawKey) {
    return undefined;
  }

  const prefixAttr = extractJsxAttr(opening, "keyPrefix");
  const nsAttr = extractJsxNsAttr(opening);
  const transPos = path.node.start ?? 0;
  const activeBinding = findActiveBinding(scopeBindings, transPos, "t");

  const keyPrefix = prefixAttr ?? activeBinding?.keyPrefix;
  const namespaces =
    nsAttr.length > 0 ? nsAttr : activeBinding?.namespaces ?? [];

  const candidates = buildKeyCandidates(rawKey, keyPrefix, namespaces);
  const isDynamic = isDynamicKeyUsage(rawKey, keyPrefix, namespaces);
  const raw = fileContent.slice(
    path.node.start ?? 0,
    path.node.end ?? fileContent.length,
  );

  return { raw, rawKey, candidates, isDynamic };
};

/**
 * Extract key usage from a translation function call expression
 */
export const extractCallUsage = (
  path: NodePath<t.CallExpression | t.OptionalCallExpression>,
  fileContent: string,
  scopeBindings: ScopeBinding[],
): KeyUsage | undefined => {
  const node = path.node;
  const callee = node.callee;
  const calleeName = extractCalleeName(callee);

  if (!calleeName) {
    return undefined;
  }

  const callPos = node.start ?? 0;
  const activeBinding = findActiveBinding(scopeBindings, callPos, calleeName);

  if (!activeBinding && !STANDARD_TRANSLATION_FNS.test(calleeName)) {
    return undefined;
  }

  const firstArg = node.arguments[0];
  if (!firstArg) {
    return undefined;
  }

  const rawKey = extractNodeString(firstArg as t.Node);
  if (rawKey === undefined) {
    return undefined;
  }

  const keyPrefix = activeBinding?.keyPrefix;
  const namespaces = activeBinding?.namespaces ?? [];
  const candidates = buildKeyCandidates(rawKey, keyPrefix, namespaces);
  const isDynamic = isDynamicKeyUsage(rawKey, keyPrefix, namespaces);
  const raw = fileContent.slice(
    node.start ?? 0,
    node.end ?? fileContent.length,
  );

  return { raw, rawKey, candidates, isDynamic };
};

/**
 * Collect all translation key usages from AST elements and call expressions
 */
export const collectUsages = (
  ast: t.File,
  fileContent: string,
  scopeBindings: ScopeBinding[],
): KeyUsage[] => {
  const usages: KeyUsage[] = [];

  const handleCall = (
    path: NodePath<t.CallExpression | t.OptionalCallExpression>,
  ): void => {
    const usage = extractCallUsage(path, fileContent, scopeBindings);
    if (usage) {
      usages.push(usage);
    }
  };

  traverse(ast, {
    JSXElement(path) {
      const usage = extractTransUsage(path, fileContent, scopeBindings);
      if (usage) {
        usages.push(usage);
      }
    },
    CallExpression: handleCall,
    OptionalCallExpression: handleCall,
  });

  return usages;
};

/**
 * Extract all translation key usages including i18next keyPrefix and namespace expansions
 */
export const extractTranslationUsages = (
  fileContent: string,
  customTranslationKeyMatcher?: RegExp,
): ExtractKeysResult => {
  const ast = parseAst(fileContent);
  const scopeBindings = collectScopeBindings(ast, fileContent);
  const usages = collectUsages(ast, fileContent, scopeBindings);

  const allKeys = new Set<string>();
  for (const usage of usages) {
    for (const candidate of usage.candidates) {
      allKeys.add(candidate);
    }
  }

  if (customTranslationKeyMatcher) {
    const customMatches = fileContent.match(customTranslationKeyMatcher) || [];
    for (const match of customMatches) {
      allKeys.add(match);
    }
  }

  return { usages, allKeys };
};
