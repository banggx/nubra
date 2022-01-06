# `nubra-vue-collector`

[文档地址](http://124.223.9.196/)

> 兼容 vue `2.x` 或 `3.x` 项目

## Usage

```ts
import { WebReporter, ConsoleTransport } from "nubra-common";
import { VueBehaviorCollector, VueErrorCollector } from "nubra-vue-collector";
import Vue from "vue";
import router from "./router";

const reporter = new WebReporter({
  debugMode: true,
  bufferSize: 10,
  collectors: [
    new VueBehaviorCollector({
      app: Vue,
      router, // 可不传，不传递时需要自行管理页面栈
    }),
    new VueErrorCollector(),
  ],
  transports: [new ConsoleTransport()],
});
```
