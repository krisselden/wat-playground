/* globals wabt, WebAssembly */
import Ember from 'ember';

export default class ApplicationController extends Ember.Controller {
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
    this.set('output', this.output + args.map(String).join('') + '\n')
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
