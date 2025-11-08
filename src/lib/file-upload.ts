// Simple file upload helper that stores files locally
export async function uploadFile(file: File, onProgress?: (pct: number) => void): Promise<string> {
    const endpoint = 'http://localhost:4000/api/file-storage/upload';

    // If the caller wants progress updates and XHR is available, use XHR for real progress events
    if (onProgress && typeof window !== 'undefined' && (window as any).XMLHttpRequest) {
        return await new Promise<string>((resolve, reject) => {
            try {
                const form = new FormData();
                form.append('file', file);

                const xhr = new XMLHttpRequest();
                xhr.open('POST', endpoint);

                xhr.upload.onprogress = (ev) => {
                    if (ev.lengthComputable) {
                        const pct = Math.round((ev.loaded / ev.total) * 100);
                        try { onProgress(pct); } catch {};
                    } else {
                        try { onProgress(10); } catch {};
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            try { onProgress(100); } catch {};
                            resolve(data.url);
                        } catch (e) {
                            reject(new Error('Failed to parse upload response'));
                        }
                    } else {
                        reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
                    }
                };

                xhr.onerror = () => reject(new Error('Network error during file upload'));
                xhr.send(form);
            } catch (err) {
                reject(err as Error);
            }
        });
    }

    // Fallback to fetch for environments without XHR or when progress isn't needed
    const form = new FormData();
    form.append('file', file);

    try {
        const response = await fetch(endpoint, { method: 'POST', body: form });
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${await response.text()}`);
        }
        const data = await response.json();
        if (onProgress) onProgress(100);
        return data.url;
    } catch (error) {
        console.error('Upload failed:', error);
        throw error;
    }
}