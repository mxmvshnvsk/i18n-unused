import { extractTranslationUsages } from "../../src/helpers/extractKeys";
import {
  collectUnusedTranslations,
  collectMissedTranslations,
} from "../../src/core/translations";
import { jest } from "@jest/globals";
import { pathToFileURL } from "url";
import fs from "fs";

jest.mock("../../src/helpers/meta", () => ({
  importMetaUrl: () => pathToFileURL(__filename).toString(),
}));

jest.mock("fs", () => ({
  ...(jest.requireActual("fs") as any),
  readFileSync: jest.fn(),
}));

jest.mock("../../src/helpers/files", () => ({
  ...(jest.requireActual("../../src/helpers/files") as any),
  resolveFile: jest.fn(),
}));

describe("keyPrefix and namespace support", () => {
  describe("extractTranslationUsages", () => {
    it("extracts useTranslation with namespace and keyPrefix", () => {
      const code = `
        import { useTranslation } from 'react-i18next';
        export const Login = () => {
          const { t } = useTranslation('auth', { keyPrefix: 'login' });
          return <button>{t('submit')}</button>;
        };
      `;

      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("login.submit")).toBe(true);
      expect(result.allKeys.has("auth.login.submit")).toBe(true);
      expect(result.allKeys.has("submit")).toBe(true);
      expect(result.usages).toHaveLength(1);
      expect(result.usages[0].rawKey).toBe("submit");
      expect(result.usages[0].candidates).toEqual([
        "auth.login.submit",
        "login.submit",
        "submit",
      ]);
    });

    it("extracts useTranslation with object options only ({ keyPrefix: '...' })", () => {
      const code = `
        const Component = () => {
          const { t } = useTranslation({ keyPrefix: 'settings.profile' });
          return <div>{t('username')}</div>;
        };
      `;

      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("settings.profile.username")).toBe(true);
      expect(result.allKeys.has("username")).toBe(true);
    });

    it("extracts useTranslation with array of namespaces", () => {
      const code = `
        const Component = () => {
          const { t } = useTranslation(['common', 'auth'], { keyPrefix: 'buttons' });
          return <button>{t('save')}</button>;
        };
      `;

      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("common.buttons.save")).toBe(true);
      expect(result.allKeys.has("auth.buttons.save")).toBe(true);
      expect(result.allKeys.has("buttons.save")).toBe(true);
    });

    it("extracts useTranslation with aliased t function", () => {
      const code = `
        const Header = () => {
          const { t: tHeader } = useTranslation('common', { keyPrefix: 'header' });
          return <h1>{tHeader('title')}</h1>;
        };
      `;

      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("header.title")).toBe(true);
      expect(result.allKeys.has("common.header.title")).toBe(true);
    });

    it("extracts useTranslation with array destructuring [t]", () => {
      const code = `
        const Component = () => {
          const [t] = useTranslation('auth', { keyPrefix: 'login' });
          return <p>{t('welcome')}</p>;
        };
      `;

      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("login.welcome")).toBe(true);
      expect(result.allKeys.has("auth.login.welcome")).toBe(true);
    });

    it("extracts useTranslation with direct .t property access", () => {
      const code = `
        const t = useTranslation('auth', { keyPrefix: 'login' }).t;
        const msg = t('description');
      `;

      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("login.description")).toBe(true);
      expect(result.allKeys.has("auth.login.description")).toBe(true);
    });

    it("extracts useTranslation with nested parenthesis expressions in arguments", () => {
      const code = `
        const Comp = () => {
          const { t } = useTranslation(getNamespace('auth'), { keyPrefix: 'nested.login' });
          return <div>{t('btn')}</div>;
        };
      `;

      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("nested.login.btn")).toBe(true);
      expect(result.allKeys.has("btn")).toBe(true);
    });

    it("extracts getFixedT calls", () => {
      const code = `
        const t = i18next.getFixedT('en', 'auth', 'login');
        const submitText = t('submit');
      `;

      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("login.submit")).toBe(true);
      expect(result.allKeys.has("auth.login.submit")).toBe(true);
    });

    it("extracts standalone getFixedT calls", () => {
      const code = `
        const t = getFixedT(null, 'cart', 'items');
        const emptyMsg = t('empty');
      `;

      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("cart.items.empty")).toBe(true);
      expect(result.allKeys.has("items.empty")).toBe(true);
    });

    it("extracts <Trans> component with keyPrefix and ns props", () => {
      const code = `
        export const MyComp = () => (
          <Trans ns="auth" keyPrefix="login" i18nKey="submit">
            Submit Form
          </Trans>
        );
      `;

      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("login.submit")).toBe(true);
      expect(result.allKeys.has("auth.login.submit")).toBe(true);
      expect(result.allKeys.has("submit")).toBe(true);
    });

    it("extracts <Trans> component inheriting scope from enclosing useTranslation", () => {
      const code = `
        export const Form = () => {
          const { t } = useTranslation('auth', { keyPrefix: 'login' });
          return (
            <div>
              <Trans i18nKey="submit">Submit</Trans>
            </div>
          );
        };
      `;

      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("auth.login.submit")).toBe(true);
      expect(result.allKeys.has("login.submit")).toBe(true);
      expect(result.allKeys.has("submit")).toBe(true);
    });

    it("extracts <Translation> render prop component with keyPrefix", () => {
      const code = `
        export const MyComp = () => (
          <Translation ns="common" keyPrefix="footer">
            {(t) => <footer>{t('copyright')}</footer>}
          </Translation>
        );
      `;

      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("footer.copyright")).toBe(true);
      expect(result.allKeys.has("common.footer.copyright")).toBe(true);
    });

    it("handles multiple scopes with different keyPrefix in the same file", () => {
      const code = `
        export const Header = () => {
          const { t } = useTranslation('common', { keyPrefix: 'header' });
          return <h1>{t('title')}</h1>;
        };

        export const Footer = () => {
          const { t } = useTranslation('common', { keyPrefix: 'footer' });
          return <footer>{t('copyright')}</footer>;
        };
      `;

      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("header.title")).toBe(true);
      expect(result.allKeys.has("common.header.title")).toBe(true);
      expect(result.allKeys.has("footer.copyright")).toBe(true);
      expect(result.allKeys.has("common.footer.copyright")).toBe(true);
    });

    it("handles nested dot-separated keyPrefix", () => {
      const code = `
        const Comp = () => {
          const { t } = useTranslation('ns', { keyPrefix: 'very.deeply.nested' });
          return <span>{t('item')}</span>;
        };
      `;

      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("very.deeply.nested.item")).toBe(true);
      expect(result.allKeys.has("ns.very.deeply.nested.item")).toBe(true);
    });

    it("extracts withTranslation HOC with keyPrefix (top-level export)", () => {
      const code = `
        const Header = ({ t }) => (
          <h1>{t('title')}</h1>
        );
        export default withTranslation('common', { keyPrefix: 'header' })(Header);
      `;

      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("header.title")).toBe(true);
      expect(result.allKeys.has("common.header.title")).toBe(true);
    });

    it("extracts optional chaining props?.t and i18n.t calls", () => {
      const code = `
        function render(props) {
          const title = props?.t('title');
          const logout = i18n.t('logout');
          const direct = i18next.t('welcome');
          return <div>{title} {logout} {direct}</div>;
        }
      `;

      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("title")).toBe(true);
      expect(result.allKeys.has("logout")).toBe(true);
      expect(result.allKeys.has("welcome")).toBe(true);
    });

    it("handles keys with escaped quotes properly", () => {
      const code = `
        const msg = t('don\\'t_leave');
      `;

      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("don\\'t_leave")).toBe(true);
    });

    it("handles null and undefined namespace in useTranslation", () => {
      const code = `
        const A = () => {
          const { t } = useTranslation(null, { keyPrefix: 'dialog' });
          return <p>{t('confirm')}</p>;
        };
        const B = () => {
          const { t } = useTranslation(undefined, { keyPrefix: 'modal' });
          return <p>{t('close')}</p>;
        };
      `;

      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("dialog.confirm")).toBe(true);
      expect(result.allKeys.has("modal.close")).toBe(true);
    });

    it("handles dynamic namespace and keyPrefix template strings", () => {
      const code = `
        const Comp = () => {
          const { t: t1 } = useTranslation(\`auth.\${section}\`, { keyPrefix: 'login' });
          const { t: t2 } = useTranslation('auth', { keyPrefix: \`items.\${category}\` });
          const { t: t3 } = useTranslation('auth', { keyPrefix: 'form' });
          return (
            <div>
              <p>{t1('submit')}</p>
              <p>{t2('save')}</p>
              <p>{t3(\`field.\${name}\`)}</p>
            </div>
          );
        };
      `;

      const result = extractTranslationUsages(code);
      expect(result.usages).toHaveLength(3);
      expect(result.usages[0].isDynamic).toBe(true);
      expect(result.usages[0].candidates).toContain(
        "auth.${section}.login.submit",
      );
      expect(result.usages[1].isDynamic).toBe(true);
      expect(result.usages[1].candidates).toContain(
        "auth.items.${category}.save",
      );
      expect(result.usages[2].isDynamic).toBe(true);
      expect(result.usages[2].candidates).toContain("auth.form.field.${name}");
    });

    it("extracts custom matches when customTranslationKeyMatcher is provided", () => {
      const code = `
        const key = getSpecialKey("custom.header.title");
      `;
      const customMatcher = /getSpecialKey\(["']([^"']+)["']\)/g;
      const result = extractTranslationUsages(code, customMatcher);
      expect(result.allKeys.has('getSpecialKey("custom.header.title")')).toBe(
        true,
      );
    });

    it("extracts withTranslation when alias is destructured in wrapper parameters", () => {
      const code = `
        const Comp = withTranslation('auth', { keyPrefix: 'login' })(({ t: authT }) => {
          return <span>{authT('submit')}</span>;
        });
      `;
      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("auth.login.submit")).toBe(true);
      expect(result.allKeys.has("login.submit")).toBe(true);
    });

    it("extracts useTranslation assigned to a plain variable", () => {
      const code = `
        const customT = useTranslation('auth', { keyPrefix: 'login' });
        const val = customT('submit');
      `;
      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("auth.login.submit")).toBe(true);
      expect(result.allKeys.has("login.submit")).toBe(true);
    });

    it("extracts useTranslation with ES6 object property shorthand ({ keyPrefix })", () => {
      const code = `
        const { t } = useTranslation('auth', { keyPrefix });
        const val = t('submit');
      `;
      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("auth.keyPrefix.submit")).toBe(true);
      expect(result.allKeys.has("keyPrefix.submit")).toBe(true);
      expect(result.allKeys.has("submit")).toBe(true);
    });

    it("handles comments containing parentheses or braces without skewing parser", () => {
      const code = `
        // { t: ignored }
        /* withTranslation('ignored', { keyPrefix: 'bad' }) */
        const { t } = useTranslation('auth', { keyPrefix: 'login' });
        // t('ignored')
        const val = t('submit');
      `;
      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("auth.login.submit")).toBe(true);
      expect(result.allKeys.has("ignored")).toBe(false);
      expect(result.allKeys.has("bad")).toBe(false);
    });

    it("handles TypeScript type assertions on translation keys (e.g. t('key' as any))", () => {
      const code = `
        const { t } = useTranslation('auth', { keyPrefix: 'login' });
        const val = t('submit' as any);
      `;
      const result = extractTranslationUsages(code);
      expect(result.allKeys.has("auth.login.submit")).toBe(true);
      expect(result.allKeys.has("login.submit")).toBe(true);
    });
  });

  describe("collectUnusedTranslations with keyPrefix", () => {
    const { resolveFile } = jest.requireMock("../../src/helpers/files") as any;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("correctly marks keys used via keyPrefix as used (not unused)", async () => {
      const localePath = "/locales/en.json";
      const srcPath = "/src/Component.tsx";

      resolveFile.mockResolvedValue({
        auth: {
          login: {
            submit: "Submit",
            cancel: "Cancel",
            forgot: "Forgot password",
          },
        },
      });

      const srcCode = `
        import { useTranslation } from 'react-i18next';
        export const Login = () => {
          const { t } = useTranslation('auth', { keyPrefix: 'login' });
          return (
            <div>
              <button>{t('submit')}</button>
              <button>{t('cancel')}</button>
            </div>
          );
        };
      `;

      (fs.readFileSync as jest.Mock).mockReturnValue(srcCode);

      const result = await collectUnusedTranslations([localePath], [srcPath], {
        context: true,
        contextSeparator: "_",
        contextMatcher: /^(zero|one|two|few|many|other)$/,
        ignoreComments: false,
        customChecker: undefined,
        translationKeyMatcher:
          /\bt\(\s*[`"']([^`"']+)[`"'][^)]*\)|i18nKey=[`"']([^`"']+)[`"']/gi,
      });

      // Only 'auth.login.forgot' was never called
      expect(result.totalCount).toBe(1);
      expect(result.translations[0].keys).toEqual(["auth.login.forgot"]);
    });

    it("works when locale file is scoped to the namespace (e.g. auth.json)", async () => {
      const localePath = "/locales/en/auth.json";
      const srcPath = "/src/Component.tsx";

      resolveFile.mockResolvedValue({
        login: {
          submit: "Submit",
          cancel: "Cancel",
        },
      });

      const srcCode = `
        import { useTranslation } from 'react-i18next';
        export const Login = () => {
          const { t } = useTranslation('auth', { keyPrefix: 'login' });
          return <button>{t('submit')}</button>;
        };
      `;

      (fs.readFileSync as jest.Mock).mockReturnValue(srcCode);

      const result = await collectUnusedTranslations([localePath], [srcPath], {
        context: true,
        contextSeparator: "_",
        contextMatcher: /^(zero|one|two|few|many|other)$/,
        ignoreComments: false,
        customChecker: undefined,
        translationKeyMatcher:
          /\bt\(\s*[`"']([^`"']+)[`"'][^)]*\)|i18nKey=[`"']([^`"']+)[`"']/gi,
      });

      // login.submit is used, login.cancel is unused
      expect(result.totalCount).toBe(1);
      expect(result.translations[0].keys).toEqual(["login.cancel"]);
    });

    it("respects ignoreComments: true when keyPrefix is in comments", async () => {
      const localePath = "/locales/en.json";
      const srcPath = "/src/Component.tsx";

      resolveFile.mockResolvedValue({
        auth: {
          login: {
            submit: "Submit",
          },
        },
      });

      const srcCode = `
        // const { t } = useTranslation('auth', { keyPrefix: 'login' });
        // t('submit');
      `;

      (fs.readFileSync as jest.Mock).mockReturnValue(srcCode);

      const result = await collectUnusedTranslations([localePath], [srcPath], {
        context: true,
        contextSeparator: "_",
        contextMatcher: /^(zero|one|two|few|many|other)$/,
        ignoreComments: true,
        customChecker: undefined,
        translationKeyMatcher:
          /\bt\(\s*[`"']([^`"']+)[`"'][^)]*\)|i18nKey=[`"']([^`"']+)[`"']/gi,
      });

      // Since comments are ignored, auth.login.submit is UNUSED
      expect(result.totalCount).toBe(1);
      expect(result.translations[0].keys).toEqual(["auth.login.submit"]);
    });

    it("supports customChecker with resolved keyPrefix keys", async () => {
      const localePath = "/locales/en.json";
      const srcPath = "/src/Component.tsx";

      resolveFile.mockResolvedValue({
        auth: {
          login: {
            submit: "Submit",
          },
        },
      });

      const srcCode = `
        const { t } = useTranslation('auth', { keyPrefix: 'login' });
        t('submit');
      `;

      (fs.readFileSync as jest.Mock).mockReturnValue(srcCode);

      const customChecker = jest.fn(
        (matchedKeys: Set<string>, translationKeys: string[]) => {
          expect(matchedKeys.has("auth.login.submit")).toBe(true);
          expect(matchedKeys.has("login.submit")).toBe(true);
          translationKeys.length = 0;
        },
      );

      const result = await collectUnusedTranslations([localePath], [srcPath], {
        context: true,
        contextSeparator: "_",
        contextMatcher: /^(zero|one|two|few|many|other)$/,
        ignoreComments: false,
        customChecker: customChecker as any,
        translationKeyMatcher:
          /\bt\(\s*[`"']([^`"']+)[`"'][^)]*\)|i18nKey=[`"']([^`"']+)[`"']/gi,
      });

      expect(customChecker).toHaveBeenCalledTimes(1);
      expect(result.totalCount).toBe(0);
    });
  });

  describe("collectMissedTranslations with keyPrefix", () => {
    const { resolveFile } = jest.requireMock("../../src/helpers/files") as any;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("does not flag keys used with keyPrefix as missed if they exist in locales", async () => {
      const localePath = "/locales/en.json";
      const srcPath = "/src/Component.tsx";

      resolveFile.mockResolvedValue({
        auth: {
          login: {
            submit: "Submit",
          },
        },
      });

      const srcCode = `
        import { useTranslation } from 'react-i18next';
        export const Login = () => {
          const { t } = useTranslation('auth', { keyPrefix: 'login' });
          return (
            <div>
              <button>{t('submit')}</button>
              <button>{t('not_in_locale')}</button>
            </div>
          );
        };
      `;

      (fs.readFileSync as jest.Mock).mockReturnValue(srcCode);

      const result = await collectMissedTranslations([localePath], [srcPath], {
        context: true,
        contextSeparator: "_",
        contextMatcher: /^(zero|one|two|few|many|other)$/,
        ignoreComments: false,
        translationKeyMatcher:
          /\bt\(\s*[`"']([^`"']+)[`"'][^)]*\)|i18nKey=[`"']([^`"']+)[`"']/gi,
        missedTranslationParser: /\(([^)]+)\)/,
      });

      expect(result.totalStaticCount).toBe(1);
      expect(result.translations[0].staticKeys).toEqual([
        "auth.login.not_in_locale",
      ]);
    });

    it("correctly categorizes dynamic keys with keyPrefix under dynamicKeys", async () => {
      const localePath = "/locales/en.json";
      const srcPath = "/src/Component.tsx";

      resolveFile.mockResolvedValue({
        auth: {
          login: {
            submit: "Submit",
          },
        },
      });

      const srcCode = `
        import { useTranslation } from 'react-i18next';
        export const Form = () => {
          const { t } = useTranslation('auth', { keyPrefix: 'login' });
          return (
            <div>
              <p>{t(\`fields.\${fieldName}\`)}</p>
            </div>
          );
        };
      `;

      (fs.readFileSync as jest.Mock).mockReturnValue(srcCode);

      const result = await collectMissedTranslations([localePath], [srcPath], {
        context: true,
        contextSeparator: "_",
        contextMatcher: /^(zero|one|two|few|many|other)$/,
        ignoreComments: false,
        translationKeyMatcher:
          /\bt\(\s*[`"']([^`"']+)[`"'][^)]*\)|i18nKey=[`"']([^`"']+)[`"']/gi,
        missedTranslationParser: /\(([^)]+)\)/,
      });

      expect(result.totalDynamicCount).toBe(1);
      expect(result.totalStaticCount).toBe(0);
      expect(result.translations[0].dynamicKeys).toEqual([
        "auth.login.fields.${fieldName}",
      ]);
    });

    it("correctly resolves inline colon namespaces (file:my.translation.key) against locale files", async () => {
      const localePath = "/locales/en/file.json";
      const srcPath = "/src/Component.tsx";

      resolveFile.mockResolvedValue({
        my: {
          translation: {
            key: "Hello World",
          },
        },
      });

      const srcCode = `
        const Comp = () => {
          return <span>{t('file:my.translation.key')}</span>;
        };
      `;

      (fs.readFileSync as jest.Mock).mockReturnValue(srcCode);

      const result = await collectMissedTranslations([localePath], [srcPath], {
        context: true,
        contextSeparator: "_",
        contextMatcher: /^(zero|one|two|few|many|other)$/,
        ignoreComments: false,
        translationKeyMatcher:
          /\bt\(\s*[`"']([^`"']+)[`"'][^)]*\)|i18nKey=[`"']([^`"']+)[`"']/gi,
        missedTranslationParser: /\(([^)]+)\)/,
      });

      expect(result.totalStaticCount).toBe(0);
      expect(result.totalDynamicCount).toBe(0);
    });

    it("correctly marks <Trans> and <Translation> usages as used in collectUnusedTranslations", async () => {
      const localePath = "/locales/en.json";
      const srcPath = "/src/Component.tsx";

      resolveFile.mockResolvedValue({
        auth: {
          login: {
            submit: "Submit",
            forgot: "Forgot password",
          },
        },
        common: {
          footer: {
            copyright: "Copyright",
          },
        },
      });

      const srcCode = `
        export const MyComp = () => (
          <div>
            <Trans ns="auth" keyPrefix="login" i18nKey="submit">Submit</Trans>
            <Translation ns="common" keyPrefix="footer">
              {(t) => <footer>{t('copyright')}</footer>}
            </Translation>
          </div>
        );
      `;

      (fs.readFileSync as jest.Mock).mockReturnValue(srcCode);

      const result = await collectUnusedTranslations([localePath], [srcPath], {
        context: true,
        contextSeparator: "_",
        contextMatcher: /^(zero|one|two|few|many|other)$/,
        ignoreComments: false,
        customChecker: undefined,
        translationKeyMatcher:
          /\bt\(\s*[`"']([^`"']+)[`"'][^)]*\)|i18nKey=[`"']([^`"']+)[`"']/gi,
      });

      // auth.login.submit and common.footer.copyright are used; auth.login.forgot is unused
      expect(result.totalCount).toBe(1);
      expect(result.translations[0].keys).toEqual(["auth.login.forgot"]);
    });

    it("handles shorthand { keyPrefix } in collectUnusedTranslations", async () => {
      const localePath = "/locales/en.json";
      const srcPath = "/src/Component.tsx";

      resolveFile.mockResolvedValue({
        auth: {
          login: {
            submit: "Submit",
            cancel: "Cancel",
          },
        },
      });

      const srcCode = `
        const keyPrefix = 'login';
        export const Form = () => {
          const { t } = useTranslation('auth', { keyPrefix: 'login' });
          return <button>{t('submit')}</button>;
        };
      `;

      (fs.readFileSync as jest.Mock).mockReturnValue(srcCode);

      const result = await collectUnusedTranslations([localePath], [srcPath], {
        context: true,
        contextSeparator: "_",
        contextMatcher: /^(zero|one|two|few|many|other)$/,
        ignoreComments: false,
        customChecker: undefined,
        translationKeyMatcher:
          /\bt\(\s*[`"']([^`"']+)[`"'][^)]*\)|i18nKey=[`"']([^`"']+)[`"']/gi,
      });

      expect(result.totalCount).toBe(1);
      expect(result.translations[0].keys).toEqual(["auth.login.cancel"]);
    });
  });
});
