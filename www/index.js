// index.js (Parallel Worker Manager Version - English)

// --- GLOBAL CONFIG & STATE ---
const PAGE_SIZE = 100; // Results per page
let currentPage = 1;
let totalMatches = 0;
let highlightRegex;
let allResultLines = []; // A large array to hold ALL results from workers

// Main function to initialize logic
function main() {
  const fileInput = document.getElementById('file-input');
  const patternInput = document.getElementById('pattern-input');
  const searchButton = document.getElementById('search-button');
  const statusDiv = document.getElementById('status');
  const fileListDiv = document.getElementById('file-list');
  const resultsContainer = document.getElementById('results-container');
  const paginationControls = document.getElementById('pagination-controls');

  // --- UI RENDERING FUNCTIONS ---

  // Renders a specific page of results from the `allResultLines` array
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
    resultsContainer.scrollTop = 0; // Always scroll to top on page change
  }

  // Creates the pagination control buttons
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
        renderPagination(); // Re-render pagination to update state
      }
    };

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.className = 'pagination-btn';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
      if (currentPage < totalPages) {
        renderResults(currentPage + 1);
        renderPagination(); // Re-render pagination to update state
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

    // Create an array of Promises, one for each worker processing a file
    const workerPromises = Array.from(files).map(file => {
      return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('worker.js', import.meta.url), {type: 'module'});

        worker.onmessage = (event) => {
          const {type, matches, text} = event.data;
          if (type === 'ready') {
            // Worker is ready, dispatch the job
            worker.postMessage({
              type: 'processFile',
              payload: {file, pattern}
            });
          } else if (type === 'done') {
            // Worker is done, return the result
            resolve(matches); // Fulfill this promise
            worker.terminate(); // Clean up the worker
          } else if (type === 'error') {
            reject(new Error(text)); // Report error
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
      // Wait for all workers to complete
      const resultsFromAllWorkers = await Promise.all(workerPromises);

      statusDiv.textContent = 'Aggregating results...';

      // --- FIX FOR RangeError ---
      // Aggregate results from all workers into one large array safely.
      // Instead of .push(...matches), which fails on large arrays,
      // we use a standard loop.
      for (const matches of resultsFromAllWorkers) {
        // This is a simple and safe way to concatenate large arrays.
        allResultLines = allResultLines.concat(matches);
      }
      totalMatches = allResultLines.length;

      // Display results
      if (totalMatches > 0) {
        renderResults(1); // Show the first page
        renderPagination();
        statusDiv.textContent = `Done! Found ${totalMatches} total matches.`;
      } else {
        statusDiv.textContent = 'No matches found.';
      }

    } catch (error) {
      console.error("Error during parallel processing:", error);
      statusDiv.textContent = 'An error occurred during processing.';
    }
  }

  searchButton.addEventListener('click', handleSearch);

  // Unchanged file input handler
  fileInput.addEventListener('change', () => {
    fileListDiv.innerHTML = '';
    if (files.length > 0) {
      statusDiv.textContent = `Selected ${files.length} files.`;
      for (const file of fileInput.files) {
        const fileTag = document.createElement('span');
        fileTag.className = 'file-item';
        fileTag.textContent = file.name;
        fileListDiv.appendChild(fileTag);
      }
    }
  });
}

// Start the application logic
main();

