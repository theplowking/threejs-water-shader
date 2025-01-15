uniform float uTime;
uniform float uOpacity;

uniform vec3 uTroughColor;
uniform vec3 uSurfaceColor;
uniform vec3 uPeakColor;

uniform float uPeakThreshold;
uniform float uPeakTransition;
uniform float uTroughThreshold;
uniform float uTroughTransition;

uniform float uFresnelBias;
uniform float uFresnelScale;
uniform float uFresnelPower;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

uniform samplerCube uEnvironmentMap;

void main() {
  // Calculate vector from camera to the vertex
  vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
  vec3 reflectedDirection = reflect(viewDirection, vNormal);
  reflectedDirection.x = -reflectedDirection.x;

  // Sample cube texture
  vec4 reflectionColor = textureCube(uEnvironmentMap, reflectedDirection);

  // Calculate fresnel effect
  float fresnel = uFresnelBias + uFresnelScale * pow(1.0 - clamp(dot(viewDirection, vNormal), 0.0, 1.0), uFresnelPower);

  // Calculate elevation-based color
  float elevation = vWorldPosition.y;

  vec3 baseColor;

  // Calculate transition factors using smoothstep
  float peakFactor = smoothstep(uPeakThreshold - uPeakTransition, uPeakThreshold + uPeakTransition, elevation);
  float troughFactor = smoothstep(uTroughThreshold - uTroughTransition, uTroughThreshold + uTroughTransition, elevation);

  // Mix between trough and surface colors based on trough transition
  vec3 surfaceMix = mix(uTroughColor, uSurfaceColor, troughFactor);

  // Mix between surface and peak colors based on peak transition 
  baseColor = mix(surfaceMix, uPeakColor, peakFactor);

  vec3 finalColor = mix(baseColor, reflectionColor.rgb, fresnel);

  gl_FragColor = vec4(finalColor, uOpacity);
}
