export const detectHardware = () => {
  let rawGpuString = null;
  // navigator.deviceMemory returns the RAM in GB.
  // Default to 8GB if the API is unsupported (like on Safari) or capped for privacy.
  let reportedRam = navigator.deviceMemory || 8;

  try {
    const canvas = document.createElement("canvas");
    // Requesting 'high-performance' hints the browser to use the dedicated GPU on laptops
    const glOptions = {
      powerPreference: "high-performance",
      failIfMajorPerformanceCaveat: false,
    };
    const gl =
      canvas.getContext("webgl", glOptions) ||
      canvas.getContext("experimental-webgl", glOptions);

    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        rawGpuString = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch (e) {
    console.warn("WebGL hardware detection is unsupported or blocked.", e);
  }

  return { rawGpuString, reportedRam };
};
