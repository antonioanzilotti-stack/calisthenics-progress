import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {VitePWA} from 'vite-plugin-pwa';
export default defineConfig({plugins:[react(),VitePWA({registerType:'autoUpdate',includeAssets:['icon.svg'],manifest:{name:'Calisthenics Progress',short_name:'Calisthenics',description:'Allenamenti e progressi calisthenics, anche offline',theme_color:'#101b18',background_color:'#f5f7f2',display:'standalone',start_url:'/',icons:[{src:'icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]},workbox:{globPatterns:['**/*.{js,css,html,svg,webp}'],maximumFileSizeToCacheInBytes:5*1024*1024}})]});
