/**
 * Lightweight self-contained User-Agent parser for security session tracking.
 * Extracts the browser type, operating system, and device details dynamically.
 */
export interface UAInfo {
  browser: string;
  device: string;
}

export const parseUserAgent = (uaString: string | undefined): UAInfo => {
  if (!uaString) {
    return {
      browser: 'Unknown Browser',
      device: 'Generic Device'
    };
  }

  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let device = 'Desktop';

  // OS detection
  if (/windows/i.test(uaString)) {
    os = 'Windows';
  } else if (/macintosh|mac os x/i.test(uaString)) {
    os = 'macOS';
  } else if (/linux/i.test(uaString)) {
    os = 'Linux';
  } else if (/iphone|ipad|ipod/i.test(uaString)) {
    os = 'iOS';
    device = 'Mobile';
  } else if (/android/i.test(uaString)) {
    os = 'Android';
    device = 'Mobile';
  }

  // Browser detection
  if (/chrome|crios/i.test(uaString) && !/edge|edg/i.test(uaString) && !/opr/i.test(uaString)) {
    browser = 'Chrome';
  } else if (/safari/i.test(uaString) && !/chrome|crios/i.test(uaString) && !/android/i.test(uaString)) {
    browser = 'Safari';
  } else if (/firefox|fxios/i.test(uaString)) {
    browser = 'Firefox';
  } else if (/edge|edg/i.test(uaString)) {
    browser = 'Edge';
  } else if (/opr/i.test(uaString)) {
    browser = 'Opera';
  }

  return {
    browser,
    device: `${device} (${os})`
  };
};
