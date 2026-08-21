import * as t from "@babel/types";
import {
  stripQuotes,
  parseAst,
  extractNodeString,
  parseNamespacesFromNode,
  parseKeyPrefixFromNode,
  extractJsxAttr,
  extractJsxNsAttr,
} from "../../src/helpers/codeParser";

describe("codeParser AST helper", () => {
  describe("stripQuotes", () => {
    it("strips single quotes", () => {
      expect(stripQuotes("'hello'")).toBe("hello");
    });

    it("strips double quotes", () => {
      expect(stripQuotes('"world"')).toBe("world");
    });

    it("strips backticks", () => {
      expect(stripQuotes("`template`")).toBe("template");
    });

    it("trims whitespace around the string", () => {
      expect(stripQuotes("  'trimmed'  ")).toBe("trimmed");
    });

    it("returns string without quotes unchanged", () => {
      expect(stripQuotes("noQuotes")).toBe("noQuotes");
    });
  });

  describe("parseAst", () => {
    it("parses valid TypeScript and JSX code into an AST File", () => {
      const code = `const Comp: React.FC = () => <div className="btn">Hello</div>;`;
      const ast = parseAst(code);
      expect(ast.type).toBe("File");
      expect(ast.program.body.length).toBeGreaterThan(0);
    });

    it("gracefully returns an empty Program AST on syntax errors", () => {
      const code = `const = ;;;`;
      const ast = parseAst(code);
      expect(ast.type).toBe("File");
      expect(ast.program.type).toBe("Program");
      expect(ast.program.body).toHaveLength(0);
    });
  });

  describe("extractNodeString", () => {
    it("extracts string literal value", () => {
      const node = t.stringLiteral("auth.login");
      expect(extractNodeString(node)).toBe("auth.login");
    });

    it("extracts static template literal", () => {
      const ast = parseAst("const x = `common.btn`;");
      const decl = ast.program.body[0] as t.VariableDeclaration;
      const init = (decl.declarations[0] as t.VariableDeclarator).init;
      expect(extractNodeString(init)).toBe("common.btn");
    });

    it("extracts dynamic template literal with placeholders", () => {
      const ast = parseAst("const x = `items.${category}.title`;");
      const decl = ast.program.body[0] as t.VariableDeclaration;
      const init = (decl.declarations[0] as t.VariableDeclarator).init;
      expect(extractNodeString(init)).toBe("items.${category}.title");
    });

    it("extracts template literal with complex nested expressions", () => {
      const ast = parseAst("const x = `prefix_${format({ a: 1 })}.key`;");
      const decl = ast.program.body[0] as t.VariableDeclaration;
      const init = (decl.declarations[0] as t.VariableDeclarator).init;
      expect(extractNodeString(init)).toContain("prefix_");
      expect(extractNodeString(init)).toContain(".key");
    });

    it("extracts identifier name", () => {
      const node = t.identifier("myKey");
      expect(extractNodeString(node)).toBe("myKey");
    });

    it("extracts member expression", () => {
      const ast = parseAst("const x = config.prefix;");
      const decl = ast.program.body[0] as t.VariableDeclaration;
      const init = (decl.declarations[0] as t.VariableDeclarator).init;
      expect(extractNodeString(init)).toBe("config.prefix");
    });

    it("unwraps TSAsExpression ('key' as any)", () => {
      const ast = parseAst("const x = 'login.submit' as any;");
      const decl = ast.program.body[0] as t.VariableDeclaration;
      const init = (decl.declarations[0] as t.VariableDeclarator).init;
      expect(extractNodeString(init)).toBe("login.submit");
    });

    it("unwraps TSTypeAssertion (<string>'key')", () => {
      const node = {
        type: "TSTypeAssertion",
        typeAnnotation: null,
        expression: t.stringLiteral("login.submit"),
      } as unknown as t.TSTypeAssertion;
      expect(extractNodeString(node)).toBe("login.submit");
    });

    it("unwraps TSNonNullExpression (key!)", () => {
      const ast = parseAst("const x = dynamicKey!;");
      const decl = ast.program.body[0] as t.VariableDeclaration;
      const init = (decl.declarations[0] as t.VariableDeclarator).init;
      expect(extractNodeString(init)).toBe("dynamicKey");
    });

    it("returns undefined for null or unsupported nodes", () => {
      expect(extractNodeString(null)).toBeUndefined();
      expect(extractNodeString(undefined)).toBeUndefined();
      expect(extractNodeString(t.numericLiteral(123))).toBeUndefined();
    });
  });

  describe("parseNamespacesFromNode", () => {
    it("parses single string literal namespace", () => {
      const node = t.stringLiteral("common");
      expect(parseNamespacesFromNode(node)).toEqual(["common"]);
    });

    it("parses array of string literals", () => {
      const node = t.arrayExpression([
        t.stringLiteral("common"),
        t.stringLiteral("auth"),
      ]);
      expect(parseNamespacesFromNode(node)).toEqual(["common", "auth"]);
    });

    it("returns empty array for null or undefined nodes", () => {
      expect(parseNamespacesFromNode(null)).toEqual([]);
      expect(parseNamespacesFromNode(undefined)).toEqual([]);
      expect(parseNamespacesFromNode(t.nullLiteral())).toEqual([]);
      expect(parseNamespacesFromNode(t.identifier("undefined"))).toEqual([]);
    });
  });

  describe("parseKeyPrefixFromNode", () => {
    it("parses keyPrefix string literal from options object", () => {
      const ast = parseAst("const opts = { keyPrefix: 'auth.login' };");
      const decl = ast.program.body[0] as t.VariableDeclaration;
      const init = (decl.declarations[0] as t.VariableDeclarator).init;
      expect(parseKeyPrefixFromNode(init)).toBe("auth.login");
    });

    it("parses keyPrefix property shorthand { keyPrefix }", () => {
      const ast = parseAst("const opts = { keyPrefix };");
      const decl = ast.program.body[0] as t.VariableDeclaration;
      const init = (decl.declarations[0] as t.VariableDeclarator).init;
      expect(parseKeyPrefixFromNode(init)).toBe("keyPrefix");
    });

    it("parses keyPrefix variable reference { keyPrefix: MY_PREFIX }", () => {
      const ast = parseAst("const opts = { keyPrefix: MY_PREFIX };");
      const decl = ast.program.body[0] as t.VariableDeclaration;
      const init = (decl.declarations[0] as t.VariableDeclarator).init;
      expect(parseKeyPrefixFromNode(init)).toBe("MY_PREFIX");
    });

    it("returns undefined when keyPrefix is absent in options", () => {
      const ast = parseAst("const opts = { ns: 'common' };");
      const decl = ast.program.body[0] as t.VariableDeclaration;
      const init = (decl.declarations[0] as t.VariableDeclarator).init;
      expect(parseKeyPrefixFromNode(init)).toBeUndefined();
    });

    it("returns undefined for non-object nodes", () => {
      expect(parseKeyPrefixFromNode(null)).toBeUndefined();
      expect(parseKeyPrefixFromNode(t.stringLiteral("common"))).toBeUndefined();
    });
  });

  describe("extractJsxAttr and extractJsxNsAttr", () => {
    it("extracts string and expression attributes from JSX element", () => {
      const code = `<Trans i18nKey="submit" keyPrefix="login" ns="auth" />`;
      const ast = parseAst(code);
      const expr = (ast.program.body[0] as t.ExpressionStatement).expression as t.JSXElement;
      const opening = expr.openingElement;

      expect(extractJsxAttr(opening, "i18nKey")).toBe("submit");
      expect(extractJsxAttr(opening, "keyPrefix")).toBe("login");
      expect(extractJsxNsAttr(opening)).toEqual(["auth"]);
    });

    it("extracts array namespace JSX expression attribute", () => {
      const code = `<Trans ns={['common', 'auth']} i18nKey={'save'} />`;
      const ast = parseAst(code);
      const expr = (ast.program.body[0] as t.ExpressionStatement).expression as t.JSXElement;
      const opening = expr.openingElement;

      expect(extractJsxAttr(opening, "i18nKey")).toBe("save");
      expect(extractJsxNsAttr(opening)).toEqual(["common", "auth"]);
    });

    it("returns undefined or empty array when attributes are absent", () => {
      const code = `<Trans i18nKey="submit" />`;
      const ast = parseAst(code);
      const expr = (ast.program.body[0] as t.ExpressionStatement).expression as t.JSXElement;
      const opening = expr.openingElement;

      expect(extractJsxAttr(opening, "keyPrefix")).toBeUndefined();
      expect(extractJsxNsAttr(opening)).toEqual([]);
    });
  });
});
