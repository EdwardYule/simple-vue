const Vue = (function () {
  class Publisher {
    constructor() {
      this.subs = [];
    }
    addSub(sub) {
      this.subs.push(sub);
    }
    notify() {
      this.subs.forEach(sub => {
        sub.update();
      })
    }
  }

  class Subscriber {
    constructor(callback) {
      this.callback = callback;
    }
    update() {
      this.callback();
    }
  }

  function observe(data) {
    if (!data || typeof data !== "object") return;
    Object.keys(data).forEach(key => {
      let pub = new Publisher();
      let value = data[key];
      observe(value);
      Object.defineProperty(data, key, {
        get() {
          Publisher.target && pub.addSub(Publisher.target);
          return value;
        },
        set(newValue) {
          value = newValue;
          observe(value);
          pub.notify();
        }
      })
    })
    return data;
  }

  const compileUtils = {
    
  }

  class Compile {
    constructor(selector, vm) {
      this.el = document.querySelector(selector);
      this.data = vm.$options.data;
      this.nodeToFrament();
    }
    nodeToFrament() {
      let fragment = document.createDocumentFragment();
      while (this.el.firstChild) {
        fragment.appendChild(this.el.firstChild);
      }
      this.compile(fragment);
      this.el.appendChild(fragment);
    }
    compile(fragment) {
      Array.from(fragment.childNodes).forEach(node => {
        if (node.nodeType == Node.ELEMENT_NODE) {
          this.compile(node, this.vm);
        }
        if (node.nodeType == Node.TEXT_NODE) {
          this.compileTemplate(node);
        }
      })
    }
    compileTemplate(node) {
      const reg = /\{\{[^}^}]*\}\}/;
      let text = node.textContent;
      let exps = (text.match(new RegExp(reg, 'g')) || []).map(ele => ele.replace("{{", "").replace("}}", ""));
      if (exps.length) {
        Publisher.target = new Subscriber(() => {
          node.textContent = this.getValue(text, exps, reg);
        })
        node.textContent = this.getValue(text, exps, reg);
        Publisher.target = null;
      }
    }
    getValue(template, exps, reg) {
      exps.forEach(exp => {
        let value = exp.split(".").reduce((acu, key) => {
          return acu = acu[key];
        }, this.data)
        template = template.replace(reg, value);
      })
      return template;
    }
  }

  return class {
    constructor(options = {}) {
      this.$options = options;
      this.$data = observe(options.data);
      this.proxy()
      new Compile(options.el, this);
    }
    proxy() {
      Object.keys(this.$data).forEach(key => {
        Object.defineProperty(this, key, {
          enumerable: true,
          configurable: false,
          get() {
            return this.$data[key];
          },
          set(newValue) {
            this.$data[key] = newValue;
          }
        })
      })
    }
  }
})()