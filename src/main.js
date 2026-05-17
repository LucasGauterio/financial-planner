if (
  globalThis.location.hostname !== 'financialplanner.lgauterio.com.br' &&
  globalThis.location.hostname !== 'localhost' &&
  globalThis.location.hostname !== '127.0.0.1'
) {
  globalThis.location.replace('https://financialplanner.lgauterio.com.br' + globalThis.location.pathname + globalThis.location.search);
}

import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')


