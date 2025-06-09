// index.js

// --- CẤU HÌNH & TRẠNG THÁI TOÀN CỤC ---
const PAGE_SIZE = 100; // Hiển thị 100 kết quả mỗi trang
let currentPage = 1;
let totalMatches = 0;
let highlightRegex;
let searchWorker = null; // Biến để giữ worker

// Hàm chính để khởi động logic
function main() {
  // Không cần init WASM ở đây nữa, worker sẽ tự làm

  // Lấy tham chiếu đến các phần tử HTML
  const fileInput = document.getElementById('file-input');
  const patternInput = document.getElementById('pattern-input');
  const searchButton = document.getElementById('search-button');
  const statusDiv = document.getElementById('status');
  const fileListDiv = document.getElementById('file-list');
  const resultsContainer = document.getElementById('results-container');
  const paginationControls = document.getElementById('pagination-controls');

  // --- CÁC HÀM XỬ LÝ GIAO DIỆN ---

  function renderResults(lines) {
    resultsContainer.innerHTML = '';
    if (!lines || lines.length === 0) return;
    let html = '';
    lines.forEach((line, index) => {
      const globalLineNumber = (currentPage - 1) * PAGE_SIZE + index + 1;
      const highlightedContent = line.replace(highlightRegex, `<mark class="highlight">$&</mark>`);
      html += `<div class="result-line"><span class="line-number">${globalLineNumber}.</span><span class="line-content">${highlightedContent}</span></div>`;
    });
    resultsContainer.innerHTML = html;
    resultsContainer.scrollTop = 0;
  }

  function renderPagination() {
    paginationControls.innerHTML = '';
    if (totalMatches === 0) return;
    const totalPages = Math.ceil(totalMatches / PAGE_SIZE);

    const pageInfo = document.createElement('span');
    pageInfo.className = 'text-sm text-gray-400';
    pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Trang Trước';
    prevButton.className = 'pagination-btn';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
      if (currentPage > 1) {
        // Chỉ cần giảm trang và gọi hàm fetch, không cần tự tính toán
        fetchAndRenderPage(currentPage - 1);
      }
    };

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Trang Tiếp';
    nextButton.className = 'pagination-btn';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
      if (currentPage < totalPages) {
        // Chỉ cần tăng trang và gọi hàm fetch
        fetchAndRenderPage(currentPage + 1);
      }
    };
    paginationControls.append(prevButton, pageInfo, nextButton);
  }

  // Hàm này giờ chỉ gửi tin nhắn yêu cầu lấy trang mới cho worker
  function fetchAndRenderPage(page) {
    statusDiv.textContent = `Đang tải trang ${page}...`;
    if (searchWorker) {
      searchWorker.postMessage({
        type: 'getPage',
        payload: {page, pageSize: PAGE_SIZE}
      });
    }
  }

  // --- SỰ KIỆN CHÍNH ---

  // Hàm xử lý khi người dùng nhấn nút Search
  function handleSearch() {
    const files = fileInput.files;
    const pattern = patternInput.value;

    // Reset UI
    resultsContainer.innerHTML = '';
    paginationControls.innerHTML = '';
    totalMatches = 0;

    if (files.length === 0 || !pattern) {
      statusDiv.textContent = 'Lỗi: Vui lòng chọn file và nhập pattern.';
      return;
    }

    try {
      highlightRegex = new RegExp(pattern, 'g');
    } catch (e) {
      statusDiv.textContent = 'Lỗi: Pattern Regex không hợp lệ.';
      return;
    }

    // Nếu đã có worker cũ, hủy nó đi để bắt đầu tìm kiếm mới
    if (searchWorker) {
      searchWorker.terminate();
    }

    // Tạo một worker mới từ file worker.js
    searchWorker = new Worker(new URL('worker.js', import.meta.url), {type: 'module'});

    // Lắng nghe tin nhắn trả về từ worker
    searchWorker.onmessage = (event) => {
      const {type, result, text} = event.data;

      if (type === 'ready') {
        // Worker đã sẵn sàng, gửi yêu cầu tìm kiếm ban đầu
        statusDiv.textContent = 'Đang gửi yêu cầu xử lý...';
        const fileList = Array.from(files);
        // Gửi một mảng các đối tượng File. Worker sẽ tự đọc nội dung.
        searchWorker.postMessage({
          type: 'search',
          payload: {files: fileList, pattern: pattern, pageSize: PAGE_SIZE}
        });
      } else if (type === 'status') {
        statusDiv.textContent = text;
      } else if (type === 'searchResult' || type === 'pageResult') {
        // Nhận kết quả từ worker và cập nhật UI
        totalMatches = result.total_matches;
        currentPage = result.page;
        renderResults(result.lines);
        renderPagination();
        statusDiv.textContent = `Hiển thị ${result.lines.length} kết quả trên trang ${currentPage}. (Tổng cộng ${totalMatches} kết quả)`;
      } else if (type === 'error') {
        statusDiv.textContent = `Lỗi: ${text}`;
      }
    };

    // Xử lý lỗi từ worker
    searchWorker.onerror = (error) => {
      console.error("Lỗi Worker:", error);
      statusDiv.textContent = 'Đã xảy ra lỗi nghiêm trọng trong luồng xử lý nền.';
      if (searchWorker) {
        searchWorker.terminate();
        searchWorker = null;
      }
    };

  }

  searchButton.addEventListener('click', handleSearch);

  fileInput.addEventListener('change', () => {
    fileListDiv.innerHTML = '';
    if (fileInput.files.length > 0) {
      statusDiv.textContent = `Đã chọn ${fileInput.files.length} file.`;
      for (const file of fileInput.files) {
        const fileTag = document.createElement('span');
        fileTag.className = 'file-item';
        fileTag.textContent = file.name;
        fileListDiv.appendChild(fileTag);
      }
    }
  });
}

// Chạy hàm chính để khởi động ứng dụng
main();

