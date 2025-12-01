// Simple client-side fingerprinting
// In a real app, use a library like @fingerprintjs/fingerprintjs

export interface DeviceFingerprint {
    visitorId: string;
    deviceModel: string;
    osName: string;
    osVersion: string;
    browserName: string;
    browserVersion: string;
    screenResolution: string;
    gpuRenderer: string;
    cpuCores: number;
    ramGb: number;
    timezone: string;
    language: string;
    userAgent: string;
}

export const getFingerprint = async (): Promise<DeviceFingerprint> => {
    const ua = navigator.userAgent;
    let osName = 'Unknown';
    const osVersion = 'Unknown';
    let browserName = 'Unknown';
    const browserVersion = 'Unknown';

    // Basic OS Detection
    if (ua.indexOf('Win') !== -1) osName = 'Windows';
    if (ua.indexOf('Mac') !== -1) osName = 'macOS';
    if (ua.indexOf('Linux') !== -1) osName = 'Linux';
    if (ua.indexOf('Android') !== -1) osName = 'Android';
    if (ua.indexOf('like Mac') !== -1) osName = 'iOS';

    // Basic Browser Detection
    if (ua.indexOf('Chrome') !== -1) browserName = 'Chrome';
    else if (ua.indexOf('Firefox') !== -1) browserName = 'Firefox';
    else if (ua.indexOf('Safari') !== -1) browserName = 'Safari';
    else if (ua.indexOf('Edge') !== -1) browserName = 'Edge';

    // GPU Info
    let gpuRenderer = 'Unknown';
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                gpuRenderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
        }
    } catch (e) {
        console.error('WebGL not supported', e);
    }

    // Simple Hash for Visitor ID (Canvas + UA)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let canvasHash = '';
    if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px "Arial"';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('LOCALIVE_FINGERPRINT', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('LOCALIVE_FINGERPRINT', 4, 17);
        canvasHash = canvas.toDataURL();
    }

    const visitorId = btoa(canvasHash + ua).slice(0, 32); // Simple mock hash

    return {
        visitorId,
        deviceModel: /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile/.test(ua) ? 'Mobile Device' : 'Desktop',
        osName,
        osVersion, // Parsing version is complex, keeping simple for now
        browserName,
        browserVersion,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        gpuRenderer,
        cpuCores: navigator.hardwareConcurrency || 0,
        ramGb: (navigator as any).deviceMemory || 0,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        userAgent: ua,
    };
};
