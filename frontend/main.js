// main.js (Vite Version - Parallel Worker Manager - English - Progress Fix)

import './style.css'

// --- GLOBAL CONFIG & STATE ---
const PAGE_SIZE = 100; // Results per page
let currentPage = 1;
let totalMatches = 0;
let highlightRegex;
let allResultLines = []; // A large array to hold ALL results from workers

// Wait for CSS to be fully loaded
function waitForStyles() {
  return new Promise((resolve) => {
    // Check if TailwindCSS classes are applied
    const testElement = document.createElement('div');
    testElement.className = 'hidden';
    testElement.style.position = 'absolute';
    testElement.style.top = '-9999px';
    document.body.appendChild(testElement);
    
    const checkStyles = () => {
      const computed = window.getComputedStyle(testElement);
      if (computed.display === 'none') {
        document.body.removeChild(testElement);
        resolve();
      } else {
        requestAnimationFrame(checkStyles);
      }
    };
    
    // Start checking after a short delay
    setTimeout(checkStyles, 10);
  });
}

// Hide loading screen and show main content
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  const body = document.body;
  
  if (loadingScreen) {
    loadingScreen.style.opacity = '0';
    loadingScreen.style.transition = 'opacity 0.3s ease-out';
    
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      body.classList.remove('loading');
    }, 300);
  }
}

// Main function to initialize logic
async function main() {
  try {
    // Wait for styles to be loaded
    await waitForStyles();
    
    // Hide loading screen with smooth transition
    hideLoadingScreen();
    
    const fileInput = document.getElementById('file-input');
    const patternInput = document.getElementById('pattern-input');
    const searchButton = document.getElementById('search-button');
    const statusDiv = document.getElementById('status');
    const fileListDiv = document.getElementById('file-list');
    const resultsContainer = document.getElementById('results-container');
    const paginationControls = document.getElementById('pagination-controls');

    // THAY ĐỔI: Lấy tham chiếu đến các phần tử progress bar
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');

    // --- UI RENDERING FUNCTIONS ---

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
      resultsContainer.scrollTop = 0;
    }

    function renderPagination() {
      paginationControls.innerHTML = '';
      if (totalMatches === 0) return;
      const totalPages = Math.ceil(totalMatches / PAGE_SIZE);

      const pageInfo = document.createElement('span');
      pageInfo.className = 'text-sm text-gray-400';
      pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;

      const prevButton = document.createElement('button');
      prevButton.textContent = 'Previous';
      prevButton.className = 'pagination-btn';
      prevButton.disabled = currentPage === 1;
      prevButton.onclick = () => {
        if (currentPage > 1) {
          renderResults(currentPage - 1);
          renderPagination();
        }
      };

      const nextButton = document.createElement('button');
      nextButton.textContent = 'Next';
      nextButton.className = 'pagination-btn';
      nextButton.disabled = currentPage === totalPages;
      nextButton.onclick = () => {
        if (currentPage < totalPages) {
          renderResults(currentPage + 1);
          renderPagination();
        }
      };
      paginationControls.append(prevButton, pageInfo, nextButton);
    }

    // --- MAIN EVENT HANDLER ---
    async function handleSearch() {
      const files = fileInput.files;
      const pattern = patternInput.value;

      // Reset state and UI
      resultsContainer.innerHTML = '';
      paginationControls.innerHTML = '';
      allResultLines = [];
      totalMatches = 0;

      progressBar.style.width = '0%';
      progressContainer.classList.add('hidden');

      if (files.length === 0 || !pattern) {
        statusDiv.textContent = 'Error: Please select files and enter a pattern.';
        return;
      }

      try {
        highlightRegex = new RegExp(pattern, 'g');
      } catch (e) {
        statusDiv.textContent = 'Error: Invalid Regex pattern.';
        return;
      }

      statusDiv.textContent = `Initializing ${files.length} parallel worker threads...`;

      // --- SỬA LỖI & CẢI TIẾN ---
      // Sử dụng một mảng đơn giản để theo dõi tiến độ, ổn định hơn Map.
      const workerProgresses = Array(files.length).fill(0);
      progressContainer.classList.remove('hidden');

      function updateOverallProgress() {
        if (workerProgresses.length === 0) return;
        // Tính toán tiến độ trung bình của tất cả các worker
        const totalProgress = workerProgresses.reduce((sum, p) => sum + p, 0) / workerProgresses.length;
        progressBar.style.width = `${totalProgress}%`;
      }

      const workerPromises = Array.from(files).map((file, index) => { // Lấy index của file
        return new Promise((resolve, reject) => {
          // Sử dụng Vite's worker import
          const worker = new Worker(new URL('./worker.js', import.meta.url), {type: 'module'});

          worker.onmessage = (event) => {
            const {type, matches, text, progress} = event.data;

            if (type === 'ready') {
              worker.postMessage({
                type: 'processFile',
                payload: {file, pattern}
              });
            } else if (type === 'progress') {
              // Cập nhật tiến độ của worker tại đúng vị trí của nó trong mảng
              console.log(`Worker ${index} progress: ${progress}%`); // Thêm log để debug
              workerProgresses[index] = progress;
              updateOverallProgress();
            }
            else if (type === 'done') {
              workerProgresses[index] = 100; // Đảm bảo worker này đạt 100%
              updateOverallProgress();
              resolve(matches);
              worker.terminate();
            } else if (type === 'error') {
              reject(new Error(text));
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
        statusDiv.textContent = `Processing ${files.length} files in parallel...`;
        const resultsFromAllWorkers = await Promise.all(workerPromises);

        statusDiv.textContent = 'Aggregating results...';
        progressBar.style.width = '100%';

        for (const matches of resultsFromAllWorkers) {
          allResultLines = allResultLines.concat(matches);
        }
        totalMatches = allResultLines.length;

        if (totalMatches > 0) {
          renderResults(1);
          renderPagination();
          statusDiv.textContent = `Done! Found ${totalMatches} total matches.`;
        } else {
          statusDiv.textContent = 'No matches found.';
        }

      } catch (error) {
        console.error("Error during parallel processing:", error);
        statusDiv.textContent = 'An error occurred during processing.';
      } finally {
        setTimeout(() => {
          progressContainer.classList.add('hidden');
        }, 1000);
      }
    }

    searchButton.addEventListener('click', handleSearch);
    searchButton.addEventListener('keydown', (e) => {
      console.log(e.key);
      if (e.key === 'Enter') {
        handleSearch();
      }
    });

    fileInput.addEventListener('change', () => {
      fileListDiv.innerHTML = '';
      const files = fileInput.files;
      if (files.length > 0) {
        statusDiv.textContent = `Selected ${files.length} files.`;
        for (const file of files) {
          const fileTag = document.createElement('span');
          fileTag.className = 'file-item';
          fileTag.textContent = file.name;
          fileListDiv.appendChild(fileTag);
        }
      }
    });
    
  } catch (error) {
    console.error('Error initializing app:', error);
    hideLoadingScreen();
  }
}

// Initialize when DOM is loaded and styles are ready
document.addEventListener('DOMContentLoaded', main); 