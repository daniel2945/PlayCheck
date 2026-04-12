export const detectHardware = () => {
  let rawGpuString = null;
  // Default to 8GB if the API is unsupported (like on Safari) or capped
  let reportedRam = navigator.deviceMemory || 8;

  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl", { powerPreference: "high-performance" }) ||
      canvas.getContext("experimental-webgl", {
        powerPreference: "high-performance",
      });

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
