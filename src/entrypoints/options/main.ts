import '@fontsource/schibsted-grotesk/latin-800.css';
import '@fontsource/instrument-sans/latin-400.css';
import '@fontsource/instrument-sans/latin-600.css';
import '~/assets/tokens.css';
import { mount } from 'svelte';
import { applyCachedTheme } from '../popup/theme';
import App from './App.svelte';

applyCachedTheme();

const target = document.getElementById('app');
if (!target) throw new Error('Options root #app is missing');

export default mount(App, { target });
