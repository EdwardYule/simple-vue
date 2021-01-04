const Vue = (function () {
  /**
   * 发布者
   * @class Dep
   */
  class Dep {
    constructor() {
      this.subs = [];
    }
    addSub(watcher) {
      this.subs.push(watcher);
    }
    notify() {
      this.subs.forEach(watcher => {
        watcher.update();
      })
    }
  }

  /**
   * 观察者(或者说订阅者)
   * @class Watcher
   */
  class Watcher {
    constructor(vm, exp, callback) {
      this.callback = callback;
    }
    update() {
      this.callback();
    }
  }

  let dep = new Dep();

  /**
   * 代理数据
   * @param {*} source
   * @param {*} target
   */
  function proxy(source, target) {
    Object.keys(target).forEach(key => {
      Object.defineProperty(source, key, {
        // 这里之所以需要加上这两个配置项，是因为Vue实例上原本不存在这些key，所以他们的值默认是false
        // 而在做数据劫持的时候，由于data对象上的key都已经由用户进行了声明，其值已经被设置为true了，无需再设置一次
        enumerable: true,
        configurable: false,
        get() {
          return target[key];
        },
        set(newValue) {
          target[key] = newValue;
        }
      })
    })
  }

  /**
   * 劫持数据，也就是将数据变成响应式的数据
   * 所谓劫持，就是对数据进行观察，这里我们能观察的就是读和写的操作
   * 需要注意，我们通过递归，将对象进行深度的劫持
   * @param {*} data
   * @returns
   */
  function observe(data) {
    Object.keys(data).forEach(key => {
      // 用一个闭包来保存数据
      let value = data[key];
      // 递归，加上条件（类型为对象则递归）
      if (value && typeof value == "object") observe(value);
      Object.defineProperty(data, key, {
        get() {
          return value;
        },
        set(newValue) {
          value = newValue;
          // 这里要注意，当如果新赋值了一个对象，也需要深度劫持
          if (value && typeof value == "object") observe(value);
          dep.notify();
        }
      })
    })
    return data;
  }

  /**
   * 编译函数
   * 所谓编译，也可以理解成渲染，就是将数据替换到模板中的相应位置
   * 最后放到页面当中去
   * @param {*} selector
   * @param {*} vm
   */
  function compile(selector, vm) {
    // 保存一下目标dom
    vm.$el = document.querySelector(selector);
    // 创建一个文档碎片，将页面中的dom移到内存中
    let fragment = document.createDocumentFragment();
    while (vm.$el.firstChild) {
      // appendChild会将dom从原位置移除后，再添加至新位置
      fragment.appendChild(vm.$el.firstChild);
    }
    replace(fragment, vm);
    // 最后把文档碎片移入到页面中 
    vm.$el.appendChild(fragment);
  }

  /**
   * 模板替换
   * 模板替换，只能在初次渲染的时候是有用的
   * 第二次改变值的时候，模板已经不见了，所以这个时候模板替换函数replace是没用的
   * 因此我们需要让Vue记住模板的位置
   * @param {*} fragment
   * @param {*} vm
   */
  function replace(fragment, vm) {
    let reg = /\{\{[^}^}]*\}\}/g;
    Array.from(fragment.childNodes).forEach(node => {
      if (node.nodeType == Node.ELEMENT_NODE) {
        // 如果不是文本节点，就递归
        replace(node, vm);
      }
      if (node.nodeType == Node.TEXT_NODE) {
        // 取出每个文本的所有模板
        let text = node.textContent;
        let exp = (text.match(reg) || []).map(ele => ele.replace("{{", "").replace("}}", ""))[0];
        if (exp) {
          dep.addSub(new Watcher("1", "2", () => {
            node.textContent = text.replace(/\{\{[^}]*\}\}/, getValue(vm.$options.data, exp));
          }));
          node.textContent = text.replace(/\{\{[^}]*\}\}/, getValue(vm.$options.data, exp));
        }
      }
    })
  }

  function getValue(data, exp) {
    // 获取数据
    let result = exp.split(".").reduce((acu, key) => {
      return acu = acu[key];
    }, data)
    return result;
  }

  return class {
    constructor(options = {}) {
      this.$options = options;
      proxy(this, observe(options.data))
      compile(options.el, this);
    }
  }
})()