use serde::Serialize;

#[derive(Serialize)]
struct AppHealth {
    product_name: String,
    data_dir: Option<String>,
}

#[tauri::command]
fn app_health() -> AppHealth {
    AppHealth {
        product_name: "trama".into(),
        data_dir: dirs::data_local_dir().map(|path| path.display().to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![app_health])
        .run(tauri::generate_context!())
        .expect("error while running trama application");
}
