import _traverse from "@babel/traverse";
import {
  isMatchingCallee,
  extractCalleeName,
  findActiveBinding,
  extractHookBoundFunctionNames,
  extractUseTranslationBindings,
  extractWithTranslationBindings,
  extractGetFixedTBindings,
  extractTranslationElementBinding,
  collectScopeBindings,
  extractTransUsage,
  extractCallUsage,
  collectUsages,
  extractTranslationUsages,
  ScopeBinding,
} from "../../src/helpers/extractKeys";
import { parseAst } from "../../src/helpers/codeParser";

const traverse = ((_traverse as any).default || _traverse) as typeof _traverse;

describe("extractKeys helper module", () => {
  describe("isMatchingCallee and extractCalleeName", () => {
    it("identifies matching simple identifier callee", () => {
      const ast = parseAst("useTranslation('common');");
      const expr = (ast.program.body[0] as any).expression;
      expect(isMatchingCallee(expr.callee, "useTranslation")).toBe(true);
      expect(isMatchingCallee(expr.callee, "withTranslation")).toBe(false);
      expect(extractCalleeName(expr.callee)).toBe("useTranslation");
    });

    it("identifies matching member expression callee", () => {
      const ast = parseAst("reactI18next.useTranslation('common');");
      const expr = (ast.program.body[0] as any).expression;
      expect(isMatchingCallee(expr.callee, "useTranslation")).toBe(true);
      expect(extractCalleeName(expr.callee)).toBe("useTranslation");
    });

    it("extracts callee property from optional member expression", () => {
      const ast = parseAst("props?.t('submit');");
      const expr = (ast.program.body[0] as any).expression;
      expect(extractCalleeName(expr.callee)).toBe("t");
    });

    it("returns undefined for unsupported callee types", () => {
      const ast = parseAst("(function() {})('submit');");
      const expr = (ast.program.body[0] as any).expression;
      expect(extractCalleeName(expr.callee)).toBeUndefined();
    });
  });

  describe("findActiveBinding", () => {
    const bindings: ScopeBinding[] = [
      {
        fnName: "t",
        namespaces: ["common"],
        keyPrefix: "header",
        startPos: 10,
        endPos: 100,
      },
      {
        fnName: "t",
        namespaces: ["auth"],
        keyPrefix: "login",
        startPos: 30,
        endPos: 60,
      },
      {
        fnName: "customT",
        namespaces: ["settings"],
        startPos: 0,
        endPos: 200,
      },
    ];

    it("finds the innermost (most specific) scope binding", () => {
      const active = findActiveBinding(bindings, 45, "t");
      expect(active).toBeDefined();
      expect(active?.keyPrefix).toBe("login");
      expect(active?.namespaces).toEqual(["auth"]);
    });

    it("finds the enclosing scope binding when outside inner scope", () => {
      const active = findActiveBinding(bindings, 80, "t");
      expect(active).toBeDefined();
      expect(active?.keyPrefix).toBe("header");
      expect(active?.namespaces).toEqual(["common"]);
    });

    it("finds binding matching specific function identifier", () => {
      const active = findActiveBinding(bindings, 50, "customT");
      expect(active).toBeDefined();
      expect(active?.namespaces).toEqual(["settings"]);
    });

    it("returns undefined when position is outside all scopes", () => {
      const active = findActiveBinding(bindings, 300, "t");
      expect(active).toBeUndefined();
    });
  });

  describe("extractHookBoundFunctionNames", () => {
    it("extracts aliased name from object destructuring { t: customT }", () => {
      const code = `const { t: customT } = useTranslation('auth');`;
      const ast = parseAst(code);
      let extracted: string[] = [];
      traverse(ast, {
        CallExpression(path) {
          extracted = extractHookBoundFunctionNames(path);
        },
      });
      expect(extracted).toEqual(["customT"]);
    });

    it("extracts first identifier from array destructuring [t]", () => {
      const code = `const [tHook] = useTranslation('auth');`;
      const ast = parseAst(code);
      let extracted: string[] = [];
      traverse(ast, {
        CallExpression(path) {
          extracted = extractHookBoundFunctionNames(path);
        },
      });
      expect(extracted).toEqual(["tHook"]);
    });

    it("extracts variable name when assigned directly", () => {
      const code = `const myT = useTranslation('auth');`;
      const ast = parseAst(code);
      let extracted: string[] = [];
      traverse(ast, {
        CallExpression(path) {
          extracted = extractHookBoundFunctionNames(path);
        },
      });
      expect(extracted).toEqual(["myT"]);
    });

    it("extracts variable name when accessing .t property", () => {
      const code = `const tDirect = useTranslation('auth').t;`;
      const ast = parseAst(code);
      let extracted: string[] = [];
      traverse(ast, {
        CallExpression(path) {
          extracted = extractHookBoundFunctionNames(path);
        },
      });
      expect(extracted).toEqual(["tDirect"]);
    });

    it("defaults to ['t'] when no variable declaration exists", () => {
      const code = `useTranslation('auth');`;
      const ast = parseAst(code);
      let extracted: string[] = [];
      traverse(ast, {
        CallExpression(path) {
          extracted = extractHookBoundFunctionNames(path);
        },
      });
      expect(extracted).toEqual(["t"]);
    });
  });

  describe("extractUseTranslationBindings", () => {
    it("extracts namespace and keyPrefix options", () => {
      const code = `
        function Login() {
          const { t } = useTranslation('auth', { keyPrefix: 'login' });
        }
      `;
      const ast = parseAst(code);
      let bindings: ScopeBinding[] = [];
      traverse(ast, {
        CallExpression(path) {
          bindings = extractUseTranslationBindings(path, code);
        },
      });

      expect(bindings).toHaveLength(1);
      expect(bindings[0].fnName).toBe("t");
      expect(bindings[0].namespaces).toEqual(["auth"]);
      expect(bindings[0].keyPrefix).toBe("login");
    });

    it("extracts options object only ({ keyPrefix: 'settings' })", () => {
      const code = `const { t } = useTranslation({ keyPrefix: 'settings' });`;
      const ast = parseAst(code);
      let bindings: ScopeBinding[] = [];
      traverse(ast, {
        CallExpression(path) {
          bindings = extractUseTranslationBindings(path, code);
        },
      });

      expect(bindings).toHaveLength(1);
      expect(bindings[0].keyPrefix).toBe("settings");
      expect(bindings[0].namespaces).toEqual([]);
    });
  });

  describe("extractWithTranslationBindings", () => {
    it("extracts wrapper callback destructured alias", () => {
      const code = `
        const Comp = withTranslation('common', { keyPrefix: 'nav' })(({ t: navT }) => null);
      `;
      const ast = parseAst(code);
      let bindings: ScopeBinding[] = [];
      traverse(ast, {
        CallExpression(path) {
          if (isMatchingCallee(path.node.callee, "withTranslation")) {
            bindings = extractWithTranslationBindings(path, code);
          }
        },
      });

      expect(bindings.some((b) => b.fnName === "navT")).toBe(true);
      expect(bindings[0].namespaces).toEqual(["common"]);
      expect(bindings[0].keyPrefix).toBe("nav");
    });
  });

  describe("extractGetFixedTBindings", () => {
    it("extracts getFixedT arguments and variable name", () => {
      const code = `const customFixed = getFixedT('en', 'cart', 'items');`;
      const ast = parseAst(code);
      let bindings: ScopeBinding[] = [];
      traverse(ast, {
        CallExpression(path) {
          bindings = extractGetFixedTBindings(path, code);
        },
      });

      expect(bindings).toEqual([
        expect.objectContaining({
          fnName: "customFixed",
          namespaces: ["cart"],
          keyPrefix: "items",
        }),
      ]);
    });
  });

  describe("extractTranslationElementBinding", () => {
    it("extracts <Translation> render-prop component binding", () => {
      const code = `<Translation ns="auth" keyPrefix="form">{(t) => null}</Translation>`;
      const ast = parseAst(code);
      let binding: ScopeBinding | undefined;
      traverse(ast, {
        JSXElement(path) {
          binding = extractTranslationElementBinding(path, code);
        },
      });

      expect(binding).toEqual(
        expect.objectContaining({
          fnName: "t",
          namespaces: ["auth"],
          keyPrefix: "form",
        }),
      );
    });

    it("extracts custom identifier parameter name from render prop", () => {
      const code = `<Translation ns="auth">{customT => null}</Translation>`;
      const ast = parseAst(code);
      let binding: ScopeBinding | undefined;
      traverse(ast, {
        JSXElement(path) {
          binding = extractTranslationElementBinding(path, code);
        },
      });

      expect(binding?.fnName).toBe("customT");
    });

    it("returns undefined for non-Translation elements", () => {
      const code = `<div>Hello</div>`;
      const ast = parseAst(code);
      let binding: ScopeBinding | undefined;
      traverse(ast, {
        JSXElement(path) {
          binding = extractTranslationElementBinding(path, code);
        },
      });

      expect(binding).toBeUndefined();
    });
  });

  describe("extractTransUsage and extractCallUsage", () => {
    const scopes: ScopeBinding[] = [
      {
        fnName: "t",
        namespaces: ["auth"],
        keyPrefix: "login",
        startPos: 0,
        endPos: 200,
      },
    ];

    it("extractTransUsage extracts self-closing <Trans /> element", () => {
      const code = `<Trans i18nKey="submit" />`;
      const ast = parseAst(code);
      let usage: any;
      traverse(ast, {
        JSXElement(path) {
          usage = extractTransUsage(path, code, scopes);
        },
      });

      expect(usage).toBeDefined();
      expect(usage.rawKey).toBe("submit");
      expect(usage.candidates).toEqual([
        "auth.login.submit",
        "login.submit",
        "submit",
      ]);
    });

    it("extractTransUsage extracts <Trans> with JSX expression containers", () => {
      const code = `<Trans i18nKey={'submit'} ns={'auth'} keyPrefix={'login'} />`;
      const ast = parseAst(code);
      let usage: any;
      traverse(ast, {
        JSXElement(path) {
          usage = extractTransUsage(path, code, []);
        },
      });

      expect(usage).toBeDefined();
      expect(usage.rawKey).toBe("submit");
      expect(usage.candidates).toContain("auth.login.submit");
    });

    it("extractCallUsage extracts function call key with scope inheritance", () => {
      const code = `t('submit');`;
      const ast = parseAst(code);
      let usage: any;
      traverse(ast, {
        CallExpression(path) {
          usage = extractCallUsage(path, code, scopes);
        },
      });

      expect(usage).toBeDefined();
      expect(usage.rawKey).toBe("submit");
      expect(usage.candidates).toEqual([
        "auth.login.submit",
        "login.submit",
        "submit",
      ]);
    });

    it("extractCallUsage handles type-asserted argument (t('key' as any))", () => {
      const code = `t('submit' as any);`;
      const ast = parseAst(code);
      let usage: any;
      traverse(ast, {
        CallExpression(path) {
          usage = extractCallUsage(path, code, scopes);
        },
      });

      expect(usage).toBeDefined();
      expect(usage.rawKey).toBe("submit");
    });
  });

  describe("collectScopeBindings and collectUsages orchestration", () => {
    it("collects all bindings across a file", () => {
      const code = `
        const { t: t1 } = useTranslation('auth', { keyPrefix: 'login' });
        const fixedT = getFixedT(null, 'cart', 'items');
      `;
      const ast = parseAst(code);
      const bindings = collectScopeBindings(ast, code);

      expect(bindings).toHaveLength(2);
      expect(bindings.map((b) => b.fnName)).toEqual(["t1", "fixedT"]);
    });

    it("collects usages across components and calls", () => {
      const code = `
        function App() {
          const { t } = useTranslation('common', { keyPrefix: 'header' });
          return (
            <div>
              {t('title')}
              <Trans i18nKey="subtitle">Subtitle</Trans>
            </div>
          );
        }
      `;
      const ast = parseAst(code);
      const bindings = collectScopeBindings(ast, code);
      const usages = collectUsages(ast, code, bindings);

      expect(usages).toHaveLength(2);
      expect(usages[0].rawKey).toBe("title");
      expect(usages[1].rawKey).toBe("subtitle");
    });
  });

  describe("extractTranslationUsages end-to-end", () => {
    it("returns allKeys set and usages list", () => {
      const code = `
        const { t } = useTranslation('auth', { keyPrefix: 'login' });
        t('submit');
      `;
      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("auth.login.submit")).toBe(true);
      expect(result.usages).toHaveLength(1);
    });

    it("handles syntax error code gracefully without throwing", () => {
      const code = `const = ;;;`;
      const result = extractTranslationUsages(code);
      expect(result.usages).toHaveLength(0);
      expect(result.allKeys.size).toBe(0);
    });
  });
});
