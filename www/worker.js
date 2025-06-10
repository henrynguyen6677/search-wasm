// worker.js (Phiên bản gửi tiến độ)

import init, {Searcher} from './pkg/ripgrep_lite_wasm.js';

async function initWasm() {
  await init();
  self.postMessage({type: 'ready'});
}
initWasm().catch(error => {
  console.error("Worker: Lỗi khởi tạo WASM", error);
  self.postMessage({type: 'error', text: 'Không thể khởi tạo lõi xử lý.'});
});

self.onmessage = async (event) => {
  const {type, payload} = event.data;

  if (type === 'processFile') {
    const {file, pattern} = payload;

    try {
      const searcher = new Searcher(pattern);
      const stream = file.stream();
      const reader = stream.pipeThrough(new TextDecoderStream()).getReader();

      // THAY ĐỔI: Thêm logic theo dõi tiến độ
      const fileSize = file.size;
      let readBytes = 0;
      let lastReportedProgress = -1;

      while (true) {
        const {done, value} = await reader.read();
        if (done) {
          searcher.finish();
          break;
        }
        searcher.process_chunk(value);

        // THAY ĐỔI: Tính toán và gửi tiến độ về luồng chính
        readBytes += value.length;
        const progress = fileSize > 0 ? Math.round((readBytes / fileSize) * 100) : 0;

        // Chỉ gửi update nếu tiến độ thay đổi để tránh spam tin nhắn
        if (progress > lastReportedProgress) {
          self.postMessage({type: 'progress', progress: progress});
          lastReportedProgress = progress;
        }
      }

      const finalResult = searcher.get_paginated_result(1, Number.MAX_SAFE_INTEGER);
      self.postMessage({type: 'done', matches: finalResult.lines});

    } catch (e) {
      console.error(`Worker cho file ${file.name} bị lỗi:`, e);
      self.postMessage({type: 'error', text: `Lỗi khi xử lý file ${file.name}.`});
    }
  }
};

