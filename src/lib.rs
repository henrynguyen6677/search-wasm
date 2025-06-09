mod utils;

use wasm_bindgen::prelude::*;
use regex::Regex;
use serde::Serialize;

// Định nghĩa một struct để chứa kết quả đã được phân trang.
// Struct này cung cấp đầy đủ thông tin để giao diện có thể hiển thị thanh phân trang.
#[derive(Serialize)]
pub struct PaginatedResult {
    total_matches: usize, // Tổng số dòng khớp trên toàn bộ nội dung
    page: usize,          // Trang hiện tại (1-based)
    page_size: usize,     // Kích thước của trang
    lines: Vec<String>,   // Các dòng kết quả chỉ cho trang này
}

// Struct Searcher có trạng thái, được thiết kế để xử lý stream
#[wasm_bindgen]
pub struct Searcher {
    pattern: Regex,
    matches: Vec<String>,
    buffer: String, // Bộ đệm để xử lý các dòng bị ngắt quãng giữa các chunk
}

#[wasm_bindgen]
impl Searcher {
    // Hàm khởi tạo, được gọi một lần khi bắt đầu tìm kiếm
    #[wasm_bindgen(constructor)]
    pub fn new(pattern_str: &str) -> Result<Searcher, JsValue> {
        let pattern = Regex::new(pattern_str)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(Searcher {
            pattern,
            matches: Vec::new(),
            buffer: String::new(),
        })
    }

    // Hàm này sẽ được gọi liên tục với từng chunk dữ liệu từ stream
    pub fn process_chunk(&mut self, chunk: &str) {
        // Nối chunk mới vào phần dữ liệu còn thừa từ chunk trước
        self.buffer.push_str(chunk);

        // Tìm vị trí xuống dòng cuối cùng trong buffer
        let mut last_newline_index = None;
        for (i, c) in self.buffer.char_indices().rev() {
            if c == '\n' {
                last_newline_index = Some(i);
                break;
            }
        }

        if let Some(index) = last_newline_index {
            // Chỉ xử lý các dòng đã hoàn chỉnh
            let processable_part = &self.buffer[..index];
            for line in processable_part.lines() {
                if self.pattern.is_match(line) {
                    self.matches.push(line.to_string());
                }
            }
            // Giữ lại phần chưa hoàn chỉnh (sau dấu xuống dòng cuối cùng) cho chunk tiếp theo
            self.buffer = self.buffer[index + 1..].to_string();
        }
    }
    
    // Được gọi khi stream kết thúc để xử lý nốt phần dữ liệu còn lại trong buffer
    pub fn finish(&mut self) {
        if !self.buffer.is_empty() {
            if self.pattern.is_match(&self.buffer) {
                self.matches.push(self.buffer.clone());
            }
            self.buffer.clear();
        }
    }

    // Trả về kết quả đã phân trang từ danh sách các kết quả đã tìm thấy
    pub fn get_paginated_result(&self, page: usize, page_size: usize) -> Result<JsValue, JsValue> {
        if page_size == 0 || page == 0 {
            return Err(JsValue::from_str("Page và page_size phải lớn hơn 0."));
        }

        let start_index = (page - 1) * page_size;
        
        let paginated_lines: Vec<String> = self.matches
            .iter()
            .skip(start_index)
            .take(page_size)
            .cloned() // Sao chép các dòng để tạo Vec mới
            .collect();
            
        let result = PaginatedResult {
            total_matches: self.matches.len(),
            page,
            page_size,
            lines: paginated_lines,
        };

        serde_wasm_bindgen::to_value(&result).map_err(|e| e.into())
    }
}
