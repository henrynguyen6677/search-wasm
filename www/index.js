// Import các hàm từ module WASM đã được wasm-pack biên dịch.
// Đường dẫn './pkg/...' là cấu trúc mặc định mà wasm-pack tạo ra.
import init, {search} from './pkg/ripgrep_lite_wasm.js';

// Hàm chính, bất đồng bộ để có thể sử dụng `await`
async function main() {
  console.log("Đang khởi tạo module WASM...");
  // Khởi tạo module WASM. Phải đợi bước này hoàn tất
  // trước khi có thể gọi bất kỳ hàm Rust nào.
  await init();
  console.log("Module WASM đã sẵn sàng.");

  // Lấy tham chiếu đến các phần tử trên trang HTML
  const fileInput = document.getElementById('file-input');
  const patternInput = document.getElementById('pattern-input');
  const searchButton = document.getElementById('search-button');
  const resultsOutput = document.getElementById('results-output');
  const statusDiv = document.getElementById('status');
  const fileListDiv = document.getElementById('file-list');

  // Cập nhật danh sách tên file mỗi khi người dùng chọn file mới
  fileInput.addEventListener('change', () => {
    fileListDiv.innerHTML = ''; // Xóa danh sách cũ
    if (fileInput.files.length > 0) {
      for (const file of fileInput.files) {
        const fileTag = document.createElement('span');
        fileTag.className = 'file-item';
        fileTag.textContent = file.name;
        fileListDiv.appendChild(fileTag);
      }
    }
  });

  // Gắn sự kiện `click` cho nút Search
  searchButton.addEventListener('click', async () => {
    // Lấy danh sách file và pattern từ input
    const files = fileInput.files;
    const pattern = patternInput.value;

    // Xóa kết quả cũ và cập nhật trạng thái
    resultsOutput.textContent = '';
    fileListDiv.innerHTML = '';


    // Kiểm tra đầu vào
    if (files.length === 0) {
      statusDiv.textContent = 'Lỗi: Vui lòng chọn ít nhất một file.';
      return;
    }
    if (!pattern) {
      statusDiv.textContent = 'Lỗi: Vui lòng nhập một pattern để tìm kiếm.';
      return;
    }

    statusDiv.textContent = `Đang chuẩn bị đọc ${files.length} file...`;

    // Sử dụng Promise.all để đọc tất cả các file một cách song song
    // Điều này hiệu quả hơn là đọc tuần tự từng file một.
    const fileReadPromises = Array.from(files).map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({name: file.name, content: reader.result});
        reader.onerror = (error) => reject(error);
        reader.readAsText(file); // Đọc file dưới dạng văn bản
      });
    });

    try {
      // Đợi cho đến khi tất cả các file đã được đọc xong
      const fileContents = await Promise.all(fileReadPromises);
      statusDiv.textContent = 'Đang tìm kiếm...';

      let allResults = [];
      let totalMatches = 0;

      // Dùng một khoảng trễ nhỏ để trình duyệt có thời gian cập nhật UI
      // trước khi thực hiện tác vụ nặng (tìm kiếm trong WASM)
      await new Promise(resolve => setTimeout(resolve, 50));

      // Lặp qua từng file đã đọc và thực hiện tìm kiếm
      for (const file of fileContents) {
        // Gọi hàm `search` từ Rust/WASM
        const matches = search(file.content, pattern);
        if (matches.length > 0) {
          // Thêm tiêu đề cho file có kết quả
          allResults.push(`\n--- Kết quả trong file: ${file.name} (${matches.length} dòng) ---\n`);
          allResults.push(...matches);
          totalMatches += matches.length;
        }
      }

      // Hiển thị kết quả
      resultsOutput.textContent = allResults.join('\n');
      statusDiv.textContent = `Hoàn tất! Tìm thấy tổng cộng ${totalMatches} dòng khớp trong ${fileContents.length} file.`;

    } catch (error) {
      console.error("Lỗi khi đọc file:", error);
      statusDiv.textContent = `Lỗi: Không thể đọc được file. Chi tiết trong console.`;
    }
  });
}

// Chạy hàm chính để khởi động ứng dụng
main().catch(console.error);

