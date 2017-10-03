/* globals CodeMirror */
import Ember from 'ember';

export default class WatEditorComponent extends Ember.Component {
  init() {
    super.init();
    this.codemirror = undefined;
  }

  didInsertElement() {
    super.didInsertElement();
    this.codemirror = new CodeMirror((elt) => {
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
