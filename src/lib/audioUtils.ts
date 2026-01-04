export function floatTo16BitPCM(float32Array: Float32Array): Int16Array {
	const buffer = new Int16Array(float32Array.length);
	for (let i = 0; i < float32Array.length; i++) {
		const s = Math.max(-1, Math.min(1, float32Array[i]));
		buffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
	}
	return buffer;
}

export function arrayBufferToBase64(buffer: Int16Array): string {
	let binary = '';
	const bytes = new Uint8Array(buffer.buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
}

export function downsampleBuffer(
	buffer: Float32Array,
	inputRate: number,
	targetRate: number = 16000
): Float32Array {
	if (inputRate === targetRate) return buffer;

	const ratio = inputRate / targetRate;
	const newLength = Math.round(buffer.length / ratio);
	const result = new Float32Array(newLength);

	for (let i = 0; i < newLength; i++) {
		const originalIndex = i * ratio;
		const indexFloor = Math.floor(originalIndex);
		const indexCeil = Math.min(indexFloor + 1, buffer.length - 1);
		const t = originalIndex - indexFloor;

		// Linear interpolation: y = y0 + t * (y1 - y0)
		const y0 = buffer[indexFloor];
		const y1 = buffer[indexCeil];

		result[i] = y0 + t * (y1 - y0);
	}
	return result;
}
