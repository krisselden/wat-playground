"use strict";



define('wat-playground/app', ['exports', 'wat-playground/resolver', 'ember-load-initializers', 'wat-playground/config/environment'], function (exports, _resolver, _emberLoadInitializers, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const App = Ember.Application.extend({
    modulePrefix: _environment.default.modulePrefix,
    podModulePrefix: _environment.default.podModulePrefix,
    Resolver: _resolver.default
  });

  (0, _emberLoadInitializers.default)(App, _environment.default.modulePrefix);

  exports.default = App;
});
define('wat-playground/components/code-editor', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  class WatEditorComponent extends Ember.Component {
    init() {
      super.init();
      this.codemirror = undefined;
    }

    didInsertElement() {
      super.didInsertElement();
      this.codemirror = new CodeMirror(elt => {
        this.element.appendChild(elt);
      }, {
        value: this.value,
        mode: this.mode,
        lineNumbers: true
      });
      if (typeof this.onchange === 'function') {
        this.codemirror.on('change', this.onchange);
      }
    }

    willDestroyElement() {
      super.willDestroyElement();
      if (typeof this.onchange === 'function') {
        this.codemirror.off('change', this.onchange);
      }
    }
  }
  exports.default = WatEditorComponent;
});
define('wat-playground/controllers/application', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  class ApplicationController extends Ember.Controller {
    init() {
      super.init();
      this.js = `let instance = new WebAssembly.Instance(wasm, {});
log(instance.exports.add(2, 2));
`;
      this.wat = `(module
  (func $add (export "add") (param $a i32) (param $b i32) (result i32)
    (i32.add
      (get_local $a)
      (get_local $b)
    )
  )
)
`;
      this.output = '';
      this.error = '';
      this.wasm = undefined;
      this.watDidChange = Ember.run.bind(this, this.watDidChange);
      this.jsDidChange = Ember.run.bind(this, this.jsDidChange);
      this.log = this.log.bind(this);
      this.run();
    }

    watDidChange(e) {
      let wat = e.getValue();
      this.set('wat', wat);
      Ember.run.debounce(this, this.run, 200);
    }

    jsDidChange(e) {
      let js = e.getValue();
      this.set('js', js);
      Ember.run.debounce(this, this.run, 200);
    }

    log(...args) {
      this.set('output', this.output + args.map(String).join('') + '\n');
    }

    run() {
      const { wat } = this;
      wabt.ready.then(() => {
        if (this.wat !== wat) return;
        this.set('output', '');
        let script;
        try {
          script = wabt.parseWast('playground.wat', wat);
          script.resolveNames();
          script.validate();
          let result = script.toBinary({});
          let wasm = new WebAssembly.Module(result.buffer);
          let fn = new Function('wasm', 'log', this.js + '//# sourceURL=playground.js');
          fn(wasm, this.log);
          this.set('error', '');
        } catch (e) {
          this.set('error', String(e));
        } finally {
          if (script) script.destroy();
        }
      });
    }
  }
  exports.default = ApplicationController;
});
define('wat-playground/helpers/app-version', ['exports', 'wat-playground/config/environment', 'ember-cli-app-version/utils/regexp'], function (exports, _environment, _regexp) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.appVersion = appVersion;


  const {
    APP: {
      version
    }
  } = _environment.default;

  function appVersion(_, hash = {}) {
    if (hash.hideSha) {
      return version.match(_regexp.versionRegExp)[0];
    }

    if (hash.hideVersion) {
      return version.match(_regexp.shaRegExp)[0];
    }

    return version;
  }

  exports.default = Ember.Helper.helper(appVersion);
});
define('wat-playground/initializers/app-version', ['exports', 'ember-cli-app-version/initializer-factory', 'wat-playground/config/environment'], function (exports, _initializerFactory, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const {
    APP: {
      name,
      version
    }
  } = _environment.default;

  exports.default = {
    name: 'App Version',
    initialize: (0, _initializerFactory.default)(name, version)
  };
});
define('wat-playground/initializers/container-debug-adapter', ['exports', 'ember-resolver/resolvers/classic/container-debug-adapter'], function (exports, _containerDebugAdapter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'container-debug-adapter',

    initialize() {
      let app = arguments[1] || arguments[0];

      app.register('container-debug-adapter:main', _containerDebugAdapter.default);
      app.inject('container-debug-adapter:main', 'namespace', 'application:main');
    }
  };
});
define('wat-playground/initializers/export-application-global', ['exports', 'wat-playground/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;
  function initialize() {
    var application = arguments[1] || arguments[0];
    if (_environment.default.exportApplicationGlobal !== false) {
      var theGlobal;
      if (typeof window !== 'undefined') {
        theGlobal = window;
      } else if (typeof global !== 'undefined') {
        theGlobal = global;
      } else if (typeof self !== 'undefined') {
        theGlobal = self;
      } else {
        // no reasonable global, just bail
        return;
      }

      var value = _environment.default.exportApplicationGlobal;
      var globalName;

      if (typeof value === 'string') {
        globalName = value;
      } else {
        globalName = Ember.String.classify(_environment.default.modulePrefix);
      }

      if (!theGlobal[globalName]) {
        theGlobal[globalName] = application;

        application.reopen({
          willDestroy: function willDestroy() {
            this._super.apply(this, arguments);
            delete theGlobal[globalName];
          }
        });
      }
    }
  }

  exports.default = {
    name: 'export-application-global',

    initialize: initialize
  };
});
define('wat-playground/resolver', ['exports', 'ember-resolver'], function (exports, _emberResolver) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberResolver.default;
});
define('wat-playground/router', ['exports', 'wat-playground/config/environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  const Router = Ember.Router.extend({
    location: _environment.default.locationType,
    rootURL: _environment.default.rootURL
  });

  Router.map(function () {});

  exports.default = Router;
});
define("wat-playground/templates/application", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "yN1aiHnO", "block": "{\"symbols\":[],\"statements\":[[6,\"header\"],[7],[0,\"\\n\"],[6,\"h1\"],[7],[0,\"WAT Playground\"],[8],[0,\"\\n\"],[8],[0,\"\\n\\n\"],[6,\"section\"],[9,\"id\",\"wat-editor\"],[7],[0,\"\\n\"],[1,[25,\"code-editor\",null,[[\"mode\",\"value\",\"onchange\"],[\"wast\",[19,0,[\"wat\"]],[25,\"unbound\",[[19,0,[\"watDidChange\"]]],null]]]],false],[0,\"\\n\"],[8],[0,\"\\n\\n\"],[6,\"section\"],[9,\"id\",\"js-editor\"],[7],[0,\"\\n\"],[1,[25,\"code-editor\",null,[[\"mode\",\"value\",\"onchange\"],[\"javascript\",[19,0,[\"js\"]],[25,\"unbound\",[[19,0,[\"jsDidChange\"]]],null]]]],false],[0,\"\\n\"],[8],[0,\"\\n\\n\"],[6,\"footer\"],[7],[0,\"\\n\"],[6,\"h2\"],[7],[0,\"Output\"],[8],[0,\"\\n\"],[6,\"pre\"],[9,\"id\",\"error\"],[9,\"style\",\"color:red\"],[7],[1,[18,\"error\"],false],[8],[0,\"\\n\"],[6,\"pre\"],[9,\"id\",\"output\"],[7],[1,[18,\"output\"],false],[8],[0,\"\\n\"],[8],[0,\"\\n\\n\"],[1,[18,\"outlet\"],false]],\"hasEval\":false}", "meta": { "moduleName": "wat-playground/templates/application.hbs" } });
});
define("wat-playground/templates/components/code-editor", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "T6sRoU2d", "block": "{\"symbols\":[],\"statements\":[],\"hasEval\":false}", "meta": { "moduleName": "wat-playground/templates/components/code-editor.hbs" } });
});


define('wat-playground/config/environment', ['ember'], function(Ember) {
  var prefix = 'wat-playground';
try {
  var metaName = prefix + '/config/environment';
  var rawConfig = document.querySelector('meta[name="' + metaName + '"]').getAttribute('content');
  var config = JSON.parse(unescape(rawConfig));

  var exports = { 'default': config };

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

});

if (!runningTests) {
  require("wat-playground/app")["default"].create({"name":"wat-playground","version":"0.0.0+08753463"});
}
