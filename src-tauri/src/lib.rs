use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

const APP_DIR_NAME: &str = "trama";
const PROJECTS_DIR_NAME: &str = "projects";
const PROJECT_FILE_NAME: &str = "project.json";

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AppHealth {
    product_name: String,
    data_dir: Option<String>,
    projects_dir: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct GraphPosition {
    x: f64,
    y: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct WorkflowNodeData {
    kind: String,
    label: String,
    description: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct WorkflowNode {
    id: String,
    #[serde(rename = "type")]
    node_type: String,
    position: GraphPosition,
    data: WorkflowNodeData,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct WorkflowEdge {
    id: String,
    source: String,
    target: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct GraphViewport {
    x: f64,
    y: f64,
    zoom: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ProjectGraph {
    nodes: Vec<WorkflowNode>,
    edges: Vec<WorkflowEdge>,
    viewport: GraphViewport,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct MoodboardItem {
    id: String,
    filename: String,
    path: String,
    title: String,
    note: String,
    created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct OutputItem {
    id: String,
    source_node_id: String,
    filename: String,
    path: String,
    title: String,
    note: String,
    created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct RuntimeOutputItem {
    id: String,
    node_id: String,
    title: String,
    note: String,
    preview_url: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct MoodboardImportFile {
    name: String,
    #[serde(rename = "type")]
    content_type: String,
    data_url: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ProjectSummary {
    id: String,
    name: String,
    template: String,
    created_at: String,
    updated_at: String,
    moodboard_count: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ProjectRecord {
    id: String,
    name: String,
    template: String,
    created_at: String,
    updated_at: String,
    moodboard_count: usize,
    graph: ProjectGraph,
    moodboard: Vec<MoodboardItem>,
    outputs: Vec<OutputItem>,
}

#[tauri::command]
fn app_health() -> AppHealth {
    AppHealth {
        product_name: "trama".into(),
        data_dir: app_data_dir().ok().map(|path| path.display().to_string()),
        projects_dir: projects_dir().ok().map(|path| path.display().to_string()),
    }
}

#[tauri::command]
fn list_projects() -> Result<Vec<ProjectSummary>, String> {
    let mut projects = read_all_projects()?;
    projects.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
    Ok(projects.iter().map(ProjectSummary::from).collect())
}

#[tauri::command]
fn load_project(project_id: String) -> Result<ProjectRecord, String> {
    read_project(&project_id)
}

#[tauri::command]
fn create_project(name: String, template: Option<String>) -> Result<ProjectRecord, String> {
    let name = name.trim();

    if name.is_empty() {
        return Err("Project name cannot be empty".into());
    }

    let project = create_default_project(name, template.as_deref().unwrap_or("beauty-campaign"));
    write_project(&project)?;
    Ok(project)
}

#[tauri::command]
fn save_project(project: ProjectRecord) -> Result<ProjectRecord, String> {
    let project = ProjectRecord {
        updated_at: iso_now(),
        moodboard_count: project.moodboard.len(),
        ..project
    };

    write_project(&project)?;
    Ok(project)
}

#[tauri::command]
fn rename_project(project_id: String, name: String) -> Result<ProjectRecord, String> {
    let mut project = read_project(&project_id)?;
    let name = name.trim();

    if name.is_empty() {
        return Err("Project name cannot be empty".into());
    }

    project.name = name.into();
    project.updated_at = iso_now();
    write_project(&project)?;
    Ok(project)
}

#[tauri::command]
fn delete_project(project_id: String) -> Result<(), String> {
    let project_dir = project_dir(&project_id)?;

    if project_dir.exists() {
        fs::remove_dir_all(project_dir).map_err(|error| error.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn import_moodboard_images(
    project_id: String,
    files: Vec<MoodboardImportFile>,
) -> Result<ProjectRecord, String> {
    if files.is_empty() {
        return read_project(&project_id);
    }

    let mut project = read_project(&project_id)?;
    let moodboard_dir = project_dir(&project_id)?.join("moodboard");
    fs::create_dir_all(&moodboard_dir).map_err(|error| error.to_string())?;

    let mut imported_items = Vec::with_capacity(files.len());

    for file in files {
        let extension = file_extension(&file.name, &file.content_type);
        let stored_name = format!("{}{}", unique_suffix(), extension);
        let stored_path = moodboard_dir.join(&stored_name);
        let bytes = decode_data_url(&file.data_url)?;

        fs::write(&stored_path, bytes).map_err(|error| error.to_string())?;

        imported_items.push(MoodboardItem {
            id: format!("mb-{}", unique_suffix()),
            filename: stored_name,
            path: stored_path.display().to_string(),
            title: title_from_filename(&file.name),
            note: String::new(),
            created_at: iso_now(),
        });
    }

    imported_items.append(&mut project.moodboard);
    project.moodboard = imported_items;
    project.moodboard_count = project.moodboard.len();
    project.updated_at = iso_now();
    write_project(&project)?;
    Ok(project)
}

#[tauri::command]
fn update_moodboard_item(project_id: String, item: MoodboardItem) -> Result<ProjectRecord, String> {
    let mut project = read_project(&project_id)?;

    let Some(index) = project.moodboard.iter().position(|entry| entry.id == item.id) else {
        return Err(format!("Moodboard item {} not found", item.id));
    };

    project.moodboard[index] = item;
    project.updated_at = iso_now();
    project.moodboard_count = project.moodboard.len();
    write_project(&project)?;
    Ok(project)
}

#[tauri::command]
fn delete_moodboard_item(
    project_id: String,
    moodboard_item_id: String,
) -> Result<ProjectRecord, String> {
    let mut project = read_project(&project_id)?;
    let Some(index) = project
        .moodboard
        .iter()
        .position(|item| item.id == moodboard_item_id)
    else {
        return Err(format!("Moodboard item {} not found", moodboard_item_id));
    };

    let item = project.moodboard.remove(index);

    if !item.path.is_empty() {
        let item_path = PathBuf::from(&item.path);
        if item_path.exists() {
            fs::remove_file(item_path).map_err(|error| error.to_string())?;
        }
    }

    project.updated_at = iso_now();
    project.moodboard_count = project.moodboard.len();
    write_project(&project)?;
    Ok(project)
}

#[tauri::command]
fn store_workflow_outputs(
    project_id: String,
    outputs: Vec<RuntimeOutputItem>,
) -> Result<ProjectRecord, String> {
    let mut project = read_project(&project_id)?;
    let outputs_dir = project_dir(&project_id)?.join("outputs");
    fs::create_dir_all(&outputs_dir).map_err(|error| error.to_string())?;

    let mut stored_outputs = Vec::with_capacity(outputs.len());

    for output in outputs {
        if output.preview_url.trim().is_empty() {
            continue;
        }

        let extension = output_extension(&output.preview_url);
        let filename = format!("{}{}", unique_suffix(), extension);
        let stored_path = outputs_dir.join(&filename);
        let bytes = read_output_source(&output.preview_url)?;

        fs::write(&stored_path, bytes).map_err(|error| error.to_string())?;

        stored_outputs.push(OutputItem {
            id: format!("out-{}", unique_suffix()),
            source_node_id: output.node_id,
            filename,
            path: stored_path.display().to_string(),
            title: output.title,
            note: output.note,
            created_at: iso_now(),
        });
    }

    let existing_outputs: Vec<OutputItem> = project
        .outputs
        .into_iter()
        .filter(|item| !item.path.is_empty())
        .collect();
    stored_outputs.extend(existing_outputs);
    project.outputs = stored_outputs;
    project.updated_at = iso_now();
    write_project(&project)?;
    Ok(project)
}

#[tauri::command]
fn export_output_files(project_id: String, output_ids: Vec<String>) -> Result<Vec<String>, String> {
    let project = read_project(&project_id)?;
    let export_dir = dirs::desktop_dir()
        .or_else(dirs::download_dir)
        .ok_or("Unable to resolve Desktop or Downloads directory")?;
    fs::create_dir_all(&export_dir).map_err(|error| error.to_string())?;

    let mut exported_paths = Vec::new();

    for item in project
        .outputs
        .iter()
        .filter(|item| output_ids.iter().any(|output_id| output_id == &item.id))
    {
        if item.path.is_empty() {
            continue;
        }

        let source_path = PathBuf::from(&item.path);
        if !source_path.exists() {
            continue;
        }

        let destination = export_destination(&export_dir, &item.filename);
        fs::copy(&source_path, &destination).map_err(|error| error.to_string())?;
        exported_paths.push(destination.display().to_string());
    }

    Ok(exported_paths)
}

fn read_all_projects() -> Result<Vec<ProjectRecord>, String> {
    read_all_projects_at(&projects_dir()?)
}

fn read_project(project_id: &str) -> Result<ProjectRecord, String> {
    read_project_at(&projects_dir()?, project_id)
}

fn write_project(project: &ProjectRecord) -> Result<(), String> {
    write_project_at(&projects_dir()?, project)
}

fn create_default_project(name: &str, template: &str) -> ProjectRecord {
    let now = iso_now();
    let id = slugify(&format!("{}-{}", name, unique_suffix()));

    ProjectRecord {
        id,
        name: name.into(),
        template: template.into(),
        created_at: now.clone(),
        updated_at: now.clone(),
        moodboard_count: 4,
        graph: ProjectGraph {
            nodes: vec![
                WorkflowNode {
                    id: "prompt".into(),
                    node_type: "workflowNode".into(),
                    position: GraphPosition { x: 60.0, y: 90.0 },
                    data: WorkflowNodeData {
                        kind: "prompt".into(),
                        label: "Prompt".into(),
                        description: "Campaign intent, color direction, skin finish.".into(),
                    },
                },
                WorkflowNode {
                    id: "reference".into(),
                    node_type: "workflowNode".into(),
                    position: GraphPosition { x: 60.0, y: 260.0 },
                    data: WorkflowNodeData {
                        kind: "reference-image".into(),
                        label: "Reference Image".into(),
                        description: "Bottle shot and art-direction reference.".into(),
                    },
                },
                WorkflowNode {
                    id: "remove-bg".into(),
                    node_type: "workflowNode".into(),
                    position: GraphPosition { x: 360.0, y: 260.0 },
                    data: WorkflowNodeData {
                        kind: "remove-background".into(),
                        label: "Remove Background".into(),
                        description: "Prepare cutout for placement and cleanup.".into(),
                    },
                },
                WorkflowNode {
                    id: "scene".into(),
                    node_type: "workflowNode".into(),
                    position: GraphPosition { x: 360.0, y: 90.0 },
                    data: WorkflowNodeData {
                        kind: "generate-scene".into(),
                        label: "Generate Scene".into(),
                        description: "Warm studio set with cosmetic campaign lighting.".into(),
                    },
                },
                WorkflowNode {
                    id: "place-product".into(),
                    node_type: "workflowNode".into(),
                    position: GraphPosition { x: 680.0, y: 170.0 },
                    data: WorkflowNodeData {
                        kind: "place-product".into(),
                        label: "Place Product".into(),
                        description: "Merge product and scene into a campaign still.".into(),
                    },
                },
                WorkflowNode {
                    id: "upscale".into(),
                    node_type: "workflowNode".into(),
                    position: GraphPosition { x: 980.0, y: 170.0 },
                    data: WorkflowNodeData {
                        kind: "upscale".into(),
                        label: "Upscale".into(),
                        description: "Prepare the selected output for review.".into(),
                    },
                },
            ],
            edges: vec![
                WorkflowEdge {
                    id: "e-prompt-scene".into(),
                    source: "prompt".into(),
                    target: "scene".into(),
                },
                WorkflowEdge {
                    id: "e-reference-remove-bg".into(),
                    source: "reference".into(),
                    target: "remove-bg".into(),
                },
                WorkflowEdge {
                    id: "e-scene-place".into(),
                    source: "scene".into(),
                    target: "place-product".into(),
                },
                WorkflowEdge {
                    id: "e-remove-bg-place".into(),
                    source: "remove-bg".into(),
                    target: "place-product".into(),
                },
                WorkflowEdge {
                    id: "e-place-upscale".into(),
                    source: "place-product".into(),
                    target: "upscale".into(),
                },
            ],
            viewport: GraphViewport {
                x: 0.0,
                y: 0.0,
                zoom: 0.85,
            },
        },
        moodboard: vec![
            MoodboardItem {
                id: "mb-soft-light".into(),
                filename: "soft-skin-light.jpg".into(),
                path: String::new(),
                title: "Soft skin light".into(),
                note: "Neutral warmth, diffusion, elegant glow on cheekbones.".into(),
                created_at: now.clone(),
            },
            MoodboardItem {
                id: "mb-bottle-angle".into(),
                filename: "bottle-angle.jpg".into(),
                path: String::new(),
                title: "Bottle angle".into(),
                note: "Slight top-left view with strong shadow discipline.".into(),
                created_at: now.clone(),
            },
            MoodboardItem {
                id: "mb-gold-cream".into(),
                filename: "gold-and-cream.jpg".into(),
                path: String::new(),
                title: "Gold and cream".into(),
                note: "Good palette for premium but soft campaign visuals.".into(),
                created_at: now.clone(),
            },
            MoodboardItem {
                id: "mb-charcoal-contrast".into(),
                filename: "contrast-note.jpg".into(),
                path: String::new(),
                title: "Contrast note".into(),
                note: "Useful accent for typography and pack contrast.".into(),
                created_at: now,
            },
        ],
        outputs: vec![],
    }
}

fn app_data_dir() -> Result<PathBuf, String> {
    let base_dir = dirs::data_local_dir().ok_or("Unable to resolve local app data directory")?;
    let path = base_dir.join(APP_DIR_NAME);
    fs::create_dir_all(&path).map_err(|error| error.to_string())?;
    Ok(path)
}

fn projects_dir() -> Result<PathBuf, String> {
    let path = app_data_dir()?.join(PROJECTS_DIR_NAME);
    fs::create_dir_all(&path).map_err(|error| error.to_string())?;
    Ok(path)
}

fn project_dir(project_id: &str) -> Result<PathBuf, String> {
    Ok(project_dir_at(&projects_dir()?, project_id))
}

fn project_file(project_id: &str) -> Result<PathBuf, String> {
    Ok(project_file_at(&projects_dir()?, project_id))
}

fn output_extension(source: &str) -> String {
    if source.starts_with("data:image/png") {
        return ".png".into();
    }

    if source.starts_with("data:image/jpeg") {
        return ".jpg".into();
    }

    let clean_source = source.split('?').next().unwrap_or(source);
    Path::new(clean_source)
        .extension()
        .map(|extension| format!(".{}", extension.to_string_lossy()))
        .unwrap_or_else(|| ".png".into())
}

fn read_output_source(source: &str) -> Result<Vec<u8>, String> {
    if source.starts_with("data:") {
        return decode_data_url(source);
    }

    if source.starts_with("http://") || source.starts_with("https://") {
        let response = reqwest::blocking::get(source).map_err(|error| error.to_string())?;
        let bytes = response.bytes().map_err(|error| error.to_string())?;
        return Ok(bytes.to_vec());
    }

    fs::read(source).map_err(|error| error.to_string())
}

fn export_destination(export_dir: &Path, filename: &str) -> PathBuf {
    let candidate = export_dir.join(filename);

    if !candidate.exists() {
        return candidate;
    }

    let stem = Path::new(filename)
        .file_stem()
        .map(|value| value.to_string_lossy().to_string())
        .unwrap_or_else(|| "output".into());
    let extension = Path::new(filename)
        .extension()
        .map(|value| format!(".{}", value.to_string_lossy()))
        .unwrap_or_default();

    export_dir.join(format!("{}-{}{}", stem, unique_suffix(), extension))
}

fn read_all_projects_at(projects_dir: &Path) -> Result<Vec<ProjectRecord>, String> {
    if !projects_dir.exists() {
        fs::create_dir_all(projects_dir).map_err(|error| error.to_string())?;
        return Ok(vec![]);
    }

    let mut projects = vec![];

    for entry in fs::read_dir(projects_dir).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path().join(PROJECT_FILE_NAME);

        if path.exists() {
            let contents = fs::read_to_string(path).map_err(|error| error.to_string())?;
            let project = serde_json::from_str::<ProjectRecord>(&contents)
                .map_err(|error| error.to_string())?;
            projects.push(project);
        }
    }

    Ok(projects)
}

fn read_project_at(projects_dir: &Path, project_id: &str) -> Result<ProjectRecord, String> {
    let path = project_file_at(projects_dir, project_id);
    let contents = fs::read_to_string(path).map_err(|error| error.to_string())?;
    serde_json::from_str(&contents).map_err(|error| error.to_string())
}

fn write_project_at(projects_dir: &Path, project: &ProjectRecord) -> Result<(), String> {
    let project_dir = project_dir_at(projects_dir, &project.id);
    fs::create_dir_all(project_dir.join("moodboard")).map_err(|error| error.to_string())?;
    fs::create_dir_all(project_dir.join("outputs")).map_err(|error| error.to_string())?;

    let payload = serde_json::to_string_pretty(project).map_err(|error| error.to_string())?;
    fs::write(project_file_at(projects_dir, &project.id), payload)
        .map_err(|error| error.to_string())
}

fn project_dir_at(projects_dir: &Path, project_id: &str) -> PathBuf {
    projects_dir.join(project_id)
}

fn project_file_at(projects_dir: &Path, project_id: &str) -> PathBuf {
    project_dir_at(projects_dir, project_id).join(PROJECT_FILE_NAME)
}

fn slugify(value: &str) -> String {
    let mut slug = String::new();
    let mut previous_dash = false;

    for character in value.chars() {
        if character.is_ascii_alphanumeric() {
            slug.push(character.to_ascii_lowercase());
            previous_dash = false;
        } else if !previous_dash {
            slug.push('-');
            previous_dash = true;
        }
    }

    slug.trim_matches('-').to_string()
}

fn title_from_filename(filename: &str) -> String {
    let stem = filename.rsplit_once('.').map(|(name, _)| name).unwrap_or(filename);
    stem.replace(['-', '_'], " ")
}

fn file_extension(filename: &str, content_type: &str) -> String {
    if let Some((_, extension)) = filename.rsplit_once('.') {
        return format!(".{}", extension.to_ascii_lowercase());
    }

    match content_type {
        "image/jpeg" => ".jpg".into(),
        "image/png" => ".png".into(),
        "image/webp" => ".webp".into(),
        "image/gif" => ".gif".into(),
        _ => ".bin".into(),
    }
}

fn decode_data_url(data_url: &str) -> Result<Vec<u8>, String> {
    let Some((metadata, payload)) = data_url.split_once(',') else {
        return Err("Invalid data URL".into());
    };

    if !metadata.ends_with(";base64") {
        return Err("Only base64 data URLs are supported".into());
    }

    BASE64_STANDARD
        .decode(payload)
        .map_err(|error| error.to_string())
}

fn unique_suffix() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| format!("{:x}", duration.as_millis()))
        .unwrap_or_else(|_| "trama".into())
}

fn iso_now() -> String {
    let milliseconds = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or(0);

    format!("{milliseconds}")
}

impl From<&ProjectRecord> for ProjectSummary {
    fn from(project: &ProjectRecord) -> Self {
        Self {
            id: project.id.clone(),
            name: project.name.clone(),
            template: project.template.clone(),
            created_at: project.created_at.clone(),
            updated_at: project.updated_at.clone(),
            moodboard_count: project.moodboard_count,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};

    static TEST_WORKSPACE_COUNTER: AtomicU64 = AtomicU64::new(0);

    struct TestWorkspace {
        root: PathBuf,
    }

    impl TestWorkspace {
        fn new() -> Self {
            let test_id = TEST_WORKSPACE_COUNTER.fetch_add(1, Ordering::Relaxed);
            let root = std::env::temp_dir().join(format!(
                "trama-persistence-{}-{test_id}",
                unique_suffix()
            ));
            fs::create_dir_all(&root).expect("create test workspace");
            Self { root }
        }

        fn projects_dir(&self) -> PathBuf {
            self.root.join(PROJECTS_DIR_NAME)
        }
    }

    impl Drop for TestWorkspace {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.root);
        }
    }

    #[test]
    fn write_project_creates_expected_project_layout() {
        let workspace = TestWorkspace::new();
        let projects_dir = workspace.projects_dir();
        let project = create_default_project("Persistence Check", "beauty-campaign");

        write_project_at(&projects_dir, &project).expect("write project");

        let project_dir = project_dir_at(&projects_dir, &project.id);
        assert!(project_file_at(&projects_dir, &project.id).exists());
        assert!(project_dir.join("moodboard").exists());
        assert!(project_dir.join("outputs").exists());

        let loaded = read_project_at(&projects_dir, &project.id).expect("read project");
        assert_eq!(loaded.id, project.id);
        assert_eq!(loaded.name, project.name);
        assert_eq!(loaded.template, project.template);
        assert_eq!(loaded.moodboard_count, project.moodboard_count);
    }

    #[test]
    fn read_all_projects_supports_summary_list_ordering() {
        let workspace = TestWorkspace::new();
        let projects_dir = workspace.projects_dir();
        let mut older = create_default_project("Older", "beauty-campaign");
        older.id = "older".into();
        older.updated_at = "100".into();
        older.created_at = "100".into();

        let mut newer = create_default_project("Newer", "beauty-campaign");
        newer.id = "newer".into();
        newer.updated_at = "200".into();
        newer.created_at = "200".into();

        write_project_at(&projects_dir, &older).expect("write older project");
        write_project_at(&projects_dir, &newer).expect("write newer project");

        let mut projects = read_all_projects_at(&projects_dir).expect("read all projects");
        projects.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));

        let summaries: Vec<ProjectSummary> = projects.iter().map(ProjectSummary::from).collect();

        assert_eq!(summaries.len(), 2);
        assert_eq!(summaries[0].id, "newer");
        assert_eq!(summaries[1].id, "older");
        assert_eq!(summaries[0].moodboard_count, newer.moodboard.len());
        assert_eq!(summaries[1].moodboard_count, older.moodboard.len());
    }

    #[test]
    fn delete_moodboard_item_removes_file_and_metadata() {
        let workspace = TestWorkspace::new();
        let projects_dir = workspace.projects_dir();
        let mut project = create_default_project("Moodboard Delete", "beauty-campaign");
        let image_path = project_dir_at(&projects_dir, &project.id)
            .join("moodboard")
            .join("delete-me.jpg");

        fs::create_dir_all(image_path.parent().expect("image parent"))
            .expect("create moodboard directory");
        fs::write(&image_path, [1_u8, 2, 3]).expect("write preview file");

        project.moodboard = vec![MoodboardItem {
            id: "mb-delete".into(),
            filename: "delete-me.jpg".into(),
            path: image_path.display().to_string(),
            title: "Delete Me".into(),
            note: String::new(),
            created_at: "100".into(),
        }];
        write_project_at(&projects_dir, &project).expect("write project");

        let deleted = delete_moodboard_item_at(&projects_dir, &project.id, "mb-delete")
            .expect("delete moodboard item");

        assert!(deleted.moodboard.is_empty());
        assert!(!image_path.exists());
    }
}

fn delete_moodboard_item_at(
    projects_dir: &Path,
    project_id: &str,
    moodboard_item_id: &str,
) -> Result<ProjectRecord, String> {
    let mut project = read_project_at(projects_dir, project_id)?;
    let Some(index) = project
        .moodboard
        .iter()
        .position(|item| item.id == moodboard_item_id)
    else {
        return Err(format!("Moodboard item {} not found", moodboard_item_id));
    };

    let item = project.moodboard.remove(index);

    if !item.path.is_empty() {
        let item_path = PathBuf::from(&item.path);
        if item_path.exists() {
            fs::remove_file(item_path).map_err(|error| error.to_string())?;
        }
    }

    project.updated_at = iso_now();
    project.moodboard_count = project.moodboard.len();
    write_project_at(projects_dir, &project)?;
    Ok(project)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            app_health,
            list_projects,
            load_project,
            create_project,
            save_project,
            rename_project,
            delete_project,
            import_moodboard_images,
            update_moodboard_item,
            delete_moodboard_item,
            store_workflow_outputs,
            export_output_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running trama application");
}
