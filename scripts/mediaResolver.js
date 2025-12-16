(function () {
  'use strict';

  const DEFAULT_POLICY = {
    allowHttp: false,
    allowHttps: false,
    allowData: true,
    allowRelative: true,
    allowBlob: true,
    allowProtocolRelative: false,
    maxDataUrlBytes: 250000,
    allowSvgDataUrl: true,
  };

  function getPolicy() {
    const conf = window.APP_CONFIG && window.APP_CONFIG.media ? window.APP_CONFIG.media : {};
    return Object.assign({}, DEFAULT_POLICY, conf);
  }

  function getScheme(ref) {
    const m = String(ref).match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
    return m ? m[1].toLowerCase() : null;
  }

  function isProtocolRelative(ref) {
    return typeof ref === 'string' && ref.startsWith('//');
  }

  function estimateBase64Bytes(base64) {
    const cleaned = String(base64).replace(/\s+/g, '');
    const len = cleaned.length;
    if (len === 0) return 0;
    const padding = cleaned.endsWith('==') ? 2 : cleaned.endsWith('=') ? 1 : 0;
    return Math.max(0, Math.floor((len * 3) / 4) - padding);
  }

  function estimateDataUrlBytes(ref) {
    const s = String(ref);
    const comma = s.indexOf(',');
    if (comma === -1) return 0;
    const meta = s.slice(0, comma);
    const data = s.slice(comma + 1);
    if (/;base64/i.test(meta)) {
      return estimateBase64Bytes(data);
    }
    return data.length;
  }

  function isAllowedDataImage(ref, policy) {
    const s = String(ref);
    if (!s.startsWith('data:')) return { ok: false, reason: 'not_data' };

    const comma = s.indexOf(',');
    if (comma === -1) return { ok: false, reason: 'data_no_comma' };

    const meta = s.slice(5, comma);
    const mime = (meta.split(';')[0] || '').toLowerCase();

    if (!mime.startsWith('image/')) {
      return { ok: false, reason: 'data_not_image' };
    }

    if (!policy.allowSvgDataUrl && mime === 'image/svg+xml') {
      return { ok: false, reason: 'svg_data_disabled' };
    }

    const bytes = estimateDataUrlBytes(s);
    if (typeof policy.maxDataUrlBytes === 'number' && policy.maxDataUrlBytes > 0) {
      if (bytes > policy.maxDataUrlBytes) {
        return { ok: false, reason: 'data_too_large', bytes };
      }
    }

    return { ok: true, bytes };
  }

  function resolveImageRef(ref) {
    const policy = getPolicy();
    if (ref == null) return { ok: false, reason: 'empty' };

    const trimmed = String(ref).trim();
    if (!trimmed) return { ok: false, reason: 'empty' };

    if (isProtocolRelative(trimmed)) {
      return policy.allowProtocolRelative
        ? { ok: true, src: trimmed, kind: 'protocol_relative' }
        : { ok: false, reason: 'protocol_relative_disallowed' };
    }

    const scheme = getScheme(trimmed);

    if (!scheme) {
      if (!policy.allowRelative) return { ok: false, reason: 'relative_disallowed' };
      return { ok: true, src: trimmed, kind: 'relative' };
    }

    if (scheme === 'data') {
      if (!policy.allowData) return { ok: false, reason: 'data_disallowed' };
      const allowed = isAllowedDataImage(trimmed, policy);
      if (!allowed.ok) return { ok: false, reason: allowed.reason, bytes: allowed.bytes };
      return { ok: true, src: trimmed, kind: 'data', bytes: allowed.bytes };
    }

    if (scheme === 'blob') {
      if (!policy.allowBlob) return { ok: false, reason: 'blob_disallowed' };
      return { ok: true, src: trimmed, kind: 'blob' };
    }

    if (scheme === 'http') {
      return policy.allowHttp
        ? { ok: true, src: trimmed, kind: 'http' }
        : { ok: false, reason: 'http_disallowed' };
    }

    if (scheme === 'https') {
      return policy.allowHttps
        ? { ok: true, src: trimmed, kind: 'https' }
        : { ok: false, reason: 'https_disallowed' };
    }

    return { ok: false, reason: 'scheme_disallowed', scheme };
  }

  function resolveAudioUrl(ref) {
    const policy = getPolicy();
    if (ref == null) return { ok: false, reason: 'empty' };

    const trimmed = String(ref).trim();
    if (!trimmed) return { ok: false, reason: 'empty' };

    if (isProtocolRelative(trimmed)) {
      return policy.allowProtocolRelative
        ? { ok: true, url: trimmed, kind: 'protocol_relative' }
        : { ok: false, reason: 'protocol_relative_disallowed' };
    }

    const scheme = getScheme(trimmed);

    if (!scheme) {
      if (!policy.allowRelative) return { ok: false, reason: 'relative_disallowed' };
      return { ok: true, url: trimmed, kind: 'relative' };
    }

    if (scheme === 'blob') {
      if (!policy.allowBlob) return { ok: false, reason: 'blob_disallowed' };
      return { ok: true, url: trimmed, kind: 'blob' };
    }

    if (scheme === 'data') {
      return policy.allowData
        ? { ok: true, url: trimmed, kind: 'data' }
        : { ok: false, reason: 'data_disallowed' };
    }

    if (scheme === 'http') {
      return policy.allowHttp
        ? { ok: true, url: trimmed, kind: 'http' }
        : { ok: false, reason: 'http_disallowed' };
    }

    if (scheme === 'https') {
      return policy.allowHttps
        ? { ok: true, url: trimmed, kind: 'https' }
        : { ok: false, reason: 'https_disallowed' };
    }

    return { ok: false, reason: 'scheme_disallowed', scheme };
  }

  window.MediaResolver = {
    resolveImageRef,
    resolveAudioUrl,
    getPolicy,
  };
})();
