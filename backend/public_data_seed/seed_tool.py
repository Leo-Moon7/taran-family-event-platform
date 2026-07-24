"""BE-007 isolated, synthetic-first public-data seed validator.

This module never performs network or database I/O. It converts an already
approved JSONL input into an immutable local review bundle.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import sys
import time
import unicodedata
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


CONTRACT_VERSION = "BE-006-v1"
BUNDLE_VERSION = "BE-007-output-v1"
PARSER_VERSION = "be007-v1"
PORTAL_IDS = {"15154916", "15154897", "15155090"}
OUTPUT_NAMES = (
    "observations.accepted.jsonl",
    "observations.quarantined.jsonl",
    "candidates.draft.jsonl",
    "duplicate-signals.jsonl",
    "quality-summary.json",
    "errors.jsonl",
)
ALL_OUTPUT_NAMES = ("manifest-result.json",) + OUTPUT_NAMES
HASH_RE = re.compile(r"^[a-f0-9]{64}$")
BATCH_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{7,63}$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
SEMVER_RE = re.compile(r"^\d+\.\d+\.\d+$")
BUSINESS_NUMBER_VALUE_RE = re.compile(r"(?<!\d)\d{3}[- ]?\d{2}[- ]?\d{5}(?!\d)")
EMAIL_VALUE_RE = re.compile(r"(?i)(?<![\w.+-])[\w.+-]+@[\w-]+(?:\.[\w-]+)+(?![\w.-])")
PHONE_VALUE_RE = re.compile(r"(?<!\d)(?:01[016789]|0\d{1,2})[- ]?\d{3,4}[- ]?\d{4}(?!\d)")
PERSONAL_FIELD_HINTS = (
    "tel",
    "phone",
    "mobile",
    "email",
    "owner",
    "representative",
    "대표자",
    "영업자",
    "전화",
    "이메일",
)
BUSINESS_NUMBER_HINTS = (
    "businessnumber",
    "business_number",
    "businessregistration",
    "bizno",
    "brn",
    "사업자등록번호",
)
NAVER_HINTS = ("naver", "네이버")
REGISTRY_REQUIRED = {
    "registryId",
    "registryVersion",
    "contractVersion",
    "status",
    "validFrom",
    "validUntil",
    "reviewedAt",
    "reviewedBy",
    "approvalReference",
    "datasets",
}
DATASET_REQUIRED = {
    "datasetId",
    "portalDataId",
    "status",
    "terms",
    "sourceSchemaVersion",
    "sourceSchemaSha256",
    "recordPath",
    "fieldMap",
    "forbiddenPhysicalFields",
}
TERMS_REQUIRED = {
    "termsSnapshotId",
    "status",
    "decision",
    "validFrom",
    "validUntil",
    "reviewedAt",
    "reviewedBy",
    "officialUrl",
    "commercialUseAllowed",
    "derivativeAllowed",
}


def canonical_bytes(value: Any) -> bytes:
    """Canonical form for the contract's string/bool/int/null JSON subset."""

    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    ).encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def deterministic_id(*parts: Any) -> str:
    return sha256_bytes("\0".join("" if part is None else str(part) for part in parts).encode("utf-8"))


def normalize_text(value: Any) -> str:
    return " ".join(unicodedata.normalize("NFKC", str(value or "")).casefold().split())


def parse_datetime(value: Any, *, field: str) -> datetime:
    if not isinstance(value, str):
        raise ValueError(field)
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError(field)
    return parsed


def safe_relative_path(root: Path, relative: Any, *, must_exist: bool = True) -> Path:
    if not isinstance(relative, str) or not relative or Path(relative).is_absolute():
        raise BatchFatal("BE007_E_PATH_OUTSIDE_WORKDIR", "격리 작업 경로가 올바르지 않습니다.")
    pieces = Path(relative).parts
    if any(piece in {"", ".", ".."} for piece in pieces):
        raise BatchFatal("BE007_E_PATH_OUTSIDE_WORKDIR", "격리 작업 경로가 올바르지 않습니다.")
    root_resolved = root.resolve(strict=True)
    candidate = root_resolved.joinpath(*pieces)
    cursor = root_resolved
    for piece in pieces:
        cursor = cursor / piece
        if cursor.exists() and cursor.is_symlink():
            raise BatchFatal("BE007_E_PATH_OUTSIDE_WORKDIR", "심볼릭 링크 경로는 사용할 수 없습니다.")
    try:
        resolved = candidate.resolve(strict=must_exist)
        resolved.relative_to(root_resolved)
    except (FileNotFoundError, ValueError, OSError) as exc:
        raise BatchFatal("BE007_E_PATH_OUTSIDE_WORKDIR", "격리 작업 경로를 확인할 수 없습니다.") from exc
    return resolved


@dataclass
class BatchFatal(Exception):
    code: str
    safe_message: str


def make_error(
    fingerprint: str,
    batch_id: str,
    code: str,
    *,
    severity: str,
    priority: int,
    record_number: int | None = None,
    source_key: str | None = None,
    field: str | None = None,
    action: str,
    safe_message: str,
) -> dict[str, Any]:
    return {
        "batchId": batch_id,
        "errorId": deterministic_id(fingerprint, record_number, code, field),
        "recordNumber": record_number,
        "sourceRecordKey": source_key,
        "severity": severity,
        "priority": priority,
        "code": code,
        "safeMessage": safe_message,
        "field": field,
        "action": action,
        "relatedErrorIds": [],
    }


def write_json(path: Path, value: Any) -> None:
    path.write_bytes(json_bytes(value))


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.write_bytes(jsonl_bytes(rows))


def json_bytes(value: Any) -> bytes:
    return canonical_bytes(value) + b"\n"


def jsonl_bytes(rows: list[dict[str, Any]]) -> bytes:
    return b"".join(canonical_bytes(row) + b"\n" for row in rows)


def load_json(path: Path, *, code: str) -> Any:
    raw = path.read_bytes()
    if raw.startswith(b"\xef\xbb\xbf"):
        raise BatchFatal(code, "BOM 없는 UTF-8 JSON이 필요합니다.")
    try:
        return json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise BatchFatal(code, "JSON 형식이 올바르지 않습니다.") from exc


def require_keys(value: Any, keys: set[str], *, code: str) -> dict[str, Any]:
    if not isinstance(value, dict) or not keys.issubset(value):
        raise BatchFatal(code, "필수 계약 필드가 누락되었습니다.")
    return value


def validate_registry_schema_document(schema: Any) -> None:
    """Reject placeholder schemas and require the BE-006 contract skeleton."""

    if not isinstance(schema, dict):
        raise BatchFatal("BE007_E_REGISTRY_SCHEMA", "레지스트리 schema 형식이 올바르지 않습니다.")
    if (
        schema.get("$schema") != "https://json-schema.org/draft/2020-12/schema"
        or schema.get("type") != "object"
        or schema.get("additionalProperties") is not False
        or set(schema.get("required", [])) != REGISTRY_REQUIRED
        or not isinstance(schema.get("properties"), dict)
        or not REGISTRY_REQUIRED.issubset(schema["properties"])
        or not isinstance(schema.get("$defs"), dict)
    ):
        raise BatchFatal("BE007_E_REGISTRY_SCHEMA", "승인 registry JSON Schema 계약이 불완전합니다.")
    dataset_schema = schema["$defs"].get("dataset")
    field_map_schema = schema["$defs"].get("fieldMap")
    if (
        not isinstance(dataset_schema, dict)
        or dataset_schema.get("type") != "object"
        or dataset_schema.get("additionalProperties") is not False
        or set(dataset_schema.get("required", [])) != DATASET_REQUIRED
        or not isinstance(dataset_schema.get("properties"), dict)
        or not DATASET_REQUIRED.issubset(dataset_schema["properties"])
        or not isinstance(field_map_schema, dict)
        or field_map_schema.get("type") != "object"
        or field_map_schema.get("additionalProperties") is not False
        or set(field_map_schema.get("required", []))
        != {"physical", "logical", "required", "valueType"}
    ):
        raise BatchFatal("BE007_E_REGISTRY_SCHEMA", "dataset 또는 field map schema 계약이 불완전합니다.")


def validate_nonempty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate_http_url(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    parsed = urlparse(value)
    return parsed.scheme in {"https", "http"} and bool(parsed.netloc)


def validate_calendar_date(value: Any) -> bool:
    if not isinstance(value, str) or not DATE_RE.fullmatch(value):
        return False
    try:
        datetime.strptime(value, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def contains_business_number(value: Any) -> bool:
    return isinstance(value, str) and bool(BUSINESS_NUMBER_VALUE_RE.search(value))


def contains_personal_contact(value: Any) -> bool:
    return isinstance(value, str) and bool(
        EMAIL_VALUE_RE.search(value) or PHONE_VALUE_RE.search(value)
    )


def validate_registry(
    registry: Any,
    manifest: dict[str, Any],
    frozen_at: datetime,
    expected_hash: str,
    actual_hash: str,
) -> dict[str, Any]:
    if not HASH_RE.fullmatch(expected_hash):
        raise BatchFatal("BE007_E_REGISTRY_UNTRUSTED", "승인 레지스트리 해시 형식이 올바르지 않습니다.")
    registry_spec = require_keys(manifest.get("registry"), {"sha256", "schemaSha256"}, code="BE007_E_REGISTRY_SCHEMA")
    if expected_hash != registry_spec["sha256"] or expected_hash != actual_hash:
        raise BatchFatal("BE007_E_REGISTRY_UNTRUSTED", "승인 레지스트리 무결성을 확인할 수 없습니다.")
    top = require_keys(registry, REGISTRY_REQUIRED, code="BE007_E_REGISTRY_SCHEMA")
    if set(top) != REGISTRY_REQUIRED:
        raise BatchFatal("BE007_E_REGISTRY_SCHEMA", "레지스트리에 허용되지 않은 필드가 있습니다.")
    if (
        top["registryId"] != "sonpum-source-registry"
        or not isinstance(top["registryVersion"], str)
        or not SEMVER_RE.fullmatch(top["registryVersion"])
        or top["contractVersion"] != CONTRACT_VERSION
        or top["approvalReference"] != "D-23"
        or top["status"] != "approved"
        or not validate_nonempty_string(top["reviewedBy"])
    ):
        raise BatchFatal("BE007_E_REGISTRY_SCHEMA", "승인 레지스트리 필드가 계약과 다릅니다.")
    try:
        valid_from = parse_datetime(top["validFrom"], field="validFrom")
        valid_until = parse_datetime(top["validUntil"], field="validUntil")
        reviewed_at = parse_datetime(top["reviewedAt"], field="reviewedAt")
    except (ValueError, TypeError):
        raise BatchFatal("BE007_E_REGISTRY_SCHEMA", "레지스트리 날짜 형식이 올바르지 않습니다.")
    if not (reviewed_at <= valid_from <= frozen_at <= valid_until):
        raise BatchFatal("BE007_E_TERMS_MISSING_OR_EXPIRED", "승인 레지스트리의 유효기간이 지났습니다.")

    dataset_manifest = require_keys(
        manifest.get("dataset"),
        {"portalDataId", "datasetId", "termsSnapshotId", "sourceSchemaVersion", "sourceSchemaSha256"},
        code="BE007_E_SCHEMA_MISMATCH",
    )
    if dataset_manifest["portalDataId"] not in PORTAL_IDS:
        raise BatchFatal("BE007_E_DATASET_NOT_APPROVED", "승인되지 않은 공공데이터 식별자입니다.")
    datasets = top["datasets"]
    if not isinstance(datasets, list) or not datasets:
        raise BatchFatal("BE007_E_REGISTRY_SCHEMA", "dataset 목록 형식이 올바르지 않습니다.")
    if len({sha256_bytes(canonical_bytes(item)) for item in datasets}) != len(datasets):
        raise BatchFatal("BE007_E_REGISTRY_SCHEMA", "dataset 목록에 중복 항목이 있습니다.")
    matches = [
        item
        for item in datasets
        if isinstance(item, dict)
        and item.get("portalDataId") == dataset_manifest["portalDataId"]
        and item.get("datasetId") == dataset_manifest["datasetId"]
    ]
    if len(matches) != 1:
        raise BatchFatal("BE007_E_DATASET_NOT_APPROVED", "승인 dataset을 하나로 확인할 수 없습니다.")
    dataset = require_keys(matches[0], DATASET_REQUIRED, code="BE007_E_REGISTRY_SCHEMA")
    if set(dataset) != DATASET_REQUIRED:
        raise BatchFatal("BE007_E_REGISTRY_SCHEMA", "dataset에 허용되지 않은 필드가 있습니다.")
    if dataset["status"] != "approved":
        raise BatchFatal("BE007_E_DATASET_NOT_APPROVED", "승인된 dataset이 아닙니다.")
    if not all(
        validate_nonempty_string(dataset.get(field))
        for field in ("datasetId", "portalDataId", "sourceSchemaVersion", "recordPath")
    ):
        raise BatchFatal("BE007_E_REGISTRY_SCHEMA", "dataset 문자열 필드가 비어 있습니다.")
    if (
        dataset["sourceSchemaVersion"] != dataset_manifest["sourceSchemaVersion"]
        or dataset["sourceSchemaSha256"] != dataset_manifest["sourceSchemaSha256"]
        or not HASH_RE.fullmatch(str(dataset["sourceSchemaSha256"]))
    ):
        raise BatchFatal("BE007_E_SCHEMA_MISMATCH", "원천 스키마 버전 또는 해시가 다릅니다.")
    terms = require_keys(dataset["terms"], TERMS_REQUIRED, code="BE007_E_REGISTRY_SCHEMA")
    if set(terms) != TERMS_REQUIRED:
        raise BatchFatal("BE007_E_REGISTRY_SCHEMA", "이용조건에 허용되지 않은 필드가 있습니다.")
    if (
        not validate_nonempty_string(terms["termsSnapshotId"])
        or not validate_nonempty_string(terms["reviewedBy"])
        or not validate_http_url(terms["officialUrl"])
        or not isinstance(terms["commercialUseAllowed"], bool)
        or not isinstance(terms["derivativeAllowed"], bool)
    ):
        raise BatchFatal("BE007_E_REGISTRY_SCHEMA", "이용조건 필드가 계약과 다릅니다.")
    try:
        terms_from = parse_datetime(terms["validFrom"], field="terms.validFrom")
        terms_until = parse_datetime(terms["validUntil"], field="terms.validUntil")
        terms_reviewed = parse_datetime(terms["reviewedAt"], field="terms.reviewedAt")
    except (ValueError, TypeError):
        raise BatchFatal("BE007_E_REGISTRY_SCHEMA", "이용조건 날짜 형식이 올바르지 않습니다.")
    if (
        terms.get("termsSnapshotId") != dataset_manifest["termsSnapshotId"]
        or terms.get("status") != "approved"
        or terms.get("decision") != "approved"
        or terms.get("commercialUseAllowed") is not True
        or terms.get("derivativeAllowed") is not True
        or not (terms_reviewed <= terms_from <= frozen_at <= terms_until)
    ):
        raise BatchFatal("BE007_E_TERMS_MISSING_OR_EXPIRED", "승인된 유효 이용조건을 확인할 수 없습니다.")
    field_map = dataset["fieldMap"]
    if not isinstance(field_map, list) or not field_map:
        raise BatchFatal("BE007_E_REGISTRY_SCHEMA", "원천 필드 매핑이 없습니다.")
    physical: set[str] = set()
    logical: set[str] = set()
    for item in field_map:
        row = require_keys(item, {"physical", "logical", "required", "valueType"}, code="BE007_E_REGISTRY_SCHEMA")
        if set(row) != {"physical", "logical", "required", "valueType"}:
            raise BatchFatal("BE007_E_REGISTRY_SCHEMA", "원천 필드 매핑에 허용되지 않은 값이 있습니다.")
        if (
            not validate_nonempty_string(row["physical"])
            or not validate_nonempty_string(row["logical"])
            or not isinstance(row["required"], bool)
        ):
            raise BatchFatal("BE007_E_REGISTRY_SCHEMA", "원천 필드 매핑 값이 올바르지 않습니다.")
        if row["physical"] in physical or row["logical"] in logical:
            raise BatchFatal("BE007_E_REGISTRY_SCHEMA", "원천 필드 매핑이 중복되었습니다.")
        if row["valueType"] not in {"string", "date", "datetime"}:
            raise BatchFatal("BE007_E_REGISTRY_SCHEMA", "지원하지 않는 필드 형식입니다.")
        physical.add(row["physical"])
        logical.add(row["logical"])
    if (
        not isinstance(dataset["forbiddenPhysicalFields"], list)
        or any(not validate_nonempty_string(item) for item in dataset["forbiddenPhysicalFields"])
        or len(set(dataset["forbiddenPhysicalFields"])) != len(dataset["forbiddenPhysicalFields"])
    ):
        raise BatchFatal("BE007_E_REGISTRY_SCHEMA", "금지 필드 목록 형식이 올바르지 않습니다.")
    return dataset


def validate_manifest(manifest: Any, root: Path) -> tuple[dict[str, Any], datetime]:
    required = {
        "contractVersion",
        "batchId",
        "clock",
        "registry",
        "dataset",
        "input",
        "output",
        "parserVersion",
        "createdAt",
        "purpose",
        "dryRun",
    }
    manifest = require_keys(manifest, required, code="BE007_E_CONTRACT_VERSION")
    if manifest["contractVersion"] != CONTRACT_VERSION or manifest["parserVersion"] != PARSER_VERSION:
        raise BatchFatal("BE007_E_CONTRACT_VERSION", "지원하지 않는 계약 또는 parser 버전입니다.")
    if not BATCH_RE.fullmatch(str(manifest["batchId"])):
        raise BatchFatal("BE007_E_PATH_OUTSIDE_WORKDIR", "batch ID 형식이 올바르지 않습니다.")
    if manifest["purpose"] != "discovery" or manifest["dryRun"] is not True:
        raise BatchFatal("BE007_E_NOT_DRY_RUN", "dry-run discovery 배치만 실행할 수 있습니다.")
    clock = require_keys(manifest["clock"], {"timezone", "frozenAt"}, code="BE007_E_CLOCK")
    try:
        frozen = parse_datetime(clock["frozenAt"], field="clock.frozenAt")
    except (ValueError, TypeError):
        raise BatchFatal("BE007_E_CLOCK", "고정 시각 형식이 올바르지 않습니다.")
    if clock["timezone"] != "Asia/Seoul" or frozen.utcoffset().total_seconds() != 9 * 3600:
        raise BatchFatal("BE007_E_CLOCK", "Asia/Seoul +09:00 고정 시각이 필요합니다.")
    input_spec = require_keys(
        manifest["input"],
        {"path", "sha256", "recordEncoding", "lineEnding", "sourceAsOf"},
        code="BE007_E_SCHEMA_MISMATCH",
    )
    if (
        input_spec["recordEncoding"] != "utf-8"
        or input_spec["lineEnding"] != "lf"
        or not HASH_RE.fullmatch(str(input_spec["sha256"]))
        or not validate_calendar_date(input_spec["sourceAsOf"])
    ):
        raise BatchFatal("BE007_E_SCHEMA_MISMATCH", "입력 파일 계약이 올바르지 않습니다.")
    output_spec = require_keys(
        manifest["output"], {"runsRoot", "expectedBundleVersion"}, code="BE007_E_SCHEMA_MISMATCH"
    )
    if output_spec["expectedBundleVersion"] != BUNDLE_VERSION:
        raise BatchFatal("BE007_E_SCHEMA_MISMATCH", "출력 bundle 버전이 다릅니다.")
    safe_relative_path(root, output_spec["runsRoot"], must_exist=False)
    return manifest, frozen


def batch_fingerprint(manifest: dict[str, Any]) -> str:
    value = {
        "contractVersion": manifest["contractVersion"],
        "batchId": manifest["batchId"],
        "registrySha256": manifest["registry"]["sha256"],
        "registrySchemaSha256": manifest["registry"]["schemaSha256"],
        "datasetId": manifest["dataset"]["datasetId"],
        "termsSnapshotId": manifest["dataset"]["termsSnapshotId"],
        "sourceSchemaSha256": manifest["dataset"]["sourceSchemaSha256"],
        "inputSha256": manifest["input"]["sha256"],
        "parserVersion": manifest["parserVersion"],
        "frozenAt": manifest["clock"]["frozenAt"],
    }
    return sha256_bytes(canonical_bytes(value))


def validate_existing_bundle(
    final_dir: Path, fingerprint: str, manifest: dict[str, Any]
) -> bool:
    try:
        files = {path.name for path in final_dir.iterdir() if path.is_file()}
        if files != set(ALL_OUTPUT_NAMES):
            return False
        manifest_path = final_dir / "manifest-result.json"
        manifest_result = json.loads(manifest_path.read_text(encoding="utf-8"))
        output_items = manifest_result.get("outputFiles")
        if not isinstance(output_items, list) or len(output_items) != len(OUTPUT_NAMES):
            return False
        if {item.get("name") for item in output_items if isinstance(item, dict)} != set(OUTPUT_NAMES):
            return False
        actual_output_files: list[dict[str, Any]] = []
        for item in output_items:
            if not isinstance(item, dict) or set(item) != {"name", "sha256", "recordCount"}:
                return False
            path = final_dir / item["name"]
            raw = path.read_bytes()
            record_count = len(raw.splitlines()) if item["name"].endswith(".jsonl") else 1
            actual = {
                "name": item["name"],
                "sha256": sha256_bytes(raw),
                "recordCount": record_count,
            }
            if actual != item:
                return False
            actual_output_files.append(actual)
        quality = json.loads((final_dir / "quality-summary.json").read_text(encoding="utf-8"))
        counts = quality.get("counts")
        reconciliation = quality.get("reconciliation")
        if (
            not isinstance(counts, dict)
            or not isinstance(reconciliation, dict)
            or reconciliation.get("passed") is not True
            or reconciliation.get("outputHashesMatchManifest") is not True
            or manifest_result.get("counts") != counts
            or manifest_result.get("reconciliationPassed") is not True
            or manifest_result.get("safeExitCode") != 0
            or manifest_result.get("status") not in {"succeeded", "anomaly"}
            or manifest_result.get("batchFingerprint") != fingerprint
            or quality.get("batchFingerprint") != fingerprint
        ):
            return False
        expected_manifest = {
            "bundleVersion": BUNDLE_VERSION,
            "contractVersion": CONTRACT_VERSION,
            "batchId": manifest["batchId"],
            "batchFingerprint": fingerprint,
            "status": manifest_result["status"],
            "frozenAt": manifest["clock"]["frozenAt"],
            "registrySha256": manifest["registry"]["sha256"],
            "registrySchemaSha256": manifest["registry"]["schemaSha256"],
            "sourceSchemaSha256": manifest["dataset"]["sourceSchemaSha256"],
            "inputSha256": manifest["input"]["sha256"],
            "outputFiles": actual_output_files,
            "counts": counts,
            "reconciliationPassed": True,
            "safeExitCode": 0,
        }
        return manifest_path.read_bytes() == canonical_bytes(expected_manifest) + b"\n"
    except (OSError, KeyError, TypeError, json.JSONDecodeError):
        return False


def has_hint(value: str, hints: tuple[str, ...]) -> bool:
    folded = normalize_text(value).replace(" ", "")
    return any(hint.replace(" ", "") in folded for hint in hints)


def validate_value(value: Any, value_type: str) -> bool:
    if value is None:
        return True
    if not isinstance(value, str):
        return False
    if value_type == "string":
        return True
    if value_type == "date":
        if not DATE_RE.fullmatch(value):
            return False
        try:
            datetime.strptime(value, "%Y-%m-%d")
            return True
        except ValueError:
            return False
    if value_type == "datetime":
        try:
            parse_datetime(value, field="value")
            return True
        except (ValueError, TypeError):
            return False
    return False


def run_batch(workspace_root: Path, manifest_relative: str, expected_registry_sha256: str) -> dict[str, Any]:
    started = time.time()
    root = workspace_root.resolve(strict=True)
    manifest_path = safe_relative_path(root, manifest_relative)
    manifest, frozen_at = validate_manifest(load_json(manifest_path, code="BE007_E_CONTRACT_VERSION"), root)
    registry_spec = require_keys(
        manifest["registry"], {"path", "schemaPath", "sha256", "schemaSha256"}, code="BE007_E_REGISTRY_SCHEMA"
    )
    registry_path = safe_relative_path(root, registry_spec["path"])
    registry_schema_path = safe_relative_path(root, registry_spec["schemaPath"])
    registry = load_json(registry_path, code="BE007_E_REGISTRY_SCHEMA")
    schema = load_json(registry_schema_path, code="BE007_E_REGISTRY_SCHEMA")
    validate_registry_schema_document(schema)
    actual_schema_hash = sha256_bytes(canonical_bytes(schema))
    if registry_spec["schemaSha256"] != actual_schema_hash:
        raise BatchFatal("BE007_E_REGISTRY_UNTRUSTED", "레지스트리 schema 무결성을 확인할 수 없습니다.")
    actual_registry_hash = sha256_bytes(canonical_bytes(registry))
    dataset = validate_registry(registry, manifest, frozen_at, expected_registry_sha256, actual_registry_hash)
    input_path = safe_relative_path(root, manifest["input"]["path"])
    input_bytes = input_path.read_bytes()
    if input_bytes.startswith(b"\xef\xbb\xbf") or b"\r" in input_bytes:
        raise BatchFatal("BE007_E_SCHEMA_MISMATCH", "입력은 BOM 없는 UTF-8 LF JSONL이어야 합니다.")
    if sha256_bytes(input_bytes) != manifest["input"]["sha256"]:
        raise BatchFatal("BE007_E_INPUT_HASH", "입력 파일 무결성을 확인할 수 없습니다.")

    fingerprint = batch_fingerprint(manifest)
    runs_root = safe_relative_path(root, manifest["output"]["runsRoot"], must_exist=False)
    runs_root.mkdir(parents=True, exist_ok=True)
    final_dir = runs_root / manifest["batchId"]

    field_map = {item["physical"]: item for item in dataset["fieldMap"]}
    required_fields = {item["physical"] for item in dataset["fieldMap"] if item["required"]}
    forbidden = {normalize_text(item).replace(" ", "") for item in dataset["forbiddenPhysicalFields"]}
    accepted: list[dict[str, Any]] = []
    quarantined: list[dict[str, Any]] = []
    candidates: list[dict[str, Any]] = []
    duplicates: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []
    parsed_records: list[tuple[int, dict[str, Any], str, str | None, str]] = []
    lines = input_bytes.splitlines()
    if any(not line.strip() for line in lines):
        raise BatchFatal("BE007_E_SCHEMA_MISMATCH", "빈 JSONL 행은 허용하지 않습니다.")
    for index, raw_line in enumerate(lines, start=1):
        try:
            record = json.loads(raw_line.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            record = None
        if not isinstance(record, dict):
            error = make_error(
                fingerprint,
                manifest["batchId"],
                "BE007_E_SCHEMA_MISMATCH",
                severity="quarantine",
                priority=200,
                record_number=index,
                action="quarantine_record",
                safe_message="JSON object 형식이 아닌 행을 격리했습니다.",
            )
            errors.append(error)
            quarantined.append(
                {
                    "batchId": manifest["batchId"],
                    "recordNumber": index,
                    "observationId": deterministic_id(fingerprint, index, "invalid"),
                    "datasetId": dataset["datasetId"],
                    "portalDataId": dataset["portalDataId"],
                    "sourceRecordKey": None,
                    "sourceRecordFingerprint": sha256_bytes(raw_line),
                    "state": "quarantined",
                    "safeFieldNames": [],
                    "errorRefs": [error["errorId"]],
                    "rawValuesIncluded": False,
                }
            )
            continue
        for key in record:
            if has_hint(key, BUSINESS_NUMBER_HINTS):
                raise BatchFatal("BE007_E_BUSINESS_NUMBER", "사업자번호 계열 필드는 배치 입력에서 금지됩니다.")
            if has_hint(key, NAVER_HINTS):
                raise BatchFatal("BE007_E_LEGACY_NAVER_SOURCE", "NAVER 계열 원천은 이 배치에서 사용할 수 없습니다.")
        if any(
            isinstance(value, str) and has_hint(value, NAVER_HINTS)
            for value in record.values()
        ):
            raise BatchFatal("BE007_E_LEGACY_NAVER_SOURCE", "NAVER lineage가 포함된 배치는 사용할 수 없습니다.")
        if any(contains_business_number(key) for key in record) or any(
            contains_business_number(value) for value in record.values()
        ):
            raise BatchFatal("BE007_E_BUSINESS_NUMBER", "사업자번호 형식의 값은 배치 입력에서 금지됩니다.")
        record_hash = sha256_bytes(canonical_bytes(record))
        source_key = str(record.get("MGTNO") or "").strip() or None
        personal_value_fields = sorted(
            key
            for key, value in record.items()
            if contains_personal_contact(key) or contains_personal_contact(value)
        )
        safe_source_key = (
            None if contains_personal_contact(source_key) or contains_business_number(source_key) else source_key
        )
        offending = sorted(set(record) - set(field_map))
        personal = sorted(
            key
            for key in record
            if has_hint(key, PERSONAL_FIELD_HINTS)
            or normalize_text(key).replace(" ", "") in forbidden
        )
        personal = sorted(set(personal) | set(personal_value_fields))
        invalid_dates = sorted(
            key
            for key, value in record.items()
            if key in field_map and not validate_value(value, field_map[key]["valueType"])
        )
        missing = sorted(
            key for key in required_fields if not isinstance(record.get(key), str) or not record.get(key).strip()
        )
        row_errors: list[dict[str, Any]] = []
        if offending:
            row_errors.append(
                make_error(
                    fingerprint,
                    manifest["batchId"],
                    "BE007_E_FIELD_NOT_ALLOWED",
                    severity="quarantine",
                    priority=200,
                    record_number=index,
                    source_key=safe_source_key,
                    field="unapprovedField",
                    action="quarantine_record",
                    safe_message="허용 목록에 없는 필드가 있어 행을 격리했습니다.",
                )
            )
        if personal:
            row_errors.append(
                make_error(
                    fingerprint,
                    manifest["batchId"],
                    "BE007_E_PERSONAL_DATA",
                    severity="quarantine",
                    priority=200,
                    record_number=index,
                    source_key=safe_source_key,
                    field="sensitiveField",
                    action="quarantine_record",
                    safe_message="개인정보 가능성이 있는 필드가 있어 행을 격리했습니다.",
                )
            )
        if invalid_dates:
            row_errors.append(
                make_error(
                    fingerprint,
                    manifest["batchId"],
                    "BE007_E_DATE_INVALID",
                    severity="quarantine",
                    priority=200,
                    record_number=index,
                    source_key=safe_source_key,
                    field=invalid_dates[0],
                    action="quarantine_record",
                    safe_message="날짜 또는 시각 형식이 올바르지 않아 행을 격리했습니다.",
                )
            )
        if missing:
            row_errors.append(
                make_error(
                    fingerprint,
                    manifest["batchId"],
                    "BE007_E_SOURCE_KEY_MISSING",
                    severity="quarantine",
                    priority=200,
                    record_number=index,
                    source_key=safe_source_key,
                    field=missing[0],
                    action="quarantine_record",
                    safe_message="필수 원천 식별 필드가 없어 행을 격리했습니다.",
                )
            )
        observation_id = deterministic_id(dataset["datasetId"], source_key, record_hash, index)
        if row_errors:
            errors.extend(row_errors)
            quarantined.append(
                {
                    "batchId": manifest["batchId"],
                    "recordNumber": index,
                    "observationId": observation_id,
                    "datasetId": dataset["datasetId"],
                    "portalDataId": dataset["portalDataId"],
                    "sourceRecordKey": safe_source_key,
                    "sourceRecordFingerprint": record_hash,
                    "state": "quarantined",
                    "safeFieldNames": sorted(
                        {
                            key if key in field_map and not contains_personal_contact(key) else "unapprovedField"
                            for key in record
                        }
                    ),
                    "errorRefs": [item["errorId"] for item in row_errors],
                    "rawValuesIncluded": False,
                }
            )
            continue
        mapped = {
            spec["logical"]: record.get(physical)
            for physical, spec in field_map.items()
            if physical in record
        }
        parsed_records.append((index, mapped, observation_id, source_key, record_hash))

    by_key: dict[str, list[tuple[int, dict[str, Any], str, str | None, str]]] = {}
    for row in parsed_records:
        by_key.setdefault(row[3] or "", []).append(row)
    rejected_ids: set[str] = set()
    for source_key, group in by_key.items():
        if len(group) < 2:
            continue
        unique_hashes = {row[4] for row in group}
        if len(unique_hashes) == 1:
            first = group[0]
            for row in group[1:]:
                rejected_ids.add(row[2])
                error = make_error(
                    fingerprint,
                    manifest["batchId"],
                    "BE007_W_DUPLICATE_IDENTICAL",
                    severity="quarantine",
                    priority=200,
                    record_number=row[0],
                    source_key=source_key,
                    action="quarantine_record",
                    safe_message="동일한 원천 키와 내용이 중복되어 뒤 행을 격리했습니다.",
                )
                errors.append(error)
                quarantined.append(
                    {
                        "batchId": manifest["batchId"],
                        "recordNumber": row[0],
                        "observationId": row[2],
                        "datasetId": dataset["datasetId"],
                        "portalDataId": dataset["portalDataId"],
                        "sourceRecordKey": source_key,
                        "sourceRecordFingerprint": row[4],
                        "state": "quarantined",
                        "safeFieldNames": sorted(row[1]),
                        "errorRefs": [error["errorId"]],
                        "rawValuesIncluded": False,
                    }
                )
                left, right = sorted((first[2], row[2]))
                duplicates.append(
                    {
                        "batchId": manifest["batchId"],
                        "signalId": deterministic_id(fingerprint, left, right, "same_key_same_payload"),
                        "leftObservationId": left,
                        "rightObservationId": right,
                        "leftSourceRecordKey": source_key,
                        "rightSourceRecordKey": source_key,
                        "signalType": "same_key_same_payload",
                        "strength": "exact",
                        "decision": "review_only",
                        "automaticMerge": False,
                        "reasonCodes": ["BE007_W_DUPLICATE_IDENTICAL"],
                    }
                )
        else:
            for row in group:
                rejected_ids.add(row[2])
                error = make_error(
                    fingerprint,
                    manifest["batchId"],
                    "BE007_E_DUPLICATE_SOURCE_KEY_CONFLICT",
                    severity="quarantine",
                    priority=200,
                    record_number=row[0],
                    source_key=source_key,
                    action="quarantine_record",
                    safe_message="동일 원천 키의 내용이 충돌하여 관련 행을 격리했습니다.",
                )
                errors.append(error)
                quarantined.append(
                    {
                        "batchId": manifest["batchId"],
                        "recordNumber": row[0],
                        "observationId": row[2],
                        "datasetId": dataset["datasetId"],
                        "portalDataId": dataset["portalDataId"],
                        "sourceRecordKey": source_key,
                        "sourceRecordFingerprint": row[4],
                        "state": "quarantined",
                        "safeFieldNames": sorted(row[1]),
                        "errorRefs": [error["errorId"]],
                        "rawValuesIncluded": False,
                    }
                )
            for left_row, right_row in zip(group, group[1:]):
                left, right = sorted((left_row[2], right_row[2]))
                duplicates.append(
                    {
                        "batchId": manifest["batchId"],
                        "signalId": deterministic_id(fingerprint, left, right, "same_key_conflict"),
                        "leftObservationId": left,
                        "rightObservationId": right,
                        "leftSourceRecordKey": source_key,
                        "rightSourceRecordKey": source_key,
                        "signalType": "same_key_conflict",
                        "strength": "exact",
                        "decision": "review_only",
                        "automaticMerge": False,
                        "reasonCodes": ["BE007_E_DUPLICATE_SOURCE_KEY_CONFLICT"],
                    }
                )

    for index, mapped, observation_id, source_key, record_hash in parsed_records:
        if observation_id in rejected_ids:
            continue
        missing_logical = sorted(spec["logical"] for spec in field_map.values() if spec["logical"] not in mapped)
        accepted.append(
            {
                "batchId": manifest["batchId"],
                "recordNumber": index,
                "observationId": observation_id,
                "datasetId": dataset["datasetId"],
                "portalDataId": dataset["portalDataId"],
                "termsSnapshotId": dataset["terms"]["termsSnapshotId"],
                "sourceRecordKey": source_key,
                "sourceRecordFingerprint": record_hash,
                "sourceAsOf": manifest["input"]["sourceAsOf"],
                "observedAt": manifest["clock"]["frozenAt"],
                "mappedFields": mapped,
                "missingLogicalFields": missing_logical,
                "state": "accepted",
                "warningCodes": [],
            }
        )
        address = mapped.get("roadAddress") or mapped.get("jibunAddress") or ""
        candidate_id = deterministic_id(dataset["datasetId"], source_key, record_hash)
        candidates.append(
            {
                "batchId": manifest["batchId"],
                "candidateId": candidate_id,
                "observationId": observation_id,
                "sourceRecordKey": source_key,
                "normalizedName": normalize_text(mapped.get("businessName")),
                "normalizedAddress": normalize_text(address),
                "providerKindSignal": mapped.get("industryName") or "unknown",
                "administrativeSignal": mapped.get("administrativeStatusName") or "unknown",
                "eventFitSignal": "unknown",
                "candidateState": "match_pending",
                "sourceReference": {
                    "portalDataId": dataset["portalDataId"],
                    "datasetId": dataset["datasetId"],
                    "termsSnapshotId": dataset["terms"]["termsSnapshotId"],
                },
                "sourceAsOf": manifest["input"]["sourceAsOf"],
                "observedAt": manifest["clock"]["frozenAt"],
                "missingFields": missing_logical,
                "warnings": [],
            }
        )

    for left_index, left in enumerate(candidates):
        for right in candidates[left_index + 1 :]:
            if left["sourceRecordKey"] == right["sourceRecordKey"]:
                continue
            if left["normalizedName"] and left["normalizedName"] == right["normalizedName"]:
                same_address = (
                    left["normalizedAddress"]
                    and left["normalizedAddress"] == right["normalizedAddress"]
                )
                left_obs, right_obs = sorted((left["observationId"], right["observationId"]))
                signal_type = "normalized_name_address" if same_address else "normalized_name_only"
                duplicates.append(
                    {
                        "batchId": manifest["batchId"],
                        "signalId": deterministic_id(fingerprint, left_obs, right_obs, signal_type),
                        "leftObservationId": left_obs,
                        "rightObservationId": right_obs,
                        "leftSourceRecordKey": left["sourceRecordKey"],
                        "rightSourceRecordKey": right["sourceRecordKey"],
                        "signalType": signal_type,
                        "strength": "strong" if same_address else "weak",
                        "decision": "review_only",
                        "automaticMerge": False,
                        "reasonCodes": [signal_type.upper()],
                    }
                )

    status = "succeeded"
    anomalies: list[str] = []
    if not lines:
        status = "anomaly"
        anomalies.append("BE007_E_EMPTY_BATCH_ANOMALY")
        errors.append(
            make_error(
                fingerprint,
                manifest["batchId"],
                "BE007_E_EMPTY_BATCH_ANOMALY",
                severity="warning",
                priority=100,
                action="continue",
                safe_message="빈 배치는 폐업 또는 삭제 근거로 사용하지 않습니다.",
            )
        )
    errors.sort(
        key=lambda item: (
            -item["priority"],
            item["recordNumber"] is None,
            item["recordNumber"] or 0,
            item["code"],
            item["field"] or "",
        )
    )
    duplicates.sort(key=lambda item: (item["leftObservationId"], item["rightObservationId"], item["signalType"]))
    counts = {
        "input": len(lines),
        "scanned": len(lines),
        "accepted": len(accepted),
        "quarantined": len(quarantined),
        "candidates": len(candidates),
        "duplicateSignals": len(duplicates),
        "errors": len(errors),
        "warnings": sum(item["severity"] == "warning" for item in errors),
        "fatalErrors": sum(item["severity"] == "fatal" for item in errors),
    }
    reconciliation = {
        "scannedEqualsAcceptedPlusQuarantined": counts["scanned"]
        == counts["accepted"] + counts["quarantined"],
        "candidatesEqualsAccepted": counts["candidates"] == counts["accepted"],
        "allQuarantinesHaveErrorRef": all(item["errorRefs"] for item in quarantined),
        "outputHashesMatchManifest": True,
        "passed": False,
    }
    reconciliation["passed"] = all(
        value for key, value in reconciliation.items() if key != "passed"
    )
    if not reconciliation["passed"]:
        raise BatchFatal("BE007_E_RECONCILIATION", "출력 합계 대사가 일치하지 않습니다.")
    by_error: dict[str, int] = {}
    for item in errors:
        by_error[item["code"]] = by_error.get(item["code"], 0) + 1
    by_missing: dict[str, int] = {}
    for item in accepted:
        for field in item["missingLogicalFields"]:
            by_missing[field] = by_missing.get(field, 0) + 1
    by_admin: dict[str, int] = {}
    for item in candidates:
        value = item["administrativeSignal"]
        by_admin[value] = by_admin.get(value, 0) + 1
    duplicate_breakdown: dict[str, int] = {}
    for item in duplicates:
        duplicate_breakdown[item["signalType"]] = duplicate_breakdown.get(item["signalType"], 0) + 1
    quality = {
        "bundleVersion": BUNDLE_VERSION,
        "batchId": manifest["batchId"],
        "batchFingerprint": fingerprint,
        "counts": counts,
        "byErrorCode": by_error,
        "byMissingLogicalField": by_missing,
        "byAdministrativeSignal": by_admin,
        "duplicateBreakdown": duplicate_breakdown,
        "reconciliation": reconciliation,
        "anomalies": anomalies,
        "generatedAt": manifest["clock"]["frozenAt"],
    }

    expected_payloads = {
        "observations.accepted.jsonl": jsonl_bytes(accepted),
        "observations.quarantined.jsonl": jsonl_bytes(quarantined),
        "candidates.draft.jsonl": jsonl_bytes(candidates),
        "duplicate-signals.jsonl": jsonl_bytes(duplicates),
        "quality-summary.json": json_bytes(quality),
        "errors.jsonl": jsonl_bytes(errors),
    }
    output_files = [
        {
            "name": name,
            "sha256": sha256_bytes(expected_payloads[name]),
            "recordCount": len(expected_payloads[name].splitlines()) if name.endswith(".jsonl") else 1,
        }
        for name in OUTPUT_NAMES
    ]
    result_manifest = {
        "bundleVersion": BUNDLE_VERSION,
        "contractVersion": CONTRACT_VERSION,
        "batchId": manifest["batchId"],
        "batchFingerprint": fingerprint,
        "status": status,
        "frozenAt": manifest["clock"]["frozenAt"],
        "registrySha256": manifest["registry"]["sha256"],
        "registrySchemaSha256": manifest["registry"]["schemaSha256"],
        "sourceSchemaSha256": manifest["dataset"]["sourceSchemaSha256"],
        "inputSha256": manifest["input"]["sha256"],
        "outputFiles": output_files,
        "counts": counts,
        "reconciliationPassed": reconciliation["passed"],
        "safeExitCode": 0,
    }
    expected_bundle = {"manifest-result.json": json_bytes(result_manifest), **expected_payloads}
    if final_dir.exists():
        try:
            actual_names = {path.name for path in final_dir.iterdir() if path.is_file()}
            unchanged = actual_names == set(ALL_OUTPUT_NAMES) and all(
                (final_dir / name).read_bytes() == payload
                for name, payload in expected_bundle.items()
            )
        except OSError:
            unchanged = False
        if not unchanged:
            raise BatchFatal("BE007_E_OUTPUT_COLLISION", "기존 결과가 원래 입력의 기대 bundle과 다릅니다.")
        elapsed = max(0, int((time.time() - started) * 1000))
        return {
            "batchId": manifest["batchId"],
            "batchFingerprint": fingerprint,
            "bundlePath": str(final_dir.relative_to(root)).replace("\\", "/"),
            "bundleStatus": status,
            "reused": True,
            "startedAt": "runtime-only",
            "finishedAt": "runtime-only",
            "durationMs": elapsed,
            "safeExitCode": 0,
        }

    temp_dir = runs_root / f".{manifest['batchId']}.{fingerprint}.tmp"
    if temp_dir.exists():
        raise BatchFatal("BE007_E_OUTPUT_COLLISION", "임시 출력 경로가 이미 존재합니다.")
    temp_dir.mkdir()
    try:
        for name, payload in expected_bundle.items():
            (temp_dir / name).write_bytes(payload)
        os.replace(temp_dir, final_dir)
    except Exception:
        if temp_dir.exists():
            shutil.rmtree(temp_dir)
        raise
    elapsed = max(0, int((time.time() - started) * 1000))
    return {
        "batchId": manifest["batchId"],
        "batchFingerprint": fingerprint,
        "bundlePath": str(final_dir.relative_to(root)).replace("\\", "/"),
        "bundleStatus": status,
        "reused": False,
        "startedAt": "runtime-only",
        "finishedAt": "runtime-only",
        "durationMs": elapsed,
        "safeExitCode": 0,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="손품해방 공공데이터 비공개 후보 seed dry-run 도구")
    parser.add_argument("--workspace-root", required=True)
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--expected-registry-sha256", required=True)
    args = parser.parse_args(argv)
    try:
        response = run_batch(
            Path(args.workspace_root),
            args.manifest,
            args.expected_registry_sha256,
        )
        print(json.dumps(response, ensure_ascii=False, sort_keys=True))
        return int(response["safeExitCode"])
    except BatchFatal as exc:
        safe = {
            "severity": "fatal",
            "code": exc.code,
            "safeMessage": exc.safe_message,
            "action": "stop_batch",
            "safeExitCode": 2,
        }
        print(json.dumps(safe, ensure_ascii=False, sort_keys=True), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
