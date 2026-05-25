import { createApp } from "vue";
import "@jmars25/pivottable-ts/dist/pivot.css";
import "./index.css";
import App from "./App.vue";

// Register all locales (side-effectful import)
import "@jmars25/pivottable-ts/locales";

createApp(App).mount("#app");
