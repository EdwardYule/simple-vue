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

  class Compile {
    constructor(selector, vm) {
      this.$el = document.querySelector(selector);
      this.$vm = vm;
      this.nodeToFrament();
    }
    nodeToFrament() {
      let fragment = document.createDocumentFragment();
      while (this.$el.firstChild) {
        fragment.appendChild(this.$el.firstChild);
      }
      this.replace(fragment);
      this.$el.appendChild(fragment);
    }
    replace(fragment) {
      let reg = /\{\{[^}^}]*\}\}/g;
      Array.from(fragment.childNodes).forEach(node => {
        if (node.nodeType == Node.ELEMENT_NODE) {
          this.replace(node, this.$vm);
        }
        if (node.nodeType == Node.TEXT_NODE) {
          let text = node.textContent;
          let exp = (text.match(reg) || []).map(ele => ele.replace("{{", "").replace("}}", ""))[0];
          if (exp) {
            Publisher.target = new Subscriber(() => {
              node.textContent = text.replace(/\{\{[^}]*\}\}/, this.getValue(this.$vm.$options.data, exp));
            })
            node.textContent = text.replace(/\{\{[^}]*\}\}/, this.getValue(this.$vm.$options.data, exp));
            Publisher.target = null;
          }
        }
      })
    }
    getValue(data, exp) {
      let result = exp.split(".").reduce((acu, key) => {
        return acu = acu[key];
      }, data)
      return result;
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