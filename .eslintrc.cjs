module.exports = {
	ignorePatterns: ["dist/", "*.js", "node_modules/"],
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/recommended-requiring-type-checking",
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: "latest",
		sourceType: "module",
		project: "tsconfig.json",
		tsconfigRootDir: ".",
	},
	plugins: ["@typescript-eslint"],
	rules: {
		"no-extend-native": "warn",
		"no-iterator": "warn",
		"no-lone-blocks": "warn",
		"no-return-assign": "warn",
		"no-useless-computed-key": "warn",
		curly: ["warn", "multi"],
		"dot-location": ["warn", "property"],
		eqeqeq: ["warn", "smart"],
		"no-else-return": [
			"warn",
			{
				allowElseIf: false,
			},
		],
		"no-extra-bind": "warn",
		"no-floating-decimal": "warn",
		"no-implicit-coercion": "warn",
		"no-multi-spaces": "warn",
		"no-useless-return": "warn",
		"wrap-iife": ["warn", "inside"],
		yoda: [
			"warn",
			"never",
			{
				exceptRange: true,
			},
		],
		"no-undef-init": "warn",
		"array-bracket-newline": ["warn", "consistent"],
		"array-element-newline": ["warn", "consistent"],
		"computed-property-spacing": "warn",
		"new-parens": "warn",
		"no-async-promise-executor": "off",
		"no-lonely-if": "warn",
		"no-mixed-spaces-and-tabs": "off",
		"no-multiple-empty-lines": "warn",
		"no-unneeded-ternary": [
			"warn",
			{
				defaultAssignment: false,
			},
		],
		"no-whitespace-before-property": "warn",
		"one-var-declaration-per-line": "warn",
		"operator-assignment": "warn",
		"accessor-pairs": "warn",
		"array-callback-return": "warn",
		"arrow-body-style": "warn",
		"consistent-return": "warn",
		"default-case-last": "warn",
		"default-case": "warn",
		"grouped-accessor-pairs": "warn",
		"guard-for-in": "warn",
		"no-alert": "warn",
		"no-caller": "warn",
		"no-case-declarations": "off",
		"no-constructor-return": "warn",
		"no-empty": "off",
		"no-empty-pattern": "off",
		"no-labels": "warn",
		"no-multi-str": "warn",
		"no-new": "warn",
		"no-new-func": "warn",
		"no-new-wrappers": "warn",
		"no-octal-escape": "warn",
		"no-process-exit": "off",
		"no-promise-executor-return": "warn",
		"no-proto": "warn",
		"no-self-compare": "warn",
		"no-sequences": "warn",
		"no-template-curly-in-string": "warn",
		"no-unmodified-loop-condition": "warn",
		"no-unreachable-loop": "warn",
		"no-unsafe-optional-chaining": "warn",
		"no-unused-expressions": "warn",
		"no-useless-backreference": "warn",
		"no-useless-call": "warn",
		"no-useless-concat": "warn",
		"no-useless-rename": "warn",
		"no-var": "warn",
		"no-warning-comments": "warn",
		"object-shorthand": "warn",
		"prefer-arrow-callback": "warn",
		"prefer-const": "warn",
		"prefer-numeric-literals": "warn",
		"prefer-promise-reject-errors": "warn",
		"prefer-regex-literals": "warn",
		"prefer-rest-params": "warn",
		"prefer-spread": "warn",
		"prefer-template": "warn",
		"semi-spacing": "warn",
		"semi-style": "warn",
		"sort-vars": "warn",
		"symbol-description": "warn",
		"@typescript-eslint/array-type": "warn",
		"@typescript-eslint/consistent-type-assertions": "warn",
		"@typescript-eslint/consistent-type-definitions": ["warn", "type"],
		"@typescript-eslint/class-literal-property-style": "warn",
		"@typescript-eslint/member-ordering": "warn",
		"@typescript-eslint/no-confusing-non-null-assertion": "warn",
		"@typescript-eslint/no-confusing-void-expression": "warn",
		"@typescript-eslint/no-empty-function": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-extraneous-class": "warn",
		"@typescript-eslint/no-implied-eval": "off",
		"@typescript-eslint/no-loss-of-precision": "warn",
		"@typescript-eslint/no-misused-promises": "off",
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/no-shadow": "warn",
		"@typescript-eslint/no-unnecessary-boolean-literal-compare": "warn",
		"@typescript-eslint/no-unnecessary-condition": "warn",
		"@typescript-eslint/no-unnecessary-qualifier": "warn",
		"@typescript-eslint/no-unnecessary-type-constraint": "warn",
		"@typescript-eslint/no-unsafe-argument": "off",
		"@typescript-eslint/no-unsafe-assignment": "off",
		"@typescript-eslint/no-unused-vars": "off",
		"@typescript-eslint/no-use-before-define": "warn",
		"@typescript-eslint/no-useless-constructor": "warn",
		"@typescript-eslint/no-var-requires": "off",
		"@typescript-eslint/non-nullable-type-assertion-style": "warn",
		"@typescript-eslint/parameter-properties": "warn",
		"@typescript-eslint/prefer-destructuring": "warn",
		"@typescript-eslint/prefer-for-of": "warn",
		"@typescript-eslint/prefer-includes": "warn",
		"@typescript-eslint/prefer-nullish-coalescing": [
			"warn",
			{ ignoreConditionalTests: true },
		],
		"@typescript-eslint/prefer-optional-chain": "warn",
		"@typescript-eslint/prefer-string-starts-ends-with": "warn",
		"@typescript-eslint/prefer-ts-expect-error": "warn",
		"@typescript-eslint/require-await": "off",
		"@typescript-eslint/return-await": "warn",
		"@typescript-eslint/sort-type-constituents": "warn",
		"@typescript-eslint/switch-exhaustiveness-check": "warn",
		"@typescript-eslint/unified-signatures": "warn",
	},
};
