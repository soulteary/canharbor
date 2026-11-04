// SPDX-License-Identifier: AGPL-3.0-or-later
use serde_json::{Value, json};
use std::sync::OnceLock;
fn schema() -> &'static Value {
    static SCHEMA: OnceLock<Value> = OnceLock::new();
    SCHEMA
        .get_or_init(|| serde_json::from_str(include_str!("../../../../api/schema.json")).unwrap())
}
pub fn validator(name: &str) -> jsonschema::Validator {
    let root = schema();
    jsonschema::validator_for(&json!({"$schema":root["$schema"],"definitions":root["definitions"],"$ref":format!("#/definitions/{name}")})).unwrap()
}
pub fn validate(name: &str, value: &Value) {
    let v = validator(name);
    let errors = v
        .iter_errors(value)
        .map(|e| e.to_string())
        .collect::<Vec<_>>();
    assert!(errors.is_empty(), "{name}: {errors:?}; payload: {value}");
}
