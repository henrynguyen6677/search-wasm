mod utils;

use wasm_bindgen::prelude::*;
use regex::Regex;

// Macro `#[wasm_bindgen]` sẽ tạo ra các "cầu nối" cần thiết
// để hàm Rust này có thể được gọi từ JavaScript.
#[wasm_bindgen]
pub fn search(content: &str, pattern: &str) -> Vec<String> {
    // Cố gắng biên dịch pattern mà người dùng nhập vào thành một đối tượng Regex.
    // Regex::new có thể trả về lỗi nếu pattern không hợp lệ (ví dụ: `(` thiếu `)`).
    // Chúng ta xử lý lỗi này một cách an toàn bằng `match`.
    let re = match Regex::new(pattern) {
        Ok(re) => re, // Nếu thành công, gán đối tượng Regex cho biến `re`.
        Err(_) => return vec![], // Nếu lỗi, trả về một vector rỗng ngay lập tức.
    };

    // Tạo một vector rỗng để chứa các kết quả tìm thấy.
    let mut results = Vec::new();

    // Lặp qua từng dòng trong nội dung file được truyền vào.
    // Phương thức `.lines()` sẽ tự động tách chuỗi tại các ký tự xuống dòng.
    for line in content.lines() {
        // Sử dụng phương thức `.is_match()` của Regex để kiểm tra
        // xem dòng hiện tại có khớp với pattern đã biên dịch không.
        // Đây là cách làm hiệu quả hơn nhiều so với `line.contains()`.
        if re.is_match(line) {
            // Nếu khớp, thêm một bản sao của dòng đó (dưới dạng String)
            // vào vector kết quả.
            results.push(line.to_string());
        }
    }

    // Trả về vector chứa tất cả các dòng đã khớp.
    // wasm-bindgen sẽ tự động chuyển đổi `Vec<String>` của Rust
    // thành một Array chứa các string của JavaScript.
    results
}
