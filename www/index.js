// index.js (Phiên bản Quản lý Worker Song song)

// --- CẤU HÌNH & TRẠNG THÁI TOÀN CỤC ---
const PAGE_SIZE = 100; // Hiển thị 100 kết quả mỗi trang
let currentPage = 1;
let totalMatches = 0;
let highlightRegex;
let allResultLines = []; // Mảng lớn chứa TẤT CẢ kết quả từ các worker

// Hàm chính để khởi động logic
function main() {
  const fileInput = document.getElementById('file-input');
  const patternInput = document.getElementById('pattern-input');
  const searchButton = document.getElementById('search-button');
  const statusDiv = document.getElementById('status');
  const fileListDiv = document.getElementById('file-list');
  const resultsContainer = document.getElementById('results-container');
  const paginationControls = document.getElementById('pagination-controls');

  // --- CÁC HÀM XỬ LÝ GIAO DIỆN ---

  // Hàm này render một trang kết quả cụ thể từ mảng `allResultLines`
  function renderResults(page) {
    resultsContainer.innerHTML = '';
    currentPage = page;

    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const linesToShow = allResultLines.slice(startIndex, endIndex);

    let html = '';
    linesToShow.forEach((line, index) => {
      const globalLineNumber = startIndex + index + 1;
      const highlightedContent = line.replace(highlightRegex, `<mark class="highlight">$&</mark>`);
      html += `<div class="result-line"><span class="line-number">${globalLineNumber}.</span><span class="line-content">${highlightedContent}</span></div>`;
    });
    resultsContainer.innerHTML = html;
    resultsContainer.scrollTop = 0; // Luôn cuộn lên đầu khi chuyển trang
  }

  // Hàm tạo các nút điều khiển phân trang
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
        renderResults(currentPage - 1);
        renderPagination(); // Cập nhật lại thanh phân trang
      }
    };

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Trang Tiếp';
    nextButton.className = 'pagination-btn';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
      if (currentPage < totalPages) {
        renderResults(currentPage + 1);
        renderPagination(); // Cập nhật lại thanh phân trang
      }
    };
    paginationControls.append(prevButton, pageInfo, nextButton);
  }

  // --- SỰ KIỆN CHÍNH (Đã được viết lại hoàn toàn) ---
  async function handleSearch() {
    const files = fileInput.files;
    const pattern = patternInput.value;

    // Reset trạng thái và giao diện
    resultsContainer.innerHTML = '';
    paginationControls.innerHTML = '';
    allResultLines = [];
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

    statusDiv.textContent = `Đang khởi tạo ${files.length} luồng xử lý song song...`;

    // Tạo một mảng các Promise, mỗi Promise tương ứng với một Worker xử lý một file
    const workerPromises = Array.from(files).map(file => {
      return new Promise((resolve, reject) => {
        // Tạo một Worker mới cho file này
        const worker = new Worker(new URL('worker.js', import.meta.url), {type: 'module'});

        // Lắng nghe tin nhắn từ worker
        worker.onmessage = (event) => {
          const {type, matches, text} = event.data;
          if (type === 'ready') {
            // Worker đã sẵn sàng, giao việc cho nó
            worker.postMessage({
              type: 'processFile',
              payload: {file, pattern}
            });
          } else if (type === 'done') {
            // Worker đã xử lý xong, trả về kết quả
            resolve(matches); // Hoàn thành Promise này
            worker.terminate(); // Dọn dẹp worker để giải phóng bộ nhớ
          } else if (type === 'error') {
            reject(new Error(text)); // Báo lỗi
            worker.terminate();
          }
        };

        worker.onerror = (error) => {
          reject(error);
          worker.terminate();
        };
      });
    });

    try {
      statusDiv.textContent = `Đang xử lý ${files.length} file song song...`;
      // Đợi tất cả các worker hoàn thành
      const resultsFromAllWorkers = await Promise.all(workerPromises);

      statusDiv.textContent = 'Đang gộp kết quả...';

      // Gộp kết quả từ tất cả các worker vào một mảng lớn duy nhất
      for (const matches of resultsFromAllWorkers) {
        allResultLines.push(...matches);
      }
      totalMatches = allResultLines.length;

      // Hiển thị kết quả
      if (totalMatches > 0) {
        renderResults(1); // Hiển thị trang đầu tiên
        renderPagination();
        statusDiv.textContent = `Hoàn tất! Tìm thấy tổng cộng ${totalMatches} dòng khớp.`;
      } else {
        statusDiv.textContent = 'Không tìm thấy kết quả nào.';
      }

    } catch (error) {
      console.error("Lỗi khi xử lý song song:", error);
      statusDiv.textContent = 'Đã có lỗi xảy ra trong quá trình xử lý.';
    }
  }

  searchButton.addEventListener('click', handleSearch);

  // Code xử lý file-input không thay đổi
  fileInput.addEventListener('change', () => {
    fileListDiv.innerHTML = '';
    if (files.length > 0) {
      statusDiv.textContent = `Đã chọn ${files.length} file.`;
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

