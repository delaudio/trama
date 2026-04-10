use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};

const APP_DIR_NAME: &str = "trama";
const PROJECTS_DIR_NAME: &str = "projects";
const PROJECT_FILE_NAME: &str = "project.json";

#[derive(Serialize)]
struct AppHealth {
    product_name: String,
    data_dir: Option<String>,
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
    title: String,
    note: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct OutputItem {
    id: String,
    title: String,
    note: String,
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
    }
}

#[tauri::command]
fn list_projects() -> Result<Vec<ProjectRecord>, String> {
    let mut projects = read_all_projects()?;
    projects.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
    Ok(projects)
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

fn read_all_projects() -> Result<Vec<ProjectRecord>, String> {
    let projects_dir = projects_dir()?;

    if !projects_dir.exists() {
        fs::create_dir_all(&projects_dir).map_err(|error| error.to_string())?;
        return Ok(vec![]);
    }

    let mut projects = vec![];

    for entry in fs::read_dir(projects_dir).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path().join(PROJECT_FILE_NAME);

        if path.exists() {
            let contents = fs::read_to_string(path).map_err(|error| error.to_string())?;
            let project =
                serde_json::from_str::<ProjectRecord>(&contents).map_err(|error| error.to_string())?;
            projects.push(project);
        }
    }

    Ok(projects)
}

fn read_project(project_id: &str) -> Result<ProjectRecord, String> {
    let path = project_file(project_id)?;
    let contents = fs::read_to_string(path).map_err(|error| error.to_string())?;
    serde_json::from_str(&contents).map_err(|error| error.to_string())
}

fn write_project(project: &ProjectRecord) -> Result<(), String> {
    let project_dir = project_dir(&project.id)?;
    fs::create_dir_all(project_dir.join("moodboard")).map_err(|error| error.to_string())?;
    fs::create_dir_all(project_dir.join("outputs")).map_err(|error| error.to_string())?;

    let payload = serde_json::to_string_pretty(project).map_err(|error| error.to_string())?;
    fs::write(project_file(&project.id)?, payload).map_err(|error| error.to_string())
}

fn create_default_project(name: &str, template: &str) -> ProjectRecord {
    let now = iso_now();
    let id = slugify(&format!("{}-{}", name, unique_suffix()));

    ProjectRecord {
        id,
        name: name.into(),
        template: template.into(),
        created_at: now.clone(),
        updated_at: now,
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
                title: "Soft skin light".into(),
                note: "Neutral warmth, diffusion, elegant glow on cheekbones.".into(),
            },
            MoodboardItem {
                id: "mb-bottle-angle".into(),
                title: "Bottle angle".into(),
                note: "Slight top-left view with strong shadow discipline.".into(),
            },
            MoodboardItem {
                id: "mb-gold-cream".into(),
                title: "Gold and cream".into(),
                note: "Good palette for premium but soft campaign visuals.".into(),
            },
            MoodboardItem {
                id: "mb-charcoal-contrast".into(),
                title: "Contrast note".into(),
                note: "Useful accent for typography and pack contrast.".into(),
            },
        ],
        outputs: vec![
            OutputItem {
                id: "out-01".into(),
                title: "Campaign still 01".into(),
                note: "Most balanced lighting and product placement.".into(),
            },
            OutputItem {
                id: "out-02".into(),
                title: "Campaign still 02".into(),
                note: "More dramatic contrast, less suitable for print.".into(),
            },
        ],
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
    Ok(projects_dir()?.join(project_id))
}

fn project_file(project_id: &str) -> Result<PathBuf, String> {
    Ok(project_dir(project_id)?.join(PROJECT_FILE_NAME))
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
            delete_project
        ])
        .run(tauri::generate_context!())
        .expect("error while running trama application");
}
