import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  pluginJs.configs.recommended,

  {languageOptions: {globals: globals.browser}},

  {
    rules: {
      "no-unused-vars": "off",
      "indent": ["error", 2],
      "linebreak-style": ["error", "unix"],
      "quotes": ["error", "backtick"],
      "no-console": "error",
      "no-multi-spaces": "error",
      "no-multiple-empty-lines": ["error", {"max": 1}],
      "object-shorthand": ["error", "always"],
      "semi": ["error", "never"],
      "no-else-return": "error",
      "padded-blocks": ["error", "never"],
      "no-lonely-if": "error",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      "brace-style": ["error", "stroustrup", {"allowSingleLine": true}],
      "no-var": "error",
      "arrow-spacing": ["error", {"before": true, "after": true}],
      "space-in-parens": ["error", "never"],
      "object-curly-spacing": ["error", "never"],
      "prefer-object-spread": "error",
      "no-eval": "error",
      "no-useless-escape": "error",
      "default-param-last": "error",
      "dot-notation": "error",
      "keyword-spacing": "error",
      "space-infix-ops": "error",
      "comma-spacing": "error",
      "comma-dangle": ["error", "always-multiline"],
      "no-extra-parens": ["error", "all", {
        "nestedBinaryExpressions": false,
        "enforceForArrowConditionals": false,
        "returnAssign": false
      }],
      "padding-line-between-statements": [
        "error",
        { "blankLine": "always", "prev": "block-like", "next": "*" }
      ],
      "func-call-spacing": ["error", "never"],
      "space-before-function-paren": ["error", {
        "anonymous": "never",
        "named": "never",
        "asyncArrow": "always"
      }],
      "no-mixed-operators": [
        "error",
        {
          "groups": [
            ["&&", "||"]
          ],
          "allowSamePrecedence": true
        }
      ]
    },
    languageOptions: {
      globals: {
        App: "readonly",
        DOM: "readonly",
        Msg: "readonly",
        Utilz: "readonly",
        Croppie: "readonly",
        Handlebars: "readonly",
        jdenticon: "readonly",
        Dropzone: "readonly",
        io: "readonly",
        Twitch: "readonly",
        SC: "readonly",
        YT: "readonly",
        onYouTubeIframeAPIReady: "writable",
        ColorLib: "readonly",
        NeedContext: "readonly",
        dateFormat: "readonly",
        browser: "readonly",
        module: "readonly",
        __dirname: "readonly",
        Buffer: "readonly",
        AColorPicker: "readonly",
        require: "readonly",
        process: "readonly",
      }
    }
  }
]