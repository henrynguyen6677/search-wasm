// worker.js (Phiên bản được đơn giản hóa cho xử lý song song)

// Import Searcher và hàm init từ module WASM.
import init, {Searcher} from './pkg/ripgrep_lite_wasm.js';

// Khởi tạo WASM và báo hiệu sẵn sàng.
async function initWasm() {
  await init();
  self.postMessage({type: 'ready'});
}
initWasm().catch(error => {
  console.error("Worker: Lỗi khởi tạo WASM", error);
  self.postMessage({type: 'error', text: 'Không thể khởi tạo lõi xử lý.'});
});

// Lắng nghe tin nhắn từ luồng chính (chỉ một lần duy nhất)
self.onmessage = async (event) => {
  const {type, payload} = event.data;

  if (type === 'processFile') {
    const {file, pattern} = payload;

    try {
      // 1. Tạo một instance Searcher
      const searcher = new Searcher(pattern);

      // 2. Bắt đầu đọc stream file
      const stream = file.stream();
      const reader = stream.pipeThrough(new TextDecoderStream()).getReader();

      while (true) {
        const {done, value} = await reader.read();
        if (done) {
          searcher.finish();
          break;
        }
        searcher.process_chunk(value);
      }

      // 3. Sau khi xử lý xong, lấy toàn bộ kết quả (không phân trang ở đây)
      // và gửi về cho luồng chính để gộp lại.
      // Lõi Rust sẽ trả về một JsValue, nhưng nó thực chất là đối tượng PaginatedResult
      const finalResult = searcher.get_paginated_result(1, Number.MAX_SAFE_INTEGER);

      // Gửi toàn bộ danh sách các dòng khớp về
      self.postMessage({type: 'done', matches: finalResult.lines});

    } catch (e) {
      console.error(`Worker cho file ${file.name} bị lỗi:`, e);
      self.postMessage({type: 'error', text: `Lỗi khi xử lý file ${file.name}.`});
    }
  }
};

