import { createApp } from "vue";
import "pivottable-ts/dist/pivot.css";
import "./index.css";
import App from "./App.vue";

// Register all locales (side-effectful import)
import "pivottable-ts/locales";

createApp(App).mount("#app");
