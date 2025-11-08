// Shared Cloudinary upload helper
// Supports three modes (in order):
// 1) Signed upload via a server-side signing endpoint (VITE_CLOUDINARY_SIGN_URL)
// 2) Unsigned upload via upload preset (VITE_CLOUDINARY_UPLOAD_PRESET)
// 3) Best-effort client-side api_key upload (VITE_CLOUDINARY_API_KEY) - not recommended
export async function uploadToCloudinary(file: File, folder = '', onProgress?: (pct: number) => void): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
  const signUrl = import.meta.env.VITE_CLOUDINARY_SIGN_URL as string | undefined;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY as string | undefined;

  if (!cloudName) throw new Error('Missing VITE_CLOUDINARY_CLOUD_NAME in env');

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  // If a server-side signing endpoint is provided, call it to obtain signature + timestamp
  if (signUrl) {
    try {
      const signRes = await fetch(signUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder, filename: file.name })
      });
      if (!signRes.ok) throw new Error(`Signing endpoint returned ${signRes.status}`);
      const signJson = await signRes.json();
      const { signature, timestamp, api_key: signedApiKey, resource_type } = signJson;

      const form = new FormData();
      form.append('file', file);
      form.append('timestamp', String(timestamp));
      form.append('signature', signature);
      form.append('api_key', signedApiKey);
      if (folder) form.append('folder', folder);
      if (resource_type) form.append('resource_type', resource_type);
      // Use XHR when onProgress is provided so we get real upload progress events
      if (onProgress && typeof window !== 'undefined' && typeof (window as any).XMLHttpRequest !== 'undefined') {
        return await new Promise<string>((resolve, reject) => {
          try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', endpoint);
            xhr.upload.onprogress = (ev) => {
              if (ev.lengthComputable) {
                const pct = Math.round((ev.loaded / ev.total) * 100);
                onProgress(pct);
              } else {
                onProgress(10);
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const data = JSON.parse(xhr.responseText);
                  onProgress(100);
                  resolve(data.secure_url || data.url || '');
                } catch (e) {
                  reject(new Error('Failed to parse Cloudinary response'));
                }
              } else {
                reject(new Error(`Cloudinary upload failed: ${xhr.status} ${xhr.responseText}`));
              }
            };
            xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'));
            xhr.send(form);
          } catch (err) {
            reject(err);
          }
        });
      }

      if (onProgress) onProgress(10);
      const res = await fetch(endpoint, { method: 'POST', body: form });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Cloudinary upload failed: ${res.status} ${txt}`);
      }
      const data = await res.json();
      if (onProgress) onProgress(100);
      return data.secure_url || data.url || '';
    } catch (err) {
      console.error('Signed upload failed, falling back to other methods:', err);
      // fall-through to other methods
    }
  }

  // If an unsigned preset is configured, use it (requires the preset to be whitelisted in Cloudinary)
  if (uploadPreset) {
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', uploadPreset);
    if (folder) form.append('folder', folder);
    if (onProgress && typeof window !== 'undefined' && typeof (window as any).XMLHttpRequest !== 'undefined') {
      return await new Promise<string>((resolve, reject) => {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', endpoint);
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) onProgress(Math.round((ev.loaded / ev.total) * 100));
            else onProgress(10);
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                onProgress(100);
                resolve(data.secure_url || data.url || '');
              } catch (e) {
                reject(new Error('Failed to parse Cloudinary response'));
              }
            } else {
              reject(new Error(`Cloudinary unsigned upload failed: ${xhr.status} ${xhr.responseText}`));
            }
          };
          xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'));
          xhr.send(form);
        } catch (err) {
          reject(err);
        }
      });
    }

    if (onProgress) onProgress(10);
    const res = await fetch(endpoint, { method: 'POST', body: form });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Cloudinary unsigned upload failed: ${res.status} ${txt}`);
    }
    const data = await res.json();
    if (onProgress) onProgress(100);
    return data.secure_url || data.url || '';
  }

  // Last resort: client-side API key (may fail if account requires signatures)
  if (apiKey) {
    const timestamp = Math.round(Date.now() / 1000);
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', apiKey);
    form.append('timestamp', String(timestamp));
    if (folder) form.append('folder', folder);
    if (onProgress && typeof window !== 'undefined' && typeof (window as any).XMLHttpRequest !== 'undefined') {
      return await new Promise<string>((resolve, reject) => {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', endpoint);
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) onProgress(Math.round((ev.loaded / ev.total) * 100));
            else onProgress(10);
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                onProgress(100);
                resolve(data.secure_url || data.url || '');
              } catch (e) {
                reject(new Error('Failed to parse Cloudinary response'));
              }
            } else {
              reject(new Error(`Cloudinary api_key upload failed: ${xhr.status} ${xhr.responseText}`));
            }
          };
          xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'));
          xhr.send(form);
        } catch (err) {
          reject(err);
        }
      });
    }

    if (onProgress) onProgress(10);
    const res = await fetch(endpoint, { method: 'POST', body: form });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Cloudinary api_key upload failed: ${res.status} ${txt}`);
    }
    const data = await res.json();
    if (onProgress) onProgress(100);
    return data.secure_url || data.url || '';
  }

  throw new Error('No Cloudinary upload method available. Configure VITE_CLOUDINARY_SIGN_URL or VITE_CLOUDINARY_UPLOAD_PRESET or VITE_CLOUDINARY_API_KEY');
}

export default uploadToCloudinary;
