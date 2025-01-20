import glsl from 'vite-plugin-glsl';

export default {
  base: '/threejs-water-shader/',
  build: {
    sourcemap: true
  },
  plugins: [glsl()]
} 