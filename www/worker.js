// worker.js

// Import Searcher và hàm init từ module WASM.
import init, {Searcher} from './pkg/ripgrep_lite_wasm.js';

// Biến toàn cục trong worker để giữ instance của Searcher
let searcher = null;

// Khởi tạo WASM ngay khi worker bắt đầu và báo hiệu sẵn sàng.
async function initWasm() {
  await init();
  console.log("Worker: Module WASM đã sẵn sàng.");
  self.postMessage({type: 'ready'});
}
initWasm().catch(console.error);


// Lắng nghe tin nhắn từ luồng chính (index.js)
self.onmessage = async (event) => {
  const {type, payload} = event.data;

  if (type === 'search') {
    const {files, pattern} = payload;
    // Hiện tại, để đơn giản hóa, chúng ta chỉ xử lý file đầu tiên
    const file = files[0];

    if (!file) {
      self.postMessage({type: 'error', text: 'Không tìm thấy file để xử lý.'});
      return;
    }

    try {
      // Tạo một instance Searcher mới cho mỗi lần tìm kiếm
      searcher = new Searcher(pattern);
    } catch (e) {
      self.postMessage({type: 'error', text: `Lỗi Pattern Regex: ${e}`});
      return;
    }

    self.postMessage({type: 'status', text: `Bắt đầu đọc stream file: ${file.name}...`});

    // Sử dụng ReadableStream và TextDecoderStream để đọc file hiệu quả
    const stream = file.stream();
    const reader = stream.pipeThrough(new TextDecoderStream()).getReader();

    const fileSize = file.size;
    let readBytes = 0;

    // Bắt đầu vòng lặp đọc stream
    while (true) {
      try {
        const {done, value} = await reader.read();
        if (done) {
          // Khi stream kết thúc, xử lý nốt phần còn lại trong buffer
          searcher.finish();
          break; // Thoát vòng lặp
        }

        // Gửi từng chunk dữ liệu cho lõi Rust xử lý
        searcher.process_chunk(value);

        // Gửi tiến độ về cho giao diện
        readBytes += value.length; // Lưu ý: đây là độ dài ký tự, không phải byte, nhưng đủ tốt cho việc hiển thị tiến độ.
        const progress = fileSize > 0 ? Math.round((readBytes / fileSize) * 100) : 0;
        // Chỉ gửi update mỗi 5% để tránh spam tin nhắn
        if (progress % 5 === 0) {
          self.postMessage({type: 'status', text: `Đang xử lý... ${progress}%`});
        }

      } catch (e) {
        self.postMessage({type: 'error', text: 'Lỗi khi đang đọc stream.'});
        console.error("Lỗi worker đọc stream:", e);
        return;
      }
    }

    // Sau khi tìm kiếm hoàn tất, gửi trang đầu tiên về
    self.postMessage({type: 'status', text: 'Hoàn tất tìm kiếm. Đang lấy trang đầu tiên...'});
    const result = searcher.get_paginated_result(1, payload.pageSize);
    self.postMessage({type: 'searchResult', result});

  } else if (type === 'getPage') {
    const {page, pageSize} = payload;

    if (!searcher) {
      self.postMessage({type: 'error', text: 'Chưa có tìm kiếm nào được thực hiện.'});
      return;
    }

    try {
      // Lấy trang được yêu cầu từ Searcher
      const result = searcher.get_paginated_result(page, pageSize);
      self.postMessage({type: 'pageResult', result});
    } catch (e) {
      self.postMessage({type: 'error', text: 'Lỗi khi lấy trang mới.'});
      console.error("Lỗi worker lấy trang:", e);
    }
  }
};

