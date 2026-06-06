const KAKAOTALK_USER_AGENT_PATTERN = /KAKAOTALK/i;

export function isKakaoTalkInAppBrowser(userAgent: string): boolean {
  return KAKAOTALK_USER_AGENT_PATTERN.test(userAgent);
}

export function getExternalBrowserUrl(currentUrl: string, userAgent: string): string {
  const url = new URL(currentUrl);

  if (/Android/i.test(userAgent)) {
    const scheme = url.protocol.replace(":", "");
    return `intent://${url.host}${url.pathname}${url.search}${url.hash}#Intent;scheme=${scheme};package=com.android.chrome;end`;
  }

  return currentUrl;
}

export function openExternalBrowserForKakaoTalk(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (!isKakaoTalkInAppBrowser(navigator.userAgent)) return false;

  window.location.href = getExternalBrowserUrl(window.location.href, navigator.userAgent);
  return true;
}
