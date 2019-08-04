// Vue 构造函数
function Vue(options = {}) {
  this.$options = options;
  this._data = this.$options.data;
  new Publisher(this._data);
  for (let key in this._data) {
    Object.defineProperty(this, key, {
      enumerable: true,
      configurable: false,
      get() {
        return this._data[key];
      },
      set(newValue) {
        this._data[key] = newValue;
      }
    });
  }
  new Compile(this.$options.el, this);
}

// Compile 简单编译DOM
function Compile(el, vm) {
  vm.$el = document.querySelector(el);
  const fragment = document.createDocumentFragment();
  let child = null;
  while(child = vm.$el.firstChild) {
    fragment.appendChild(child); // vm.$el的子元素被转移到fragment
  }
  function replace(fragment) {
    const pattern = /\{\{(.*)\}\}/;
    Array.from(fragment.childNodes).forEach((node) => {
      let text = node.textContent;
      if (node.nodeType === 3 && pattern.test(text)) {
        const key = RegExp.$1.trim();
        new Subscriber(vm, key, (newValue) => {
          node.textContent = text.replace(pattern, newValue);
        });
        node.textContent = text.replace(pattern, vm[key])
      }
      if (node.childNodes && node.childNodes.length) {
        replace(node);
      }
    });
  }
  replace(fragment);
  vm.$el.appendChild(fragment);
}

// 发布-订阅设计模式
// EventHub
function EventHub() {
  this.events = [];
}

EventHub.prototype.on = function(evName) {
  this.events.push(evName);
}

EventHub.prototype.notify = function() {
  this.events.forEach((event) => {
    event.update();
  });
}

// Subscriber订阅
function Subscriber(vm, key, fn) {
  this.vm = vm;
  this.key = key;
  this.fn = fn;
  EventHub.target = this;
}

Subscriber.prototype.update = function () {
  this.fn(this.vm[this.key]);
}

// Publisher发布
function Publisher(data) {
  const eventHub = new EventHub();
  for (let key in data) {
    let value = data[key];
    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: false,
      get() {
        EventHub.target && eventHub.on(EventHub.target);
        EventHub.target = null;
        return value;
      },
      set(newValue) {
        if (newValue === value) {
          return;
        }
        value = newValue;
        eventHub.notify();
      }
    });
  }
}